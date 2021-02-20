/* eslint-disable no-shadow */
import { CRuntime } from "../rt";

export = {
    load(rt: CRuntime) {

        // values from Mac OS 11.2, clang 12.0, M1 chip
        rt.defVar("CHAR_BIT", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, 8 * rt.config.limits.char.bytes));
        rt.defVar("MB_LEN_MAX", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, 16)); // 16 in latest glibc. 6 in glibc < 2.2.

        let t = rt.primitiveType("signed char");
        rt.defVar("SCHAR_MIN", rt.intTypeLiteral, rt.val(t, rt.config.limits["signed char"].min));
        rt.defVar("SCHAR_MAX", rt.intTypeLiteral, rt.val(t, rt.config.limits["signed char"].max));
        rt.defVar("CHAR_MIN", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, rt.config.limits["signed char"].min));
        rt.defVar("CHAR_MAX", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, rt.config.limits["signed char"].max));
        rt.defVar("UCHAR_MAX", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, rt.config.limits["unsigned char"].max));

        t = rt.primitiveType("signed short");
        rt.defVar("SHRT_MIN", t, rt.val(t, rt.config.limits["signed short"].min));
        rt.defVar("SHRT_MAX", t, rt.val(t, rt.config.limits["signed short"].max));
        t = rt.primitiveType("unsigned short");
        rt.defVar("USHRT_MAX", t, rt.val(t, rt.config.limits["unsigned short"].max));

        rt.defVar("INT_MIN", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, rt.config.limits.int.min));
        rt.defVar("INT_MAX", rt.intTypeLiteral, rt.val(rt.intTypeLiteral, rt.config.limits.int.max));
        rt.defVar("UINT_MAX", rt.unsignedintTypeLiteral, rt.val(rt.unsignedintTypeLiteral, rt.config.limits["unsigned int"].max));

        t = rt.primitiveType("long");
        rt.defVar("LONG_MIN", t, rt.val(t, rt.config.limits.long.min));
        rt.defVar("LONG_MAX", t, rt.val(t, rt.config.limits.long.max));

        t = rt.primitiveType("unsigned long");
        rt.defVar("ULONG_MAX", t, rt.val(t, rt.config.limits["unsigned long"].max));

        t = rt.primitiveType("long long");
        rt.defVar("LLONG_MIN", t, rt.val(t, rt.config.limits["long long"].min));
        rt.defVar("LLONG_MAX", t, rt.val(t, rt.config.limits["long long"].max));

        t = rt.primitiveType("unsigned long long");
        rt.defVar("ULLONG_MAX", t, rt.val(t, rt.config.limits["unsigned long long"].max));
    }
};