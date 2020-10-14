const prepast = require("./prepast");
// @ts-ignore
import * as PEGUtil from "pegjs-util";
import { BaseInterpreter } from "./interpreter";
import { CRuntime } from "./rt";

interface Macro {
    type: "function" | "simple";
    args?: any[];
    replacement: any;
};

class Preprocessor extends BaseInterpreter {
    ret: string;
    macros: { [name: string]: Macro };
    doinclude: boolean[];
    macroStack: any[];
    visitors: { [name: string]: (interp: Preprocessor, s: any, param?: any) => any };

    constructor(rt: CRuntime) {
        super(rt);
        const pushInc = function (b: boolean) {
            this.doinclude.push(this.doinclude[this.doinclude.length - 1] && b);
        };

        this.rt = rt;
        this.ret = "";
        this.macros = {};
        this.macroStack = [];
        this.doinclude = [true];
        this.visitors = {
            TranslationUnit(interp, s, code) {
                let i = 0;
                while (i < s.lines.length) {
                    const dec = s.lines[i];
                    interp.visit(dec, code);
                    interp.ret += dec.space;
                    i++;
                }
                return interp.ret;
            },
            Code(interp, s, code) {
                if (interp.doinclude[interp.doinclude.length - 1]) {
                    let i = 0;
                    while (i < s.val.length) {
                        const x = interp.work(s.val[i]);
                        interp.ret += x;
                        i++;
                    }
                }
            },
            PrepSimpleMacro(interp, s, code) {
                interp.newMacro(s.Identifier, s.Replacement);
            },
            PrepFunctionMacro(interp, s, code) {
                interp.newMacroFunction(s.Identifier, s.Args, s.Replacement);
            },
            PrepIncludeLib(interp, s, code) {
                interp.rt.include(s.name);
            },
            PrepIncludeLocal(interp, s, code) {
                const {
                    includes
                } = interp.rt.config;
                if (s.name in includes) {
                    includes[s.name].load(interp.rt);
                } else {
                    interp.rt.raiseException("cannot find file: " + s.name);
                }
            },
            PrepUndef(interp, s, code) {
                if (interp.isMacroDefined(s.Identifier)) {
                    delete interp.macros[s.Identifier.val];
                }
            },
            PrepIfdef(interp, s, code) {
                pushInc(interp.isMacroDefined(s.Identifier));
            },
            PrepIfndef(interp, s, code) {
                pushInc(!interp.isMacroDefined(s.Identifier));
            },
            PrepElse(interp, s, code) {
                if (interp.doinclude.length > 1) {
                    const x = interp.doinclude.pop();
                    pushInc(!x);
                } else {
                    interp.rt.raiseException("#else must be used after a #if");
                }
            },
            PrepEndif(interp, s, code) {
                if (interp.doinclude.length > 1) {
                    interp.doinclude.pop();
                } else {
                    interp.rt.raiseException("#endif must be used after a #if");
                }
            },
            unknown(interp, s, code) {
                interp.rt.raiseException("unhandled syntax " + s.type);
            }
        };
    }
    visit(s: any, code: string) {
        if ("type" in s) {
            const _node = this.currentNode;
            this.currentNode = s;
            if (s.type in this.visitors) {
                return this.visitors[s.type](this, s, code);
            } else {
                return this.visitors["unknown"](this, s, code);
            }
            this.currentNode = _node;
        } else {
            this.currentNode = s;
            this.rt.raiseException("untyped syntax structure: " + JSON.stringify(s));
        }
    };

    isMacroDefined(node: any) {
        if (node.type === "Identifier") {
            return node.val in this.macros;
        } else {
            return node.Identifier.val in this.macros;
        }
    };

    isMacro(node: any) {
        return this.isMacroDefined(node) && "val" in node && (this.macros[node.val].type === "simple");
    };

    isMacroFunction(node: any) {
        return this.isMacroDefined(node) && "Identifier" in node && (this.macros[node.Identifier.val].type === "function");
    };

    newMacro(id: any, replacement: any) {
        if (this.isMacroDefined(id)) {
            this.rt.raiseException("macro " + id.val + " is already defined");
        }
        this.macros[id.val] = {
            type: "simple",
            replacement
        };
    };

    newMacroFunction(id: any, args: any[], replacement: any) {
        if (this.isMacroDefined(id)) {
            this.rt.raiseException("macro " + id.val + " is already defined");
        }
        this.macros[id.val] = {
            type: "function",
            args,
            replacement
        };
    };

    work(node: any) {
        if (node.type === "Seperator") {
            return node.val + node.space;
        } else {
            if (node in this.macroStack) {
                this.rt.raiseException("recursive macro detected");
            }
            this.macroStack.push(node);
            if (node.type === "Identifier") {
                return this.replaceMacro(node) + node.space;
            } else if (node.type === "PrepFunctionMacroCall") {
                return this.replaceMacroFunction(node);
            }
            this.macroStack.pop();
        }
    };

    replaceMacro(id: any) {
        if (this.isMacro(id)) {
            let ret = "";
            const rep = this.macros[id.val].replacement;
            let i = 0;
            while (i < rep.length) {
                const v = this.work(rep[i]);
                ret += v;
                i++;
            }
            return ret;
        } else {
            return id.val;
        }
    };

    replaceMacroFunction(node: any) {
        if (this.isMacroFunction(node)) {
            const name = node.Identifier.val;
            const argsText = node.Args;
            const rep = this.macros[name].replacement;
            const {
                args
            } = this.macros[name];
            if (args.length === argsText.length) {
                let ret = "";
                let i = 0;
                while (i < rep.length) {
                    if (rep[i].type === "Seperator") {
                        const v = this.work(rep[i]);
                        ret += v;
                    } else {
                        let argi = -1;
                        let j = 0;
                        while (j < args.length) {
                            if ((rep[i].type === "Identifier") && (args[j].val === rep[i].val)) {
                                argi = j;
                                break;
                            }
                            j++;
                        }
                        if (argi >= 0) {
                            let v = "";
                            j = 0;
                            while (j < argsText[argi].length) {
                                v += this.work(argsText[argi][j]);
                                j++;
                            }
                            ret += v + rep[i].space;
                        } else {
                            const v = this.work(rep[i]);
                            ret += v;
                        }
                    }
                    i++;
                }
                return ret;
            } else {
                this.rt.raiseException("macro " + name + " requires " + args.length + " arguments (" + argsText.length + " given)");
            }
        } else {
            const argsText = node.Args;
            const v = [];
            let i = 0;
            while (i < argsText.length) {
                let x = "";
                let j = 0;
                while (j < argsText[i].length) {
                    x += this.work(argsText[i][j]);
                    j++;
                }
                v.push(x);
                i++;
            }
            return node.Identifier.val + "(" + v.join(",") + ")" + node.space;
        }
    };

    parse(code: string) {
        const result = PEGUtil.parse(prepast, code);
        if (result.error != null) {
            throw new Error("ERROR: Preprocessing Failure:\n" + PEGUtil.errorMessage(result.error, true));
        }
        this.rt.interp = this;
        return this.visit(result.ast, code);
    };
}


export function parse(rt: CRuntime, code: string) {
    return new Preprocessor(rt).parse(code);
}