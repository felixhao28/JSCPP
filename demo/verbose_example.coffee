#JSCPP = require "JSCPP"
JSCPP = require "../lib/main"
fs = require "fs"

code = fs.readFileSync "./test/maze.pass.cpp"
input = fs.readFileSync "./test/maze.in"

code = code.toString()
inputbuffer = input.toString()

{Runtime, preprocessor, Interpreter, ast, includes, version} = JSCPP

console.log "Initilizing JSCPP #{version}..."
rt = new Runtime
    stdio:
        drain: ->
            x = inputbuffer
            inputbuffer = null
            return x
        write: (s) ->
            process.stdout.write s

    includes:
        iostream: includes.iostream
        "math.h": includes.cmath
console.log "JSCPP is ready\n"

console.log "Preprocessing code..."
code = preprocessor.parse rt, code
console.log "Preprocessing complete\n"

console.log "Constructing abstract syntax tree..."
tree = ast.parse code
console.log "Syntax passed\n"

console.log "Begin execution"
console.log "================"
interpreter = new Interpreter rt
interpreter.run tree
# Getting the entry point of the program.
# You can use getFunc to get other functions as well.
# The parameters are scope, name and parameter types
mainFunc = rt.getFunc "global", "main", []
# Excuting the main function.
# The parameters are runtime instance, "this" and parameter values
exitValue = mainFunc rt, null, []
exitCode = exitValue.v
console.log "================"
console.log "Program exited with code #{exitCode}"
