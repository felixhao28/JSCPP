diffpatch = require('jsondiffpatch').create(null)

jsoncopy = (rt) ->
    target =
        scope: rt.scope
        debugOutput: rt.debugOutput
    replacer = (key, value) ->
        if typeof value is "object" and "t" of value and "v" of value
                t: value.t
                v: value.v
        else
            value

    JSON.parse JSON.stringify target, replacer


Interpreter = (rt) ->
    @rt = rt
    @snapshots = []
    if rt.config.debug
        rt.config.debugger.snapshots = @snapshots
    @visitors =
        TranslationUnit: (interp, s, param) ->
            i = 0
            while i < s.ExternalDeclarations.length
                dec = s.ExternalDeclarations[i]
                interp.visit interp, dec
                i++
            return
        FunctionDefinition: (interp, s, param) ->
            scope = param.scope
            name = s.Declarator.left.Identifier
            basetype = interp.rt.simpleType(s.DeclarationSpecifiers.join(" "))
            pointer = s.Declarator.Pointer
            retType = interp.buildRecursivePointerType(pointer, basetype, 0)
            argTypes = []
            argNames = []
            if s.Declarator.right.length != 1
                interp.rt.raiseException "you cannot have " + s.Declarator.right.length + " parameter lists (1 expected)"
            ptl = undefined
            varargs = undefined
            if s.Declarator.right[0].type is "DirectDeclarator_modifier_ParameterTypeList"
                ptl = s.Declarator.right[0].ParameterTypeList
                varargs = ptl.varargs
            else if s.Declarator.right[0].type is "DirectDeclarator_modifier_IdentifierList" and s.Declarator.right[0].IdentifierList is null
                ptl = ParameterList: []
                varargs = false
            else
                interp.rt.raiseException "unacceptable argument list"
            i = 0
            while i < ptl.ParameterList.length
                _param = ptl.ParameterList[i]
                _pointer = _param.Declarator.Pointer
                _basetype = interp.rt.simpleType(_param.DeclarationSpecifiers.join(" "))
                _type = interp.buildRecursivePointerType(_pointer, _basetype, 0)
                _name = _param.Declarator.left.Identifier
                if _param.Declarator.right.length > 0
                    dimensions = []
                    j = 0
                    while j < _param.Declarator.right.length
                        dim = _param.Declarator.right[j]
                        if dim.type != "DirectDeclarator_modifier_array"
                            interp.rt.raiseException "unacceptable array initialization"
                        if dim.Expression != null
                            dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression, param)).v
                        else if j > 0
                            interp.rt.raiseException "multidimensional array must have bounds for all dimensions except the first"
                        else
                        dimensions.push dim
                        j++
                    _type = interp.arrayType(dimensions, 0, _type)
                argTypes.push _type
                argNames.push _name
                i++
            stat = s.CompoundStatement
            interp.rt.defFunc scope, name, retType, argTypes, argNames, stat, interp
            return
        Declaration: (interp, s, param) ->
            basetype = interp.rt.simpleType(s.DeclarationSpecifiers.join(" "))
            i = 0
            while i < s.InitDeclaratorList.length
                dec = s.InitDeclaratorList[i]
                pointer = dec.Declarator.Pointer
                type = interp.buildRecursivePointerType(pointer, basetype, 0)
                name = dec.Declarator.left.Identifier
                init = dec.Initializers
                if dec.Declarator.right.length > 0
                    dimensions = []
                    j = 0
                    while j < dec.Declarator.right.length
                        dim = dec.Declarator.right[j]
                        if dim.type != "DirectDeclarator_modifier_array"
                            interp.rt.raiseException "is interp really an array initialization?"
                        if dim.Expression != null
                            dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression, param)).v
                        else if j > 0
                            interp.rt.raiseException "multidimensional array must have bounds for all dimensions except the first"
                        else
                            if init.type is "Initializer_expr"
                                initializer = interp.visit(interp, init, param)
                                if interp.rt.isTypeEqualTo(type, interp.rt.charTypeLiteral) and interp.rt.isArrayType(initializer.t) and interp.rt.isTypeEqualTo(initializer.t.eleType, interp.rt.charTypeLiteral)
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
                                    interp.rt.raiseException "cannot initialize an array to " + interp.rt.makeValString(initializer)
                            else
                                dim = init.Initializers.length
                        dimensions.push dim
                        j++
                    init = interp.arrayInit(dimensions, init, 0, type, param)
                    interp.rt.defVar name, init.t, init
                else
                    if init is null
                        init = interp.rt.defaultValue(type)
                    else
                        init = interp.visit(interp, init.Expression)
                    interp.rt.defVar name, type, init
                i++
            return
        Initializer_expr: (interp, s, param) ->
            interp.visit interp, s.Expression, param
        Label_case: (interp, s, param) ->
            ce = interp.visit(interp, s.ConstantExpression)
            if param["switch"] is undefined
                interp.rt.raiseException "you cannot use case outside switch block"
            if param.scope is "SelectionStatement_switch_cs"
                return [
                    "switch"
                    interp.rt.cast(ce.t, param["switch"]).v is ce.v
                ]
            else
                interp.rt.raiseException "you can only use case directly in a switch block"
            return
        Label_default: (interp, s, param) ->
            if param["switch"] is undefined
                interp.rt.raiseException "you cannot use default outside switch block"
            if param.scope is "SelectionStatement_switch_cs"
                return [
                    "switch"
                    true
                ]
            else
                interp.rt.raiseException "you can only use default directly in a switch block"
            return
        CompoundStatement: (interp, s, param) ->
            stmts = s.Statements
            r = undefined
            i = undefined
            _scope = param.scope
            if param.scope is "SelectionStatement_switch"
                param.scope = "SelectionStatement_switch_cs"
                interp.rt.enterScope param.scope
                switchon = false
                i = 0
                while i < stmts.length
                    stmt = stmts[i]
                    if stmt.type is "Label_case" or stmt.type is "Label_default"
                        r = interp.visit(interp, stmt, param)
                        if r[1]
                            switchon = true
                    else if switchon
                        r = interp.visit(interp, stmt, param)
                        if r instanceof Array
                            return r
                    i++
                interp.rt.exitScope param.scope
                param.scope = _scope
            else
                param.scope = "CompoundStatement"
                interp.rt.enterScope param.scope
                for stmt in stmts
                    r = interp.visit(interp, stmt, param)
                    interp.recordSnapshot stmt
                    if r instanceof Array
                        return r
                interp.rt.exitScope param.scope
                param.scope = _scope
            return
        ExpressionStatement: (interp, s, param) ->
            if s.Expression?
                interp.visit interp, s.Expression, param
            return
        SelectionStatement_if: (interp, s, param) ->
            scope_bak = param.scope
            param.scope = "SelectionStatement_if"
            interp.rt.enterScope param.scope
            e = interp.visit(interp, s.Expression, param)
            ret = undefined
            if interp.rt.cast(interp.rt.boolTypeLiteral, e).v
                ret = interp.visit(interp, s.Statement, param)
            else if s.ElseStatement
                ret = interp.visit(interp, s.ElseStatement, param)
            interp.rt.exitScope param.scope
            param.scope = scope_bak
            ret
        SelectionStatement_switch: (interp, s, param) ->
            scope_bak = param.scope
            param.scope = "SelectionStatement_switch"
            interp.rt.enterScope param.scope
            e = interp.visit(interp, s.Expression, param)
            switch_bak = param["switch"]
            param["switch"] = e
            r = interp.visit(interp, s.Statement, param)
            param["switch"] = switch_bak
            ret = undefined
            if r instanceof Array
                if r[0] != "break"
                    ret = r
            interp.rt.exitScope param.scope
            param.scope = scope_bak
            ret
        IterationStatement_while: (interp, s, param) ->
            scope_bak = param.scope
            param.scope = "IterationStatement_while"
            interp.rt.enterScope param.scope
            while interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v
                r = interp.visit(interp, s.Statement, param)
                if r instanceof Array
                    switch r[0]
                        when "continue"
                            return
                        when "break"
                            return
                        when "return"
                            return r
            interp.rt.exitScope param.scope
            param.scope = scope_bak
            return
        IterationStatement_do: (interp, s, param) ->
            scope_bak = param.scope
            param.scope = "IterationStatement_do"
            interp.rt.enterScope param.scope
            loop
                r = parse(s.Statement)
                if r instanceof Array
                    switch r[0]
                        when "continue"
                            return
                        when "break"
                            return
                        when "return"
                            return r
                unless interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v
                    break
            interp.rt.exitScope param.scope
            param.scope = scope_bak
            return
        IterationStatement_for: (interp, s, param) ->
            scope_bak = param.scope
            param.scope = "IterationStatement_for"
            interp.rt.enterScope param.scope
            if s.Initializer
                if s.Initializer.type is "Declaration"
                    interp.visit interp, s.Initializer, param
                else
                    interp.visit interp, s.Initializer, param
            while s.Expression is undefined or interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v
                r = interp.visit(interp, s.Statement, param)
                if r instanceof Array
                    switch r[0]
                        when "continue"
                            return
                        when "break"
                            return
                        when "return"
                            return r
                if s.Loop
                    interp.visit interp, s.Loop, param
            interp.rt.exitScope param.scope
            param.scope = scope_bak
            return
        JumpStatement_goto: (interp, s, param) ->
            interp.rt.raiseException "not implemented"
            return
        JumpStatement_continue: (interp, s, param) ->
            [ "continue" ]
        JumpStatement_break: (interp, s, param) ->
            [ "break" ]
        JumpStatement_return: (interp, s, param) ->
            if s.Expression
                ret = interp.visit(interp, s.Expression, param)
                return [
                    "return"
                    ret
                ]
            [ "return" ]
        IdentifierExpression: (interp, s, param) ->
            interp.rt.readVar s.Identifier
        ParenthesesExpression: (interp, s, param) ->
            interp.visit interp, s.Expression, param
        PostfixExpression_ArrayAccess: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            index = interp.visit(interp, s.index, param)
            interp.rt.getFunc(ret.t, "[]", [ index.t ]) interp.rt, ret, index
        PostfixExpression_MethodInvocation: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            s.args = s.args.map((e) ->
                interp.visit interp, e, param
            )
            interp.rt.getFunc(ret.t, "()", s.args.map((e) ->
                e.t
            )) interp.rt, ret, s.args
        PostfixExpression_MemberAccess: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.getMember ret, s.member
        PostfixExpression_MemberPointerAccess: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            member = undefined
            if interp.rt.isPointerType(ret.t) and !interp.rt.isFunctionType(ret.t)
                member = s.member
                interp.rt.getFunc(ret.t, "->", []) interp.rt, ret, member
            else
                member = interp.visit(interp, {
                    type: "IdentifierExpression"
                    Identifier: s.member
                }, param)
                interp.rt.getFunc(ret.t, "->", [ member.t ]) interp.rt, ret, member
        PostfixExpression_PostIncrement: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.rt.getFunc(ret.t, "++", [ "dummy" ]) interp.rt, ret,
                t: "dummy"
                v: null
        PostfixExpression_PostDecrement: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.rt.getFunc(ret.t, "--", [ "dummy" ]) interp.rt, ret,
                t: "dummy"
                v: null
        UnaryExpression_PreIncrement: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.rt.getFunc(ret.t, "++", []) interp.rt, ret
        UnaryExpression_PreDecrement: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.rt.getFunc(ret.t, "--", []) interp.rt, ret
        UnaryExpression: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.rt.getFunc(ret.t, s.op, []) interp.rt, ret
        UnaryExpression_Sizeof_Expr: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            interp.rt.val interp.rt.intTypeLiteral, interp.rt.getSize(ret)
        UnaryExpression_Sizeof_Type: (interp, s, param) ->
            type = interp.rt.simpleType(s.TypeName)
            interp.rt.val interp.rt.intTypeLiteral, interp.rt.getSizeByType(type)
        CastExpression: (interp, s, param) ->
            ret = interp.visit(interp, s.Expression, param)
            type = interp.rt.simpleType(s.TypeName)
            interp.rt.cast type, ret
        BinOpExpression: (interp, s, param) ->
            op = s.op
            if op is "&&"
                s.type = "LogicalANDExpression"
                interp.visit interp, s, param
            else if op is "||"
                s.type = "LogicalORExpression"
                interp.visit interp, s, param
            else
                left = interp.visit(interp, s.left, param)
                right = interp.visit(interp, s.right, param)
                interp.rt.getFunc(left.t, op, [ right.t ]) interp.rt, left, right
        LogicalANDExpression: (interp, s, param) ->
            left = interp.visit(interp, s.left, param)
            lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)]
            if "&&" of lt
                right = interp.visit(interp, s.right, param)
                interp.rt.getFunc(left.t, "&&", [ right.t ]) interp.rt, left, right
            else
                if interp.rt.cast(interp.rt.boolTypeLiteral, left).v
                    interp.visit interp, s.right, param
                else
                    left
        LogicalORExpression: (interp, s, param) ->
            left = interp.visit(interp, s.left, param)
            lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)]
            if "||" of lt
                right = interp.visit(interp, s.right, param)
                interp.rt.getFunc(left.t, "||", [ right.t ]) interp.rt, left, right
            else
                if interp.rt.cast(interp.rt.boolTypeLiteral, left).v
                    left
                else
                    interp.visit interp, s.right, param
        ConditionalExpression: (interp, s, param) ->
            cond = interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.cond, param)).v
            if cond then interp.visit(interp, s.t, param) else interp.visit(interp, s.f, param)
        ConstantExpression: (interp, s, param) ->
            interp.visit interp, s.Expression, param
        StringLiteralExpression: (interp, s, param) ->
            str = s.value
            interp.rt.makeCharArrayFromString str
        BooleanConstant: (interp, s, param) ->
            interp.rt.val interp.rt.boolTypeLiteral, s.value is "true"
        CharacterConstant: (interp, s, param) ->
            a = s.Char
            if a.length != 1
                interp.rt.raiseException "a character constant must have and only have one character."
            interp.rt.val interp.rt.charTypeLiteral, a[0].charCodeAt(0)
        FloatConstant: (interp, s, param) ->
            val = interp.visit(interp, s.Expression, param)
            interp.rt.val interp.rt.floatTypeLiteral, val.v
        DecimalConstant: (interp, s, param) ->
            interp.rt.val interp.rt.intTypeLiteral, parseInt(s.value, 10)
        HexConstant: (interp, s, param) ->
            interp.rt.val interp.rt.intTypeLiteral, parseInt(s.value, 16)
        DecimalFloatConstant: (interp, s, param) ->
            interp.rt.val interp.rt.doubleTypeLiteral, parseFloat(s.value)
        HexFloatConstant: (interp, s, param) ->
            interp.rt.val interp.rt.doubleTypeLiteral, parseFloat(s.value, 16)
        OctalConstant: (interp, s, param) ->
            interp.rt.val interp.rt.intTypeLiteral, parseInt(s.value, 8)
        NamespaceDefinition: (interp, s, param) ->
            interp.rt.raiseException "not implemented"
            return
        UsingDirective: (interp, s, param) ->
            id = s.Identifier
            #interp.rt.raiseException("not implemented");
            return
        UsingDeclaration: (interp, s, param) ->
            interp.rt.raiseException "not implemented"
            return
        NamespaceAliasDefinition: (interp, s, param) ->
            interp.rt.raiseException "not implemented"
            return
        unknown: (interp, s, param) ->
            interp.rt.raiseException "unhandled syntax " + s.type
            return
    return

Interpreter::visit = (interp, s, param) ->
    if "type" of s
        if param is undefined
            param = scope: "global"
        _node = @currentNode
        @currentNode = s
        if s.type of @visitors
            return @visitors[s.type](interp, s, param)
        else
            return @visitors["unknown"](interp, s, param)
        @currentNode = _node
    else
        @currentNode = s
        @rt.raiseException "untyped syntax structure"
    return

Interpreter::run = (tree) ->
    @rt.interp = this
    @visit this, tree

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
                    val = @rt.cast(type, @visit(this, init.Initializers[0].Expression, param))
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
                                shorthand: @visit(this, _init.Expression, param)
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
                    initializer = @visit(this, init, param)
                if @rt.isTypeEqualTo(type, @rt.charTypeLiteral) and @rt.isArrayType(initializer.t) and @rt.isTypeEqualTo(initializer.t.eleType, @rt.charTypeLiteral)
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
                    @rt.raiseException "cannot initialize an array to " + @rt.makeValString(initializer)
            else
                @rt.raiseException "dimensions do not agree, " + curDim + " != " + init.Initializers.length
        arr = []
        ret = @rt.val(@arrayType(dimensions, level, type), @rt.makeArrayPointerValue(arr, 0), true)
        i = 0
        while i < curDim
            if init and i < init.Initializers.length
                arr[i] = @arrayInit(dimensions, init.Initializers[i], level + 1, type, param)
            else
                arr[i] = @arrayInit(dimensions, null, level + 1, type, param)
            i++
        ret
    else
        if init and init.type != "Initializer_expr"
            @rt.raiseException "dimensions do not agree, too few initializers"
        initval
        if init
            if "shorthand" of init
                initval = init.shorthand
            else
                initval = @visit(this, init.Expression, param)
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

Interpreter::recordSnapshot = (stmt) ->
    if @rt.config.debug is true
        lastSnapshot = @snapshots[@snapshots.length-1] or {}
        currentSnapshot = jsoncopy(@rt)
        @snapshots.push
            stmt: stmt
            diff: diffpatch.diff(lastSnapshot, currentSnapshot)

module.exports = Interpreter