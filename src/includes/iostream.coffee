_skipSpace = (s) ->
    r = /^\s*/.exec(s)
    if r and r.length > 0
        s.substring(r[0].length)
    else
        s

_read = (rt, reg, buf, type) ->
    r = reg.exec(buf)
    if !r or r.length == 0
        throw "input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf
    else
        r

module.exports = load: (rt) ->
    stdio = rt.config.stdio
    type = rt.newClass("istream", [])
    cin = 
        t: type
        v:
            buf: ""
            istream: stdio
            members: []
        left: false
    rt.scope[0]["cin"] = cin
    rt.types[rt.getTypeSigniture(type)] =
        "#father": "object"
        ">>": "#default": (rt, _cin, t) ->
            `var type`
            if !rt.isPrimitiveType(t.t)
                throw ">> operator in istream cannot accept " + rt.makeTypeString(t.t)
            if !t.left
                throw "only left value can be used as storage"
            b = _cin.v.buf
            r = undefined
            v = undefined
            if b.length == 0
                b = _cin.v.istream.drain()
                if b == null
                    return rt.val(rt.boolTypeLiteral, false)
            switch t.t.name
                when "char", "signed char", "unsigned char"
                    b = _skipSpace(b)
                    r = _read(rt, /^./, b, t.t)
                    v = r[0].charCodeAt(0)
                when "short", "short int", "signed short", "signed short int", "unsigned short", "unsigned short int", "int", "signed int", "unsigned", "unsigned int", "long", "long int", "long int", "signed long", "signed long int", "unsigned long", "unsigned long int", "long long", "long long int", "long long int", "signed long long", "signed long long int", "unsigned long long", "unsigned long long int"
                    b = _skipSpace(b)
                    r = _read(rt, /^[-+]?(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)|0/, b, t.t)
                    v = parseInt(r[0])
                when "float", "double"
                    b = _skipSpace(b)
                    r = _read(rt, /^[-+]?(?:[0-9]*\.[0-9]+([eE][-+]?[0-9]+)?)|(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)/, b, t.t)
                    v = parseFloat(r[0])
                when "bool"
                    b = _skipSpace(b)
                    r = _read(rt, /^(true|false)/, b, t.t)
                    v = r[0] is "true"
                else
                    throw ">> operator in istream cannot accept " + rt.makeTypeString(t.t)
            len = r[0].length
            t.v = rt.val(t.t, v).v
            _cin.v.buf = b.substring(len)
            _cin
    type = rt.newClass("ostream", [])
    cout = 
        t: rt.simpleType("ostream")
        v:
            ostream: stdio
            members: []
        left: false
    rt.scope[0]["cout"] = cout
    rt.types[rt.getTypeSigniture(cout.t)] =
        "#father": "object"
        "<<": "#default": (rt, _cout, t) ->
            if rt.isPrimitiveType(t.t)
                if t.t.name.indexOf("char") >= 0
                    r = String.fromCharCode(t.v)
                else if t.t.name is "bool"
                    r = if t.v then 1 else 0
                else
                    r = t.v.toString()
            else
                throw "<< operator in ostream cannot accept " + rt.makeTypeString(t.t)
            _cout.v.ostream.write r
            _cout

    rt.types[rt.getTypeSigniture(cout.t)]["<<"][rt.makeParametersSigniture([ rt.arrayPointerType(rt.charTypeLiteral, 0) ])] = (rt, _cout, t) ->
        if rt.isStringType t.t
            str = rt.getStringFromCharArray t
            _cout.v.ostream.write str
        _cout

    endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0))
    rt.scope[0]["endl"] = endl
    return