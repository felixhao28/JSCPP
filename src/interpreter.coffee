sampleGeneratorFunction = ->
  yield null

sampleGenerator = sampleGeneratorFunction()

isGenerator = (g) ->
  g?.constructor is sampleGenerator.constructor

isGeneratorFunction = (f) ->
  f?.constructor is sampleGeneratorFunction.constructor

Interpreter = (rt) ->
  @rt = rt
  @visitors =
    TranslationUnit: (interp, s, param) ->
      rt = interp.rt
      i = 0
      while i < s.ExternalDeclarations.length
        dec = s.ExternalDeclarations[i]
        yield from interp.visit interp, dec
        i++
      return
    DirectDeclarator: (interp, s, param) ->
      rt = interp.rt
      basetype = param.basetype
      basetype = interp.buildRecursivePointerType(s.Pointer, basetype, 0)
      if s.right.length is 1
        right = s.right[0]
        ptl = null
        if right.type is "DirectDeclarator_modifier_ParameterTypeList"
          ptl = right.ParameterTypeList
          varargs = ptl.varargs
        else if right.type is "DirectDeclarator_modifier_IdentifierList" and right.IdentifierList is null
          ptl = right.ParameterTypeList
          varargs = false
        if ptl?
          argTypes = []
          for _param in ptl.ParameterList
            _basetype = rt.simpleType(_param.DeclarationSpecifiers)
            if _param.Declarator?
              _pointer = _param.Declarator.Pointer
              _type = interp.buildRecursivePointerType(_pointer, _basetype, 0)
              if _param.Declarator.right? and _param.Declarator.right.length > 0
                dimensions = []
                for dim, j in _param.Declarator.right
                  dim = _param.Declarator.right[j]
                  if dim.type isnt "DirectDeclarator_modifier_array"
                    rt.raiseException "unacceptable array initialization", dim
                  if dim.Expression isnt null
                    dim = rt.cast(rt.intTypeLiteral, yield from interp.visit(interp, dim.Expression, param)).v
                  else if j > 0
                    rt.raiseException "multidimensional array must have bounds for all dimensions except the first", dim
                  else
                    dim = -1
                  dimensions.push dim
                _type = interp.arrayType(dimensions, 0, _type)
            else
              _type = _basetype
            argTypes.push _type
          basetype = rt.functionType(basetype, argTypes)
      if s.right.length > 0 and s.right[0].type is "DirectDeclarator_modifier_array"
        dimensions = []
        for dim, j in s.right
          if dim.type isnt "DirectDeclarator_modifier_array"
            rt.raiseException "unacceptable array initialization", dim
          if dim.Expression isnt null
            dim = rt.cast(rt.intTypeLiteral, yield from interp.visit(interp, dim.Expression, param)).v
          else if j > 0
            rt.raiseException "multidimensional array must have bounds for all dimensions except the first", dim
          else
            dim = -1
          dimensions.push dim
        basetype = interp.arrayType(dimensions, 0, basetype)

      if s.left.type is "Identifier"
        return {type: basetype, name: s.left.Identifier}
      else
        _basetype = param.basetype
        param.basetype = basetype
        ret = yield from interp.visit(interp, s.left, param)
        param.basetype = _basetype
        return ret
    TypedefDeclaration: (interp, s, param) ->
      rt = interp.rt
      basetype = rt.simpleType(s.DeclarationSpecifiers)
      _basetype = param.basetype
      param.basetype = basetype
      for declarator in s.Declarators
        {type, name} = yield from interp.visit(interp, declarator, param)
        rt.registerTypedef(type, name)
      param.basetype = _basetype
      return
    FunctionDefinition: (interp, s, param) ->
      rt = interp.rt
      scope = param.scope
      name = s.Declarator.left.Identifier
      basetype = rt.simpleType(s.DeclarationSpecifiers)
      pointer = s.Declarator.Pointer
      basetype = interp.buildRecursivePointerType(pointer, basetype, 0)
      argTypes = []
      argNames = []
      optionalArgs = []
      ptl = undefined
      varargs = undefined
      if s.Declarator.right.type is "DirectDeclarator_modifier_ParameterTypeList"
        ptl = s.Declarator.right.ParameterTypeList
        varargs = ptl.varargs
      else if s.Declarator.right.type is "DirectDeclarator_modifier_IdentifierList" and s.Declarator.right.IdentifierList is null
        ptl = ParameterList: []
        varargs = false
      else
        rt.raiseException "unacceptable argument list", s.Declarator.right
      i = 0
      while i < ptl.ParameterList.length
        _param = ptl.ParameterList[i]
        if not _param.Declarator?
          rt.raiseException "missing declarator for argument", _param
        _init = _param.Declarator.Initializers
        _pointer = _param.Declarator.Declarator.Pointer
        _basetype = rt.simpleType(_param.DeclarationSpecifiers)
        _type = interp.buildRecursivePointerType(_pointer, _basetype, 0)
        _name = _param.Declarator.Declarator.left.Identifier
        if _param.Declarator.Declarator.right.length > 0
          dimensions = []
          j = 0
          while j < _param.Declarator.Declarator.right.length
            dim = _param.Declarator.Declarator.right[j]
            if dim.type isnt "DirectDeclarator_modifier_array"
              rt.raiseException "unacceptable array initialization", dim
            if dim.Expression isnt null
              dim = rt.cast(rt.intTypeLiteral, yield from interp.visit(interp, dim.Expression, param)).v
            else if j > 0
              rt.raiseException "multidimensional array must have bounds for all dimensions except the first", dim
            else
              dim = -1
            dimensions.push dim
            j++
          _type = interp.arrayType(dimensions, 0, _type)
        if _init?
          optionalArgs.push
            type: _type
            name: _name
            expression: _init.Expression
        else
          if optionalArgs.length > 0
            rt.raiseException "all default arguments must be at the end of arguments list" , _param
          argTypes.push _type
          argNames.push _name
        i++
      stat = s.CompoundStatement
      rt.defFunc scope, name, basetype, argTypes, argNames, stat, interp, optionalArgs
      return
    Declaration: (interp, s, param) ->
      rt = interp.rt
      basetype = rt.simpleType(s.DeclarationSpecifiers)
      for dec, i in s.InitDeclaratorList
        init = dec.Initializers
        if dec.Declarator.right.length > 0 and dec.Declarator.right[0].type is "DirectDeclarator_modifier_array"
          dimensions = []
          for dim, j in dec.Declarator.right
            if dim.Expression isnt null
              dim = rt.cast(rt.intTypeLiteral, yield from interp.visit(interp, dim.Expression, param)).v
            else if j > 0
              rt.raiseException "multidimensional array must have bounds for all dimensions except the first", dim
            else
              if init.type is "Initializer_expr"
                initializer = yield from interp.visit(interp, init, param)
                if rt.isCharType(basetype) and rt.isArrayType(initializer.t) and rt.isCharType(initializer.t.eleType)
                  # string init
                  dim = initializer.v.target.length
                  init =
                    type: "Initializer_array"
                    Initializers: initializer.v.target.map((e) ->
                      {
                        type: "Initializer_expr"
                        shorthand: e
                      }
                    )
                else
                  rt.raiseException "cannot initialize an array to " + rt.makeValString(initializer), init
              else
                dim = init.Initializers.length
            dimensions.push dim
          init = yield from interp.arrayInit(dimensions, init, 0, basetype, param)
          _basetype = param.basetype
          param.basetype = basetype
          {name, type} = yield from interp.visit(interp, dec.Declarator, param)
          param.basetype = _basetype
          rt.defVar name, init.t, init
        else
          _basetype = param.basetype
          param.basetype = basetype
          {name, type} = yield from interp.visit(interp, dec.Declarator, param)
          param.basetype = _basetype
          if not init?
            init = rt.defaultValue(type, true)
          else
            init = yield from interp.visit(interp, init.Expression)
          rt.defVar name, type, init
      return
    Initializer_expr: (interp, s, param) ->
      rt = interp.rt
      yield from interp.visit interp, s.Expression, param
    Label_case: (interp, s, param) ->
      rt = interp.rt
      ce = yield from interp.visit(interp, s.ConstantExpression)
      if param["switch"] is undefined
        rt.raiseException "you cannot use case outside switch block"
      if param.scope is "SelectionStatement_switch_cs"
        return [
          "switch"
          rt.cast(ce.t, param["switch"]).v is ce.v
        ]
      else
        rt.raiseException "you can only use case directly in a switch block"
      return
    Label_default: (interp, s, param) ->
      rt = interp.rt
      if param["switch"] is undefined
        rt.raiseException "you cannot use default outside switch block"
      if param.scope is "SelectionStatement_switch_cs"
        return [
          "switch"
          true
        ]
      else
        rt.raiseException "you can only use default directly in a switch block"
      return
    CompoundStatement: (interp, s, param) ->
      rt = interp.rt
      stmts = s.Statements
      r = undefined
      i = undefined
      _scope = param.scope
      if param.scope is "SelectionStatement_switch"
        param.scope = "SelectionStatement_switch_cs"
        rt.enterScope param.scope
        switchon = false
        i = 0
        while i < stmts.length
          stmt = stmts[i]
          if stmt.type is "Label_case" or stmt.type is "Label_default"
            r = yield from interp.visit(interp, stmt, param)
            if r[1]
              switchon = true
          else if switchon
            r = yield from interp.visit(interp, stmt, param)
            if r instanceof Array
              return r
          i++
        rt.exitScope param.scope
        param.scope = _scope
      else
        param.scope = "CompoundStatement"
        rt.enterScope param.scope
        for stmt in stmts
          r = yield from interp.visit(interp, stmt, param)
          if r instanceof Array
            break
        rt.exitScope param.scope
        param.scope = _scope
        return r
      return
    ExpressionStatement: (interp, s, param) ->
      rt = interp.rt
      if s.Expression?
        yield from interp.visit interp, s.Expression, param
      return
    SelectionStatement_if: (interp, s, param) ->
      rt = interp.rt
      scope_bak = param.scope
      param.scope = "SelectionStatement_if"
      rt.enterScope param.scope
      e = yield from interp.visit(interp, s.Expression, param)
      ret = undefined
      if rt.cast(rt.boolTypeLiteral, e).v
        ret = yield from interp.visit(interp, s.Statement, param)
      else if s.ElseStatement
        ret = yield from interp.visit(interp, s.ElseStatement, param)
      rt.exitScope param.scope
      param.scope = scope_bak
      ret
    SelectionStatement_switch: (interp, s, param) ->
      rt = interp.rt
      scope_bak = param.scope
      param.scope = "SelectionStatement_switch"
      rt.enterScope param.scope
      e = yield from interp.visit(interp, s.Expression, param)
      switch_bak = param["switch"]
      param["switch"] = e
      r = yield from interp.visit(interp, s.Statement, param)
      param["switch"] = switch_bak
      ret = undefined
      if r instanceof Array
        if r[0] isnt "break"
          ret = r
      rt.exitScope param.scope
      param.scope = scope_bak
      ret
    IterationStatement_while: (interp, s, param) ->
      rt = interp.rt
      scope_bak = param.scope
      param.scope = "IterationStatement_while"
      rt.enterScope param.scope
      while true
        if s.Expression?
          cond = yield from interp.visit(interp, s.Expression, param)
          cond = rt.cast(rt.boolTypeLiteral, cond).v
          break if not cond
        r = yield from interp.visit(interp, s.Statement, param)
        if r instanceof Array
          switch r[0]
            when "continue"
              break
            when "break"
              end_loop = true
            when "return"
              return_val = r
              end_loop = true
          if end_loop then break
      rt.exitScope param.scope
      param.scope = scope_bak
      return return_val
    IterationStatement_do: (interp, s, param) ->
      rt = interp.rt
      scope_bak = param.scope
      param.scope = "IterationStatement_do"
      rt.enterScope param.scope
      loop
        r = yield from interp.visit(interp, s.Statement, param)
        if r instanceof Array
          switch r[0]
            when "continue"
              break
            when "break"
              end_loop = true
            when "return"
              return_val = r
              end_loop = true
          if end_loop then break
        if s.Expression?
          cond = yield from interp.visit(interp, s.Expression, param)
          cond = rt.cast(rt.boolTypeLiteral, cond).v
          break if not cond
      rt.exitScope param.scope
      param.scope = scope_bak
      return return_val
    IterationStatement_for: (interp, s, param) ->
      rt = interp.rt
      scope_bak = param.scope
      param.scope = "IterationStatement_for"
      rt.enterScope param.scope
      if s.Initializer
        if s.Initializer.type is "Declaration"
          yield from interp.visit interp, s.Initializer, param
        else
          yield from interp.visit interp, s.Initializer, param
      while true
        if s.Expression?
          cond = yield from interp.visit(interp, s.Expression, param)
          cond = rt.cast(rt.boolTypeLiteral, cond).v
          break if not cond
        r = yield from interp.visit(interp, s.Statement, param)
        if r instanceof Array
          switch r[0]
            when "continue"
              break
            when "break"
              end_loop = true
            when "return"
              return_val = r
              end_loop = true
          if end_loop then break
        if s.Loop
          yield from interp.visit interp, s.Loop, param
      rt.exitScope param.scope
      param.scope = scope_bak
      return return_val
    JumpStatement_goto: (interp, s, param) ->
      rt = interp.rt
      rt.raiseException "not implemented"
      return
    JumpStatement_continue: (interp, s, param) ->
      rt = interp.rt
      [ "continue" ]
    JumpStatement_break: (interp, s, param) ->
      rt = interp.rt
      [ "break" ]
    JumpStatement_return: (interp, s, param) ->
      rt = interp.rt
      if s.Expression
        ret = yield from interp.visit(interp, s.Expression, param)
        return [
          "return"
          ret
        ]
      [ "return" ]
    IdentifierExpression: (interp, s, param) ->
      rt = interp.rt
      rt.readVar s.Identifier
    ParenthesesExpression: (interp, s, param) ->
      rt = interp.rt
      yield from interp.visit interp, s.Expression, param
    PostfixExpression_ArrayAccess: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      index = yield from interp.visit(interp, s.index, param)
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("[]"), [ index.t ]) rt, ret, index
      if isGenerator(r)
        yield from r
      else
        yield return r
    PostfixExpression_MethodInvocation: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      # console.log "==================="
      # console.log "s: " + JSON.stringify(s)
      # console.log "==================="
      args = for e in s.args
        thisArg = yield from interp.visit interp, e, param
        # console.log "-------------------"
        # console.log "e: " + JSON.stringify(e)
        # console.log "-------------------"
        thisArg

      # console.log "==================="
      # console.log "ret: " + JSON.stringify(ret)
      # console.log "args: " + JSON.stringify(args)
      # console.log "==================="
      if ret.v.bindThis?
        bindThis = ret.v.bindThis
      else
        bindThis = ret
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("()"), args.map((e) ->
        e.t
      )) rt, ret, bindThis, args
      if isGenerator(r)
        yield from r
      else
        yield return r
    PostfixExpression_MemberAccess: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      rt.getMember ret, s.member
    PostfixExpression_MemberPointerAccess: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      member = undefined
      if rt.isPointerType(ret.t) and not rt.isFunctionType(ret.t)
        member = s.member
        r = rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), []) rt, ret, member
        if isGenerator(r)
          yield from r
        else
          yield return r
      else
        member = yield from interp.visit(interp, {
          type: "IdentifierExpression"
          Identifier: s.member
        }, param)
        r = rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [ member.t ]) rt, ret, member
        if isGenerator(r)
          yield from r
        else
          yield return r
    PostfixExpression_PostIncrement: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("++"), [ "dummy" ]) rt, ret,
        t: "dummy"
        v: null
      if isGenerator(r)
        yield from r
      else
        yield return r
    PostfixExpression_PostDecrement: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("--"), [ "dummy" ]) rt, ret,
        t: "dummy"
        v: null
      if isGenerator(r)
        yield from r
      else
        yield return r
    UnaryExpression_PreIncrement: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("++"), []) rt, ret
      if isGenerator(r)
        yield from r
      else
        yield return r
    UnaryExpression_PreDecrement: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("--"), []) rt, ret
      if isGenerator(r)
        yield from r
      else
        yield return r
    UnaryExpression: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName(s.op), []) rt, ret
      if isGenerator(r)
        yield from r
      else
        yield return r
    UnaryExpression_Sizeof_Expr: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      rt.val rt.intTypeLiteral, rt.getSize(ret)
    UnaryExpression_Sizeof_Type: (interp, s, param) ->
      rt = interp.rt
      type = yield from interp.visit(interp, s.TypeName, param)
      rt.val rt.intTypeLiteral, rt.getSizeByType(type)
    CastExpression: (interp, s, param) ->
      rt = interp.rt
      ret = yield from interp.visit(interp, s.Expression, param)
      type = yield from interp.visit(interp, s.TypeName, param)
      rt.cast type, ret
    TypeName: (interp, s, param) ->
      rt = interp.rt
      typename = []
      for baseType in s.base
        if baseType isnt "const"
          typename.push baseType
      rt.simpleType typename
    BinOpExpression: (interp, s, param) ->
      rt = interp.rt
      op = s.op
      if op is "&&"
        s.type = "LogicalANDExpression"
        yield from interp.visit interp, s, param
      else if op is "||"
        s.type = "LogicalORExpression"
        yield from interp.visit interp, s, param
      else
        # console.log "==================="
        # console.log "s.left: " + JSON.stringify(s.left)
        # console.log "s.right: " + JSON.stringify(s.right)
        # console.log "==================="
        left = yield from interp.visit(interp, s.left, param)
        right = yield from interp.visit(interp, s.right, param)
        # console.log "==================="
        # console.log "left: " + JSON.stringify(left)
        # console.log "right: " + JSON.stringify(right)
        # console.log "==================="
        r = rt.getFunc(left.t, rt.makeOperatorFuncName(op), [ right.t ]) rt, left, right
        if isGenerator(r)
          yield from r
        else
          yield return r
    LogicalANDExpression: (interp, s, param) ->
      rt = interp.rt
      left = yield from interp.visit(interp, s.left, param)
      lt = rt.types[rt.getTypeSignature(left.t)]
      if "&&" of lt
        right = yield from interp.visit(interp, s.right, param)
        r = rt.getFunc(left.t, rt.makeOperatorFuncName("&&"), [ right.t ]) rt, left, right
        if isGenerator(r)
          yield from r
        else
          yield return r
      else
        if rt.cast(rt.boolTypeLiteral, left).v
          yield from interp.visit interp, s.right, param
        else
          left
    LogicalORExpression: (interp, s, param) ->
      rt = interp.rt
      left = yield from interp.visit(interp, s.left, param)
      lt = rt.types[rt.getTypeSignature(left.t)]
      if "||" of lt
        right = yield from interp.visit(interp, s.right, param)
        r = rt.getFunc(left.t, rt.makeOperatorFuncName("||"), [ right.t ]) rt, left, right
        if isGenerator(r)
          yield from r
        else
          yield return r
      else
        if rt.cast(rt.boolTypeLiteral, left).v
          left
        else
          yield from interp.visit interp, s.right, param
    ConditionalExpression: (interp, s, param) ->
      rt = interp.rt
      cond = rt.cast(rt.boolTypeLiteral, yield from interp.visit(interp, s.cond, param)).v
      if cond then yield from interp.visit(interp, s.t, param) else yield from interp.visit(interp, s.f, param)
    ConstantExpression: (interp, s, param) ->
      rt = interp.rt
      yield from interp.visit interp, s.Expression, param
    StringLiteralExpression: (interp, s, param) ->
      yield from interp.visit(interp, s.value, param)
    StringLiteral: (interp, s, param) ->
      rt = interp.rt
      switch s.prefix
        when null
          maxCode = -1
          minCode = 1
          for i in s.value
            code = i.charCodeAt(0)
            maxCode = code if maxCode < code
            minCode = code if minCode > code
          limits = rt.config.limits
          typeName =
            if maxCode <= limits["char"].max && minCode >= limits["char"].min
              "char"
            else
              "wchar_t"
          rt.makeCharArrayFromString s.value, typeName
        when "L"
          rt.makeCharArrayFromString s.value, "wchar_t"
        when "u8"
          rt.makeCharArrayFromString s.value, "char"
        when "u"
          rt.makeCharArrayFromString s.value, "char16_t"
        when "U"
          rt.makeCharArrayFromString s.value, "char32_t"
    BooleanConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.boolTypeLiteral, if s.value is "true" then 1 else 0
    CharacterConstant: (interp, s, param) ->
      rt = interp.rt
      a = s.Char
      if a.length isnt 1
        rt.raiseException "a character constant must have and only have one character."
      rt.val rt.charTypeLiteral, a[0].charCodeAt(0)
    FloatConstant: (interp, s, param) ->
      rt = interp.rt
      val = yield from interp.visit(interp, s.Expression, param)
      rt.val rt.floatTypeLiteral, val.v
    DecimalConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.unsignedintTypeLiteral, parseInt(s.value, 10)
    HexConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.unsignedintTypeLiteral, parseInt(s.value, 16)
    BinaryConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.unsignedintTypeLiteral, parseInt(s.value, 2)
    DecimalFloatConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.doubleTypeLiteral, parseFloat(s.value)
    HexFloatConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.doubleTypeLiteral, parseFloat(s.value, 16)
    OctalConstant: (interp, s, param) ->
      rt = interp.rt
      rt.val rt.unsignedintTypeLiteral, parseInt(s.value, 8)
    NamespaceDefinition: (interp, s, param) ->
      rt = interp.rt
      rt.raiseException "not implemented"
      return
    UsingDirective: (interp, s, param) ->
      rt = interp.rt
      id = s.Identifier
      #rt.raiseException("not implemented");
      return
    UsingDeclaration: (interp, s, param) ->
      rt = interp.rt
      rt.raiseException "not implemented"
      return
    NamespaceAliasDefinition: (interp, s, param) ->
      rt = interp.rt
      rt.raiseException "not implemented"
      return
    unknown: (interp, s, param) ->
      rt = interp.rt
      rt.raiseException "unhandled syntax " + s.type
      return
  return

Interpreter::visit = (interp, s, param) ->
  rt = interp.rt
  # console.log "#{s.sLine}: visiting #{s.type}"
  if "type" of s
    if param is undefined
      param = scope: "global"
    _node = @currentNode
    @currentNode = s
    if s.type of @visitors
      f = @visitors[s.type]
      if isGeneratorFunction(f)
        ret = yield from f(interp, s, param)
      else
        yield ret = f(interp, s, param)
    else
      ret = @visitors["unknown"](interp, s, param)
    @currentNode = _node
  else
    @currentNode = s
    @rt.raiseException "untyped syntax structure"
  return ret

Interpreter::run = (tree) ->
  @rt.interp = this
  yield from @visit this, tree

Interpreter::arrayInit = (dimensions, init, level, type, param) ->
  arr = undefined
  i = undefined
  ret = undefined
  initval = undefined
  if dimensions.length > level
    curDim = dimensions[level]
    if init
      if init.type is "Initializer_array" and curDim >= init.Initializers.length and (init.Initializers.length is 0 or init.Initializers[0].type is "Initializer_expr")
        # last level, short hand init
        if init.Initializers.length is 0
          arr = new Array(curDim)
          i = 0
          while i < curDim
            arr[i] =
              type: "Initializer_expr"
              shorthand: @rt.defaultValue(type)
            i++
          init.Initializers = arr
        else if init.Initializers.length is 1 and @rt.isIntegerType(type)
          val = @rt.cast(type, yield from @visit(this, init.Initializers[0].Expression, param))
          if val.v is -1 or val.v is 0
            arr = new Array(curDim)
            i = 0
            while i < curDim
              arr[i] =
                type: "Initializer_expr"
                shorthand: @rt.val(type, val.v)
              i++
            init.Initializers = arr
          else
            arr = new Array(curDim)
            arr[0] = @rt.val(type, -1)
            i = 1
            while i < curDim
              arr[i] =
                type: "Initializer_expr"
                shorthand: @rt.defaultValue(type)
              i++
            init.Initializers = arr
        else
          arr = new Array(curDim)
          i = 0
          while i < init.Initializers.length
            _init = init.Initializers[i]
            if "shorthand" of _init
              initval = _init
            else
              initval =
                type: "Initializer_expr"
                shorthand: yield from @visit(this, _init.Expression, param)
            arr[i] = initval
            i++
          i = init.Initializers.length
          while i < curDim
            arr[i] =
              type: "Initializer_expr"
              shorthand: @rt.defaultValue(type)
            i++
          init.Initializers = arr
      else if init.type is "Initializer_expr"
        initializer = undefined
        if "shorthand" of init
          initializer = init.shorthand
        else
          initializer = yield from @visit(this, init, param)
        if @rt.isCharType(type) and @rt.isArrayType(initializer.t) and @rt.isCharType(initializer.t.eleType)
          # string init
          init =
            type: "Initializer_array"
            Initializers: initializer.v.target.map((e) ->
              {
                type: "Initializer_expr"
                shorthand: e
              }
            )
        else
          @rt.raiseException "cannot initialize an array to " + @rt.makeValString(initializer), init
      else
        @rt.raiseException "dimensions do not agree, " + curDim + " != " + init.Initializers.length
    arr = []
    ret = @rt.val(@arrayType(dimensions, level, type), @rt.makeArrayPointerValue(arr, 0), true)
    i = 0
    while i < curDim
      if init and i < init.Initializers.length
        arr[i] = yield from @arrayInit(dimensions, init.Initializers[i], level + 1, type, param)
      else
        arr[i] = yield from @arrayInit(dimensions, null, level + 1, type, param)
      i++
    ret
  else
    if init and init.type isnt "Initializer_expr"
      @rt.raiseException "dimensions do not agree, too few initializers", init
    if init
      if "shorthand" of init
        initval = init.shorthand
      else
        initval = yield from @visit(this, init.Expression, param)
    else
      initval = @rt.defaultValue(type)
    ret = @rt.cast(type, initval)
    ret.left = true
    ret

Interpreter::arrayType = (dimensions, level, type) ->
  if dimensions.length > level
    @rt.arrayPointerType @arrayType(dimensions, level + 1, type), dimensions[level]
  else
    type

Interpreter::buildRecursivePointerType = (pointer, basetype, level) ->
  if pointer and pointer.length > level
    type = @rt.normalPointerType(basetype)
    @buildRecursivePointerType pointer, type, level + 1
  else
    basetype

module.exports = Interpreter
