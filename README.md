# JSC++

This is a simple C++ interpreter written in JavaScript.

## Purpose of the Project

As far as I know, every public online C++ excuting environment requires backend servers to compile and run the produced executable. A portable and lightweight interpreter that can be run in browsers can be a fine substitute for those who do not intend to pay for such services.

Currently, it is mainly for educational uses for a MOOC course I am running.

## Prerequisites

* NodeJS

## How to Use

Installation

```
git clone https://github.com/felixhao28/JSCPP.git
```

Use __launcher__

```js
var launcher = require('./launcher');
var code = 'int main(){int a;cin>>a;cout<<a;return 0;}';
var input = '4321';
var exitcode = launcher.run(code, input);
console.info('program exited with code ' + exitcode);
```

See _test.js_ for example.

Or

1. Building AST
```js
var ast = require('./ast');
var tree = ast.parse(code);
console.log('passed syntax check');
```
1. Interprete AST (from global main function)
```js
var CRuntime = require('./rt')
var rt = new CRuntime();
var Interpreter = require('./interpreter');
var interpreter = new Interpreter(rt);
interpreter.run(tree);
var exitCode = rt.getFunc('global', 'main', [])(rt, null, []).v;
console.info('program exited with code ' + exitCode);
```
1. Using standard IO
```js
var inputbuffer = "1 2 3";
var stdio = {
	drain: function() {
		// this method will be called when program requires additional input
		// so you can return "1", "2" and "3" seperately during three calls
		return inputbuffer;
	},
	write: function(s) {
		process.stdout.write(s);
	}
};
require('./includes/iostream').load(rt, stdio);
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

### Which notable features are not implemented yet?

* Goto statements
* Preprocessor directives
* Object-oriented features

### How is the performance?

If you want to run C++ programs effciently, compile your C++ code to [LLVM-bitcode](https://en.wikipedia.org/wiki/LLVM) and then use [Emscripten](https://github.com/kripken/emscripten).

### Which libraries are supported?

See current progress in [_includes_](https://github.com/felixhao28/JSCPP/blob/master/includes) folder.

* iostream (only cin and cout)
* cmath (partial)

### Does this support debugging?

Not yet, but that is of high priority on my todo list.

### Bug report? Feedback?

Post it on [Issues](https://github.com/felixhao28/JSCPP/issues).
