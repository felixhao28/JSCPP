Defaults = require "./defaults"

CRuntime = (config) ->

  mergeConfig = (a, b) ->
    for o of b
      if o of a and typeof b[o] is "object"
        mergeConfig a[o], b[o]
      else
        a[o] = b[o]
    return

  defaults = new Defaults()
  @config = defaults.config
  mergeConfig @config, config
  @numericTypeOrder = defaults.numericTypeOrder
  @types = defaults.types
  
  @intTypeLiteral = @primitiveType("int")
  @unsignedintTypeLiteral = @primitiveType("unsigned int")
  @longTypeLiteral = @primitiveType("long")
  @floatTypeLiteral = @primitiveType("float")
  @doubleTypeLiteral = @primitiveType("double")
  @charTypeLiteral = @primitiveType("char")
  @unsignedcharTypeLiteral = @primitiveType("unsigned char")
  @boolTypeLiteral = @primitiveType("bool")
  @voidTypeLiteral = @primitiveType("void")
  @nullPointerValue = @makeNormalPointerValue(null)
  @voidPointerType = @normalPointerType(@voidTypeLiteral)
  @nullPointer = @val(@voidPointerType, @nullPointerValue)
  @scope = [ { "$name": "global" } ]
  @typedefs = {}
  return this

CRuntime::include = (name) ->
  includes = @config.includes
  if name of includes
    lib = includes[name]
    if name in @config.loadedLibraries
      return
    @config.loadedLibraries.push name
    includes[name].load this
  else
    @raiseException "cannot find library: " + name
  return

CRuntime::getSize = (element) ->
  ret = 0
  if @isArrayType(element.t) and element.v.position is 0
    i = 0
    while i < element.v.target.length
      ret += @getSize(element.v.target[i])
      i++
  else
    ret += @getSizeByType(element.t)
  ret

CRuntime::getSizeByType = (type) ->
  if @isPointerType(type)
    return @config.limits["pointer"].bytes
  else if @isPrimitiveType(type)
    return @config.limits[type.name].bytes
  else
    @raiseException "not implemented"
  return

CRuntime::getMember = (l, r) ->
  lt = l.t
  if @isClassType(lt)
    ltsig = @getTypeSignature(lt)
    if ltsig of @types
      t = @types[ltsig]
      if r of t
        return {
                t:
                  type: "function"
                v:
                  defineType: lt
                  name: r
                  bindThis: l
                }
      else if r of l.v.members
        return l.v.members[r]
    else
      @raiseException "type " + @makeTypeString(lt) + " is unknown"
  else
    @raiseException "only a class can have members"
  return

CRuntime::defFunc = (lt, name, retType, argTypes, argNames, stmts, interp, optionalArgs) ->
  rt = this
  if stmts?
    f = (rt, _this, args...) ->
      # logger.warn("calling function: %j", name);
      rt.enterScope "function " + name
      argNames.forEach (argName, i) ->
        rt.defVar argName, argTypes[i], args[i]
        return
      for i in [0...optionalArgs.length] by 1
        optionalArg = optionalArgs[i]
        if args[argNames.length+i]?
          rt.defVar optionalArg.name, optionalArg.type, args[argNames.length+i]
        else
          argValue = yield from interp.visit(interp, optionalArg.expression)
          rt.defVar optionalArg.name, optionalArg.type, rt.cast(optionalArg.type, argValue)
      ret = yield from interp.run(stmts, scope: "function")
      if not rt.isTypeEqualTo(retType, rt.voidTypeLiteral)
        if ret instanceof Array and ret[0] is "return"
          ret = rt.cast(retType, ret[1])
        else
          rt.raiseException "you must return a value"
      else
        if typeof ret is "Array"
          if ret[0] is "return" and ret[1]
            rt.raiseException "you cannot return a value from a void function"
        ret = undefined
      rt.exitScope "function " + name
      # logger.warn("function: returing %j", ret);
      ret

    @regFunc f, lt, name, argTypes, retType, optionalArgs
  else
    @regFuncPrototype lt, name, argTypes, retType, optionalArgs
  return

CRuntime::makeParametersSignature = (args) ->
  ret = new Array(args.length)
  i = 0
  while i < args.length
    ret[i] = @getTypeSignature(args[i])
    i++
  ret.join ","

CRuntime::getCompatibleFunc = (lt, name, args) ->
  ltsig = @getTypeSignature(lt)
  if ltsig of @types
    t = @types[ltsig]
    if name of t
      # logger.info("method found");
      ts = args.map((v) ->
        v.t
      )
      sig = @makeParametersSignature(ts)
      if sig of t[name]
        ret = t[name][sig]
      else
        compatibles = []
        reg = t[name]["reg"]
        Object.keys(reg).forEach (signature) =>
          regArgInfo = reg[signature]
          dts = regArgInfo.args
          optionalArgs = regArgInfo.optionalArgs
          if dts[dts.length - 1] is "?" and dts.length - 1 <= ts.length
            newTs = ts.slice(0, dts.length - 1)
            dts = dts.slice(0, -1)
          else
            newTs = ts
          if dts.length <= newTs.length
            ok = true
            i = 0
            while ok and i < dts.length
              ok = @castable(newTs[i], dts[i])
              i++
            while ok and i < newTs.length
              ok = @castable(newTs[i], optionalArgs[i - dts.length].type)
              i++
            if ok
              compatibles.push t[name][@makeParametersSignature(regArgInfo.args)]
          return
        if compatibles.length is 0
          if "#default" of t[name]
            ret = t[name]["#default"]
          else
            argsStr = ts.map((v) =>
              @makeTypeString v
            ).join(",")
            @raiseException "no method " + name + " in " + lt + " accepts " + argsStr
        else if compatibles.length > 1
          @raiseException "ambiguous method invoking, " + compatibles.length + " compatible methods"
        else
          ret = compatibles[0]
    else
      @raiseException "method " + name + " is not defined in " + @makeTypeString(lt)
  else
    @raiseException "type " + @makeTypeString(lt) + " is unknown"
  if not ret?
    @raiseException "method " + name + " does not seem to be implemented"
  return ret

CRuntime::matchVarArg = (methods, sig) ->
  for _sig of methods
    if _sig[_sig.length - 1] is "?"
      _sig = _sig.slice(0, -1)
      if sig.startsWith(_sig)
        return methods[_sig]
  null

CRuntime::getFunc = (lt, name, args) ->
  method = undefined
  if @isPointerType(lt) or @isFunctionType(lt)
    f = undefined
    if @isArrayType(lt)
      f = "pointer_array"
    else if @isFunctionType(lt)
      f = "function"
    else
      f = "pointer_normal"
    t = null
    if name of @types[f]
      t = @types[f]
    else if name of @types["pointer"]
      t = @types["pointer"]
    if t
      sig = @makeParametersSignature(args)
      if sig of t[name]
        return t[name][sig]
      else if (method = @matchVarArg(t[name], sig)) isnt null
        return method
      else if "#default" of t[name]
        return t[name]["#default"]
      else
        @raiseException "no method " + name + " in " + @makeTypeString(lt) + " accepts (" + sig + ")"
  ltsig = @getTypeSignature(lt)
  if ltsig of @types
    t = @types[ltsig]
    if name of t
      sig = @makeParametersSignature(args)
      if sig of t[name]
        return t[name][sig]
      else if (method = @matchVarArg(t[name], sig)) isnt null
        return method
      else if "#default" of t[name]
        return t[name]["#default"]
      else
        @raiseException "no method " + name + " in " + @makeTypeString(lt) + " accepts (" + sig + ")"
    else
      @raiseException "method " + name + " is not defined in " + @makeTypeString(lt)
  else
    if @isPointerType(lt)
      @raiseException "this pointer has no proper method overload"
    else
      @raiseException "type " + @makeTypeString(lt) + " is not defined"
  return

CRuntime::makeOperatorFuncName = (name) ->
  "o(#{name})"

CRuntime::regOperator = (f, lt, name, args, retType) ->
  @regFunc(f, lt, @makeOperatorFuncName(name), args, retType)

CRuntime::regFuncPrototype = (lt, name, args, retType, optionalArgs) ->
  ltsig = @getTypeSignature(lt)
  if ltsig of @types
    t = @types[ltsig]
    if name not of t
      t[name] = {}
    if "reg" not of t[name]
      t[name]["reg"] = {}
    sig = @makeParametersSignature(args)
    if sig of t[name]
      @raiseException "method " + name + " with parameters (" + sig + ") is already defined"
    type = @functionType(retType, args)
    if lt is "global"
      @defVar name, type, @val(type, @makeFunctionPointerValue(null, name, lt, args, retType))
    t[name][sig] = null
    t[name]["reg"][sig] ?=
      args: args
      optionalArgs: optionalArgs
  else
    @raiseException "type " + @makeTypeString(lt) + " is unknown"
  return

CRuntime::regFunc = (f, lt, name, args, retType, optionalArgs) ->
  ltsig = @getTypeSignature(lt)
  if ltsig of @types
    optionalArgs or= []
    t = @types[ltsig]
    if name not of t
      t[name] = {}
    if "reg" not of t[name]
      t[name]["reg"] = {}
    sig = @makeParametersSignature(args)
    if sig of t[name] and t[name][sig]?
      @raiseException "method " + name + " with parameters (" + sig + ") is already defined"
    type = @functionType(retType, args)
    if lt is "global"
      if @varAlreadyDefined(name)
        func = @scope[0][name]
        if func.v.target isnt null
          @raiseException "global method " + name + " with parameters (" + sig + ") is already defined"
        else
          func.v.target = f
      else
        @defVar name, type, @val(type, @makeFunctionPointerValue(f, name, lt, args, retType))
    t[name][sig] = f
    t[name]["reg"][sig] =
      args: args
      optionalArgs: optionalArgs
  else
    @raiseException "type " + @makeTypeString(lt) + " is unknown"
  return

CRuntime::registerTypedef = (basttype, name) ->
  @typedefs[name] = basttype

CRuntime::promoteNumeric = (l, r) ->
  if not @isNumericType(l) or not @isNumericType(r)
    @raiseException "you cannot promote (to) a non numeric type"
  if @isTypeEqualTo(l, r)
    if @isTypeEqualTo(l, @boolTypeLiteral)
      return @intTypeLiteral
    if @isTypeEqualTo(l, @charTypeLiteral)
      return @intTypeLiteral
    if @isTypeEqualTo(l, @unsignedcharTypeLiteral)
      return @unsignedintTypeLiteral
    return l
  else if @isIntegerType(l) and @isIntegerType(r)
    slt = @getSignedType(l)
    srt = @getSignedType(r)
    if @isTypeEqualTo(slt, srt)
      rett = slt
    else
      slti = @numericTypeOrder.indexOf(slt.name)
      srti = @numericTypeOrder.indexOf(srt.name)
      if slti <= srti
        if @isUnsignedType(l) and @isUnsignedType(r)
          rett = r
        else
          rett = srt
      else
        if @isUnsignedType(l) and @isUnsignedType(r)
          rett = l
        else
          rett = slt
    return rett
  else if not @isIntegerType(l) and @isIntegerType(r)
    return l
  else if @isIntegerType(l) and not @isIntegerType(r)
    return r
  else if not @isIntegerType(l) and not @isIntegerType(r)
    return @primitiveType("double")
  return

CRuntime::readVar = (varname) ->
  i = @scope.length - 1
  while i >= 0
    vc = @scope[i]
    if vc[varname]
      ret = vc[varname]
      return ret
    i--
  @raiseException "variable " + varname + " does not exist"
  return

CRuntime::varAlreadyDefined = (varname) ->
  vc = @scope[@scope.length - 1]
  return varname of vc

CRuntime::defVar = (varname, type, initval) ->
  if @varAlreadyDefined(varname)
    @raiseException "variable " + varname + " already defined"
  vc = @scope[@scope.length - 1]
  # logger.log("defining variable: %j, %j", varname, type);
  initval = @clone(@cast(type, initval))
  if initval is undefined
    vc[varname] = @defaultValue(type)
    vc[varname].left = true
  else
    vc[varname] = initval
    vc[varname].left = true
  return

CRuntime::inrange = (type, value) ->
  if @isPrimitiveType(type)
    limit = @config.limits[type.name]
    value <= limit.max and value >= limit.min
  else
    true

CRuntime::isNumericType = (type) ->
  @isFloatType(type) or @isIntegerType(type)

CRuntime::isUnsignedType = (type) ->
  if typeof type is "string"
    switch type
      when "unsigned char", "unsigned short", "unsigned short int", "unsigned", "unsigned int", "unsigned long", "unsigned long int", "unsigned long long", "unsigned long long int"
        true
      else
        false
  else
    type.type is "primitive" and @isUnsignedType(type.name)

CRuntime::isIntegerType = (type) ->
  if typeof type is "string"
    type in @config.charTypes or type in @config.intTypes
  else
    type.type is "primitive" and @isIntegerType(type.name)
  
CRuntime::isFloatType = (type) ->
  if typeof type is "string"
    switch type
      when "float", "double"
        true
      else
        false
  else
    type.type is "primitive" and @isFloatType(type.name)

CRuntime::getSignedType = (type) ->
  if type isnt "unsigned"
    @primitiveType type.name.replace("unsigned", "").trim()
  else
    @primitiveType "int"

CRuntime::castable = (type1, type2) ->
  if @isTypeEqualTo(type1, type2)
    return true
  if @isPrimitiveType(type1) and @isPrimitiveType(type2)
    return @isNumericType(type2) and @isNumericType(type1)
  else if @isPointerType(type1) and @isPointerType(type2)
    if @isFunctionType(type1)
      return @isPointerType(type2)
    return not @isFunctionType(type2)
  else if @isClassType(type1) or @isClassType(type2)
    @raiseException "not implemented"
  return false

CRuntime::cast = (type, value) ->
  # TODO: looking for global overload
  if @isTypeEqualTo(value.t, type)
    return value
  if @isPrimitiveType(type) and @isPrimitiveType(value.t)
    if type.name is "bool"
      return @val(type, if value.v then 1 else 0)
    else if type.name in ["float", "double"]
      if not @isNumericType(value.t)
        @raiseException "cannot cast " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
      if @inrange(type, value.v)
        return @val(type, value.v)
      else
        @raiseException "overflow when casting " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
    else
      if type.name.slice(0, 8) is "unsigned"
        if not @isNumericType(value.t)
          @raiseException "cannot cast " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
        else if value.v < 0
          {bytes} = @config.limits[type.name]
          newValue = value.v & ((1<<8*bytes)-1) # truncates
          if not @inrange(type, newValue)
            @raiseException "cannot cast negative value #{newValue} to " + @makeTypeString(type)
          else
            # unsafe! bitwise truncation is platform dependent
            return @val(type, newValue)
      if not @isNumericType(value.t)
        @raiseException "cannot cast " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
      if value.t.name is "float" or value.t.name is "double"
        v = if value.v > 0 then Math.floor(value.v) else Math.ceil(value.v)
        if @inrange(type, v)
          return @val(type, v)
        else
          @raiseException "overflow when casting " + @makeValString(value) + " to " + @makeTypeString(type)
      else
        if @inrange(type, value.v)
          return @val(type, value.v)
        else
          @raiseException "overflow when casting " + @makeValString(value) + " to " + @makeTypeString(type)
  else if @isPointerType(type)
    if @isArrayType(value.t)
      if @isNormalPointerType(type)
        if @isTypeEqualTo(type.targetType, value.t.eleType)
          return value
        else
          @raiseException @makeTypeString(type.targetType) + " is not equal to array element type " + @makeTypeString(value.t.eleType)
      else if @isArrayType(type)
        if @isTypeEqualTo(type.eleType, value.t.eleType)
          return value
        else
          @raiseException "array element type " + @makeTypeString(type.eleType) + " is not equal to array element type " + @makeTypeString(value.t.eleType)
      else
        @raiseException "cannot cast a function to a regular pointer"
    else
      if @isNormalPointerType(type)
        if @isTypeEqualTo(type.targetType, value.t.targetType)
          return value
        else
          @raiseException @makeTypeString(type.targetType) + " is not equal to " + @makeTypeString(value.t.eleType)
      else if @isArrayType(type)
        if @isTypeEqualTo(type.eleType, value.t.targetType)
          return value
        else
          @raiseException "array element type " + @makeTypeString(type.eleType) + " is not equal to " + @makeTypeString(value.t.eleType)
      else
        @raiseException "cannot cast a function to a regular pointer"
  else if @isFunctionType(type)
    if @isFunctionType(value.t)
      return @val(value.t, value.v)
    else
      @raiseException "cannot cast a regular pointer to a function"
  else if @isClassType(type)
    @raiseException "not implemented"
  else if @isClassType(value.t)
    value = @getCompatibleFunc(value.t, @makeOperatorFuncName(type.name), [])(this, value)
    return value
  else
    @raiseException "cast failed from type " + @makeTypeString(type) + " to " + @makeTypeString(value.t)
  return

CRuntime::clone = (v) ->
  @val v.t, v.v

CRuntime::enterScope = (scopename) ->
  @scope.push "$name": scopename
  return

CRuntime::exitScope = (scopename) ->
  # logger.info("%j", this.scope);
  loop
    s = @scope.pop()
    unless scopename and @scope.length > 1 and s["$name"] isnt scopename
      break
  return

CRuntime::val = (type, v, left) ->
  if @isNumericType(type) and not @inrange(type, v)
    @raiseException "overflow of #{@makeValString({t:type, v:v})}"
  if left is undefined
    left = false
  {
    "t": type
    "v": v
    "left": left
  }

CRuntime::isTypeEqualTo = (type1, type2) ->
  if type1.type is type2.type
    switch type1.type
      when "primitive", "class"
        return type1.name is type2.name
      when "pointer"
        if type1.ptrType is type2.ptrType or type1.ptrType isnt "function" and type2.ptrType isnt "function"
          switch type1.ptrType
            when "array"
              return @isTypeEqualTo(type1.eleType, type2.eleType or type2.targetType)
            when "function"
              return @isTypeEqualTo(type1.funcType, type2.funcType)
            when "normal"
              return @isTypeEqualTo(type1.targetType, type2.eleType or type2.targetType)
      when "function"
        if @isTypeEqualTo(type1.retType, type2.retType) and type1.signature.length is type2.signature.length
          _this = this
          return type1.signature.every((type, index, arr) ->
            x = _this.isTypeEqualTo type, type2.signature[index]
            x
          )
  return type1 is type2

CRuntime::isBoolType = (type) ->
  if typeof type is "string"
    type is "bool"
  else
    type.type is "primitive" and @isBoolType(type.name)

CRuntime::isVoidType = (type) ->
  if typeof type is "string"
    type is "void"
  else
    type.type is "primitive" and @isVoidType(type.name)

CRuntime::isPrimitiveType = (type) ->
  @isNumericType(type) or @isBoolType(type) or @isVoidType(type)

CRuntime::isArrayType = (type) ->
  @isPointerType(type) and type.ptrType is "array"

CRuntime::isFunctionType = (type) ->
  type.type is "function" or @isNormalPointerType(type) and @isFunctionType(type.targetType)

CRuntime::isNormalPointerType = (type) ->
  @isPointerType(type) and type.ptrType is "normal"

CRuntime::isPointerType = (type) ->
  type.type is "pointer"

CRuntime::isClassType = (type) ->
  type.type is "class"

CRuntime::arrayPointerType = (eleType, size) ->
  type: "pointer"
  ptrType: "array"
  eleType: eleType
  size: size

CRuntime::makeArrayPointerValue = (arr, position) ->
  target: arr
  position: position

CRuntime::functionPointerType = (retType, signature) ->
  @normalPointerType(@functionType(retType, signature))

CRuntime::functionType = (retType, signature) ->
  type: "function"
  retType: retType
  signature: signature

CRuntime::makeFunctionPointerValue = (f, name, lt, args, retType) ->
  target: f
  name: name
  defineType: lt
  args: args
  retType: retType

CRuntime::normalPointerType = (targetType) ->
  type: "pointer"
  ptrType: "normal"
  targetType: targetType

CRuntime::makeNormalPointerValue = (target) ->
  target: target

CRuntime::simpleType = (type) ->
  if Array.isArray(type)
    if type.length > 1
      typeStr = type.filter (t) =>
        t not in @config.specifiers
      .join " "
      return @simpleType typeStr
    else
      return @typedefs[type[0]] or @simpleType type[0]
  else
    if @isPrimitiveType(type)
      return @primitiveType(type)
    else
      clsType = 
        type: "class"
        name: type
      if @getTypeSignature(clsType) of @types
        return clsType
      else
        @raiseException "type " + @makeTypeString(type) + " is not defined"
  return

CRuntime::newClass = (classname, members) ->
  clsType = 
    type: "class"
    name: classname
  sig = @getTypeSignature(clsType)
  if sig of @types
    @raiseException @makeTypeString(clsType) + " is already defined"
  @types[sig] =
    "#constructor": (rt, _this) ->
      _this.v.members = {}
      i = 0
      while i < members.length
        member = members[i]
        _this.v.members[member.name] = if member.initialize?
            member.initialize(rt, _this)
          else
            rt.defaultValue(member.t, true)
        i++
      return
    "#members": members
  clsType

CRuntime::primitiveType = (type) ->
  type: "primitive"
  name: type

CRuntime::isCharType = (type) ->
  @config.charTypes.indexOf(type.name) isnt -1

CRuntime::isStringType = (type) ->
  @isArrayType(type) and @isCharType(type.eleType)

CRuntime::getStringFromCharArray = (element) ->
  if @isStringType(element.t)
    target = element.v.target
    result = ""
    i = 0
    while i < target.length
      charVal = target[i]
      if charVal.v is 0
        break
      result += String.fromCharCode(charVal.v)
      i++
    return result
  else
    @raiseException "target is not a string"
  return

CRuntime::makeCharArrayFromString = (str, typename) ->
  self = this
  typename or= "char"
  charType = @primitiveType(typename)
  type = @arrayPointerType(charType, str.length + 1)
  trailingZero = @val(charType, 0)
  @val type,
    target: str.split("").map((c) ->
      self.val charType, c.charCodeAt(0)
    ).concat([ trailingZero ])
    position: 0

CRuntime::getTypeSignature = (type) ->
  # (primitive), [class], {pointer}
  ret = type
  self = this
  if type.type is "primitive"
    ret = "(" + type.name + ")"
  else if type.type is "class"
    ret = "[" + type.name + "]"
  else if type.type is "pointer"
    # !targetType, @size!eleType, !#retType!param1,param2,...
    ret = "{"
    if type.ptrType is "normal"
      ret += "!" + @getTypeSignature(type.targetType)
    else if type.ptrType is "array"
      ret += "!" + @getTypeSignature(type.eleType)
    ret += "}"
  else if type.type is "function"
    # #retType!param1,param2,...
    ret = "#" + @getTypeSignature(type.retType) + "!" + type.signature.map((e) =>
        @getTypeSignature e
      ).join(",")
  ret

CRuntime::makeTypeString = (type) ->
  # (primitive), [class], {pointer}
  ret = "$" + type
  if type.type is "primitive"
    ret = type.name
  else if type.type is "class"
    ret = type.name
  else if type.type is "pointer"
    # !targetType, @size!eleType, #retType!param1,param2,...
    ret = ""
    if type.ptrType is "normal"
      ret += @makeTypeString(type.targetType) + "*"
    else if type.ptrType is "array"
      ret += @makeTypeString(type.eleType) + "[#{type.size}]"
    else if type.ptrType is "function"
      ret += @makeTypeString(type.retType) + "(*f)" + "(" + type.signature.map((e) =>
        @makeTypeString e
      ).join(",") + ")"
  ret

CRuntime::makeValueString = (l, options) ->
  options or= {}
  if @isPrimitiveType(l.t)
    if @isTypeEqualTo(l.t, @charTypeLiteral)
      display = "'" + String.fromCharCode(l.v) + "'"
    else if @isBoolType(l.t)
      display = if l.v isnt 0 then "true" else "false"
    else
      display = l.v
  else if @isPointerType(l.t)
    if @isFunctionType(l.t)
      display = "<function>"
    else if @isArrayType(l.t)
      if @isTypeEqualTo(l.t.eleType, @charTypeLiteral)
        # string
        display = "\"" + @getStringFromCharArray(l) + "\""
      else if options.noArray
        display = "[...]"
      else
        options.noArray = true
        display = []
        for i in [l.v.position...l.v.target.length]
          display.push(@makeValueString(l.v.target[i], options))
        display = "[" + display.join(",") + "]"
    else if @isNormalPointerType(l.t)
      if options.noPointer
        display = "->?"
      else
        options.noPointer = true
        display = "->" + @makeValueString(l.v.target)
    else
      @raiseException "unknown pointer type"
  else if @isClassType(l.t)
    display = "<object>"
  return display

CRuntime::makeValString = (l) ->
  @makeValueString(l) + "(" + @makeTypeString(l.t) + ")"

CRuntime::defaultValue = (type, left) ->
  if type.type is "primitive"
    if @isNumericType(type)
      return @val(type, 0, left)
  else if type.type is "class"
    ret = @val(type, {}, left)
    @types[@getTypeSignature(type)]["#constructor"](this, ret)
    return ret
  else if type.type is "pointer"
    if type.ptrType is "normal"
      return @val(type, @nullPointerValue, left)
    else if type.ptrType is "array"
      init = []
      for i in [0...type.size]
        init[i] = @defaultValue(type.eleType, true)
      return @val(type, @makeArrayPointerValue(init, 0), left)
  return

CRuntime::raiseException = (message, currentNode) ->
  if @interp
    currentNode ?= @interp.currentNode
    posInfo =
      if currentNode?
        ln = currentNode.sLine
        col = currentNode.sColumn
        ln + ":" + col
      else
        "<position unavailable>"
    throw posInfo + " " + message
  else
    throw message
  return

module.exports = CRuntime
