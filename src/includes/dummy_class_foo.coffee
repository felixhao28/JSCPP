module.exports = load: (rt) ->
  type = rt.newClass("Foo", [
        name: "x"
        t: rt.intTypeLiteral
        initialize: (rt, _this) -> rt.val(rt.intTypeLiteral, 2, true)
      ,
        name: "y"
        t: rt.intTypeLiteral
        initialize: (rt, _this) -> rt.val(rt.intTypeLiteral, -2, true)
    ])
  typeSig = rt.getTypeSignature(type)
  rt.types[typeSig]["#father"] = "object"

  _plusX = (rt, _this, a) ->
    newValue = _this.v.members["x"].v + a.v
    rt.val(rt.intTypeLiteral, newValue, false)

  rt.regFunc(_plusX, type, "plusX", [rt.intTypeLiteral], rt.intTypeLiteral)