/* eslint-disable no-shadow */
import { CRuntime, IntVariable, ObjectValue, ObjectVariable, Variable } from "../rt";
import { Cout } from "./iostream";

export interface IomanipConfig {
    setprecision?: number;
    fixed?: boolean;
    setw?: number;
    setfill?: string;
}

export interface IomanipOperator extends ObjectVariable {
    v: ObjectValue & {
        name: string;
        f(config: IomanipConfig): void;
    }
}

export default {
    load(rt: CRuntime) {
        const type = rt.newClass("iomanipulator", []);
        const oType = rt.simpleType("ostream");

        const _setprecesion = (rt: CRuntime, _this: Variable, x: IntVariable): IomanipOperator => ({
            t: type,

            v: {
                name: "setprecision",
                f(config: IomanipConfig) {
                    config.setprecision = x.v;
                }
            },

            left: false
        });
        rt.regFunc(_setprecesion, "global", "setprecision", [rt.intTypeLiteral], type);

        const _fixed: any = {
            t: type,
            v: {
                members: {
                    name: "fixed",
                    f(config: IomanipConfig) {
                        config.fixed = true;
                    }
                }
            }
        };
        rt.scope[0].variables["fixed"] = _fixed;

        const _setw = (rt: CRuntime, _this: Variable, x: IntVariable): IomanipOperator => ({
            t: type,

            v: {
                name: "setw",
                f(config: IomanipConfig) {
                    config.setw = x.v;
                }
            }
        });
        rt.regFunc(_setw, "global", "setw", [rt.intTypeLiteral], type);

        const _setfill = (rt: CRuntime, _this: Variable, x: IntVariable): IomanipOperator => ({
            t: type,

            v: {
                name: "setfill",
                f(config: IomanipConfig) {
                    config.setfill = String.fromCharCode(x.v);
                }
            }
        });
        rt.regFunc(_setfill, "global", "setfill", [rt.charTypeLiteral], type);

        const _addManipulator = function (rt: CRuntime, _cout: Cout, m: IomanipOperator) {
            if (!_cout.manipulators) {
                _cout.manipulators = {
                    config: {},
                    active: {},
                    use(o: Variable) {
                        let tarStr: any;
                        if (rt.isNumericType(o) && rt.isFloatType(o)) {
                            if (this.active.fixed) {
                                const prec = (this.active.setprecision != null) ?
                                    this.config.setprecision
                                    :
                                    6;
                                tarStr = o.v.toFixed(prec);
                            } else if (this.active.setprecision != null) {
                                tarStr = o.v.toPrecision(this.config.setprecision).replace(/0+$/, "");
                            }
                        }
                        if (this.active.setw != null) {
                            let fill;
                            if (this.active.setfill != null) {
                                fill = this.config.setfill;
                            } else {
                                fill = " ";
                            }
                            if (!(rt.isTypeEqualTo(o.t, rt.charTypeLiteral) && ((o.v === 10) || (o.v === 13)))) {
                                if (!tarStr) {
                                    tarStr = rt.isPrimitiveType(o) ?
                                        o.t.name.indexOf("char") >= 0 ?
                                            String.fromCharCode(o.v as number)
                                            : o.t.name === "bool" ?
                                                o.v ? "1" : "0"
                                                :
                                                o.v.toString()
                                        : rt.isStringType(o) ?
                                            rt.getStringFromCharArray(o)
                                            :
                                            rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(o.t));
                                }
                                for (let i = 0, end = this.config.setw - tarStr.length; i < end; i++) {
                                    tarStr = fill + tarStr;
                                }
                                delete this.active.setw;
                            }
                        }
                        if (tarStr != null) {
                            return rt.makeCharArrayFromString(tarStr);
                        } else {
                            return o;
                        }
                    }
                };
            }
            m.v.f(_cout.manipulators.config);
            _cout.manipulators.active[m.v.name] = m.v.f;
            return _cout;
        };

        rt.regOperator(_addManipulator, oType, "<<", [type], oType);
    }
};