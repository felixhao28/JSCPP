/* eslint-disable no-shadow */
import { CRuntime, FunctionPointerVariable, IntVariable, ObjectVariable, Variable } from "../rt";

export = {
    load(rt: CRuntime) {
        const type = rt.newClass("Foo", [{
            name: "x",
            type: rt.intTypeLiteral,
            initialize(rt, _this) { return rt.val(rt.intTypeLiteral, 2, true); }
        }, {
            name: "y",
            type: rt.intTypeLiteral,
            initialize(rt, _this) { return rt.val(rt.intTypeLiteral, -2, true); }
        }
        ]);
        const typeSig = rt.getTypeSignature(type);
        rt.types[typeSig].father = "object";

        const _plusX = function (rt: CRuntime, _this: ObjectVariable, a: IntVariable) {
            const newValue = (_this.v.members["x"].v as number) + a.v;
            return rt.val(rt.intTypeLiteral, newValue, false);
        };

        rt.regFunc(_plusX, type, "plusX", [rt.intTypeLiteral], rt.intTypeLiteral);

        const _callback = function (rt: CRuntime, _this: ObjectVariable, f: FunctionPointerVariable, v: IntVariable) {
            const r = f.v.target.v.target(rt, null, v);
            return r;
        }
        rt.regFunc(_callback, type, "callback", [
            rt.functionPointerType(rt.intTypeLiteral, [
                rt.normalPointerType(rt.intTypeLiteral)
            ]),
            rt.normalPointerType(rt.intTypeLiteral)
        ], rt.intTypeLiteral);
    }
};