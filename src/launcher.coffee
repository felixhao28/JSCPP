#logger = require("tracer").colorConsole();
CRuntime = require("./rt")
Interpreter = require("./interpreter")
ast = require("./ast")
preprocessor = require("./preprocessor")

mergeConfig = (a, b) ->
    for o of b
        if o of a and typeof b[o] == "object"
            mergeConfig a[o], b[o]
        else
            a[o] = b[o]
    return

module.exports =
    includes:
        iostream: require("./includes/iostream")
        cctype: require("./includes/cctype")
        cstring: require("./includes/cstring")
        cmath: require("./includes/cmath")
        cstdio: require("./includes/cstdio")
        cstdlib: require("./includes/cstdlib")
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
        tree = ast.parse(code)
        interpreter = new Interpreter(rt)
        interpreter.run tree
        exitCode = rt.getFunc("global", "main", [])(rt, null, []).v
        exitCode