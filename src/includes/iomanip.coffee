module.exports = load: (rt) ->
    type = rt.newClass("iomanipulator", [])
    oType = rt.simpleType("ostream", [])

    _setprecesion = (rt, _this, x) ->
        t: type
        v:
            members:
                name: "setprecision"
                f: (config) ->
                    config.setprecision = x.v
        left: false
    rt.regFunc(_setprecesion, "global", "setprecision", [rt.intTypeLiteral], type)

    _fixed =
        t: type
        v:
            members:
                name: "fixed"
                f: (config) ->
                    config.fixed = true
    rt.scope[0]["fixed"] = _fixed

    _setw = (rt, _this, x) ->
        t: type
        v:
            members:
                name: "setw"
                f: (config) ->
                    config.setw = x.v
    rt.regFunc(_setw, "global", "setw", [rt.intTypeLiteral], type)

    _addManipulator = (rt, _cout, m) ->
        _cout.manipulators or=
            config: {}
            active: {}
            use: (o) ->
                if rt.isNumericType(o.t) and not rt.isIntegerType(o.t)
                    if @active.fixed
                        prec = if @active.setprecision?
                                @config.setprecision
                            else
                                6
                        tarStr = o.v.toFixed(prec)
                    else if @active.setprecision?
                        tarStr = o.v.toPrecision(@config.setprecision).replace(/0+$/, "")
                if @active.setw?
                    if @active.setfill?
                        fill = @config.setfill
                    else
                        fill = " "
                    if not (rt.isTypeEqualTo(o.t, rt.charTypeLiteral) and (o.v is 10 or o.v is 13))
                        tarStr or= o.v.toString()
                        for i in [0...@config.setw - tarStr.length] by 1
                            tarStr = fill + tarStr
                if tarStr?
                    rt.makeCharArrayFromString(tarStr)
                else
                    o
        m.v.members.f(_cout.manipulators.config)
        _cout.manipulators.active[m.v.members.name] = m.v.members.f
        return _cout

    rt.regFunc(_addManipulator, oType, "<<", [type], oType)
    return