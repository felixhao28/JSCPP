function Preprocessor(rt) {
	this.rt = rt;
	this.ret = '';
	this.macros = {};
	this.macroStack = [];
	this.doinclude = [true];
	var self = this;

	function pushInc(b) {
		self.doinclude.push(self.doinclude[self.doinclude.length - 1] && b);
	};
	this.visitors = {
		TranslationUnit: function(interp, s, code) {
			for (var i = 0; i < s.lines.length; i++) {
				var dec = s.lines[i];
				interp.visit(dec, code);
				interp.ret += dec.space;
			}
			return interp.ret;
		},
		Code: function(interp, s, code) {
			if (interp.doinclude[interp.doinclude.length - 1]) {
				for (var i = 0; i < s.val.length; i++) {
					var x = interp.work(s.val[i]);;
					interp.ret += x;
				}
			}
		},
		PrepSimpleMacro: function(interp, s, code) {
			interp.newMacro(s.Identifier, s.Replacement);
		},
		PrepFunctionMacro: function(interp, s, code) {
			interp.newMacroFunction(s.Identifier, s.Args, s.Replacement);
		},
		PrepIncludeLib: function(interp, s, code) {
			var includes = interp.rt.config.includes;
			if (s.name in includes)
				includes[s.name].load(interp.rt);
			else
				interp.rt.raiseException('cannot find library: ' + s.name);
		},
		PrepIncludeLocal: function(interp, s, code) {
			var includes = interp.rt.config.includes;
			if (s.name in includes)
				includes[s.name].load(interp.rt);
			else
				interp.rt.raiseException('cannot find file: ' + s.name);
		},
		PrepUndef: function(interp, s, code) {
			if (interp.isMacroDefined(s.Identifier)) {
				delete interp.macros[s.Identifier.val];
			}
		},
		PrepIfdef: function(interp, s, code) {
			pushInc(interp.isMacroDefined(s.Identifier));
		},
		PrepIfndef: function(interp, s, code) {
			pushInc(!interp.isMacroDefined(s.Identifier));
		},
		PrepElse: function(interp, s, code) {
			if (interp.doinclude.length > 1) {
				var x = interp.doinclude.pop();
				pushInc(!x);
			} else {
				interp.rt.raiseException('#else must be used after a #if');
			}
		},
		PrepEndif: function(interp, s, code) {
			if (interp.doinclude.length > 1) {
				interp.doinclude.pop();
			} else {
				interp.rt.raiseException('#endif must be used after a #if');
			}
		},
		unknown: function(interp, s, code) {
			interp.rt.raiseException('unhandled syntax ' + s.type);
		},
	};
}

Preprocessor.prototype.visit = function(s, code) {
	if ('type' in s) {
		var _node = this.currentNode;
		this.currentNode = s;
		if (s.type in this.visitors)
			return this.visitors[s.type](this, s, code);
		else
			return this.visitors['unknown'](this, s, code);
		this.currentNode = _node;
	} else {
		this.rt.raiseException('untyped syntax structure: ' + JSON.stringify(s));
	}
};

Preprocessor.prototype.isMacroDefined = function(node) {
	if (node.type === 'Identifier')
		return node.val in this.macros;
	else
		return node.Identifier.val in this.macros;
};

Preprocessor.prototype.isMacro = function(node) {
	return this.isMacroDefined(node) && ('val' in node) && this.macros[node.val].type === 'simple';
};

Preprocessor.prototype.isMacroFunction = function(node) {
	return this.isMacroDefined(node) && ('Identifier' in node) && this.macros[node.Identifier.val].type === 'function';
};

Preprocessor.prototype.newMacro = function(id, replacement) {
	if (this.isMacroDefined(id))
		this.rt.raiseException('macro ' + id.val + ' is already defined');
	this.macros[id.val] = {
		type: 'simple',
		replacement: replacement
	};
};

Preprocessor.prototype.newMacroFunction = function(id, args, replacement) {
	if (this.isMacroDefined(id))
		this.rt.raiseException('macro ' + id.val + ' is already defined');
	this.macros[id.val] = {
		type: 'function',
		args: args,
		replacement: replacement
	};
};

Preprocessor.prototype.work = function(node) {
	if (node.type === 'Seperator')
		return node.val + node.space;
	else {
		if (node in this.macroStack)
			this.rt.raiseException('recursive macro detected');
		this.macroStack.push(node);
		if (node.type === 'Identifier')
			return this.replaceMacro(node) + node.space;
		else if (node.type === 'PrepFunctionMacroCall')
			return this.replaceMacroFunction(node);
		this.macroStack.pop();
	}
};

Preprocessor.prototype.replaceMacro = function(id) {
	if (this.isMacro(id)) {
		var ret = '';
		var rep = this.macros[id.val].replacement;
		for (var i = 0; i < rep.length; i++) {
			var v = this.work(rep[i]);
			ret += v;
		}
		return ret;
	} else {
		return id.val;
	}
};

Preprocessor.prototype.replaceMacroFunction = function(node) {
	if (this.isMacroFunction(node)) {
		var name = node.Identifier.val;
		var argsText = node.Args;
		var rep = this.macros[name].replacement;
		var args = this.macros[name].args;
		if (args.length === argsText.length) {
			var ret = '';
			for (var i = 0; i < rep.length; i++) {
				if (rep[i].type === 'Seperator') {
					var v = this.work(rep[i]);
					ret += v;
				} else {
					var argi = -1;
					for (var j = 0; j < args.length; j++) {
						if (rep[i].type === 'Identifier' && args[j].val === rep[i].val) {
							argi = j;
							break;
						}
					}
					if (argi >= 0) {
						var v = '';
						for (var j = 0; j < argsText[argi].length; j++)
							v += this.work(argsText[argi][j]);
						ret += v + rep[i].space;
					} else {
						var v = this.work(rep[i]);
						ret += v;
					}
				}
			}
			return ret;
		} else {
			this.rt.raiseException('macro ' + name + ' requires ' + args.length + ' arguments (' + argsText.length + ' given)');
		}
	} else {
		var argsText = node.Args;
		var v = [];
		for (var i = 0; i < argsText.length; i++) {
			var x = '';
			for (var j = 0; j < argsText[i].length; j++)
				x += this.work(argsText[i][j]);
			v.push(x);
		}
		return node.Identifier.val + '(' + v.join(',') + ')' + node.space;
	}
};

Preprocessor.prototype.parse = function(prepast, code) {
	var tree = prepast.parse(code);
	this.rt.interp = this;
	return this.visit(tree, code);
};

module.exports = function(rt, prepast, code) {
	return new Preprocessor(rt).parse(prepast, code);
};