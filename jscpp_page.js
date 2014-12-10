var module = {};
function CRuntime() {
	this.config = {
		limits: {
			'char': {
				max: 0x7f,
				min: 0x00,
				bytes: 1
			},
			'signed char': {
				max: 0x7f,
				min: -0x80,
				bytes: 1
			},
			'unsigned char': {
				max: 0xff,
				min: 0x00,
				bytes: 1
			},
			'short': {
				max: 0x7fff,
				min: -0x8000,
				bytes: 2
			},
			'unsigned short': {
				max: 0xffff,
				min: 0x0000,
				bytes: 2
			},
			'int': {
				max: 0x7fffffff,
				min: -0x80000000,
				bytes: 4
			},
			'unsigned': {
				max: 0xffffffff,
				min: 0x00000000,
				bytes: 4
			},
			'long': {
				max: 0x7fffffff,
				min: -0x80000000,
				bytes: 4
			},
			'unsigned long': {
				max: 0xffffffff,
				min: 0x00000000,
				bytes: 4
			},
			'long long': {
				max: 0x7fffffffffffffff,
				min: -0x8000000000000000,
				bytes: 8
			},
			'unsigned long long': {
				max: 0xffffffffffffffff,
				min: 0x0000000000000000,
				bytes: 8
			},
			'float': {
				max: 3.40282346638529e+038,
				min: -3.40282346638529e+038,
				bytes: 4
			},
			'double': {
				max: 1.79769313486232e+308,
				min: -1.79769313486232e+308,
				bytes: 8
			}
		}
	};
	this.config.limits['short int'] = this.config.limits['short'];
	this.config.limits['signed short'] = this.config.limits['short'];
	this.config.limits['signed short int'] = this.config.limits['short'];
	this.config.limits['unsigned short int'] = this.config.limits['unsigned short'];
	this.config.limits['signed int'] = this.config.limits['int'];
	this.config.limits['unsigned int'] = this.config.limits['unsigned'];
	this.config.limits['long int'] = this.config.limits['long'];
	this.config.limits['long int'] = this.config.limits['long'];
	this.config.limits['signed long'] = this.config.limits['long'];
	this.config.limits['signed long int'] = this.config.limits['long'];
	this.config.limits['unsigned long int'] = this.config.limits['unsigned long'];
	this.config.limits['long long int'] = this.config.limits['long long'];
	this.config.limits['long long int'] = this.config.limits['long long'];
	this.config.limits['signed long long'] = this.config.limits['long long'];
	this.config.limits['signed long long int'] = this.config.limits['long long'];
	this.config.limits['unsigned long long int'] = this.config.limits['unsigned long long'];
	this.m = null;
	this.numericTypeOrder = ['char', 'signed char', 'short', 'short int',
		'signed short', 'signed short int', 'int', 'signed int',
		'long', 'long int', 'long int', 'signed long', 'signed long int',
		'long long', 'long long int', 'long long int', 'signed long long',
		'signed long long int', 'float', 'double'
	];

	defaultOpHandler = {
		'*': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support * on ' + rt.makeTypeString(r.t));
				}
				ret = l.v * r.v;
				rett = rt.promoteNumeric(l.t, r.t);
				return rt.val(rett, ret);
			}
		},
		'/': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support / on ' + rt.makeTypeString(r.t));
				}
				ret = l.v / r.v;
				if (rt.isIntegerType(l.t) && rt.isIntegerType(r.t)) {
					ret = Math.floor(ret);
				}
				rett = rt.promoteNumeric(l.t, r.t);
				return rt.val(rett, ret);
			}
		},
		'%': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support % on ' + rt.makeTypeString(r.t));
				}
				ret = l.v % r.v;
				rett = rt.promoteNumeric(l.t, r.t);
				return rt.val(rett, ret);
			}
		},
		'+': {
			'#default': function(rt, l, r) {
				if (r === undefined) {
					// unary
					return l;
				} else {
					if (!rt.isNumericType(r.t)) {
						rt.raiseException(rt.makeTypeString(l.t) + ' does not support + on ' + rt.makeTypeString(r.t));
					}
					ret = l.v + r.v;
					rett = rt.promoteNumeric(l.t, r.t);
					return rt.val(rett, ret);
				}
			}
		},
		'-': {
			'#default': function(rt, l, r) {
				if (r === undefined) {
					// unary
					return rt.val(l.t, -l.v);
				} else {
					// binary
					if (!rt.isNumericType(r.t)) {
						rt.raiseException(rt.makeTypeString(l.t) + ' does not support - on ' + rt.makeTypeString(r.t));
					}
					ret = l.v - r.v;
					rett = rt.promoteNumeric(l.t, r.t);
					return rt.val(rett, ret);
				}

			}
		},
		'<<': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support << on ' + rt.makeTypeString(r.t));
				}
				ret = l.v << r.v;
				rett = l.t;
				return rt.val(rett, ret);
			}
		},
		'>>': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support >> on ' + rt.makeTypeString(r.t));
				}
				ret = l.v >> r.v;
				rett = l.t;
				return rt.val(rett, ret);
			}
		},
		'<': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support < on ' + rt.makeTypeString(r.t));
				}
				ret = l.v < r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'<=': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support <= on ' + rt.makeTypeString(r.t));
				}
				ret = l.v <= r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'>': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support > on ' + rt.makeTypeString(r.t));
				}
				ret = l.v > r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'>=': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support >= on ' + rt.makeTypeString(r.t));
				}
				ret = l.v >= r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'==': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support == on ' + rt.makeTypeString(r.t));
				}
				ret = l.v == r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'!=': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support != on ' + rt.makeTypeString(r.t));
				}
				ret = l.v != r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'&': {
			'#default': function(rt, l, r) {
				if (r === undefined) {
					if (l.array) {
						return rt.val(
							rt.arrayPointerType(l.t, l.array.length),
							rt.makeArrayPointerValue(l.array, l.arrayIndex)
						);
					} else {
						var t = rt.normalPointerType(l.t);
						return rt.val(t, rt.makeNormalPointerValue(l));
					}
				} else {
					if (!rt.isIntegerType(l.t) || !rt.isNumericType(r.t) || !rt.isIntegerType(r.t)) {
						rt.raiseException(rt.makeTypeString(l.t) + ' does not support & on ' + rt.makeTypeString(r.t));
					}
					ret = l.v & r.v;
					rett = rt.promoteNumeric(l.t, r.t);
					return rt.val(rett, ret);
				}
			}
		},
		'^': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support ^ on ' + rt.makeTypeString(r.t));
				}
				ret = l.v ^ r.v;
				rett = rt.promoteNumeric(l.t, r.t);
				return rt.val(rett, ret);
			}
		},
		'|': {
			'#default': function(rt, l, r) {
				if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support | on ' + rt.makeTypeString(r.t));
				}
				ret = l.v | r.v;
				rett = rt.promoteNumeric(l.t, r.t);
				return rt.val(rett, ret);
			}
		},
		',': {
			'#default': function(rt, l, r) {
				return r;
			}
		},
		'=': {
			'#default': function(rt, l, r) {
				if (l.left) {
					l.v = rt.cast(l.t, r).v;
					return l;
				} else {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
			}
		},
		'+=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['+']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'-=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['-']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'*=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['*']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'/=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['/']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'%=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['%']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'<<=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['<<']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'>>=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['>>']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'&=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['&']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'^=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['^']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'|=': {
			'#default': function(rt, l, r) {
				r = defaultOpHandler['|']['#default'](rt, l, r);
				return defaultOpHandler['=']['#default'](rt, l, r);
			}
		},
		'++': {
			'#default': function(rt, l, dummy) {
				if (!rt.isNumericType(l.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support increment');
				}
				if (!l.left) {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
				if (dummy) {
					var b = l.v;
					l.v = l.v + 1;
					return rt.val(l.t, b);
				} else {
					l.v = l.v + 1;
					if (rt.inrange(l.t, l.v))
						return l;
					rt.raiseException('overflow during increment');
				}
			}
		},
		'--': {
			'#default': function(rt, l, dummy) {
				if (!rt.isNumericType(l.t)) {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support decrement');
				}
				if (!l.left) {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
				if (dummy) {
					var b = l.v;
					l.v = l.v - 1;
					return rt.val(l.t, b);
				} else {
					l.v = l.v - 1;
					var b = l.v;
					if (rt.inrange(l.t, l.v))
						return l;
					rt.raiseException('overflow during decrement');
				}
			}
		},
	};

	boolHandler = {
		'==': {
			'#default': function(rt, l, r) {
				if (!r.t === 'bool') {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support == on ' + rt.makeTypeString(r.t));
				}
				ret = l.v == r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		'!=': {
			'#default': function(rt, l, r) {
				if (!r.t === 'bool') {
					rt.raiseException(rt.makeTypeString(l.t) + ' does not support != on ' + rt.makeTypeString(r.t));
				}
				ret = l.v != r.v;
				rett = rt.boolTypeLiteral;
				return rt.val(rett, ret);
			}
		},
		',': {
			'#default': function(rt, l, r) {
				return r;
			}
		},
		'=': {
			'#default': function(rt, l, r) {
				if (l.left) {
					l.v = rt.cast(l.t, r).v;
					return l;
				} else {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
			}
		},
	};

	this.types = {
		'global': {},
	};
	this.types[this.getTypeSigniture(this.primitiveType('char'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed char'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned char'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('short'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('short int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed short'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed short int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned short'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned short int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('long'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed long'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned long'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('long long'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('long long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('long long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed long long'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('signed long long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned long long'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('unsigned long long int'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('float'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('double'))] = defaultOpHandler;
	this.types[this.getTypeSigniture(this.primitiveType('bool'))] = boolHandler;

	this.types['pointer'] = {
		'==': {
			'#default': function(rt, l, r) {
				if (rt.isTypeEqualTo(l.t, r.t)) {
					if (l.t.ptrType === 'array') {
						return l.v.target === r.v.target && (l.v.target === null || l.v.position === r.v.position);
					} else {
						return l.v.target === r.v.target;
					}
				}
				return false;
			}
		},
		'!=': {
			'#default': function(rt, l, r) {
				return !rt.types['pointer']['==']['#default'](rt, l, r);
			}
		},
		',': {
			'#default': function(rt, l, r) {
				return r;
			}
		},
		'=': {
			'#default': function(rt, l, r) {
				if (!l.left) {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
				var t = rt.cast(l.t, r);
				l.t = t.t;
				l.v = t.v;
				return l;
			}
		},
		'&': {
			'#default': function(rt, l, r) {
				if (r === undefined) {
					if (l.array) {
						return rt.val(
							rt.arrayPointerType(l.t, l.array.length),
							rt.makeArrayPointerValue(l.array, l.arrayIndex)
						);
					} else {
						var t = rt.normalPointerType(l.t);
						return rt.val(t, rt.makeNormalPointerValue(l));
					}
				} else {
					rt.raiseException('you cannot cast bitwise and on pointer');
				}
			}
		},
	};
	this.types['pointer_function'] = {
		'()': {
			'#default': function(rt, l, args) {
				if (l.t.type !== 'pointer' || l.t.ptrType !== 'function') {
					rt.raiseException(rt.makeTypeString(l.v.type) + ' is not function');
				}
				return rt.getCompatibleFunc(l.v.defineType, l.v.name, args)(args);
			}
		},
	};
	this.types['pointer_normal'] = {
		'*': {
			'#default': function(rt, l, r) {
				if (r === undefined) {
					return l.v.target;
				} else {
					rt.raiseException('you cannot multiply a pointer');
				}
			}
		}
	};
	this.types['pointer_array'] = {
		'*': {
			'#default': function(rt, l, r) {
				if (r === undefined) {
					var arr = l.v.target;
					if (l.v.position >= arr.length) {
						rt.raiseException('index out of bound ' + l.v.position + ' >= ' + arr.length);
					} else if (l.v.position < 0) {
						rt.raiseException('negative index ' + l.v.position);
					}
					var ret = arr[l.v.position];
					ret.array = arr;
					ret.arrayIndex = l.v.position;
					return ret;
				} else {
					rt.raiseException('you cannot multiply a pointer');
				}
			}
		},
		'[]': {
			'#default': function(rt, l, r) {
				r = rt.types['pointer_array']['+']['#default'](rt, l, r);
				return rt.types['pointer_array']['*']['#default'](rt, r);
			}
		},
		'-': {
			'#default': function(rt, l, r) {
				if (rt.isArrayType(r.t)) {
					if (l.v.target === r.v.target) {
						return l.v.position - r.v.position;
					} else {
						rt.raiseException('you cannot perform minus on pointers pointing to different arrays');
					}
				} else {
					rt.raiseException(rt.makeTypeString(r.t) + ' is not an array pointer type');
				}
			},
		},
		'<': {
			'#default': function(rt, l, r) {
				if (rt.isArrayType(r.t)) {
					if (l.v.target === r.v.target) {
						return l.v.position < r.v.position;
					} else {
						rt.raiseException('you cannot perform compare on pointers pointing to different arrays');
					}
				} else {
					rt.raiseException(rt.makeTypeString(r.t) + ' is not an array pointer type');
				}
			},
		},
		'>': {
			'#default': function(rt, l, r) {
				if (rt.isArrayType(r.t)) {
					if (l.v.target === r.v.target) {
						return l.v.position > r.v.position;
					} else {
						rt.raiseException('you cannot perform compare on pointers pointing to different arrays');
					}
				} else {
					rt.raiseException(rt.makeTypeString(r.t) + ' is not an array pointer type');
				}
			},
		},
		'<=': {
			'#default': function(rt, l, r) {
				if (rt.isArrayType(r.t)) {
					if (l.v.target === r.v.target) {
						return l.v.position <= r.v.position;
					} else {
						rt.raiseException('you cannot perform compare on pointers pointing to different arrays');
					}
				} else {
					rt.raiseException(rt.makeTypeString(r.t) + ' is not an array pointer type');
				}
			},
		},
		'>=': {
			'#default': function(rt, l, r) {
				if (rt.isArrayType(r.t)) {
					if (l.v.target === r.v.target) {
						return l.v.position >= r.v.position;
					} else {
						rt.raiseException('you cannot perform compare on pointers pointing to different arrays');
					}
				} else {
					rt.raiseException(rt.makeTypeString(r.t) + ' is not an array pointer type');
				}
			},
		},
		'+': {
			'#default': function(rt, l, r) {
				if (rt.isNumericType(r.t)) {
					var i = rt.cast(rt.intTypeLiteral, r).v;
					return rt.val(
						l.t,
						rt.makeArrayPointerValue(l.v.target, l.v.position + i)
					);
				} else {
					rt.raiseException('cannot add non-numeric to a pointer');
				}
			},
		},
		'-': {
			'#default': function(rt, l, r) {
				if (rt.isNumericType(r.t)) {
					var i = rt.cast(rt.intTypeLiteral, r).v;
					return rt.val(
						l.t,
						rt.makeArrayPointerValue(l.v.target, l.v.position - i)
					);
				} else {
					rt.raiseException('cannot add non-numeric to a pointer');
				}
			},
		},
		'+=': {
			'#default': function(rt, l, r) {
				r = rt.types['pointer_array']['+']['#default'](rt, l, r);
				return rt.types['pointer']['=']['#default'](rt, l, r);
			},
		},
		'-=': {
			'#default': function(rt, l, r) {
				r = rt.types['pointer_array']['-']['#default'](rt, l, r);
				return rt.types['pointer']['=']['#default'](rt, l, r);
			},
		},
		'++': {
			'#default': function(rt, l, dummy) {
				if (!l.left) {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
				if (dummy) {
					return rt.val(
						l.t,
						rt.makeArrayPointerValue(l.v.target, l.v.position++)
					);
				} else {
					l.v.position++;
					return l;
				}
			}
		},
		'--': {
			'#default': function(rt, l, dummy) {
				if (!l.left) {
					rt.raiseException(rt.makeValString(l) + ' is not a left value');
				}
				if (dummy) {
					return rt.val(
						l.t,
						rt.makeArrayPointerValue(l.v.target, l.v.position--)
					);
				} else {
					l.v.position--;
					return l;
				}
			}
		},
	};

	this.intTypeLiteral = this.primitiveType('int');
	this.floatTypeLiteral = this.primitiveType('float');
	this.doubleTypeLiteral = this.primitiveType('double');
	this.charTypeLiteral = this.primitiveType('char');
	this.boolTypeLiteral = this.primitiveType('bool');
	this.voidTypeLiteral = this.primitiveType('void');

	this.nullPointerValue = this.makeNormalPointerValue(null);

	this.scope = [{
		'$name': 'global'
	}];
}

CRuntime.prototype.defFunc = function(lt, name, retType, argTypes, argNames, stmts, interp) {
	var f = function(rt, _this, args) {
		// logger.warn('calling function: %j', name);
		rt.enterScope('function ' + name);
		argNames.forEach(function(v, i) {
			rt.defVar(v, argTypes[i], args[i]);
		});
		ret = interp.run(stmts, {
			scope: 'function'
		});
		if (!rt.isTypeEqualTo(retType, rt.voidTypeLiteral)) {
			if (ret instanceof Array && ret[0] === 'return') {
				ret = rt.cast(retType, ret[1]);
			} else {
				this.raiseException('you must return a value');
			}
		} else {
			if (typeof ret === 'Array') {
				if (ret[0] === 'return' && ret[1])
					this.raiseException('you cannot return a value in a void function');
			}
			ret = undefined;
		}
		rt.exitScope('function ' + name);
		// logger.warn('function: returing %j', ret);
		return ret;
	};
	this.regFunc(f, lt, name, argTypes, retType);
}

CRuntime.prototype.makeValString = function(l) {
	var display = l.v;
	if (this.isTypeEqualTo(l.t, this.charTypeLiteral))
		display = String.fromCharCode(l.v);
	return display + '(' + this.makeTypeString(l.t) + ')';
};

CRuntime.prototype.makeParametersSigniture = function(args) {
	var ret = new Array(args.length);
	for (var i = 0; i < args.length; i++) {
		ret[i] = this.getTypeSigniture(args[i]);
	}
	return ret.join(',');
};

CRuntime.prototype.getCompatibleFunc = function(lt, name, args) {
	var ltsig = this.getTypeSigniture(lt);
	if (ltsig in this.types) {
		var t = this.types[ltsig];
		if (name in t) {
			// logger.info('method found');
			var ts = args.map(function(v) {
				return v.t;
			});
			var sig = this.makeParametersSigniture(ts);
			if (sig in t[name]) {
				return t[name][sig];
			} else {
				var compatibles = [];
				t[name]['reg'].forEach(function(dts) {
					if (dts.length == ts.length) {
						var ok = true;
						for (var i = 0; ok && i < ts.length; i++) {
							ok = rt.castable(ts[i], dts[i]);
						}
						if (ok) {
							compatibles.push(t[name][rt.makeParametersSigniture(dts)]);
						}
					}
				});
				if (compatibles.length == 0) {
					if ('#default' in t[name])
						return t[name]['#default'];
					this.raiseException('no method ' + name + ' in ' + lt + ' accepts (' + sig + ')');
				} else if (compatibles.length > 1)
					this.raiseException('ambiguous method invoking, ' + compatibles.length + 'compatible methods');
				else
					return compatibles[0];
			}
		} else {
			this.raiseException('method ' + name + ' is not defined in ' + this.makeTypeString(lt));
		}
	} else {
		this.raiseException('type ' + this.makeTypeString(lt) + ' is unknown');
	}
}

CRuntime.prototype.getFunc = function(lt, name, args) {
	if (this.isPointerType(lt)) {
		var f;
		if (this.isArrayType(lt)) {
			f = 'pointer_array';
		} else if (this.isFunctionType(lt)) {
			f = 'pointer_function';
		} else {
			f = 'pointer_normal';
		}
		var t = null;
		if (name in this.types[f]) {
			t = this.types[f];
		} else if (name in this.types['pointer']) {
			t = this.types['pointer'];
		}
		if (t) {
			var sig = this.makeParametersSigniture(args);
			if (sig in t[name]) {
				return t[name][sig];
			} else if ('#default' in t[name]) {
				return t[name]['#default'];
			} else {
				this.raiseException('no method ' + name + ' in ' + this.makeTypeString(lt) + ' accepts (' + sig + ')');
			}
		}
	}
	var ltsig = this.getTypeSigniture(lt);
	if (ltsig in this.types) {
		var t = this.types[ltsig];
		if (name in t) {
			var sig = this.makeParametersSigniture(args);
			if (sig in t[name]) {
				return t[name][sig];
			} else if ('#default' in t[name]) {
				return t[name]['#default'];
			} else {
				this.raiseException('no method ' + name + ' in ' + this.makeTypeString(lt) + ' accepts (' + sig + ')');
			}
		} else {
			this.raiseException('method ' + name + ' is not defined in ' + this.makeTypeString(lt));
		}
	} else {
		if (this.isPointerType(lt))
			this.raiseException('this pointer has no proper method overload');
		else
			this.raiseException('type ' + this.makeTypeString(lt) + ' is not defined');
	}
};

CRuntime.prototype.regFunc = function(f, lt, name, args, retType) {
	var ltsig = this.getTypeSigniture(lt);
	if (ltsig in this.types) {
		t = this.types[ltsig];
		if (!(name in t)) {
			t[name] = {};
		}
		if (!('reg' in t[name])) {
			t[name]['reg'] = [];
		}
		sig = this.makeParametersSigniture(args);
		if (sig in t[name]) {
			this.raiseException('method ' + name + ' with parameters (' + sig + ') is already defined');
		}
		var type = this.functionPointerType(retType, args);
		this.defVar(name, type, this.val(type, this.makeFunctionPointerValue(f, name, lt, args, retType)));
		t[name][sig] = f;
		t[name]['reg'].push(args);
	} else {
		this.raiseException('type ' + this.makeTypeString(lt) + ' is unknown');
	}
};

CRuntime.prototype.promoteNumeric = function(l, r) {
	if (!this.isNumericType(l) || !this.isNumericType(r)) {
		this.raiseException('you cannot promote (to) a non numeric type');
	}
	if (this.isTypeEqualTo(l, r)) {
		return rett = l;
	} else if (this.isIntegerType(l) && this.isIntegerType(r)) {
		slt = this.getSignedType(l);
		srt = this.getSignedType(r);
		slti = this.numericTypeOrder.indexOf(slt.name);
		srti = this.numericTypeOrder.indexOf(srt.name);
		if (slti <= srti) {
			if (this.isUnsignedType(l) && this.isUnsignedType(r)) {
				rett = r;
			} else {
				rett = srt;
			}
		} else {
			if (this.isUnsignedType(l) && this.isUnsignedType(r)) {
				rett = l;
			} else {
				rett = slt;
			}
		}
		return rett = l;
	} else if (!this.isIntegerType(l) && this.isIntegerType(r)) {
		return rett = l;
	} else if (this.isIntegerType(l) && !this.isIntegerType(r)) {
		return rett = r;
	} else if (!this.isIntegerType(l) && !this.isIntegerType(r)) {
		return rett = this.primitiveType('double');
	}
};

CRuntime.prototype.readVar = function(varname) {
	for (i = this.scope.length - 1; i >= 0; i--) {
		vc = this.scope[i];
		if (vc[varname])
			return vc[varname];
	}
	this.raiseException('variable ' + varname + ' does not exist');
};

CRuntime.prototype.defVar = function(varname, type, initval) {
	// logger.log('defining variable: %j, %j', varname, type);
	vc = this.scope[this.scope.length - 1];
	if (varname in vc) {
		this.raiseException('variable ' + varname + ' already defined');
	}
	initval = this.cast(type, initval);

	if (initval === undefined) {
		vc[varname] = this.defaultValue(type);
		vc[varname].left = true;
	} else {
		vc[varname] = initval;
		vc[varname].left = true;
	}
};

CRuntime.prototype.inrange = function(type, value) {
	if (this.isPrimitiveType(type)) {
		limit = this.config.limits[type.name];
		return value <= limit.max && value >= limit.min;
	}
	return true;
};

CRuntime.prototype.isNumericType = function(type) {
	return this.isFloatType(type) || this.isIntegerType(type);
};

CRuntime.prototype.isUnsignedType = function(type) {
	if (typeof type === 'string') {
		switch (type) {
			case 'unsigned char':
			case 'unsigned short':
			case 'unsigned short int':
			case 'unsigned':
			case 'unsigned int':
			case 'unsigned long':
			case 'unsigned long int':
			case 'unsigned long long':
			case 'unsigned long long int':
				return true;
			default:
				return false;
		}
	} else {
		return type.type === 'primitive' && this.isUnsignedType(type.name);
	}
};

CRuntime.prototype.isIntegerType = function(type) {
	if (typeof type === 'string') {
		switch (type) {
			case 'char':
			case 'signed char':
			case 'unsigned char':
			case 'short':
			case 'short int':
			case 'signed short':
			case 'signed short int':
			case 'unsigned short':
			case 'unsigned short int':
			case 'int':
			case 'signed int':
			case 'unsigned':
			case 'unsigned int':
			case 'long':
			case 'long int':
			case 'long int':
			case 'signed long':
			case 'signed long int':
			case 'unsigned long':
			case 'unsigned long int':
			case 'long long':
			case 'long long int':
			case 'long long int':
			case 'signed long long':
			case 'signed long long int':
			case 'unsigned long long':
			case 'unsigned long long int':
				return true;
			default:
				return false;
		}
	} else {
		return type.type === 'primitive' && this.isIntegerType(type.name);
	}
};

CRuntime.prototype.isFloatType = function(type) {
	if (typeof type === 'string') {
		switch (type) {
			case 'float':
			case 'double':
				return true;
			default:
				return false;
		}
	} else {
		return type.type === 'primitive' && this.isFloatType(type.name);
	}
};

CRuntime.prototype.getSignedType = function(type) {
	if (type !== 'unsigned')
		return this.primitiveType(type.name.substring('unsigned'.length).trim());
	else
		return this.primitiveType('int');
};

CRuntime.prototype.castable = function(type1, type2) {
	if (this.isTypeEqualTo(type1, type2))
		return true;
	if (this.isPrimitiveType(type1) && this.isPrimitiveType(type2))
		return this.isNumericType(type2) || !this.isNumericType(type1);
	else if (this.isPointerType(type1) && this.isPointerType(type2)) {
		if (this.isFunctionType(type1))
			return this.isPointerType(type2);
		return !this.isFunctionType(type2);
	} else {
		this.raiseException('not implemented');
	}
};

CRuntime.prototype.cast = function(type, value) {
	// TODO: looking for global overload
	if (this.isTypeEqualTo(value.t, type))
		return value;
	if (this.isPrimitiveType(type) && this.isPrimitiveType(value.t)) {
		switch (type.name) {
			case 'bool':
				return this.val(type, value.v ? true : false);
				break;
			case 'float':
			case 'double':
				if (!this.isNumericType(value.t)) {
					this.raiseException('cannot cast ' + this.makeTypeString(value.t) + ' to ' + this.makeTypeString(type));
				}
				if (this.inrange(type, value.v))
					return this.val(type, value.v);
				else
					this.raiseException('overflow when casting ' + this.makeTypeString(value.t) + ' to ' + this.makeTypeString(type));
				break;
			case 'unsigned char':
			case 'unsigned short':
			case 'unsigned short int':
			case 'unsigned':
			case 'unsigned int':
			case 'unsigned long':
			case 'unsigned long int':
			case 'unsigned long long':
			case 'unsigned long long int':
				if (!this.isNumericType(value.t)) {
					this.raiseException('cannot cast ' + this.makeTypeString(value.t) + ' to ' + this.makeTypeString(type));
				} else if (value.v < 0) {
					this.raiseException('cannot cast negative value to ' + this.makeTypeString(type));
				}
			case 'char':
			case 'signed char':
			case 'short':
			case 'short int':
			case 'signed short':
			case 'signed short int':
			case 'int':
			case 'signed int':
			case 'long':
			case 'long int':
			case 'long int':
			case 'signed long':
			case 'signed long int':
			case 'long long':
			case 'long long int':
			case 'long long int':
			case 'signed long long':
			case 'signed long long int':
				if (!this.isNumericType(value.t)) {
					this.raiseException('cannot cast ' + this.makeTypeString(value.t) + ' to ' + this.makeTypeString(type));
				}
				if (value.t.name === 'float' || value.t.name === 'double') {
					v = value.v > 0 ? Math.floor(value.v) : Math.ceil(value.v);
					if (this.inrange(type, v))
						return this.val(type, v);
					else
						this.raiseException('overflow when casting ' + value.v + '(' + this.makeTypeString(value.t) + ') to ' + this.makeTypeString(type));
				} else {
					if (this.inrange(type, value.v))
						return this.val(type, value.v);
					else
						this.raiseException('overflow when casting ' + value.v + '(' + this.makeTypeString(value.t) + ') to ' + this.makeTypeString(type));
				}
				break;
			default:
				this.raiseException('cast from ' + value.v + '(' + this.makeTypeString(value.t) + ') to ' + this.makeTypeString(type) + ' is not supported');
		}
	} else if (this.isPointerType(type)) {
		if (this.isFunctionType(type)) {
			if (this.isFunctionType(value.t)) {
				return this.val(value.t, value.v);
			} else {
				this.raiseException('cannot cast a regular pointer to a function');
			}
		} else if (this.isArrayType(value.t)) {
			if (this.isNormalPointerType(type)) {
				if (this.isTypeEqualTo(type.targetType, value.t.eleType))
					return value;
				else
					this.raiseException(this.makeTypeString(type.targetType) + ' is not equal to array element type ' + this.makeTypeString(value.t.eleType));
			} else if (this.isArrayType(type)) {
				if (this.isTypeEqualTo(type.eleType, value.t.eleType))
					return value;
				else
					this.raiseException('array element type ' + this.makeTypeString(type.eleType) + ' is not equal to array element type ' + this.makeTypeString(value.t.eleType));
			} else {
				this.raiseException('cannot cast a function to a regular pointer');
			}
		} else {
			if (this.isNormalPointerType(type)) {
				if (this.isTypeEqualTo(type.targetType, value.t.targetType))
					return value;
				else
					this.raiseException(this.makeTypeString(type.targetType) + ' is not equal to ' + this.makeTypeString(value.t.eleType));
			} else if (this.isArrayType(type)) {
				if (this.isTypeEqualTo(type.eleType, value.t.targetType))
					return value;
				else
					this.raiseException('array element type ' + this.makeTypeString(type.eleType) + ' is not equal to ' + this.makeTypeString(value.t.eleType));
			} else {
				this.raiseException('cannot cast a function to a regular pointer');
			}
		}
	} else if (this.isClassType(type)) {
		this.raiseException('not implemented');
	} else if (this.isClassType(value.t)) {
		if (this.isTypeEqualTo(this.boolTypeLiteral, type)) {
			return this.val(this.boolTypeLiteral, true);
		} else {
			this.raiseException('not implemented');
		}
	} else {
		this.raiseException('cast failed from type ' + this.makeTypeString(type) + ' to ' + this.makeTypeString(value.t));
	}
};

CRuntime.prototype.clone = function(v) {
	return this.val(v.t, v.v);
}

CRuntime.prototype.enterScope = function(scopename) {
	this.scope.push({
		"$name": scopename
	});
};

CRuntime.prototype.exitScope = function(scopename) {
	// logger.info('%j', this.scope);
	do {
		s = this.scope.pop();
	} while (scopename && this.scope.length > 1 && s['$name'] != scopename);
};

CRuntime.prototype.val = function(type, v, left) {
	if (this.isNumericType(type) && !this.inrange(type, v)) {
		this.raiseException('overflow in ' + this.makeValString(v));
	}
	if (left === undefined)
		left = false;
	return {
		't': type,
		'v': v,
		'left': left
	}
};

CRuntime.prototype.isTypeEqualTo = function(type1, type2) {
	if (type1.type === type2.type) {
		switch (type1.type) {
			case 'primitive':
			case 'class':
				return type1.name === type2.name;
			case 'pointer':
				if (type1.ptrType === type2.ptrType ||
					type1.ptrType !== 'function' && type2.ptrType !== 'function') {
					switch (type1.ptrType) {
						case 'array':
							return this.isTypeEqualTo(type1.eleType, type2.eleType || type2.targetType);
						case 'function':
							if (this.isTypeEqualTo(type1.retType, type2.retType) &&
								type1.sigiture.length === type2.sigiture.length) {
								var _this = this;
								return type1.sigiture.every(function(type, index, arr) {
									return _this.isTypeEqualTo(type, type2.sigiture[index]);
								});
							}
							break;
						case 'normal':
							return this.isTypeEqualTo(type1.targetType, type2.eleType || type2.targetType);
					}
				}
		}
	}
	return false;
}

CRuntime.prototype.isBoolType = function(type) {
	if (typeof type === 'string')
		return type === 'bool';
	else
		return type.type === 'primitive' && this.isBoolType(type.name);
}

CRuntime.prototype.isPrimitiveType = function(type) {
	return this.isNumericType(type) || this.isBoolType(type);
};

CRuntime.prototype.isArrayType = function(type) {
	return this.isPointerType(type) && type.ptrType === 'array';
};

CRuntime.prototype.isFunctionType = function(type) {
	return this.isPointerType(type) && type.ptrType === 'function';
};

CRuntime.prototype.isNormalPointerType = function(type) {
	return this.isPointerType(type) && type.ptrType === 'normal';
};

CRuntime.prototype.isPointerType = function(type) {
	return type.type === 'pointer';
};

CRuntime.prototype.isClassType = function(type) {
	return type.type === 'class';
};

CRuntime.prototype.arrayPointerType = function(eleType, size) {
	return {
		type: 'pointer',
		ptrType: 'array',
		eleType: eleType,
		size: size
	};
};

CRuntime.prototype.makeArrayPointerValue = function(arr, position) {
	return {
		target: arr,
		position: position,
	};
};

CRuntime.prototype.functionPointerType = function(retType, sigiture) {
	return {
		type: 'pointer',
		ptrType: 'function',
		retType: retType,
		sigiture: sigiture
	};
};

CRuntime.prototype.makeFunctionPointerValue = function(f, name, lt, args, retType) {
	return {
		target: f,
		name: name,
		defineType: lt,
		args: args,
		retType: retType
	};
};

CRuntime.prototype.normalPointerType = function(targetType) {
	return {
		type: 'pointer',
		ptrType: 'normal',
		targetType: targetType
	};
};

CRuntime.prototype.makeNormalPointerValue = function(target) {
	return {
		target: target
	};
}

CRuntime.prototype.simpleType = function(type) {
	if (this.isPrimitiveType(type)) {
		return this.primitiveType(type);
	} else {
		var clsType = {
			type: 'class',
			name: type
		};
		if (this.getTypeSigniture(clsType) in this.types) {
			return clsType;
		} else {
			this.raiseException('type ' + this.makeTypeString(type) + ' is not defined');
		}
	}
};

CRuntime.prototype.newClass = function(classname) {
	var clsType = {
		type: 'class',
		name: classname
	};
	var sig = this.getTypeSigniture(clsType);
	if (sig in this.types)
		this.raiseException(this.makeTypeString(clsType) + ' is already defined');
	this.types[sig] = {};
	return clsType;
};

CRuntime.prototype.primitiveType = function(type) {
	return {
		type: 'primitive',
		name: type
	};
};

CRuntime.prototype.getTypeSigniture = function(type) {
	// (primitive), [class], {pointer}
	var ret = type;
	if (type.type === 'primitive') {
		ret = '(' + type.name + ')';
	} else if (type.type === 'class') {
		ret = '[' + type.name + ']';
	} else if (type.type === 'pointer') {
		// !targetType, @size!eleType, #retType!param1,param2,...
		ret = '{';
		if (type.ptrType === 'normal') {
			ret += '!' + this.getTypeSigniture(type.targetType);
		} else if (type.ptrType === 'array') {
			ret += '!' + this.getTypeSigniture(type.eleType);
		} else if (type.ptrType === 'function') {
			ret += '#' + this.getTypeSigniture(type.retType) + '!' + type.sigiture.map(function(e) {
				return this.getTypeSigniture(e);
			}).join(',');
		}
		ret += '}';
	}
	return ret;
};

CRuntime.prototype.makeTypeString = function(type) {
	// (primitive), [class], {pointer}
	var ret = '$' + type;
	if (type.type === 'primitive') {
		ret = type.name;
	} else if (type.type === 'class') {
		ret = type.name;
	} else if (type.type === 'pointer') {
		// !targetType, @size!eleType, #retType!param1,param2,...
		ret = '';
		if (type.ptrType === 'normal') {
			ret += this.makeTypeString(type.targetType) + '*';
		} else if (type.ptrType === 'array') {
			ret += this.makeTypeString(type.eleType) + '*';
		} else if (type.ptrType === 'function') {
			ret += this.makeTypeString(type.retType) + '(' + type.sigiture.map(function(e) {
				return this.makeTypeString(e);
			}).join(',') + ')';
		}
	}
	return ret;
};

CRuntime.prototype.defaultValue = function(type) {
	if (type.type === 'primitive') {
		if (this.isNumericType(type))
			return this.val(type, 0);
		else if (type.name === 'bool')
			return this.val(type, false);
	} else if (type.type === 'class') {
		this.raiseException('no default value for object');
	} else if (type.type === 'pointer') {
		if (type.ptrType === 'normal') {
			return this.val(type, this.makeNormalPointerValue(null));
		} else if (type.ptrType === 'array') {
			return this.val(type, this.makeArrayPointerValue(null, 0));
		} else if (type.ptrType === 'function') {
			return this.val(type, this.makeFunctionPointerValue(null, null, null, null, null));
		}
	}
};

CRuntime.prototype.raiseException = function(message) {
	var interp = this.interp;
	if (interp) {
		var ln = interp.currentNode.line;
		var col = interp.currentNode.column;
		throw ln + ':' + col + ' ' + message;
	} else {
		throw message;
	}
}

module.exports = CRuntime;
var _CRuntime = module.exports;
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
							dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression)).v;
						} else if (j > 0) {
							interp.rt.raiseException('multidimensional array must have bounds for all dimensions except the first');
						} else {
							dim = init.Initializers.length;
						}
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
							dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression)).v;
						} else if (j > 0) {
							interp.rt.raiseException('multidimensional array must have bounds for all dimensions except the first');
						} else {
							dim = init.Initializers.length;
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
			var r = interp.visit(interp, s.Expression);
		},
		SelectionStatement_if: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'SelectionStatement_if';
			interp.rt.enterScope(param.scope);
			var e = interp.visit(interp, s.Expression);
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
			var e = interp.visit(interp, s.Expression);
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
			while (interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression)).v) {
				var r = interp.visit(interp, s.Statement);
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
			} while (interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression)).v);
			interp.rt.exitScope(param.scope);
			param.scope = scope_bak;
		},
		IterationStatement_for: function(interp, s, param) {
			var scope_bak = param.scope;
			param.scope = 'IterationStatement_for';
			interp.rt.enterScope(param.scope);
			if (s.Initializer) {
				if (s.Initializer.type === 'Declaration')
					interp.visit(interp, s.Initializer);
				else
					interp.visit(interp, s.Initializer);
			}
			while (s.Expression === undefined || interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression)).v) {
				var r = interp.visit(interp, s.Statement);
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
					interp.visit(interp, s.Loop);
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
				var ret = interp.visit(interp, s.Expression);
				return ['return', ret];
			}
			return ['return'];
		},
		IdentifierExpression: function(interp, s, param) {
			return interp.rt.readVar(s.Identifier);
		},
		ParenthesesExpression: function(interp, s, param) {
			return interp.visit(interp, s.Expression);
		},
		PostfixExpression_ArrayAccess: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			var index = interp.visit(interp, s.index);
			return interp.rt.getFunc(ret.t, '[]', [index.t])(interp.rt, ret, index);
		},
		PostfixExpression_MethodInvocation: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			s.args = s.args.map(function(e) {
				return interp.visit(interp, e);
			});
			return interp.rt.getFunc(ret.t, '()', s.args.map(function(e) {
				return e.t;
			}))(interp.rt, ret, s.args);
		},
		PostfixExpression_MemberAccess: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			interp.rt.raiseException('not implemented');
		},
		PostfixExpression_MemberPointerAccess: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			interp.rt.raiseException('not implemented');
		},
		PostfixExpression_PostIncrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			return interp.rt.getFunc(ret.t, '++', ['dummy'])(interp.rt, ret, {
				t: 'dummy',
				v: null
			});
		},
		PostfixExpression_PostDecrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			return interp.rt.getFunc(ret.t, '--', ['dummy'])(interp.rt, ret, {
				t: 'dummy',
				v: null
			});
		},
		UnaryExpression_PreIncrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			return interp.rt.getFunc(ret.t, '++', [])(interp.rt, ret);
		},
		UnaryExpression_PreDecrement: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			return interp.rt.getFunc(ret.t, '--', [])(interp.rt, ret);
		},
		UnaryExpression: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			return interp.rt.getFunc(ret.t, s.op, [])(interp.rt, ret);
		},
		UnaryExpression_Sizeof_Expr: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
			interp.rt.raiseException('not implemented');
			return 1;
		},
		UnaryExpression_Sizeof_Type: function(interp, s, param) {
			var type = s.TypeName;
			interp.rt.raiseException('not implemented');
			return 1;
		},
		CastExpression: function(interp, s, param) {
			var ret = interp.visit(interp, s.Expression);
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
				var left = interp.visit(interp, s.left);
				var right = interp.visit(interp, s.right);
				return interp.rt.getFunc(left.t, op, [right.t])(interp.rt, left, right);
			}
		},
		LogicalANDExpression: function(interp, s, param) {
			var left = interp.visit(interp, s.left);
			var lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)];
			if ('&&' in lt) {
				var right = interp.visit(interp, s.right);
				return interp.rt.getFunc(left.t, '&&', [right.t])(interp.rt, left, right);
			} else {
				if (interp.rt.cast(interp.rt.boolTypeLiteral, left).v)
					return interp.visit(interp, s.right);
				else
					return left;
			}
		},
		LogicalORExpression: function(interp, s, param) {
			var left = interp.visit(interp, s.left);
			var lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)];
			if ('||' in lt) {
				var right = interp.visit(interp, s.right);
				return interp.rt.getFunc(left.t, '||', [right.t])(interp.rt, left, right);
			} else {
				if (interp.rt.cast(interp.rt.boolTypeLiteral, left).v)
					return left;
				else
					return interp.visit(interp, s.right);
			}
		},
		ConditionalExpression: function(interp, s, param) {
			var cond = interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.cond)).v;
			return cond ? interp.visit(interp, s.t) : interp.visit(interp, s.f);
		},
		ConstantExpression: function(interp, s, param) {
			return interp.visit(interp, s.Expression);
		},
		StringLiteralExpression: function(interp, s, param) {
			var str = s.value;
			return interp.rt.val(interp.rt.arrayPointerType(interp.rt.charTypeLiteral, str.length + 1), {
				target: str.split('').map(function(c) {
					return interp.rt.val(interp.rt.charTypeLiteral, c)
				}),
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
			var val = interp.visit(interp, s.Expression);
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
			interp.rt.raiseException('unhandled syntax');
		},
	};
};

Interpreter.prototype.visit = function(interp, s, param) {
	if (param === undefined) {
		param = {
			scope: 'global'
		};
	}
	// logger.warn('visiting %j', s.type);
	var _node = this.currentNode;
	this.currentNode = s;
	return this.visitors[s.type](interp, s, param);
	this.currentNode = _node;
};

Interpreter.prototype.run = function(tree) {
	this.rt.interp = this;
	return this.visit(this, tree);
}

Interpreter.prototype.arrayInit = function(dimensions, init, level, type, param) {
	if (dimensions.length > level) {
		var curDim = dimensions[level];
		if (init) {
			if (init.type === 'Initializer_array' && curDim > init.Initializers.length &&
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
						arr[i] = this.visit(this, init.Initializers[i].Expression);
					}
					for (var i = init.Initializers.length; i < curDim; i++) {
						arr[i] = {
							shorthand: this.rt.defaultValue(type)
						};
					}
					init.Initializers = arr;
				}
			} else {
				this.rt.raiseExeception('dimensions do not agree, ' + curDim + ' != ' + init.Initializers.length);
			}
		}
		var arr = [];
		var ret = this.rt.val(
			this.arrayType(dimensions, level, type),
			this.rt.makeArrayPointerValue(arr, 0),
			true
		);
		for (var i = 0; i < curDim; i++) {
			if (init)
				arr[i] = this.arrayInit(dimensions, init.Initializers[i], level + 1, type, param);
			else
				arr[i] = this.arrayInit(dimensions, null, level + 1, type, param);
		}
		return ret;
	} else {
		if (init && init.type !== 'Initializer_expr')
			this.rt.raiseExeception('dimensions do not agree, too few initializers');
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
var _Interpreter = module.exports;
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleIndices = { TranslationUnit: 0 },
        peg$startRuleIndex   = 0,

        peg$consts = [
          peg$FAILED,
          [],
          function(a) {return addPositionInfo({type:'TranslationUnit', ExternalDeclarations: a});},
          null,
          function(a, b, c, d) {
                return addPositionInfo({type:'FunctionDefinition', DeclarationSpecifiers:a, Declarator:b, DeclarationList:c, CompoundStatement:d});
              },
          function(a) {return addPositionInfo({type:'DeclarationList', Declarations:a});},
          function(a) {return addPositionInfo({type: 'Label_case', ConstantExpression: a});},
          function() {return addPositionInfo({type: 'Label_default'});},
          function(a) {
                  return addPositionInfo({type: 'CompoundStatement', Statements: a});
                },
          function(a) {
                  return addPositionInfo({type: 'ExpressionStatement', Expression: a});
                },
          function(a, b, c) {
                  return addPositionInfo({type: 'SelectionStatement_if', Expression:a, Statement:b, ElseStatement:c?c[1]:null});
                },
          function(a, b) {
                  return addPositionInfo({type: 'SelectionStatement_switch', Expression:a, Statement:b});
                },
          function(a, b) {return addPositionInfo({type:'IterationStatement_while', Expression:a, Statement:b});},
          function(a, b) {return addPositionInfo({type:'IterationStatement_do', Expression:b, Statement:a});},
          function(a, c, d, e) {
                return addPositionInfo({type:'IterationStatement_for', Initializer:a, Expression:c, Loop:d, Statement:e});
              },
          function(a) {
                return addPositionInfo({type:'JumpStatement_goto', Identifier:a});
              },
          function() {
                return addPositionInfo({type: 'JumpStatement_continue'});
              },
          function() {
                return addPositionInfo({type: 'JumpStatement_break'});
              },
          function(a) {
                return addPositionInfo({type: 'JumpStatement_return', Expression:a});
              },
          function(a, b) {
                return addPositionInfo({type: 'Declaration', DeclarationSpecifiers:a, InitDeclaratorList:b});
              },
          function(a, b, c) {
                  return a.push(b).concat(c);
                 },
          function(a) {
                    return a;
                  },
          function(a) {return a;},
          function(a) {
                  return a;
                },
          function(x) {return x;},
          function(a, b) {
                return [a].concat(b);
              },
          function(a, b) {return addPositionInfo({type:'InitDeclarator', Declarator:a, Initializers:b});},
          void 0,
          function(a) {
                return a;
              },
          function(a, b) {
                b.Pointer = a;
                return b;
              },
          function(a) {return addPositionInfo({type:'Identifier', Identifier:a});},
          function(a, b) {
                  return addPositionInfo({type:'DirectDeclarator_modifier_array', Modifier:a||[], Expression: b});
                },
          function(a, b) {
                  return addPositionInfo({type:'DirectDeclarator_modifier_array', Modifier:['static'].concat(a), Expression: b});
                },
          function(a) {
                  return addPositionInfo({type:'DirectDeclarator_modifier_star_array', Modifier:a.concat['*']});
                },
          function(a) {
                  return addPositionInfo({type:'DirectDeclarator_modifier_ParameterTypeList', ParameterTypeList:a});
                },
          function(a) {
                  return addPositionInfo({type:'DirectDeclarator_modifier_IdentifierList', IdentifierList:a});
                },
          function(a, b) {
                  return addPositionInfo({type:'DirectDeclarator', left:a, right:b});
                },
          function(a, b) {
                return addPositionInfo({type:'ParameterTypeList', ParameterList:a, varargs:b!==null});
              },
          function(a, b) {
                  return addPositionInfo({type:'ParameterDeclaration', DeclarationSpecifiers:a, Declarator:b});
                },
          function(a) {return addPositionInfo({type:'Initializer_expr', Expression:a});},
          function(a) {return addPositionInfo({type:'Initializer_array', Initializers:a});},
          function(a, b) {return [a].concat(b);},
          function(a) {return addPositionInfo({type:'IdentifierExpression', Identifier:a});},
          function(a) {return addPositionInfo({type:'ConstantExpression', Expression:a});},
          function(a) {return addPositionInfo({type:'StringLiteralExpression', value:a});},
          function(a) {return addPositionInfo({type:'ParenthesesExpression', Expression:a});},
          function(c) {return [0,c];},
          function(c) {return [1,c?c:[]];},
          function(c) {return [2,c];},
          function(c) {return [3,c];},
          function(c) {return [4];},
          function(c) {return [5];},
          function(a, b) {
                  if (b.length>0){
                    var ret = {
                      Expression: a,
                    };
                    for (var i=0;i<b.length;i++){
                      var o = b[i][1];
                      switch(b[i][0]){
                      case 0:
                        ret.type = 'PostfixExpression_ArrayAccess';
                        ret.index = o;
                        break;
                      case 1:
                        ret.type = 'PostfixExpression_MethodInvocation';
                        ret.args = o;
                        break;
                      case 2:
                        ret.type = 'PostfixExpression_MemberAccess';
                        ret.member = o;
                        break;
                      case 3:
                        ret.type = 'PostfixExpression_MemberPointerAccess';
                        ret.member = o;
                        break;
                      case 4:
                        ret.type = 'PostfixExpression_PostIncrement';
                        break;
                      case 5:
                        ret.type = 'PostfixExpression_PostDecrement';
                        break;
                      }
                      ret = {Expression: ret};
                    }
                    return ret.Expression;
                  } else
                    return a;
                },
          function(a, b) {
                var ret = [a];
                for (var i=0;i<b.length;i++)
                  ret.push(b[i][1]);
                return ret;
              },
          function(a) {return addPositionInfo({type: 'UnaryExpression_PreIncrement', Expression:a});},
          function(a) {return addPositionInfo({type: 'UnaryExpression_PreDecrement', Expression:a});},
          function(a, b) {
                return addPositionInfo({type:'UnaryExpression', op:a, Expression:b});
              },
          function(a) {return addPositionInfo({type:'UnaryExpression_Sizeof_Expr', Expression:a});},
          function(a) {return addPositionInfo({type:'UnaryExpression_Sizeof_Type', TypeName:a});},
          function(a, b) {
                return addPositionInfo({type:'CastExpression', TypeName:a[1], Expression:b});
              },
          function(a, b) {
                return buildRecursiveBinop(a, b);
              },
          function(a, b) {
                var ret = a;
                for (var i=0;i<b.length;i++) {
                  ret = addPositionInfo({type:'ConditionalExpression', cond:ret, t:b[1], f:b[3]});
                }
                return ret;
              },
          function(a, b, c) {
                return addPositionInfo({type:'BinOpExpression', op:b, left:a, right:c});
              },
          function(a) {
                  return a.join('');
                },
          /^[ \n\r\t\x0B\f]/,
          { type: "class", value: "[ \\n\\r\\t\\x0B\\f]", description: "[ \\n\\r\\t\\x0B\\f]" },
          "/*",
          { type: "literal", value: "/*", description: "\"/*\"" },
          "*/",
          { type: "literal", value: "*/", description: "\"*/\"" },
          function(a) {return a.join('');},
          "//",
          { type: "literal", value: "//", description: "\"//\"" },
          "\n",
          { type: "literal", value: "\n", description: "\"\\n\"" },
          "auto",
          { type: "literal", value: "auto", description: "\"auto\"" },
          "break",
          { type: "literal", value: "break", description: "\"break\"" },
          "case",
          { type: "literal", value: "case", description: "\"case\"" },
          "char",
          { type: "literal", value: "char", description: "\"char\"" },
          "const",
          { type: "literal", value: "const", description: "\"const\"" },
          "continue",
          { type: "literal", value: "continue", description: "\"continue\"" },
          "default",
          { type: "literal", value: "default", description: "\"default\"" },
          "double",
          { type: "literal", value: "double", description: "\"double\"" },
          "do",
          { type: "literal", value: "do", description: "\"do\"" },
          "else",
          { type: "literal", value: "else", description: "\"else\"" },
          "enum",
          { type: "literal", value: "enum", description: "\"enum\"" },
          "extern",
          { type: "literal", value: "extern", description: "\"extern\"" },
          "float",
          { type: "literal", value: "float", description: "\"float\"" },
          "for",
          { type: "literal", value: "for", description: "\"for\"" },
          "goto",
          { type: "literal", value: "goto", description: "\"goto\"" },
          "if",
          { type: "literal", value: "if", description: "\"if\"" },
          "int",
          { type: "literal", value: "int", description: "\"int\"" },
          "inline",
          { type: "literal", value: "inline", description: "\"inline\"" },
          "long",
          { type: "literal", value: "long", description: "\"long\"" },
          "register",
          { type: "literal", value: "register", description: "\"register\"" },
          "restrict",
          { type: "literal", value: "restrict", description: "\"restrict\"" },
          "return",
          { type: "literal", value: "return", description: "\"return\"" },
          "short",
          { type: "literal", value: "short", description: "\"short\"" },
          "signed",
          { type: "literal", value: "signed", description: "\"signed\"" },
          "sizeof",
          { type: "literal", value: "sizeof", description: "\"sizeof\"" },
          "static",
          { type: "literal", value: "static", description: "\"static\"" },
          "struct",
          { type: "literal", value: "struct", description: "\"struct\"" },
          "switch",
          { type: "literal", value: "switch", description: "\"switch\"" },
          "typedef",
          { type: "literal", value: "typedef", description: "\"typedef\"" },
          "union",
          { type: "literal", value: "union", description: "\"union\"" },
          "unsigned",
          { type: "literal", value: "unsigned", description: "\"unsigned\"" },
          "void",
          { type: "literal", value: "void", description: "\"void\"" },
          "volatile",
          { type: "literal", value: "volatile", description: "\"volatile\"" },
          "while",
          { type: "literal", value: "while", description: "\"while\"" },
          "_Bool",
          { type: "literal", value: "_Bool", description: "\"_Bool\"" },
          "_Complex",
          { type: "literal", value: "_Complex", description: "\"_Complex\"" },
          "_stdcall",
          { type: "literal", value: "_stdcall", description: "\"_stdcall\"" },
          "__declspec",
          { type: "literal", value: "__declspec", description: "\"__declspec\"" },
          "__attribute__",
          { type: "literal", value: "__attribute__", description: "\"__attribute__\"" },
          "_Imaginary",
          { type: "literal", value: "_Imaginary", description: "\"_Imaginary\"" },
          function(a, b) {return a+b.join('')},
          /^[a-z]/,
          { type: "class", value: "[a-z]", description: "[a-z]" },
          /^[A-Z]/,
          { type: "class", value: "[A-Z]", description: "[A-Z]" },
          /^[_]/,
          { type: "class", value: "[_]", description: "[_]" },
          /^[0-9]/,
          { type: "class", value: "[0-9]", description: "[0-9]" },
          "\\u",
          { type: "literal", value: "\\u", description: "\"\\\\u\"" },
          "\\U",
          { type: "literal", value: "\\U", description: "\"\\\\U\"" },
          /^[1-9]/,
          { type: "class", value: "[1-9]", description: "[1-9]" },
          function(a, b) {return addPositionInfo({type:'DecimalConstant', value:a + b.join("")});},
          "0",
          { type: "literal", value: "0", description: "\"0\"" },
          /^[0-7]/,
          { type: "class", value: "[0-7]", description: "[0-7]" },
          function(a) {
            if (a.length>0)
              return addPositionInfo({type:'OctalConstant', value:a.join("")});
            else
              return addPositionInfo({type:'OctalConstant', value:'0'});
          },
          function(a) {return addPositionInfo({type:'HexConstant', value:a.join("")});},
          "0x",
          { type: "literal", value: "0x", description: "\"0x\"" },
          "0X",
          { type: "literal", value: "0X", description: "\"0X\"" },
          /^[a-f]/,
          { type: "class", value: "[a-f]", description: "[a-f]" },
          /^[A-F]/,
          { type: "class", value: "[A-F]", description: "[A-F]" },
          /^[uU]/,
          { type: "class", value: "[uU]", description: "[uU]" },
          "ll",
          { type: "literal", value: "ll", description: "\"ll\"" },
          "LL",
          { type: "literal", value: "LL", description: "\"LL\"" },
          /^[lL]/,
          { type: "class", value: "[lL]", description: "[lL]" },
          function(a, b) {
                if (b)
                  return addPositionInfo({type:'FloatConstant', Expression:a});
                else
                  return a;
              },
          function(a, b) {return addPositionInfo({type:'DecimalFloatConstant', value:a+b||''});},
          function(a, b) {return addPositionInfo({type:'DecimalFloatConstant', value:a.join('')+b});},
          function(a, b, c) {return addPositionInfo({type:'HexFloatConstant', value:a+b+c||''});},
          function(a, b, c) {return addPositionInfo({type:'HexFloatConstant', value:a+b.join('')+c});},
          ".",
          { type: "literal", value: ".", description: "\".\"" },
          function(a, b) {return a.join('')+'.'+b.join('');},
          function(a) {return a.join('')+'.';},
          /^[eE]/,
          { type: "class", value: "[eE]", description: "[eE]" },
          /^[+\-]/,
          { type: "class", value: "[+\\-]", description: "[+\\-]" },
          function(a, b) {return a+b.join('');},
          /^[pP]/,
          { type: "class", value: "[pP]", description: "[pP]" },
          /^[flFL]/,
          { type: "class", value: "[flFL]", description: "[flFL]" },
          function(a) {return addPositionInfo({type:'EnumerationConstant', Identifier:a});},
          "L",
          { type: "literal", value: "L", description: "\"L\"" },
          "'",
          { type: "literal", value: "'", description: "\"'\"" },
          function(a) {
            return addPositionInfo({type:'CharacterConstant', Char: a});
          },
          /^['\n\\]/,
          { type: "class", value: "['\\n\\\\]", description: "['\\n\\\\]" },
          "\\",
          { type: "literal", value: "\\", description: "\"\\\\\"" },
          /^['"?\\abfnrtv]/,
          { type: "class", value: "['\"?\\\\abfnrtv]", description: "['\"?\\\\abfnrtv]" },
          function(a, b) {return eval('"' + a + b +'"');},
          function(a, b, c, d) {return eval('"' + a + b + c||'' + d||''+'"');},
          "\\x",
          { type: "literal", value: "\\x", description: "\"\\\\x\"" },
          function(a, b) {return eval('"'+a+b.join('')+'"');},
          /^["]/,
          { type: "class", value: "[\"]", description: "[\"]" },
          function(a) {
            return a.join('');
          },
          /^["\n\\]/,
          { type: "class", value: "[\"\\n\\\\]", description: "[\"\\n\\\\]" },
          "[",
          { type: "literal", value: "[", description: "\"[\"" },
          "]",
          { type: "literal", value: "]", description: "\"]\"" },
          "(",
          { type: "literal", value: "(", description: "\"(\"" },
          ")",
          { type: "literal", value: ")", description: "\")\"" },
          "{",
          { type: "literal", value: "{", description: "\"{\"" },
          "}",
          { type: "literal", value: "}", description: "\"}\"" },
          "->",
          { type: "literal", value: "->", description: "\"->\"" },
          "++",
          { type: "literal", value: "++", description: "\"++\"" },
          "--",
          { type: "literal", value: "--", description: "\"--\"" },
          "&",
          { type: "literal", value: "&", description: "\"&\"" },
          /^[&]/,
          { type: "class", value: "[&]", description: "[&]" },
          "*",
          { type: "literal", value: "*", description: "\"*\"" },
          /^[=]/,
          { type: "class", value: "[=]", description: "[=]" },
          "+",
          { type: "literal", value: "+", description: "\"+\"" },
          /^[+=]/,
          { type: "class", value: "[+=]", description: "[+=]" },
          "-",
          { type: "literal", value: "-", description: "\"-\"" },
          /^[\-=>]/,
          { type: "class", value: "[\\-=>]", description: "[\\-=>]" },
          "~",
          { type: "literal", value: "~", description: "\"~\"" },
          "!",
          { type: "literal", value: "!", description: "\"!\"" },
          "/",
          { type: "literal", value: "/", description: "\"/\"" },
          "%",
          { type: "literal", value: "%", description: "\"%\"" },
          /^[=>]/,
          { type: "class", value: "[=>]", description: "[=>]" },
          "<<",
          { type: "literal", value: "<<", description: "\"<<\"" },
          ">>",
          { type: "literal", value: ">>", description: "\">>\"" },
          "<",
          { type: "literal", value: "<", description: "\"<\"" },
          ">",
          { type: "literal", value: ">", description: "\">\"" },
          "<=",
          { type: "literal", value: "<=", description: "\"<=\"" },
          ">=",
          { type: "literal", value: ">=", description: "\">=\"" },
          "==",
          { type: "literal", value: "==", description: "\"==\"" },
          "!=",
          { type: "literal", value: "!=", description: "\"!=\"" },
          "^",
          { type: "literal", value: "^", description: "\"^\"" },
          "|",
          { type: "literal", value: "|", description: "\"|\"" },
          "&&",
          { type: "literal", value: "&&", description: "\"&&\"" },
          "||",
          { type: "literal", value: "||", description: "\"||\"" },
          "?",
          { type: "literal", value: "?", description: "\"?\"" },
          ":",
          { type: "literal", value: ":", description: "\":\"" },
          /^[>]/,
          { type: "class", value: "[>]", description: "[>]" },
          ";",
          { type: "literal", value: ";", description: "\";\"" },
          "...",
          { type: "literal", value: "...", description: "\"...\"" },
          "=",
          { type: "literal", value: "=", description: "\"=\"" },
          "*=",
          { type: "literal", value: "*=", description: "\"*=\"" },
          "/=",
          { type: "literal", value: "/=", description: "\"/=\"" },
          "%=",
          { type: "literal", value: "%=", description: "\"%=\"" },
          "+=",
          { type: "literal", value: "+=", description: "\"+=\"" },
          "-=",
          { type: "literal", value: "-=", description: "\"-=\"" },
          "<<=",
          { type: "literal", value: "<<=", description: "\"<<=\"" },
          ">>=",
          { type: "literal", value: ">>=", description: "\">>=\"" },
          "&=",
          { type: "literal", value: "&=", description: "\"&=\"" },
          "^=",
          { type: "literal", value: "^=", description: "\"^=\"" },
          "|=",
          { type: "literal", value: "|=", description: "\"|=\"" },
          ",",
          { type: "literal", value: ",", description: "\",\"" },
          { type: "any", description: "any character" }
        ],

        peg$bytecode = [
          peg$decode("!7]+K$ !7!+&$,#&7!\"\"\"  +2%7\xD6+(%4#6\"#!!%$##  $\"#  \"#  "),
          peg$decode("7\"*# \"7,"),
          peg$decode("!7-+O$7=+E%7#*# \" #+5%7'++%4$6$$$#\"! %$$#  $##  $\"#  \"#  "),
          peg$decode("! !7,+&$,#&7,\"\"\"  +' 4!6%!! %"),
          peg$decode("7%*# \"7,"),
          peg$decode("7&*; \"7'*5 \"7(*/ \"7)*) \"7**# \"7+"),
          peg$decode("!7c+<$7Y+2%7\xC7+(%4#6&#!!%$##  $\"#  \"#  *< \"!7g+1$7\xC7+'%4\"6'\" %$\"#  \"#  "),
          peg$decode("!7\xAC+P$ !7%*# \"7,,)&7%*# \"7,\"+2%7\xAD+(%4#6(#!!%$##  $\"#  \"#  "),
          peg$decode("!7\\*# \" #+2$7\xC8+(%4\"6)\"!!%$\"#  \"#  "),
          peg$decode("!7p+w$7\xAA+m%7\\+c%7\xAB+Y%7%+O%!7j+-$7%+#%'\"%$\"#  \"#  *# \" #+*%4&6*&##! %$&#  $%#  $$#  $##  $\"#  \"#  *\\ \"!7|+Q$7\xAA+G%7\\+=%7\xAB+3%7%+)%4%6+%\"\" %$%#  $$#  $##  $\"#  \"#  "),
          peg$decode("!7\x82+Q$7\xAA+G%7\\+=%7\xAB+3%7%+)%4%6,%\"\" %$%#  $$#  $##  $\"#  \"#  *\xE7 \"!7i+e$7%+[%7\x82+Q%7\xAA+G%7\\+=%7\xAB+3%7\xC8+)%4'6-'\"%\"%$'#  $&#  $%#  $$#  $##  $\"#  \"#  *\x94 \"!7n+\x89$7\xAA+%7,*# \"7(*# \" #+i%7\\*# \" #+Y%7\xC8+O%7\\*# \" #+?%7\xAB+5%7%++%4(6.($%$\" %$(#  $'#  $&#  $%#  $$#  $##  $\"#  \"#  "),
          peg$decode("!7o+<$7\x89+2%7\xC8+(%4#6/#!!%$##  $\"#  \"#  *\x8B \"!7f+1$7\xC8+'%4\"60\" %$\"#  \"#  *l \"!7b+1$7\xC8+'%4\"61\" %$\"#  \"#  *M \"!7v+B$7\\*# \" #+2%7\xC8+(%4#62#!!%$##  $\"#  \"#  "),
          peg$decode("!7-+C$7.*# \" #+3%7\xC8+)%4#63#\"\"!%$##  $\"#  \"#  "),
          peg$decode("!! !70*) \"7;*# \"7<,/&70*) \"7;*# \"7<\"+^$7\x89+T% !70*) \"7;*# \"7<,/&70*) \"7;*# \"7<\"+*%4#64##\"! %$##  $\"#  \"#  +' 4!65!! %*\xC2 \"! !!70+' 4!66!! %*S \"!71+' 4!66!! %*A \"!7;+' 4!66!! %*/ \"!7<+' 4!66!! %+h$,e&!70+' 4!66!! %*S \"!71+' 4!66!! %*A \"!7;+' 4!66!! %*/ \"!7<+' 4!66!! %\"\"\"  +' 4!67!! %"),
          peg$decode("!7/+o$ !!7\xD5+2$7/+(%4\"68\"! %$\"#  \"#  ,=&!7\xD5+2$7/+(%4\"68\"! %$\"#  \"#  \"+)%4\"69\"\"! %$\"#  \"#  "),
          peg$decode("!7=+S$!7\xCA+2$7G+(%4\"68\"! %$\"#  \"#  *# \" #+)%4\"6:\"\"! %$\"#  \"#  "),
          peg$decode("!7}*\xC6 \"7l*\xC0 \"7z*\xBA \"7a*\xB4 \"7t*\xAE \"!7\x87+\xA3$7\xAA+\x99%7\xAA+\x8F% !!!87\xAB9*$$\"\" ;\"#  +-$7\xD7+#%'\"%$\"#  \"#  ,F&!!87\xAB9*$$\"\" ;\"#  +-$7\xD7+#%'\"%$\"#  \"#  \"+7%7\xAB+-%7\xAB+#%'&%$&#  $%#  $$#  $##  $\"#  \"#  +' 4!6<!! %"),
          peg$decode("!7\x80*e \"7d*_ \"7w*Y \"7q*S \"7s*M \"7m*G \"7h*A \"7x*; \"7*5 \"7\x83*/ \"7\x84*) \"72*# \"78+' 4!6<!! %"),
          peg$decode("!73+v$!7\x89*# \" #+U$7\xAC+K% !74+&$,#&74\"\"\"  +2%7\xAD+(%4$67$!#%$$#  $##  $\"#  \"#  *# \"7\x89+#%'\"%$\"#  \"#  "),
          peg$decode("!7{*# \"7~+' 4!66!! %"),
          peg$decode("!75+7$76+-%7\xC8+#%'#%$##  $\"#  \"#  "),
          peg$decode("! !7;,#&7;\"+?$7\x89+5% !7;,#&7;\"+#%'#%$##  $\"#  \"#  *> \" !71*# \"7;+,$,)&71*# \"7;\"\"\"  "),
          peg$decode("!77+_$ !!7\xD5+-$77+#%'\"%$\"#  \"#  ,8&!7\xD5+-$77+#%'\"%$\"#  \"#  \"+#%'\"%$\"#  \"#  "),
          peg$decode("!7=*# \" #+7$7\xC7+-%7Y+#%'#%$##  $\"#  \"#  *# \"7="),
          peg$decode("!7k+r$!7\x89*# \" #+Q$7\xAC+G%79+=%7\xD5*# \" #+-%7\xAD+#%'%%$%#  $$#  $##  $\"#  \"#  *# \"7\x89+#%'\"%$\"#  \"#  "),
          peg$decode("!7:+_$ !!7\xD5+-$7:+#%'\"%$\"#  \"#  ,8&!7\xD5+-$7:+#%'\"%$\"#  \"#  \"+#%'\"%$\"#  \"#  "),
          peg$decode("!7\x9F+H$!7\xCA+-$7Y+#%'\"%$\"#  \"#  *# \" #+#%'\"%$\"#  \"#  "),
          peg$decode("!7e+' 4!6<!! %"),
          peg$decode("!7r*# \"7\x85+' 4!6<!! %"),
          peg$decode("!7?*# \" #+3$7>+)%4\"6=\"\"! %$\"#  \"#  "),
          peg$decode("!!7\x89+' 4!6>!! %*G \"!7\xAA+<$7=+2%7\xAB+(%4#66#!!%$##  $\"#  \"#  +\u030B$ !!7\xA8+U$ !7;,#&7;\"+C%7Z*# \" #+3%7\xA9+)%4$6?$\"\"!%$$#  $##  $\"#  \"#  *\u0148 \"!7\xA8+Y$7z+O% !7;,#&7;\"+=%7Z+3%7\xA9+)%4%6@%\"\"!%$%#  $$#  $##  $\"#  \"#  *\u0101 \"!7\xA8+`$ !7;+&$,#&7;\"\"\"  +G%7z+=%7Z+3%7\xA9+)%4%6@%\"#!%$%#  $$#  $##  $\"#  \"#  *\xB3 \"!7\xA8+N$ !7;,#&7;\"+<%7\xB3+2%7\xA9+(%4$6A$!\"%$$#  $##  $\"#  \"#  *w \"!7\xAA+<$7@+2%7\xAB+(%4#6B#!!%$##  $\"#  \"#  *M \"!7\xAA+B$7C*# \" #+2%7\xAB+(%4#6C#!!%$##  $\"#  \"#  ,\u018B&!7\xA8+U$ !7;,#&7;\"+C%7Z*# \" #+3%7\xA9+)%4$6?$\"\"!%$$#  $##  $\"#  \"#  *\u0148 \"!7\xA8+Y$7z+O% !7;,#&7;\"+=%7Z+3%7\xA9+)%4%6@%\"\"!%$%#  $$#  $##  $\"#  \"#  *\u0101 \"!7\xA8+`$ !7;+&$,#&7;\"\"\"  +G%7z+=%7Z+3%7\xA9+)%4%6@%\"#!%$%#  $$#  $##  $\"#  \"#  *\xB3 \"!7\xA8+N$ !7;,#&7;\"+<%7\xB3+2%7\xA9+(%4$6A$!\"%$$#  $##  $\"#  \"#  *w \"!7\xAA+<$7@+2%7\xAB+(%4#6B#!!%$##  $\"#  \"#  *M \"!7\xAA+B$7C*# \" #+2%7\xAB+(%4#6C#!!%$##  $\"#  \"#  \"+)%4\"6D\"\"! %$\"#  \"#  "),
          peg$decode(" !!7\xB3+:$ !7;,#&7;\"+(%4\"66\"! %$\"#  \"#  +H$,E&!7\xB3+:$ !7;,#&7;\"+(%4\"66\"! %$\"#  \"#  \"\"\"  "),
          peg$decode("!7A+N$!7\xD5+-$7\xC9+#%'\"%$\"#  \"#  *# \" #+)%4\"6E\"\"! %$\"#  \"#  "),
          peg$decode("!7B+o$ !!7\xD5+2$7B+(%4\"66\"! %$\"#  \"#  ,=&!7\xD5+2$7B+(%4\"66\"! %$\"#  \"#  \"+)%4\"69\"\"! %$\"#  \"#  "),
          peg$decode("!7-+?$7=*# \"7E*# \" #+)%4\"6F\"\"! %$\"#  \"#  "),
          peg$decode("!7\x89+o$ !!7\xD5+2$7\x89+(%4\"68\"! %$\"#  \"#  ,=&!7\xD5+2$7\x89+(%4\"68\"! %$\"#  \"#  \"+)%4\"69\"\"! %$\"#  \"#  "),
          peg$decode("!75+3$7E*# \" #+#%'\"%$\"#  \"#  "),
          peg$decode("!7?*# \" #+-$7F+#%'\"%$\"#  \"#  *# \"7?"),
          peg$decode("!!7\xAA+7$7E+-%7\xAB+#%'#%$##  $\"#  \"#  *y \"!7\xA8+C$7Z*# \"7\xB3*# \" #+-%7\xA9+#%'#%$##  $\"#  \"#  *H \"!7\xAA+=$7@*# \" #+-%7\xAB+#%'#%$##  $\"#  \"#  +\xE1$ !!7\xA8+C$7Z*# \"7\xB3*# \" #+-%7\xA9+#%'#%$##  $\"#  \"#  *H \"!7\xAA+=$7@*# \" #+-%7\xAB+#%'#%$##  $\"#  \"#  ,y&!7\xA8+C$7Z*# \"7\xB3*# \" #+-%7\xA9+#%'#%$##  $\"#  \"#  *H \"!7\xAA+=$7@*# \" #+-%7\xAB+#%'#%$##  $\"#  \"#  \"+#%'\"%$\"#  \"#  "),
          peg$decode("!7Z+' 4!6G!! %*W \"!7\xAC+L$7H+B%7\xD5*# \" #+2%7\xAD+(%4$6H$!\"%$$#  $##  $\"#  \"#  "),
          peg$decode("!7G+o$ !!7\xD5+2$7G+(%4\"66\"! %$\"#  \"#  ,=&!7\xD5+2$7G+(%4\"66\"! %$\"#  \"#  \"+)%4\"6I\"\"! %$\"#  \"#  "),
          peg$decode("!7\x89+' 4!6J!! %*k \"!7\x8E+' 4!6K!! %*Y \"!7\xA6+' 4!6L!! %*G \"!7\xAA+<$7\\+2%7\xAB+(%4#6M#!!%$##  $\"#  \"#  "),
          peg$decode("!7I+\u01AB$ !!7\xA8+<$7\\+2%7\xA9+(%4#6N#!!%$##  $\"#  \"#  *\xB1 \"!7\xAA+B$7K*# \" #+2%7\xAB+(%4#6O#!!%$##  $\"#  \"#  *\x81 \"!7\xAE+2$7\x89+(%4\"6P\"! %$\"#  \"#  *a \"!7\xAF+2$7\x89+(%4\"6Q\"! %$\"#  \"#  *A \"!7\xB0+' 4!6R!! %*/ \"!7\xB1+' 4!6S!! %,\xDB&!7\xA8+<$7\\+2%7\xA9+(%4#6N#!!%$##  $\"#  \"#  *\xB1 \"!7\xAA+B$7K*# \" #+2%7\xAB+(%4#6O#!!%$##  $\"#  \"#  *\x81 \"!7\xAE+2$7\x89+(%4\"6P\"! %$\"#  \"#  *a \"!7\xAF+2$7\x89+(%4\"6Q\"! %$\"#  \"#  *A \"!7\xB0+' 4!6R!! %*/ \"!7\xB1+' 4!6S!! %\"+)%4\"6T\"\"! %$\"#  \"#  "),
          peg$decode("!7Z+e$ !!7\xD5+-$7Z+#%'\"%$\"#  \"#  ,8&!7\xD5+-$7Z+#%'\"%$\"#  \"#  \"+)%4\"6U\"\"! %$\"#  \"#  "),
          peg$decode("7J*\xD4 \"!7\xB0+2$7L+(%4\"6V\"! %$\"#  \"#  *\xB4 \"!7\xB1+2$7L+(%4\"6W\"! %$\"#  \"#  *\x94 \"!7M+3$7N+)%4\"6X\"\"! %$\"#  \"#  *s \"!7y+h$!7L+' 4!6Y!! %*G \"!7\xAA+<$7D+2%7\xAB+(%4#6Z#!!%$##  $\"#  \"#  +(%4\"66\"! %$\"#  \"#  "),
          peg$decode("7\xB2*; \"7\xB3*5 \"7\xB4*/ \"7\xB5*) \"7\xB6*# \"7\xB7"),
          peg$decode("7L*] \"!!7\xAA+7$7D+-%7\xAB+#%'#%$##  $\"#  \"#  +3$7N+)%4\"6[\"\"! %$\"#  \"#  "),
          peg$decode("!7N+}$ !!7\xB3*) \"7\xB8*# \"7\xB9+-$7N+#%'\"%$\"#  \"#  ,D&!7\xB3*) \"7\xB8*# \"7\xB9+-$7N+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7O+q$ !!7\xB4*# \"7\xB5+-$7O+#%'\"%$\"#  \"#  ,>&!7\xB4*# \"7\xB5+-$7O+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7P+q$ !!7\xBA*# \"7\xBB+-$7P+#%'\"%$\"#  \"#  ,>&!7\xBA*# \"7\xBB+-$7P+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7Q+\x89$ !!7\xBE*/ \"7\xBF*) \"7\xBC*# \"7\xBD+-$7Q+#%'\"%$\"#  \"#  ,J&!7\xBE*/ \"7\xBF*) \"7\xBC*# \"7\xBD+-$7Q+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7R+q$ !!7\xC0*# \"7\xC1+-$7R+#%'\"%$\"#  \"#  ,>&!7\xC0*# \"7\xC1+-$7R+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7S+e$ !!7\xB2+-$7S+#%'\"%$\"#  \"#  ,8&!7\xB2+-$7S+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7T+e$ !!7\xC2+-$7T+#%'\"%$\"#  \"#  ,8&!7\xC2+-$7T+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7U+e$ !!7\xC3+-$7U+#%'\"%$\"#  \"#  ,8&!7\xC3+-$7U+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7V+e$ !!7\xC4+-$7V+#%'\"%$\"#  \"#  ,8&!7\xC4+-$7V+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7W+e$ !!7\xC5+-$7W+#%'\"%$\"#  \"#  ,8&!7\xC5+-$7W+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("!7X+\x8D$ !!7\xC6+A$7\\+7%7\xC7+-%7X+#%'$%$$#  $##  $\"#  \"#  ,L&!7\xC6+A$7\\+7%7\xC7+-%7X+#%'$%$$#  $##  $\"#  \"#  \"+)%4\"6]\"\"! %$\"#  \"#  "),
          peg$decode("!7L+>$7[+4%7Z+*%4#6^##\"! %$##  $\"#  \"#  *# \"7Y"),
          peg$decode("7\xCA*Y \"7\xCB*S \"7\xCC*M \"7\xCD*G \"7\xCE*A \"7\xCF*; \"7\xD0*5 \"7\xD1*/ \"7\xD2*) \"7\xD3*# \"7\xD4"),
          peg$decode("!7Z+e$ !!7\xD5+-$7Z+#%'\"%$\"#  \"#  ,8&!7\xD5+-$7Z+#%'\"%$\"#  \"#  \"+)%4\"6\\\"\"! %$\"#  \"#  "),
          peg$decode("! !7^*) \"7_*# \"7`,/&7^*) \"7_*# \"7`\"+' 4!6_!! %"),
          peg$decode("!0`\"\"1!3a+' 4!66!! %"),
          peg$decode("!.b\"\"2b3c+\x9C$ !!!8.d\"\"2d3e9*$$\"\" ;\"#  +-$7\xD7+#%'\"%$\"#  \"#  ,L&!!8.d\"\"2d3e9*$$\"\" ;\"#  +-$7\xD7+#%'\"%$\"#  \"#  \"+8%.d\"\"2d3e+(%4#6f#!!%$##  $\"#  \"#  "),
          peg$decode("!.g\"\"2g3h+\x8C$ !!!8.i\"\"2i3j9*$$\"\" ;\"#  +-$7\xD7+#%'\"%$\"#  \"#  ,L&!!8.i\"\"2i3j9*$$\"\" ;\"#  +-$7\xD7+#%'\"%$\"#  \"#  \"+(%4\"6f\"! %$\"#  \"#  "),
          peg$decode("!.k\"\"2k3l+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.m\"\"2m3n+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.o\"\"2o3p+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.q\"\"2q3r+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.s\"\"2s3t+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.u\"\"2u3v+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.w\"\"2w3x+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.y\"\"2y3z+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.{\"\"2{3|+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.}\"\"2}3~+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\"\"23\x80+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x81\"\"2\x813\x82+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x83\"\"2\x833\x84+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x85\"\"2\x853\x86+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x87\"\"2\x873\x88+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x89\"\"2\x893\x8A+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x8B\"\"2\x8B3\x8C+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x8D\"\"2\x8D3\x8E+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x8F\"\"2\x8F3\x90+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x91\"\"2\x913\x92+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x93\"\"2\x933\x94+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x95\"\"2\x953\x96+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x97\"\"2\x973\x98+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x99\"\"2\x993\x9A+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x9B\"\"2\x9B3\x9C+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x9D\"\"2\x9D3\x9E+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x9F\"\"2\x9F3\xA0+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xA1\"\"2\xA13\xA2+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xA3\"\"2\xA33\xA4+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xA5\"\"2\xA53\xA6+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xA7\"\"2\xA73\xA8+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xA9\"\"2\xA93\xAA+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xAB\"\"2\xAB3\xAC+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xAD\"\"2\xAD3\xAE+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xAF\"\"2\xAF3\xB0+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xB1\"\"2\xB13\xB2+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xB3\"\"2\xB33\xB4+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xB5\"\"2\xB53\xB6+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xB7\"\"2\xB73\xB8+J$!87\x8B9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.k\"\"2k3l*\u01F1 \".m\"\"2m3n*\u01E5 \".o\"\"2o3p*\u01D9 \".q\"\"2q3r*\u01CD \".s\"\"2s3t*\u01C1 \".u\"\"2u3v*\u01B5 \".w\"\"2w3x*\u01A9 \".y\"\"2y3z*\u019D \".{\"\"2{3|*\u0191 \".}\"\"2}3~*\u0185 \".\"\"23\x80*\u0179 \".\x81\"\"2\x813\x82*\u016D \".\x83\"\"2\x833\x84*\u0161 \".\x85\"\"2\x853\x86*\u0155 \".\x87\"\"2\x873\x88*\u0149 \".\x89\"\"2\x893\x8A*\u013D \".\x8B\"\"2\x8B3\x8C*\u0131 \".\x8D\"\"2\x8D3\x8E*\u0125 \".\x8F\"\"2\x8F3\x90*\u0119 \".\x91\"\"2\x913\x92*\u010D \".\x93\"\"2\x933\x94*\u0101 \".\x95\"\"2\x953\x96*\xF5 \".\x97\"\"2\x973\x98*\xE9 \".\x99\"\"2\x993\x9A*\xDD \".\x9B\"\"2\x9B3\x9C*\xD1 \".\x9D\"\"2\x9D3\x9E*\xC5 \".\x9F\"\"2\x9F3\xA0*\xB9 \".\xA1\"\"2\xA13\xA2*\xAD \".\xA3\"\"2\xA33\xA4*\xA1 \".\xA5\"\"2\xA53\xA6*\x95 \".\xA7\"\"2\xA73\xA8*\x89 \".\xA9\"\"2\xA93\xAA*} \".\xAB\"\"2\xAB3\xAC*q \".\xAD\"\"2\xAD3\xAE*e \".\xAF\"\"2\xAF3\xB0*Y \".\xB1\"\"2\xB13\xB2*M \".\xB9\"\"2\xB93\xBA*A \".\xB3\"\"2\xB33\xB4*5 \".\xB5\"\"2\xB53\xB6*) \".\xB7\"\"2\xB73\xB8+;$!87\x8B9*$$\"\" ;\"#  +#%'\"%$\"#  \"#  "),
          peg$decode("!!87\x889*$$\"\" ;\"#  +O$7\x8A+E% !7\x8B,#&7\x8B\"+3%7]+)%4$6\xBB$\"\"!%$$#  $##  $\"#  \"#  "),
          peg$decode("0\xBC\"\"1!3\xBD*; \"0\xBE\"\"1!3\xBF*/ \"0\xC0\"\"1!3\xC1*# \"7\x8C"),
          peg$decode("0\xBC\"\"1!3\xBD*G \"0\xBE\"\"1!3\xBF*; \"0\xC2\"\"1!3\xC3*/ \"0\xC0\"\"1!3\xC1*# \"7\x8C"),
          peg$decode("!.\xC4\"\"2\xC43\xC5+-$7\x8D+#%'\"%$\"#  \"#  *H \"!.\xC6\"\"2\xC63\xC7+7$7\x8D+-%7\x8D+#%'#%$##  $\"#  \"#  "),
          peg$decode("!7\x94+A$7\x94+7%7\x94+-%7\x94+#%'$%$$#  $##  $\"#  \"#  "),
          peg$decode("!7\x97*/ \"7\x8F*) \"7\x9F*# \"7\xA0+' 4!66!! %"),
          peg$decode("!7\x90*) \"7\x92*# \"7\x91+B$7\x95*# \" #+2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!0\xC8\"\"1!3\xC9+G$ !0\xC2\"\"1!3\xC3,)&0\xC2\"\"1!3\xC3\"+)%4\"6\xCA\"\"! %$\"#  \"#  "),
          peg$decode("!.\xCB\"\"2\xCB3\xCC+F$ !0\xCD\"\"1!3\xCE,)&0\xCD\"\"1!3\xCE\"+(%4\"6\xCF\"! %$\"#  \"#  "),
          peg$decode("!7\x93+A$ !7\x94+&$,#&7\x94\"\"\"  +(%4\"6\xD0\"! %$\"#  \"#  "),
          peg$decode(".\xD1\"\"2\xD13\xD2*) \".\xD3\"\"2\xD33\xD4"),
          peg$decode("0\xD5\"\"1!3\xD6*5 \"0\xD7\"\"1!3\xD8*) \"0\xC2\"\"1!3\xC3"),
          peg$decode("!0\xD9\"\"1!3\xDA+3$7\x96*# \" #+#%'\"%$\"#  \"#  *D \"!7\x96+9$0\xD9\"\"1!3\xDA*# \" #+#%'\"%$\"#  \"#  "),
          peg$decode(".\xDB\"\"2\xDB3\xDC*5 \".\xDD\"\"2\xDD3\xDE*) \"0\xDF\"\"1!3\xE0"),
          peg$decode("!7\x98*# \"7\x99+C$7\x9E*# \" #+3%7]+)%4#6\xE1#\"\"!%$##  $\"#  \"#  "),
          peg$decode("!7\x9A+9$7\x9C*# \" #+)%4\"6\xE2\"\"! %$\"#  \"#  *Y \"! !0\xC2\"\"1!3\xC3+,$,)&0\xC2\"\"1!3\xC3\"\"\"  +3$7\x9C+)%4\"6\xE3\"\"! %$\"#  \"#  "),
          peg$decode("!7\x93+D$7\x9B+:%7\x9D*# \" #+*%4#6\xE4##\"! %$##  $\"#  \"#  *X \"!7\x93+M$ !7\x94+&$,#&7\x94\"\"\"  +4%7\x9D+*%4#6\xE5##\"! %$##  $\"#  \"#  "),
          peg$decode("! !0\xC2\"\"1!3\xC3,)&0\xC2\"\"1!3\xC3\"+^$.\xE6\"\"2\xE63\xE7+N% !0\xC2\"\"1!3\xC3+,$,)&0\xC2\"\"1!3\xC3\"\"\"  +)%4#6\xE8#\"\" %$##  $\"#  \"#  *^ \"! !0\xC2\"\"1!3\xC3+,$,)&0\xC2\"\"1!3\xC3\"\"\"  +8$.\xE6\"\"2\xE63\xE7+(%4\"6f\"!!%$\"#  \"#  "),
          peg$decode("! !7\x94,#&7\x94\"+R$.\xE6\"\"2\xE63\xE7+B% !7\x94+&$,#&7\x94\"\"\"  +)%4#6\xE8#\"\" %$##  $\"#  \"#  *R \"! !7\x94+&$,#&7\x94\"\"\"  +8$.\xE6\"\"2\xE63\xE7+(%4\"6\xE9\"!!%$\"#  \"#  "),
          peg$decode("!0\xEA\"\"1!3\xEB+d$0\xEC\"\"1!3\xED*# \" #+N% !0\xC2\"\"1!3\xC3+,$,)&0\xC2\"\"1!3\xC3\"\"\"  +)%4#6\xEE#\"\" %$##  $\"#  \"#  "),
          peg$decode("!0\xEF\"\"1!3\xF0+d$0\xEC\"\"1!3\xED*# \" #+N% !0\xC2\"\"1!3\xC3+,$,)&0\xC2\"\"1!3\xC3\"\"\"  +)%4#6\xEE#\"\" %$##  $\"#  \"#  "),
          peg$decode("!0\xF1\"\"1!3\xF2+' 4!66!! %"),
          peg$decode("!7\x89+' 4!6\xF3!! %"),
          peg$decode("!.\xF4\"\"2\xF43\xF5*# \" #+d$.\xF6\"\"2\xF63\xF7+T% !7\xA1,#&7\xA1\"+B%.\xF6\"\"2\xF63\xF7+2%7]+(%4%6\xF8%!\"%$%#  $$#  $##  $\"#  \"#  "),
          peg$decode("!7\xA2+' 4!66!! %*Q \"!!80\xF9\"\"1!3\xFA9*$$\"\" ;\"#  +2$7\xD7+(%4\"66\"! %$\"#  \"#  "),
          peg$decode("!7\xA3*/ \"7\xA4*) \"7\xA5*# \"7\x8C+' 4!66!! %"),
          peg$decode("!.\xFB\"\"2\xFB3\xFC+9$0\xFD\"\"1!3\xFE+)%4\"6\xFF\"\"! %$\"#  \"#  "),
          peg$decode("!.\xFB\"\"2\xFB3\xFC+g$0\xCD\"\"1!3\xCE+W%0\xCD\"\"1!3\xCE*# \" #+A%0\xCD\"\"1!3\xCE*# \" #++%4$6\u0100$$#\"! %$$#  $##  $\"#  \"#  "),
          peg$decode("!.\u0101\"\"2\u01013\u0102+B$ !7\x94+&$,#&7\x94\"\"\"  +)%4\"6\u0103\"\"! %$\"#  \"#  "),
          peg$decode("!.\xF4\"\"2\xF43\xF5*# \" #+\xC5$ !!0\u0104\"\"1!3\u0105+T$ !7\xA7,#&7\xA7\"+B%0\u0104\"\"1!3\u0105+2%7]+(%4$6f$!\"%$$#  $##  $\"#  \"#  +h$,e&!0\u0104\"\"1!3\u0105+T$ !7\xA7,#&7\xA7\"+B%0\u0104\"\"1!3\u0105+2%7]+(%4$6f$!\"%$$#  $##  $\"#  \"#  \"\"\"  +(%4\"6\u0106\"! %$\"#  \"#  "),
          peg$decode("7\xA2*Q \"!!80\u0107\"\"1!3\u01089*$$\"\" ;\"#  +2$7\xD7+(%4\"66\"! %$\"#  \"#  "),
          peg$decode("!.\u0109\"\"2\u01093\u010A+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u010B\"\"2\u010B3\u010C+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u010D\"\"2\u010D3\u010E+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u010F\"\"2\u010F3\u0110+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0111\"\"2\u01113\u0112+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0113\"\"2\u01133\u0114+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\xE6\"\"2\xE63\xE7+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0115\"\"2\u01153\u0116+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0117\"\"2\u01173\u0118+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0119\"\"2\u01193\u011A+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u011B\"\"2\u011B3\u011C+P$!80\u011D\"\"1!3\u011E9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u011F\"\"2\u011F3\u0120+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0123\"\"2\u01233\u0124+P$!80\u0125\"\"1!3\u01269*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0127\"\"2\u01273\u0128+P$!80\u0129\"\"1!3\u012A9*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u012B\"\"2\u012B3\u012C+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u012D\"\"2\u012D3\u012E+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u012F\"\"2\u012F3\u0130+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0131\"\"2\u01313\u0132+P$!80\u0133\"\"1!3\u01349*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0135\"\"2\u01353\u0136+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0137\"\"2\u01373\u0138+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0139\"\"2\u01393\u013A+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u013B\"\"2\u013B3\u013C+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u013D\"\"2\u013D3\u013E+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u013F\"\"2\u013F3\u0140+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0141\"\"2\u01413\u0142+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0143\"\"2\u01433\u0144+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0145\"\"2\u01453\u0146+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0147\"\"2\u01473\u0148+P$!80\u0121\"\"1!3\u01229*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0149\"\"2\u01493\u014A+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u014B\"\"2\u014B3\u014C+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u014D\"\"2\u014D3\u014E+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u014F\"\"2\u014F3\u0150+P$!80\u0151\"\"1!3\u01529*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0153\"\"2\u01533\u0154+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0155\"\"2\u01553\u0156+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0157\"\"2\u01573\u0158+P$!8.\u0157\"\"2\u01573\u01589*$$\"\" ;\"#  +2%7]+(%4#66#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\u0159\"\"2\u01593\u015A+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u015B\"\"2\u015B3\u015C+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u015D\"\"2\u015D3\u015E+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u015F\"\"2\u015F3\u0160+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0161\"\"2\u01613\u0162+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0163\"\"2\u01633\u0164+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0165\"\"2\u01653\u0166+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0167\"\"2\u01673\u0168+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u0169\"\"2\u01693\u016A+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u016B\"\"2\u016B3\u016C+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!.\u016D\"\"2\u016D3\u016E+2$7]+(%4\"66\"!!%$\"#  \"#  "),
          peg$decode("!87\xD79*$$\"\" ;\"#  "),
          peg$decode("-\"\"1!3\u016F")
        ],

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$decode(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function peg$parseRule(index) {
      var bc    = peg$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      function protect(object) {
        return Object.prototype.toString.apply(object) === "[object Array]" ? [] : object;
      }

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(protect(peg$consts[bc[ip + 1]]));
              ip += 2;
              break;

            case 1:
              stack.push(peg$currPos);
              ip++;
              break;

            case 2:
              stack.pop();
              ip++;
              break;

            case 3:
              peg$currPos = stack.pop();
              ip++;
              break;

            case 4:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 5:
              stack.splice(-2, 1);
              ip++;
              break;

            case 6:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 7:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 8:
              stack.pop();
              stack.push(input.substring(stack[stack.length - 1], peg$currPos));
              ip++;
              break;

            case 9:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 10:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 11:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 12:
              if (stack[stack.length - 1] !== peg$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > peg$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 16:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 17:
              stack.push(input.substr(peg$currPos, bc[ip + 1]));
              peg$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 18:
              stack.push(peg$consts[bc[ip + 1]]);
              peg$currPos += peg$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 19:
              stack.push(peg$FAILED);
              if (peg$silentFails === 0) {
                peg$fail(peg$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 20:
              peg$reportedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 21:
              peg$reportedPos = peg$currPos;
              ip++;
              break;

            case 22:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                peg$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 23:
              stack.push(peg$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 24:
              peg$silentFails++;
              ip++;
              break;

            case 25:
              peg$silentFails--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      return stack[0];
    }


    function buildRecursiveBinop(a, b){
      var ret = a;
      for (var i=0; i<b.length; i++) {
        ret = addPositionInfo({type:'BinOpExpression', left:ret, op:b[i][0], right:b[i][1]});
      }
      return ret;
    };

    function addPositionInfo(r){
        var posDetails = peg$computePosDetails(peg$currPos);
        r.line = posDetails.line;
        r.column = posDetails.column;
        return r;
    }


    peg$result = peg$parseRule(peg$startRuleIndex);

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();

var ast = module.exports;
function _skipSpace(s) {
	var r = /^\s*/.exec(s);
	if (r && r.length > 0) {
		s = s.substring(r[0].length);
	}
	return s;
}

function _read(rt, reg, buf, type) {
	var r = reg.exec(buf);
	if (!r || r.length === 0) {
		throw 'input format mismatch ' + rt.makeTypeString(type) + ' with buffer=' + buf;
	}
	return r;
}

module.exports = {
	/*
	 * istream is an object with drain method that returns a string
	 *
	 * ostream is an object with write method that accepts a string
	 */
	load: function(rt, stdio) {
		var type = rt.newClass('istream');
		var cin = {
			t: type,
			v: {
				buf: '',
				istream: stdio,
			},
			left: false,
		};
		rt.scope[0]['cin'] = cin;
		rt.types[rt.getTypeSigniture(type)] = {
			'#father': 'object',
			'>>': {
				'#default': function(rt, _cin, t) {
					if (!rt.isPrimitiveType(t.t))
						throw '>> operator in istream cannot accept ' + rt.makeTypeString(t.t);
					if (!t.left)
						throw 'only left value can be used as storage';
					var b = _cin.v.buf;
					var r, v;
					if (b.length === 0) {
						b = _cin.v.istream.drain();
						if (b === null) {
							return rt.val(rt.boolTypeLiteral, false);
						}
					}
					switch (t.t.name) {
						case 'char':
						case 'signed char':
						case 'unsigned char':
							b = _skipSpace(b);
							r = _read(rt, /^./, b, t.t);
							v = r[0].charCodeAt(0);
							break;
						case 'short':
						case 'short int':
						case 'signed short':
						case 'signed short int':
						case 'unsigned short':
						case 'unsigned short int':
						case 'int':
						case 'signed int':
						case 'unsigned':
						case 'unsigned int':
						case 'long':
						case 'long int':
						case 'long int':
						case 'signed long':
						case 'signed long int':
						case 'unsigned long':
						case 'unsigned long int':
						case 'long long':
						case 'long long int':
						case 'long long int':
						case 'signed long long':
						case 'signed long long int':
						case 'unsigned long long':
						case 'unsigned long long int':
							b = _skipSpace(b);
							r = _read(rt, /^[-+]?(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)|0/, b, t.t);
							v = parseInt(r[0]);
							break;
						case 'float':
						case 'double':
							b = _skipSpace(b);
							r = _read(rt, /^[-+]?(?:[0-9]*\.[0-9]+([eE][-+]?[0-9]+)?)|(?:([1-9][0-9]*)([eE]\+?[0-9]+)?)/, b, t.t)
							v = parseFloat(r[0]);
							break;
						case 'bool':
							b = _skipSpace(b);
							r = _read(rt, /^(true|false)/, b, t.t);
							v = r[0] === 'true';
							break;
						default:
							throw '>> operator in istream cannot accept ' + rt.makeTypeString(t.t);
					}
					var len = r[0].length;
					t.v = v;
					_cin.v.buf = b.substring(len);
					return _cin;
				}
			}
		};

		var type = rt.newClass('ostream');
		var cout = {
			t: rt.simpleType('ostream'),
			v: {
				ostream: stdio,
			},
			left: false,
		};
		rt.scope[0]['cout'] = cout;
		rt.types[rt.getTypeSigniture(cout.t)] = {
			'#father': 'object',
			'<<': {
				'#default': function(rt, _cout, t) {
					var r;
					if (rt.isPrimitiveType(t.t))
						r = t.v.toString();
					else
						throw '<< operator in ostream cannot accept ' + rt.makeTypeString(t.t);
					_cout.v.ostream.write(r);
					return _cout;
				}
			}
		};
		rt.types[rt.getTypeSigniture(cout.t)]['<<'][
			rt.makeParametersSigniture([rt.arrayPointerType(rt.charTypeLiteral, 0)])
		] = function(rt, _cout, t) {
			if (rt.isArrayType(t.t) && rt.isTypeEqualTo(t.t.eleType, rt.charTypeLiteral)) {
				var arr = t.v.target;
				var str = arr.map(function(e) {
					return String.fromCharCode(e.v);
				});
				str = str.join('');
				_cout.v.ostream.write(str);
			}
			return _cout;
		};

		var endl = rt.val(
			rt.charTypeLiteral,
			'\n'
		);
		rt.scope[0]['endl'] = endl;
	}
}
var iostream = module.exports;

function run(code, input){
	var rt = new _CRuntime();
	var interpreter = new _Interpreter(rt);
	var stdio = {
		drain: function() {
			var x = input;
			input = null;
			return x;
		},
		write: function(s) {
			process.stdout.write(s);
		}
	};
	iostream.load(rt, stdio);
	code = code.toString();
	var ret = ast.parse(code);
	interpreter.run(ret);
	ret = rt.getFunc('global', 'main', [])(rt, null, []).v;
	return ret;
}
