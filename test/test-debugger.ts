/* eslint-disable no-unused-expressions */
import JSCPP from "../src/launcher";
import { expect } from "chai";
import { IntVariable } from "../src/rt";

function isNotNumber<T>(mydebugger: T | number): mydebugger is T {
    expect(mydebugger).not.equals("number");
    return true;
}

describe("Test debugger", () => {
    it("Should debug line by line", () => {
        const code = `#include <iostream>
        using namespace std;
        int main() {
            int a;
            cin >> a;
            a *= 10;
            return 0;
        }`;
        const mydebugger = JSCPP.run(code, "5", { debug: true });

        if (isNotNumber(mydebugger)) {
            mydebugger.setStopConditions({
                isStatement: false,
                positionChanged: false,
                lineChanged: true
            });
            let done = mydebugger.continue();
            expect(done).false;
            expect(mydebugger.nextLine().trim()).equals("cin >> a;");
            expect(mydebugger.variable("a")).deep.equals({
                type: "int",
                value: NaN,
            });

            done = mydebugger.continue();
            expect(done).false;
            expect(mydebugger.nextLine().trim()).equals("a *= 10;");
            expect(mydebugger.variable("a")).deep.equals({
                type: "int",
                value: 5,
            });

            done = mydebugger.continue();
            expect(done).false;
            expect(mydebugger.nextLine().trim()).equals("return 0;");
            expect(mydebugger.variable("a")).deep.equals({
                type: "int",
                value: 50,
            });

            done = mydebugger.continue();
            expect((done as IntVariable).v).equals(0);
        }
    });
});
