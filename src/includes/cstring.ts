/* eslint-disable no-shadow */
import { ArrayVariable, CRuntime, IntVariable, Variable } from "../rt";

export = {
    load(rt: CRuntime) {
        const pchar = rt.normalPointerType(rt.charTypeLiteral);
        const sizet = rt.primitiveType("unsigned int");

        const _strcpy = require("./shared/cstring_strcpy");

        rt.regFunc(_strcpy, "global", "strcpy", [pchar, pchar], pchar);
        rt.regFunc((function (rt: CRuntime, _this: Variable, dest: ArrayVariable, src: ArrayVariable, num: IntVariable) {
            if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
                const srcarr = src.v.target;
                let i = src.v.position;
                const destarr = dest.v.target;
                let j = dest.v.position;
                let n = num.v;
                while ((n > 0) && (i < srcarr.length) && (j < (destarr.length - 1)) && (srcarr[i].v !== 0)) {
                    destarr[j] = rt.clone(srcarr[i]);
                    n--;
                    i++;
                    j++;
                }
                if (srcarr[i].v === 0) {
                    // padding zeroes
                    while ((n > 0) && (j < destarr.length)) {
                        destarr[j++] = rt.val(rt.charTypeLiteral, 0);
                    }
                }
                if (i === srcarr.length) {
                    rt.raiseException("source string does not have a pending \"\\0\"");
                } else if (j === (destarr.length - 1)) {
                    rt.raiseException("destination array is not big enough");
                }
            } else {
                rt.raiseException("destination or source is not an array");
            }
            return dest;
        }), "global", "strncpy", [
            pchar,
            pchar,
            sizet
        ], pchar);
        rt.regFunc((function (rt: CRuntime, _this: Variable, dest: ArrayVariable, src: ArrayVariable) {
            if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
                let lendest;
                const srcarr = src.v.target;
                const destarr = dest.v.target;
                if (srcarr === destarr) {
                    let lensrc;
                    const i = src.v.position;
                    const j = dest.v.position;
                    if (i < j) {
                        lensrc = rt.getFunc("global", "strlen", [pchar])(rt, null, src).v;
                        if ((i + lensrc + 1) >= j) {
                            rt.raiseException("overlap is not allowed");
                        }
                    } else {
                        lensrc = rt.getFunc("global", "strlen", [pchar])(rt, null, src).v;
                        lendest = rt.getFunc("global", "strlen", [pchar])(rt, null, dest).v;
                        if ((j + lensrc + lendest + 1) >= i) {
                            rt.raiseException("overlap is not allowed");
                        }
                    }
                }
                lendest = rt.getFunc("global", "strlen", [pchar])(rt, null, dest).v;
                const pCharArr = rt.arrayPointerType(rt.charTypeLiteral, dest.t.size);
                const newDest = rt.val(pCharArr, rt.makeArrayPointerValue(dest.v.target, dest.v.position + lendest));
                return rt.getFunc("global", "strcpy", [
                    pchar,
                    pchar
                ])(rt, null,
                    newDest,
                    src
                );
            } else {
                rt.raiseException("destination or source is not an array");
            }
            return dest;
        }), "global", "strcat", [
            pchar,
            pchar
        ], pchar);
        rt.regFunc((function (rt: CRuntime, _this: Variable, dest: ArrayVariable, src: ArrayVariable, num: IntVariable) {
            if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
                let lendest;
                const srcarr = src.v.target;
                const destarr = dest.v.target;
                if (srcarr === destarr) {
                    let lensrc: number;
                    const i = src.v.position;
                    const j = dest.v.position;
                    const n = num.v;
                    if (i < j) {
                        lensrc = rt.getFunc("global", "strlen", [pchar])(rt, null, src).v;
                        if (lensrc > n) {
                            lensrc = n;
                        }
                        if ((i + lensrc + 1) >= j) {
                            rt.raiseException("overlap is not allowed");
                        }
                    } else {
                        lensrc = rt.getFunc("global", "strlen", [pchar])(rt, null, src).v;
                        if (lensrc > n) {
                            lensrc = n;
                        }
                        lendest = rt.getFunc("global", "strlen", [pchar])(rt, null, dest).v;
                        if ((j + lensrc + lendest + 1) >= i) {
                            rt.raiseException("overlap is not allowed");
                        }
                    }
                }
                lendest = rt.getFunc("global", "strlen", [pchar])(rt, null, dest).v;
                const newDest = rt.val(pchar, rt.makeArrayPointerValue(dest.v.target, dest.v.position + lendest));
                return rt.getFunc("global", "strncpy", [
                    pchar,
                    pchar,
                    sizet
                ])(rt, null,
                    newDest,
                    src,
                    num
                );
            } else {
                rt.raiseException("destination or source is not an array");
            }
            return dest;
        }), "global", "strncat", [
            pchar,
            pchar,
            sizet
        ], pchar);
        rt.regFunc((function (rt, _this, str) {
            if (rt.isArrayType(str)) {
                const arr = str.v.target;
                let i = str.v.position;
                while ((i < arr.length) && (arr[i].v !== 0)) {
                    i++;
                }
                if (i === arr.length) {
                    return rt.raiseException("target string does not have a pending \"\\0\"");
                } else {
                    return rt.val(rt.intTypeLiteral, i - str.v.position);
                }
            } else {
                return rt.raiseException("target is not an array");
            }
        }), "global", "strlen", [pchar], sizet);
        rt.regFunc((function (rt, _this, dest, src) {
            if (rt.isArrayType(dest) && rt.isArrayType(src)) {
                const srcarr = src.v.target;
                let i = src.v.position;
                const destarr = dest.v.target;
                let j = dest.v.position;
                while ((i < srcarr.length) && (j < destarr.length) && (srcarr[i].v === destarr[i].v)) {
                    i++;
                    j++;
                }
                if (i >= srcarr.length && j >= srcarr.length) {
                    return rt.val(rt.intTypeLiteral, 0);
                }
                return rt.val(rt.intTypeLiteral, (destarr[i].v as number) - (srcarr[i].v as number));
            } else {
                return rt.raiseException("str1 or str2 is not an array");
            }
        }), "global", "strcmp", [
            pchar,
            pchar
        ], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, dest, src, num: IntVariable) {
            if (rt.isArrayType(dest) && rt.isArrayType(src)) {
                const srcarr = src.v.target;
                let i = src.v.position;
                const destarr = dest.v.target;
                let j = dest.v.position;
                let n = num.v;
                while ((n > 0) && (i < srcarr.length) && (j < destarr.length) && (srcarr[i].v === destarr[i].v)) {
                    i++;
                    j++;
                    n--;
                }
                return rt.val(rt.intTypeLiteral, (destarr[i].v as number) - (srcarr[i].v as number));
            } else {
                return rt.raiseException("str1 or str2 is not an array");
            }
        }), "global", "strncmp", [
            pchar,
            pchar,
            sizet
        ], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, str, ch) {
            if (rt.isArrayType(str)) {
                const arr = str.v.target;
                let i = str.v.position;
                while ((i < arr.length) && (arr[i].v !== 0) && (arr[i].v !== ch.v)) {
                    i++;
                }
                if (arr[i].v === 0) {
                    return rt.val(pchar, rt.nullPointerValue);
                } else if (arr[i].v === ch.v) {
                    return rt.val(pchar, rt.makeArrayPointerValue(arr, i));
                } else {
                    return rt.raiseException("target string does not have a pending \"\\0\"");
                }
            } else {
                return rt.raiseException("str1 or str2 is not an array");
            }
        }), "global", "strchr", [
            pchar,
            rt.charTypeLiteral
        ], pchar);
        rt.regFunc((function (rt, _this, str, ch) {
            if (rt.isArrayType(str)) {
                const arr = str.v.target;
                let i = str.v.position;
                let lastpos = -1;
                while ((i < arr.length) && (arr[i].v !== 0)) {
                    if (arr[i].v === ch.v) {
                        lastpos = i;
                    }
                    i++;
                }
                if (arr[i].v === 0) {
                    if (lastpos >= 0) {
                        return rt.val(pchar, rt.makeArrayPointerValue(arr, lastpos));
                    } else {
                        return rt.val(pchar, rt.nullPointerValue);
                    }
                } else {
                    return rt.raiseException("target string does not have a pending \"\\0\"");
                }
            } else {
                return rt.raiseException("str1 or str2 is not an array");
            }
        }), "global", "strrchr", [
            pchar,
            rt.charTypeLiteral
        ], pchar);
        return rt.regFunc((function (rt, _this, str1, str2) {
            if (rt.isArrayType(str1) && rt.isArrayType(str2)) {
                // BM?
                const arr = str1.v.target;
                let i = str1.v.position;
                const tar = str2.v.target;
                while ((i < arr.length) && (arr[i].v !== 0)) {
                    let j = str2.v.position;
                    let _i = i;
                    while ((j < tar.length) && (str1.v.target[_i].v === str2.v.target[j].v)) {
                        _i++;
                        j++;
                    }
                    if (j === tar.length) {
                        break;
                    }
                    i++;
                }
                if (arr[i].v === 0) {
                    return rt.val(pchar, rt.nullPointerValue);
                } else if (i === arr.length) {
                    return rt.raiseException("target string does not have a pending \"\\0\"");
                } else {
                    return rt.val(pchar, rt.makeArrayPointerValue(arr, i));
                }
            } else {
                return rt.raiseException("str1 or str2 is not an array");
            }
        }), "global", "strstr", [
            pchar,
            rt.charTypeLiteral
        ], pchar);
    }
};