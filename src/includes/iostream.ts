/* eslint-disable no-shadow */
import { ArrayType, ArrayVariable, CRuntime, IntVariable, ObjectValue, ObjectVariable, Variable, VariableType } from "../rt";
import { IomanipConfig } from "./iomanip";

const _skipSpace = function (s: string) {
    const r = /^\s*/.exec(s);
    if (r && (r.length > 0)) {
        return s.substring(r[0].length);
    } else {
        return s;
    }
};

const _read = function (rt: CRuntime, reg: RegExp, buf: string, type: VariableType) {
    const r = reg.exec(buf);
    if ((r == null) || (r.length === 0)) {
        rt.raiseException("input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf);
    } else {
        return r;
    }
};

export interface Cin extends ObjectVariable {
    v: ObjectValue & {
        buf: string;
        eofbit: boolean;
        failbit: boolean;
    }
}

export interface Cout extends ObjectVariable {
    v: ObjectValue & {
        ostream: {
            drain?: () => string;
            write: (s: string) => void;
        }
    },
    manipulators?: {
        config: IomanipConfig;
        active: { [iomanipName: string]: (config: IomanipConfig) => void };
        use(o: Variable): Variable;
    }
}

export default {
    load(rt: CRuntime) {
        const {
            stdio
        } = rt.config;
        const cinType = rt.newClass("istream", []);

        const cin = {
            t: cinType,
            v: {
                buf: stdio.drain(),
                istream: stdio,
                members: {}
            },
            left: false
        };
        rt.scope[0].variables["cin"] = cin;
        const pchar = rt.normalPointerType(rt.charTypeLiteral);

        rt.types[rt.getTypeSignature(cinType)] = {
            father: "object",
            handlers: {
                "o(>>)": {
                    default(rt, _cin: Cin, t: any) {
                        if (!t.left) {
                            rt.raiseException("only left value can be used as storage");
                        }
                        if (!rt.isPrimitiveType(t.t)) {
                            rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));
                        }
                        let b = _cin.v.buf;
                        _cin.v.eofbit = b.length === 0;
                        let r
                        let v;
                        switch (t.t.name) {
                            case "char": case "signed char": case "unsigned char":
                                b = _skipSpace(b);
                                r = _read(rt, /^./, b, t.t);
                                v = r[0].charCodeAt(0);
                                break;
                            case "short": case "short int": case "signed short": case "signed short int": case "unsigned short": case "unsigned short int": case "int": case "signed int": case "unsigned": case "unsigned int": case "long": case "long int": case "signed long": case "signed long int": case "unsigned long": case "unsigned long int": case "long long": case "long long int": case "signed long long": case "signed long long int": case "unsigned long long": case "unsigned long long int":
                                b = _skipSpace(b);
                                r = _read(rt, /^[-+]?(?:([0-9]*)([eE]\+?[0-9]+)?)|0/, b, t.t);
                                v = parseInt(r[0], 10);
                                break;
                            case "float": case "double":
                                b = _skipSpace(b);
                                r = _read(rt, /^[-+]?(?:[0-9]*\.[0-9]+([eE][-+]?[0-9]+)?)|(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)/, b, t.t);
                                v = parseFloat(r[0]);
                                break;
                            case "bool":
                                b = _skipSpace(b);
                                r = _read(rt, /^(true|false)/, b, t.t);
                                v = r[0] === "true";
                                break;
                            default:
                                rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));
                        }
                        const len = r[0].length;
                        _cin.v.failbit = len === 0;
                        if (!_cin.v.failbit) {
                            t.v = rt.val(t.t, v).v;
                            _cin.v.buf = b.substring(len);
                        }
                        return _cin;
                    }
                }
            }
        };

        const _cinString = function (rt: CRuntime, _cin: Cin, t: ArrayVariable) {
            if (!rt.isStringType(t.t)) {
                rt.raiseException("only a pointer to string can be used as storage");
            }

            let b = _cin.v.buf;
            _cin.v.eofbit = b.length === 0;

            b = _skipSpace(b);
            const r = _read(rt, /^\S*/, b, t.t)[0];
            _cin.v.failbit = r.length === 0;
            _cin.v.buf = b.substring(r.length);

            const initialPos = t.v.position;
            const tar = t.v.target;
            if ((tar.length - initialPos) <= r.length) {
                rt.raiseException(`target string buffer is ${r.length - (tar.length - initialPos)} too short`);
            }

            for (let i = 0, end = r.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i));
            }
            tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0);
            return _cin;
        };
        rt.regOperator(_cinString, cin.t, ">>", [pchar], cin.t);

        const _getline = function (rt: CRuntime, _cin: Cin, t: ArrayVariable, limitV: IntVariable, delimV: IntVariable) {
            let removeDelim;
            if (!rt.isStringType(t.t)) {
                rt.raiseException("only a pointer to string can be used as storage");
            }
            const limit = limitV.v;
            const delim =
                (delimV != null) ?
                    String.fromCharCode(delimV.v)
                    :
                    '\n';
            const b = _cin.v.buf;
            _cin.v.eofbit = b.length === 0;

            let r = _read(rt, new RegExp(`^[^${delim}]*`), b, t.t)[0];
            if ((r.length + 1) > limit) {
                r = r.substring(0, limit - 1);
            }
            if (b.charAt(r.length) === delim.charAt(0)) {
                removeDelim = true;
                _cin.v.failbit = false;
            } else {
                _cin.v.failbit = r.length === 0;
            }
            _cin.v.buf = b.substring(r.length + (removeDelim ? 1 : 0));

            const initialPos = t.v.position;
            const tar = t.v.target;
            if ((tar.length - initialPos) <= r.length) {
                rt.raiseException(`target string buffer is ${r.length - (tar.length - initialPos)} too short`);
            }

            for (let i = 0, end = r.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i));
            }
            tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0);
            return _cin;
        };

        rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral, rt.charTypeLiteral], cin.t);
        rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral], cin.t);

        const _get = function (rt: CRuntime, _cin: Cin) {
            const b = _cin.v.buf;
            _cin.v.eofbit = b.length === 0;

            if (_cin.v.eofbit) {
                return rt.val(rt.intTypeLiteral, -1);
            } else {
                const r = _read(rt, /^.|[\r\n]/, b, rt.charTypeLiteral);
                _cin.v.buf = b.substring(r.length);
                const v = r[0].charCodeAt(0);
                return rt.val(rt.intTypeLiteral, v);
            }
        };

        rt.regFunc(_get, cin.t, "get", [], rt.intTypeLiteral);

        const _bool = (rt: CRuntime, _cin: Cin) => rt.val(rt.boolTypeLiteral, !_cin.v.failbit);

        rt.regOperator(_bool, cin.t, "bool", [], rt.boolTypeLiteral);

        // ######################### cout
        const coutType = rt.newClass("ostream", []);
        const cout: Cout = {
            t: coutType,
            v: {
                ostream: stdio,
                members: {}
            },
            left: false
        };
        rt.scope[0].variables["cout"] = cout;

        rt.types[rt.getTypeSignature(cout.t)] = {
            father: "object",
            handlers: {
                "o(<<)": {
                    default(rt, _cout: Cout, t: Variable) {
                        let r;
                        if (_cout.manipulators != null) {
                            t = _cout.manipulators.use(t);
                        }
                        if (rt.isPrimitiveType(t.t)) {
                            if (t.t.name.indexOf("char") >= 0) {
                                r = String.fromCharCode(t.v as number);
                            } else if (t.t.name === "bool") {
                                r = t.v ? "1" : "0";
                            } else {
                                r = t.v.toString();
                            }
                        } else if (rt.isStringType(t)) {
                            r = rt.getStringFromCharArray(t);
                        } else {
                            rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(t.t));
                        }
                        _cout.v.ostream.write(r);
                        return _cout;
                    }
                }
            }
        };

        const endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0));
        rt.scope[0].variables["endl"] = endl;
    }
};