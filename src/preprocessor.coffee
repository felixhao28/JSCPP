prepast = require("./prepast")
PEGUtil = require("pegjs-util")

Preprocessor = (rt) ->

  pushInc = (b) ->
    self.doinclude.push self.doinclude[self.doinclude.length - 1] and b
    return

  @rt = rt
  @ret = ""
  @macros = {}
  @macroStack = []
  @doinclude = [ true ]
  self = this
  @visitors =
    TranslationUnit: (interp, s, code) ->
      i = 0
      while i < s.lines.length
        dec = s.lines[i]
        interp.visit dec, code
        interp.ret += dec.space
        i++
      interp.ret
    Code: (interp, s, code) ->
      if interp.doinclude[interp.doinclude.length - 1]
        i = 0
        while i < s.val.length
          x = interp.work(s.val[i])
          interp.ret += x
          i++
      return
    PrepSimpleMacro: (interp, s, code) ->
      interp.newMacro s.Identifier, s.Replacement
      return
    PrepFunctionMacro: (interp, s, code) ->
      interp.newMacroFunction s.Identifier, s.Args, s.Replacement
      return
    PrepIncludeLib: (interp, s, code) ->
      interp.rt.include s.name
      return
    PrepIncludeLocal: (interp, s, code) ->
      includes = interp.rt.config.includes
      if s.name of includes
        includes[s.name].load interp.rt
      else
        interp.rt.raiseException "cannot find file: " + s.name
      return
    PrepUndef: (interp, s, code) ->
      if interp.isMacroDefined(s.Identifier)
        delete interp.macros[s.Identifier.val]
      return
    PrepIfdef: (interp, s, code) ->
      pushInc interp.isMacroDefined(s.Identifier)
      return
    PrepIfndef: (interp, s, code) ->
      pushInc !interp.isMacroDefined(s.Identifier)
      return
    PrepElse: (interp, s, code) ->
      if interp.doinclude.length > 1
        x = interp.doinclude.pop()
        pushInc !x
      else
        interp.rt.raiseException "#else must be used after a #if"
      return
    PrepEndif: (interp, s, code) ->
      if interp.doinclude.length > 1
        interp.doinclude.pop()
      else
        interp.rt.raiseException "#endif must be used after a #if"
      return
    unknown: (interp, s, code) ->
      interp.rt.raiseException "unhandled syntax " + s.type
      return
  return

Preprocessor::visit = (s, code) ->
  if "type" of s
    _node = @currentNode
    @currentNode = s
    if s.type of @visitors
      return @visitors[s.type](this, s, code)
    else
      return @visitors["unknown"](this, s, code)
    @currentNode = _node
  else
    @currentNode = s
    @rt.raiseException "untyped syntax structure: " + JSON.stringify(s)
  return

Preprocessor::isMacroDefined = (node) ->
  if node.type == "Identifier"
    node.val of @macros
  else
    node.Identifier.val of @macros

Preprocessor::isMacro = (node) ->
  @isMacroDefined(node) and "val" of node and @macros[node.val].type == "simple"

Preprocessor::isMacroFunction = (node) ->
  @isMacroDefined(node) and "Identifier" of node and @macros[node.Identifier.val].type == "function"

Preprocessor::newMacro = (id, replacement) ->
  if @isMacroDefined(id)
    @rt.raiseException "macro " + id.val + " is already defined"
  @macros[id.val] =
    type: "simple"
    replacement: replacement
  return

Preprocessor::newMacroFunction = (id, args, replacement) ->
  if @isMacroDefined(id)
    @rt.raiseException "macro " + id.val + " is already defined"
  @macros[id.val] =
    type: "function"
    args: args
    replacement: replacement
  return

Preprocessor::work = (node) ->
  if node.type == "Seperator"
    return node.val + node.space
  else
    if node of @macroStack
      @rt.raiseException "recursive macro detected"
    @macroStack.push node
    if node.type == "Identifier"
      return @replaceMacro(node) + node.space
    else if node.type == "PrepFunctionMacroCall"
      return @replaceMacroFunction(node)
    @macroStack.pop()
  return

Preprocessor::replaceMacro = (id) ->
  if @isMacro(id)
    ret = ""
    rep = @macros[id.val].replacement
    i = 0
    while i < rep.length
      v = @work(rep[i])
      ret += v
      i++
    ret
  else
    id.val

Preprocessor::replaceMacroFunction = (node) ->
  if @isMacroFunction(node)
    name = node.Identifier.val
    argsText = node.Args
    rep = @macros[name].replacement
    args = @macros[name].args
    if args.length == argsText.length
      ret = ""
      i = 0
      while i < rep.length
        if rep[i].type == "Seperator"
          v = @work(rep[i])
          ret += v
        else
          argi = -1
          j = 0
          while j < args.length
            if rep[i].type == "Identifier" and args[j].val == rep[i].val
              argi = j
              break
            j++
          if argi >= 0
            v = ""
            j = 0
            while j < argsText[argi].length
              v += @work(argsText[argi][j])
              j++
            ret += v + rep[i].space
          else
            v = @work(rep[i])
            ret += v
        i++
      return ret
    else
      @rt.raiseException "macro " + name + " requires " + args.length + " arguments (" + argsText.length + " given)"
  else
    argsText = node.Args
    v = []
    i = 0
    while i < argsText.length
      x = ""
      j = 0
      while j < argsText[i].length
        x += @work(argsText[i][j])
        j++
      v.push x
      i++
    return node.Identifier.val + "(" + v.join(",") + ")" + node.space
  return

Preprocessor::parse = (code) ->
  result = PEGUtil.parse(prepast, code)
  if result.error?
    throw "ERROR: Preprocessing Failure:\n" + PEGUtil.errorMessage(result.error, true)
  @rt.interp = this
  @visit result.ast, code

module.exports = parse: (rt, code) ->
  new Preprocessor(rt).parse code