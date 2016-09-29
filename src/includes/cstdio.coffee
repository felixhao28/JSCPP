printf = require "printf"
EOF = 0;
NULL = -1;

format_type_map = (rt, ctrl) ->
  switch ctrl
    when "d", "i"
      rt.intTypeLiteral
    when "u", "o", "x", "X"
      rt.unsignedintTypeLiteral
    when "f", "F"
      rt.floatTypeLiteral
    when "e", "E", "g", "G", "a", "A"
      rt.doubleTypeLiteral
    when "c"
      rt.charTypeLiteral
    when "s"
      rt.normalPointerType rt.charTypeLiteral
    when "p"
      rt.normalPointerType rt.voidTypeLiteral
    when "n"
      rt.raiseException "%n is not supported"


validate_format = (rt, format, params...) ->
  i = 0
  re = /%(?:[-+ #0])?(?:[0-9]+|\*)?(?:\.(?:[0-9]+|\*))?([diuoxXfFeEgGaAcspn])/g
  while (ctrl = re.exec format)?
    type = format_type_map rt, ctrl[1]
    if params.length <= i
      rt.raiseException "insufficient arguments (at least #{i+1} is required)"
    target = params[i++]
    casted = rt.cast type, target
    if rt.isStringType casted.t
      val = rt.getStringFromCharArray casted
    else
      val = casted.v



module.exports =
  load: (rt) ->
    char_pointer = rt.normalPointerType(rt.charTypeLiteral)
    stdio = rt.config.stdio;
    input_stream = stdio.drain();


    _consume_next_char = ()->
      char_return = ""
      if input_stream.length > 0
        char_return = input_stream[0]
        input_stream = input_stream.substr(1)
        char_return
      else
        throw "EOF"

    _consume_next_line = ()->
      input_stream
      next_line_break = input_stream.indexOf('\n');

      if next_line_break > -1
        retval = input_stream.substr(0,next_line_break)
        input_stream = input_stream.replace("#{retval}\n",'')
      else
        retval = input_stream
        input_stream = ""

      retval


    _strcpy = require "./shared/cstring_strcpy"

    __printf = (format, params...) ->
      if rt.isStringType format.t
        format = rt.getStringFromCharArray format
        parsed_params = validate_format rt, format, params...
        retval = printf format, parsed_params...
        rt.makeCharArrayFromString retval
      else
        rt.raiseException "format must be a string"

    _sprintf = (rt, _this, target, format, params...) ->
      retval = __printf(format, params...)
      _strcpy(rt, null, [target, retval])
      rt.val(rt.intTypeLiteral, retval.length)

    rt.regFunc(_sprintf, "global", "sprintf", [char_pointer, char_pointer, "?"], rt.intTypeLiteral)

    _printf = (rt, _this, format, params...) ->
      retval = __printf(format, params...)
      retval= rt.getStringFromCharArray retval
      stdio.write retval
      rt.val(rt.intTypeLiteral, retval.length)

    rt.regFunc(_printf, "global", "printf", [char_pointer, "?"], rt.intTypeLiteral)

    _getchar = (rt, _this) ->
      try
        char = _consume_next_char()
        rt.val(rt.intTypeLiteral,char.charCodeAt(0))
      catch error
        rt.val(rt.intTypeLiteral,EOF)

    rt.regFunc(_getchar, "global" , "getchar", [], rt.intTypeLiteral)

    _gets = (rt, _this, charPtr ) ->

      return_value = _consume_next_line()
      destArray = charPtr.v.target

      for i in [0..return_value.length]
        try
          destArray[i] = rt.val rt.charTypeLiteral, return_value.charCodeAt(i)
        catch
          destArray[i] = rt.val rt.charTypeLiteral, 0

      destArray[return_value.length] = rt.val rt.charTypeLiteral, 0

      rt.val(char_pointer,charPtr)


    rt.regFunc( _gets, "global" , "gets" , [char_pointer] , char_pointer)

    ##DEPENDENT ON PRINTF##
    ##these implementations is dependent on printf implementation
    ##but on the original c this behavior is not present
    ##for general purposes the result will be the same
    ##but maybe could be a good idea to make this implementation
    ##indenpendent
    _putchar = (rt, _this, char) ->
      print_mask = rt.makeCharArrayFromString "%c"
      _printf(rt,null ,print_mask,char)
      char

    rt.regFunc( _putchar, "global" , "putchar" , [rt.charTypeLiteral] , rt.intTypeLiteral)

    _puts = (rt, _this , charPtr) ->
      print_mask = rt.makeCharArrayFromString "%s"
      _printf(rt,null ,print_mask, charPtr)
      rt.val(rt.intTypeLiteral,1)

    rt.regFunc( _puts, "global" , "puts" , [char_pointer] , rt.intTypeLiteral)
    ##DEPENDENT ON PRINTF##

    #####################HELPER FUNCTION TO SCANF ###############################

    _ASCII =
      a: 'a'.charCodeAt(0)
      f: 'f'.charCodeAt(0)
      A: 'A'.charCodeAt(0)
      F: 'F'.charCodeAt(0)
      0: '0'.charCodeAt(0)
      8: '8'.charCodeAt(0)
      9: '9'.charCodeAt(0)


    _hex2int = (str) ->
      ret = 0
      digit = 0
      str = str.replace /^[0O][Xx]/, ''

      for i in [str.length-1..0] by -1
        num = _int_at_hex str[i], digit++
        if num != null
          ret+=num
        else
          throw new Error('invalid hex '+str)

      ret

      _int_at_hex = (c, digit) ->
        ret = null
        ascii = c.charCodeAt(0)

        if _ASCII.a <=ascii and ascii <= _ASCII.f
          ret = ascii - _ASCII.a +10
        else if _ASCII.A <= ascii and ascii <= _ASCII.F
          ret = ascii - _ASCII.a +10
        else if _ASCII[0] < ascii and ascii <= _ASCII[9]
          ret = ascii - _ASCII[0]

        else
          throw  new Error("Ivalid ascii [#{c}]")

        num *= Math.pow 16,digit

        ret

    _octal2int = (str)->
      str = str.replace /^0/, ''
      ret = 0
      digit = 0

      for i in [str.length-1..0] by -1
        num = _int_at_octal str[i], digit++
        if num != null
          ret +=num
        else
          throw new Error "invalid octal #{str}"

      ret

    _int_at_octal = (c,digit) ->
      num = null
      ascii = c.charCodeAt(0)
      if ascii >= _ASCII[0] and ascii <=_ASCII[8]
        num = ascii - _ASCII[0]
      else
        throw new Error "invalid char at [#{c}]"

      num *= Math.pow 8,digit

      return num

    _regslashs = (pre) ->
      return pre.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\|/g, '\\|');


    _strip_slashes = (str)->
      return str.replace /\\([\sA-Za-z\\]|[0-7]{1,3})/g ,(str,c)->
        switch c
          when "\\"
            return "\\"
          when "0"
            return "\u0000"
          else
            if /^\w$/.test(c)
              return _get_special_char(c)
            else if /^\s$/.test(c)
              return c
            else if /([0-7]{1,3})/.test(c)
              return _get_ASCII_char(c)
            return str

    _get_ASCII_char = (str) ->
      num = _octal2int(str)
      return String.fromCharCode(num)

    _get_special_char = (letter) ->
      switch letter.toLowerCase()
        when "b"
          return "\b"
        when "f"
          return "\f"
        when "n"
          return "\n"
        when "r"
          return "\r"
        when "t"
          return "\t"
        when "v"
          return "\v"
        else
          return letter


    #####################HELPER FUNCTION TO SCANF ###############################

    #############################SCANF IMPL######################################


    _get_input = (pre , next, match, type)->
      result = undefined

      tmp = input_stream

      replace = "(#{match})"


      if type == 'STR' and next.trim().length > 0
        before_match = _regslashs(pre)
        after_match = _regslashs(next) + '[\\w\\W]*'

        if before_match.length
          tmp = tmp.replace new RegExp(before_match),''

        tmp = tmp.replace new RegExp(after_match),''
      else
        replace = _regslashs(pre) + replace

      m = tmp.match new RegExp(replace)

      if(!m)
        #TODO strip match
        return null

      result = m[1]

      input_stream = input_stream.substr(input_stream.indexOf(result)).replace(result, '').replace(next, '')

      #returing result
      result


    _get_integer = (pre,next)->

      text = _get_input(pre, next , '[-]?[A-Za-z0-9]+')

      if !text
        return null
      else if text[0] == '0'
        if text[1] == 'x' || text[1] == 'X'
          return _hex2int text
        else
          return _octal2int text
      else
        return parseInt text

    _get_float = (pre,next) ->
      text = _get_input pre, next, '[-]?[0-9]+[\.]?[0-9]*'
      return parseFloat(text)

    _get_hex = (pre,next) ->
      text = _get_input pre, next, '[A-Za-z0-9]+'
      return _hex2int(text)

    _get_octal = (pre,next) ->
      text = _get_input pre, next, '[A-Za-z0-9]+'
      return _octal2int(text)

    _get_string = (pre,next) ->
      text = _get_input pre, next, '([\\w\\]=-]|\\S[^\\][^\\ ])+(\\\\[\\w\\ ][\\w\\:]*)*', 'STR'
      if /\\/.test text
        text = _strip_slashes text
      return text

    _get_char = (pre,next) ->
      text = _get_input pre, next, '.', 'STR'
      if /\\/.test text
        text = _strip_slashes text
      return text

    _get_line = (pre,next)->
      text = _get_input pre, next, '[^\n\r]*'
      if /\\/.test text
        text = _strip_slashes text
      return text

    _deal_type = (format) ->
      ret;
      res = format.match /%[A-Za-z]+/
      res2 = format.match /[^%]*/

      if(!res)
        return null

      type = res[0]

      pre;
      if !!res2
        pre = res2[0]
      else
        pre = null

      next = format.substr(format.indexOf(type) + type.length)

      switch type
        when "%d", "%ld","%llu","%lu","%u"
          ret = _get_integer pre,next
        when "%c"
          ret = _get_char pre, next
        when "%s"
          ret = _get_string pre, next
        when "%S"
          ret = _get_line pre,next
        when '%x','%X'
          ret = _get_hex pre, next
        when  '%o','%O'
          ret = _get_octal pre, next
        when '%f'
          ret = _get_float pre,next
        else
          throw new Error('Unknown type "'+type+'"')

      return ret

    _set_pointer_value = (pointer,value)->
      try
        switch pointer.t.ptrType
          when "normal"
            if rt.isNumericType(pointer.t.targetType)
              new_value = rt.val(pointer.t.targetType,value,true)
              pointer.v.target.v = new_value.v
            else
              new_value = rt.val(pointer.t.targetType,value.charCodeAt(0),true)
              pointer.v.target.v = new_value.v
          when "array"
            src_array = rt.makeCharArrayFromString value
            if src_array.v.target.length > pointer.v.target.length
              rt.raiseException "Not enough memory on pointer"
            else
              for i in [0..src_array.v.target.length]
                try
                  pointer.v.target[i] = src_array.v.target[i]
                catch
                  rt.raiseException "Not enough memory on pointer"
          else
           rt.raiseException "Invalid Pointer Type"
      catch
        rt.raiseException "Memory overflow"


    __scanf = (format)->
      re = new RegExp('[^%]*%[A-Za-z][^%]*','g')
      selectors = format.match(re)
      _deal_type(val) for val in selectors
    #############################SCANF IMPL#####################################

    _scanf = (rt, _this, pchar, args...) ->

      format = rt.getStringFromCharArray(pchar)
      matched_values = __scanf(format)

      for val,i in matched_values
        _set_pointer_value args[i], val

      rt.val rt.intTypeLiteral,matched_values.length


    rt.regFunc( _scanf , "global" , "scanf" , [char_pointer, "?"] , rt.intTypeLiteral)

    #TODO change this function to pass the string to __scanf instead of playing with current stream
    _sscanf = (rt, _this , original_string_pointer , format_pointer, args...) ->

      format = rt.getStringFromCharArray format_pointer
      original_string = rt.getStringFromCharArray original_string_pointer
      original_input_stream = input_stream
      input_stream = original_string
      matched_values = __scanf(format)

      for val,i in matched_values
        _set_pointer_value args[i], val

      input_stream = original_input_stream
      rt.val rt.intTypeLiteral,matched_values.length

    rt.regFunc(_sscanf , "global" ,"sscanf", [char_pointer,char_pointer,"?"], rt.intTypeLiteral)

