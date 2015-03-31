# JSCPP

This is a simple C++ interpreter written in JavaScript.

Try it out [on github.io](https://felixhao28.github.io/JSCPP/)!

## Purpose of the Project

As far as I know, every public online C++ excuting environment requires backend servers to compile and run the produced executable. A portable and lightweight interpreter that can be run in browsers can be a fine substitute for those who do not intend to pay for such services.

Currently, it is mainly for educational uses for a MOOC course I am running (and fun).

## Prerequisites

* NodeJS or
* A modern browser

## How to Use

Installation

```
npm install JSCPP
```

### With NodeJS

Use __launcher__

```js
var launcher = require('./launcher');
var code = 'int main(){int a;cin>>a;cout<<a;return 0;}';
var input = '4321';
var exitcode = launcher.run(code, input);
console.info('program exited with code ' + exitcode);
```

See _example.js_ for example.

Or do it step by step:

Configuring standard IO and libraries
```js
var CRuntime = require('./rt')
var inputbuffer = "1 2 3";
var rt = new CRuntime({
	stdio: {
		drain: function() {
			// this method will be called when program requires additional input
			// so you can return "1", "2" and "3" seperately during three calls
			// returning null value means EOF
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
		cmath: require('./includes/cmath'),
	}
});
```

Using preprocessor (experimental)
```js
var prepast = require('./prepast');
var preprocessor = require('./preprocessor');
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
var ast = require('./ast');
var tree = ast.parse(code);
console.log('passed syntax check');
```

Interpreting AST (from global main function)
```js
var Interpreter = require('./interpreter');
var interpreter = new Interpreter(rt);
interpreter.run(tree);
var exitCode = rt.getFunc('global', 'main', [])(rt, null, []).v;
console.info('program exited with code ' + exitCode);
```

A full example is available in _launcher.js_.

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
mocha
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

### v1.0.0 (2015.3.31)

Formal release of this project.