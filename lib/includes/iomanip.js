module.exports = {
  load: function(rt) {
    var _addManipulator, _fixed, _setprecesion, _setw, oType, type;
    type = rt.newClass("iomanipulator", []);
    oType = rt.simpleType("ostream", []);
    _setprecesion = function(rt, _this, x) {
      return {
        t: type,
        v: {
          members: {
            name: "setprecision",
            f: function(config) {
              return config.setprecision = x.v;
            }
          }
        },
        left: false
      };
    };
    rt.regFunc(_setprecesion, "global", "setprecision", [rt.intTypeLiteral], type);
    _fixed = {
      t: type,
      v: {
        members: {
          name: "fixed",
          f: function(config) {
            return config.fixed = true;
          }
        }
      }
    };
    rt.scope[0]["fixed"] = _fixed;
    _setw = function(rt, _this, x) {
      return {
        t: type,
        v: {
          members: {
            name: "setw",
            f: function(config) {
              return config.setw = x.v;
            }
          }
        }
      };
    };
    rt.regFunc(_setw, "global", "setw", [rt.intTypeLiteral], type);
    _addManipulator = function(rt, _cout, m) {
      _cout.manipulators || (_cout.manipulators = {
        config: {},
        active: {},
        use: function(o) {
          var fill, i, j, prec, ref, tarStr;
          if (rt.isNumericType(o.t) && !rt.isIntegerType(o.t)) {
            if (this.active.fixed) {
              prec = this.active.setprecision != null ? this.config.setprecision : 6;
              tarStr = o.v.toFixed(prec);
            } else if (this.active.setprecision != null) {
              tarStr = o.v.toPrecision(this.config.setprecision).replace(/0+$/, "");
            }
          }
          if (this.active.setw != null) {
            if (this.active.setfill != null) {
              fill = this.config.setfill;
            } else {
              fill = " ";
            }
            if (!(rt.isTypeEqualTo(o.t, rt.charTypeLiteral) && (o.v === 10 || o.v === 13))) {
              tarStr || (tarStr = o.v.toString());
              for (i = j = 0, ref = this.config.setw - tarStr.length; j < ref; i = j += 1) {
                tarStr = fill + tarStr;
              }
            }
          }
          if (tarStr != null) {
            return rt.makeCharArrayFromString(tarStr);
          } else {
            return o;
          }
        }
      });
      m.v.members.f(_cout.manipulators.config);
      _cout.manipulators.active[m.v.members.name] = m.v.members.f;
      return _cout;
    };
    rt.regFunc(_addManipulator, oType, "<<", [type], oType);
  }
};
