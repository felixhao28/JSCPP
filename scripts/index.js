"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var setCookie = function setCookie(cname, cvalue) {
  return document.cookie = encodeURIComponent(cname) + "=" + encodeURIComponent(cvalue) + "; ";
};

var getCookie = function getCookie(cname) {
  var name = encodeURIComponent(cname) + "=";
  var ca = document.cookie.split(';');

  for (var _i = 0, _Array$from = Array.from(ca); _i < _Array$from.length; _i++) {
    var c = _Array$from[_i];

    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }

    if (c.indexOf(name) === 0) {
      return decodeURIComponent(c.substring(name.length, c.length));
    }
  }
};

var VariablePanel = /*#__PURE__*/function (_React$Component) {
  _inherits(VariablePanel, _React$Component);

  var _super = _createSuper(VariablePanel);

  function VariablePanel() {
    var _this;

    _classCallCheck(this, VariablePanel);

    _this = _super.call(this);
    _this.displayName = "VariablePanel";
    return _this;
  }

  _createClass(VariablePanel, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          vars = _this$props.vars,
          lastVars = _this$props.lastVars;
      var lastVarsMap = {};

      var _iterator = _createForOfIteratorHelper(lastVars),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var lastVar = _step.value;
          lastVarsMap[lastVar.name] = lastVar;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return /*#__PURE__*/React.createElement(Table, {
        striped: true,
        bordered: true,
        hover: true
      }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Value"), /*#__PURE__*/React.createElement("th", null, "Type"))), /*#__PURE__*/React.createElement("tbody", null, vars.map(function (v) {
        var last = lastVarsMap[v.name];
        var updated = last == null || last.value !== v.value || last.type !== v.type;
        return /*#__PURE__*/React.createElement("tr", {
          key: v.name,
          className: updated && "updated-variable-item"
        }, /*#__PURE__*/React.createElement("td", null, v.name), /*#__PURE__*/React.createElement("td", null, v.value), /*#__PURE__*/React.createElement("td", null, v.type));
      })));
    }
  }]);

  return VariablePanel;
}(React.Component);

;

var Main = /*#__PURE__*/function (_React$Component2) {
  _inherits(Main, _React$Component2);

  var _super2 = _createSuper(Main);

  function Main() {
    var _this2;

    _classCallCheck(this, Main);

    _this2 = _super2.call(this);
    _this2.defaultCode = "#include <iostream>\nusing namespace std;\nint main() {\n    int a;\n    cin >> a;\n    a += 7;\n    cout << a*10 << endl;\n    return 0;\n}";
    _this2.state = {
      code: _this2.defaultCode,
      output: "",
      input: "5",
      status: "editing",
      markers: [],
      vars: [],
      lastVars: [],
      busy: false
    };
    _this2.displayName = "Main";
    return _this2;
  }

  _createClass(Main, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      jQuery.hotkeys.options.filterInputAcceptingElements = false;
      jQuery.hotkeys.options.filterContentEditable = false;
      $(document).bind("keydown", "ctrl+s", this.quickSave);
      $(document).bind("keydown", "ctrl+o", this.quickLoad);
    }
  }, {
    key: "onChange",
    value: function onChange(code) {
      this.setState({
        code: code
      });
    }
  }, {
    key: "quickSave",
    value: function quickSave(e) {
      if (e != null) {
        e.preventDefault();
      }

      setCookie("code", this.state.code);
    }
  }, {
    key: "quickLoad",
    value: function quickLoad(e) {
      if (e != null) {
        e.preventDefault();
      }

      this.setState({
        code: getCookie("code")
      });
    }
  }, {
    key: "handleError",
    value: function handleError(e) {
      this.setState({
        output: this.output + "\n" + e
      });
    }
  }, {
    key: "run",
    value: function run(debug, e) {
      var _this3 = this;

      e.preventDefault();
      var code = this.state.code;
      var input = this.state.input;
      this.output = "";
      this.runningInWorker = false;
      var config = {
        stdio: {
          drain: function drain() {
            var x = input;
            input = null;
            return x;
          },
          write: function write(s) {
            _this3.output += s;

            _this3.setState({
              output: _this3.output
            });
          }
        },
        debug: debug
      };

      if (debug) {
        this.preDebug();

        try {
          this["debugger"] = JSCPP.run(code, input, config);
          return this.startDebug();
        } catch (error) {
          e = error;
          this.handleError(e);
          return this.debug_stop();
        }
      } else {
        this.preRun();

        try {
          var exitCode = JSCPP.run(code, input, config);
          return this.postRun(exitCode);
        } catch (error1) {
          e = error1;
          this.handleError(e);
          return this.setState({
            status: "editing"
          });
        }
      }
    }
  }, {
    key: "runInWorker",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(debug, e) {
        var _this4 = this;

        var code, input, config, exitCode;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                e.preventDefault();
                code = this.state.code;
                input = this.state.input;
                this.output = "";
                this.runningInWorker = true;
                config = {
                  stdio: {
                    write: function write(s) {
                      _this4.output += s;

                      _this4.setState({
                        output: _this4.output
                      });
                    }
                  },
                  debug: debug
                };

                if (this.worker == null) {
                  this["debugger"] = new JSCPP.AsyncWebWorkerHelper("./dist/JSCPP.js");
                }

                if (!debug) {
                  _context.next = 23;
                  break;
                }

                this.preDebug();
                _context.prev = 9;
                _context.next = 12;
                return this["debugger"].run(code, input, config);

              case 12:
                _context.next = 14;
                return this.startDebug();

              case 14:
                _context.next = 21;
                break;

              case 16:
                _context.prev = 16;
                _context.t0 = _context["catch"](9);
                e = _context.t0;
                this.handleError(e);
                this.debug_stop();

              case 21:
                _context.next = 36;
                break;

              case 23:
                this.preRun();
                _context.prev = 24;
                _context.next = 27;
                return this["debugger"].run(code, input, config);

              case 27:
                exitCode = _context.sent;
                return _context.abrupt("return", this.postRun(exitCode));

              case 31:
                _context.prev = 31;
                _context.t1 = _context["catch"](24);
                e = _context.t1;
                this.handleError(e);
                return _context.abrupt("return", this.setState({
                  status: "editing"
                }));

              case 36:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[9, 16], [24, 31]]);
      }));

      function runInWorker(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return runInWorker;
    }()
  }, {
    key: "preDebug",
    value: function preDebug() {
      this.codeBackup = this.state.code;
      return this.setState({
        output: "",
        status: "debugging"
      });
    }
  }, {
    key: "startDebug",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.t0 = this;
                _context2.next = 3;
                return this["debugger"].getSource();

              case 3:
                _context2.t1 = _context2.sent;
                _context2.t2 = [];
                _context2.t3 = [];
                _context2.t4 = {
                  code: _context2.t1,
                  vars: _context2.t2,
                  lastVars: _context2.t3
                };

                _context2.t0.setState.call(_context2.t0, _context2.t4);

                return _context2.abrupt("return", this.debug_stepinto());

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function startDebug() {
        return _ref2.apply(this, arguments);
      }

      return startDebug;
    }()
  }, {
    key: "postDebug",
    value: function postDebug(exitCode) {
      var exitInfo = "\nprogram exited with code ".concat(exitCode, ".");
      return this.setState({
        output: this.output + exitInfo
      });
    }
  }, {
    key: "updateMarkers",
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var s, lastVars, vars, marker;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this["debugger"].nextNode();

              case 2:
                s = _context3.sent;
                lastVars = this.state.vars;
                _context3.next = 6;
                return this["debugger"].variable();

              case 6:
                vars = _context3.sent;
                marker = new Range(s.sLine - 1, s.sColumn - 1, s.sLine - 1, s.sColumn);
                return _context3.abrupt("return", this.setState({
                  markers: [marker],
                  vars: vars,
                  lastVars: lastVars
                }));

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function updateMarkers() {
        return _ref3.apply(this, arguments);
      }

      return updateMarkers;
    }()
  }, {
    key: "debug_continue",
    value: function debug_continue() {
      return this.debug_stepinto();
    }
  }, {
    key: "debug_stepinto",
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var done;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                _context4.next = 3;
                return this["debugger"]["continue"]();

              case 3:
                done = _context4.sent;

                if (!(done !== false)) {
                  _context4.next = 9;
                  break;
                }

                this.debug_stop();
                return _context4.abrupt("return", this.postDebug(done.v));

              case 9:
                _context4.next = 11;
                return this.updateMarkers();

              case 11:
                return _context4.abrupt("return", _context4.sent);

              case 12:
                _context4.next = 18;
                break;

              case 14:
                _context4.prev = 14;
                _context4.t0 = _context4["catch"](0);
                this.handleError(_context4.t0);
                return _context4.abrupt("return", this.debug_stop());

              case 18:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[0, 14]]);
      }));

      function debug_stepinto() {
        return _ref4.apply(this, arguments);
      }

      return debug_stepinto;
    }()
  }, {
    key: "debug_stepover",
    value: function debug_stepover() {
      return this.debug_stepinto();
    }
  }, {
    key: "debug_stepout",
    value: function debug_stepout() {
      return this.debug_stepinto();
    }
  }, {
    key: "debug_stop",
    value: function debug_stop() {
      if (this.runningInWorker) {
        this["debugger"].worker.terminate();
        this["debugger"] = null;
        this.setState({
          status: "editing",
          code: this.codeBackup,
          markers: []
        });
      } else {
        this["debugger"] = null;
        this.setState({
          status: "editing",
          code: this.codeBackup,
          markers: []
        });
      }
    }
  }, {
    key: "preRun",
    value: function preRun() {
      this.setState({
        output: "",
        status: "running"
      });
      this.timer = new Date().getTime();
    }
  }, {
    key: "postRun",
    value: function postRun(exitCode) {
      if (this.timer) {
        var ellaps = new Date().getTime() - this.timer;
        this.timer = null;
        var exitInfo = "\nprogram exited with code ".concat(exitCode, " in ").concat(ellaps, "ms.");
        return this.setState({
          output: this.output + exitInfo,
          status: "editing"
        });
      }
    }
  }, {
    key: "onChangeInput",
    value: function onChangeInput(e) {
      return this.setState({
        input: this.refs.input.getValue()
      });
    }
  }, {
    key: "onChangeOutput",
    value: function onChangeOutput(e) {
      return this.setState({
        output: this.refs.output.getValue()
      });
    }
  }, {
    key: "download",
    value: function download() {
      var pom = document.createElement('a');
      pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.state.code));
      pom.setAttribute('download', 'source.cpp');

      if (document.createEvent != null) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        return pom.dispatchEvent(event);
      } else {
        return pom.click();
      }
    }
  }, {
    key: "upload",
    value: function upload() {
      return this.refs.hiddenfile.getDOMNode().click();
    }
  }, {
    key: "handleFile",
    value: function handleFile(e) {
      var _this5 = this;

      var files = e.target.files;

      if (files.length > 0) {
        var file = files.item(0);
        var fr = new FileReader();

        fr.onloadend = function () {
          return _this5.setState({
            code: fr.result
          });
        };

        return fr.readAsText(file);
      }
    }
  }, {
    key: "filemenu",
    value: function filemenu(eventKey) {
      switch (eventKey) {
        case "quick-open":
          return this.quickLoad();

        case "quick-save":
          return this.quickSave();

        case "download":
          return this.download();

        case "upload":
          return this.upload();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var running;
      var _this$state = this.state,
          code = _this$state.code,
          input = _this$state.input,
          output = _this$state.output,
          status = _this$state.status,
          markers = _this$state.markers,
          vars = _this$state.vars,
          lastVars = _this$state.lastVars,
          busy = _this$state.busy;
      var debugging = status === "debugging";
      var editing = status === "editing";
      running = status === "running";
      var brand = /*#__PURE__*/React.createElement("a", {
        href: "https://github.com/felixhao28/JSCPP",
        className: "logo"
      }, "JSCPP");
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
        type: "file",
        ref: "hiddenfile",
        style: {
          display: "none"
        },
        onChange: this.handleFile.bind(this)
      }), ";", /*#__PURE__*/React.createElement(Navbar, {
        brand: brand
      }, /*#__PURE__*/React.createElement(Nav, null, /*#__PURE__*/React.createElement(DropdownButton, {
        title: "File",
        onSelect: this.filemenu.bind(this)
      }, /*#__PURE__*/React.createElement(MenuItem, {
        eventKey: "quick-open"
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "floppy-open"
      }), "Quick Open (Ctrl + O)"), /*#__PURE__*/React.createElement(MenuItem, {
        eventKey: "quick-save"
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "floppy-save"
      }), "Quick Save (Ctrl + S)"), /*#__PURE__*/React.createElement(MenuItem, {
        eventKey: "upload"
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "upload"
      }), "Open..."), /*#__PURE__*/React.createElement(MenuItem, {
        eventKey: "download"
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "save"
      }), "Download")), /*#__PURE__*/React.createElement(NavItem, {
        href: "#",
        onClick: editing && this.run.bind(this, false),
        disabled: !editing
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "play"
      }), "Run"), /*#__PURE__*/React.createElement(NavItem, {
        href: "#",
        onClick: editing && this.run.bind(this, true),
        disabled: !editing
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "sunglasses"
      }), "Debug"), /*#__PURE__*/React.createElement(NavItem, {
        href: "#",
        onClick: editing && this.runInWorker.bind(this, false),
        disabled: !editing
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "play"
      }), "Run in WebWorker"), /*#__PURE__*/React.createElement(NavItem, {
        href: "#",
        onClick: editing && this.runInWorker.bind(this, true),
        disabled: !editing
      }, /*#__PURE__*/React.createElement(Glyphicon, {
        glyph: "sunglasses"
      }), "Debug in WebWorker"))), /*#__PURE__*/React.createElement(Grid, null, debugging ? /*#__PURE__*/React.createElement(Row, {
        className: "debug-toolbar"
      }, /*#__PURE__*/React.createElement(Col, {
        md: 12
      }, /*#__PURE__*/React.createElement(ButtonGroup, {
        disabled: busy
      }, /*#__PURE__*/React.createElement(Button, {
        disabled: true,
        onClick: this.debug_continue.bind(this)
      }, "Continue"), /*#__PURE__*/React.createElement(Button, {
        onClick: this.debug_stepinto.bind(this)
      }, "Step Into"), /*#__PURE__*/React.createElement(Button, {
        disabled: true,
        onClick: this.debug_stepover.bind(this)
      }, "Step Over"), /*#__PURE__*/React.createElement(Button, {
        disabled: true,
        onClick: this.debug_stepout.bind(this)
      }, "Step Out"), /*#__PURE__*/React.createElement(Button, {
        onClick: this.debug_stop.bind(this)
      }, "Stop")))) : null, /*#__PURE__*/React.createElement(Row, {
        className: "main-row"
      }, /*#__PURE__*/React.createElement(Col, {
        md: debugging ? 8 : 12
      }, /*#__PURE__*/React.createElement(AceEditor, {
        ref: "editor",
        name: "editor",
        className: "editor",
        value: code,
        onChange: this.onChange.bind(this),
        theme: "monokai",
        readOnly: !editing,
        markers: markers,
        onLoad: function onLoad(editorInstance) {
          editorInstance.container.style.resize = "both";
          document.addEventListener("mouseup", function (e) {
            return editorInstance.resize();
          });
        }
      })), debugging ? /*#__PURE__*/React.createElement(Col, {
        md: 4
      }, /*#__PURE__*/React.createElement(VariablePanel, {
        mydebugger: this["debugger"],
        vars: vars,
        lastVars: lastVars
      })) : null), /*#__PURE__*/React.createElement(Row, {
        className: "io-row"
      }, /*#__PURE__*/React.createElement(Col, {
        md: 6
      }, /*#__PURE__*/React.createElement(Input, {
        ref: "input",
        className: "input-area",
        type: "textarea",
        label: "Standard Input",
        rows: 5,
        value: input,
        onChange: this.onChangeInput.bind(this)
      })), /*#__PURE__*/React.createElement(Col, {
        md: 6
      }, /*#__PURE__*/React.createElement(Input, {
        ref: "output",
        className: "output-area",
        type: "textarea",
        label: "Standard Output",
        rows: 5,
        value: output,
        onChange: this.onChangeOutput.bind(this)
      })))));
    }
  }]);

  return Main;
}(React.Component);

;
React.render( /*#__PURE__*/React.createElement(Main, null), document.getElementById("mycontainer"));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qc3giXSwibmFtZXMiOlsic2V0Q29va2llIiwiY25hbWUiLCJjdmFsdWUiLCJkb2N1bWVudCIsImNvb2tpZSIsImVuY29kZVVSSUNvbXBvbmVudCIsImdldENvb2tpZSIsIm5hbWUiLCJjYSIsInNwbGl0IiwiQXJyYXkiLCJmcm9tIiwiYyIsImNoYXJBdCIsInN1YnN0cmluZyIsImluZGV4T2YiLCJkZWNvZGVVUklDb21wb25lbnQiLCJsZW5ndGgiLCJWYXJpYWJsZVBhbmVsIiwiZGlzcGxheU5hbWUiLCJwcm9wcyIsInZhcnMiLCJsYXN0VmFycyIsImxhc3RWYXJzTWFwIiwibGFzdFZhciIsIm1hcCIsInYiLCJsYXN0IiwidXBkYXRlZCIsInZhbHVlIiwidHlwZSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiTWFpbiIsImRlZmF1bHRDb2RlIiwic3RhdGUiLCJjb2RlIiwib3V0cHV0IiwiaW5wdXQiLCJzdGF0dXMiLCJtYXJrZXJzIiwiYnVzeSIsImpRdWVyeSIsImhvdGtleXMiLCJvcHRpb25zIiwiZmlsdGVySW5wdXRBY2NlcHRpbmdFbGVtZW50cyIsImZpbHRlckNvbnRlbnRFZGl0YWJsZSIsIiQiLCJiaW5kIiwicXVpY2tTYXZlIiwicXVpY2tMb2FkIiwic2V0U3RhdGUiLCJlIiwicHJldmVudERlZmF1bHQiLCJkZWJ1ZyIsInJ1bm5pbmdJbldvcmtlciIsImNvbmZpZyIsInN0ZGlvIiwiZHJhaW4iLCJ4Iiwid3JpdGUiLCJzIiwicHJlRGVidWciLCJKU0NQUCIsInJ1biIsInN0YXJ0RGVidWciLCJlcnJvciIsImhhbmRsZUVycm9yIiwiZGVidWdfc3RvcCIsInByZVJ1biIsImV4aXRDb2RlIiwicG9zdFJ1biIsImVycm9yMSIsIndvcmtlciIsIkFzeW5jV2ViV29ya2VySGVscGVyIiwiY29kZUJhY2t1cCIsImdldFNvdXJjZSIsImRlYnVnX3N0ZXBpbnRvIiwiZXhpdEluZm8iLCJuZXh0Tm9kZSIsInZhcmlhYmxlIiwibWFya2VyIiwiUmFuZ2UiLCJzTGluZSIsInNDb2x1bW4iLCJkb25lIiwicG9zdERlYnVnIiwidXBkYXRlTWFya2VycyIsInRlcm1pbmF0ZSIsInRpbWVyIiwiRGF0ZSIsImdldFRpbWUiLCJlbGxhcHMiLCJyZWZzIiwiZ2V0VmFsdWUiLCJwb20iLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiY3JlYXRlRXZlbnQiLCJldmVudCIsImluaXRFdmVudCIsImRpc3BhdGNoRXZlbnQiLCJjbGljayIsImhpZGRlbmZpbGUiLCJnZXRET01Ob2RlIiwiZmlsZXMiLCJ0YXJnZXQiLCJmaWxlIiwiaXRlbSIsImZyIiwiRmlsZVJlYWRlciIsIm9ubG9hZGVuZCIsInJlc3VsdCIsInJlYWRBc1RleHQiLCJldmVudEtleSIsImRvd25sb2FkIiwidXBsb2FkIiwicnVubmluZyIsImRlYnVnZ2luZyIsImVkaXRpbmciLCJicmFuZCIsImRpc3BsYXkiLCJoYW5kbGVGaWxlIiwiZmlsZW1lbnUiLCJydW5JbldvcmtlciIsImRlYnVnX2NvbnRpbnVlIiwiZGVidWdfc3RlcG92ZXIiLCJkZWJ1Z19zdGVwb3V0Iiwib25DaGFuZ2UiLCJlZGl0b3JJbnN0YW5jZSIsImNvbnRhaW5lciIsInN0eWxlIiwicmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsIm9uQ2hhbmdlSW5wdXQiLCJvbkNoYW5nZU91dHB1dCIsInJlbmRlciIsImdldEVsZW1lbnRCeUlkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBUyxHQUFHLFNBQVpBLFNBQVksQ0FBQ0MsS0FBRCxFQUFRQyxNQUFSO0FBQUEsU0FBbUJDLFFBQVEsQ0FBQ0MsTUFBVCxHQUFrQkMsa0JBQWtCLENBQUNKLEtBQUQsQ0FBbEIsR0FBNEIsR0FBNUIsR0FBa0NJLGtCQUFrQixDQUFDSCxNQUFELENBQXBELEdBQStELElBQXBHO0FBQUEsQ0FBbEI7O0FBRUEsSUFBTUksU0FBUyxHQUFHLFNBQVpBLFNBQVksQ0FBVUws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dUJySSxRQUFRLENBQUNzSSxjQUFULENBQXdCLGFBQXhCLENBQXZCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc2V0Q29va2llID0gKGNuYW1lLCBjdmFsdWUpID0+IGRvY3VtZW50LmNvb2tpZSA9IGVuY29kZVVSSUNvbXBvbmVudChjbmFtZSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChjdmFsdWUpICsgXCI7IFwiO1xyXG5cclxuY29uc3QgZ2V0Q29va2llID0gZnVuY3Rpb24gKGNuYW1lKSB7XHJcbiAgICBjb25zdCBuYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGNuYW1lKSArIFwiPVwiO1xyXG4gICAgY29uc3QgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcclxuICAgIGZvciAobGV0IGMgb2YgQXJyYXkuZnJvbShjYSkpIHtcclxuICAgICAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xyXG4gICAgICAgICAgICBjID0gYy5zdWJzdHJpbmcoMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjLmluZGV4T2YobmFtZSkgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChjLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgYy5sZW5ndGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5jbGFzcyBWYXJpYWJsZVBhbmVsIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiVmFyaWFibGVQYW5lbFwiO1xyXG4gICAgfVxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIGNvbnN0IHsgdmFycywgbGFzdFZhcnMgfSA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgY29uc3QgbGFzdFZhcnNNYXAgPSB7fTtcclxuICAgICAgICBmb3IgKGNvbnN0IGxhc3RWYXIgb2YgbGFzdFZhcnMpIHtcclxuICAgICAgICAgICAgbGFzdFZhcnNNYXBbbGFzdFZhci5uYW1lXSA9IGxhc3RWYXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiA8VGFibGUgc3RyaXBlZCBib3JkZXJlZCBob3Zlcj5cclxuICAgICAgICAgICAgPHRoZWFkPlxyXG4gICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD5cclxuICAgICAgICAgICAgICAgICAgICA8dGg+VmFsdWU8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0aD5UeXBlPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgIDwvdGhlYWQ+XHJcbiAgICAgICAgICAgIDx0Ym9keT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXJzLm1hcCh2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdCA9IGxhc3RWYXJzTWFwW3YubmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBkYXRlZCA9IGxhc3QgPT0gbnVsbCB8fCBsYXN0LnZhbHVlICE9PSB2LnZhbHVlIHx8IGxhc3QudHlwZSAhPT0gdi50eXBlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8dHIga2V5PXt2Lm5hbWV9IGNsYXNzTmFtZT17dXBkYXRlZCAmJiBcInVwZGF0ZWQtdmFyaWFibGUtaXRlbVwifT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57di5uYW1lfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+e3YudmFsdWV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57di50eXBlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICA8L1RhYmxlPlxyXG4gICAgfVxyXG59O1xyXG5cclxuXHJcbmNsYXNzIE1haW4gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmRlZmF1bHRDb2RlID0gYCNpbmNsdWRlIDxpb3N0cmVhbT5cclxudXNpbmcgbmFtZXNwYWNlIHN0ZDtcclxuaW50IG1haW4oKSB7XHJcbiAgICBpbnQgYTtcclxuICAgIGNpbiA+PiBhO1xyXG4gICAgYSArPSA3O1xyXG4gICAgY291dCA8PCBhKjEwIDw8IGVuZGw7XHJcbiAgICByZXR1cm4gMDtcclxufWA7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcclxuICAgICAgICAgICAgY29kZTogdGhpcy5kZWZhdWx0Q29kZSxcclxuICAgICAgICAgICAgb3V0cHV0OiBcIlwiLFxyXG4gICAgICAgICAgICBpbnB1dDogXCI1XCIsXHJcbiAgICAgICAgICAgIHN0YXR1czogXCJlZGl0aW5nXCIsXHJcbiAgICAgICAgICAgIG1hcmtlcnM6IFtdLFxyXG4gICAgICAgICAgICB2YXJzOiBbXSxcclxuICAgICAgICAgICAgbGFzdFZhcnM6IFtdLFxyXG4gICAgICAgICAgICBidXN5OiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiTWFpblwiO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xyXG4gICAgICAgIGpRdWVyeS5ob3RrZXlzLm9wdGlvbnMuZmlsdGVySW5wdXRBY2NlcHRpbmdFbGVtZW50cyA9IGZhbHNlO1xyXG4gICAgICAgIGpRdWVyeS5ob3RrZXlzLm9wdGlvbnMuZmlsdGVyQ29udGVudEVkaXRhYmxlID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkuYmluZChcImtleWRvd25cIiwgXCJjdHJsK3NcIiwgdGhpcy5xdWlja1NhdmUpO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLmJpbmQoXCJrZXlkb3duXCIsIFwiY3RybCtvXCIsIHRoaXMucXVpY2tMb2FkKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNoYW5nZShjb2RlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIGNvZGVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBxdWlja1NhdmUoZSkge1xyXG4gICAgICAgIGlmIChlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZXRDb29raWUoXCJjb2RlXCIsIHRoaXMuc3RhdGUuY29kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcXVpY2tMb2FkKGUpIHtcclxuICAgICAgICBpZiAoZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIGNvZGU6IGdldENvb2tpZShcImNvZGVcIilcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBoYW5kbGVFcnJvcihlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy5vdXRwdXQgKyBcIlxcblwiICsgZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bihkZWJ1ZywgZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCB7XHJcbiAgICAgICAgICAgIGNvZGVcclxuICAgICAgICB9ID0gdGhpcy5zdGF0ZTtcclxuICAgICAgICBsZXQge1xyXG4gICAgICAgICAgICBpbnB1dFxyXG4gICAgICAgIH0gPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIHRoaXMub3V0cHV0ID0gXCJcIjtcclxuICAgICAgICB0aGlzLnJ1bm5pbmdJbldvcmtlciA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgc3RkaW86IHtcclxuICAgICAgICAgICAgICAgIGRyYWluKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSBpbnB1dDtcclxuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgd3JpdGU6IHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0ICs9IHM7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogdGhpcy5vdXRwdXRcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGVidWdcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChkZWJ1Zykge1xyXG4gICAgICAgICAgICB0aGlzLnByZURlYnVnKCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnZ2VyID0gSlNDUFAucnVuKGNvZGUsIGlucHV0LCBjb25maWcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnREZWJ1ZygpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgZSA9IGVycm9yO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVFcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRlYnVnX3N0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJlUnVuKCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleGl0Q29kZSA9IEpTQ1BQLnJ1bihjb2RlLCBpbnB1dCwgY29uZmlnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvc3RSdW4oZXhpdENvZGUpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjEpIHtcclxuICAgICAgICAgICAgICAgIGUgPSBlcnJvcjE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJlZGl0aW5nXCJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJ1bkluV29ya2VyKGRlYnVnLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IHtcclxuICAgICAgICAgICAgY29kZVxyXG4gICAgICAgIH0gPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIGxldCB7XHJcbiAgICAgICAgICAgIGlucHV0XHJcbiAgICAgICAgfSA9IHRoaXMuc3RhdGU7XHJcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMucnVubmluZ0luV29ya2VyID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIHN0ZGlvOiB7XHJcbiAgICAgICAgICAgICAgICB3cml0ZTogcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQgKz0gcztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB0aGlzLm91dHB1dFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkZWJ1Z1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKCh0aGlzLndvcmtlciA9PSBudWxsKSkge1xyXG4gICAgICAgICAgICB0aGlzLmRlYnVnZ2VyID0gbmV3IEpTQ1BQLkFzeW5jV2ViV29ya2VySGVscGVyKFwiLi9kaXN0L0pTQ1BQLmpzXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgdGhpcy5wcmVEZWJ1ZygpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5kZWJ1Z2dlci5ydW4oY29kZSwgaW5wdXQsIGNvbmZpZyk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXJ0RGVidWcoKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGUgPSBlcnJvcjtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnX3N0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJlUnVuKCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleGl0Q29kZSA9IGF3YWl0IHRoaXMuZGVidWdnZXIucnVuKGNvZGUsIGlucHV0LCBjb25maWcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9zdFJ1bihleGl0Q29kZSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yMSkge1xyXG4gICAgICAgICAgICAgICAgZSA9IGVycm9yMTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImVkaXRpbmdcIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJlRGVidWcoKSB7XHJcbiAgICAgICAgdGhpcy5jb2RlQmFja3VwID0gdGhpcy5zdGF0ZS5jb2RlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgb3V0cHV0OiBcIlwiLFxyXG4gICAgICAgICAgICBzdGF0dXM6IFwiZGVidWdnaW5nXCJcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzdGFydERlYnVnKCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICBjb2RlOiBhd2FpdCB0aGlzLmRlYnVnZ2VyLmdldFNvdXJjZSgpLFxyXG4gICAgICAgICAgICB2YXJzOiBbXSxcclxuICAgICAgICAgICAgbGFzdFZhcnM6IFtdXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVidWdfc3RlcGludG8oKTtcclxuICAgIH1cclxuXHJcbiAgICBwb3N0RGVidWcoZXhpdENvZGUpIHtcclxuICAgICAgICBjb25zdCBleGl0SW5mbyA9IGBcXG5wcm9ncmFtIGV4aXRlZCB3aXRoIGNvZGUgJHtleGl0Q29kZX0uYDtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy5vdXRwdXQgKyBleGl0SW5mb1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHVwZGF0ZU1hcmtlcnMoKSB7XHJcbiAgICAgICAgY29uc3QgcyA9IGF3YWl0IHRoaXMuZGVidWdnZXIubmV4dE5vZGUoKTtcclxuICAgICAgICBjb25zdCBsYXN0VmFycyA9IHRoaXMuc3RhdGUudmFycztcclxuICAgICAgICBjb25zdCB2YXJzID0gYXdhaXQgdGhpcy5kZWJ1Z2dlci52YXJpYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IG1hcmtlciA9IG5ldyBSYW5nZShzLnNMaW5lIC0gMSwgcy5zQ29sdW1uIC0gMSwgcy5zTGluZSAtIDEsIHMuc0NvbHVtbik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICBtYXJrZXJzOiBbbWFya2VyXSxcclxuICAgICAgICAgICAgdmFycyxcclxuICAgICAgICAgICAgbGFzdFZhcnNcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1Z19jb250aW51ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWJ1Z19zdGVwaW50bygpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGRlYnVnX3N0ZXBpbnRvKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvbmUgPSBhd2FpdCB0aGlzLmRlYnVnZ2VyLmNvbnRpbnVlKCk7XHJcbiAgICAgICAgICAgIGlmIChkb25lICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWJ1Z19zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb3N0RGVidWcoZG9uZS52KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZU1hcmtlcnMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVFcnJvcihlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVidWdfc3RvcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZGVidWdfc3RlcG92ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVidWdfc3RlcGludG8oKTtcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1Z19zdGVwb3V0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRlYnVnX3N0ZXBpbnRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGVidWdfc3RvcCgpIHtcclxuICAgICAgICBpZiAodGhpcy5ydW5uaW5nSW5Xb3JrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5kZWJ1Z2dlci53b3JrZXIudGVybWluYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGVidWdnZXIgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogXCJlZGl0aW5nXCIsXHJcbiAgICAgICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGVCYWNrdXAsXHJcbiAgICAgICAgICAgICAgICBtYXJrZXJzOiBbXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRlYnVnZ2VyID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFwiZWRpdGluZ1wiLFxyXG4gICAgICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlQmFja3VwLFxyXG4gICAgICAgICAgICAgICAgbWFya2VyczogW11cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByZVJ1bigpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgb3V0cHV0OiBcIlwiLFxyXG4gICAgICAgICAgICBzdGF0dXM6IFwicnVubmluZ1wiXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50aW1lciA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHBvc3RSdW4oZXhpdENvZGUpIHtcclxuICAgICAgICBpZiAodGhpcy50aW1lcikge1xyXG4gICAgICAgICAgICBjb25zdCBlbGxhcHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMudGltZXI7XHJcbiAgICAgICAgICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICBjb25zdCBleGl0SW5mbyA9IGBcXG5wcm9ncmFtIGV4aXRlZCB3aXRoIGNvZGUgJHtleGl0Q29kZX0gaW4gJHtlbGxhcHN9bXMuYDtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0OiB0aGlzLm91dHB1dCArIGV4aXRJbmZvLFxyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcImVkaXRpbmdcIlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25DaGFuZ2VJbnB1dChlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICBpbnB1dDogdGhpcy5yZWZzLmlucHV0LmdldFZhbHVlKClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNoYW5nZU91dHB1dChlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICBvdXRwdXQ6IHRoaXMucmVmcy5vdXRwdXQuZ2V0VmFsdWUoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRvd25sb2FkKCkge1xyXG4gICAgICAgIGNvbnN0IHBvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5zdGF0ZS5jb2RlKSk7XHJcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnc291cmNlLmNwcCcpO1xyXG5cclxuICAgICAgICBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xyXG4gICAgICAgICAgICBldmVudC5pbml0RXZlbnQoJ2NsaWNrJywgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBwb20uZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvbS5jbGljaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB1cGxvYWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmcy5oaWRkZW5maWxlLmdldERPTU5vZGUoKS5jbGljaygpO1xyXG4gICAgfVxyXG5cclxuICAgIGhhbmRsZUZpbGUoZSkge1xyXG4gICAgICAgIGNvbnN0IHsgZmlsZXMgfSA9IGUudGFyZ2V0O1xyXG4gICAgICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBmaWxlcy5pdGVtKDApO1xyXG4gICAgICAgICAgICBjb25zdCBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIGZyLm9ubG9hZGVuZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBjb2RlOiBmci5yZXN1bHRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gZnIucmVhZEFzVGV4dChmaWxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZmlsZW1lbnUoZXZlbnRLZXkpIHtcclxuICAgICAgICBzd2l0Y2ggKGV2ZW50S2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJxdWljay1vcGVuXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWlja0xvYWQoKTtcclxuICAgICAgICAgICAgY2FzZSBcInF1aWNrLXNhdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aWNrU2F2ZSgpO1xyXG4gICAgICAgICAgICBjYXNlIFwiZG93bmxvYWRcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRvd25sb2FkKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ1cGxvYWRcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVwbG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgbGV0IHJ1bm5pbmc7XHJcbiAgICAgICAgY29uc3QgeyBjb2RlLCBpbnB1dCwgb3V0cHV0LCBzdGF0dXMsIG1hcmtlcnMsIHZhcnMsIGxhc3RWYXJzLCBidXN5IH0gPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIGNvbnN0IGRlYnVnZ2luZyA9IHN0YXR1cyA9PT0gXCJkZWJ1Z2dpbmdcIjtcclxuICAgICAgICBjb25zdCBlZGl0aW5nID0gc3RhdHVzID09PSBcImVkaXRpbmdcIjtcclxuICAgICAgICBydW5uaW5nID0gc3RhdHVzID09PSBcInJ1bm5pbmdcIjtcclxuICAgICAgICBjb25zdCBicmFuZCA9IDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vZmVsaXhoYW8yOC9KU0NQUFwiIGNsYXNzTmFtZT1cImxvZ29cIj5cclxuICAgICAgICAgICAgSlNDUFBcclxuICAgICAgICAgICAgPC9hPjtcclxuICAgICAgICByZXR1cm4gPGRpdj5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCIgcmVmPVwiaGlkZGVuZmlsZVwiIHN0eWxlPXt7IGRpc3BsYXk6IFwibm9uZVwiIH19IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUZpbGUuYmluZCh0aGlzKX0gLz47XHJcbiAgICAgICAgICAgIDxOYXZiYXIgYnJhbmQ9e2JyYW5kfT5cclxuICAgICAgICAgICAgICAgIDxOYXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPERyb3Bkb3duQnV0dG9uIHRpdGxlPVwiRmlsZVwiIG9uU2VsZWN0PXt0aGlzLmZpbGVtZW51LmJpbmQodGhpcyl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8TWVudUl0ZW0gZXZlbnRLZXk9XCJxdWljay1vcGVuXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R2x5cGhpY29uIGdseXBoPVwiZmxvcHB5LW9wZW5cIiAvPlF1aWNrIE9wZW4gKEN0cmwgKyBPKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8TWVudUl0ZW0gZXZlbnRLZXk9XCJxdWljay1zYXZlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R2x5cGhpY29uIGdseXBoPVwiZmxvcHB5LXNhdmVcIiAvPlF1aWNrIFNhdmUgKEN0cmwgKyBTKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8TWVudUl0ZW0gZXZlbnRLZXk9XCJ1cGxvYWRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxHbHlwaGljb24gZ2x5cGg9XCJ1cGxvYWRcIiAvPk9wZW4uLi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9NZW51SXRlbT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPE1lbnVJdGVtIGV2ZW50S2V5PVwiZG93bmxvYWRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxHbHlwaGljb24gZ2x5cGg9XCJzYXZlXCIgLz5Eb3dubG9hZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvRHJvcGRvd25CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj1cIiNcIiBvbkNsaWNrPXtlZGl0aW5nICYmIHRoaXMucnVuLmJpbmQodGhpcywgZmFsc2UpfSBkaXNhYmxlZD17IWVkaXRpbmd9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8R2x5cGhpY29uIGdseXBoPVwicGxheVwiIC8+UnVuXHJcbiAgICAgICAgICAgICAgICAgICAgPC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIGhyZWY9XCIjXCIgb25DbGljaz17ZWRpdGluZyAmJiB0aGlzLnJ1bi5iaW5kKHRoaXMsIHRydWUpfSBkaXNhYmxlZD17IWVkaXRpbmd9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8R2x5cGhpY29uIGdseXBoPVwic3VuZ2xhc3Nlc1wiIC8+RGVidWdcclxuICAgICAgICAgICAgICAgICAgICA8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj1cIiNcIiBvbkNsaWNrPXtlZGl0aW5nICYmIHRoaXMucnVuSW5Xb3JrZXIuYmluZCh0aGlzLCBmYWxzZSl9IGRpc2FibGVkPXshZWRpdGluZ30+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxHbHlwaGljb24gZ2x5cGg9XCJwbGF5XCIgLz5SdW4gaW4gV2ViV29ya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgPC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIGhyZWY9XCIjXCIgb25DbGljaz17ZWRpdGluZyAmJiB0aGlzLnJ1bkluV29ya2VyLmJpbmQodGhpcywgdHJ1ZSl9IGRpc2FibGVkPXshZWRpdGluZ30+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxHbHlwaGljb24gZ2x5cGg9XCJzdW5nbGFzc2VzXCIgLz5EZWJ1ZyBpbiBXZWJXb3JrZXJcclxuICAgICAgICAgICAgICAgICAgICA8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICA8L05hdj5cclxuICAgICAgICAgICAgPC9OYXZiYXI+XHJcbiAgICAgICAgICAgIDxHcmlkPlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnZ2luZyA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxSb3cgY2xhc3NOYW1lPVwiZGVidWctdG9vbGJhclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENvbCBtZD17MTJ9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b25Hcm91cCBkaXNhYmxlZD17YnVzeX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gZGlzYWJsZWQgb25DbGljaz17dGhpcy5kZWJ1Z19jb250aW51ZS5iaW5kKHRoaXMpfT5Db250aW51ZTwvQnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9e3RoaXMuZGVidWdfc3RlcGludG8uYmluZCh0aGlzKX0+U3RlcCBJbnRvPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gZGlzYWJsZWQgb25DbGljaz17dGhpcy5kZWJ1Z19zdGVwb3Zlci5iaW5kKHRoaXMpfT5TdGVwIE92ZXI8L0J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBkaXNhYmxlZCBvbkNsaWNrPXt0aGlzLmRlYnVnX3N0ZXBvdXQuYmluZCh0aGlzKX0+U3RlcCBPdXQ8L0J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXt0aGlzLmRlYnVnX3N0b3AuYmluZCh0aGlzKX0+U3RvcDwvQnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uR3JvdXA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0NvbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Sb3c+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgPFJvdyBjbGFzc05hbWU9XCJtYWluLXJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxDb2wgbWQ9e2RlYnVnZ2luZyA/IDggOiAxMn0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY2VFZGl0b3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cImVkaXRvclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwiZWRpdG9yXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImVkaXRvclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y29kZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uQ2hhbmdlLmJpbmQodGhpcyl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVtZT1cIm1vbm9rYWlcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZE9ubHk9eyFlZGl0aW5nfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Vycz17bWFya2Vyc31cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTG9hZD17KGVkaXRvckluc3RhbmNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9ySW5zdGFuY2UuY29udGFpbmVyLnN0eWxlLnJlc2l6ZSA9IFwiYm90aFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChlKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvckluc3RhbmNlLnJlc2l6ZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z2dpbmcgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENvbCBtZD17NH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFZhcmlhYmxlUGFuZWwgbXlkZWJ1Z2dlcj17dGhpcy5kZWJ1Z2dlcn0gdmFycz17dmFyc30gbGFzdFZhcnM9e2xhc3RWYXJzfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgICAgIDxSb3cgY2xhc3NOYW1lPVwiaW8tcm93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPENvbCBtZD17Nn0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dCByZWY9XCJpbnB1dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJpbnB1dC1hcmVhXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0YXJlYVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD1cIlN0YW5kYXJkIElucHV0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aW5wdXR9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vbkNoYW5nZUlucHV0LmJpbmQodGhpcyl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPENvbCBtZD17Nn0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dCByZWY9XCJvdXRwdXRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3V0cHV0LWFyZWFcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRhcmVhXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPVwiU3RhbmRhcmQgT3V0cHV0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17b3V0cHV0fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25DaGFuZ2VPdXRwdXQuYmluZCh0aGlzKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0NvbD5cclxuICAgICAgICAgICAgICAgIDwvUm93PlxyXG4gICAgICAgICAgICA8L0dyaWQ+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICB9XHJcbn07XHJcblxyXG5SZWFjdC5yZW5kZXIoPE1haW4gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXljb250YWluZXJcIikpO1xyXG4iXX0=