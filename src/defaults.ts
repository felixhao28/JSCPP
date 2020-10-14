import { CRuntime, CCharType, CFloatType, CIntType, JSCPPConfig, TypeSignature, Variable, OpHandlerMap, CBasicType, BasicValue, ArrayElementVariable } from "./rt";

export const config: JSCPPConfig = {
    specifiers: ["const", "inline", "_stdcall", "extern", "static", "auto", "register"],
    charTypes: ["char", "signed char", "unsigned char", "wchar_t",
        "unsigned wchar_t", "char16_t", "unsigned char16_t",
        "char32_t", "unsigned char32_t"],
    intTypes: ["short", "short int", "signed short", "signed short int",
        "unsigned short", "unsigned short int", "int", "signed int",
        "unsigned", "unsigned int", "long", "long int", "long int",
        "signed long", "signed long int", "unsigned long",
        "unsigned long int", "long long", "long long int",
        "long long int", "signed long long", "signed long long int",
        "unsigned long long", "unsigned long long int", "bool"],
    limits: {
        "char": {
            max: 0x7f,
            min: 0x00,
            bytes: 1
        },
        "signed char": {
            max: 0x7f,
            min: -0x80,
            bytes: 1
        },
        "unsigned char": {
            max: 0xff,
            min: 0x00,
            bytes: 1
        },
        "wchar_t": {
            max: 0x7fffffff,
            min: -0x80000000,
            bytes: 4
        },
        "unsigned wchar_t": {
            max: 0xffffffff,
            min: 0x00000000,
            bytes: 4
        },
        "char16_t": {
            max: 0x7fff,
            min: -0x8000,
            bytes: 4
        },
        "unsigned char16_t": {
            max: 0xffff,
            min: 0x0000,
            bytes: 4
        },
        "char32_t": {
            max: 0x7fffffff,
            min: -0x80000000,
            bytes: 4
        },
        "unsigned char32_t": {
            max: 0xffffffff,
            min: 0x00000000,
            bytes: 4
        },
        "short": {
            max: 0x7fff,
            min: -0x8000,
            bytes: 2
        },
        "unsigned short": {
            max: 0xffff,
            min: 0x0000,
            bytes: 2
        },
        "int": {
            max: 0x7fffffff,
            min: -0x80000000,
            bytes: 4
        },
        "unsigned": {
            max: 0xffffffff,
            min: 0x00000000,
            bytes: 4
        },
        "long": {
            max: 0x7fffffff,
            min: -0x80000000,
            bytes: 4
        },
        "unsigned long": {
            max: 0xffffffff,
            min: 0x00000000,
            bytes: 4
        },
        "long long": {
            max: 0x7fffffffffffffff,
            min: -0x8000000000000000,
            bytes: 8
        },
        "unsigned long long": {
            max: 0xffffffffffffffff,
            min: 0x0000000000000000,
            bytes: 8
        },
        "float": {
            max: 3.40282346638529e+038,
            min: -3.40282346638529e+038,
            bytes: 4
        },
        "double": {
            max: 1.79769313486232e+308,
            min: -1.79769313486232e+308,
            bytes: 8
        },
        "pointer": {
            max: undefined,
            min: undefined,
            bytes: 4
        },
        "bool": {
            max: 1,
            min: 0,
            bytes: 1
        }
    },
    loadedLibraries: []
};
config.limits["short int"] = config.limits["short"];
config.limits["signed short"] = config.limits["short"];
config.limits["signed short int"] = config.limits["short"];
config.limits["unsigned short int"] = config.limits["unsigned short"];
config.limits["signed int"] = config.limits["int"];
config.limits["unsigned int"] = config.limits["unsigned"];
config.limits["long int"] = config.limits["long"];
config.limits["long int"] = config.limits["long"];
config.limits["signed long"] = config.limits["long"];
config.limits["signed long int"] = config.limits["long"];
config.limits["unsigned long int"] = config.limits["unsigned long"];
config.limits["long long int"] = config.limits["long long"];
config.limits["long long int"] = config.limits["long long"];
config.limits["signed long long"] = config.limits["long long"];
config.limits["signed long long int"] = config.limits["long long"];
config.limits["unsigned long long int"] = config.limits["unsigned long long"];

export const numericTypeOrder: (CCharType | CIntType | CFloatType)[] = [
    "char",
    "signed char",
    "short",
    "short int",
    "signed short",
    "signed short int",
    "int",
    "signed int",
    "long",
    "long int",
    "long int",
    "signed long",
    "signed long int",
    "long long",
    "long long int",
    "long long int",
    "signed long long",
    "signed long long int",
    "float",
    "double"
];

const defaultOpHandler: OpHandlerMap = {
    handlers: {
        "o(*)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support * on " + rt.makeTypeString(r.t));
                } else if (!rt.isNumericType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support * on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) * rt.booleanToNumber(r.v);
                    const rett = rt.promoteNumeric(l.t, r.t);
                    return rt.val(rett, ret);
                }
            }
        },
        "o(/)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support / on " + rt.makeTypeString(r.t));
                } else if (!rt.isNumericType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support / on " + rt.makeTypeString(r.t));
                } else {
                    let ret = rt.booleanToNumber(l.v) / rt.booleanToNumber(r.v);
                    if (rt.isIntegerType(l.t) && rt.isIntegerType(r.t)) {
                        ret = Math.floor(ret);
                    }
                    const rett = rt.promoteNumeric(l.t, r.t);
                    return rt.val(rett, ret);
                }
            }
        },
        "o(%)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r) || !rt.isIntegerType(l) || !rt.isIntegerType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support % on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) % rt.booleanToNumber(r.v);
                    const rett = rt.promoteNumeric(l.t, r.t);
                    return rt.val(rett, ret);
                }
            }
        },
        "o(+)": {
            default(rt, l, r) {
                if (r === undefined) {
                    // unary
                    return l;
                } else {
                    if (rt.isArrayType(r)) {
                        const i = rt.cast(rt.intTypeLiteral, l).v;
                        return rt.val(r.t, rt.makeArrayPointerValue(r.v.target, r.v.position + i));
                    } else if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                        rt.raiseException(rt.makeTypeString(l.t) + " does not support + on " + rt.makeTypeString(r.t));
                    } else {
                        const ret = rt.booleanToNumber(l.v) + rt.booleanToNumber(r.v);
                        const rett = rt.promoteNumeric(l.t, r.t);
                        return rt.val(rett, ret);
                    }
                }
            }
        },
        "o(-)": {
            default(rt, l, r) {
                let rett;
                if (r === undefined) {
                    // unary
                    rett = l.v > 0 ? rt.getSignedType(l.t) : l.t;
                    return rt.val(rett, -l.v);
                } else {
                    // binary
                    if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                        rt.raiseException(rt.makeTypeString(l.t) + " does not support - on " + rt.makeTypeString(r.t));
                    } else {
                        const ret = rt.booleanToNumber(l.v) - rt.booleanToNumber(r.v);
                        rett = rt.promoteNumeric(l.t, r.t);
                        return rt.val(rett, ret);
                    }
                }
            }
        },
        "o(<<)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r) || !rt.isIntegerType(l) || !rt.isIntegerType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support << on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) << rt.booleanToNumber(r.v);
                    const rett = l.t;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(>>)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r) || !rt.isIntegerType(l) || !rt.isIntegerType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support >> on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) >> rt.booleanToNumber(r.v);
                    const rett = l.t;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(<)": {
            default(rt, l, r) {
                if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support < on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) < rt.booleanToNumber(r.v);
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(<=)": {
            default(rt, l, r) {
                if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support <= on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) <= rt.booleanToNumber(r.v);
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(>)": {
            default(rt, l, r) {
                if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support > on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) > rt.booleanToNumber(r.v);
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(>=)": {
            default(rt, l, r) {
                if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support >= on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) >= rt.booleanToNumber(r.v);
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(==)": {
            default(rt, l, r) {
                if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support == on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) === rt.booleanToNumber(r.v);
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(!=)": {
            default(rt, l, r) {
                if (!rt.isNumericType(l) || !rt.isNumericType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support != on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) !== rt.booleanToNumber(r.v);
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                }
            }
        },
        "o(&)": {
            default(rt, l, r) {
                let t;
                if (r === undefined) {
                    if ("array" in l) {
                        return rt.val(rt.arrayPointerType(l.t, l.array.length), rt.makeArrayPointerValue(l.array, l.arrayIndex));
                    } else {
                        t = rt.normalPointerType(l.t);
                        return rt.val(t, rt.makeNormalPointerValue(l));
                    }
                } else {
                    if (!rt.isIntegerType(l) || !rt.isNumericType(r) || !rt.isIntegerType(r)) {
                        rt.raiseException(rt.makeTypeString(l.t) + " does not support & on " + rt.makeTypeString(r.t));
                    } else {
                        const ret = rt.booleanToNumber(l.v) & rt.booleanToNumber(r.v);
                        const rett = rt.promoteNumeric(l.t, r.t);
                        return rt.val(rett, ret);
                    }
                }
            }
        },
        "o(^)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r) || !rt.isIntegerType(l) || !rt.isIntegerType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support ^ on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) ^ rt.booleanToNumber(r.v);
                    const rett = rt.promoteNumeric(l.t, r.t);
                    return rt.val(rett, ret);
                }
            }
        },
        "o(|)": {
            default(rt, l, r) {
                if (!rt.isNumericType(r) || !rt.isIntegerType(l) || !rt.isIntegerType(r)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support | on " + rt.makeTypeString(r.t));
                } else {
                    const ret = rt.booleanToNumber(l.v) | rt.booleanToNumber(r.v);
                    const rett = rt.promoteNumeric(l.t, r.t);
                    return rt.val(rett, ret);
                }
            }
        },
        "o(,)": {
            default(rt, l, r) {
                return r;
            }
        },
        "o(=)": {
            default(rt, l, r) {
                if (l.left) {
                    l.v = rt.cast(l.t, r).v;
                    return l;
                } else {
                    rt.raiseException(rt.makeValString(l) + " is not a left value");
                }
            }
        },
        "o(+=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(+)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(-=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(-)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(*=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(*)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(/=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(/)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(%=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(%)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(<<=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(<<)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(>>=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(>>)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(&=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(&)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(^=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(^)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(|=)": {
            default(rt, l, r) {
                r = defaultOpHandler.handlers["o(|)"].default(rt, l, r);
                return defaultOpHandler.handlers["o(=)"].default(rt, l, r);
            }
        },
        "o(++)": {
            default(rt, l, dummy) {
                if (!rt.isNumericType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support increment");
                } else if (!l.left) {
                    rt.raiseException(rt.makeValString(l) + " is not a left value");
                } else if (dummy) {
                    const b = l.v;
                    l.v = rt.booleanToNumber(l.v) + 1;
                    if (rt.inrange(l.t, l.v, `overflow during post-increment ${rt.makeValString(l)}`)) {
                        l.v = rt.ensureUnsigned(l.t, l.v);
                        return rt.val(l.t, b);
                    }
                } else {
                    l.v = rt.booleanToNumber(l.v) + 1;
                    if (rt.inrange(l.t, l.v, `overflow during pre-increment ${rt.makeValString(l)}`)) {
                        l.v = rt.ensureUnsigned(l.t, l.v);
                        return l;
                    }
                }
            }
        },
        "o(--)": {
            default(rt, l, dummy) {
                let b;
                if (!rt.isNumericType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support decrement");
                } else if (!l.left) {
                    rt.raiseException(rt.makeValString(l) + " is not a left value");
                } else if (dummy) {
                    b = l.v;
                    l.v = rt.booleanToNumber(l.v) - 1;
                    if (rt.inrange(l.t, l.v, "overflow during post-decrement")) {
                        l.v = rt.ensureUnsigned(l.t, l.v);
                        return rt.val(l.t, b);
                    }
                } else {
                    l.v = rt.booleanToNumber(l.v) - 1;
                    b = l.v;
                    if (rt.inrange(l.t, l.v, "overflow during pre-decrement")) {
                        l.v = rt.ensureUnsigned(l.t, l.v);
                        return l;
                    }
                }
            }
        },
        "o(~)": {
            default(rt, l, dummy) {
                if (!rt.isIntegerType(l.t)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support ~ on itself");
                }
                const ret = ~l.v;
                const rett = rt.promoteNumeric(l.t, rt.intTypeLiteral);
                return rt.val(rett, ret);
            }
        },
        "o(!)": {
            default(rt, l, dummy) {
                if (!rt.isIntegerType(l.t)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support ! on itself");
                }
                const ret = l.v ? 0 : 1;
                const rett = l.t;
                return rt.val(rett, ret);
            }
        }
    }
};

export const types: { [typeSignature: string]: OpHandlerMap } = {
    "global": {
        handlers: {},
    }
};
types["(char)"] = defaultOpHandler;
types["(signed char)"] = defaultOpHandler;
types["(unsigned char)"] = defaultOpHandler;
types["(short)"] = defaultOpHandler;
types["(short int)"] = defaultOpHandler;
types["(signed short)"] = defaultOpHandler;
types["(signed short int)"] = defaultOpHandler;
types["(unsigned short)"] = defaultOpHandler;
types["(unsigned short int)"] = defaultOpHandler;
types["(int)"] = defaultOpHandler;
types["(signed int)"] = defaultOpHandler;
types["(unsigned)"] = defaultOpHandler;
types["(unsigned int)"] = defaultOpHandler;
types["(long)"] = defaultOpHandler;
types["(long int)"] = defaultOpHandler;
types["(long int)"] = defaultOpHandler;
types["(signed long)"] = defaultOpHandler;
types["(signed long int)"] = defaultOpHandler;
types["(unsigned long)"] = defaultOpHandler;
types["(unsigned long int)"] = defaultOpHandler;
types["(long long)"] = defaultOpHandler;
types["(long long int)"] = defaultOpHandler;
types["(long long int)"] = defaultOpHandler;
types["(signed long long)"] = defaultOpHandler;
types["(signed long long int)"] = defaultOpHandler;
types["(unsigned long long)"] = defaultOpHandler;
types["(unsigned long long int)"] = defaultOpHandler;
types["(float)"] = defaultOpHandler;
types["(double)"] = defaultOpHandler;
types["(bool)"] = defaultOpHandler;
types["pointer"] = {
    handlers: {
        "o(==)": {
            default(rt, l, r) {
                let ret = false;
                if (rt.isPointerType(l) && rt.isPointerType(r)) {
                    if (rt.isTypeEqualTo(l.t, r.t)) {
                        if (rt.isArrayType(l) && rt.isArrayType(r)) {
                            ret = (l.v.target === r.v.target) && ((l.v.target === null) || (l.v.position === r.v.position));
                        } else {
                            ret = l.v.target === r.v.target;
                        }
                    }
                    const rett = rt.boolTypeLiteral;
                    return rt.val(rett, ret);
                } else {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support == on " + rt.makeTypeString(r.t));
                }
            }
        },
        "o(!=)": {
            default(rt, l, r) {
                return !rt.types["pointer"].handlers["=="].default(rt, l, r);
            }
        },
        "o(,)": {
            default(rt, l, r) {
                return r;
            }
        },
        "o(=)": {
            default(rt, l, r) {
                if (!l.left) {
                    rt.raiseException(rt.makeValString(l) + " is not a left value");
                }
                const t = rt.cast(l.t, r);
                l.t = t.t;
                l.v = t.v;
                return l;
            }
        },
        "o(&)": {
            default(rt, l, r) {
                if (r === undefined) {
                    if (rt.isArrayElementType(l)) {
                        if (l.array) {
                            return rt.val(rt.arrayPointerType(l.t, l.array.length), rt.makeArrayPointerValue(l.array, l.arrayIndex));
                        } else {
                            const t = rt.normalPointerType(l.t);
                            return rt.val(t, rt.makeNormalPointerValue(l));
                        }
                    } else {
                        rt.raiseException(rt.makeTypeString(l.t) + " does not support & on " + rt.makeTypeString(r.t));
                    }
                } else {
                    rt.raiseException("you cannot cast bitwise and on pointer");
                }
            }
        },
        "o(())": {
            default(rt, l, bindThis, ...args) {
                if (!rt.isPointerType(l) || !rt.isFunctionPointerType(l)) {
                    rt.raiseException(`pointer target(${rt.makeValueString(l)}) is not a function`);
                } else {
                    return rt.types["function"].handlers["o(())"].default(rt, l.v.target, bindThis, ...args);
                }
            }
        }
    }
};
types["function"] = {
    handlers: {
        "o(())": {
            default(rt, l, bindThis: Variable, ...args) {
                if (!rt.isFunctionType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " does not support ()");
                } else {
                    if (rt.isFunctionPointerType(l)) {
                        l = l.v.target;
                    }
                    if (l.v.target === null) {
                        rt.raiseException(`function ${l.v.name} does not seem to be implemented`);
                    } else {
                        return rt.getCompatibleFunc(l.v.defineType, l.v.name, args)(rt, bindThis, ...args);
                    }
                }
            }
        },
        "o(&)": {
            default(rt, l, r) {
                if (r === undefined) {
                    if (rt.isFunctionType(l)) {
                        const lt = l.t;
                        if ("retType" in lt) {
                            const t = rt.functionPointerType(lt.retType, lt.signature);
                            return rt.val(t, rt.makeNormalPointerValue(l));
                        } else {
                            rt.raiseException(rt.makeTypeString(lt) + " is an operator function");
                        }
                    } else {
                        rt.raiseException(rt.makeValueString(l) + " is not a function");
                    }
                } else {
                    rt.raiseException("you cannot cast bitwise and on function");
                }
            }
        }
    }
};
types["pointer_normal"] = {
    handlers: {
        "o(*)": {
            default(rt, l, r) {
                if (r === undefined) {
                    if (!rt.isNormalPointerType(l)) {
                        rt.raiseException(`pointer (${rt.makeValueString(l)}) is not a normal pointer`);
                    } else {
                        if (l.v.target === null) {
                            rt.raiseException("you cannot dereference an unitialized pointer");
                        }
                        return l.v.target;
                    }
                } else {
                    rt.raiseException("you cannot multiply a pointer");
                }
            }
        },
        "o(->)": {
            default(rt, l) {
                if (!rt.isNormalPointerType(l)) {
                    rt.raiseException(`pointer (${rt.makeValueString(l)}) is not a normal pointer`);
                } else {
                    return l.v.target;
                }
            }
        }
    }
};
types["pointer_array"] = {
    handlers: {
        "o(*)": {
            default(rt, l, r) {
                if (r === undefined) {
                    if (!rt.isArrayType(l)) {
                        rt.raiseException(`pointer (${rt.makeValueString(l)}) is not a normal pointer`);
                    } else {
                        const arr = l.v.target;
                        if (l.v.position >= arr.length) {
                            rt.raiseException("index out of bound " + l.v.position + " >= " + arr.length);
                        } else if (l.v.position < 0) {
                            rt.raiseException("negative index " + l.v.position);
                        }
                        const ret = arr[l.v.position] as ArrayElementVariable;
                        ret.array = arr;
                        ret.arrayIndex = l.v.position;
                        return ret;
                    }
                } else {
                    rt.raiseException("you cannot multiply a pointer");
                }
            }
        },
        "o([])": {
            default(rt, l, r: Variable) {
                r = rt.types["pointer_array"].handlers["o(+)"].default(rt, l, r);
                return rt.types["pointer_array"].handlers["o(*)"].default(rt, r);
            }
        },
        "o(->)": {
            default(rt, l) {
                l = rt.types["pointer_array"].handlers["o(*)"].default(rt, l);
                return l;
            }
        },
        "o(-)": {
            default(rt, l, r) {
                if (rt.isArrayType(l)) {
                    if (rt.isNumericType(r)) {
                        const i = rt.cast(rt.intTypeLiteral, r).v;
                        return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position - i));
                    } else if (rt.isArrayType(r)) {
                        if (l.v.target === r.v.target) {
                            return l.v.position - r.v.position;
                        } else {
                            rt.raiseException("you cannot perform minus on pointers pointing to different arrays");
                        }
                    } else {
                        rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
                    }
                } else {
                    rt.raiseException(rt.makeTypeString(l.t) + " is not an array pointer type");
                }
            }
        },
        "o(<)": {
            default(rt, l, r) {
                if (rt.isArrayType(l) && rt.isArrayType(r)) {
                    if (l.v.target === r.v.target) {
                        return l.v.position < r.v.position;
                    } else {
                        rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
                    }
                } else {
                    rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
                }
            }
        },
        "o(>)": {
            default(rt, l, r) {
                if (rt.isArrayType(l) && rt.isArrayType(r)) {
                    if (l.v.target === r.v.target) {
                        return l.v.position > r.v.position;
                    } else {
                        rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
                    }
                } else {
                    rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
                }
            }
        },
        "o(<=)": {
            default(rt, l, r) {
                if (rt.isArrayType(l) && rt.isArrayType(r)) {
                    if (l.v.target === r.v.target) {
                        return l.v.position <= r.v.position;
                    } else {
                        rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
                    }
                } else {
                    rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
                }
            }
        },
        "o(>=)": {
            default(rt, l, r) {
                if (rt.isArrayType(l) && rt.isArrayType(r)) {
                    if (l.v.target === r.v.target) {
                        return l.v.position >= r.v.position;
                    } else {
                        rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
                    }
                } else {
                    rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
                }
            }
        },
        "o(+)": {
            default(rt, l, r) {
                if (rt.isArrayType(l) && rt.isNumericType(r)) {
                    const i = rt.cast(rt.intTypeLiteral, r).v;
                    return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position + i));
                } else {
                    rt.raiseException("cannot add non-numeric to an array pointer");
                }
            }
        },
        "o(+=)": {
            default(rt, l, r) {
                r = rt.types["pointer_array"].handlers["o(+)"].default(rt, l, r);
                return rt.types["pointer"].handlers["="].default(rt, l, r);
            }
        },
        "o(-=)": {
            default(rt, l, r) {
                r = rt.types["pointer_array"].handlers["o(-)"].default(rt, l, r);
                return rt.types["pointer"].handlers["="].default(rt, l, r);
            }
        },
        "o(++)": {
            default(rt, l, dummy) {
                if (!l.left) {
                    rt.raiseException(rt.makeValString(l) + " is not a left value");
                }
                if (!rt.isArrayType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " is not an array pointer type");
                } else {
                    if (dummy) {
                        return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position++));
                    } else {
                        l.v.position++;
                        return l;
                    }
                }
            }
        },
        "o(--)": {
            default(rt, l, dummy) {
                if (!l.left) {
                    rt.raiseException(rt.makeValString(l) + " is not a left value");
                }
                if (!rt.isArrayType(l)) {
                    rt.raiseException(rt.makeTypeString(l.t) + " is not an array pointer type");
                } else {
                    if (dummy) {
                        return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position--));
                    } else {
                        l.v.position--;
                        return l;
                    }
                }
            }
        }
    }
};
