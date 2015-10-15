_skipSpace = (s) ->
  r = /^\s*/.exec(s)
  if r and r.length > 0
    s.substring(r[0].length)
  else
    s

_read = (rt, reg, buf, type) ->
  r = reg.exec(buf)
  if not r? or r.length is 0
    rt.raiseException "input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf
  else
    r

module.exports = load: (rt) ->
  stdio = rt.config.stdio
  type = rt.newClass("istream", [])

  cin =
    t: type
    v:
      buf: stdio.drain()
      istream: stdio
      members: {}
    left: false
  rt.scope[0]["cin"] = cin
  pchar = rt.normalPointerType(rt.charTypeLiteral)
   
  rt.types[rt.getTypeSignature(type)] =
    "#father": "object"
    "o(>>)":
      "#default": (rt, _cin, t) ->
        if not t.left
          rt.raiseException "only left value can be used as storage"
        if not rt.isPrimitiveType(t.t)
          rt.raiseException ">> operator in istream cannot accept " + rt.makeTypeString(t.t)
        b = _cin.v.buf
        _cin.v.eofbit = b.length is 0
        switch t.t.name
          when "char", "signed char", "unsigned char"
            b = _skipSpace(b)
            r = _read(rt, /^./, b, t.t)
            v = r[0].charCodeAt(0)
          when "short", "short int", "signed short", "signed short int", "unsigned short", "unsigned short int", "int", "signed int", "unsigned", "unsigned int", "long", "long int", "long int", "signed long", "signed long int", "unsigned long", "unsigned long int", "long long", "long long int", "long long int", "signed long long", "signed long long int", "unsigned long long", "unsigned long long int"
            b = _skipSpace(b)
            r = _read(rt, /^[-+]?(?:([0-9]*)([eE]\+?[0-9]+)?)|0/, b, t.t)
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
        _cin.v.failbit = len is 0
        if not _cin.v.failbit
          t.v = rt.val(t.t, v).v
          _cin.v.buf = b.substring(len)
        return _cin

  _cinString = (rt, _cin, t) ->
    if not rt.isStringType t.t
      rt.raiseException "only a pointer to string can be used as storage"
    
    b = _cin.v.buf
    _cin.v.eofbit = b.length is 0

    b = _skipSpace(b)
    r = _read(rt, /^\S*/, b, t.t)[0]
    _cin.v.failbit = r.length is 0
    _cin.v.buf = b.substring(r.length)

    initialPos = t.v.position
    tar = t.v.target
    if tar.length - initialPos <= r.length
      rt.raiseException "target string buffer is #{r.length - (tar.length - initialPos)} too short"

    for i in [0...r.length]
      tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i))
    tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0)
    return _cin
  rt.regOperator(_cinString, cin.t, ">>", [pchar], cin.t)

  _getline = (rt, _cin, t, limit, delim) ->
    if not rt.isStringType t.t
      rt.raiseException "only a pointer to string can be used as storage"
    limit = limit.v
    delim = 
      if delim?
        delim.v
      else
        '\n'
    b = _cin.v.buf
    _cin.v.eofbit = b.length is 0

    r = _read(rt, new RegExp("^[^#{delim}]*"), b, t.t)[0]
    if r.length + 1 > limit
      r = r.substring(0, limit - 1)
    if b.charAt(r.length) is delim.charAt(0)
      removeDelim = true
      _cin.v.failbit = false
    else
      _cin.v.failbit = r.length is 0
    _cin.v.buf = b.substring(r.length + if removeDelim then 1 else 0)

    initialPos = t.v.position
    tar = t.v.target
    if tar.length - initialPos <= r.length
      rt.raiseException "target string buffer is #{r.length - (tar.length - initialPos)} too short"

    for i in [0...r.length]
      tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i))
    tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0)
    return _cin

  rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral, rt.charTypeLiteral], cin.t)
  rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral], cin.t)

  _get = (rt, _cin) ->
    b = _cin.v.buf
    _cin.v.eofbit = b.length is 0

    if _cin.v.eofbit
      rt.val(rt.intTypeLiteral, -1)
    else
      r = _read(rt, /^.|[\r\n]/, b, rt.charTypeLiteral)
      _cin.v.buf = b.substring(r.length)
      v = r[0].charCodeAt(0)
      rt.val(rt.intTypeLiteral, v)

  rt.regFunc(_get, cin.t, "get", [], rt.intTypeLiteral)

  _bool = (rt, _cin) ->
    rt.val(rt.boolTypeLiteral, not _cin.v.failbit)

  rt.regOperator(_bool, cin.t, "bool", [], rt.boolTypeLiteral)

  ########################## cout
  type = rt.newClass("ostream", [])
  cout = 
    t: rt.simpleType("ostream")
    v:
      ostream: stdio
      members: {}
    left: false
  rt.scope[0]["cout"] = cout

  rt.types[rt.getTypeSignature(cout.t)] =
    "#father": "object"
    "o(<<)":
      "#default": (rt, _cout, t) ->
        if _cout.manipulators?
          t = _cout.manipulators.use(t)
        if rt.isPrimitiveType(t.t)
          if t.t.name.indexOf("char") >= 0
            r = String.fromCharCode(t.v)
          else if t.t.name is "bool"
            r = if t.v then "1" else "0"
          else
            r = t.v.toString()
        else if rt.isStringType t.t
          r = rt.getStringFromCharArray t
        else
          rt.raiseException "<< operator in ostream cannot accept " + rt.makeTypeString(t.t)
        _cout.v.ostream.write r
        return _cout

  endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0))
  rt.scope[0]["endl"] = endl
  return