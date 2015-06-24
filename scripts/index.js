var Main, VariablePanel, getCookie, setCookie;

setCookie = function(cname, cvalue) {
  return document.cookie = encodeURIComponent(cname) + "=" + encodeURIComponent(cvalue) + "; ";
};

getCookie = function(cname) {
  var c, ca, name, _i, _len;
  name = encodeURIComponent(cname) + "=";
  ca = document.cookie.split(';');
  for (_i = 0, _len = ca.length; _i < _len; _i++) {
    c = ca[_i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return decodeURIComponent(c.substring(name.length, c.length));
    }
  }
};

VariablePanel = React.createClass({
  displayName: "VariablePanel",
  render: function() {
    var i, last, lastVar, lastVars, lastVarsMap, mydebugger, updated, v, vars, _i, _len, _ref;
    mydebugger = this.props["debugger"];
    _ref = this.props, vars = _ref.vars, lastVars = _ref.lastVars;
    lastVarsMap = {};
    for (_i = 0, _len = lastVars.length; _i < _len; _i++) {
      lastVar = lastVars[_i];
      lastVarsMap[lastVar.name] = lastVar;
    }
    return React.createElement(Table, {
      "striped": true,
      "bordered": true,
      "hover": true
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Name"), React.createElement("th", null, "Value"), React.createElement("th", null, "Type"))), React.createElement("tbody", null, (function() {
      var _j, _len1, _results;
      _results = [];
      for (i = _j = 0, _len1 = vars.length; _j < _len1; i = ++_j) {
        v = vars[i];
        last = lastVarsMap[v.name];
        updated = (last == null) || last.value !== v.value || last.type !== v.type;
        _results.push(React.createElement("tr", {
          "key": v.name,
          "className": (updated ? "updated-variable-item" : void 0)
        }, React.createElement("td", null, v.name), React.createElement("td", null, v.value), React.createElement("td", null, v.type)));
      }
      return _results;
    })()));
  }
});

Main = React.createClass({
  displayName: "Main",
  getInitialState: function() {
    return {
      code: this.defaultCode,
      output: "",
      input: "5",
      status: "editing",
      markers: [],
      vars: [],
      lastVars: []
    };
  },
  defaultCode: "#include <iostream>\nusing namespace std;\nint main() {\n    int a;\n    cin >> a;\n    cout << a*10 << endl;\n    return 0;\n}",
  componentDidMount: function() {
    jQuery.hotkeys.options.filterInputAcceptingElements = false;
    jQuery.hotkeys.options.filterContentEditable = false;
    $(document).bind("keydown", "ctrl+s", this.quickSave);
    return $(document).bind("keydown", "ctrl+o", this.quickLoad);
  },
  onChange: function(code) {
    return this.setState({
      code: code
    });
  },
  quickSave: function(e) {
    e.preventDefault();
    return setCookie("code", this.state.code);
  },
  quickLoad: function(e) {
    e.preventDefault();
    return this.setState({
      code: getCookie("code")
    });
  },
  handleError: function(e) {
    return this.setState({
      output: this.output + "\n" + e
    });
  },
  run: function(debug, e) {
    var code, config, exitCode, input;
    e.preventDefault();
    code = this.state.code;
    input = this.state.input;
    this.output = "";
    config = {
      stdio: {
        drain: function() {
          var x;
          x = input;
          input = null;
          return x;
        },
        write: (function(_this) {
          return function(s) {
            _this.output += s;
            _this.setState({
              output: _this.output
            });
          };
        })(this)
      },
      debug: debug
    };
    if (debug) {
      this.preDebug();
      try {
        this["debugger"] = JSCPP.run(code, input, config);
        return this.startDebug();
      } catch (_error) {
        e = _error;
        this.handleError(e);
        return this.debug_stop();
      }
    } else {
      this.preRun();
      try {
        exitCode = JSCPP.run(code, input, config);
        return this.postRun(exitCode);
      } catch (_error) {
        e = _error;
        this.handleError(e);
        return this.setState({
          status: "editing"
        });
      }
    }
  },
  preDebug: function() {
    this.codeBackup = this.state.code;
    return this.setState({
      output: "",
      status: "debugging"
    });
  },
  startDebug: function() {
    this.setState({
      code: this["debugger"].src,
      vars: [],
      lastVars: []
    });
    return this.debug_stepinto();
  },
  postDebug: function(exitCode) {
    var exitInfo;
    exitInfo = "\nprogram exited with code " + exitCode + ".";
    return this.setState({
      output: this.output + exitInfo
    });
  },
  updateMarkers: function() {
    var lastVars, marker, s, vars;
    s = this["debugger"].nextNode();
    lastVars = this.state.vars;
    vars = this["debugger"].variable();
    marker = new Range(s.sLine - 1, s.sColumn - 1, s.sLine - 1, s.sColumn);
    return this.setState({
      markers: [marker],
      vars: vars,
      lastVars: lastVars
    });
  },
  debug_continue: function() {
    return this.debug_stepinto();
  },
  debug_stepinto: function() {
    var done, e;
    try {
      done = this["debugger"]["continue"]();
      if (done !== false) {
        this.debug_stop();
        return this.postDebug(done.v);
      } else {
        return this.updateMarkers();
      }
    } catch (_error) {
      e = _error;
      this.handleError(e);
      return this.debug_stop();
    }
  },
  debug_stepover: function() {
    return this.debug_stepinto();
  },
  debug_stepout: function() {
    return this.debug_stepinto();
  },
  debug_stop: function() {
    this["debugger"] = null;
    return this.setState({
      status: "editing",
      code: this.codeBackup,
      markers: []
    });
  },
  preRun: function() {
    this.setState({
      output: "",
      status: "running"
    });
    return this.timer = new Date().getTime();
  },
  postRun: function(exitCode) {
    var ellaps, exitInfo;
    if (this.timer) {
      ellaps = new Date().getTime() - this.timer;
      this.timer = null;
      exitInfo = "\nprogram exited with code " + exitCode + " in " + ellaps + "ms.";
      return this.setState({
        output: this.output + exitInfo,
        status: "editing"
      });
    }
  },
  onChangeInput: function(e) {
    return this.setState({
      input: this.refs.input.getValue()
    });
  },
  onChangeOutput: function(e) {
    return this.setState({
      output: this.refs.output.getValue()
    });
  },
  render: function() {
    var brand, code, debugging, editing, input, lastVars, markers, output, running, status, vars, _ref;
    _ref = this.state, code = _ref.code, input = _ref.input, output = _ref.output, status = _ref.status, markers = _ref.markers, vars = _ref.vars, lastVars = _ref.lastVars;
    debugging = status === "debugging";
    editing = status === "editing";
    running = status === "running";
    brand = React.createElement("a", {
      "href": "https://github.com/felixhao28/JSCPP",
      "className": "logo"
    }, "JSCPP");
    return React.createElement("div", null, React.createElement(Navbar, {
      "brand": brand
    }, React.createElement(Nav, null, React.createElement(DropdownButton, {
      "title": "File"
    }, React.createElement(MenuItem, null, "Quick Open (Ctrl + O)"), React.createElement(MenuItem, null, "Quick Save (Ctrl + S)")), React.createElement(NavItem, {
      "href": "#",
      "onClick": (editing ? this.run.bind(this, false) : void 0),
      "disabled": !editing
    }, "Run"), React.createElement(NavItem, {
      "href": "#",
      "onClick": (editing ? this.run.bind(this, true) : void 0),
      "disabled": !editing
    }, "Debug"))), React.createElement(Grid, null, (debugging ? React.createElement(Row, {
      "className": "debug-toolbar"
    }, React.createElement(Col, {
      "md": 12.
    }, React.createElement(ButtonGroup, null, React.createElement(Button, {
      "disabled": true,
      "onClick": this.debug_continue
    }, "Continue"), React.createElement(Button, {
      "onClick": this.debug_stepinto
    }, "Step Into"), React.createElement(Button, {
      "disabled": true,
      "onClick": this.debug_stepover
    }, "Step Over"), React.createElement(Button, {
      "disabled": true,
      "onClick": this.debug_stepout
    }, "Step Out"), React.createElement(Button, {
      "onClick": this.debug_stop
    }, "Stop")))) : void 0), React.createElement(Row, {
      "className": "main-row"
    }, React.createElement(Col, {
      "md": (debugging ? 8 : 12)
    }, React.createElement(AceEditor, {
      "ref": "editor",
      "name": "editor",
      "className": "editor",
      "value": code,
      "onChange": this.onChange,
      "theme": "monokai",
      "readOnly": !editing,
      "markers": markers
    })), (debugging ? React.createElement(Col, {
      "md": 4.
    }, React.createElement(VariablePanel, {
      "mydebugger": this["debugger"],
      "vars": vars,
      "lastVars": lastVars
    })) : void 0)), React.createElement(Row, {
      "className": "io-row"
    }, React.createElement(Col, {
      "md": 6.
    }, React.createElement(Input, {
      "ref": "input",
      "className": "input-area",
      "type": "textarea",
      "label": "Standard Input",
      "rows": 5.,
      "value": input,
      "onChange": this.onChangeInput
    })), React.createElement(Col, {
      "md": 6.
    }, React.createElement(Input, {
      "ref": "output",
      "className": "output-area",
      "type": "textarea",
      "label": "Standard Output",
      "rows": 5.,
      "value": output,
      "onChange": this.onChangeOutput
    })))));
  }
});

React.render(React.createElement(Main, null), document.getElementById("mycontainer"));
