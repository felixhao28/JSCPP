module.exports =
    load: (rt) ->
        tDouble = rt.doubleTypeLiteral
        g = "global"

        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.cos(x.v))
        ), g, "cos", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.sin(x.v))
        ), g, "sin", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.tan(x.v))
        ), g, "tan", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.acos(x.v))
        ), g, "acos", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.asin(x.v))
        ), g, "asin", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.atan(x.v))
        ), g, "atan", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, y, x) ->
                rt.val(tDouble, Math.atan(y.v / x.v))
        ), g, "atan2", [ tDouble, tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.cosh(x.v))
        ), g, "cosh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.sinh(x.v))
        ), g, "sinh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.tanh(x.v))
        ), g, "tanh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.acosh(x.v))
        ), g, "acosh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.asinh(x.v))
        ), g, "asinh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.atanh(x.v))
        ), g, "atanh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.exp(x.v))
        ), g, "exp", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.log(x.v))
        ), g, "log", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.log10(x.v))
        ), g, "log10", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x, y) ->
                x.v ** y.v
        ), g, "pow", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.sqrt(x.v))
        ), g, "sqrt", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.ceil(x.v))
        ), g, "ceil", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.floor(x.v))
        ), g, "floor", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.abs(x.v))
        ), g, "fabs", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                rt.val(tDouble, Math.abs(x.v))
        ), g, "abs", [ tDouble ], tDouble
        return