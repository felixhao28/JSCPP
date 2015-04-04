#JSCPP = require "JSCPP"
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

    tests = JSON.parse(fs.readFileSync("test/test.json"))

    cppFile = tests.tests[testName].cpp[0]
    input = tests.tests[testName].cases[0].in

    code = fs.readFileSync("./test/" + cppFile)
    exitcode = JSCPP.launcher.run(code, input, config)
    console.info("\nprogram exited with code #{exitcode}")

    if config.debug
        console.log """
        Available commands:
        n, next                   : step into
        p, prev, b, back          : step back into
        t, type <name>            : internal details of a type <name>
        v, var, variable          : all local variables
        v, var, variable <name>   : a variable called <name>
        c, current, pos, position : current position in source
        """
        readline = require "readline"
        rl = readline.createInterface(process.stdin, process.stdout)
        rl.setPrompt("\ndebug> ")
        
        srcLines = mydebugger.src.split "\n"

        for l, i in srcLines
            console.log "#{i+1}\t#{l}"

        onPrompt = ->
            console.log "\n\n"
            line = mydebugger.nextStmt().reportedLine
            if line > 1
                console.log "    #{line-1}:\t" + srcLines[line-2]
            console.log "==> #{line}:\t" + srcLines[line-1]
            if line < srcLines.length
                console.log "    #{line+1}:\t" + srcLines[line]

        onPrompt()
        rl.prompt()

        String::startsWith = (s) ->
            this.slice(s.length) is s
        
        lastOutputPos = 0

        rl.on "line", (line) ->
            try
                hasNext = true
                cmds = line.trim().split(" ")
                switch cmds[0]
                    when "n", "next"
                        hasNext = mydebugger.next()
                        newoutput = mydebugger.output()
                        if newoutput.length > lastOutputPos
                            console.log newoutput.slice(lastOutputPos)
                            lastOutputPos = newoutput.length
                    when "p", "prev", "b", "back"
                        hasPrev = mydebugger.prev()
                        lastOutputPos = mydebugger.output()
                    when "t", "type"
                        console.log mydebugger.type(cmds[1])
                    when "v", "var", "variable"
                        console.log mydebugger.variable(cmds[1])
                    when "c", "current", "pos"
                        s = mydebugger.nextStmt()
                        console.log "#{s.reportedLine}:#{s.reportedColumn}(#{s.reportedPos}) - #{s.line}:#{s.column}(#{s.pos})"
            catch e
                console.log "command failed: " + e.stack

            if hasNext
                onPrompt()
                rl.prompt()
            else
                rl.close()
            
else
    console.log """
    Usage: node demo/debug <testName> <options>
    Parameters:
    <testName>: Name of the test. Defined in test/test.json
    <options>:
        -debug: use debug mode
    """
