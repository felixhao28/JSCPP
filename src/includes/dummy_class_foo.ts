/* eslint-disable no-shadow */
import { CRuntime, IntVariable, ObjectVariable, Variable } from "../rt";

export default {
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

        return rt.regFunc(_plusX, type, "plusX", [rt.intTypeLiteral], rt.intTypeLiteral);
    }
};