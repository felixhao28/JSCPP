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
    @boolTypeLiteral = @primitiveType("bool")
    @voidTypeLiteral = @primitiveType("void")
    @nullPointerValue = @makeNormalPointerValue(null)
    @voidPointerType = @normalPointerType(@voidTypeLiteral)
    @nullPointer = @val(@voidPointerType, @nullPointerValue)
    @scope = [ { "$name": "global" } ]
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
    if @isClassType(l.t)
        return l.v.members[r]
    else
        @raiseException "only a class can have members"
    return

CRuntime::defFunc = (lt, name, retType, argTypes, argNames, stmts, interp) ->

    f = (rt, _this, args...) ->
        # logger.warn("calling function: %j", name);
        rt.enterScope "function " + name
        argNames.forEach (v, i) ->
            rt.defVar v, argTypes[i], args[i]
            return
        ret = yield from interp.run(stmts, scope: "function")
        if !rt.isTypeEqualTo(retType, rt.voidTypeLiteral)
            if ret instanceof Array and ret[0] is "return"
                ret = rt.cast(retType, ret[1])
            else
                @raiseException "you must return a value"
        else
            if typeof ret is "Array"
                if ret[0] is "return" and ret[1]
                    @raiseException "you cannot return a value of a void function"
            ret = undefined
        rt.exitScope "function " + name
        # logger.warn("function: returing %j", ret);
        ret

    @regFunc f, lt, name, argTypes, retType
    return

CRuntime::makeValString = (l) ->
    display = l.v
    if @isTypeEqualTo(l.t, @charTypeLiteral)
        display = "'" + String.fromCharCode(l.v) + "'"
    display + "(" + @makeTypeString(l.t) + ")"

CRuntime::makeParametersSigniture = (args) ->
    ret = new Array(args.length)
    i = 0
    while i < args.length
        ret[i] = @getTypeSigniture(args[i])
        i++
    ret.join ","

CRuntime::getCompatibleFunc = (lt, name, args) ->
    ltsig = @getTypeSigniture(lt)
    if ltsig of @types
        t = @types[ltsig]
        if name of t
            # logger.info("method found");
            ts = args.map((v) ->
                v.t
            )
            sig = @makeParametersSigniture(ts)
            if sig of t[name]
                return t[name][sig]
            else
                compatibles = []
                rt = this
                t[name]["reg"].forEach (dts) ->
                    if dts[dts.length - 1] is "?" and dts.length < ts.length
                        newTs = ts.slice(0, dts.length - 1)
                        dts = dts.slice(0, -1)
                    else
                        newTs = ts
                    if dts.length is newTs.length
                        ok = true
                        i = 0
                        while ok and i < newTs.length
                            ok = rt.castable(newTs[i], dts[i])
                            i++
                        if ok
                            compatibles.push t[name][rt.makeParametersSigniture(dts)]
                    return
                if compatibles.length is 0
                    if "#default" of t[name]
                        return t[name]["#default"]
                    rt = this
                    argsStr = ts.map((v) ->
                        rt.makeTypeString v
                    ).join(",")
                    @raiseException "no method " + name + " in " + lt + " accepts " + argsStr
                else if compatibles.length > 1
                    @raiseException "ambiguous method invoking, " + compatibles.length + "compatible methods"
                else
                    return compatibles[0]
        else
            @raiseException "method " + name + " is not defined in " + @makeTypeString(lt)
    else
        @raiseException "type " + @makeTypeString(lt) + " is unknown"
    return

CRuntime::matchVarArg = (methods, sig) ->
    for _sig of methods
        if _sig[_sig.length - 1] is "?"
            _sig = _sig.slice(0, -1)
            if sig.startsWith(_sig)
                return methods[_sig]
    null

CRuntime::getFunc = (lt, name, args) ->
    method = undefined
    if @isPointerType(lt)
        f = undefined
        if @isArrayType(lt)
            f = "pointer_array"
        else if @isFunctionType(lt)
            f = "pointer_function"
        else
            f = "pointer_normal"
        t = null
        if name of @types[f]
            t = @types[f]
        else if name of @types["pointer"]
            t = @types["pointer"]
        if t
            sig = @makeParametersSigniture(args)
            if sig of t[name]
                return t[name][sig]
            else if (method = @matchVarArg(t[name], sig)) isnt null
                return method
            else if "#default" of t[name]
                return t[name]["#default"]
            else
                @raiseException "no method " + name + " in " + @makeTypeString(lt) + " accepts (" + sig + ")"
    ltsig = @getTypeSigniture(lt)
    if ltsig of @types
        t = @types[ltsig]
        if name of t
            sig = @makeParametersSigniture(args)
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

CRuntime::regFunc = (f, lt, name, args, retType) ->
    ltsig = @getTypeSigniture(lt)
    if ltsig of @types
        t = @types[ltsig]
        if !(name of t)
            t[name] = {}
        if !("reg" of t[name])
            t[name]["reg"] = []
        sig = @makeParametersSigniture(args)
        if sig of t[name]
            @raiseException "method " + name + " with parameters (" + sig + ") is already defined"
        type = @functionPointerType(retType, args)
        if lt is "global"
            @defVar name, type, @val(type, @makeFunctionPointerValue(f, name, lt, args, retType))
        t[name][sig] = f
        t[name]["reg"].push args
    else
        @raiseException "type " + @makeTypeString(lt) + " is unknown"
    return

CRuntime::promoteNumeric = (l, r) ->
    if !@isNumericType(l) or !@isNumericType(r)
        @raiseException "you cannot promote (to) a non numeric type"
    if @isTypeEqualTo(l, r)
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
    else if !@isIntegerType(l) and @isIntegerType(r)
        return l
    else if @isIntegerType(l) and !@isIntegerType(r)
        return r
    else if !@isIntegerType(l) and !@isIntegerType(r)
        return @primitiveType("double")
    return

CRuntime::readVar = (varname) ->
    i = @scope.length - 1
    while i >= 0
        vc = @scope[i]
        if vc[varname]
            return vc[varname]
        i--
    @raiseException "variable " + varname + " does not exist"
    return

CRuntime::defVar = (varname, type, initval) ->
    # logger.log("defining variable: %j, %j", varname, type);
    vc = @scope[@scope.length - 1]
    if varname of vc
        @raiseException "variable " + varname + " already defined"
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
        return value <= limit.max and value >= limit.min
    true

CRuntime::isNumericType = (type) ->
    @isFloatType(type) or @isIntegerType(type)

CRuntime::isUnsignedType = (type) ->
    if typeof type is "string"
        switch type
            when "unsigned char", "unsigned short", "unsigned short int", "unsigned", "unsigned int", "unsigned long", "unsigned long int", "unsigned long long", "unsigned long long int"
                return true
            else
                return false
    else
        return type.type is "primitive" and @isUnsignedType(type.name)
    return

CRuntime::isIntegerType = (type) ->
    if typeof type is "string"
        switch type
            when "char", "signed char", "unsigned char", "short", "short int", "signed short", "signed short int", "unsigned short", "unsigned short int", "int", "signed int", "unsigned", "unsigned int", "long", "long int", "long int", "signed long", "signed long int", "unsigned long", "unsigned long int", "long long", "long long int", "long long int", "signed long long", "signed long long int", "unsigned long long", "unsigned long long int"
                return true
            else
                return false
    else
        return type.type is "primitive" and @isIntegerType(type.name)
    return

CRuntime::isFloatType = (type) ->
    if typeof type is "string"
        switch type
            when "float", "double"
                return true
            else
                return false
    else
        return type.type is "primitive" and @isFloatType(type.name)
    return

CRuntime::getSignedType = (type) ->
    if type isnt "unsigned"
        @primitiveType type.name.replace("unsigned", "").trim()
    else
        @primitiveType "int"

CRuntime::castable = (type1, type2) ->
    if @isTypeEqualTo(type1, type2)
        return true
    if @isPrimitiveType(type1) and @isPrimitiveType(type2)
        return @isNumericType(type2) or !@isNumericType(type1)
    else if @isPointerType(type1) and @isPointerType(type2)
        if @isFunctionType(type1)
            return @isPointerType(type2)
        return !@isFunctionType(type2)
    else if @isClassType(type1) or @isClassType(type2)
        @raiseException "not implemented"
    false

CRuntime::cast = (type, value) ->
    # TODO: looking for global overload
    if @isTypeEqualTo(value.t, type)
        return value
    if @isPrimitiveType(type) and @isPrimitiveType(value.t)
        if type.name is "bool"
            return @val(type, if value.v then true else false)
        else if type.name of [
                "float"
                "double"
            ]
            if !@isNumericType(value.t)
                @raiseException "cannot cast " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
            if @inrange(type, value.v)
                return @val(type, value.v)
            else
                @raiseException "overflow when casting " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
        else
            if type.name.slice(0, 8) is "unsigned"
                if !@isNumericType(value.t)
                    @raiseException "cannot cast " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
                else if value.v < 0
                    @raiseException "cannot cast negative value to " + @makeTypeString(type)
            if !@isNumericType(value.t)
                @raiseException "cannot cast " + @makeTypeString(value.t) + " to " + @makeTypeString(type)
            if value.t.name is "float" or value.t.name is "double"
                v = if value.v > 0 then Math.floor(value.v) else Math.ceil(value.v)
                if @inrange(type, v)
                    return @val(type, v)
                else
                    @raiseException "overflow when casting " + value.v + "(" + @makeTypeString(value.t) + ") to " + @makeTypeString(type)
            else
                if @inrange(type, value.v)
                    return @val(type, value.v)
                else
                    @raiseException "overflow when casting " + value.v + "(" + @makeTypeString(value.t) + ") to " + @makeTypeString(type)
    else if @isPointerType(type)
        if @isFunctionType(type)
            if @isFunctionType(value.t)
                return @val(value.t, value.v)
            else
                @raiseException "cannot cast a regular pointer to a function"
        else if @isArrayType(value.t)
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
    else if @isClassType(type)
        @raiseException "not implemented"
    else if @isClassType(value.t)
        if @isTypeEqualTo(@boolTypeLiteral, type)
            return @val(@boolTypeLiteral, true)
        else
            @raiseException "not implemented"
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
    if @isNumericType(type) and !@inrange(type, v)
        @raiseException "overflow of " + @makeValString(
            t: type
            v: v)
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
                            if @isTypeEqualTo(type1.retType, type2.retType) and type1.sigiture.length is type2.sigiture.length
                                _this = this
                                return type1.sigiture.every((type, index, arr) ->
                                    _this.isTypeEqualTo type, type2.sigiture[index]
                                )
                        when "normal"
                            return @isTypeEqualTo(type1.targetType, type2.eleType or type2.targetType)
    false

CRuntime::isBoolType = (type) ->
    if typeof type is "string"
        type is "bool"
    else
        type.type is "primitive" and @isBoolType(type.name)

CRuntime::isPrimitiveType = (type) ->
    @isNumericType(type) or @isBoolType(type)

CRuntime::isArrayType = (type) ->
    @isPointerType(type) and type.ptrType is "array"

CRuntime::isFunctionType = (type) ->
    @isPointerType(type) and type.ptrType is "function"

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

CRuntime::functionPointerType = (retType, sigiture) ->
    type: "pointer"
    ptrType: "function"
    retType: retType
    sigiture: sigiture

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
    if @isPrimitiveType(type)
        return @primitiveType(type)
    else
        clsType = 
            type: "class"
            name: type
        if @getTypeSigniture(clsType) of @types
            return clsType
        else
            @raiseException "type " + @makeTypeString(type) + " is not defined"
    return

CRuntime::newClass = (classname, members) ->
    clsType = 
        type: "class"
        name: classname
    sig = @getTypeSigniture(clsType)
    if sig of @types
        @raiseException @makeTypeString(clsType) + " is already defined"
    @types[sig] = "#constructor": (rt, _this, initMembers) ->
        _this.v.members = {}
        i = 0
        while i < members.length
            member = members[i]
            _this.v.members[member.name] = initMembers[member.name]
            i++
        return
    clsType

CRuntime::primitiveType = (type) ->
    type: "primitive"
    name: type

CRuntime::isStringType = (type) ->
    @isArrayType(type) and @isTypeEqualTo(type.eleType, @charTypeLiteral)

CRuntime::getStringFromCharArray = (element) ->
    if @isStringType(element.t)
        target = element.v.target
        result = ""
        i = 0
        while i < target.length
            charVal = this.cast(this.charTypeLiteral, target[i])
            if charVal.v is 0
                break
            result += String.fromCharCode(charVal.v)
            i++
        return result
    else
        @raiseException "target is not a string"
    return

CRuntime::makeCharArrayFromString = (str) ->
    self = this
    type = @arrayPointerType(@charTypeLiteral, str.length + 1)
    trailingZero = @val(@charTypeLiteral, 0)
    @val type,
        target: str.split("").map((c) ->
            self.val self.charTypeLiteral, c.charCodeAt(0)
        ).concat([ trailingZero ])
        position: 0

CRuntime::getTypeSigniture = (type) ->
    # (primitive), [class], {pointer}
    ret = type
    self = this
    if type.type is "primitive"
        ret = "(" + type.name + ")"
    else if type.type is "class"
        ret = "[" + type.name + "]"
    else if type.type is "pointer"
        # !targetType, @size!eleType, #retType!param1,param2,...
        ret = "{"
        if type.ptrType is "normal"
            ret += "!" + @getTypeSigniture(type.targetType)
        else if type.ptrType is "array"
            ret += "!" + @getTypeSigniture(type.eleType)
        else if type.ptrType is "function"
            ret += "#" + @getTypeSigniture(type.retType) + "!" + type.sigiture.map((e) ->
                @getTypeSigniture e
            ).join(",")
        ret += "}"
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
            ret += @makeTypeString(type.retType) + "(" + type.sigiture.map((e) ->
                @makeTypeString e
            ).join(",") + ")"
    ret

CRuntime::defaultValue = (type) ->
    if type.type is "primitive"
        if @isNumericType(type)
            return @val(type, 0)
        else if type.name is "bool"
            return @val(type, false)
    else if type.type is "class"
        @raiseException "no default value for object"
    else if type.type is "pointer"
        if type.ptrType is "normal"
            return @val(type, @nullPointerValue)
        else if type.ptrType is "array"
            return @val(type, @makeArrayPointerValue(null, 0))
        else if type.ptrType is "function"
            return @val(type, @makeFunctionPointerValue(null, null, null, null, null))
    return

CRuntime::raiseException = (message) ->
    interp = @interp
    if interp
        ln = interp.currentNode?.sLine or "unknown"
        col = interp.currentNode?.sColumn or "unknown"
        throw ln + ":" + col + " " + message
    else
        throw message
    return

module.exports = CRuntime
