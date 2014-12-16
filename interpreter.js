function Interpreter(rt) {
	this.rt = rt;
	this.visitors = {
		TranslationUnit: function(interp, s, param) {
			for (var i = 0; i < s.ExternalDeclarations.length; i++) {
				var dec = s.ExternalDeclarations[i];
				interp.visit(interp, dec);
			}
		},
		FunctionDefinition: function(interp, s, param) {
			var scope = param.scope;
			var name = s.Declarator.left.Identifier;
			var basetype = interp.rt.simpleType(s.DeclarationSpecifiers.join(' '));
			var pointer = s.Declarator.Pointer;
			var retType = interp.buildRecursivePointerType(pointer, basetype, 0);
			var argTypes = [];
			var argNames = [];
			if (s.Declarator.right.length != 1) {
				interp.rt.raiseException('you cannot have ' + s.Declarator.right.length + ' parameter lists (1 expected)');
			}
			var ptl;
			var varargs;
			if (s.Declarator.right[0].type === 'DirectDeclarator_modifier_ParameterTypeList') {
				ptl = s.Declarator.right[0].ParameterTypeList;
				varargs = ptl.varargs;
			} else if (s.Declarator.right[0].type === 'DirectDeclarator_modifier_IdentifierList' &&
				s.Declarator.right[0].IdentifierList === null) {
				ptl = {
					ParameterList: []
				};
				varargs = false;
			} else {
				interp.rt.raiseException('unacceptable argument list');
			}
			for (var i = 0; i < ptl.ParameterList.length; i++) {
				var _param = ptl.ParameterList[i];
				var _pointer = _param.Declarator.Pointer;
				var _basetype = interp.rt.simpleType(_param.DeclarationSpecifiers.join(' '));
				var _type = interp.buildRecursivePointerType(_pointer, _basetype, 0);
				var _name = _param.Declarator.left.Identifier;

				if (_param.Declarator.right.length > 0) {
					var dimensions = [];
					for (var j = 0; j < _param.Declarator.right.length; j++) {
						var dim = _param.Declarator.right[j];
						if (dim.type !== 'DirectDeclarator_modifier_array')
							interp.rt.raiseException('unacceptable array initialization');
						if (dim.Expression !== null) {
							dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression, param)).v;
						} else if (j > 0) {
							interp.rt.raiseException('multidimensional array must have bounds for all dimensions except the first');
						} else {}
						dimensions.push(dim);
					}
					_type = interp.arrayType(dimensions, 0, _type);
				}
				argTypes.push(_type);
				argNames.push(_name);
			}
			var stat = s.CompoundStatement;
			interp.rt.defFunc(scope, name, retType, argTypes, argNames, stat, interp);
		},
		Declaration: function(interp, s, param) {
			var basetype = interp.rt.simpleType(s.DeclarationSpecifiers.join(' '));
			for (var i = 0; i < s.InitDeclaratorList.length; i++) {
				var dec = s.InitDeclaratorList[i]
				var pointer = dec.Declarator.Pointer;
				var type = interp.buildRecursivePointerType(pointer, basetype, 0);
				var name = dec.Declarator.left.Identifier;
				var init = dec.Initializers;
				if (dec.Declarator.right.length > 0) {
					var dimensions = [];
					for (var j = 0; j < dec.Declarator.right.length; j++) {
						var dim = dec.Declarator.right[j];
						if (dim.type !== 'DirectDeclarator_modifier_array')
							interp.rt.raiseException('is interp really an array initialization?');
						if (dim.Expression !== null) {
							dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression, param)).v;
						} else if (j > 0) {
							interp.rt.raiseException('multidimensional array must have bounds for all dimensions except the first');
						} else {
							if (init.type === 'Initializer_expr') {
								var initializer = interp.visit(interp, init, param);
								if (interp.rt.isTypeEqualTo(type, interp.rt.charTypeLiteral) &&
									interp.rt.isArrayType(initializer.t) &&
									interp.rt.isTypeEqualTo(initializer.t.eleType, interp.rt.charTypeLiteral)) {
									// string init
									dim = initializer.v.target.length;
									init = {
										type: 'Initializer_array',
										Initializers: initializer.v.target.map(function(e) {
											return {
												type: 'Initializer_expr',
												shorthand: e
											}
										})
									};
								} else {
									interp.rt.raiseException('cannot initialize an array to ' + interp.rt.makeValString(initializer));
								}
							} else {
								dim = init.Initializers.length;
							}
						}
						dimensions.push(dim);
					}
					init = interp.arrayInit(dimensions, init, 0, type, param);
					interp.rt.defVar(name, init.t, init);
				} else {
					if (init === null)
						init = interp.rt.defaultValue(type);
					else
						init = interp.visit(interp, init.Expression);
					interp.rt.defVar(name, type, init);
				}
			}
		},
		Initializer_expr: function(interp, s, param) {
			return interp.visit(interp, s.Expression, param);
		},
		Label_case: function(interp, s, param) {
			var ce = interp.visit(interp, s.ConstantExpression);
			if (param['switch'] === undefined) {
				interp.rt.raiseException('you cannot use case outside switch block');
			}
			if (param.scope === 'SelectionStatement_switch_cs') {
				return ['switch', interp.rt.cast(ce.t, param['switch']).v === ce.v];
			} else {
				interp.rt.raiseException('you can only use case directly in a switch block');
			}
		},
		Label_default: function(interp, s, param) {
			if (param['switch'] === undefined) {
				interp.rt.raiseException('you cannot use default outside switch block');
			}
			if (param.scope === 'SelectionStatement_switch_cs') {
				return ['switch', true];
			} else {
				interp.rt.raiseException('you can only use default directly in a switch block');
			}
		},
		CompoundStatement: function(interp, s, param) {
			var stmts = s.Statements;
			if (param.scope === 'SelectionStatement_switch') {
				var _scope = param.scope;
				param.scope = 'SelectionStatement_switch_cs';
				interp.rt.enterScope(param.scope);
				var switchon = false;
				for (var i = 0; i < stmts.length; i++) {
					var stmt = stmts[i];
					if (stmt.type === 'Label_case' || stmt.type === 'Label_default') {
						var r = interp.visit(interp, stmt, param);
						if (r[1]) switchon = true;
					} else if (switchon) {
						var r = interp.visit(interp, stmt, param);
						if (r instanceof Array) {
							return r;
						}
					}
				}
				interp.rt.exitScope(param.scope);
				param.scope = _scope;
			} else {
				var _scope = param.scope;
				param.scope = 'CompoundStatement';
				interp.rt.enterScope(param.scope);
				for (var i = 0; i < stmts.length; i++) {
					var r = interp.visit(interp, stmts[i], param);
					if (r instanceof Array) {
						return r;
					}
				}
				interp.rt.exitScope(param.scope);
				param.scope = _scope;
			}
		},
		ExpressionStatement: function(interp, s, param) {
			interp.visit(interp, s.Expression, param);
		},
		SelectionStatement_if: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'SelectionStatement_if';
			interp.rt.enterScope(param.scope);
			var e = interp.visit(interp, s.Expression, param);
			var ret;
			if (interp.rt.cast(interp.rt.boolTypeLiteral, e).v) {
				ret = interp.visit(interp, s.Statement, param);
			} else if (s.ElseStatement) {
				ret = interp.visit(interp, s.ElseStatement, param);
			}
			interp.rt.exitScope(param.scope);
			param.scope = scope_bak;
			return ret;
		},
		SelectionStatement_switch: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'SelectionStatement_switch';
			interp.rt.enterScope(param.scope);
			var e = interp.visit(interp, s.Expression, param);
			var switch_bak = param['switch'];
			param['switch'] = e;
			var r = interp.visit(interp, s.Statement, param);
			param['switch'] = switch_bak;
			var ret;
			if (r instanceof Array) {
				if (r[0] !== 'break')
					ret = r;
			}
			interp.rt.exitScope(param.scope);
			param.scope = scope_bak;
			return ret;
		},
		IterationStatement_while: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'IterationStatement_while';
			interp.rt.enterScope(param.scope);
			while (interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v) {
				var r = interp.visit(interp, s.Statement, param);
				if (r instanceof Array) {
					switch (r[0]) {
						case 'continue':
							break;
						case 'break':
							return;
							break;
						case 'return':
							return r;
							break;
					}
				}
			}
			interp.rt.exitScope(param.scope);
			param.scope = scope_bak;
		},
		IterationStatement_do: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'IterationStatement_do';
			interp.rt.enterScope(param.scope);
			do {
				var r = parse(s.Statement);
				if (r instanceof Array) {
					switch (r[0]) {
						case 'continue':
							break;
						case 'break':
							return;
							break;
						case 'return':
							return r;
							break;
					}
				}
			} while (interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v);
			interp.rt.exitScope(param.scope);
			param.scope = scope_bak;
		},
		IterationStatement_for: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'IterationStatement_for';
			interp.rt.enterScope(param.scope);
			if (s.Initializer) {
				if (s.Initializer.type === 'Declaration')
					interp.visit(interp, s.Initializer, param);
				else
					interp.visit(interp, s.Initializer, param);
			}
			while (s.Expression === undefined || interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v) {
				var r = interp.visit(interp, s.Statement, param);
				if (r instanceof Array) {
					switch (r[0]) {
						case 'continue':
							break;
						case 'break':
							return;
							break;
						case 'return':
							return r;
							break;
					}
				}
				if (s.Loop)
					interp.visit(interp, s.Loop, param);
			}
			interp.rt.exitScope(param.scope);
			param.scope = scope_bak;
		},
		JumpStatement_goto: function(interp, s, param) {
			interp.rt.raiseException('not implemented');
		},
		JumpStatement_continue: function(interp, s, param) {
			return ['continue'];
		},
		JumpStatement_break: function(interp, s, param) {
			return ['break'];
		},
		JumpStatement_return: function(interp, s, param) {
			if (s.Expression) {
				var ret = interp.visit(interp, s.Expression, param);
				return ['return', ret];
			}
			return ['return'];
		},
		IdentifierExpression: function(interp, s, param) {
			return interp.rt.readVar(s.Identifier);
		},
		ParenthesesExpression: function(interp, s, param) {
			return interp.visit(interp, s.Expression, param);
		},
		PostfixExpression_ArrayAccess: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			var index = interp.visit(interp, s.index, param);
			return interp.rt.getFunc(ret.t, '[]', [index.t])(interp.rt, ret, index);
		},
		PostfixExpression_MethodInvocation: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			s.args = s.args.map(function(e) {
				return interp.visit(interp, e, param);
			});
			return interp.rt.getFunc(ret.t, '()', s.args.map(function(e) {
				return e.t;
			}))(interp.rt, ret, s.args);
		},
		PostfixExpression_MemberAccess: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			interp.rt.raiseException('not implemented');
		},
		PostfixExpression_MemberPointerAccess: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			interp.rt.raiseException('not implemented');
		},
		PostfixExpression_PostIncrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			return interp.rt.getFunc(ret.t, '++', ['dummy'])(interp.rt, ret, {
				t: 'dummy',
				v: null
			});
		},
		PostfixExpression_PostDecrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			return interp.rt.getFunc(ret.t, '--', ['dummy'])(interp.rt, ret, {
				t: 'dummy',
				v: null
			});
		},
		UnaryExpression_PreIncrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			return interp.rt.getFunc(ret.t, '++', [])(interp.rt, ret);
		},
		UnaryExpression_PreDecrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			return interp.rt.getFunc(ret.t, '--', [])(interp.rt, ret);
		},
		UnaryExpression: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			return interp.rt.getFunc(ret.t, s.op, [])(interp.rt, ret);
		},
		UnaryExpression_Sizeof_Expr: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			interp.rt.raiseException('not implemented');
			return 1;
		},
		UnaryExpression_Sizeof_Type: function(interp, s, param) {
			var type = s.TypeName;
			interp.rt.raiseException('not implemented');
			return 1;
		},
		CastExpression: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression, param);
			var type = interp.rt.simpleType(s.TypeName);
			return interp.rt.cast(type, ret);
		},
		BinOpExpression: function(interp, s, param) {
			var op = s.op;
			if (op === '&&') {
				s.type = 'LogicalANDExpression';
				return interp.visit(interp, s, param);
			} else if (op === '||') {
				s.type = 'LogicalORExpression';
				return interp.visit(interp, s, param);
			} else {
				var left = interp.visit(interp, s.left, param);
				var right = interp.visit(interp, s.right, param);
				return interp.rt.getFunc(left.t, op, [right.t])(interp.rt, left, right);
			}
		},
		LogicalANDExpression: function(interp, s, param) {
			var left = interp.visit(interp, s.left, param);
			var lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)];
			if ('&&' in lt) {
				var right = interp.visit(interp, s.right, param);
				return interp.rt.getFunc(left.t, '&&', [right.t])(interp.rt, left, right);
			} else {
				if (interp.rt.cast(interp.rt.boolTypeLiteral, left).v)
					return interp.visit(interp, s.right, param);
				else
					return left;
			}
		},
		LogicalORExpression: function(interp, s, param) {
			var left = interp.visit(interp, s.left, param);
			var lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)];
			if ('||' in lt) {
				var right = interp.visit(interp, s.right, param);
				return interp.rt.getFunc(left.t, '||', [right.t])(interp.rt, left, right);
			} else {
				if (interp.rt.cast(interp.rt.boolTypeLiteral, left).v)
					return left;
				else
					return interp.visit(interp, s.right, param);
			}
		},
		ConditionalExpression: function(interp, s, param) {
			var cond = interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.cond, param)).v;
			return cond ? interp.visit(interp, s.t, param) : interp.visit(interp, s.f, param);
		},
		ConstantExpression: function(interp, s, param) {
			return interp.visit(interp, s.Expression, param);
		},
		StringLiteralExpression: function(interp, s, param) {
			var str = s.value;
			return interp.rt.val(interp.rt.arrayPointerType(interp.rt.charTypeLiteral, str.length + 1), {
				target: str.split('').map(function(c) {
					return interp.rt.val(interp.rt.charTypeLiteral, c.charCodeAt(0))
				}).concat([interp.rt.val(interp.rt.charTypeLiteral, 0)]),
				position: 0
			});
		},
		CharacterConstant: function(interp, s, param) {
			var a = s.Char;
			if (a.length != 1)
				interp.rt.raiseException('a character constant must have and only have one character.');
			return interp.rt.val(interp.rt.charTypeLiteral, a[0].charCodeAt(0));
		},
		FloatConstant: function(interp, s, param) {
			var val = interp.visit(interp, s.Expression, param);
			return interp.rt.val(interp.rt.floatTypeLiteral, val.v);
		},
		DecimalConstant: function(interp, s, param) {
			return interp.rt.val(interp.rt.intTypeLiteral, parseInt(s.value, 10));
		},
		HexConstant: function(interp, s, param) {
			return interp.rt.val(interp.rt.intTypeLiteral, parseInt(s.value, 16));
		},
		DecimalFloatConstant: function(interp, s, param) {
			return interp.rt.val(interp.rt.doubleTypeLiteral, parseFloat(s.value));
		},
		HexFloatConstant: function(interp, s, param) {
			return interp.rt.val(interp.rt.doubleTypeLiteral, parseFloat(s.value, 16));
		},
		OctalConstant: function(interp, s, param) {
			return interp.rt.val(interp.rt.intTypeLiteral, parseInt(s.value, 8));
		},
		unknown: function(interp, s, param) {
			interp.rt.raiseException('unhandled syntax ' + s.type);
		},
	};
};

Interpreter.prototype.visit = function(interp, s, param) {
	if ('type' in s) {
		if (param === undefined) {
			param = {
				scope: 'global'
			};
		}
		var _node = this.currentNode;
		this.currentNode = s;
		if (s.type in this.visitors)
			return this.visitors[s.type](interp, s, param);
		else
			return this.visitors['unknown'](interp, s, param);
		this.currentNode = _node;
	} else {
		this.rt.raiseException('untyped syntax structure');
	}
};

Interpreter.prototype.run = function(tree) {
	this.rt.interp = this;
	return this.visit(this, tree);
}

Interpreter.prototype.arrayInit = function(dimensions, init, level, type, param) {
	if (dimensions.length > level) {
		var curDim = dimensions[level];
		if (init) {
			if (init.type === 'Initializer_array' && curDim >= init.Initializers.length &&
				(init.Initializers.length == 0 || init.Initializers[0].type === 'Initializer_expr')) {
				// last level, short hand init
				if (init.Initializers.length == 0) {
					var arr = new Array(curDim);
					for (var i = 0; i < curDim; i++) {
						arr[i] = {
							shorthand: this.rt.defaultValue(type)
						};
					}
					init.Initializers = arr;
				} else if (init.Initializers.length == 1 && this.rt.isIntegerType(type)) {
					var val = this.rt.cast(type, this.visit(this, init.Initializers[0].Expression, param));
					if (val.v === -1 || val.v === 0) {
						var arr = new Array(curDim);
						for (var i = 0; i < curDim; i++) {
							arr[i] = {
								shorthand: this.rt.val(type, -1)
							};
						}
						init.Initializers = arr;
					} else {
						var arr = new Array(curDim);
						arr[0] = this.rt.val(type, -1);
						for (var i = 1; i < curDim; i++) {
							arr[i] = {
								shorthand: this.rt.defaultValue(type)
							};
						}
						init.Initializers = arr;
					}
				} else {
					var arr = new Array(curDim);
					for (var i = 0; i < init.Initializers.length; i++) {
						var _init = init.Initializers[i];
						var initval;
						if ('shorthand' in _init) {
							initval = _init;
						} else {
							initval = {
								type: 'Initializer_expr',
								shorthand: this.visit(this, _init.Expression, param)
							};
						}
						arr[i] = initval;
					}
					for (var i = init.Initializers.length; i < curDim; i++) {
						arr[i] = {
							type: 'Initializer_expr',
							shorthand: this.rt.defaultValue(type)
						};
					}
					init.Initializers = arr;
				}
			} else if (init.type === 'Initializer_expr') {
				var initializer;
				if ('shorthand' in init)
					initializer = init.shorthand;
				else
					initializer = this.visit(this, init, param);
				if (this.rt.isTypeEqualTo(type, this.rt.charTypeLiteral) &&
					this.rt.isArrayType(initializer.t) &&
					this.rt.isTypeEqualTo(initializer.t.eleType, this.rt.charTypeLiteral)) {
					// string init
					init = {
						type: 'Initializer_array',
						Initializers: initializer.v.target.map(function(e) {
							return {
								type: 'Initializer_expr',
								shorthand: e
							}
						})
					};
				} else {
					this.rt.raiseException('cannot initialize an array to ' + this.rt.makeValString(initializer));
				}
			} else {
				this.rt.raiseException('dimensions do not agree, ' + curDim + ' != ' + init.Initializers.length);
			}
		}
		var arr = [];
		var ret = this.rt.val(
			this.arrayType(dimensions, level, type),
			this.rt.makeArrayPointerValue(arr, 0),
			true
		);
		for (var i = 0; i < curDim; i++) {
			if (init && i < init.Initializers.length)
				arr[i] = this.arrayInit(dimensions, init.Initializers[i], level + 1, type, param);
			else
				arr[i] = this.arrayInit(dimensions, null, level + 1, type, param);
		}
		return ret;
	} else {
		if (init && init.type !== 'Initializer_expr')
			this.rt.raiseException('dimensions do not agree, too few initializers');
		var initval;
		if (init) {
			if ('shorthand' in init) {
				initval = init.shorthand;
			} else {
				initval = this.visit(this, init.Expression, param);
			}
		} else {
			initval = this.rt.defaultValue(type);
		}
		var ret = this.rt.cast(type, initval);
		ret.left = true;
		return ret;
	}
};

Interpreter.prototype.arrayType = function(dimensions, level, type) {
	if (dimensions.length > level) {
		return this.rt.arrayPointerType(this.arrayType(dimensions, level + 1, type), dimensions[level]);
	} else {
		return type;
	}
};

Interpreter.prototype.buildRecursivePointerType = function(pointer, basetype, level) {
	if (pointer && pointer.length > level) {
		var type = this.rt.normalPointerType(basetype);
		return this.buildRecursivePointerType(pointer, type, level + 1);
	} else {
		return basetype;
	}
}


module.exports = Interpreter;