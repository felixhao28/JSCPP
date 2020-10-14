/* eslint-disable no-shadow */
import { ArrayType, ArrayVariable, CRuntime, IntVariable, NormalPointerVariable, PointerType, PointerValue, Variable, VariableType } from "../rt";

const printf = require("printf");
const EOF = 0;
const NULL = -1;

const format_type_map = function (rt: CRuntime, ctrl: string): VariableType {
    switch (ctrl) {
        case "d": case "i":
            return rt.intTypeLiteral;
        case "u": case "o": case "x": case "X":
            return rt.unsignedintTypeLiteral;
        case "f": case "F":
            return rt.floatTypeLiteral;
        case "e": case "E": case "g": case "G": case "a": case "A":
            return rt.doubleTypeLiteral;
        case "c":
            return rt.charTypeLiteral;
        case "s":
            return rt.normalPointerType(rt.charTypeLiteral);
        case "p":
            return rt.normalPointerType(rt.voidTypeLiteral);
        case "n":
            rt.raiseException("%n is not supported");
    }
};


const validate_format = function (rt: CRuntime, format: string, ...params: Variable[]) {
    let i = 0;
    const re = /%(?:[-+ #0])?(?:[0-9]+|\*)?(?:\.(?:[0-9]+|\*))?([diuoxXfFeEgGaAcspn])/g;
    return (() => {
        let ctrl;
        const result = [];
        while ((ctrl = re.exec(format)) != null) {
            const type = format_type_map(rt, ctrl[1]) as ArrayType;
            if (params.length <= i) {
                rt.raiseException(`insufficient arguments (at least ${i + 1} is required)`);
            }
            const target = params[i++];
            const casted = rt.cast(type, target);
            if (rt.isStringType(casted)) {
                result.push(rt.getStringFromCharArray(casted));
            } else {
                if (casted.v == null || (typeof (casted.v) === "number" && isNaN(casted.v))) {
                    rt.raiseException("uninitialized value when using printf");
                }
                result.push(casted.v);
            }
        }
        return result;
    })();
};



export = {
    load(rt: CRuntime) {
        const char_pointer = rt.normalPointerType(rt.charTypeLiteral);
        const {
            stdio
        } = rt.config;
        let input_stream = stdio.drain();


        const _consume_next_char = function () {
            let char_return = "";
            if (input_stream.length > 0) {
                char_return = input_stream[0];
                input_stream = input_stream.substr(1);
                return char_return;
            } else {
                throw new Error("EOF");
            }
        };

        const _consume_next_line = function () {
            let retval;
            const next_line_break = input_stream.indexOf('\n');

            if (next_line_break > -1) {
                retval = input_stream.substr(0, next_line_break);
                input_stream = input_stream.replace(`${retval}\n`, '');
            } else {
                retval = input_stream;
                input_stream = "";
            }

            return retval;
        };


        const _strcpy = require("./shared/cstring_strcpy");

        const __printf = function (format: ArrayVariable, ...params: Variable[]): ArrayVariable {
            if (rt.isStringType(format.t)) {
                const formatStr = rt.getStringFromCharArray(format);
                const parsed_params = validate_format(rt, formatStr, ...params);
                const retval: string = printf(formatStr, ...parsed_params);
                return rt.makeCharArrayFromString(retval);
            } else {
                rt.raiseException("format must be a string");
            }
        };

        const _sprintf = function (rt: CRuntime, _this: Variable, target: Variable, format: ArrayVariable, ...params: Variable[]) {
            const retval = __printf(format, ...params);
            _strcpy(rt, null, [target, retval]);
            return rt.val(rt.intTypeLiteral, retval.v.target.length);
        };

        rt.regFunc(_sprintf, "global", "sprintf", [char_pointer, char_pointer, "?"], rt.intTypeLiteral);

        const _printf = function (rt: CRuntime, _this: Variable, format: ArrayVariable, ...params: Variable[]) {
            const retval = __printf(format, ...params);
            const retvalStr = rt.getStringFromCharArray(retval);
            stdio.write(retvalStr);
            return rt.val(rt.intTypeLiteral, retval.v.target.length);
        };

        rt.regFunc(_printf, "global", "printf", [char_pointer, "?"], rt.intTypeLiteral);

        const _getchar = function (rt: CRuntime, _this: Variable) {
            try {
                const char = _consume_next_char();
                return rt.val(rt.intTypeLiteral, char.charCodeAt(0));
            } catch (error) {
                return rt.val(rt.intTypeLiteral, EOF);
            }
        };

        rt.regFunc(_getchar, "global", "getchar", [], rt.intTypeLiteral);

        const _gets = function (rt: CRuntime, _this: Variable, charPtr: ArrayVariable) {

            const return_value = _consume_next_line();
            const destArray = charPtr.v.target;

            for (let i = 0, end = return_value.length, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
                try {
                    destArray[i] = rt.val(rt.charTypeLiteral, return_value.charCodeAt(i));
                } catch (error) {
                    destArray[i] = rt.val(rt.charTypeLiteral, 0);
                }
            }

            destArray[return_value.length] = rt.val(rt.charTypeLiteral, 0);

            return rt.val(char_pointer, charPtr.v);
        };


        rt.regFunc(_gets, "global", "gets", [char_pointer], char_pointer);

        // #DEPENDENT ON PRINTF##
        // #these implementations is dependent on printf implementation
        // #but on the original c this behavior is not present
        // #for general purposes the result will be the same
        // #but maybe could be a good idea to make this implementation
        // #indenpendent
        const _putchar = function (rt: CRuntime, _this: Variable, char: IntVariable) {
            const print_mask = rt.makeCharArrayFromString("%c");
            _printf(rt, null, print_mask, char);
            return char;
        };

        rt.regFunc(_putchar, "global", "putchar", [rt.charTypeLiteral], rt.intTypeLiteral);

        const _puts = function (rt: CRuntime, _this: Variable, charPtr: ArrayVariable) {
            const print_mask = rt.makeCharArrayFromString("%s");
            _printf(rt, null, print_mask, charPtr);
            return rt.val(rt.intTypeLiteral, 1);
        };

        rt.regFunc(_puts, "global", "puts", [char_pointer], rt.intTypeLiteral);
        // #DEPENDENT ON PRINTF##

        // ####################HELPER FUNCTION TO SCANF ###############################

        const _ASCII = {
            a: 'a'.charCodeAt(0),
            f: 'f'.charCodeAt(0),
            A: 'A'.charCodeAt(0),
            F: 'F'.charCodeAt(0),
            0: '0'.charCodeAt(0),
            8: '8'.charCodeAt(0),
            9: '9'.charCodeAt(0)
        };


        const _hex2int = function (str: string) {
            let ret = 0;
            let digit = 0;
            str = str.replace(/^[0O][Xx]/, '');

            for (let i = str.length - 1; i >= 0; i--) {
                const num = _int_at_hex(str[i], digit++);
                if (num !== null) {
                    ret += num;
                } else {
                    throw new Error('invalid hex ' + str);
                }
            }

            function _int_at_hex(c: string, digit: number) {
                let ret;
                const ascii = c.charCodeAt(0);

                if ((_ASCII.a <= ascii) && (ascii <= _ASCII.f)) {
                    ret = ascii - _ASCII.a + 10;
                } else if ((_ASCII.A <= ascii) && (ascii <= _ASCII.F)) {
                    ret = ascii - _ASCII.a + 10;
                } else if ((_ASCII[0] < ascii) && (ascii <= _ASCII[9])) {
                    ret = ascii - _ASCII[0];

                } else {
                    throw new Error(`Invalid ascii [${c}]`);
                }

                ret *= Math.pow(16, digit);

                return ret;
            };
            return ret;
        };

        const _octal2int = function (str: string) {
            str = str.replace(/^0/, '');
            let ret = 0;
            let digit = 0;

            for (let i = str.length - 1; i >= 0; i--) {
                const num = _int_at_octal(str[i], digit++);
                if (num !== null) {
                    ret += num;
                } else {
                    throw new Error(`invalid octal ${str}`);
                }
            }

            function _int_at_octal(c: string, digit: number) {
                let num = null;
                const ascii = c.charCodeAt(0);
                if ((ascii >= _ASCII[0]) && (ascii <= _ASCII[8])) {
                    num = ascii - _ASCII[0];
                } else {
                    throw new Error(`invalid char at [${c}]`);
                }

                num *= Math.pow(8, digit);

                return num;
            };
            return ret;
        };


        const _regslashs = (pre: string) => pre.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\|/g, '\\|');


        const _strip_slashes = (str: string) => str.replace(/\\([\sA-Za-z\\]|[0-7]{1,3})/g, function (str, c) {
            switch (c) {
                case "\\":
                    return "\\";
                case "0":
                    return "\u0000";
                default:
                    if (/^\w$/.test(c)) {
                        return _get_special_char(c);
                    } else if (/^\s$/.test(c)) {
                        return c;
                    } else if (/([0-7]{1,3})/.test(c)) {
                        return _get_ASCII_char(c);
                    }
                    return str;
            }
        });

        function _get_ASCII_char(str: string) {
            const num = _octal2int(str);
            return String.fromCharCode(num);
        };

        function _get_special_char(letter: string) {
            switch (letter.toLowerCase()) {
                case "b":
                    return "\b";
                case "f":
                    return "\f";
                case "n":
                    return "\n";
                case "r":
                    return "\r";
                case "t":
                    return "\t";
                case "v":
                    return "\v";
                default:
                    return letter;
            }
        };


        // ####################HELPER FUNCTION TO SCANF ###############################

        // ############################SCANF IMPL######################################


        const _get_input = function (pre: string, next: string, match: string, type?: string) {

            let tmp = input_stream;

            let replace = `(${match})`;


            if ((type === 'STR') && (next.trim().length > 0)) {
                const before_match = _regslashs(pre);
                const after_match = _regslashs(next) + '[\\w\\W]*';

                if (before_match.length) {
                    tmp = tmp.replace(new RegExp(before_match), '');
                }

                tmp = tmp.replace(new RegExp(after_match), '');
            } else {
                replace = _regslashs(pre) + replace;
            }

            const m = tmp.match(new RegExp(replace));

            if (!m) {
                // TODO strip match
                return null;
            }

            const result = m[1];

            input_stream = input_stream.substr(input_stream.indexOf(result)).replace(result, '').replace(next, '');

            // returing result
            return result;
        };


        const _get_integer = function (pre: string, next: string) {

            const text = _get_input(pre, next, '[-]?[A-Za-z0-9]+');

            if (!text) {
                return null;
            } else if (text[0] === '0') {
                if ((text[1] === 'x') || (text[1] === 'X')) {
                    return _hex2int(text);
                } else {
                    return _octal2int(text);
                }
            } else {
                return parseInt(text, 10);
            }
        };

        const _get_float = function (pre: string, next: string) {
            const text = _get_input(pre, next, '[-]?[0-9]+[\.]?[0-9]*');
            return parseFloat(text);
        };

        const _get_hex = function (pre: string, next: string) {
            const text = _get_input(pre, next, '[A-Za-z0-9]+');
            return _hex2int(text);
        };

        const _get_octal = function (pre: string, next: string) {
            const text = _get_input(pre, next, '[A-Za-z0-9]+');
            return _octal2int(text);
        };

        const _get_string = function (pre: string, next: string) {
            let text = _get_input(pre, next, '([\\w\\]=-]|\\S[^\\][^\\ ])+(\\\\[\\w\\ ][\\w\\:]*)*', 'STR');
            if (/\\/.test(text)) {
                text = _strip_slashes(text);
            }
            return text;
        };

        const _get_char = function (pre: string, next: string) {
            let text = _get_input(pre, next, '.', 'STR');
            if (/\\/.test(text)) {
                text = _strip_slashes(text);
            }
            return text;
        };

        const _get_line = function (pre: string, next: string) {
            let text = _get_input(pre, next, '[^\n\r]*');
            if (/\\/.test(text)) {
                text = _strip_slashes(text);
            }
            return text;
        };

        const _deal_type = function (format: string) {
            const res = format.match(/%[A-Za-z]+/);
            const res2 = format.match(/[^%]*/);

            if (!res) {
                return null;
            }

            const type = res[0];

            let pre;
            if (!!res2) {
                pre = res2[0];
            } else {
                pre = null;
            }

            const next = format.substr(format.indexOf(type) + type.length);

            let ret;
            switch (type) {
                case "%d": case "%ld": case "%llu": case "%lu": case "%u":
                    ret = _get_integer(pre, next);
                    break;
                case "%c":
                    ret = _get_char(pre, next);
                    break;
                case "%s":
                    ret = _get_string(pre, next);
                    break;
                case "%S":
                    ret = _get_line(pre, next);
                    break;
                case '%x': case '%X':
                    ret = _get_hex(pre, next);
                    break;
                case '%o': case '%O':
                    ret = _get_octal(pre, next);
                    break;
                case '%f':
                    ret = _get_float(pre, next);
                    break;
                default:
                    throw new Error('Unknown type "' + type + '"');
            }

            return ret;
        };

        const _set_pointer_value = function (pointer: NormalPointerVariable | ArrayVariable, value: string | number) {
            try {
                let new_value;
                if (rt.isNormalPointerType(pointer)) {
                    if (rt.isNumericType(pointer.t.targetType)) {
                        new_value = rt.val(pointer.t.targetType, value as number, true);
                        return pointer.v.target.v = new_value.v;
                    } else {
                        new_value = rt.val(pointer.t.targetType, (value as string).charCodeAt(0), true);
                        return pointer.v.target.v = new_value.v;
                    }
                } else if (rt.isArrayType(pointer)) {
                    const src_array = rt.makeCharArrayFromString(value as string);
                    if (src_array.v.target.length > pointer.v.target.length) {
                        return rt.raiseException("Not enough memory on pointer");
                    } else {
                        return __range__(0, src_array.v.target.length, true).map((i) =>
                            (() => {
                                try {
                                    return pointer.v.target[i] = src_array.v.target[i];
                                } catch (error) {
                                    return rt.raiseException("Not enough memory on pointer");
                                }
                            })());
                    }
                } else {
                    return rt.raiseException("Invalid Pointer Type");
                }
            } catch (error1) {
                return rt.raiseException("Memory overflow");
            }
        };


        const __scanf = function (format: string) {
            const re = new RegExp('[^%]*%[A-Za-z][^%]*', 'g');
            const selectors = format.match(re);
            return Array.from(selectors).map((val) => _deal_type(val));
        };
        // ############################SCANF IMPL#####################################

        const _scanf = function (rt: CRuntime, _this: Variable, pchar: ArrayVariable, ...args: (NormalPointerVariable | ArrayVariable)[]) {

            let val;
            const format = rt.getStringFromCharArray(pchar);
            const matched_values = __scanf(format);

            for (let i = 0; i < matched_values.length; i++) {
                val = matched_values[i];
                _set_pointer_value(args[i], val);
            }

            return rt.val(rt.intTypeLiteral, matched_values.length);
        };


        rt.regFunc(_scanf, "global", "scanf", [char_pointer, "?"], rt.intTypeLiteral);

        // TODO change this function to pass the string to __scanf instead of playing with current stream
        const _sscanf = function (rt: CRuntime, _this: Variable, original_string_pointer: ArrayVariable, format_pointer: ArrayVariable, ...args: (NormalPointerVariable | ArrayVariable)[]) {

            let val;
            const format = rt.getStringFromCharArray(format_pointer);
            const original_string = rt.getStringFromCharArray(original_string_pointer);
            const original_input_stream = input_stream;
            input_stream = original_string;
            const matched_values = __scanf(format);

            for (let i = 0; i < matched_values.length; i++) {
                val = matched_values[i];
                _set_pointer_value(args[i], val);
            }

            input_stream = original_input_stream;
            return rt.val(rt.intTypeLiteral, matched_values.length);
        };

        return rt.regFunc(_sscanf, "global", "sscanf", [char_pointer, char_pointer, "?"], rt.intTypeLiteral);
    }
};


function __range__(left: number, right: number, inclusive: boolean) {
    const range = [];
    const ascending = left < right;
    const end = !inclusive ? right : ascending ? right + 1 : right - 1;
    for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
        range.push(i);
    }
    return range;
}