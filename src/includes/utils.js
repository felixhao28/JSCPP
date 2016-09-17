var ASCII = {
    a: 'a'.charCodeAt(),
    f: 'f'.charCodeAt(),
    A: 'A'.charCodeAt(),
    F: 'F'.charCodeAt(),
    0: '0'.charCodeAt(),
    8: '8'.charCodeAt(),
    9: '9'.charCodeAt(),
};

exports.hex2int = function(str) {
    var ret = 0,
        digit = 0;
    str = str.replace(/^[0O][Xx]/, '');

    for (var i = str.length - 1; i >= 0; i--) {
        var num = intAtHex(str[i], digit++);
        if (num !== null) {
            ret += num;
        } else {
            if (THROW) {
                throw new Error('Invalid hex ' + str);
            }
            return null;
        }
    }

    return ret;
};

var intAtHex = function(c, digit) {
    var ret = null;
    var ascii = c.charCodeAt();

    if (ASCII.a <= ascii && ascii <= ASCII.f) {
        ret = ascii - ASCII.a + 10;
    } else if (ASCII.A <= ascii && ascii <= ASCII.F) {
        ret = ascii - ASCII.A + 10;
    } else if (ASCII[0] <= ascii && ascii <= ASCII[9]) {
        ret = ascii - ASCII[0];
    } else {
        if (THROW) {
            throw new Error('Invalid ascii [' + c + ']');
        }
        return null;
    }

    while (digit--) {
        ret *= 16;
    }
    return ret;
};

exports.octal2int = function(str) {
    str = str.replace(/^0/, '');
    var ret = 0,
        digit = 0;

    for (var i = str.length - 1; i >= 0; i--) {
        var num = intAtOctal(str[i], digit++);
        if (num !== null) {
            ret += num;
        } else {
            if (THROW) {
                throw new Error('Invalid octal ' + str);
            }
            return null;
        }
    }

    return ret;
};

var intAtOctal = function(c, digit) {
    var num = null;
    var ascii = c.charCodeAt();

    if (ascii >= ASCII[0] && ascii <= ASCII[8]) {
        num = ascii - ASCII[0];
    } else {
        if (THROW) {
            throw new Error('Invalid char to Octal [' + c + ']');
        }
        return null;
    }

    while (digit--) {
        num *= 8;
    }
    return num;
};

exports.regslashes = function(pre) {
    return pre.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\|/g, '\\|');
};

exports.stripslashes = function(str) {
    return str.replace(/\\([\sA-Za-z\\]|[0-7]{1,3})/g, function(str, c) {
        switch (c) {
            case '\\':
                return '\\';
            case '0':
                return '\u0000';
            default:
                if (/^\w$/.test(c)) {
                    return getSpecialChar(c);
                } else if (/^\s$/.test(c)) {
                    return c;
                } else if (/([0-7]{1,3})/.test(c)) {
                    return getASCIIChar(c);
                }
                return str;
        }
    });
};

var getASCIIChar = function(str) {
    var num = exports.octal2int(str);
    return String.fromCharCode(num);
};

var getSpecialChar = function(letter) {
    switch (letter.toLowerCase()) {
        case 'b':
            return '\b';
        case 'f':
            return '\f';
        case 'n':
            return '\n';
        case 'r':
            return '\r';
        case 't':
            return '\t';
        case 'v':
            return '\v';
        default:
            return letter;
    }
};