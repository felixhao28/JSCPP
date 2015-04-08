# JSCPP

This is a simple C++ interpreter written in JavaScript.

Try it out [on github.io](https://felixhao28.github.io/JSCPP/)!

## Purpose of the project

As far as I know, every public online C++ excuting environment requires backend servers to compile and run the produced executable. A portable and lightweight interpreter that can be run in browsers can be a fine substitute for those who do not intend to pay for such services.

I also want to make a strict interpreter. The reason being C++ has too many undefined and platform-dependent behaviors and popular C++ compilers tend to be an "over-caring mother" who tries to ignore or even justify the undocumented usages. The abuse of them should be avoided as much as possible IMO. For example, I do not want my students to take it as guaranteed that `sizeof int` produces `4`, because on Arduino Uno, an `int` is a 2-byte value.

Currently, it is mainly for educational uses for a MOOC course I am running (and fun).

## Prerequisites

* NodeJS or
* A modern browser

## How to use

Installation

```
npm install JSCPP
```

or (to use lastest cutting-edge version or to contribute)

```
git clone https://github.com/felixhao28/JSCPP.git
cd JSCPP
npm install .
```

### With NodeJS

Use __launcher.run__

```js
var JSCPP = require('JSCPP');
var launcher = JSCPP.launcher;
var code =    "#include <iostream>"    + "\n"
            + "using namespace std;"   + "\n"
            + "int main() {"           + "\n"
            + "    int a;"             + "\n"
            + "    cin >> a;"          + "\n"
            + "    cout << a << endl;" + "\n"
            + "    return 0;"          + "\n"
            + "}"                      + "\n"
;
var input = '4321';
var exitcode = launcher.run(code, input);
console.info('program exited with code ' + exitcode);
```

See _demo/example.coffee_ for example.

Or do it step by step:

Configuring standard IO and libraries
```js
var JSCPP = require('JSCPP');
var Runtime = JSCPP.Runtime;
var inputbuffer = "1 2 3";
var rt = new Runtime({
	stdio: {
		drain: function() {
			// This method will be called when program requires additional input
			// so you can return "1", "2" and "3" seperately during three calls.
			// Returning null value means EOF.
			var x = inputbuffer;
			inputbuffer = null;
			return x;
		},
		write: function(s) {
			process.stdout.write(s);
		}
	},
	includes: {
		iostream: require('./includes/iostream'),
		cmath: require('./includes/cmath')
		// Of course you can add more libraries here.
		// These libraries are only made available for "include" to happen
		// and NOT ready to be used in your cpp code.
		// You should use proper include directive to include them
		// or call load method on them directly (shown below).
	}
});
```

Using preprocessor (experimental)
```js
var preprocessor = JSCPP.preprocessor;
console.log('preprocessing starting');
code = preprocessor(rt, prepast, code);
console.log('preprocessing finished');
```

(Optional) If you choose not to use preprocessor, directives like `#include <...>` will not work, you need to load libraries manually
```js
rt.config.includes.iostream.load(rt);
rt.config.includes.cmath.load(rt);
```

Building AST
```js
var ast = JSCPP.ast;
var tree = ast.parse(code);
console.log('passed syntax check');
```

Interpreting AST (from global main function)
```js
var Interpreter = JSCPP.Interpreter;
var interpreter = new Interpreter(rt);
interpreter.run(tree);
var exitCode = rt.getFunc('global', 'main', [])(rt, null, []).v;
console.info('program exited with code ' + exitCode);
```

A full example is available in *demo/verbose_example.coffee*.

Use __debugger__

Unlike most other IDE, the debugging here is actually a replay of the execution.

```js
var mydebugger = new JSCPP.Debugger();
var exitCode = JSCPP.launcher.run(code, input, {debug: true, debugger: mydebugger});
// continue to the next statement
var hasNext = mydebugger.next();
if (!hasNext) {
	console.log("program exited with code " + exitCode);
}
// go back to the previous statement
var hasPrev = mydebugger.prev();
// examine the content of the output window
var outputContent = mydebugger.output();
// the content of the statement to be executed next
var nextLine = mydebugger.nextLine();
// the statement AST to be executed next
var s = mydebugger.nextStmt();
console.log("from " + s.line + ":" + s.column + "(" + s.pos + ")");
console.log("to " + s.reportedLine + ":" + s.reportedColumn + "(" + s.reportedPos + ")");
console.log("==> " + nextLine);
// examine the internal registry for a type
mydebugger.type("int");
// examine the value of variable "a"
mydebugger.variable("a");
// or list all local variables
mydebugger.variable();
```

A full interactive example is available in *demo/example.coffee*. Use `node demo/example A+B -debug` to debug "A+B" test.

### With a modern browser

There should be a newest version of _JSCPP.js_ in _dist_ ready for you. If not, use `browserify ./lib/main.js -o ./dist/JSCPP.js` to generate one.

Then you can add it to your html. The exported global name for this package is "JSCPP".

```html
<script src="JSCPP.js"></script>
<script type="text/javascript">
	function run(code, input){
		var config = {
			stdio: {
				write: function(s) {
					output.value += s;
				}
			}
		}
		return JSCPP.launcher.run(code, input, config);
	}
</script>
```

You can also customize the procedures with **custome includes**, **`JSCPP.runtime`**, **`JSCPP.preprocessor`**, **`JSCPP.ast`**, **`JSCPP.interpreter`**. If you do not provide a customized `write` method for `stdio` configuration, console output will not be correctly shown. See _index.html_ in **gh_pages** branch for an example.

### Run tests

```
grunt test
```

## Q&A

### Which features are implemented?

* (Most) operators
* Primitive types
* Variables
* Arrays
    - ~~Multidimensional array with initializers.~~
* Pointers
* If...else control flow
* Switch...case control flow
    - ~~Declarations inside switch block.~~
* For loop
* While loop
* Do...while loop
* Functions
* Variable scopes
* Preprocessor directives
	- Macro
	- Include

### Which notable features are not implemented yet?

* Goto statements
* Object-oriented features
* Namespaces
* Multiple files support

### How is the performance?

If you want to run C++ programs effciently, compile your C++ code to [LLVM-bitcode](https://en.wikipedia.org/wiki/LLVM) and then use [Emscripten](https://github.com/kripken/emscripten).

### Which libraries are supported?

See current progress in [_includes_](https://github.com/felixhao28/JSCPP/blob/master/includes) folder.

* iostream (only cin and cout and endl)
* cmath
* cctype
* cstring
* cstdio (partial)
* cstdlib (partial)

### Does this support debugging?

Not yet, but that is of high priority on my todo list.

### Bug report? Feedback?

Post it on [Issues](https://github.com/felixhao28/JSCPP/issues).

## Changelog

* v1.0.0 (2015.3.31)
	- Formal release of this project.
* v1.0.1 (3.31)
	- This release is a mistake.
* v1.0.2 (3.31)
	- New examples.
	- Update README.
	- Renamed runtime and interpreter to start with upper case.
	- (dev-side) Grunt.
* v1.0.3 (4.1)
	- (dev-side) Fix dev-dependency on coffee-script.
	- (dev-side) Grunt watches.
	- (dev-side) Port to coffeescript
	- (dev-side) Refactoring
	- (dev-side) Reworked testing, now all tests are defined in `test.json`
	- Fixed a bug related to a.push(b).concat(c) in syntax parser (#1).
	- Added new tests
* v1.1.0 (4.2)
	- Fixed array initialization with 0 issue
	- Added support for reading string with cin
	- Member function should not be registered globally
	- Added new tests
	- Basic debugging support
* v1.1.1 (4.3)
	- Split debugger from example
	- (dev-side) Grunt only watches newer
	- Fix debug prev command