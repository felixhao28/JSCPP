var _read, _skipSpace;

_skipSpace = function(s) {
  var r;
  r = /^\s*/.exec(s);
  if (r && r.length > 0) {
    return s.substring(r[0].length);
  } else {
    return s;
  }
};

_read = function(rt, reg, buf, type) {
  var r;
  r = reg.exec(buf);
  if ((r == null) || r.length === 0) {
    return rt.raiseException("input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf);
  } else {
    return r;
  }
};

module.exports = {
  load: function(rt) {
    var _bool, _cinString, _get, _getline, cin, cout, endl, pchar, stdio, type;
    stdio = rt.config.stdio;
    type = rt.newClass("istream", []);
    cin = {
      t: type,
      v: {
        buf: stdio.drain(),
        istream: stdio,
        members: {}
      },
      left: false
    };
    rt.scope[0]["cin"] = cin;
    pchar = rt.normalPointerType(rt.charTypeLiteral);
    rt.types[rt.getTypeSignature(type)] = {
      "#father": "object",
      "o(>>)": {
        "#default": function(rt, _cin, t) {
          var b, len, r, v;
          if (!t.left) {
            rt.raiseException("only left value can be used as storage");
          }
          if (!rt.isPrimitiveType(t.t)) {
            rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));
          }
          b = _cin.v.buf;
          _cin.v.eofbit = b.length === 0;
          switch (t.t.name) {
            case "char":
            case "signed char":
            case "unsigned char":
              b = _skipSpace(b);
              r = _read(rt, /^./, b, t.t);
              v = r[0].charCodeAt(0);
              break;
            case "short":
            case "short int":
            case "signed short":
            case "signed short int":
            case "unsigned short":
            case "unsigned short int":
            case "int":
            case "signed int":
            case "unsigned":
            case "unsigned int":
            case "long":
            case "long int":
            case "long int":
            case "signed long":
            case "signed long int":
            case "unsigned long":
            case "unsigned long int":
            case "long long":
            case "long long int":
            case "long long int":
            case "signed long long":
            case "signed long long int":
            case "unsigned long long":
            case "unsigned long long int":
              b = _skipSpace(b);
              r = _read(rt, /^[-+]?(?:([0-9]*)([eE]\+?[0-9]+)?)|0/, b, t.t);
              v = parseInt(r[0]);
              break;
            case "float":
            case "double":
              b = _skipSpace(b);
              r = _read(rt, /^[-+]?(?:[0-9]*\.[0-9]+([eE][-+]?[0-9]+)?)|(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)/, b, t.t);
              v = parseFloat(r[0]);
              break;
            case "bool":
              b = _skipSpace(b);
              r = _read(rt, /^(true|false)/, b, t.t);
              v = r[0] === "true";
              break;
            default:
              rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));
          }
          len = r[0].length;
          _cin.v.failbit = len === 0;
          if (!_cin.v.failbit) {
            t.v = rt.val(t.t, v).v;
            _cin.v.buf = b.substring(len);
          }
          return _cin;
        }
      }
    };
    _cinString = function(rt, _cin, t) {
      var b, i, initialPos, j, r, ref, tar;
      if (!rt.isStringType(t.t)) {
        rt.raiseException("only a pointer to string can be used as storage");
      }
      b = _cin.v.buf;
      _cin.v.eofbit = b.length === 0;
      b = _skipSpace(b);
      r = _read(rt, /^\S*/, b, t.t)[0];
      _cin.v.failbit = r.length === 0;
      _cin.v.buf = b.substring(r.length);
      initialPos = t.v.position;
      tar = t.v.target;
      if (tar.length - initialPos <= r.length) {
        rt.raiseException("target string buffer is " + (r.length - (tar.length - initialPos)) + " too short");
      }
      for (i = j = 0, ref = r.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i));
      }
      tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0);
      return _cin;
    };
    rt.regOperator(_cinString, cin.t, ">>", [pchar], cin.t);
    _getline = function(rt, _cin, t, limit, delim) {
      var b, i, initialPos, j, r, ref, removeDelim, tar;
      if (!rt.isStringType(t.t)) {
        rt.raiseException("only a pointer to string can be used as storage");
      }
      limit = limit.v;
      delim = delim != null ? delim.v : '\n';
      b = _cin.v.buf;
      _cin.v.eofbit = b.length === 0;
      r = _read(rt, new RegExp("^[^" + delim + "]*"), b, t.t)[0];
      if (r.length + 1 > limit) {
        r = r.substring(0, limit - 1);
      }
      if (b.charAt(r.length) === delim.charAt(0)) {
        removeDelim = true;
        _cin.v.failbit = false;
      } else {
        _cin.v.failbit = r.length === 0;
      }
      _cin.v.buf = b.substring(r.length + (removeDelim ? 1 : 0));
      initialPos = t.v.position;
      tar = t.v.target;
      if (tar.length - initialPos <= r.length) {
        rt.raiseException("target string buffer is " + (r.length - (tar.length - initialPos)) + " too short");
      }
      for (i = j = 0, ref = r.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        tar[i + initialPos] = rt.val(rt.charTypeLiteral, r.charCodeAt(i));
      }
      tar[r.length + initialPos] = rt.val(rt.charTypeLiteral, 0);
      return _cin;
    };
    rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral, rt.charTypeLiteral], cin.t);
    rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral], cin.t);
    _get = function(rt, _cin) {
      var b, r, v;
      b = _cin.v.buf;
      _cin.v.eofbit = b.length === 0;
      if (_cin.v.eofbit) {
        return rt.val(rt.intTypeLiteral, -1);
      } else {
        r = _read(rt, /^.|[\r\n]/, b, rt.charTypeLiteral);
        _cin.v.buf = b.substring(r.length);
        v = r[0].charCodeAt(0);
        return rt.val(rt.intTypeLiteral, v);
      }
    };
    rt.regFunc(_get, cin.t, "get", [], rt.intTypeLiteral);
    _bool = function(rt, _cin) {
      return rt.val(rt.boolTypeLiteral, !_cin.v.failbit);
    };
    rt.regOperator(_bool, cin.t, "bool", [], rt.boolTypeLiteral);
    type = rt.newClass("ostream", []);
    cout = {
      t: rt.simpleType("ostream"),
      v: {
        ostream: stdio,
        members: {}
      },
      left: false
    };
    rt.scope[0]["cout"] = cout;
    rt.types[rt.getTypeSignature(cout.t)] = {
      "#father": "object",
      "o(<<)": {
        "#default": function(rt, _cout, t) {
          var r;
          if (_cout.manipulators != null) {
            t = _cout.manipulators.use(t);
          }
          if (rt.isPrimitiveType(t.t)) {
            if (t.t.name.indexOf("char") >= 0) {
              r = String.fromCharCode(t.v);
            } else if (t.t.name === "bool") {
              r = t.v ? "1" : "0";
            } else {
              r = t.v.toString();
            }
          } else if (rt.isStringType(t.t)) {
            r = rt.getStringFromCharArray(t);
          } else {
            rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(t.t));
          }
          _cout.v.ostream.write(r);
          return _cout;
        }
      }
    };
    endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0));
    rt.scope[0]["endl"] = endl;
  }
};
