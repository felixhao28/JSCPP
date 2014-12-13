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
	load: function(rt) {
		var stdio = rt.config.stdio;
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
					if (rt.isPrimitiveType(t.t)) {
						if (t.t.name.indexOf('char') >= 0)
							r = String.fromCharCode(t.v);
						else
							r = t.v.toString();
					} else
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
			'\n'.charCodeAt(0)
		);
		rt.scope[0]['endl'] = endl;
	}
}