_skipSpace = (s) ->
    r = /^\s*/.exec(s)
    if r and r.length > 0
        s.substring(r[0].length)
    else
        s

_read = (rt, reg, buf, type) ->
    r = reg.exec(buf)
    if !r or r.length == 0
        rt.raiseException "input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf
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
    pchar = rt.normalPointerType(rt.charTypeLiteral)
    _cinString = (rt, _cin, t) ->
        if not rt.isStringType t.t
            rt.raiseException "only a pointer to string can be used as storage"
        
        b = _cin.v.buf
        if b.length == 0
            b = _cin.v.istream.drain()
            if b == null
                return rt.val(rt.boolTypeLiteral, false)

        b = _skipSpace(b)
        r = _read(rt, /^\S*/, b, t.t)[0]
        _cin.v.buf = b.substring(r.length)

        initialPos = t.v.position
        tar = t.v.target
        if tar.length - initialPos <= r.length
            rt.raiseException "target string buffer is #{r.length - (tar.length - initialPos)} too short"

        for i in [0...r.length]
            tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i))
        tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0)
        _cin
                
    rt.types[rt.getTypeSigniture(type)] =
        "#father": "object"
        ">>":
            "#default": (rt, _cin, t) ->
                if !t.left
                    rt.raiseException "only left value can be used as storage"
                if !rt.isPrimitiveType(t.t)
                    rt.raiseException ">> operator in istream cannot accept " + rt.makeTypeString(t.t)
                b = _cin.v.buf
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
                        rt.raiseException ">> operator in istream cannot accept " + rt.makeTypeString(t.t)
                len = r[0].length
                t.v = rt.val(t.t, v).v
                _cin.v.buf = b.substring(len)
                _cin

    rt.regFunc(_cinString, cin.t, ">>", [pchar], cin.t)

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
        "<<":
            "#default": (rt, _cout, t) ->
                if rt.isPrimitiveType(t.t)
                    if t.t.name.indexOf("char") >= 0
                        r = String.fromCharCode(t.v)
                    else if t.t.name is "bool"
                        r = if t.v then 1 else 0
                    else
                        r = t.v.toString()
                else
                    rt.raiseException "<< operator in ostream cannot accept " + rt.makeTypeString(t.t)
                if rt.config.debug
                    rt.debugOutput ?= ""
                    rt.debugOutput += r
                else
                    _cout.v.ostream.write r
                _cout
    
    coutString = (rt, _cout, t) ->
        if rt.isStringType t.t
            str = rt.getStringFromCharArray t
            if rt.config.debug
                rt.debugOutput ?= ""
                rt.debugOutput += str
            else
                _cout.v.ostream.write str
            _cout
        else
            rt.raiseException "<< operator in ostream cannot accept char*"

    rt.regFunc(coutString, cout.t, "<<", [pchar], cout.t)

    endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0))
    rt.scope[0]["endl"] = endl
    return