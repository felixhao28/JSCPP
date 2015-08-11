module.exports =
  load: (rt) ->
    m_w = 123456789
    m_z = 987654321
    mask = 0xffffffff

    # Takes any integer
    seed = (i) ->
      m_w = i

    # Returns number between 0 (inclusive) and 1.0 (exclusive),
    # just like Math.random().
    random = ->
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask
      result = ((m_z << 16) + m_w) & mask
      result / 4294967296 + 0.5
    
    pchar = rt.normalPointerType(rt.charTypeLiteral)

    _atof = (rt, _this, str) ->
      if rt.isStringType str.t
        str = rt.getStringFromCharArray str
        val = Number.parseFloat str
        rt.val rt.floatTypeLiteral, val
      else
        rt.raiseException "argument is not a string"

    rt.regFunc(_atof, "global", "atof", [pchar], rt.floatTypeLiteral)

    _atoi = (rt, _this, str) ->
      if rt.isStringType str.t
        str = rt.getStringFromCharArray str
        val = Number.parseInt str
        rt.val rt.intTypeLiteral, val
      else
        rt.raiseException "argument is not a string"

    rt.regFunc(_atoi, "global", "atoi", [pchar], rt.intTypeLiteral)

    _atol = (rt, _this, str) ->
      if rt.isStringType str.t
        str = rt.getStringFromCharArray str
        val = Number.parseInt str
        rt.val rt.longTypeLiteral, val
      else
        rt.raiseException "argument is not a string"

    rt.regFunc(_atol, "global", "atol", [pchar], rt.longTypeLiteral)

    if not rt.scope[0]["RAND_MAX"]?
      rt.scope[0]["RAND_MAX"] = 0x7fffffff

    _rand = (rt, _this) ->
      val = Math.floor(random() * (rt.scope[0]["RAND_MAX"] + 1))
      rt.val(rt.intTypeLiteral, val)

    rt.regFunc(_rand, "global", "rand", [], rt.intTypeLiteral)

    _srand = (rt, _this, i) ->
      seed(i.v)

    rt.regFunc(_srand, "global", "srand", [rt.unsignedintTypeLiteral], rt.voidTypeLiteral)

    _system = (rt, _this, command) ->
      if command is rt.nullPointer
        rt.val(rt.intTypeLiteral, 1)
      else if rt.isStringType command.t
        str = rt.getStringFromCharArray str
        try
          ret = eval str
          if ret?
            console.log ret
          rt.val(rt.intTypeLiteral, 1)
        catch e
          rt.val(rt.intTypeLiteral, 0)
      else
        rt.raiseException "command is not a string"

    rt.regFunc(_system, "global", "system", [pchar], rt.intTypeLiteral)

    rt.scope[0]["NULL"] = rt.nullPointer

    binary_search = (val, L, cmp) ->
      return false if L.length == 0
      mid = Math.floor(L.length / 2)
      cmpResult = cmp(val, L[mid], mid)
      if cmpResult is 0
        return mid
      else if cmpResult > 0
        binary_search(val, L[(mid + 1)..(L.length)])
      else
        binary_search(val, L[0..(mid - 1)])

    _bsearch = (rt, _this, key, base, num, size, cmp) ->
      if rt.isArrayType base
        L = base.v.target
        val = key
        wrapper = (a, b, indexB) ->
          pbType = base.t
          pbVal = rt.makeArrayPointerValue(L, indexB)
          pointerB = rt.val(pbType, pbVal)
          cmp(rt, null, a, pointerB).v
        bsRet = binary_search(val, L, wrapper)
        if bsRet is false
          rt.nullPointer
        else
          rt.val(base.t, rt.makeArrayPointerValue(L, bsRet))
      else
        rt.raiseException "base must be an array"

    cmpType = rt.functionPointerType(rt.intTypeLiteral, [rt.voidPointerType, rt.voidPointerType])
    rt.regFunc(_bsearch, "global", "bsearch", [rt.voidPointerType, rt.voidPointerType, rt.intTypeLiteral, rt.intTypeLiteral, cmpType], rt.voidPointerType)

    _qsort = (rt, _this, base, num, size, cmp) ->
      if rt.isArrayType base
        L = base.v.target
        for ele, i in L
          ele.index = i

        wrapper = (a, b) ->
          pType = base.t
          pbVal = rt.makeArrayPointerValue(L, b.index)
          paVal = rt.makeArrayPointerValue(L, a.index)
          pointerB = rt.val(pType, pbVal)
          pointerA = rt.val(pType, pbVal)
          cmp(rt, null, pointerA, pointerB).v

        L.sort(wrapper)
        return
      else
        rt.raiseException "base must be an array"

    rt.regFunc(_qsort, "global", "qsort", [rt.voidPointerType, rt.intTypeLiteral, rt.intTypeLiteral, cmpType], rt.voidTypeLiteral)

    _abs = (rt, _this, n) -> rt.val(rt.intTypeLiteral, Math.abs(n.v))

    rt.regFunc(_abs, "global", "abs", [rt.intTypeLiteral], rt.intTypeLiteral)

    _div = (rt, _this, numer, denom) ->
      if denom.v is 0
        rt.raiseException "divided by zero"
      quot = rt.val(rt.intTypeLiteral, Math.floor(numer.v / denom.v))
      rem = rt.val(rt.intTypeLiteral, numer.v % denom.v)
      t: div_t_t
      v:
        members:
          quot: quot
          rem: rem

    div_t_t = rt.newClass("div_t", [
        {
          type: rt.intTypeLiteral,
          name: "quot"
        },{
          type: rt.intTypeLiteral,
          name: "rem"
        }
      ]);

    rt.regFunc(_div, "global", "div", [rt.intTypeLiteral, rt.intTypeLiteral], div_t_t)

    _labs = (rt, _this, n) -> rt.val(rt.longTypeLiteral, Math.abs(n.v))

    rt.regFunc(_labs, "global", "labs", [rt.longTypeLiteral], rt.longTypeLiteral)

    _ldiv = (rt, _this, numer, denom) ->
      if denom.v is 0
        rt.raiseException "divided by zero"
      quot = rt.val(rt.longTypeLiteral, Math.floor(numer.v / denom.v))
      rem = rt.val(rt.longTypeLiteral, numer.v % denom.v)
      t: ldiv_t_t
      v:
        members:
          quot: quot
          rem: rem

    ldiv_t_t = rt.newClass("ldiv_t", [
        {
          type: rt.longTypeLiteral,
          name: "quot"
        },{
          type: rt.longTypeLiteral,
          name: "rem"
        }
      ]);

    rt.regFunc(_ldiv, "global", "ldiv", [rt.longTypeLiteral, rt.longTypeLiteral], ldiv_t_t)