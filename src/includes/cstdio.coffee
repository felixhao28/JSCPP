printf = require "printf"

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
    rt.include "cstring"
    pchar = rt.normalPointerType(rt.charTypeLiteral)
    pvoid = rt.voidPointerType;
    stdio = rt.config.stdio;
    input_stream = stdio.drain();
    input_stream_position = 0;

    _consume_next_char = ()->
      if input_stream_position < input_stream.length
        return input_stream[input_stream_position++];
      else
        throw "EOF"

    _consume_next_line = ()->
      current_input_stream = input_stream.substr(input_stream_position,input_stream.length)
      next_line_break = current_input_stream.indexOf('\n');
      if next_line_break > -1
        retval = current_input_stream.substr(0,next_line_break)
        input_stream_position+=next_line_break+1
      else
        retval = current_input_stream
        input_stream_position = input_stream.length
      retval

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
      rt.getFunc("global", "strcpy", [pchar, pchar])(rt, null, [target, retval])
      rt.val(rt.intTypeLiteral, retval.length)

    rt.regFunc(_sprintf, "global", "sprintf", [pchar, pchar, "?"], rt.intTypeLiteral)

    _printf = (rt, _this, format, params...) ->
      retval = __printf(format, params...)
      retval= rt.getStringFromCharArray retval
      stdio.write retval
      rt.val(rt.intTypeLiteral, retval.length)

    rt.regFunc(_printf, "global", "printf", [pchar, "?"], rt.intTypeLiteral)


    _getchar = (rt, _this) ->
      try
        char = _consume_next_char()
        rt.val(rt.intTypeLiteral,char.charCodeAt(0))
      catch error
      #TODO: return EOF
        rt.val(rt.intTypeLiteral,0)

    rt.regFunc(_getchar, "global" , "getchar", [], rt.intTypeLiteral)

    _gets = (rt, _this, charPtr ) ->
      retval = _consume_next_line()
      destArray = charPtr.v.target

      for i in [0..retval.length]
        try
          destArray[i] = rt.val(rt.charTypeLiteral, retval.charCodeAt(i))
        catch
          destArray[i] = rt.val(rt.charTypeLiteral, 0)

      destArray[retval.length] = rt.val(rt.charTypeLiteral, 0)

      rt.val(pchar,charPtr)


    rt.regFunc( _gets, "global" , "gets" , [pchar] , pchar)

    _putchar = (rt, _this, char) ->
      ##this implementation is dependent on printf implementation
      ##but on the original c this behavior is not present
      ##for general purposes the result will be the same
      ##but maybe could be a good idea to make this implementation
      ##indenpendent
      print_mask = rt.makeCharArrayFromString "%c"
      _printf(rt,null ,print_mask,char)
      rt.val(rt.intTypeLiteral,0)

    rt.regFunc( _putchar, "global" , "putchar" , [rt.charTypeLiteral] , rt.intTypeLiteral)



    