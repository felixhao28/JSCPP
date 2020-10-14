/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { CRuntime } from "./rt";

interface AstNode {
    type: string;
    eLine: number;
    eColumn: number;
    eOffset: number;
    sLine: number;
    sColumn: number;
    sOffset: number;
}

type BreakpointConditionPredicate = (prevNode: AstNode, newStmt: AstNode) => boolean;

export default class Debugger {
    src: string;
    prevNode: AstNode;
    done: boolean;
    conditions: {
        [condition: string]: BreakpointConditionPredicate;
    };
    stopConditions: {
        [condition: string]: boolean;
    };
    rt: CRuntime;
    gen: Generator<any, number | false, any>;
    constructor() {
        this.src = "";
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

    start(rt: CRuntime, gen: Generator<any, number | false, any>) {
        this.rt = rt;
        return this.gen = gen;
    };

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
    };

    next() {
        this.prevNode = this.nextNode();
        const ngen = this.gen.next();
        if (ngen.done) {
            this.done = true;
            return ngen.value;
        } else {
            return false;
        }
    };

    nextLine() {
        const s = this.nextNode();
        return this.src.slice(s.sOffset, s.eOffset).trim();
    };

    nextNode() {
        if (this.done) {
            return {
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
    };

    variable(name: string) {
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
                for (name of Object.keys(this.rt.scope[scopeIndex])) {
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
    };
}
