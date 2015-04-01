module.exports =
    load: (rt) ->
        tDouble = rt.doubleTypeLiteral
        g = "global"

        rt.regFunc ((rt, _this, x) ->
                Math.cos x.v
        ), g, "cos", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.sin x.v
        ), g, "sin", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.tan x.v
        ), g, "tan", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.acos x.v
        ), g, "acos", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.asin x.v
        ), g, "asin", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.atan x.v
        ), g, "atan", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, y, x) ->
                Math.atan y.v / x.v
        ), g, "atan2", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.cosh x.v
        ), g, "cosh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.sinh x.v
        ), g, "sinh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.tanh x.v
        ), g, "tanh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.acosh x.v
        ), g, "acosh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.asinh x.v
        ), g, "asinh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.atanh x.v
        ), g, "atanh", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.exp x.v
        ), g, "exp", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.log x.v
        ), g, "log", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.log10 x.v
        ), g, "log10", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x, y) ->
                x.v ** y.v
        ), g, "pow", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.sqrt x.v
        ), g, "sqrt", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.ceil x.v
        ), g, "ceil", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.floor x.v
        ), g, "floor", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.abs x.v
        ), g, "fabs", [ tDouble ], tDouble
        rt.regFunc ((rt, _this, x) ->
                Math.abs x.v
        ), g, "abs", [ tDouble ], tDouble
        return