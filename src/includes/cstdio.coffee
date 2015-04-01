printf = require "printf"

format_type_map = (rt, ctrl) ->
    switch ctrl
        when "d", "i"
            rt.intTypeLiteral
        when "u", "o", "x", "X"
            rt.unsignedintTypeLiteral
        when "f", "F"
            rt.floatTypeLiteral
        when "e", "E", "g", "G", "a", "A"
            rt.doubleTypeLiteral
        when "c"
            rt.charTypeLiteral
        when "s"
            rt.normalPointerType rt.charTypeLiteral
        when "p"
            rt.normalPointerType rt.voidTypeLiteral
        when "n"
            rt.raiseException "%n is not supported"


validate_format = (format, params...) ->
    i = 0
    while (ctrl = /(?:(?!%).)%([diuoxXfFeEgGaAcspn])/.exec format)?
        type = format_type_map ctrl[1]
        if params.length <= i
            rt.raiseException "insufficient arguments (at least #{i+1} is required)"
        target = params[i++]
        casted = rt.cast type, target
        if rt.isStringType casted.t
            val = rt.getStringFromCharArray casted
        else
            val = casted.v

module.exports =
    load: (rt) ->
        rt.include "cstring"
        pchar = rt.normalPointerType(rt.charTypeLiteral)
        stdio = rt.config.stdio;

        __printf = (format, params...) ->
            if rt.isStringType format.t
                format = format.v.target
                parsed_params = validate_format format, params...
                retval = printf format, parsed_params...
                rt.makeCharArrayFromString retval
            else
                rt.raiseException "format must be a string"

        _sprintf = (rt, _this, target, format, params...) ->
            retval = __printf(format, params...)
            rt.getFunc("global", "strcpy", [pchar, pchar])(rt, null, [target, retval])
            rt.val(rt.intTypeLiteral, retval.length)

        rt.regFunc(_sprintf, "global", "sprintf", [pchar, pchar, "?"], rt.intTypeLiteral)

        _printf = (rt, _this, format, params...) ->
            retval = __printf(format, params...)
            stdio.write retval
            rt.val(rt.intTypeLiteral, retval.length)

        rt.regFunc(_printf, "global", "printf", [pchar, "?"], rt.intTypeLiteral)
        