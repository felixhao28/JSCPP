module.exports = {
  load: function(rt) {
    var _abs, _atof, _atoi, _atol, _bsearch, _div, _labs, _ldiv, _qsort, _rand, _srand, _system, binary_search, cmpType, div_t_t, ldiv_t_t, m_w, m_z, mask, pchar, random, seed;
    m_w = 123456789;
    m_z = 987654321;
    mask = 0xffffffff;
    seed = function(i) {
      return m_w = i;
    };
    random = function() {
      var result;
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
      result = ((m_z << 16) + m_w) & mask;
      return result / 4294967296 + 0.5;
    };
    pchar = rt.normalPointerType(rt.charTypeLiteral);
    _atof = function(rt, _this, str) {
      var val;
      if (rt.isStringType(str.t)) {
        str = rt.getStringFromCharArray(str);
        val = Number.parseFloat(str);
        return rt.val(rt.floatTypeLiteral, val);
      } else {
        return rt.raiseException("argument is not a string");
      }
    };
    rt.regFunc(_atof, "global", "atof", [pchar], rt.floatTypeLiteral);
    _atoi = function(rt, _this, str) {
      var val;
      if (rt.isStringType(str.t)) {
        str = rt.getStringFromCharArray(str);
        val = Number.parseInt(str);
        return rt.val(rt.intTypeLiteral, val);
      } else {
        return rt.raiseException("argument is not a string");
      }
    };
    rt.regFunc(_atoi, "global", "atoi", [pchar], rt.intTypeLiteral);
    _atol = function(rt, _this, str) {
      var val;
      if (rt.isStringType(str.t)) {
        str = rt.getStringFromCharArray(str);
        val = Number.parseInt(str);
        return rt.val(rt.longTypeLiteral, val);
      } else {
        return rt.raiseException("argument is not a string");
      }
    };
    rt.regFunc(_atol, "global", "atol", [pchar], rt.longTypeLiteral);
    if (rt.scope[0]["RAND_MAX"] == null) {
      rt.scope[0]["RAND_MAX"] = 0x7fffffff;
    }
    _rand = function(rt, _this) {
      var val;
      val = Math.floor(random() * (rt.scope[0]["RAND_MAX"] + 1));
      return rt.val(rt.intTypeLiteral, val);
    };
    rt.regFunc(_rand, "global", "rand", [], rt.intTypeLiteral);
    _srand = function(rt, _this, i) {
      return seed(i.v);
    };
    rt.regFunc(_srand, "global", "srand", [rt.unsignedintTypeLiteral], rt.voidTypeLiteral);
    _system = function(rt, _this, command) {
      var e, error, ret, str;
      if (command === rt.nullPointer) {
        return rt.val(rt.intTypeLiteral, 1);
      } else if (rt.isStringType(command.t)) {
        str = rt.getStringFromCharArray(str);
        try {
          ret = eval(str);
          if (ret != null) {
            console.log(ret);
          }
          return rt.val(rt.intTypeLiteral, 1);
        } catch (error) {
          e = error;
          return rt.val(rt.intTypeLiteral, 0);
        }
      } else {
        return rt.raiseException("command is not a string");
      }
    };
    rt.regFunc(_system, "global", "system", [pchar], rt.intTypeLiteral);
    rt.scope[0]["NULL"] = rt.nullPointer;
    binary_search = function(val, L, cmp) {
      var cmpResult, mid;
      if (L.length === 0) {
        return false;
      }
      mid = Math.floor(L.length / 2);
      cmpResult = cmp(val, L[mid], mid);
      if (cmpResult === 0) {
        return mid;
      } else if (cmpResult > 0) {
        return binary_search(val, L.slice(mid + 1, +L.length + 1 || 9e9));
      } else {
        return binary_search(val, L.slice(0, +(mid - 1) + 1 || 9e9));
      }
    };
    _bsearch = function(rt, _this, key, base, num, size, cmp) {
      var L, bsRet, val, wrapper;
      if (rt.isArrayType(base)) {
        L = base.v.target;
        val = key;
        wrapper = function(a, b, indexB) {
          var pbType, pbVal, pointerB;
          pbType = base.t;
          pbVal = rt.makeArrayPointerValue(L, indexB);
          pointerB = rt.val(pbType, pbVal);
          return cmp(rt, null, a, pointerB).v;
        };
        bsRet = binary_search(val, L, wrapper);
        if (bsRet === false) {
          return rt.nullPointer;
        } else {
          return rt.val(base.t, rt.makeArrayPointerValue(L, bsRet));
        }
      } else {
        return rt.raiseException("base must be an array");
      }
    };
    cmpType = rt.functionPointerType(rt.intTypeLiteral, [rt.voidPointerType, rt.voidPointerType]);
    rt.regFunc(_bsearch, "global", "bsearch", [rt.voidPointerType, rt.voidPointerType, rt.intTypeLiteral, rt.intTypeLiteral, cmpType], rt.voidPointerType);
    _qsort = function(rt, _this, base, num, size, cmp) {
      var L, ele, i, j, len, wrapper;
      if (rt.isArrayType(base)) {
        L = base.v.target;
        for (i = j = 0, len = L.length; j < len; i = ++j) {
          ele = L[i];
          ele.index = i;
        }
        wrapper = function(a, b) {
          var pType, paVal, pbVal, pointerA, pointerB;
          pType = base.t;
          pbVal = rt.makeArrayPointerValue(L, b.index);
          paVal = rt.makeArrayPointerValue(L, a.index);
          pointerB = rt.val(pType, pbVal);
          pointerA = rt.val(pType, pbVal);
          return cmp(rt, null, pointerA, pointerB).v;
        };
        L.sort(wrapper);
      } else {
        return rt.raiseException("base must be an array");
      }
    };
    rt.regFunc(_qsort, "global", "qsort", [rt.voidPointerType, rt.intTypeLiteral, rt.intTypeLiteral, cmpType], rt.voidTypeLiteral);
    _abs = function(rt, _this, n) {
      return rt.val(rt.intTypeLiteral, Math.abs(n.v));
    };
    rt.regFunc(_abs, "global", "abs", [rt.intTypeLiteral], rt.intTypeLiteral);
    _div = function(rt, _this, numer, denom) {
      var quot, rem;
      if (denom.v === 0) {
        rt.raiseException("divided by zero");
      }
      quot = rt.val(rt.intTypeLiteral, Math.floor(numer.v / denom.v));
      rem = rt.val(rt.intTypeLiteral, numer.v % denom.v);
      return {
        t: div_t_t,
        v: {
          members: {
            quot: quot,
            rem: rem
          }
        }
      };
    };
    div_t_t = rt.newClass("div_t", [
      {
        type: rt.intTypeLiteral,
        name: "quot"
      }, {
        type: rt.intTypeLiteral,
        name: "rem"
      }
    ]);
    rt.regFunc(_div, "global", "div", [rt.intTypeLiteral, rt.intTypeLiteral], div_t_t);
    _labs = function(rt, _this, n) {
      return rt.val(rt.longTypeLiteral, Math.abs(n.v));
    };
    rt.regFunc(_labs, "global", "labs", [rt.longTypeLiteral], rt.longTypeLiteral);
    _ldiv = function(rt, _this, numer, denom) {
      var quot, rem;
      if (denom.v === 0) {
        rt.raiseException("divided by zero");
      }
      quot = rt.val(rt.longTypeLiteral, Math.floor(numer.v / denom.v));
      rem = rt.val(rt.longTypeLiteral, numer.v % denom.v);
      return {
        t: ldiv_t_t,
        v: {
          members: {
            quot: quot,
            rem: rem
          }
        }
      };
    };
    ldiv_t_t = rt.newClass("ldiv_t", [
      {
        type: rt.longTypeLiteral,
        name: "quot"
      }, {
        type: rt.longTypeLiteral,
        name: "rem"
      }
    ]);
    return rt.regFunc(_ldiv, "global", "ldiv", [rt.longTypeLiteral, rt.longTypeLiteral], ldiv_t_t);
  }
};
