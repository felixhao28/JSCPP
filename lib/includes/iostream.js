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
  if (!r || r.length === 0) {
    throw "input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf;
  } else {
    return r;
  }
};

module.exports = {
  load: function(rt) {
    var cin, cout, endl, stdio, type;
    stdio = rt.config.stdio;
    type = rt.newClass("istream", []);
    cin = {
      t: type,
      v: {
        buf: "",
        istream: stdio,
        members: []
      },
      left: false
    };
    rt.scope[0]["cin"] = cin;
    rt.types[rt.getTypeSigniture(type)] = {
      "#father": "object",
      ">>": {
        "#default": function(rt, _cin, t) {
          var type;
          var b, len, r, v;
          if (!rt.isPrimitiveType(t.t)) {
            throw ">> operator in istream cannot accept " + rt.makeTypeString(t.t);
          }
          if (!t.left) {
            throw "only left value can be used as storage";
          }
          b = _cin.v.buf;
          r = void 0;
          v = void 0;
          if (b.length === 0) {
            b = _cin.v.istream.drain();
            if (b === null) {
              return rt.val(rt.boolTypeLiteral, false);
            }
          }
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
              r = _read(rt, /^[-+]?(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)|0/, b, t.t);
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
              throw ">> operator in istream cannot accept " + rt.makeTypeString(t.t);
          }
          len = r[0].length;
          t.v = rt.val(t.t, v).v;
          _cin.v.buf = b.substring(len);
          return _cin;
        }
      }
    };
    type = rt.newClass("ostream", []);
    cout = {
      t: rt.simpleType("ostream"),
      v: {
        ostream: stdio,
        members: []
      },
      left: false
    };
    rt.scope[0]["cout"] = cout;
    rt.types[rt.getTypeSigniture(cout.t)] = {
      "#father": "object",
      "<<": {
        "#default": function(rt, _cout, t) {
          var r;
          if (rt.isPrimitiveType(t.t)) {
            if (t.t.name.indexOf("char") >= 0) {
              r = String.fromCharCode(t.v);
            } else {
              r = t.v.toString();
            }
          } else {
            throw "<< operator in ostream cannot accept " + rt.makeTypeString(t.t);
          }
          _cout.v.ostream.write(r);
          return _cout;
        }
      }
    };
    rt.types[rt.getTypeSigniture(cout.t)]["<<"][rt.makeParametersSigniture([rt.arrayPointerType(rt.charTypeLiteral, 0)])] = function(rt, _cout, t) {
      var str;
      if (rt.isStringType(t.t)) {
        str = rt.getStringFromCharArray(t);
        _cout.v.ostream.write(str);
      }
      return _cout;
    };
    endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0));
    rt.scope[0]["endl"] = endl;
  }
};
