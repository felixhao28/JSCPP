/* eslint-disable no-shadow */
import { CRuntime } from "../rt";

export = {
    load(rt: CRuntime) {
        rt.regFunc((function (rt, _this, x) {
            const c = rt.getFunc("global", "isdigit", [rt.intTypeLiteral])(rt, _this, x);
            if (!c.v) {
                return rt.getFunc("global", "isalpha", [rt.intTypeLiteral])(rt, _this, x);
            }
            return c;
        }), "global", "isalnum", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = (x.v >= "0".charCodeAt(0)) && (x.v <= "9".charCodeAt(0)) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "isdigit", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const c = rt.getFunc("global", "isupper", [rt.intTypeLiteral])(rt, _this, x);
            if (!c.v) {
                return rt.getFunc("global", "islower", [rt.intTypeLiteral])(rt, _this, x);
            }
            return c;
        }), "global", "isalpha", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = [
                0x20,
                0x09,
                0x0a,
                0x0b,
                0x0c,
                0x0d
            ].includes(x.v as number) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "isspace", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = ((x.v >= 0x00) && (x.v <= 0x1f)) || (x.v === 0x7f) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "iscntrl", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = (x.v > 0x1f) && (x.v !== 0x7f) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "isprint", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            let c = rt.getFunc("global", "isspace", [rt.intTypeLiteral])(rt, _this, x);
            if (!c.v) {
                c = rt.getFunc("global", "isgraph", [rt.intTypeLiteral])(rt, _this, x);
                if (!c.v) {
                    return rt.val(rt.intTypeLiteral, 1);
                }
            }
            return rt.val(rt.intTypeLiteral, 0);
        }), "global", "isgraph", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = (x.v >= "a".charCodeAt(0)) && (x.v <= "z".charCodeAt(0)) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "islower", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = (x.v >= "A".charCodeAt(0)) && (x.v <= "Z".charCodeAt(0)) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "isupper", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            let c = rt.getFunc("global", "isgraph", [rt.intTypeLiteral])(rt, _this, x);
            if (c.v) {
                c = rt.getFunc("global", "isalnum", [rt.intTypeLiteral])(rt, _this, x);
                if (!c.v) {
                    return rt.val(rt.intTypeLiteral, 1);
                }
            }
            return rt.val(rt.intTypeLiteral, 0);
        }), "global", "ispunct", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const v = ((x.v >= "A".charCodeAt(0)) && (x.v <= "F".charCodeAt(0))) || ((x.v >= "a".charCodeAt(0)) && (x.v <= "f".charCodeAt(0))) || ((x.v >= "0".charCodeAt(0)) && (x.v <= "9".charCodeAt(0))) ? 1 : 0;
            return rt.val(rt.intTypeLiteral, v);
        }), "global", "isxdigit", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const c = rt.getFunc("global", "isupper", [rt.intTypeLiteral])(rt, _this, x);
            if (c.v) {
                return rt.val(rt.intTypeLiteral, (x.v as number) + 32);
            }
            return x;
        }), "global", "tolower", [rt.intTypeLiteral], rt.intTypeLiteral);
        rt.regFunc((function (rt, _this, x) {
            const c = rt.getFunc("global", "islower", [rt.intTypeLiteral])(rt, _this, x);
            if (c.v) {
                return rt.val(rt.intTypeLiteral, (x.v as number) - 32);
            }
            return x;
        }), "global", "toupper", [rt.intTypeLiteral], rt.intTypeLiteral);
    }
};