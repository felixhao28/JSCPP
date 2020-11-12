import { ArrayType, CRuntime, Variable, VariableType } from "./rt";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const sampleGeneratorFunction = function* (): Generator<null, void, void> {
    return yield null;
};

const sampleGenerator = sampleGeneratorFunction();

const isGenerator = (g: any) => {
    return (g != null ? g.constructor : undefined) === sampleGenerator.constructor;
};

const isGeneratorFunction = (f: any) => {
    return (f != null ? f.constructor : undefined) === sampleGeneratorFunction.constructor;
};

export class BaseInterpreter {
    rt: CRuntime;
    currentNode: any;
    source: string;
    constructor(rt: CRuntime) {
        this.rt = rt;
    }
}

function isIterable(obj: any) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export class Interpreter extends BaseInterpreter {
    visitors: { [name: string]: (interp: Interpreter, s: any, param?: any) => any };
    constructor(rt: CRuntime) {
        super(rt);
        this.visitors = {
            *TranslationUnit(interp, s, param) {
                ({
                    rt
                } = interp);
                let i = 0;
                while (i < s.ExternalDeclarations.length) {
                    const dec = s.ExternalDeclarations[i];
                    yield* interp.visit(interp, dec);
                    i++;
                }
            },
            *DirectDeclarator(interp, s, param) {
                ({
                    rt
                } = interp);
                let {
                    basetype
                } = param;
                basetype = interp.buildRecursivePointerType(s.Pointer, basetype, 0);
                if (s.right.length === 1) {
                    let varargs;
                    const right = s.right[0];
                    let ptl = null;
                    if (right.type === "DirectDeclarator_modifier_ParameterTypeList") {
                        ptl = right.ParameterTypeList;
                        ({
                            varargs
                        } = ptl);
                    } else if ((right.type === "DirectDeclarator_modifier_IdentifierList") && (right.IdentifierList === null)) {
                        ptl = right.ParameterTypeList;
                        varargs = false;
                    }
                    if (ptl != null) {
                        const argTypes = [];
                        for (const _param of ptl.ParameterList) {
                            const _basetype = rt.simpleType(_param.DeclarationSpecifiers);
                            let _type;
                            if (_param.Declarator != null) {
                                const _pointer = _param.Declarator.Pointer;
                                _type = interp.buildRecursivePointerType(_pointer, _basetype, 0);
                                if ((_param.Declarator.right != null) && (_param.Declarator.right.length > 0)) {
                                    const dimensions = [];
                                    for (let j = 0; j < _param.Declarator.right.length; j++) {
                                        let dim = _param.Declarator.right[j];
                                        if (dim.type !== "DirectDeclarator_modifier_array") {
                                            rt.raiseException("unacceptable array initialization", dim);
                                        }
                                        if (dim.Expression !== null) {
                                            dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
                                        } else if (j > 0) {
                                            rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
                                        } else {
                                            dim = -1;
                                        }
                                        dimensions.push(dim);
                                    }
                                    _type = interp.arrayType(dimensions, _type);
                                }
                            } else {
                                _type = _basetype;
                            }
                            argTypes.push(_type);
                        }
                        basetype = rt.functionType(basetype, argTypes);
                    }
                }
                if ((s.right.length > 0) && (s.right[0].type === "DirectDeclarator_modifier_array")) {
                    const dimensions = [];
                    for (let j = 0; j < s.right.length; j++) {
                        let dim = s.right[j];
                        if (dim.type !== "DirectDeclarator_modifier_array") {
                            rt.raiseException("unacceptable array initialization", dim);
                        }
                        if (dim.Expression !== null) {
                            dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
                        } else if (j > 0) {
                            rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
                        } else {
                            dim = -1;
                        }
                        dimensions.push(dim);
                    }
                    basetype = interp.arrayType(dimensions, basetype);
                }

                if (s.left.type === "Identifier") {
                    return { type: basetype, name: s.left.Identifier };
                } else {
                    const _basetype = param.basetype;
                    param.basetype = basetype;
                    const ret = yield* interp.visit(interp, s.left, param);
                    param.basetype = _basetype;
                    return ret;
                }
            },
            *TypedefDeclaration(interp, s, param) {
                ({
                    rt
                } = interp);
                const basetype = rt.simpleType(s.DeclarationSpecifiers);
                const _basetype = param.basetype;
                param.basetype = basetype;
                for (const declarator of s.Declarators) {
                    const { type, name } = yield* interp.visit(interp, declarator, param);
                    rt.registerTypedef(type, name);
                }
                param.basetype = _basetype;
            },
            *FunctionDefinition(interp, s, param) {
                ({
                    rt
                } = interp);
                const {
                    scope
                } = param;
                const name = s.Declarator.left.Identifier;
                let basetype = rt.simpleType(s.DeclarationSpecifiers);
                const pointer = s.Declarator.Pointer;
                basetype = interp.buildRecursivePointerType(pointer, basetype, 0);
                const argTypes = [];
                const argNames = [];
                const optionalArgs = [];
                let ptl;
                let varargs;
                if (s.Declarator.right.type === "DirectDeclarator_modifier_ParameterTypeList") {
                    ptl = s.Declarator.right.ParameterTypeList;
                    ({
                        varargs
                    } = ptl);
                } else if ((s.Declarator.right.type === "DirectDeclarator_modifier_IdentifierList") && (s.Declarator.right.IdentifierList === null)) {
                    ptl = { ParameterList: [] };
                    varargs = false;
                } else {
                    rt.raiseException("unacceptable argument list", s.Declarator.right);
                }
                let i = 0;
                while (i < ptl.ParameterList.length) {
                    const _param = ptl.ParameterList[i];
                    if ((_param.Declarator == null)) {
                        rt.raiseException("missing declarator for argument", _param);
                    }
                    const _init = _param.Declarator.Initializers;
                    const _pointer = _param.Declarator.Declarator.Pointer;
                    const _basetype = rt.simpleType(_param.DeclarationSpecifiers);
                    let _type = interp.buildRecursivePointerType(_pointer, _basetype, 0);
                    const _name = _param.Declarator.Declarator.left.Identifier;
                    if (_param.Declarator.Declarator.right.length > 0) {
                        const dimensions = [];
                        let j = 0;
                        while (j < _param.Declarator.Declarator.right.length) {
                            let dim = _param.Declarator.Declarator.right[j];
                            if (dim.type !== "DirectDeclarator_modifier_array") {
                                rt.raiseException("unacceptable array initialization", dim);
                            }
                            if (dim.Expression !== null) {
                                dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
                            } else if (j > 0) {
                                rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
                            } else {
                                dim = -1;
                            }
                            dimensions.push(dim);
                            j++;
                        }
                        _type = interp.arrayType(dimensions, _type);
                    }
                    if (_init != null) {
                        optionalArgs.push({
                            type: _type,
                            name: _name,
                            expression: _init.Expression
                        });
                    } else {
                        if (optionalArgs.length > 0) {
                            rt.raiseException("all default arguments must be at the end of arguments list", _param);
                        }
                        argTypes.push(_type);
                        argNames.push(_name);
                    }
                    i++;
                }
                const stat = s.CompoundStatement;
                rt.defFunc(scope, name, basetype, argTypes, argNames, stat, interp, optionalArgs);
            },
            *Declaration(interp, s, param) {
                ({
                    rt
                } = interp);
                const basetype = rt.simpleType(s.DeclarationSpecifiers);
                for (const dec of s.InitDeclaratorList) {
                    let init = dec.Initializers;
                    if ((dec.Declarator.right.length > 0) && (dec.Declarator.right[0].type === "DirectDeclarator_modifier_array")) {
                        const dimensions = [];
                        for (let j = 0; j < dec.Declarator.right.length; j++) {
                            let dim = dec.Declarator.right[j];
                            if (dim.Expression !== null) {
                                dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
                            } else if (j > 0) {
                                rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
                            } else {
                                if (init.type === "Initializer_expr") {
                                    const initializer: Variable = yield* interp.visit(interp, init, param);
                                    if (rt.isCharType(basetype) && rt.isArrayType(initializer) && rt.isCharType(initializer.t.eleType)) {
                                        // string init
                                        dim = initializer.v.target.length;
                                        init = {
                                            type: "Initializer_array",
                                            Initializers: initializer.v.target.map(e => ({
                                                type: "Initializer_expr",
                                                shorthand: e
                                            }))
                                        };
                                    } else {
                                        rt.raiseException("cannot initialize an array to " + rt.makeValString(initializer), init);
                                    }
                                } else {
                                    dim = init.Initializers.length;
                                }
                            }
                            dimensions.push(dim);
                        }
                        param.node = init;
                        init = yield* interp.arrayInit(dimensions, init, basetype, param);
                        delete param.node;
                        const _basetype = param.basetype;
                        param.basetype = basetype;
                        const { name, type } = yield* interp.visit(interp, dec.Declarator, param);
                        param.basetype = _basetype;
                        rt.defVar(name, init.t, init);
                    } else {
                        const _basetype = param.basetype;
                        param.basetype = basetype;
                        const { name, type } = yield* interp.visit(interp, dec.Declarator, param);
                        param.basetype = _basetype;
                        if ((init == null)) {
                            init = rt.defaultValue(type, true);
                        } else {
                            init = yield* interp.visit(interp, init.Expression);
                        }
                        rt.defVar(name, type, init);
                    }
                }
            },
            *Initializer_expr(interp, s, param) {
                ({
                    rt
                } = interp);
                return yield* interp.visit(interp, s.Expression, param);
            },
            *Label_case(interp, s, param) {
                ({
                    rt
                } = interp);
                const ce = yield* interp.visit(interp, s.ConstantExpression);
                if (param["switch"] === undefined) {
                    rt.raiseException("you cannot use case outside switch block");
                }
                if (param.scope === "SelectionStatement_switch_cs") {
                    return [
                        "switch",
                        rt.cast(ce.t, param["switch"]).v === ce.v
                    ];
                } else {
                    rt.raiseException("you can only use case directly in a switch block");
                }
            },
            Label_default(interp, s, param) {
                ({
                    rt
                } = interp);
                if (param["switch"] === undefined) {
                    rt.raiseException("you cannot use default outside switch block");
                }
                if (param.scope === "SelectionStatement_switch_cs") {
                    return [
                        "switch",
                        true
                    ];
                } else {
                    rt.raiseException("you can only use default directly in a switch block");
                }
            },
            *CompoundStatement(interp, s, param) {
                let stmt;
                ({
                    rt
                } = interp);
                const stmts = s.Statements;
                let r;
                let i;
                const _scope = param.scope;
                if (param.scope === "SelectionStatement_switch") {
                    param.scope = "SelectionStatement_switch_cs";
                    rt.enterScope(param.scope);
                    let switchon = false;
                    i = 0;
                    while (i < stmts.length) {
                        stmt = stmts[i];
                        if ((stmt.type === "Label_case") || (stmt.type === "Label_default")) {
                            r = yield* interp.visit(interp, stmt, param);
                            if (r[1]) {
                                switchon = true;
                            }
                        } else if (switchon) {
                            r = yield* interp.visit(interp, stmt, param);
                            if (r instanceof Array) {
                                return r;
                            }
                        }
                        i++;
                    }
                    rt.exitScope(param.scope);
                    param.scope = _scope;
                } else {
                    param.scope = "CompoundStatement";
                    rt.enterScope(param.scope);
                    for (stmt of stmts) {
                        r = yield* interp.visit(interp, stmt, param);
                        if (r instanceof Array) {
                            break;
                        }
                    }
                    rt.exitScope(param.scope);
                    param.scope = _scope;
                    return r;
                }
            },
            *ExpressionStatement(interp, s, param) {
                ({
                    rt
                } = interp);
                if (s.Expression != null) {
                    yield* interp.visit(interp, s.Expression, param);
                }
            },
            *SelectionStatement_if(interp, s, param) {
                ({
                    rt
                } = interp);
                const scope_bak = param.scope;
                param.scope = "SelectionStatement_if";
                rt.enterScope(param.scope);
                const e = yield* interp.visit(interp, s.Expression, param);
                let ret;
                if (rt.cast(rt.boolTypeLiteral, e).v) {
                    ret = yield* interp.visit(interp, s.Statement, param);
                } else if (s.ElseStatement) {
                    ret = yield* interp.visit(interp, s.ElseStatement, param);
                }
                rt.exitScope(param.scope);
                param.scope = scope_bak;
                return ret;
            },
            *SelectionStatement_switch(interp, s, param) {
                ({
                    rt
                } = interp);
                const scope_bak = param.scope;
                param.scope = "SelectionStatement_switch";
                rt.enterScope(param.scope);
                const e = yield* interp.visit(interp, s.Expression, param);
                const switch_bak = param["switch"];
                param["switch"] = e;
                const r = yield* interp.visit(interp, s.Statement, param);
                param["switch"] = switch_bak;
                let ret;
                if (r instanceof Array) {
                    if (r[0] !== "break") {
                        ret = r;
                    }
                }
                rt.exitScope(param.scope);
                param.scope = scope_bak;
                return ret;
            },
            *IterationStatement_while(interp, s, param) {
                let return_val;
                ({
                    rt
                } = interp);
                const scope_bak = param.scope;
                param.scope = "IterationStatement_while";
                rt.enterScope(param.scope);
                while (true) {
                    if (s.Expression != null) {
                        let cond = yield* interp.visit(interp, s.Expression, param);
                        cond = rt.cast(rt.boolTypeLiteral, cond).v;
                        if (!cond) { break; }
                    }
                    const r = yield* interp.visit(interp, s.Statement, param);
                    if (r instanceof Array) {
                        let end_loop;
                        switch (r[0]) {
                            case "continue":
                                break;
                            case "break":
                                end_loop = true;
                                break;
                            case "return":
                                return_val = r;
                                end_loop = true;
                                break;
                        }
                        if (end_loop) { break; }
                    }
                }
                rt.exitScope(param.scope);
                param.scope = scope_bak;
                return return_val;
            },
            *IterationStatement_do(interp, s, param) {
                let return_val;
                ({
                    rt
                } = interp);
                const scope_bak = param.scope;
                param.scope = "IterationStatement_do";
                rt.enterScope(param.scope);
                while (true) {
                    const r = yield* interp.visit(interp, s.Statement, param);
                    if (r instanceof Array) {
                        let end_loop;
                        switch (r[0]) {
                            case "continue":
                                break;
                            case "break":
                                end_loop = true;
                                break;
                            case "return":
                                return_val = r;
                                end_loop = true;
                                break;
                        }
                        if (end_loop) { break; }
                    }
                    if (s.Expression != null) {
                        let cond = yield* interp.visit(interp, s.Expression, param);
                        cond = rt.cast(rt.boolTypeLiteral, cond).v;
                        if (!cond) { break; }
                    }
                }
                rt.exitScope(param.scope);
                param.scope = scope_bak;
                return return_val;
            },
            *IterationStatement_for(interp, s, param) {
                let return_val;
                ({
                    rt
                } = interp);
                const scope_bak = param.scope;
                param.scope = "IterationStatement_for";
                rt.enterScope(param.scope);
                if (s.Initializer) {
                    if (s.Initializer.type === "Declaration") {
                        yield* interp.visit(interp, s.Initializer, param);
                    } else {
                        yield* interp.visit(interp, s.Initializer, param);
                    }
                }
                while (true) {
                    if (s.Expression != null) {
                        let cond = yield* interp.visit(interp, s.Expression, param);
                        cond = rt.cast(rt.boolTypeLiteral, cond).v;
                        if (!cond) { break; }
                    }
                    const r = yield* interp.visit(interp, s.Statement, param);
                    if (r instanceof Array) {
                        let end_loop;
                        switch (r[0]) {
                            case "continue":
                                break;
                            case "break":
                                end_loop = true;
                                break;
                            case "return":
                                return_val = r;
                                end_loop = true;
                                break;
                        }
                        if (end_loop) { break; }
                    }
                    if (s.Loop) {
                        yield* interp.visit(interp, s.Loop, param);
                    }
                }
                rt.exitScope(param.scope);
                param.scope = scope_bak;
                return return_val;
            },
            JumpStatement_goto(interp, s, param) {
                ({
                    rt
                } = interp);
                rt.raiseException("not implemented");
            },
            JumpStatement_continue(interp, s, param) {
                ({
                    rt
                } = interp);
                return ["continue"];
            },
            JumpStatement_break(interp, s, param) {
                ({
                    rt
                } = interp);
                return ["break"];
            },
            *JumpStatement_return(interp, s, param) {
                ({
                    rt
                } = interp);
                if (s.Expression) {
                    const ret = yield* interp.visit(interp, s.Expression, param);
                    return [
                        "return",
                        ret
                    ];
                }
                return ["return"];
            },
            IdentifierExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.readVar(s.Identifier);
            },
            *ParenthesesExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                return yield* interp.visit(interp, s.Expression, param);
            },
            *PostfixExpression_ArrayAccess(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const index = yield* interp.visit(interp, s.index, param);
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName("[]"), [index.t])(rt, ret, index);
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *PostfixExpression_MethodInvocation(interp, s, param) {
                let bindThis;
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                // console.log "==================="
                // console.log "s: " + JSON.stringify(s)
                // console.log "==================="
                const args: Variable[] = yield* (function* () {
                    const result = [];
                    for (const e of s.args) {
                        const thisArg = yield* interp.visit(interp, e, param);
                        // console.log "-------------------"
                        // console.log "e: " + JSON.stringify(e)
                        // console.log "-------------------"
                        result.push(thisArg);
                    }
                    return result;
                }).call(this);

                // console.log "==================="
                // console.log "ret: " + JSON.stringify(ret)
                // console.log "args: " + JSON.stringify(args)
                // console.log "==================="
                if (ret.v.bindThis != null) {
                    ({
                        bindThis
                    } = ret.v);
                } else {
                    bindThis = ret;
                }
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName("()"), args.map(e => e.t))(rt, ret, bindThis, ...args);
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *PostfixExpression_MemberAccess(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                return rt.getMember(ret, s.member);
            },
            *PostfixExpression_MemberPointerAccess(interp, s, param) {
                let r;
                ({
                    rt
                } = interp);
                let ret = yield* interp.visit(interp, s.Expression, param);
                if (rt.isPointerType(ret.t) && !rt.isFunctionType(ret.t)) {
                    const {
                        member
                    } = s;
                    ret = yield* rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [])(rt, ret);
                    return rt.getMember(ret, member);
                } else {
                    const member = yield* interp.visit(interp, {
                        type: "IdentifierExpression",
                        Identifier: s.member
                    }, param);
                    ret = yield* rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [member.t])(rt, ret);
                    return rt.getMember(ret, member);
                }
            },
            *PostfixExpression_PostIncrement(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName("++"), ["dummy"])(rt, ret, {
                    t: "dummy",
                    v: null
                }
                );
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *PostfixExpression_PostDecrement(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName("--"), ["dummy"])(rt, ret, {
                    t: "dummy",
                    v: null
                }
                );
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *UnaryExpression_PreIncrement(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName("++"), [])(rt, ret);
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *UnaryExpression_PreDecrement(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName("--"), [])(rt, ret);
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *UnaryExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const r = rt.getFunc(ret.t, rt.makeOperatorFuncName(s.op), [])(rt, ret);
                if (isGenerator(r)) {
                    return yield* r;
                } else {
                    return r;
                }
            },
            *UnaryExpression_Sizeof_Expr(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                return rt.val(rt.intTypeLiteral, rt.getSize(ret));
            },
            *UnaryExpression_Sizeof_Type(interp, s, param) {
                ({
                    rt
                } = interp);
                const type = yield* interp.visit(interp, s.TypeName, param);
                return rt.val(rt.intTypeLiteral, rt.getSizeByType(type));
            },
            *CastExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                const ret = yield* interp.visit(interp, s.Expression, param);
                const type = yield* interp.visit(interp, s.TypeName, param);
                return rt.cast(type, ret);
            },
            TypeName(interp, s, param) {
                ({
                    rt
                } = interp);
                const typename = [];
                for (const baseType of s.base) {
                    if (baseType !== "const") {
                        typename.push(baseType);
                    }
                }
                return rt.simpleType(typename);
            },
            *BinOpExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                const {
                    op
                } = s;
                if (op === "&&") {
                    s.type = "LogicalANDExpression";
                    return yield* interp.visit(interp, s, param);
                } else if (op === "||") {
                    s.type = "LogicalORExpression";
                    return yield* interp.visit(interp, s, param);
                } else {
                    // console.log "==================="
                    // console.log "s.left: " + JSON.stringify(s.left)
                    // console.log "s.right: " + JSON.stringify(s.right)
                    // console.log "==================="
                    const left = yield* interp.visit(interp, s.left, param);
                    const right = yield* interp.visit(interp, s.right, param);
                    // console.log "==================="
                    // console.log "left: " + JSON.stringify(left)
                    // console.log "right: " + JSON.stringify(right)
                    // console.log "==================="
                    const r = rt.getFunc(left.t, rt.makeOperatorFuncName(op), [right.t])(rt, left, right);
                    if (isGenerator(r)) {
                        return yield* r;
                    } else {
                        return r;
                    }
                }
            },
            *LogicalANDExpression(interp, s, param) {
                let right;
                ({
                    rt
                } = interp);
                const left = yield* interp.visit(interp, s.left, param);
                const lt = rt.types[rt.getTypeSignature(left.t)];
                if ("&&" in lt) {
                    right = yield* interp.visit(interp, s.right, param);
                    const r = rt.getFunc(left.t, rt.makeOperatorFuncName("&&"), [right.t])(rt, left, right);
                    if (isGenerator(r)) {
                        return yield* r;
                    } else {
                        return r;
                    }
                } else {
                    if (rt.cast(rt.boolTypeLiteral, left).v) {
                        return yield* interp.visit(interp, s.right, param);
                    } else {
                        return left;
                    }
                }
            },
            *LogicalORExpression(interp, s, param) {
                let right;
                ({
                    rt
                } = interp);
                const left = yield* interp.visit(interp, s.left, param);
                const lt = rt.types[rt.getTypeSignature(left.t)];
                if ("||" in lt) {
                    right = yield* interp.visit(interp, s.right, param);
                    const r = rt.getFunc(left.t, rt.makeOperatorFuncName("||"), [right.t])(rt, left, right);
                    if (isGenerator(r)) {
                        return yield* r;
                    } else {
                        return r;
                    }
                } else {
                    if (rt.cast(rt.boolTypeLiteral, left).v) {
                        return left;
                    } else {
                        return yield* interp.visit(interp, s.right, param);
                    }
                }
            },
            *ConditionalExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                const cond = rt.cast(rt.boolTypeLiteral, (yield* interp.visit(interp, s.cond, param))).v;
                if (cond) { return yield* interp.visit(interp, s.t, param); } else { return yield* interp.visit(interp, s.f, param); }
            },
            *ConstantExpression(interp, s, param) {
                ({
                    rt
                } = interp);
                return yield* interp.visit(interp, s.Expression, param);
            },
            *StringLiteralExpression(interp, s, param) {
                return yield* interp.visit(interp, s.value, param);
            },
            StringLiteral(interp, s, param) {
                ({
                    rt
                } = interp);
                switch (s.prefix) {
                    case null:
                        let maxCode = -1;
                        let minCode = 1;
                        for (const i of s.value) {
                            const code = i.charCodeAt(0);
                            if (maxCode < code) { maxCode = code; }
                            if (minCode > code) { minCode = code; }
                        }
                        const {
                            limits
                        } = rt.config;
                        const typeName =
                            (maxCode <= limits["char"].max) && (minCode >= limits["char"].min) ?
                                "char"
                                :
                                "wchar_t";
                        return rt.makeCharArrayFromString(s.value, typeName);
                    case "L":
                        return rt.makeCharArrayFromString(s.value, "wchar_t");
                    case "u8":
                        return rt.makeCharArrayFromString(s.value, "char");
                    case "u":
                        return rt.makeCharArrayFromString(s.value, "char16_t");
                    case "U":
                        return rt.makeCharArrayFromString(s.value, "char32_t");
                }
            },
            BooleanConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.boolTypeLiteral, s.value === "true" ? 1 : 0);
            },
            CharacterConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                const a = s.Char;
                if (a.length !== 1) {
                    rt.raiseException("a character constant must have and only have one character.");
                }
                return rt.val(rt.charTypeLiteral, a[0].charCodeAt(0));
            },
            *FloatConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                const val = yield* interp.visit(interp, s.Expression, param);
                return rt.val(rt.floatTypeLiteral, val.v);
            },
            DecimalConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 10));
            },
            HexConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 16));
            },
            BinaryConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 2));
            },
            DecimalFloatConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.doubleTypeLiteral, parseFloat(s.value));
            },
            HexFloatConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.doubleTypeLiteral, parseInt(s.value, 16));
            },
            OctalConstant(interp, s, param) {
                ({
                    rt
                } = interp);
                return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 8));
            },
            NamespaceDefinition(interp, s, param) {
                ({
                    rt
                } = interp);
                rt.raiseException("not implemented");
            },
            UsingDirective(interp, s, param) {
                ({
                    rt
                } = interp);
                const id = s.Identifier;
                // rt.raiseException("not implemented");
            },
            UsingDeclaration(interp, s, param) {
                ({
                    rt
                } = interp);
                rt.raiseException("not implemented");
            },
            NamespaceAliasDefinition(interp, s, param) {
                ({
                    rt
                } = interp);
                rt.raiseException("not implemented");
            },
            unknown(interp, s, param) {
                ({
                    rt
                } = interp);
                rt.raiseException("unhandled syntax " + s.type);
            }
        };
    }

    *visit(interp: Interpreter, s: any, param?: any) {
        let ret;
        const {
            rt
        } = interp;
        // console.log(`${s.sLine}: visiting ${s.type}`);
        if ("type" in s) {
            if (param === undefined) {
                param = { scope: "global" };
            }
            const _node = this.currentNode;
            this.currentNode = s;
            if (s.type in this.visitors) {
                const f = this.visitors[s.type];
                if (isGeneratorFunction(f)) {
                    const x = f(interp, s, param);
                    if (x != null) {
                        if (isIterable(x)) {
                            ret = yield* x;
                        } else {
                            ret = yield x;
                        }
                    } else {
                        ret = yield null;
                    }
                } else {
                    yield (ret = f(interp, s, param));
                }
            } else {
                ret = this.visitors["unknown"](interp, s, param);
            }
            this.currentNode = _node;
        } else {
            this.currentNode = s;
            this.rt.raiseException("untyped syntax structure");
        }
        return ret;
    };

    *run(tree: any, source: string, param?: any) {
        this.rt.interp = this;
        this.source = source;
        return yield* this.visit(this, tree, param);
    };

    *arrayInit(dimensions: number[], init: any, type: VariableType, param: any): Generator<void, Variable, any> {
        if (dimensions.length > 0) {
            let val;
            const curDim = dimensions[0];
            if (init) {
                if ((init.type === "Initializer_array") && (init.Initializers != null && curDim >= init.Initializers.length)) {
                    // last level, short hand init
                    if (init.Initializers.length === 0) {
                        const arr = new Array(curDim);
                        let i = 0;
                        while (i < curDim) {
                            arr[i] = {
                                type: "Initializer_expr",
                                shorthand: this.rt.defaultValue(type)
                            };
                            i++;
                        }
                        init.Initializers = arr;
                    } else if ((init.Initializers.length === 1) && this.rt.isIntegerType(type)) {
                        val = this.rt.cast(type, (yield* this.visit(this, init.Initializers[0].Expression, param)));
                        if ((val.v === -1) || (val.v === 0)) {
                            const arr = new Array(curDim);
                            let i = 0;
                            while (i < curDim) {
                                arr[i] = {
                                    type: "Initializer_expr",
                                    shorthand: this.rt.val(type, val.v)
                                };
                                i++;
                            }
                            init.Initializers = arr;
                        } else {
                            const arr = new Array(curDim);
                            arr[0] = this.rt.val(type, -1);
                            let i = 1;
                            while (i < curDim) {
                                arr[i] = {
                                    type: "Initializer_expr",
                                    shorthand: this.rt.defaultValue(type)
                                };
                                i++;
                            }
                            init.Initializers = arr;
                        }
                    } else {
                        const arr = new Array(curDim);
                        let i = 0;
                        while (i < init.Initializers.length) {
                            const _init = init.Initializers[i];
                            let initval;
                            if ("shorthand" in _init) {
                                initval = _init;
                            } else {
                                if (_init.type === "Initializer_expr") {
                                    initval = {
                                        type: "Initializer_expr",
                                        shorthand: (yield* this.visit(this, _init.Expression, param))
                                    };
                                } else if (_init.type === "Initializer_array") {
                                    initval = {
                                        type: "Initializer_expr",
                                        shorthand: (yield* this.arrayInit(dimensions.slice(1), _init, type, param))
                                    };
                                } else {
                                    this.rt.raiseException("Not implemented initializer type: " + _init.type);
                                }
                            }
                            arr[i] = initval;
                            i++;
                        }
                        i = init.Initializers.length;
                        while (i < curDim) {
                            arr[i] = {
                                type: "Initializer_expr",
                                shorthand: this.rt.defaultValue(this.arrayType(dimensions.slice(1), type))
                            };
                            i++;
                        }
                        init.Initializers = arr;
                    }
                } else if (init.type === "Initializer_expr") {
                    let initializer: Variable;
                    if ("shorthand" in init) {
                        initializer = init.shorthand;
                    } else {
                        initializer = yield* this.visit(this, init, param);
                    }
                    if (this.rt.isArrayType(initializer) && this.rt.isTypeEqualTo(type, initializer.t.eleType)) {
                        init = {
                            type: "Initializer_array",
                            Initializers: initializer.v.target.map(e => ({
                                type: "Initializer_expr",
                                shorthand: e
                            }))
                        };
                    } else {
                        this.rt.raiseException("cannot initialize an array to " + this.rt.makeValString(initializer), param.node);
                    }
                } else {
                    this.rt.raiseException("dimensions do not agree, " + curDim + " != " + init.Initializers.length, param.node);
                }
            }
            {
                const arr: Variable[] = [];
                const ret = this.rt.val(this.arrayType(dimensions, type), this.rt.makeArrayPointerValue(arr, 0), true);
                let i = 0;
                while (i < curDim) {
                    if (init && (i < init.Initializers.length)) {
                        arr[i] = yield* this.arrayInit(dimensions.slice(1), init.Initializers[i], type, param);
                    } else {
                        arr[i] = yield* this.arrayInit(dimensions.slice(1), null, type, param);
                    }
                    i++;
                }
                return ret;
            }
        } else {
            if (init && (init.type !== "Initializer_expr")) {
                this.rt.raiseException("dimensions do not agree, too few initializers", param.node);
            }
            let initval;
            if (init) {
                if ("shorthand" in init) {
                    initval = init.shorthand;
                } else {
                    initval = yield* this.visit(this, init.Expression, param);
                }
            } else {
                initval = this.rt.defaultValue(type);
            }
            const ret = this.rt.cast(this.arrayType(dimensions, type), initval);
            ret.left = true;
            return ret;
        }
    };

    arrayType(dimensions: number[], type: any): ArrayType {
        if (dimensions.length > 0) {
            return this.rt.arrayPointerType(this.arrayType(dimensions.slice(1), type), dimensions[0]);
        } else {
            return type;
        }
    };

    buildRecursivePointerType(pointer: any, basetype: VariableType, level: number): VariableType {
        if (pointer && (pointer.length > level)) {
            const type = this.rt.normalPointerType(basetype);
            return this.buildRecursivePointerType(pointer, type, level + 1);
        } else {
            return basetype;
        }
    };

}
