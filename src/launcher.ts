// logger = require("tracer").colorConsole();
import { CRuntime, IncludeModule, JSCPPConfig, mergeConfig } from "./rt";

import { Interpreter } from "./interpreter";
const ast = require("./ast");
const preprocessor = require("./preprocessor");
import Debugger from "./debugger"
// @ts-ignore;
import * as PEGUtil from "pegjs-util";

const includes: { [fileName: string]: IncludeModule } = {
    iostream: require("./includes/iostream"),
    cctype: require("./includes/cctype"),
    cstring: require("./includes/cstring"),
    cmath: require("./includes/cmath"),
    cstdio: require("./includes/cstdio"),
    cstdlib: require("./includes/cstdlib"),
    ctime: require("./includes/ctime"),
    iomanip: require("./includes/iomanip"),
    foo: require("./includes/dummy_class_foo")
};

const headerAlias: { [filename: string]: string } = {
    "ctype.h": "cctype",
    "string.h": "cstring",
    "math.h": "cmath",
    "stdio.h": "cstdio",
    "stdlib.h": "cstdlib",
    "time.h": "ctime"
};

for (const alias of Object.keys(headerAlias)) {
    const realName = headerAlias[alias];
    includes[alias] = includes[realName];
}

export default {
    includes,
    run(code: string, input: string, config: JSCPPConfig) {
        let step;
        let inputbuffer = input.toString();
        const _config: JSCPPConfig = {
            stdio: {
                drain() {
                    const x = inputbuffer;
                    inputbuffer = null;
                    return x;
                },
                write(s) {
                    process.stdout.write(s);
                }
            },
            includes: this.includes,
            unsigned_overflow: "error"
        };
        mergeConfig(_config, config);
        const rt = new CRuntime(_config);
        code = code.toString();
        code = preprocessor.parse(rt, code);

        const mydebugger = new Debugger();
        if (_config.debug) {
            mydebugger.src = code;
        }

        const result = PEGUtil.parse(ast, code);
        if (result.error != null) {
            throw new Error("ERROR: Parsing Failure:\n" + PEGUtil.errorMessage(result.error, true));
        }
        const interpreter = new Interpreter(rt);
        const defGen = interpreter.run(result.ast, code);
        while (true) {
            step = defGen.next();
            if (step.done) { break; }
        }
        const mainGen = rt.getFunc("global", "main", [])(rt, null);
        if (_config.debug) {
            mydebugger.start(rt, mainGen);
            return mydebugger;
        } else {
            const startTime = Date.now();
            while (true) {
                step = mainGen.next();
                if (step.done) { break; }
                if (_config.maxTimeout && ((Date.now() - startTime) > _config.maxTimeout)) {
                    throw new Error("Time limit exceeded.");
                }
            }
            return step.value.v;
        }
    }
};
