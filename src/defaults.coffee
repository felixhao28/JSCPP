module.exports = ->
  defaults = this
  @config =  
    specifiers: ["const", "inline", "_stdcall", "extern", "static", "auto", "register"]
    charTypes: ["char", "signed char", "unsigned char", "wchar_t",
          "unsigned wchar_t", "char16_t", "unsigned char16_t",
          "char32_t", "unsigned char32_t"]
    intTypes: ["short", "short int", "signed short", "signed short int",
          "unsigned short", "unsigned short int", "int", "signed int",
          "unsigned", "unsigned int", "long", "long int", "long int",
          "signed long", "signed long int", "unsigned long",
          "unsigned long int", "long long", "long long int",
          "long long int", "signed long long", "signed long long int",
          "unsigned long long", "unsigned long long int", "bool"]
    limits:
      "char":
        max: 0x7f
        min: 0x00
        bytes: 1
      "signed char":
        max: 0x7f
        min: -0x80
        bytes: 1
      "unsigned char":
        max: 0xff
        min: 0x00
        bytes: 1
      "wchar_t":
        max: 0x7fffffff
        min: -0x80000000
        bytes: 4
      "unsigned wchar_t":
        max: 0xffffffff
        min: 0x00000000
        bytes: 4
      "char16_t":
        max: 0x7fff
        min: -0x8000
        bytes: 4
      "unsigned char16_t":
        max: 0xffff
        min: 0x0000
        bytes: 4
      "char32_t":
        max: 0x7fffffff
        min: -0x80000000
        bytes: 4
      "unsigned char32_t":
        max: 0xffffffff
        min: 0x00000000
        bytes: 4
      "short":
        max: 0x7fff
        min: -0x8000
        bytes: 2
      "unsigned short":
        max: 0xffff
        min: 0x0000
        bytes: 2
      "int":
        max: 0x7fffffff
        min: -0x80000000
        bytes: 4
      "unsigned":
        max: 0xffffffff
        min: 0x00000000
        bytes: 4
      "long":
        max: 0x7fffffff
        min: -0x80000000
        bytes: 4
      "unsigned long":
        max: 0xffffffff
        min: 0x00000000
        bytes: 4
      "long long":
        max: 0x7fffffffffffffff
        min: -0x8000000000000000
        bytes: 8
      "unsigned long long":
        max: 0xffffffffffffffff
        min: 0x0000000000000000
        bytes: 8
      "float":
        max: 3.40282346638529e+038
        min: -3.40282346638529e+038
        bytes: 4
      "double":
        max: 1.79769313486232e+308
        min: -1.79769313486232e+308
        bytes: 8
      "pointer":
        max: undefined
        min: undefined
        bytes: 4
      "bool":
        max: 1
        min: 0
        bytes: 1
    loadedLibraries: []
  @config.limits["short int"] = @config.limits["short"]
  @config.limits["signed short"] = @config.limits["short"]
  @config.limits["signed short int"] = @config.limits["short"]
  @config.limits["unsigned short int"] = @config.limits["unsigned short"]
  @config.limits["signed int"] = @config.limits["int"]
  @config.limits["unsigned int"] = @config.limits["unsigned"]
  @config.limits["long int"] = @config.limits["long"]
  @config.limits["long int"] = @config.limits["long"]
  @config.limits["signed long"] = @config.limits["long"]
  @config.limits["signed long int"] = @config.limits["long"]
  @config.limits["unsigned long int"] = @config.limits["unsigned long"]
  @config.limits["long long int"] = @config.limits["long long"]
  @config.limits["long long int"] = @config.limits["long long"]
  @config.limits["signed long long"] = @config.limits["long long"]
  @config.limits["signed long long int"] = @config.limits["long long"]
  @config.limits["unsigned long long int"] = @config.limits["unsigned long long"]

  @numericTypeOrder = [
    "char"
    "signed char"
    "short"
    "short int"
    "signed short"
    "signed short int"
    "int"
    "signed int"
    "long"
    "long int"
    "long int"
    "signed long"
    "signed long int"
    "long long"
    "long long int"
    "long long int"
    "signed long long"
    "signed long long int"
    "float"
    "double"
  ]
  defaultOpHandler = 
    "o(*)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support * on " + rt.makeTypeString(r.t)
      ret = l.v * r.v
      rett = rt.promoteNumeric(l.t, r.t)
      rt.val rett, ret
    "o(/)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support / on " + rt.makeTypeString(r.t)
      ret = l.v / r.v
      if rt.isIntegerType(l.t) and rt.isIntegerType(r.t)
        ret = Math.floor(ret)
      rett = rt.promoteNumeric(l.t, r.t)
      rt.val rett, ret
    "o(%)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t) or not rt.isIntegerType(l.t) or not rt.isIntegerType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support % on " + rt.makeTypeString(r.t)
      ret = l.v % r.v
      rett = rt.promoteNumeric(l.t, r.t)
      rt.val rett, ret
    "o(+)": "#default": (rt, l, r) ->
      if r == undefined
        # unary
        l
      else
        if not rt.isNumericType(r.t)
          rt.raiseException rt.makeTypeString(l.t) + " does not support + on " + rt.makeTypeString(r.t)
        if rt.isArrayType(r.t)
          i = rt.cast(rt.intTypeLiteral, l).v
          rt.val r.t, rt.makeArrayPointerValue(r.v.target, r.v.position + i)
        else
          ret = l.v + r.v
          rett = rt.promoteNumeric(l.t, r.t)
          rt.val rett, ret
    "o(-)": "#default": (rt, l, r) ->
      if r == undefined
        # unary
        rett = if l.v > 0 then rt.getSignedType(l.t) else l.t
        rt.val rett, -l.v
      else
        # binary
        if not rt.isNumericType(r.t)
          rt.raiseException rt.makeTypeString(l.t) + " does not support - on " + rt.makeTypeString(r.t)
        ret = l.v - r.v
        rett = rt.promoteNumeric(l.t, r.t)
        rt.val rett, ret
    "o(<<)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t) or not rt.isIntegerType(l.t) or not rt.isIntegerType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support << on " + rt.makeTypeString(r.t)
      ret = l.v << r.v
      rett = l.t
      rt.val rett, ret
    "o(>>)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t) or not rt.isIntegerType(l.t) or not rt.isIntegerType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support >> on " + rt.makeTypeString(r.t)
      ret = l.v >> r.v
      rett = l.t
      rt.val rett, ret
    "o(<)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support < on " + rt.makeTypeString(r.t)
      ret = l.v < r.v
      rett = rt.boolTypeLiteral
      rt.val rett, ret
    "o(<=)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support <= on " + rt.makeTypeString(r.t)
      ret = l.v <= r.v
      rett = rt.boolTypeLiteral
      rt.val rett, ret
    "o(>)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support > on " + rt.makeTypeString(r.t)
      ret = l.v > r.v
      rett = rt.boolTypeLiteral
      rt.val rett, ret
    "o(>=)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support >= on " + rt.makeTypeString(r.t)
      ret = l.v >= r.v
      rett = rt.boolTypeLiteral
      rt.val rett, ret
    "o(==)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support == on " + rt.makeTypeString(r.t)
      ret = l.v == r.v
      rett = rt.boolTypeLiteral
      rt.val rett, ret
    "o(!=)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support != on " + rt.makeTypeString(r.t)
      ret = l.v isnt r.v
      rett = rt.boolTypeLiteral
      rt.val rett, ret
    "o(&)": "#default": (rt, l, r) ->
      if r == undefined
        if l.array
          rt.val rt.arrayPointerType(l.t, l.array.length), rt.makeArrayPointerValue(l.array, l.arrayIndex)
        else
          t = rt.normalPointerType(l.t)
          rt.val t, rt.makeNormalPointerValue(l)
      else
        if not rt.isIntegerType(l.t) or not rt.isNumericType(r.t) or not rt.isIntegerType(r.t)
          rt.raiseException rt.makeTypeString(l.t) + " does not support & on " + rt.makeTypeString(r.t)
        ret = l.v & r.v
        rett = rt.promoteNumeric(l.t, r.t)
        rt.val rett, ret
    "o(^)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t) or not rt.isIntegerType(l.t) or not rt.isIntegerType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support ^ on " + rt.makeTypeString(r.t)
      ret = l.v ^ r.v
      rett = rt.promoteNumeric(l.t, r.t)
      rt.val rett, ret
    "o(|)": "#default": (rt, l, r) ->
      if not rt.isNumericType(r.t) or not rt.isIntegerType(l.t) or not rt.isIntegerType(r.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support | on " + rt.makeTypeString(r.t)
      ret = l.v | r.v
      rett = rt.promoteNumeric(l.t, r.t)
      rt.val rett, ret
    "o(,)": "#default": (rt, l, r) ->
      r
    "o(=)": "#default": (rt, l, r) ->
      if l.left
        l.v = rt.cast(l.t, r).v
        return l
      else
        rt.raiseException rt.makeValString(l) + " is not a left value"
      return
    "o(+=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(+)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(-=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(-)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(*=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(*)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(/=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(/)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(%=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(%)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(<<=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(<<)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(>>=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(>>)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(&=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(&)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(^=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(^)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(|=)": "#default": (rt, l, r) ->
      r = defaultOpHandler["o(|)"]["#default"](rt, l, r)
      defaultOpHandler["o(=)"]["#default"] rt, l, r
    "o(++)": "#default": (rt, l, dummy) ->
      if not rt.isNumericType(l.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support increment"
      if !l.left
        rt.raiseException rt.makeValString(l) + " is not a left value"
      if dummy
        b = l.v
        l.v = l.v + 1
        if rt.inrange(l.t, l.v)
          return rt.val(l.t, b)
        rt.raiseException "overflow during post-increment #{rt.makeValString(l)}"
      else
        l.v = l.v + 1
        if rt.inrange(l.t, l.v)
          return l
        rt.raiseException "overflow during pre-increment #{rt.makeValString(l)}"
      return
    "o(--)": "#default": (rt, l, dummy) ->
      if not rt.isNumericType(l.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support decrement"
      if !l.left
        rt.raiseException rt.makeValString(l) + " is not a left value"
      if dummy
        b = l.v
        l.v = l.v - 1
        if rt.inrange(l.t, l.v)
          return rt.val(l.t, b)
        rt.raiseException "overflow during post-decrement"
      else
        l.v = l.v - 1
        b = l.v
        if rt.inrange(l.t, l.v)
          return l
        rt.raiseException "overflow during pre-decrement"
      return
    "o(~)": "#default": (rt, l, dummy) ->
      if not rt.isIntegerType(l.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support ~ on itself"
      ret = ~l.v
      rett = rt.promoteNumeric l.t, rt.intTypeLiteral
      rt.val rett, ret
    "o(!)": "#default": (rt, l, dummy) ->
      if not rt.isIntegerType(l.t)
        rt.raiseException rt.makeTypeString(l.t) + " does not support ! on itself"
      ret = if l.v then 0 else 1
      rett = l.t
      rt.val rett, ret
  @types = "global": {}
  @types["(char)"] = defaultOpHandler
  @types["(signed char)"] = defaultOpHandler
  @types["(unsigned char)"] = defaultOpHandler
  @types["(short)"] = defaultOpHandler
  @types["(short int)"] = defaultOpHandler
  @types["(signed short)"] = defaultOpHandler
  @types["(signed short int)"] = defaultOpHandler
  @types["(unsigned short)"] = defaultOpHandler
  @types["(unsigned short int)"] = defaultOpHandler
  @types["(int)"] = defaultOpHandler
  @types["(signed int)"] = defaultOpHandler
  @types["(unsigned)"] = defaultOpHandler
  @types["(unsigned int)"] = defaultOpHandler
  @types["(long)"] = defaultOpHandler
  @types["(long int)"] = defaultOpHandler
  @types["(long int)"] = defaultOpHandler
  @types["(signed long)"] = defaultOpHandler
  @types["(signed long int)"] = defaultOpHandler
  @types["(unsigned long)"] = defaultOpHandler
  @types["(unsigned long int)"] = defaultOpHandler
  @types["(long long)"] = defaultOpHandler
  @types["(long long int)"] = defaultOpHandler
  @types["(long long int)"] = defaultOpHandler
  @types["(signed long long)"] = defaultOpHandler
  @types["(signed long long int)"] = defaultOpHandler
  @types["(unsigned long long)"] = defaultOpHandler
  @types["(unsigned long long int)"] = defaultOpHandler
  @types["(float)"] = defaultOpHandler
  @types["(double)"] = defaultOpHandler
  @types["(bool)"] = defaultOpHandler
  @types["pointer"] =
    "o(==)": "#default": (rt, l, r) ->
      if rt.isTypeEqualTo(l.t, r.t)
        if l.t.ptrType == "array"
          return l.v.target == r.v.target and (l.v.target == null or l.v.position == r.v.position)
        else
          return l.v.target == r.v.target
      false
    "o(!=)": "#default": (rt, l, r) ->
      not rt.types["pointer"]["=="]["#default"](rt, l, r)
    "o(,)": "#default": (rt, l, r) ->
      r
    "o(=)": "#default": (rt, l, r) ->
      if !l.left
        rt.raiseException rt.makeValString(l) + " is not a left value"
      t = rt.cast(l.t, r)
      l.t = t.t
      l.v = t.v
      l
    "o(&)": "#default": (rt, l, r) ->
      if r == undefined
        if l.array
          return rt.val(rt.arrayPointerType(l.t, l.array.length), rt.makeArrayPointerValue(l.array, l.arrayIndex))
        else
          t = rt.normalPointerType(l.t)
          return rt.val(t, rt.makeNormalPointerValue(l))
      else
        rt.raiseException "you cannot cast bitwise and on pointer"
      return
    "o(())": "#default": (rt, l, bindThis, args) ->
      if not rt.isFunctionType(l.v.target)
        rt.raiseException "pointer target(#{rt.makeValueString(l.v.target)}) is not a function"
      rt.types["function"]["o(())"]["default"](rt, l.v.target, bindThis, args)
  @types["function"] =
    "o(())": "#default": (rt, l, bindThis, args) ->
      if l.t.type is "pointer" and l.t.targetType.type is "function"
        l = l.v.target
      if l.v.target is null
        rt.raiseException "function #{l.v.name} does not seem to be implemented"
      rt.getCompatibleFunc(l.v.defineType, l.v.name, args) rt, bindThis, args...
    "o(&)": "#default": (rt, l, r) ->
      if r == undefined
        t = rt.normalPointerType(l.t)
        return rt.val(t, rt.makeNormalPointerValue(l))
      else
        rt.raiseException "you cannot cast bitwise and on function"
      return
  @types["pointer_normal"] =
    "o(*)": "#default": (rt, l, r) ->
      if r == undefined
        return l.v.target
      else
        rt.raiseException "you cannot multiply a pointer"
      return
    "o(->)": "#default": (rt, l, r) ->
      rt.getMember l.v.target, r
  @types["pointer_array"] =
    "o(*)": "#default": (rt, l, r) ->
      if r == undefined
        arr = l.v.target
        if l.v.position >= arr.length
          rt.raiseException "index out of bound " + l.v.position + " >= " + arr.length
        else if l.v.position < 0
          rt.raiseException "negative index " + l.v.position
        ret = arr[l.v.position]
        ret.array = arr
        ret.arrayIndex = l.v.position
        return ret
      else
        rt.raiseException "you cannot multiply a pointer"
      return
    "o([])": "#default": (rt, l, r) ->
      r = rt.types["pointer_array"]["o(+)"]["#default"](rt, l, r)
      rt.types["pointer_array"]["o(*)"]["#default"] rt, r
    "o(->)": "#default": (rt, l, r) ->
      l = rt.types["pointer_array"]["o(*)"]["#default"](rt, l)
      rt.getMember l, r
    "o(-)": "#default": (rt, l, r) ->
      if rt.isNumericType(r.t)
        i = rt.cast(rt.intTypeLiteral, r).v
        return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position - i))
      else if rt.isArrayType(r.t)
        if l.v.target == r.v.target
          return l.v.position - r.v.position
        else
          rt.raiseException "you cannot perform minus on pointers pointing to different arrays"
      else
        rt.raiseException rt.makeTypeString(r.t) + " is not an array pointer type"
      return
    "o(<)": "#default": (rt, l, r) ->
      if rt.isArrayType(r.t)
        if l.v.target == r.v.target
          return l.v.position < r.v.position
        else
          rt.raiseException "you cannot perform compare on pointers pointing to different arrays"
      else
        rt.raiseException rt.makeTypeString(r.t) + " is not an array pointer type"
      return
    "o(>)": "#default": (rt, l, r) ->
      if rt.isArrayType(r.t)
        if l.v.target == r.v.target
          return l.v.position > r.v.position
        else
          rt.raiseException "you cannot perform compare on pointers pointing to different arrays"
      else
        rt.raiseException rt.makeTypeString(r.t) + " is not an array pointer type"
      return
    "o(<=)": "#default": (rt, l, r) ->
      if rt.isArrayType(r.t)
        if l.v.target == r.v.target
          return l.v.position <= r.v.position
        else
          rt.raiseException "you cannot perform compare on pointers pointing to different arrays"
      else
        rt.raiseException rt.makeTypeString(r.t) + " is not an array pointer type"
      return
    "o(>=)": "#default": (rt, l, r) ->
      if rt.isArrayType(r.t)
        if l.v.target == r.v.target
          return l.v.position >= r.v.position
        else
          rt.raiseException "you cannot perform compare on pointers pointing to different arrays"
      else
        rt.raiseException rt.makeTypeString(r.t) + " is not an array pointer type"
      return
    "o(+)": "#default": (rt, l, r) ->
      if rt.isNumericType(r.t)
        i = rt.cast(rt.intTypeLiteral, r).v
        return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position + i))
      else
        rt.raiseException "cannot add non-numeric to a pointer"
      return
    "o(+=)": "#default": (rt, l, r) ->
      r = rt.types["pointer_array"]["o(+)"]["#default"](rt, l, r)
      rt.types["pointer"]["="]["#default"] rt, l, r
    "o(-=)": "#default": (rt, l, r) ->
      r = rt.types["pointer_array"]["o(-)"]["#default"](rt, l, r)
      rt.types["pointer"]["="]["#default"] rt, l, r
    "o(++)": "#default": (rt, l, dummy) ->
      if !l.left
        rt.raiseException rt.makeValString(l) + " is not a left value"
      if dummy
        rt.val l.t, rt.makeArrayPointerValue(l.v.target, l.v.position++)
      else
        l.v.position++
        l
    "o(--)": "#default": (rt, l, dummy) ->
      if !l.left
        rt.raiseException rt.makeValString(l) + " is not a left value"
      if dummy
        rt.val l.t, rt.makeArrayPointerValue(l.v.target, l.v.position--)
      else
        l.v.position--
        l

  return this