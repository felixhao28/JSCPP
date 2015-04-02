JSCPP = require "../lib/main"
fs = require "fs"

config = {}

mydebugger = new JSCPP.Debugger()

if process.argv.length > 2
    testName = process.argv[2];
    configs = process.argv.slice(3)
    if "-debug" in configs
        config.debug = true
        config.debugger = mydebugger
else
    testName = "maze"

tests = JSON.parse(fs.readFileSync("test/test.json"))

cppFile = tests.tests[testName].cpp[0]
input = tests.tests[testName].cases[0].in

code = fs.readFileSync("./test/" + cppFile)
exitcode = JSCPP.launcher.run(code, input, config)
console.info("\nprogram exited with code #{exitcode}")

if config.debug
    readline = require "readline"
    rl = readline.createInterface(process.stdin, process.stdout)
    rl.setPrompt("\ndebug> ")
    
    console.log "==>" + mydebugger.nextLine()
    rl.prompt()

    String::startsWith = (s) ->
        this.slice(s.length) is s
    
    lastOutputPos = 0

    rl.on "line", (line) ->
        try
            hasNext = true
            cmds = line.trim().split(" ")
            switch cmds[0]
                when "n"
                    hasNext = mydebugger.next()
                    newoutput = mydebugger.output()
                    if newoutput.length > lastOutputPos
                        console.log "=======output======="
                        console.log newoutput.slice(lastOutputPos)
                        console.log "=======output======="
                        lastOutputPos = newoutput.length
                when "p"
                    hasPrev = mydebugger.prev()
                when "t"
                    console.log mydebugger.type(cmds[1])
                when "v"
                    console.log mydebugger.variable(cmds[1])
                when "c"
                    s = mydebugger.nextStmt()
                    console.log "#{s.line}:#{s.column}(#{s.pos}) - #{s.reportedLine}:#{s.reportedColumn}(#{s.reportedPos})"
        catch e
            console.log "command failed: " + e.stack

        if hasNext
            console.log "==>" + mydebugger.nextLine()
            rl.prompt()
        else
            rl.close()
        