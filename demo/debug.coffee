#JSCPP = require "JSCPP"
JSCPP = require "../lib/main"
yaml = require "js-yaml"
fs = require "fs"
argv = require("minimist") process.argv.slice(2)

config = {}

if process.argv.length > 2
  testName = argv._[0]
  if argv.d or argv.debug
    config.debug = true

  if argv.i or argv.in
    input = argv.i or argv.in

  if argv.f or argv.file
    code = fs.readFileSync(argv.f or argv.file, "utf-8")
    input or= ""
  else
    tests = yaml.safeLoad fs.readFileSync("test/test.yaml", "utf-8")
    cases = tests.tests[testName].cases
    if Array.isArray cases
      cases = cases[0]
    cppFile = cases.cpp
    input = cases.in or ""

    code = fs.readFileSync("./test/" + cppFile, "utf-8")

  if not config.debug
    exitcode = JSCPP.run(code, input, config)
    console.info("\nprogram exited with code #{exitcode}")
  else
    mydebugger = JSCPP.run(code, input, config)
    
    console.log """
    Available commands:
    n, next           : step into
    t, type <name>      : internal details of a type <name>
    v, var, variable      : all local variables
    v, var, variable <name>   : a variable called <name>
    c, current, pos, position : current position in source

    """
    readline = require "readline"
    rl = readline.createInterface(process.stdin, process.stdout)
    rl.setPrompt("\ndebug> ")
    
    srcLines = mydebugger.src.split "\n"

    for l, i in srcLines
      console.log "#{i+1}:\t#{l}"

    onPrompt = ->
      while not (stmt = mydebugger.nextNode())?
        mydebugger.next()
      console.log "\n\n"
      line = stmt.sLine
      if line > 1
        console.log "  #{line-1}:\t" + srcLines[line-2]
      console.log "==> #{line}:\t" + srcLines[line-1]
      if line < srcLines.length
        console.log "  #{line+1}:\t" + srcLines[line]

    onPrompt()
    rl.prompt()

    String::startsWith = (s) ->
      this.slice(s.length) is s
    
    lastOutputPos = 0

    rl.on "line", (line) ->
      try
        done = false
        cmds = line.trim().split(" ")
        switch cmds[0]
          when "n", "next"
            done = mydebugger.continue()
          when "t", "type"
            console.log mydebugger.type(cmds[1])
          when "v", "var", "variable"
            console.log mydebugger.variable(cmds[1])
          when "c", "current", "pos"
            s = mydebugger.nextNode()
            console.log "#{s.sLine}:#{s.sColumn}(#{s.sOffset}) - #{s.eLine}:#{s.eColumn}(#{s.eOffset})"
      catch e
        console.log "command failed: " + e.stack

      if done is false
        onPrompt()
        rl.prompt()
      else
        console.log "debugger exited with code #{done.v}"
        rl.close()
      
else
  console.log """
  Usage: node -harmony demo/debug [<testName>] <options>
  Parameters:
  <testName>: Name of the test. Defined in test/test.yaml
  <options>:
    -d --debug: use debug mode
    -i --in: specify stdio input
    -f --file: specify a cpp file
  """
