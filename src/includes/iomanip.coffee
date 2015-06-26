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

    _setfill = (rt, _this, x) ->
        t: type
        v:
            members:
                name: "setfill"
                f: (config) ->
                    config.setfill = String.fromCharCode(x.v)
    rt.regFunc(_setfill, "global", "setfill", [rt.charTypeLiteral], type)

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
                        tarStr or=
                            if rt.isPrimitiveType(o.t)
                                if o.t.name.indexOf("char") >= 0
                                    String.fromCharCode(o.v)
                                else if o.t.name is "bool"
                                    if o.v then "1" else "0"
                                else
                                    o.v.toString()
                            else if rt.isStringType o.t
                                rt.getStringFromCharArray o
                            else
                                rt.raiseException "<< operator in ostream cannot accept " + rt.makeTypeString(o.t)
                        for i in [0...@config.setw - tarStr.length] by 1
                            tarStr = fill + tarStr
                        delete @active.setw
                if tarStr?
                    rt.makeCharArrayFromString(tarStr)
                else
                    o
        m.v.members.f(_cout.manipulators.config)
        _cout.manipulators.active[m.v.members.name] = m.v.members.f
        return _cout

    rt.regOperator(_addManipulator, oType, "<<", [type], oType)
    return