module.exports = load: (rt) ->
  pchar = rt.normalPointerType(rt.charTypeLiteral)
  sizet = rt.primitiveType("unsigned int")

  _strcpy = require "./shared/cstring_strcpy"

  rt.regFunc _strcpy, "global", "strcpy", [pchar,pchar], pchar
  rt.regFunc ((rt, _this, dest, src, num) ->
    if rt.isArrayType(dest.t) and rt.isArrayType(src.t)
      srcarr = src.v.target
      i = src.v.position
      destarr = dest.v.target
      j = dest.v.position
      while num > 0 and i < srcarr.length and j < destarr.length - 1 and srcarr[i].v != 0
        destarr[j] = rt.clone(srcarr[i])
        num--
        i++
        j++
      if srcarr[i].v is 0
        # padding zeroes
        while num > 0 and j < destarr.length
          destarr[j++] = rt.val(rt.charTypeLiteral, 0)
      if i is srcarr.length
        rt.raiseException "source string does not have a pending \"\\0\""
      else if j is destarr.length - 1
        rt.raiseException "destination array is not big enough"
    else
      rt.raiseException "destination or source is not an array"
    dest
  ), "global", "strncpy", [
    pchar
    pchar
    sizet
  ], pchar
  rt.regFunc ((rt, _this, dest, src) ->
    if rt.isArrayType(dest.t) and rt.isArrayType(src.t)
      srcarr = src.v.target
      destarr = dest.v.target
      if srcarr is destarr
        i = src.v.position
        j = dest.v.position
        if i < j
          lensrc = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ src ]).v
          if i + lensrc + 1 >= j
            rt.raiseException "overlap is not allowed"
        else
          lensrc = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ src ]).v
          lendest = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ dest ]).v
          if j + lensrc + lendest + 1 >= i
            rt.raiseException "overlap is not allowed"
      lendest = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ dest ]).v
      newDest = rt.val(pchar, rt.makeArrayPointerValue(dest.v.target, dest.v.position + lendest))
      return rt.getFunc("global", "strcpy", [
        pchar
        pchar
      ])(rt, null, [
        newDest
        src
      ])
    else
      rt.raiseException "destination or source is not an array"
    dest
  ), "global", "strcat", [
    pchar
    pchar
  ], pchar
  rt.regFunc ((rt, _this, dest, src, num) ->
    if rt.isArrayType(dest.t) and rt.isArrayType(src.t)
      srcarr = src.v.target
      destarr = dest.v.target
      if srcarr is destarr
        i = src.v.position
        j = dest.v.position
        if i < j
          lensrc = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ src ]).v
          if lensrc > num
            lensrc = num
          if i + lensrc + 1 >= j
            rt.raiseException "overlap is not allowed"
        else
          lensrc = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ src ]).v
          if lensrc > num
            lensrc = num
          lendest = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ dest ]).v
          if j + lensrc + lendest + 1 >= i
            rt.raiseException "overlap is not allowed"
      lendest = rt.getFunc("global", "strlen", [ pchar ])(rt, null, [ dest ]).v
      newDest = rt.val(pchar, rt.makeArrayPointerValue(dest.v.target, dest.v.position + lendest))
      return rt.getFunc("global", "strncpy", [
        pchar
        pchar
        sizet
      ])(rt, null, [
        newDest
        src
        num
      ])
    else
      rt.raiseException "destination or source is not an array"
    dest
  ), "global", "strncat", [
    pchar
    pchar
    sizet
  ], pchar
  rt.regFunc ((rt, _this, str) ->
    if rt.isArrayType(str.t)
      arr = str.v.target
      i = str.v.position
      while i < arr.length and arr[i].v != 0
        i++
      if i is arr.length
        rt.raiseException "target string does not have a pending \"\\0\""
      else
        return rt.val(rt.intTypeLiteral, i - str.v.position)
    else
      rt.raiseException "target is not an array"
  ), "global", "strlen", [ pchar ], sizet
  rt.regFunc ((rt, _this, dest, src) ->
    if rt.isArrayType(dest.t) and rt.isArrayType(src.t)
      srcarr = src.v.target
      i = src.v.position
      destarr = dest.v.target
      j = dest.v.position
      while i < srcarr.length and j < destarr.length and srcarr[i].v is destarr[i].v
        i++
        j++
      return rt.val(rt.intTypeLiteral, destarr[i].v - srcarr[i].v)
    else
      rt.raiseException "str1 or str2 is not an array"
  ), "global", "strcmp", [
    pchar
    pchar
  ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, dest, src, num) ->
    if rt.isArrayType(dest.t) and rt.isArrayType(src.t)
      srcarr = src.v.target
      i = src.v.position
      destarr = dest.v.target
      j = dest.v.position
      while num > 0 and i < srcarr.length and j < destarr.length and srcarr[i].v is destarr[i].v
        i++
        j++
        num--
      return rt.val(rt.intTypeLiteral, destarr[i].v - srcarr[i].v)
    else
      rt.raiseException "str1 or str2 is not an array"
  ), "global", "strncmp", [
    pchar
    pchar
    sizet
  ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, str, ch) ->
    if rt.isArrayType(str.t)
      arr = str.v.target
      i = str.v.position
      while i < arr.length and arr[i].v != 0 and arr[i].v != ch.v
        i++
      if arr[i].v is 0
        return rt.val(pchar, rt.nullPointerValue)
      else if arr[i].v is ch.v
        return rt.val(pchar, rt.makeArrayPointerValue(arr, i))
      else
        rt.raiseException "target string does not have a pending \"\\0\""
    else
      rt.raiseException "str1 or str2 is not an array"
  ), "global", "strchr", [
    pchar
    rt.charTypeLiteral
  ], pchar
  rt.regFunc ((rt, _this, str, ch) ->
    if rt.isArrayType(str.t)
      arr = str.v.target
      i = str.v.position
      lastpos = -1
      while i < arr.length and arr[i].v != 0
        if arr[i].v is ch.v
          lastpos = i
        i++
      if arr[i].v is 0
        if lastpos >= 0
          return rt.val(pchar, rt.makeArrayPointerValue(arr, lastpos))
        else
          return rt.val(pchar, rt.nullPointerValue)
      else
        rt.raiseException "target string does not have a pending \"\\0\""
    else
      rt.raiseException "str1 or str2 is not an array"
  ), "global", "strrchr", [
    pchar
    rt.charTypeLiteral
  ], pchar
  rt.regFunc ((rt, _this, str1, str2) ->
    if rt.isArrayType(str1.t) and rt.isArrayType(str2.t)
      # BM?
      arr = str1.v.target
      i = str1.v.position
      tar = str2.v.target
      while i < arr.length and arr[i].v != 0
        j = str2.v.position
        _i = i
        while j < tar.length and str1[_i].v is str2[j]
          _i++
          j++
        if j is tar.length
          break
        i++
      if arr[i].v is 0
        return rt.val(pchar, rt.nullPointerValue)
      else if i is arr.length
        rt.raiseException "target string does not have a pending \"\\0\""
      else
        return rt.val(pchar, rt.makeArrayPointerValue(arr, i))
    else
      rt.raiseException "str1 or str2 is not an array"
  ), "global", "strstr", [
    pchar
    rt.charTypeLiteral
  ], pchar