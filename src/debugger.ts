/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { CRuntime, IntVariable } from "./rt";

interface AstNode {
    type: string;
    eLine: number;
    eColumn: number;
    eOffset: number;
    sLine: number;
    sColumn: number;
    sOffset: number;
}

type PromiseOrNot<T> = PromiseLike<T> | T;

type BreakpointConditionPredicate = (prevNode: AstNode, newStmt: AstNode) => PromiseOrNot<boolean>;

export default class Debugger {
    src: string;
    srcByLines: string[];
    prevNode: AstNode;
    done: boolean;
    conditions: {
        [condition: string]: BreakpointConditionPredicate;
    };
    stopConditions: {
        [condition: string]: boolean;
    };
    rt: CRuntime;
    gen: Generator<any, IntVariable | false, any>;
    constructor(src?: string, oldSrc?: string) {
        this.src = src || "";
        this.srcByLines = (oldSrc || src || "").split("\n");
        this.prevNode = null;
        this.done = false;
        this.conditions = {
            isStatement(prevNode: AstNode, newStmt: AstNode) {
                return (newStmt != null ? newStmt.type.indexOf("Statement") >= 0 : undefined);
            },
            positionChanged(prevNode: AstNode, newStmt: AstNode) {
                return ((prevNode != null ? prevNode.eOffset : undefined) !== newStmt.eOffset) || ((prevNode != null ? prevNode.sOffset : undefined) !== newStmt.sOffset);
            },
            lineChanged(prevNode: AstNode, newStmt: AstNode) {
                return (prevNode != null ? prevNode.sLine : undefined) !== newStmt.sLine;
            }
        };

        this.stopConditions = {
            isStatement: false,
            positionChanged: false,
            lineChanged: true
        };
    }

    setStopConditions(stopConditions: {
        [condition: string]: boolean;
    }) {
        this.stopConditions = stopConditions;
    }

    setCondition(name: string, callback: BreakpointConditionPredicate) {
        this.conditions[name] = callback;
    }

    disableCondition(name: string) {
        this.stopConditions[name] = false;
    }
    enableCondition(name: string) {
        this.stopConditions[name] = true;
    }

    getSource() {
        return this.src;
    }

    start(rt: CRuntime, gen: Generator<any, IntVariable | false, any>) {
        this.rt = rt;
        return this.gen = gen;
    }

    continue() {
        while (true) {
            const done = this.next();
            if (done !== false) { return done; }
            const curStmt = this.nextNode();
            for (const name of Object.keys(this.stopConditions)) {
                const active = this.stopConditions[name];
                if (active) {
                    if (this.conditions[name](this.prevNode, curStmt)) {
                        return false;
                    }
                }
            }
        }
    }

    next() {
        this.prevNode = this.nextNode();
        const ngen = this.gen.next();
        if (ngen.done) {
            this.done = true;
            return ngen.value;
        } else {
            return false;
        }
    }

    nextLine() {
        const s = this.nextNode();
        return s ? this.srcByLines[s.sLine - 1] : this.srcByLines[0];
    }

    nextNodeText() {
        const s = this.nextNode();
        return s ? this.src.slice(s.sOffset, s.eOffset).trim() : "";
    }

    nextNode(): AstNode {
        if (this.done) {
            return {
                type: null,
                sOffset: -1,
                sLine: -1,
                sColumn: -1,
                eOffset: -1,
                eLine: -1,
                eColumn: -1
            };
        } else {
            return this.rt.interp.currentNode;
        }
    }

    variable(name?: string) {
        if (name) {
            const v = this.rt.readVar(name);
            return {
                type: this.rt.makeTypeString(v.t),
                value: v.v
            };
        } else {
            const usedName = new Set();
            const ret = [];
            for (let scopeIndex = this.rt.scope.length - 1; scopeIndex >= 0; scopeIndex--) {
                for (name of Object.keys(this.rt.scope[scopeIndex].variables)) {
                    const val = this.rt.scope[scopeIndex].variables[name];
                    if ((typeof val === "object") && "t" in val && "v" in val) {
                        if (!usedName.has(name)) {
                            usedName.add(name);
                            ret.push({
                                name,
                                type: this.rt.makeTypeString(val.t),
                                value: this.rt.makeValueString(val)
                            });
                        }
                    }
                }
            }
            return ret;
        }
    }
}
