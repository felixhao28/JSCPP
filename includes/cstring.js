module.exports = {
	load: function(rt) {
		var pchar = rt.makeNormalPointerValue(rt.charTypeLiteral);
		var sizet = rt.primitiveType('unsigned int');

		rt.defVar('NULL', rt.makeNormalPointerValue(rt.voidTypeLiteral),
			rt.val(rt.makeNormalPointerValue(rt.voidTypeLiteral), rt.nullPointerValue));

		rt.regFunc(function(rt, _this, dest, src) {
			if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
				var srcarr = src.v.target;
				var i = src.v.position;
				var destarr = dest.v.target;
				var j = dest.v.position;
				for (; i < srcarr.length && j < destarr.length && srcarr[i].v != 0; i++, j++) {
					destarr[j] = rt.clone(srcarr[i]);
				}
				if (i === srcarr.length) {
					rt.raiseException('source string does not have a pending \'\\0\'');
				} else if (j === destarr.length - 1) {
					rt.raiseException('destination array is not big enough');
				} else {
					destarr[j] = rt.val(rt.charTypeLiteral, 0);
				}
			} else {
				rt.raiseException('destination or source is not an array');
			}
			return dest;
		}, 'global', 'strcpy', [pchar, pchar], pchar);

		rt.regFunc(function(rt, _this, dest, src, num) {
			if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
				var srcarr = src.v.target;
				var i = src.v.position;
				var destarr = dest.v.target;
				var j = dest.v.position;
				for (; num > 0 && i < srcarr.length && j < destarr.length - 1 && srcarr[i].v != 0; i++, j++) {
					destarr[j] = rt.clone(srcarr[i]);
					num--;
				}
				if (srcarr[i].v == 0) {
					// padding zeroes
					while (num > 0 && j < destarr.length) {
						destarr[j++] = rt.val(rt.charTypeLiteral, 0);
					}
				}
				if (i === srcarr.length) {
					rt.raiseException('source string does not have a pending \'\\0\'');
				} else if (j === destarr.length - 1) {
					rt.raiseException('destination array is not big enough');
				}
			} else {
				rt.raiseException('destination or source is not an array');
			}
			return dest;
		}, 'global', 'strncpy', [pchar, pchar, sizet], pchar);

		rt.regFunc(function(rt, _this, dest, src) {
			if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
				var srcarr = src.v.target;
				var destarr = dest.v.target;
				if (srcarr === destarr) {
					var i = src.v.position;
					var j = dest.v.position;
					if (i < j) {
						var lensrc = rt.getFunc('global', 'strlen', [pchar])(rt, null, [src]).v;
						if (i + lensrc + 1 >= j)
							rt.raiseException('overlap is not allowed');
					} else {
						var lensrc = rt.getFunc('global', 'strlen', [pchar])(rt, null, [src]).v;
						var lendest = rt.getFunc('global', 'strlen', [pchar])(rt, null, [dest]).v;
						if (j + lensrc + lendest + 1 >= i)
							rt.raiseException('overlap is not allowed');
					}
				}
				var lendest = rt.getFunc('global', 'strlen', [pchar])(rt, null, [dest]).v;
				var newDest = rt.val(
					pchar,
					rt.makeArrayPointerValue(dest.v.target, dest.v.position + lendest)
				);
				return rt.getFunc('global', 'strcpy', [pchar, pchar])(rt, null, [newDest, src])
			} else {
				rt.raiseException('destination or source is not an array');
			}
			return dest;
		}, 'global', 'strcat', [pchar, pchar], pchar);

		rt.regFunc(function(rt, _this, dest, src, num) {
			if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
				var srcarr = src.v.target;
				var destarr = dest.v.target;
				if (srcarr === destarr) {
					var i = src.v.position;
					var j = dest.v.position;
					if (i < j) {
						var lensrc = rt.getFunc('global', 'strlen', [pchar])(rt, null, [src]).v;
						if (lensrc > num) lensrc = num;
						if (i + lensrc + 1 >= j)
							rt.raiseException('overlap is not allowed');
					} else {
						var lensrc = rt.getFunc('global', 'strlen', [pchar])(rt, null, [src]).v;
						if (lensrc > num) lensrc = num;
						var lendest = rt.getFunc('global', 'strlen', [pchar])(rt, null, [dest]).v;
						if (j + lensrc + lendest + 1 >= i)
							rt.raiseException('overlap is not allowed');
					}
				}
				var lendest = rt.getFunc('global', 'strlen', [pchar])(rt, null, [dest]).v;
				var newDest = rt.val(
					pchar,
					rt.makeArrayPointerValue(dest.v.target, dest.v.position + lendest)
				);
				return rt.getFunc('global', 'strncpy', [pchar, pchar, sizet])(rt, null, [newDest, src, num])
			} else {
				rt.raiseException('destination or source is not an array');
			}
			return dest;
		}, 'global', 'strncat', [pchar, pchar, sizet], pchar);

		rt.regFunc(function(rt, _this, str) {
			if (rt.isArrayType(str.t)) {
				var arr = str.v.target;
				var i = str.v.position;
				for (; i < arr.length && arr[i].v !== 0; i++) {};
				if (i === arr.length) {
					rt.raiseException('target string does not have a pending \'\\0\'');
				} else {
					return i - str.v.position;
				}
			} else {
				rt.raiseException('target is not an array');
			}
		}, 'global', 'strlen', [pchar], sizet);

		rt.regFunc(function(rt, _this, dest, src) {
			if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
				var srcarr = src.v.target;
				var i = src.v.position;
				var destarr = dest.v.target;
				var j = dest.v.position;
				for (; i < srcarr.length && j < destarr.length && srcarr[i].v === destarr[i].v; i++, j++) {};
				return rt.val(rt.intTypeLiteral, destarr[i].v - srcarr[i].v);
			} else {
				rt.raiseException('str1 or str2 is not an array');
			}
		}, 'global', 'strcmp', [pchar, pchar], rt.intTypeLiteral);

		rt.regFunc(function(rt, _this, dest, src, num) {
			if (rt.isArrayType(dest.t) && rt.isArrayType(src.t)) {
				var srcarr = src.v.target;
				var i = src.v.position;
				var destarr = dest.v.target;
				var j = dest.v.position;
				for (; num > 0 && i < srcarr.length && j < destarr.length && srcarr[i].v === destarr[i].v; i++, j++, num--) {};
				return rt.val(rt.intTypeLiteral, destarr[i].v - srcarr[i].v);
			} else {
				rt.raiseException('str1 or str2 is not an array');
			}
		}, 'global', 'strncmp', [pchar, pchar, sizet], rt.intTypeLiteral);

		rt.regFunc(function(rt, _this, str, ch) {
			if (rt.isArrayType(str.t)) {
				var arr = str.v.target;
				var i = str.v.position;
				for (; i < arr.length && arr[i].v !== 0 && arr[i].v !== ch.v; i++) {}
				if (arr[i].v === 0) {
					return rt.val(pchar, rt.nullPointerValue);
				} else if (arr[i].v === ch.v) {
					return rt.val(pchar, rt.makeArrayPointerValue(arr, i));
				} else {
					rt.raiseException('target string does not have a pending \'\\0\'');
				}
			} else {
				rt.raiseException('str1 or str2 is not an array');
			}
		}, 'global', 'strchr', [pchar, rt.charTypeLiteral], pchar);

		rt.regFunc(function(rt, _this, str, ch) {
			if (rt.isArrayType(str.t)) {
				var arr = str.v.target;
				var i = str.v.position;
				var lastpos = -1;
				for (; i < arr.length && arr[i].v !== 0; i++) {
					if (arr[i].v === ch.v)
						lastpos = i;
				}
				if (arr[i].v === 0) {
					if (lastpos >= 0) {
						return rt.val(pchar, rt.makeArrayPointerValue(arr, lastpos));
					} else {
						return rt.val(pchar, rt.nullPointerValue);
					}
				} else {
					rt.raiseException('target string does not have a pending \'\\0\'');
				}
			} else {
				rt.raiseException('str1 or str2 is not an array');
			}
		}, 'global', 'strrchr', [pchar, rt.charTypeLiteral], pchar);


		rt.regFunc(function(rt, _this, str1, str2) {
			if (rt.isArrayType(str1.t) && rt.isArrayType(str2.t)) {
				// BM?
				var arr = str1.v.target;
				var i = str1.v.position;
				var tar = str2.v.target;
				for (; i < arr.length && arr[i].v !== 0; i++) {
					var j = str2.v.position;
					var _i = i;
					for (; j < tar.length && str1[_i].v === str2[j]; _i++, j++) {}
					if (j === tar.length) {
						break;
					}
				}
				if (arr[i].v === 0) {
					return rt.val(pchar, rt.nullPointerValue);
				} else if (i === arr.length) {
					rt.raiseException('target string does not have a pending \'\\0\'');
				} else {
					return rt.val(pchar, rt.makeArrayPointerValue(arr, i));
				}
			} else {
				rt.raiseException('str1 or str2 is not an array');
			}
		}, 'global', 'strstr', [pchar, rt.charTypeLiteral], pchar);
	}
}