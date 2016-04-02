module.exports =
  load: (rt) ->

    _time = (rt, _this, i) ->
      val = Math.floor(Date.now()/1000)
      rt.val rt.intTypeLiteral, val
      # TODO: implement correct return for non-0 argument

    rt.regFunc(_time, "global", "time", [rt.longTypeLiteral], rt.longTypeLiteral)
