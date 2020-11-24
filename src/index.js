/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-var */
require("babel-polyfill");
var self = global.window;
// Copied from https://stackoverflow.com/a/11979803
function testEnv() {
    if (!self || self.document === undefined) {
        return true;
    } else {
        return false;
    }
}
var JSCPP = require('./launcher').default;
var Debugger = require("./debugger").default;
if (testEnv()) {
    var myDebugger;
    onmessage = function (e) {
        var id = e.data[0];
        var functionName = e.data[1];
        var args = e.data.slice(2);
        if (functionName === "run") {
            try {
                if (args.length < 2) {
                    args.push(""); // input
                }
                if (args.length < 3) {
                    args.push({}); // config
                }
                args[2].stdio = {
                    write: function (s) {
                        postMessage({ err: 0, type: "stdio.write", data: s });
                    }
                };
                myDebugger = JSCPP.run.apply(JSCPP, args);
                if (args[2] && args[2].debug) {
                    postMessage({ id: id, err: 0, msg: "Debugger started." });
                } else {
                    postMessage({ id: id, err: 0, data: myDebugger });
                }
            } catch (error) {
                postMessage({ id: id, err: -1, msg: error.message });
            }
        } else {
            if (myDebugger) {
                try {
                    var r = myDebugger[functionName].apply(myDebugger, args);
                    postMessage({ id: id, err: 0, data: r });
                } catch (error) {
                    postMessage({ id: id, err: -1, msg: error.message });
                }
            } else {
                postMessage({ id: id, err: 1, msg: "Cannot run method " + functionName + " without debugger." });
            }
        }
    };
} else {
    var WebWorkerHelper = function (srcPath) {
        if (!global.Worker) {
            throw new Error("WebWorker is not supported!");
        }
        this.cbMap = {};
        this.hooks = {};
        this.worker = new Worker(srcPath || "./JSCPP.es5.min.js");
        var _this = this;
        this.worker.onmessage = function (e) {
            var data = e.data;
            if (data.id) {
                // passive message
                if (_this.cbMap[data.id]) {
                    _this.cbMap[data.id](data.err ? new Error(data.msg) : null, data.data);
                }
                delete _this.cbMap[data.id];
            } else {
                // proactive message
                _this.hooks[data.type](data.err, data.data);
            }
        };
        return this;
    };
    WebWorkerHelper.prototype.varCall = function (func, args, cb) {
        var id = Math.random().toString(16);
        this.cbMap[id] = cb;
        this.worker.postMessage([id, func].concat(args));
    };
    WebWorkerHelper.prototype.run = function (code, input, options, cb) {
        options = options || {};
        var oldStdio = options.stdio;
        if (oldStdio.drain) {
            throw new Error("drain is not supported in WebWorker");
        }
        options.stdio = null;
        this.hooks["stdio.write"] = function (err, s) {
            if (oldStdio.write) {
                oldStdio.write(s);
            }
        }
        this.varCall("run", [code, input, options], cb);
    };

    (function () {
        for (var func of Object.getOwnPropertyNames(Debugger.prototype)) {
            if (typeof (Debugger.prototype[func]) === "function" && func !== "constructor") {
                WebWorkerHelper.prototype[func] = (function () {
                    var _func = func;
                    return function () {
                        this.varCall(_func, Array.slice.apply(null, arguments, [0, arguments.length - 1]), arguments[arguments.length - 1])
                    }
                })();
            }
        }
    })();

    var AsyncWebWorkerHelper = function (srcPath) {
        this.helper = new WebWorkerHelper(srcPath);
        this.worker = this.helper.worker;
        return this;
    };
    (function () {
        for (var func in WebWorkerHelper.prototype) {
            if (typeof (WebWorkerHelper.prototype[func]) === "function" && func !== "constructor") {
                AsyncWebWorkerHelper.prototype[func] = (function () {
                    var _func = func;
                    return function () {
                        var _arguments = Array.slice(arguments);
                        var _this = this;
                        return new Promise(function (resolve, reject) {
                            WebWorkerHelper.prototype[_func].apply(_this.helper, _arguments.concat([function (err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(data);
                                }
                            }]));
                        });
                    };
                })();
            }
        }
    })();
    JSCPP.WebWorkerHelper = WebWorkerHelper;
    JSCPP.AsyncWebWorkerHelper = AsyncWebWorkerHelper;
    window.JSCPP = JSCPP;
}
