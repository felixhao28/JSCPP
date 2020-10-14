/* eslint-disable no-shadow */
import { CRuntime, IntVariable, Variable } from "../rt";

export = {
    load(rt: CRuntime) {

        const _time = function (rt: CRuntime, _this: Variable, i: IntVariable) {
            const val = Math.floor(Date.now() / 1000);
            return rt.val(rt.intTypeLiteral, val);
        };
        // TODO: implement correct return for non-0 argument

        return rt.regFunc(_time, "global", "time", [rt.longTypeLiteral], rt.longTypeLiteral);
    }
};
