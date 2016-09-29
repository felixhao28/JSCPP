#logger = require("tracer").colorConsole();
CRuntime = require("./rt")
Interpreter = require("./interpreter")
ast = require("./ast")
preprocessor = require("./preprocessor")
Debugger = require("./debugger")
PEGUtil = require("pegjs-util")

mergeConfig = (a, b) ->
  for o of b
    if o of a and typeof b[o] == "object"
      mergeConfig a[o], b[o]
    else
      a[o] = b[o]
  return

includes =
  iostream: require("./includes/iostream")
  cctype: require("./includes/cctype")
  cstring: require("./includes/cstring")
  cmath: require("./includes/cmath")
  cstdio: require("./includes/cstdio")
  cstdlib: require("./includes/cstdlib")
  ctime: require("./includes/ctime")
  iomanip: require("./includes/iomanip")
  foo: require("./includes/dummy_class_foo")

headerAlias =
  "ctype.h": "cctype"
  "string.h": "cstring"
  "math.h": "cmath"
  "stdio.h": "cstdio"
  "stdlib.h": "cstdlib"
  "time.h": "ctime"

for alias, realName of headerAlias
  includes[alias] = includes[realName]

module.exports =
  includes: includes
  run: (code, input, config) ->
    inputbuffer = input.toString()
    self = this
    _config =
      stdio:
        drain: ->
          x = inputbuffer
          inputbuffer = null
          x
        write: (s) ->
          process.stdout.write s
          return
      includes: self.includes
    mergeConfig _config, config
    rt = new CRuntime(_config)
    code = code.toString()
    code = preprocessor.parse(rt, code)

    mydebugger = new Debugger()
    if _config.debug
      mydebugger.src = code

    result = PEGUtil.parse(ast, code)
    if result.error?
      throw "ERROR: Parsing Failure:\n" + PEGUtil.errorMessage(result.error, true)
    interpreter = new Interpreter(rt)
    defGen = interpreter.run result.ast
    loop
      step = defGen.next()
      break if step.done
    mainGen = rt.getFunc("global", "main", [])(rt, null, [])
    if _config.debug
      mydebugger.start(rt, mainGen)
      mydebugger
    else
      loop
        step = mainGen.next()
        break if step.done
      step.value.v
