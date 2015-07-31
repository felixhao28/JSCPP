module.exports = load: (rt) ->
  rt.regFunc ((rt, _this, x) ->
    c = rt.getFunc("global", "isdigit", [ rt.intTypeLiteral ])(rt, _this, x)
    if !c.v
      return rt.getFunc("global", "isalpha", [ rt.intTypeLiteral ])(rt, _this, x)
    c
  ), "global", "isalnum", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v >= "0".charCodeAt(0) and x.v <= "9".charCodeAt(0) then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "isdigit", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    c = rt.getFunc("global", "isupper", [ rt.intTypeLiteral ])(rt, _this, x)
    if !c.v
      return rt.getFunc("global", "islower", [ rt.intTypeLiteral ])(rt, _this, x)
    c
  ), "global", "isalpha", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v in [
      0x20
      0x09
      0x0a
      0x0b
      0x0c
      0x0d
    ] then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "isspace", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v >= 0x00 and x.v <= 0x1f or x.v == 0x7f then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "iscntrl", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v > 0x1f and x.v != 0x7f then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "isprint", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    c = rt.getFunc("global", "isspace", [ rt.intTypeLiteral ])(rt, _this, x)
    if !c.v
      c = rt.getFunc("global", "isgraph", [ rt.intTypeLiteral ])(rt, _this, x)
      if !c.v
        return rt.val(rt.intTypeLiteral, 1)
    rt.val rt.intTypeLiteral, 0
  ), "global", "isgraph", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v >= "a".charCodeAt(0) and x.v <= "z".charCodeAt(0) then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "islower", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v >= "A".charCodeAt(0) and x.v <= "Z".charCodeAt(0) then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "isupper", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    c = rt.getFunc("global", "isgraph", [ rt.intTypeLiteral ])(rt, _this, x)
    if c.v
      c = rt.getFunc("global", "isalnum", [ rt.intTypeLiteral ])(rt, _this, x)
      if !c.v
        return rt.val(rt.intTypeLiteral, 1)
    rt.val rt.intTypeLiteral, 0
  ), "global", "ispunct", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    v = if x.v >= "A".charCodeAt(0) and x.v <= "F".charCodeAt(0) or x.v >= "a".charCodeAt(0) and x.v <= "f".charCodeAt(0) or x.v >= "0".charCodeAt(0) and x.v <= "9".charCodeAt(0) then 1 else 0
    rt.val rt.intTypeLiteral, v
  ), "global", "isxdigit", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    c = rt.getFunc("global", "isupper", [ rt.intTypeLiteral ])(rt, _this, x)
    if c.v
      return rt.val(rt.intTypeLiteral, x.v + 32)
    x
  ), "global", "tolower", [ rt.intTypeLiteral ], rt.intTypeLiteral
  rt.regFunc ((rt, _this, x) ->
    c = rt.getFunc("global", "islower", [ rt.intTypeLiteral ])(rt, _this, x)
    if c.v
      return rt.val(rt.intTypeLiteral, x.v - 32)
    x
  ), "global", "toupper", [ rt.intTypeLiteral ], rt.intTypeLiteral
  return