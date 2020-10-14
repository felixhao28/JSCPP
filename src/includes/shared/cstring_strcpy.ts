import { CRuntime, Variable } from "../../rt";

export default function (rt: CRuntime, _this: Variable, dest: Variable, src: Variable) {

    if (rt.isArrayType(dest) && rt.isArrayType(src)) {
        const srcarr = src.v.target;
        let i = src.v.position;
        const destarr = dest.v.target;
        let j = dest.v.position;
        while ((i < srcarr.length) && (j < destarr.length) && (srcarr[i].v !== 0)) {
            destarr[j] = rt.clone(srcarr[i]);
            i++;
            j++;
        }
        if (i === srcarr.length) {
            rt.raiseException("source string does not have a pending \"\\0\"");
        } else if (j === (destarr.length - 1)) {
            rt.raiseException("destination array is not big enough");
        } else {
            destarr[j] = rt.val(rt.charTypeLiteral, 0);
        }
    } else {
        rt.raiseException("destination or source is not an array");
    }
    return dest;
};