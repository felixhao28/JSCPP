import JSCPP from "./launcher";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { IntVariable, JSCPPConfig } from "./rt";
import * as readline from "readline";
import Debugger from "./debugger";

function startDebug() {
    const argv = require("minimist")(process.argv.slice(2));

    const config: JSCPPConfig = {};

    if (process.argv.length > 2) {
        let testName = argv._[0];
        let caseNumber: number;
        if (testName.indexOf(":") >= 0) {
            caseNumber = parseInt(testName.substring(testName.indexOf(":") + 1), 10);
            testName = testName.substring(0, testName.indexOf(":"));
        } else {
            caseNumber = 1;
        }
        if (argv.d || argv.debug) {
            config.debug = true;
        }

        if (argv.unsigned_overflow) {
            config.unsigned_overflow = argv.unsigned_overflow;
        }
        let input;
        let code;
        if (argv.i || argv.in) {
            input = argv.i || argv.in;
        }

        if (argv.f || argv.file) {
            code = fs.readFileSync(argv.f || argv.file, "utf-8");
            if (!input) { input = ""; }
        } else {
            const tests = yaml.load(fs.readFileSync("test/test.yaml", "utf-8")) as any;
            let {
                cases
            } = tests.tests[testName];
            if (Array.isArray(cases)) {
                cases = cases[caseNumber - 1];
            }
            const cppFile = cases.cpp;
            input = cases.in || "";

            code = fs.readFileSync("./test/" + cppFile, "utf-8");
        }

        if (!config.debug) {
            const exitcode = JSCPP.run(code, input, config) as number;
            console.info(`\nprogram exited with code ${exitcode}`);
        } else {
            const mydebugger = JSCPP.run(code, input, config) as Debugger;

            console.log(`\
    Available commands:
    n, next           : step into
    t, type <name>      : internal details of a type <name>
    v, var, variable      : all local variables
    v, var, variable <name>   : a variable called <name>
    c, current, pos, position : current position in source
    \
    `
            );
            const rl = readline.createInterface({
                input: process.stdin as any,
                output: process.stdout as any,
            });
            rl.setPrompt("\ndebug> ");

            const srcLines = mydebugger.src.split("\n");

            for (let i = 0; i < srcLines.length; i++) {
                const l = srcLines[i];
                console.log(`${i + 1}:\t${l}`);
            }

            const onPrompt = function () {
                let stmt;
                while (((stmt = mydebugger.nextNode()) == null)) {
                    mydebugger.next();
                }
                console.log("\n\n");
                const line = stmt.sLine;
                if (line > 1) {
                    console.log(`  ${line - 1}:\t` + srcLines[line - 2]);
                }
                console.log(`==> ${line}:\t` + srcLines[line - 1]);
                if (line < srcLines.length) {
                    return console.log(`  ${line + 1}:\t` + srcLines[line]);
                }
            };

            onPrompt();
            rl.prompt();

            String.prototype.startsWith = function (s) {
                return this.slice(s.length) === s;
            };

            const lastOutputPos = 0;

            rl.on("line", function (line) {
                let done: false | IntVariable = false;
                try {
                    const cmds = line.trim().split(" ");
                    switch (cmds[0]) {
                        case "n": case "next":
                            done = mydebugger.continue();
                            break;
                        case "v": case "var": case "variable":
                            console.log(mydebugger.variable(cmds[1]));
                            break;
                        case "c": case "current": case "pos":
                            const s = mydebugger.nextNode();
                            console.log(`${s.sLine}:${s.sColumn}(${s.sOffset}) - ${s.eLine}:${s.eColumn}(${s.eOffset})`);
                            break;
                    }
                } catch (e) {
                    console.log("command failed: " + e.stack);
                }

                if (done === false) {
                    onPrompt();
                    return rl.prompt();
                } else {
                    console.log(`debugger exited with code ${done.v}`);
                    return rl.close();
                }
            });
        }

    } else {
        console.log(`\
    Usage: node -harmony demo/debug [<testName>] <options>
    Parameters:
    <testName>: Name of the test. Defined in test/test.yaml
    <options>:
      -d --debug: use debug mode
      -i --in: specify stdio input
      -f --file: specify a cpp file\
    `
        );
    }
}

if (require.main === module) {
    startDebug();
}