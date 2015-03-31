(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding) {
  var self = this
  if (!(self instanceof Buffer)) return new Buffer(subject, encoding)

  var type = typeof subject
  var length

  if (type === 'number') {
    length = +subject
  } else if (type === 'string') {
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) {
    // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data)) subject = subject.data
    length = +subject.length
  } else {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (length > kMaxLength) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum size: 0x' +
      kMaxLength.toString(16) + ' bytes')
  }

  if (length < 0) length = 0
  else length >>>= 0 // coerce to uint32

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    self = Buffer._augment(new Uint8Array(length)) // eslint-disable-line consistent-this
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    self.length = length
    self._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    self._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++) {
        self[i] = subject.readUInt8(i)
      }
    } else {
      for (i = 0; i < length; i++) {
        self[i] = ((subject[i] % 256) + 256) % 256
      }
    }
  } else if (type === 'string') {
    self.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT) {
    for (i = 0; i < length; i++) {
      self[i] = 0
    }
  }

  if (length > 0 && length <= Buffer.poolSize) self.parent = rootParent

  return self
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, totalLength) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function byteLength (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function toString (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0

  if (length < 0 || offset < 0 || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) >>> 0 & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) >>> 0 & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(
      this, value, offset, byteLength,
      Math.pow(2, 8 * byteLength - 1) - 1,
      -Math.pow(2, 8 * byteLength - 1)
    )
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(
      this, value, offset, byteLength,
      Math.pow(2, 8 * byteLength - 1) - 1,
      -Math.pow(2, 8 * byteLength - 1)
    )
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, target_start, start, end) {
  var self = this // source

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (target_start >= target.length) target_start = target.length
  if (!target_start) target_start = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || self.length === 0) return 0

  // Fatal error conditions
  if (target_start < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= self.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - target_start < end - start) {
    end = target.length - target_start + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":21,"ieee754":22,"is-array":23}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":3,"inherits":24,"readable-stream/duplex.js":26,"readable-stream/passthrough.js":33,"readable-stream/readable.js":34,"readable-stream/transform.js":35,"readable-stream/writable.js":36}],6:[function(require,module,exports){
(function (Buffer){
module.exports = function isBuffer(arg) {
  return arg instanceof Buffer;
}

}).call(this,require("buffer").Buffer)
},{"buffer":2}],7:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":6,"_process":4,"inherits":24}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
module.exports = {
	load: function(rt) {
		rt.regFunc(function(rt, _this, x) {
			var c = rt.getFunc('global', 'isdigit', [rt.intTypeLiteral])(rt, _this, x);
			if (!c.v) {
				return rt.getFunc('global', 'isalpha', [rt.intTypeLiteral])(rt, _this, x);
			}
			return c;
		}, 'global', 'isalnum', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v >= '0'.charCodeAt(0) && x.v <= '9'.charCodeAt(0)) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'isdigit', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var c = rt.getFunc('global', 'isupper', [rt.intTypeLiteral])(rt, _this, x);
			if (!c.v) {
				return rt.getFunc('global', 'islower', [rt.intTypeLiteral])(rt, _this, x);
			}
			return c;
		}, 'global', 'isalpha', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v in [0x20, 0x09, 0x0a, 0x0b, 0x0c, 0x0d]) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'isspace', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v >= 0x00 && x.v <= 0x1f || x.v === 0x7f) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'iscntrl', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v > 0x1f && x.v !== 0x7f) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'isprint', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var c = rt.getFunc('global', 'isspace', [rt.intTypeLiteral])(rt, _this, x);
			if (!c.v) {
				c = rt.getFunc('global', 'isgraph', [rt.intTypeLiteral])(rt, _this, x);
				if (!c.v)
					return rt.val(rt.intTypeLiteral, 1);
			}
			return rt.val(rt.intTypeLiteral, 0);
		}, 'global', 'isgraph', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v >= 'a'.charCodeAt(0) && x.v <= 'z'.charCodeAt(0)) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'islower', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v >= 'A'.charCodeAt(0) && x.v <= 'Z'.charCodeAt(0)) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'isupper', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var c = rt.getFunc('global', 'isgraph', [rt.intTypeLiteral])(rt, _this, x);
			if (c.v) {
				c = rt.getFunc('global', 'isalnum', [rt.intTypeLiteral])(rt, _this, x);
				if (!c.v)
					return rt.val(rt.intTypeLiteral, 1);
			}
			return rt.val(rt.intTypeLiteral, 0);
		}, 'global', 'ispunct', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var v = (x.v >= 'A'.charCodeAt(0) && x.v <= 'F'.charCodeAt(0) ||
				x.v >= 'a'.charCodeAt(0) && x.v <= 'f'.charCodeAt(0) ||
				x.v >= '0'.charCodeAt(0) && x.v <= '9'.charCodeAt(0)
			) ? 1 : 0;
			return rt.val(rt.intTypeLiteral, v);
		}, 'global', 'isxdigit', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var c = rt.getFunc('global', 'isupper', [rt.intTypeLiteral])(rt, _this, x);
			if (c.v) {
				return rt.val(rt.intTypeLiteral, x.v + 32);
			}
			return x;
		}, 'global', 'tolower', [rt.intTypeLiteral], rt.intTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			var c = rt.getFunc('global', 'islower', [rt.intTypeLiteral])(rt, _this, x);
			if (c.v) {
				return rt.val(rt.intTypeLiteral, x.v - 32);
			}
			return x;
		}, 'global', 'toupper', [rt.intTypeLiteral], rt.intTypeLiteral);
	}
}
},{}],10:[function(require,module,exports){
module.exports = {
	load: function(rt) {
		rt.regFunc(function(rt, _this, x) {
			return Math.cos(x.v);
		}, 'global', 'cos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sin(x.v);
		}, 'global', 'sin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.tan(x.v);
		}, 'global', 'tan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.acos(x.v);
		}, 'global', 'acos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.asin(x.v);
		}, 'global', 'asin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.atan(x.v);
		}, 'global', 'atan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, y, x) {
			return Math.atan(y.v / x.v);
		}, 'global', 'atan2', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x) {
			return Math.cosh(x.v);
		}, 'global', 'cosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sinh(x.v);
		}, 'global', 'sinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.tanh(x.v);
		}, 'global', 'tanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.acosh(x.v);
		}, 'global', 'acosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.asinh(x.v);
		}, 'global', 'asinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.atanh(x.v);
		}, 'global', 'atanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x) {
			return Math.exp(x.v);
		}, 'global', 'exp', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.log(x.v);
		}, 'global', 'log', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.log10(x.v);
		}, 'global', 'log10', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x, y) {
			return Math.pow(x.v, y.v);
		}, 'global', 'pow', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sqrt(x.v);
		}, 'global', 'sqrt', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.ceil(x.v);
		}, 'global', 'ceil', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.floor(x.v);
		}, 'global', 'floor', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.abs(x.v);
		}, 'global', 'fabs', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.abs(x.v);
		}, 'global', 'abs', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
	}
}
},{}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var format_type_map, printf, validate_format,
  __slice = [].slice;

printf = require('printf');

format_type_map = function(rt, ctrl) {
  switch (ctrl) {
    case 'd':
    case 'i':
      return rt.intTypeLiteral;
    case 'u':
    case 'o':
    case 'x':
    case 'X':
      return rt.unsignedintTypeLiteral;
    case 'f':
    case 'F':
      return rt.floatTypeLiteral;
    case 'e':
    case 'E':
    case 'g':
    case 'G':
    case 'a':
    case 'A':
      return rt.doubleTypeLiteral;
    case 'c':
      return rt.charTypeLiteral;
    case 's':
      return rt.normalPointerType(rt.charTypeLiteral);
    case 'p':
      return rt.normalPointerType(rt.voidTypeLiteral);
    case 'n':
      return rt.raiseException('%n is not supported');
  }
};

validate_format = function() {
  var casted, ctrl, format, i, params, target, type, val, _results;
  format = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  i = 0;
  _results = [];
  while ((ctrl = /(?:(?!%).)%([diuoxXfFeEgGaAcspn])/.exec(format)) != null) {
    type = format_type_map(ctrl[1]);
    if (params.length <= i) {
      rt.raiseException('insufficient arguments (at least #{i+1} is required)');
    }
    target = params[i++];
    casted = rt.cast(type, target);
    if (rt.isStringType(casted.t)) {
      _results.push(val = rt.getStringFromCharArray(casted));
    } else {
      _results.push(val = casted.v);
    }
  }
  return _results;
};

module.exports = {
  load: function(rt) {
    var pchar, stdio, __printf, _printf, _sprintf;
    rt.include('cstring');
    pchar = rt.normalPointerType(rt.charTypeLiteral);
    stdio = rt.config.stdio;
    __printf = function() {
      var format, params, parsed_params, retval;
      format = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (rt.isStringType(format.t)) {
        format = format.v.target;
        parsed_params = validate_format.apply(null, [format].concat(__slice.call(params)));
        retval = printf.apply(null, [format].concat(__slice.call(parsed_params)));
        return rt.makeCharArrayFromString(retval);
      } else {
        return rt.raiseException('format must be a string');
      }
    };
    _sprintf = function() {
      var format, params, retval, rt, target, _this;
      rt = arguments[0], _this = arguments[1], target = arguments[2], format = arguments[3], params = 5 <= arguments.length ? __slice.call(arguments, 4) : [];
      retval = __printf.apply(null, [format].concat(__slice.call(params)));
      rt.getFunc('global', 'strcpy', [pchar, pchar])(rt, null, [target, retval]);
      return rt.val(rt.intTypeLiteral, retval.length);
    };
    rt.regFunc(_sprintf, 'global', 'sprintf', [pchar, pchar, '?'], rt.intTypeLiteral);
    _printf = function() {
      var format, params, retval, rt, _this;
      rt = arguments[0], _this = arguments[1], format = arguments[2], params = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
      retval = __printf.apply(null, [format].concat(__slice.call(params)));
      stdio.write(retval);
      return rt.val(rt.intTypeLiteral, retval.length);
    };
    return rt.regFunc(_printf, 'global', 'printf', [pchar, '?'], rt.intTypeLiteral);
  }
};

},{"printf":38}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
module.exports = {
  load: function(rt) {
    var binary_search, cmpType, div_t_t, ldiv_t_t, pchar, _abs, _atof, _atoi, _atol, _bsearch, _div, _labs, _ldiv, _qsort, _rand, _system;
    pchar = rt.normalPointerType(rt.charTypeLiteral);
    _atof = function(rt, _this, str) {
      var val;
      if (rt.isStringType(str.t)) {
        str = rt.getStringFromCharArray(str);
        val = Number.parseFloat(str);
        return rt.val(rt.floatTypeLiteral, val);
      } else {
        return rt.raiseException('argument is not a string');
      }
    };
    rt.regFunc(_atof, 'global', 'atof', [pchar], rt.floatTypeLiteral);
    _atoi = function(rt, _this, str) {
      var val;
      if (rt.isStringType(str.t)) {
        str = rt.getStringFromCharArray(str);
        val = Number.parseInt(str);
        return rt.val(rt.intTypeLiteral, val);
      } else {
        return rt.raiseException('argument is not a string');
      }
    };
    rt.regFunc(_atoi, 'global', 'atoi', [pchar], rt.intTypeLiteral);
    _atol = function(rt, _this, str) {
      var val;
      if (rt.isStringType(str.t)) {
        str = rt.getStringFromCharArray(str);
        val = Number.parseInt(str);
        return rt.val(rt.longTypeLiteral, val);
      } else {
        return rt.raiseException('argument is not a string');
      }
    };
    rt.regFunc(_atol, 'global', 'atol', [pchar], rt.longTypeLiteral);
    if (rt.scope[0]['RAND_MAX'] == null) {
      rt.scope[0]['RAND_MAX'] = 0x7fffffff;
    }
    _rand = function(rt, _this) {
      var val;
      val = Math.floor(Math.random() * (rt.scope[0]['RAND_MAX'] + 1));
      return rt.val(rt.intTypeLiteral, val);
    };
    rt.regFunc(_rand, 'global', 'rand', [], rt.intTypeLiteral);
    _system = function(rt, _this, command) {
      var e, ret, str;
      if (command === rt.nullPointer) {
        return rt.val(rt.intTypeLiteral, 1);
      } else if (rt.isStringType(command.t)) {
        str = rt.getStringFromCharArray(str);
        try {
          ret = eval(str);
          if (ret !== void 0) {
            console.log(ret);
          }
          return rt.val(rt.intTypeLiteral, 1);
        } catch (_error) {
          e = _error;
          return rt.val(rt.intTypeLiteral, 0);
        }
      } else {
        return rt.raiseException('command is not a string');
      }
    };
    rt.regFunc(_system, 'global', 'system', [pchar], rt.intTypeLiteral);
    rt.scope[0]['NULL'] = rt.nullPointer;
    binary_search = function(val, L, cmp) {
      var cmpResult, mid;
      if (L.length === 0) {
        return false;
      }
      mid = Math.floor(L.length / 2);
      cmpResult = cmp(val, L[mid], mid);
      if (cmpResult === 0) {
        return mid;
      } else if (cmpResult > 0) {
        return binary_search(val, L.slice(mid + 1, +L.length + 1 || 9e9));
      } else {
        return binary_search(val, L.slice(0, +(mid - 1) + 1 || 9e9));
      }
    };
    _bsearch = function(rt, _this, key, base, num, size, cmp) {
      var L, bsRet, val, wrapper;
      if (rt.isArrayType(base)) {
        L = base.v.target;
        val = key;
        wrapper = function(a, b, indexB) {
          var pbType, pbVal, pointerB;
          pbType = base.t;
          pbVal = rt.makeArrayPointerValue(L, indexB);
          pointerB = rt.val(pbType, pbVal);
          return cmp(rt, null, a, pointerB).v;
        };
        bsRet = binary_search(val, L, wrapper);
        if (bsRet === false) {
          return rt.nullPointer;
        } else {
          return rt.val(base.t, rt.makeArrayPointerValue(L, bsRet));
        }
      } else {
        return rt.raiseException('base must be an array');
      }
    };
    cmpType = this.functionPointerType(rt.intTypeLiteral, [rt.voidPointerType, rt.voidPointerType]);
    rt.regFunc(_bsearch, 'global', 'bsearch', [rt.voidPointerType, rt.voidPointerType, rt.intTypeLiteral, rt.intTypeLiteral, cmpType], rt.voidPointerType);
    _qsort = function(rt, _this, base, num, size, cmp) {
      var L, ele, i, wrapper, _i, _len;
      if (rt.isArrayType(base)) {
        L = base.v.target;
        for (i = _i = 0, _len = L.length; _i < _len; i = ++_i) {
          ele = L[i];
          ele.index = i;
        }
        wrapper = function(a, b) {
          var pType, paVal, pbVal, pointerA, pointerB;
          pType = base.t;
          pbVal = rt.makeArrayPointerValue(L, b.index);
          paVal = rt.makeArrayPointerValue(L, a.index);
          pointerB = rt.val(pType, pbVal);
          pointerA = rt.val(pType, pbVal);
          return cmp(rt, null, pointerA, pointerB).v;
        };
        L.sort(wrapper);
      } else {
        return rt.raiseException('base must be an array');
      }
    };
    rt.regFunc(_qsort, 'global', 'qsort', [rt.voidPointerType, rt.intTypeLiteral, rt.intTypeLiteral, cmpType]);
    _abs = function(rt, _this, n) {
      return rt.val(rt.intTypeLiteral, Math.abs(n.v));
    };
    rt.regFunc(_abs, 'global', 'abs', [rt.intTypeLiteral], rt.intTypeLiteral);
    _div = function(rt, _this, numer, denom) {
      return rt.val(rt.intTypeLiteral, Math.floor(numer / denom));
    };
    div_t_t = rt.newClass('div_t', [
      {
        type: rt.intTypeLiteral,
        name: 'quot'
      }, {
        type: rt.intTypeLiteral,
        name: 'rem'
      }
    ]);
    rt.regFunc(_div, 'global', 'div', [rt.intTypeLiteral, rt.intTypeLiteral], div_t_t);
    _labs = function(rt, _this, n) {
      return rt.val(rt.longTypeLiteral, Math.abs(n.v));
    };
    rt.regFunc(_labs, 'global', 'labs', [rt.longTypeLiteral], rt.longTypeLiteral);
    _ldiv = function(rt, _this, numer, denom) {
      return rt.val(rt.longTypeLiteral, Math.floor(numer / denom));
    };
    ldiv_t_t = rt.newClass('ldiv_t', [
      {
        type: rt.longTypeLiteral,
        name: 'quot'
      }, {
        type: rt.longTypeLiteral,
        name: 'rem'
      }
    ]);
    return rt.regFunc(_ldiv, 'global', 'ldiv', [rt.longTypeLiteral, rt.longTypeLiteral], ldiv_t_t);
  }
};

},{}],13:[function(require,module,exports){
module.exports = {
	load: function(rt) {
		var pchar = rt.normalPointerType(rt.charTypeLiteral);
		var sizet = rt.primitiveType('unsigned int');

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
},{}],14:[function(require,module,exports){
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
		var type = rt.newClass('istream', []);
		var cin = {
			t: type,
			v: {
				buf: '',
				istream: stdio,
				members: []
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
					t.v = rt.val(t.t, v).v;
					_cin.v.buf = b.substring(len);
					return _cin;
				}
			}
		};

		var type = rt.newClass('ostream', []);
		var cout = {
			t: rt.simpleType('ostream'),
			v: {
				ostream: stdio,
				members: []
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
},{}],15:[function(require,module,exports){
var launcher = require('./launcher');

JSCPP = {
  version: "1.0.0",
  launcher: launcher,
  includes: launcher.includes,
  runtime: require('./rt'),
  preprocessor: require('./preprocessor'),
  ast: require('./ast'),
  interpreter: require('./interpreter')
};

},{"./ast":8,"./interpreter":16,"./launcher":17,"./preprocessor":19,"./rt":20}],16:[function(require,module,exports){
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
            return interp.getMember(ret, s.member);
        },
        PostfixExpression_MemberPointerAccess: function(interp, s, param) {
            var ret = interp.visit(interp, s.Expression, param);
            var member;
            if (interp.rt.isPointerType(ret.t) && !interp.rt.isFunctionType(ret.t)) {
                member = s.member;
                return interp.rt.getFunc(ret.t, '->', [])(interp.rt, ret, member);
            } else {
                member = interp.visit(interp, {
                        type: "IdentifierExpression",
                        Identifier: s.member
                    },
                    param
                )
                return interp.rt.getFunc(ret.t, '->', [member.t])(interp.rt, ret, member);
            }
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
            return interp.rt.val(interp.rt.intTypeLiteral, interp.rt.getSize(ret));
        },
        UnaryExpression_Sizeof_Type: function(interp, s, param) {
            var type = interp.rt.simpleType(s.TypeName);
            return interp.rt.val(interp.rt.intTypeLiteral, interp.rt.getSizeByType(type));
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
            return interp.rt.makeCharArrayFromString(str);
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

},{}],17:[function(require,module,exports){
(function (process){
//logger = require('tracer').colorConsole();
var CRuntime = require('./rt')
var Interpreter = require('./interpreter');
var ast = require('./ast');
var preprocessor = require('./preprocessor');

function mergeConfig(a, b) {
    for (o in b) {
        if (o in a && typeof b[o] === 'object') {
            mergeConfig(a[o], b[o]);
        } else {
            a[o] = b[o];
        }
    }
}

module.exports = {
    includes: {
        iostream: require('./includes/iostream'),
        cctype: require('./includes/cctype'),
        cstring: require('./includes/cstring'),
        cmath: require('./includes/cmath'),
        cstdio: require('./includes/cstdio'),
        cstdlib: require('./includes/cstdlib')
    },

    run: function(code, input, config) {
        var inputbuffer = input.toString();
        var self = this;
        var _config = {
            stdio: {
                drain: function() {
                    var x = inputbuffer;
                    inputbuffer = null;
                    return x;
                },
                write: function(s) {
                    process.stdout.write(s);
                }
            },
            includes: self.includes
        };
        mergeConfig(_config, config);
        var rt = new CRuntime(_config);
        code = code.toString();
        code = preprocessor.parse(rt, code);
        var tree = ast.parse(code);
        var interpreter = new Interpreter(rt);
        interpreter.run(tree);
        var exitCode = rt.getFunc('global', 'main', [])(rt, null, []).v;
        return exitCode;
    }
};

}).call(this,require('_process'))
},{"./ast":8,"./includes/cctype":9,"./includes/cmath":10,"./includes/cstdio":11,"./includes/cstdlib":12,"./includes/cstring":13,"./includes/iostream":14,"./interpreter":16,"./preprocessor":19,"./rt":20,"_process":4}],18:[function(require,module,exports){
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
          function(a, b) {
                  return addPositionInfo({type:'Code', val:a, space:b})
                  },
          function(a) {
                  return addPositionInfo({type:'TranslationUnit', lines: a});
              },
          function(a, b) {a.space = b;return a;},
          function(a) {return addPositionInfo({type:'PrepUndef', Identifier:a});},
          null,
          function(a, b) {
              return addPositionInfo({type:'PrepSimpleMacro', Identifier:a, Replacement:b});
          },
          function(a, b, c) {
              return addPositionInfo({type:'PrepFunctionMacro', Identifier:a, Args:b, Replacement:c});
          },
          function(a) {return a;},
          function(a, b) {
              return [a].concat(b);
          },
          function(a, b, c) {
              return {type:'PrepFunctionMacroCall', Identifier:a, Args:b, space:c};
              },
          function(a) {
              var ret = [];
              var lastString = null;
              for (var i=0;i<a.length;i++){
                  if (a[i].type==='Seperator'){
                      if (lastString===null){
                          lastString = a[i];
                      }else{
                          lastString.val += lastString.space + a[i].val;
                          lastString.space = a[i].space;
                      }
                  }else{
                      if (lastString!==null){
                          ret.push(lastString);
                          lastString = null;
                      }
                      ret.push(a[i]);
                  }
              }
              if (lastString!==null)
                  ret.push(lastString);
              return ret;
          },
          function(a) {
              return addPositionInfo({type:'PrepIncludeLib', name:a});
          },
          function(a) {
              return addPositionInfo({type:'PrepIncludeLocal', name:a});
          },
          /^[\/\\.]/,
          { type: "class", value: "[\\/\\\\.]", description: "[\\/\\\\.]" },
          function(a) {return a.join('');},
          function(a) {return addPositionInfo({type:'PrepIfdef', Identifier:a});},
          function(a) {return addPositionInfo({type:'PrepIfndef', Identifier:a});},
          function() {return addPositionInfo({type:'PrepEndif'});},
          function() {return addPositionInfo({type:'PrepElse'});},
          "#",
          { type: "literal", value: "#", description: "\"#\"" },
          "define",
          { type: "literal", value: "define", description: "\"define\"" },
          "undef",
          { type: "literal", value: "undef", description: "\"undef\"" },
          "include",
          { type: "literal", value: "include", description: "\"include\"" },
          "ifdef",
          { type: "literal", value: "ifdef", description: "\"ifdef\"" },
          "ifndef",
          { type: "literal", value: "ifndef", description: "\"ifndef\"" },
          "endif",
          { type: "literal", value: "endif", description: "\"endif\"" },
          "else",
          { type: "literal", value: "else", description: "\"else\"" },
          function(a) {
                  return a.join('');
                },
          /^[ \t\x0B\f]/,
          { type: "class", value: "[ \\t\\x0B\\f]", description: "[ \\t\\x0B\\f]" },
          /^[ \n\r\t\x0B\f]/,
          { type: "class", value: "[ \\n\\r\\t\\x0B\\f]", description: "[ \\n\\r\\t\\x0B\\f]" },
          "/*",
          { type: "literal", value: "/*", description: "\"/*\"" },
          void 0,
          "*/",
          { type: "literal", value: "*/", description: "\"*/\"" },
          function(a) {return '';},
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
          function(a, b, c) {
              return {type: 'Identifier', val:a+b.join(''), space:c}
          },
          /^[\r\n,)]/,
          { type: "class", value: "[\\r\\n,)]", description: "[\\r\\n,)]" },
          function(a, b) {
              return {type: 'Seperator', val:a, space:b}
          },
          /^[\r\n]/,
          { type: "class", value: "[\\r\\n]", description: "[\\r\\n]" },
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
          function(a) {return String.fromCharCode(a);},
          "\\U",
          { type: "literal", value: "\\U", description: "\"\\\\U\"" },
          function(a) {
              return parseInt(a.join(''),16);
          },
          /^[a-f]/,
          { type: "class", value: "[a-f]", description: "[a-f]" },
          /^[A-F]/,
          { type: "class", value: "[A-F]", description: "[A-F]" },
          "(",
          { type: "literal", value: "(", description: "\"(\"" },
          ")",
          { type: "literal", value: ")", description: "\")\"" },
          ",",
          { type: "literal", value: ",", description: "\",\"" },
          "<",
          { type: "literal", value: "<", description: "\"<\"" },
          /^[=]/,
          { type: "class", value: "[=]", description: "[=]" },
          ">",
          { type: "literal", value: ">", description: "\">\"" },
          "\"",
          { type: "literal", value: "\"", description: "\"\\\"\"" },
          { type: "any", description: "any character" }
        ],

        peg$bytecode = [
          peg$decode("!7<+\x8D$ !7!*> \"!7)+3$7<+)%4\"6\"\"\"! %$\"#  \"#  +G$,D&7!*> \"!7)+3$7<+)%4\"6\"\"\"! %$\"#  \"#  \"\"\"  +2%7x+(%4#6##!!%$##  $\"#  \"#  "),
          peg$decode("!7\"*) \"7**# \"7.+3$7<+)%4\"6$\"\"! %$\"#  \"#  "),
          peg$decode("7%*) \"7$*# \"7#"),
          peg$decode("!73+<$75+2%7i+(%4#6%#! %$##  $\"#  \"#  "),
          peg$decode("!73+M$74+C%7i+9%7)*# \" &+)%4$6'$\"! %$$#  $##  $\"#  \"#  "),
          peg$decode("!73+R$74+H%7i+>%7&+4%7)+*%4%6(%#\"! %$%#  $$#  $##  $\"#  \"#  "),
          peg$decode("!7r+\x83$7i+y% !!7t+2$7i+(%4\"6)\"! %$\"#  \"#  ,=&!7t+2$7i+(%4\"6)\"! %$\"#  \"#  \"+3%7s+)%4$6*$\"\"!%$$#  $##  $\"#  \"#  "),
          peg$decode("!7r+\x83$7(+y% !!7t+2$7(+(%4\"6)\"! %$\"#  \"#  ,=&!7t+2$7(+(%4\"6)\"! %$\"#  \"#  \"+3%7s+)%4$6*$\"\"!%$$#  $##  $\"#  \"#  "),
          peg$decode("! !!7i+>$7'+4%7;+*%4#6+##\"! %$##  $\"#  \"#  *) \"7i*# \"7j+X$,U&!7i+>$7'+4%7;+*%4#6+##\"! %$##  $\"#  \"#  *) \"7i*# \"7j\"\"\"  +' 4!6,!! %"),
          peg$decode("! !!7i+>$7'+4%7;+*%4#6+##\"! %$##  $\"#  \"#  *) \"7i*# \"7k+X$,U&!7i+>$7'+4%7;+*%4#6+##\"! %$##  $\"#  \"#  *) \"7i*# \"7k\"\"\"  +' 4!6,!! %"),
          peg$decode("7+*# \"7,"),
          peg$decode("!73+P$76+F%7u+<%7-+2%7v+(%4%6-%!!%$%#  $$#  $##  $\"#  \"#  "),
          peg$decode("!73+P$76+F%7w+<%7-+2%7w+(%4%6.%!!%$%#  $$#  $##  $\"#  \"#  "),
          peg$decode("! !7m*) \"0/\"\"1!30+2$,/&7m*) \"0/\"\"1!30\"\"\"  +' 4!61!! %"),
          peg$decode("7/*/ \"70*) \"71*# \"72"),
          peg$decode("!73+<$77+2%7i+(%4#62#! %$##  $\"#  \"#  "),
          peg$decode("!73+<$78+2%7i+(%4#63#! %$##  $\"#  \"#  "),
          peg$decode("!73+1$79+'%4\"64\" %$\"#  \"#  "),
          peg$decode("!73+1$7:+'%4\"65\" %$\"#  \"#  "),
          peg$decode("!.6\"\"2637+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.8\"\"2839+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.:\"\"2:3;+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.<\"\"2<3=+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.>\"\"2>3?+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.@\"\"2@3A+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.B\"\"2B3C+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("!.D\"\"2D3E+-$7;+#%'\"%$\"#  \"#  "),
          peg$decode("! !7=*) \"7?*# \"7@,/&7=*) \"7?*# \"7@\"+' 4!6F!! %"),
          peg$decode("! !7>*) \"7?*# \"7@,/&7>*) \"7?*# \"7@\"+' 4!6F!! %"),
          peg$decode("!0G\"\"1!3H+' 4!6)!! %"),
          peg$decode("!0I\"\"1!3J+' 4!6)!! %"),
          peg$decode("!.K\"\"2K3L+\x9C$ !!!8.N\"\"2N3O9*$$\"\" M\"#  +-$7y+#%'\"%$\"#  \"#  ,L&!!8.N\"\"2N3O9*$$\"\" M\"#  +-$7y+#%'\"%$\"#  \"#  \"+8%.N\"\"2N3O+(%4#6P#!!%$##  $\"#  \"#  "),
          peg$decode("!.Q\"\"2Q3R+\x8C$ !!!8.S\"\"2S3T9*$$\"\" M\"#  +-$7y+#%'\"%$\"#  \"#  ,L&!!8.S\"\"2S3T9*$$\"\" M\"#  +-$7y+#%'\"%$\"#  \"#  \"+(%4\"6P\"! %$\"#  \"#  "),
          peg$decode("!.U\"\"2U3V+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.W\"\"2W3X+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.Y\"\"2Y3Z+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.[\"\"2[3\\+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.]\"\"2]3^+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!._\"\"2_3`+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.a\"\"2a3b+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.c\"\"2c3d+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.e\"\"2e3f+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.D\"\"2D3E+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.g\"\"2g3h+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.i\"\"2i3j+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.k\"\"2k3l+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.m\"\"2m3n+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.o\"\"2o3p+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.q\"\"2q3r+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.s\"\"2s3t+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.u\"\"2u3v+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.w\"\"2w3x+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.y\"\"2y3z+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.{\"\"2{3|+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.}\"\"2}3~+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\"\"23\x80+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x81\"\"2\x813\x82+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x83\"\"2\x833\x84+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x85\"\"2\x853\x86+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x87\"\"2\x873\x88+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x89\"\"2\x893\x8A+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x8B\"\"2\x8B3\x8C+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x8D\"\"2\x8D3\x8E+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x8F\"\"2\x8F3\x90+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x91\"\"2\x913\x92+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x93\"\"2\x933\x94+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x95\"\"2\x953\x96+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x97\"\"2\x973\x98+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x99\"\"2\x993\x9A+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x9B\"\"2\x9B3\x9C+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x9D\"\"2\x9D3\x9E+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\x9F\"\"2\x9F3\xA0+J$!87m9*$$\"\" M\"#  +2%7<+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.U\"\"2U3V*\u01F1 \".W\"\"2W3X*\u01E5 \".Y\"\"2Y3Z*\u01D9 \".[\"\"2[3\\*\u01CD \".]\"\"2]3^*\u01C1 \"._\"\"2_3`*\u01B5 \".a\"\"2a3b*\u01A9 \".c\"\"2c3d*\u019D \".e\"\"2e3f*\u0191 \".D\"\"2D3E*\u0185 \".g\"\"2g3h*\u0179 \".i\"\"2i3j*\u016D \".k\"\"2k3l*\u0161 \".m\"\"2m3n*\u0155 \".o\"\"2o3p*\u0149 \".q\"\"2q3r*\u013D \".s\"\"2s3t*\u0131 \".u\"\"2u3v*\u0125 \".w\"\"2w3x*\u0119 \".y\"\"2y3z*\u010D \".{\"\"2{3|*\u0101 \".}\"\"2}3~*\xF5 \".\"\"23\x80*\xE9 \".\x81\"\"2\x813\x82*\xDD \".\x83\"\"2\x833\x84*\xD1 \".\x85\"\"2\x853\x86*\xC5 \".\x87\"\"2\x873\x88*\xB9 \".\x89\"\"2\x893\x8A*\xAD \".\x8B\"\"2\x8B3\x8C*\xA1 \".\x8D\"\"2\x8D3\x8E*\x95 \".\x8F\"\"2\x8F3\x90*\x89 \".\x91\"\"2\x913\x92*} \".\x93\"\"2\x933\x94*q \".\x95\"\"2\x953\x96*e \".\x97\"\"2\x973\x98*Y \".\x99\"\"2\x993\x9A*M \".\xA1\"\"2\xA13\xA2*A \".\x9B\"\"2\x9B3\x9C*5 \".\x9D\"\"2\x9D3\x9E*) \".\x9F\"\"2\x9F3\xA0+@$!87m9*$$\"\" M\"#  +(%4\"6)\"!!%$\"#  \"#  "),
          peg$decode("!!87h9*$$\"\" M\"#  +P$7l+F% !7m,#&7m\"+4%7;+*%4$6\xA3$#\"! %$$#  $##  $\"#  \"#  "),
          peg$decode("!7h*i \"!!87l9*$$\"\" M\"#  +P$!80\xA4\"\"1!3\xA59*$$\"\" M\"#  +2%7y+(%4#6)#! %$##  $\"#  \"#  +3$7;+)%4\"6\xA6\"\"! %$\"#  \"#  "),
          peg$decode("!7h*i \"!!87l9*$$\"\" M\"#  +P$!80\xA7\"\"1!3\xA89*$$\"\" M\"#  +2%7y+(%4#6)#! %$##  $\"#  \"#  +3$7;+)%4\"6\xA6\"\"! %$\"#  \"#  "),
          peg$decode("0\xA9\"\"1!3\xAA*; \"0\xAB\"\"1!3\xAC*/ \"0\xAD\"\"1!3\xAE*# \"7n"),
          peg$decode("0\xA9\"\"1!3\xAA*G \"0\xAB\"\"1!3\xAC*; \"0\xAF\"\"1!3\xB0*/ \"0\xAD\"\"1!3\xAE*# \"7n"),
          peg$decode("!.\xB1\"\"2\xB13\xB2+2$7p+(%4\"6\xB3\"! %$\"#  \"#  *C \"!.\xB4\"\"2\xB43\xB5+2$7o+(%4\"6\xB3\"! %$\"#  \"#  "),
          peg$decode("!!7q+i$7q+_%7q+U%7q+K%7q+A%7q+7%7q+-%7q+#%'(%$(#  $'#  $&#  $%#  $$#  $##  $\"#  \"#  +' 4!6\xB6!! %"),
          peg$decode("!!7q+A$7q+7%7q+-%7q+#%'$%$$#  $##  $\"#  \"#  +' 4!6\xB6!! %"),
          peg$decode("0\xB7\"\"1!3\xB8*5 \"0\xB9\"\"1!3\xBA*) \"0\xAF\"\"1!3\xB0"),
          peg$decode("!.\xBB\"\"2\xBB3\xBC+2$7;+(%4\"6)\"!!%$\"#  \"#  "),
          peg$decode("!.\xBD\"\"2\xBD3\xBE+2$7;+(%4\"6)\"!!%$\"#  \"#  "),
          peg$decode("!.\xBF\"\"2\xBF3\xC0+2$7;+(%4\"6)\"!!%$\"#  \"#  "),
          peg$decode("!.\xC1\"\"2\xC13\xC2+P$!80\xC3\"\"1!3\xC49*$$\"\" M\"#  +2%7;+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xC5\"\"2\xC53\xC6+P$!80\xC3\"\"1!3\xC49*$$\"\" M\"#  +2%7;+(%4#6)#!\"%$##  $\"#  \"#  "),
          peg$decode("!.\xC7\"\"2\xC73\xC8+2$7;+(%4\"6)\"!!%$\"#  \"#  "),
          peg$decode("!87y9*$$\"\" M\"#  "),
          peg$decode("-\"\"1!3\xC9")
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


    function addPositionInfo(r){
        var posDetails = peg$computePosDetails(peg$currPos);
        r.line = posDetails.line;
        r.column = posDetails.column;
        r.begin = peg$reportedPos;
        r.end = peg$currPos;
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

},{}],19:[function(require,module,exports){
var prepast = require('./prepast');

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
			interp.rt.include(s.name);
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

Preprocessor.prototype.parse = function(code) {
	var tree = prepast.parse(code);
	this.rt.interp = this;
	return this.visit(tree, code);
};

module.exports = {
	parse: function(rt, code) {
		return new Preprocessor(rt).parse(code);
	}
};
},{"./prepast":18}],20:[function(require,module,exports){
function CRuntime(config) {
    function mergeConfig(a, b) {
        for (o in b) {
            if (o in a && typeof b[o] === 'object') {
                mergeConfig(a[o], b[o]);
            } else {
                a[o] = b[o];
            }
        }
    };
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
            },
            'pointer': {
                max: undefined,
                min: undefined,
                bytes: 4
            }
        },
        loadedLibraries: []
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

    mergeConfig(this.config, config);
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
                    if (rt.isArrayType(r.t)) {
                        var i = rt.cast(rt.intTypeLiteral, l).v;
                        return rt.val(
                            r.t,
                            rt.makeArrayPointerValue(r.v.target, r.v.position + i)
                        );
                    } else {
                        ret = l.v + r.v;
                        rett = rt.promoteNumeric(l.t, r.t);
                        return rt.val(rett, ret);
                    }
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
                return rt.getCompatibleFunc(l.v.defineType, l.v.name, args)(rt, l, args);
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
        },
        '->': {
            '#default': function(rt, l, r) {
                return this.getMember(l.v.target, r);
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
        '->': {
            '#default': function(rt, l, r) {
                l = rt.types['pointer_array']['*']['#default'](rt, l);
                return this.getMember(l, r);
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
                    rt.raiseException('cannot substract non-numeric to a pointer');
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
    this.unsignedintTypeLiteral = this.primitiveType('unsigned int');
    this.longTypeLiteral = this.primitiveType('long');
    this.floatTypeLiteral = this.primitiveType('float');
    this.doubleTypeLiteral = this.primitiveType('double');
    this.charTypeLiteral = this.primitiveType('char');
    this.boolTypeLiteral = this.primitiveType('bool');
    this.voidTypeLiteral = this.primitiveType('void');

    this.nullPointerValue = this.makeNormalPointerValue(null);
    this.voidPointerType = this.normalPointerType(this.voidTypeLiteral);

    this.nullPointer = this.val(this.voidPointerType, this.nullPointerValue);

    this.scope = [{
        '$name': 'global'
    }];
}

CRuntime.prototype.include = function(name) {
    var includes = this.config.includes;
    if (name in includes) {
        var lib = includes[name];
        if (name in this.config.loadedLibraries)
            return;
        includes[name].load(this);
        this.config.loadedLibraries.push(name);
    } else {
        this.raiseException('cannot find library: ' + name);
    }
}

CRuntime.prototype.getSize = function(element) {
    var ret = 0;
    if (this.isArrayType(element.t) && element.v.position === 0) {
        for (var i = 0; i < element.v.target.length; i++) {
            ret += this.getSize(element.v.target[i]);
        }
    } else {
        ret += this.getSizeByType(element.t);
    }
    return ret;
}

CRuntime.prototype.getSizeByType = function(type) {
    if (this.isPointerType(type)) {
        return this.config.limits['pointer'].bytes;
    } else if (this.isPrimitiveType(type)) {
        return this.config.limits[type.name].bytes;
    } else {
        this.raiseException('not implemented');
    }
}

CRuntime.prototype.getMember = function(l, r) {
    if (this.isClassType(l.t)) {
        return l.v.members[r];
    } else {
        this.raiseException('only a class can have members');
    }
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
                var rt = this;
                t[name]['reg'].forEach(function(dts) {
                    if (dts[dts.length - 1] === '?' && dts.length < ts.length) {
                        newTs = ts.slice(0, dts.length - 1);
                        dts = dts.slice(0, -1);
                    } else {
                        newTs = ts;
                    }
                    if (dts.length == newTs.length) {
                        var ok = true;
                        for (var i = 0; ok && i < newTs.length; i++) {
                            ok = rt.castable(newTs[i], dts[i]);
                        }
                        if (ok) {
                            compatibles.push(t[name][rt.makeParametersSigniture(dts)]);
                        }
                    }
                });
                if (compatibles.length == 0) {
                    if ('#default' in t[name])
                        return t[name]['#default'];
                    var rt = this;
                    var argsStr = ts.map(function(v) {
                        return rt.makeTypeString(v);
                    }).join(',');
                    this.raiseException('no method ' + name + ' in ' + lt + ' accepts ' + argsStr);
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

CRuntime.prototype.matchVarArg = function(methods, sig) {
    for (var _sig in methods) {
        if (_sig[_sig.length-1] === '?') {
            _sig = _sig.slice(0, -1);
            if (sig.startsWith(_sig))
                return methods[_sig];
        }
    }
    return null;
}

CRuntime.prototype.getFunc = function(lt, name, args) {
    var method;
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
            } else if ((method = this.matchVarArg(t[name], sig)) != null) {
                return method;
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
            } else if ((method = this.matchVarArg(t[name], sig)) != null) {
                return method;
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
    initval = this.clone(this.cast(type, initval));

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
        var limit = this.config.limits[type.name];
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
    } else if (this.isClassType(type1) || this.isClassType(type2)) {
        this.raiseException('not implemented');
    }
    return false;
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
        this.raiseException('overflow in ' + this.makeValString({
            t: type,
            v: v
        }));
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

CRuntime.prototype.newClass = function(classname, members) {
    var clsType = {
        type: 'class',
        name: classname
    };
    var sig = this.getTypeSigniture(clsType);
    if (sig in this.types)
        this.raiseException(this.makeTypeString(clsType) + ' is already defined');
    this.types[sig] = {
        '#constructor': function(rt, _this, initMembers) {
            _this.v.members = {};
            for (var i = 0; i < members.length; i++) {
                var member = members[i];
                _this.v.members[member.name] = initMembers[member.name];
            }
        }
    };
    return clsType;
};

CRuntime.prototype.primitiveType = function(type) {
    return {
        type: 'primitive',
        name: type
    };
};

CRuntime.prototype.isStringType = function(type) {
    return this.isArrayType(type) && this.isTypeEqualTo(type.t.eleType, this.charTypeLiteral)
}

CRuntime.prototype.getStringFromCharArray = function(element) {
    if (this.isStringType(element.t)) {
        var target = element.v.target;
        var result = '';
        for (var i = 0; i < target.length; i++) {
            if (target[i] === 0)
                break;
            result += String.fromCharCode(target[i]);
        }
        return result;
    } else {
        this.raiseException("target is not a string")
    }
}

CRuntime.prototype.makeCharArrayFromString = function(str) {
    var self = this;
    var type = this.arrayPointerType(this.charTypeLiteral, str.length + 1);
    var trailingZero = this.val(this.charTypeLiteral, 0);
    return this.val(type, {
        target: str.split('').map(function(c) {
            return self.val(self.charTypeLiteral, c.charCodeAt(0))
        }).concat([trailingZero]),
        position: 0
    });
}

CRuntime.prototype.getTypeSigniture = function(type) {
    // (primitive), [class], {pointer}
    var ret = type;
    var self = this;
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
            return this.val(type, this.nullPointerValue);
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

},{}],21:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],22:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],23:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],24:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],25:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],26:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":27}],27:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))
},{"./_stream_readable":29,"./_stream_writable":31,"_process":4,"core-util-is":32,"inherits":24}],28:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":30,"core-util-is":32,"inherits":24}],29:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;


/*<replacement>*/
var debug = require('util');
if (debug && debug.debuglog) {
  debug = debug.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/


util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (util.isString(chunk) && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (util.isNullOrUndefined(chunk)) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || util.isNull(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (!util.isNumber(n) || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (util.isNull(ret)) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (!util.isNull(ret))
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      process.nextTick(function() {
        emitReadable_(stream);
      });
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      debug('false write response, pause',
            src._readableState.awaitDrain);
      src._readableState.awaitDrain++;
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        var self = this;
        process.nextTick(function() {
          debug('readable nexttick read 0');
          self.read(0);
        });
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    if (!state.reading) {
      debug('resume read 0');
      this.read(0);
    }
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(function() {
      resume_(stream, state);
    });
  }
}

function resume_(stream, state) {
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"./_stream_duplex":27,"_process":4,"buffer":2,"core-util-is":32,"events":3,"inherits":24,"isarray":25,"stream":5,"string_decoder/":37,"util":1}],30:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (!util.isNullOrUndefined(data))
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('prefinish', function() {
    if (util.isFunction(this._flush))
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":27,"core-util-is":32,"inherits":24}],31:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (util.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (!util.isFunction(cb))
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.buffer.length)
      clearBuffer(this, state);
  }
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      util.isString(chunk)) {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (util.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, false, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      state.pendingcb--;
      cb(er);
    });
  else {
    state.pendingcb--;
    cb(er);
  }

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.buffer.length) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  if (stream._writev && state.buffer.length > 1) {
    // Fast case, write everything using _writev()
    var cbs = [];
    for (var c = 0; c < state.buffer.length; c++)
      cbs.push(state.buffer[c].callback);

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
    state.buffer = [];
  } else {
    // Slow case, write chunks one-by-one
    for (var c = 0; c < state.buffer.length; c++) {
      var entry = state.buffer[c];
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);

      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        c++;
        break;
      }
    }

    if (c < state.buffer.length)
      state.buffer = state.buffer.slice(c);
    else
      state.buffer.length = 0;
  }

  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));

};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (util.isFunction(chunk)) {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (!util.isNullOrUndefined(chunk))
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else
      prefinish(stream, state);
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))
},{"./_stream_duplex":27,"_process":4,"buffer":2,"core-util-is":32,"inherits":24,"stream":5}],32:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return Buffer.isBuffer(arg);
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}
}).call(this,require("buffer").Buffer)
},{"buffer":2}],33:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":28}],34:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = require('stream');
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":27,"./lib/_stream_passthrough.js":28,"./lib/_stream_readable.js":29,"./lib/_stream_transform.js":30,"./lib/_stream_writable.js":31,"stream":5}],35:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":30}],36:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":31}],37:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":2}],38:[function(require,module,exports){

var util = require('util');

var tokenize = function(/*String*/ str, /*RegExp*/ re, /*Function?*/ parseDelim, /*Object?*/ instance){
  // summary:
  //    Split a string by a regular expression with the ability to capture the delimeters
  // parseDelim:
  //    Each group (excluding the 0 group) is passed as a parameter. If the function returns
  //    a value, it's added to the list of tokens.
  // instance:
  //    Used as the "this' instance when calling parseDelim
  var tokens = [];
  var match, content, lastIndex = 0;
  while(match = re.exec(str)){
    content = str.slice(lastIndex, re.lastIndex - match[0].length);
    if(content.length){
      tokens.push(content);
    }
    if(parseDelim){
      var parsed = parseDelim.apply(instance, match.slice(1).concat(tokens.length));
      if(typeof parsed != 'undefined'){
        if(parsed.specifier === '%'){
          tokens.push('%');
        }else{
          tokens.push(parsed);
        }
      }
    }
    lastIndex = re.lastIndex;
  }
  content = str.slice(lastIndex);
  if(content.length){
    tokens.push(content);
  }
  return tokens;
}

var Formatter = function(/*String*/ format){
  var tokens = [];
  this._mapped = false;
  this._format = format;
  this._tokens = tokenize(format, this._re, this._parseDelim, this);
}

Formatter.prototype._re = /\%(?:\(([\w_]+)\)|([1-9]\d*)\$)?([0 +\-\#]*)(\*|\d+)?(\.)?(\*|\d+)?[hlL]?([\%bscdeEfFgGioOuxX])/g;
Formatter.prototype._parseDelim = function(mapping, intmapping, flags, minWidth, period, precision, specifier){
  if(mapping){
    this._mapped = true;
  }
  return {
    mapping: mapping,
    intmapping: intmapping,
    flags: flags,
    _minWidth: minWidth, // May be dependent on parameters
    period: period,
    _precision: precision, // May be dependent on parameters
    specifier: specifier
  };
};
Formatter.prototype._specifiers = {
  b: {
    base: 2,
    isInt: true
  },
  o: {
    base: 8,
    isInt: true
  },
  x: {
    base: 16,
    isInt: true
  },
  X: {
    extend: ['x'],
    toUpper: true
  },
  d: {
    base: 10,
    isInt: true
  },
  i: {
    extend: ['d']
  },
  u: {
    extend: ['d'],
    isUnsigned: true
  },
  c: {
    setArg: function(token){
      if(!isNaN(token.arg)){
        var num = parseInt(token.arg);
        if(num < 0 || num > 127){
          throw new Error('invalid character code passed to %c in printf');
        }
        token.arg = isNaN(num) ? '' + num : String.fromCharCode(num);
      }
    }
  },
  s: {
    setMaxWidth: function(token){
      token.maxWidth = (token.period == '.') ? token.precision : -1;
    }
  },
  e: {
    isDouble: true,
    doubleNotation: 'e'
  },
  E: {
    extend: ['e'],
    toUpper: true
  },
  f: {
    isDouble: true,
    doubleNotation: 'f'
  },
  F: {
    extend: ['f']
  },
  g: {
    isDouble: true,
    doubleNotation: 'g'
  },
  G: {
    extend: ['g'],
    toUpper: true
  },
  O: {
    isObject: true
  },
};
Formatter.prototype.format = function(/*mixed...*/ filler){
  if(this._mapped && typeof filler != 'object'){
    throw new Error('format requires a mapping');
  }

  var str = '';
  var position = 0;
  for(var i = 0, token; i < this._tokens.length; i++){
    token = this._tokens[i];
    
    if(typeof token == 'string'){
      str += token;
    }else{
      if(this._mapped){
        if(typeof filler[token.mapping] == 'undefined'){
          throw new Error('missing key ' + token.mapping);
        }
        token.arg = filler[token.mapping];
      }else{
        if(token.intmapping){
          position = parseInt(token.intmapping) - 1;
        }
        if(position >= arguments.length){
          throw new Error('got ' + arguments.length + ' printf arguments, insufficient for \'' + this._format + '\'');
        }
        token.arg = arguments[position++];
      }

      if(!token.compiled){
        token.compiled = true;
        token.sign = '';
        token.zeroPad = false;
        token.rightJustify = false;
        token.alternative = false;

        var flags = {};
        for(var fi = token.flags.length; fi--;){
          var flag = token.flags.charAt(fi);
          flags[flag] = true;
          switch(flag){
            case ' ':
              token.sign = ' ';
              break;
            case '+':
              token.sign = '+';
              break;
            case '0':
              token.zeroPad = (flags['-']) ? false : true;
              break;
            case '-':
              token.rightJustify = true;
              token.zeroPad = false;
              break;
            case '#':
              token.alternative = true;
              break;
            default:
              throw Error('bad formatting flag \'' + token.flags.charAt(fi) + '\'');
          }
        }

        token.minWidth = (token._minWidth) ? parseInt(token._minWidth) : 0;
        token.maxWidth = -1;
        token.toUpper = false;
        token.isUnsigned = false;
        token.isInt = false;
        token.isDouble = false;
        token.isObject = false;
        token.precision = 1;
        if(token.period == '.'){
          if(token._precision){
            token.precision = parseInt(token._precision);
          }else{
            token.precision = 0;
          }
        }

        var mixins = this._specifiers[token.specifier];
        if(typeof mixins == 'undefined'){
          throw new Error('unexpected specifier \'' + token.specifier + '\'');
        }
        if(mixins.extend){
          var s = this._specifiers[mixins.extend];
          for(var k in s){
            mixins[k] = s[k]
          }
          delete mixins.extend;
        }
        for(var l in mixins){
          token[l] = mixins[l];
        }
      }

      if(typeof token.setArg == 'function'){
        token.setArg(token);
      }

      if(typeof token.setMaxWidth == 'function'){
        token.setMaxWidth(token);
      }

      if(token._minWidth == '*'){
        if(this._mapped){
          throw new Error('* width not supported in mapped formats');
        }
        token.minWidth = parseInt(arguments[position++]);
        if(isNaN(token.minWidth)){
          throw new Error('the argument for * width at position ' + position + ' is not a number in ' + this._format);
        }
        // negative width means rightJustify
        if (token.minWidth < 0) {
          token.rightJustify = true;
          token.minWidth = -token.minWidth;
        }
      }

      if(token._precision == '*' && token.period == '.'){
        if(this._mapped){
          throw new Error('* precision not supported in mapped formats');
        }
        token.precision = parseInt(arguments[position++]);
        if(isNaN(token.precision)){
          throw Error('the argument for * precision at position ' + position + ' is not a number in ' + this._format);
        }
        // negative precision means unspecified
        if (token.precision < 0) {
          token.precision = 1;
          token.period = '';
        }
      }
      if(token.isInt){
        // a specified precision means no zero padding
        if(token.period == '.'){
          token.zeroPad = false;
        }
        this.formatInt(token);
      }else if(token.isDouble){
        if(token.period != '.'){
          token.precision = 6;
        }
        this.formatDouble(token); 
      }else if(token.isObject){
        this.formatObject(token);
      }
      this.fitField(token);

      str += '' + token.arg;
    }
  }

  return str;
};
Formatter.prototype._zeros10 = '0000000000';
Formatter.prototype._spaces10 = '          ';
Formatter.prototype.formatInt = function(token) {
  var i = parseInt(token.arg);
  if(!isFinite(i)){ // isNaN(f) || f == Number.POSITIVE_INFINITY || f == Number.NEGATIVE_INFINITY)
    // allow this only if arg is number
    if(typeof token.arg != 'number'){
      throw new Error('format argument \'' + token.arg + '\' not an integer; parseInt returned ' + i);
    }
    //return '' + i;
    i = 0;
  }

  // if not base 10, make negatives be positive
  // otherwise, (-10).toString(16) is '-a' instead of 'fffffff6'
  if(i < 0 && (token.isUnsigned || token.base != 10)){
    i = 0xffffffff + i + 1;
  } 

  if(i < 0){
    token.arg = (- i).toString(token.base);
    this.zeroPad(token);
    token.arg = '-' + token.arg;
  }else{
    token.arg = i.toString(token.base);
    // need to make sure that argument 0 with precision==0 is formatted as ''
    if(!i && !token.precision){
      token.arg = '';
    }else{
      this.zeroPad(token);
    }
    if(token.sign){
      token.arg = token.sign + token.arg;
    }
  }
  if(token.base == 16){
    if(token.alternative){
      token.arg = '0x' + token.arg;
    }
    token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
  }
  if(token.base == 8){
    if(token.alternative && token.arg.charAt(0) != '0'){
      token.arg = '0' + token.arg;
    }
  }
};
Formatter.prototype.formatDouble = function(token) {
  var f = parseFloat(token.arg);
  if(!isFinite(f)){ // isNaN(f) || f == Number.POSITIVE_INFINITY || f == Number.NEGATIVE_INFINITY)
    // allow this only if arg is number
    if(typeof token.arg != 'number'){
      throw new Error('format argument \'' + token.arg + '\' not a float; parseFloat returned ' + f);
    }
    // C99 says that for 'f':
    //   infinity -> '[-]inf' or '[-]infinity' ('[-]INF' or '[-]INFINITY' for 'F')
    //   NaN -> a string  starting with 'nan' ('NAN' for 'F')
    // this is not commonly implemented though.
    //return '' + f;
    f = 0;
  }

  switch(token.doubleNotation) {
    case 'e': {
      token.arg = f.toExponential(token.precision); 
      break;
    }
    case 'f': {
      token.arg = f.toFixed(token.precision); 
      break;
    }
    case 'g': {
      // C says use 'e' notation if exponent is < -4 or is >= prec
      // ECMAScript for toPrecision says use exponential notation if exponent is >= prec,
      // though step 17 of toPrecision indicates a test for < -6 to force exponential.
      if(Math.abs(f) < 0.0001){
        //print('forcing exponential notation for f=' + f);
        token.arg = f.toExponential(token.precision > 0 ? token.precision - 1 : token.precision);
      }else{
        token.arg = f.toPrecision(token.precision); 
      }

      // In C, unlike 'f', 'gG' removes trailing 0s from fractional part, unless alternative format flag ('#').
      // But ECMAScript formats toPrecision as 0.00100000. So remove trailing 0s.
      if(!token.alternative){ 
        //print('replacing trailing 0 in \'' + s + '\'');
        token.arg = token.arg.replace(/(\..*[^0])0*e/, '$1e');
        // if fractional part is entirely 0, remove it and decimal point
        token.arg = token.arg.replace(/\.0*e/, 'e').replace(/\.0$/,'');
      }
      break;
    }
    default: throw new Error('unexpected double notation \'' + token.doubleNotation + '\'');
  }

  // C says that exponent must have at least two digits.
  // But ECMAScript does not; toExponential results in things like '1.000000e-8' and '1.000000e+8'.
  // Note that s.replace(/e([\+\-])(\d)/, 'e$10$2') won't work because of the '$10' instead of '$1'.
  // And replace(re, func) isn't supported on IE50 or Safari1.
  token.arg = token.arg.replace(/e\+(\d)$/, 'e+0$1').replace(/e\-(\d)$/, 'e-0$1');

  // if alt, ensure a decimal point
  if(token.alternative){
    token.arg = token.arg.replace(/^(\d+)$/,'$1.');
    token.arg = token.arg.replace(/^(\d+)e/,'$1.e');
  }

  if(f >= 0 && token.sign){
    token.arg = token.sign + token.arg;
  }

  token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
};
Formatter.prototype.formatObject = function(token) {
  // If no precision is specified, then reset it to null (infinite depth).
  var precision = (token.period === '.') ? token.precision : null;
  token.arg = util.inspect(token.arg, !token.alternative, precision);
};
Formatter.prototype.zeroPad = function(token, /*Int*/ length) {
  length = (arguments.length == 2) ? length : token.precision;
  var negative = false;
  if(typeof token.arg != "string"){
    token.arg = "" + token.arg;
  }
  if (token.arg.substr(0,1) === '-') {
    negative = true;
    token.arg = token.arg.substr(1);
  }

  var tenless = length - 10;
  while(token.arg.length < tenless){
    token.arg = (token.rightJustify) ? token.arg + this._zeros10 : this._zeros10 + token.arg;
  }
  var pad = length - token.arg.length;
  token.arg = (token.rightJustify) ? token.arg + this._zeros10.substring(0, pad) : this._zeros10.substring(0, pad) + token.arg;
  if (negative) token.arg = '-' + token.arg;
};
Formatter.prototype.fitField = function(token) {
  if(token.maxWidth >= 0 && token.arg.length > token.maxWidth){
    return token.arg.substring(0, token.maxWidth);
  }
  if(token.zeroPad){
    this.zeroPad(token, token.minWidth);
    return;
  }
  this.spacePad(token);
};
Formatter.prototype.spacePad = function(token, /*Int*/ length) {
  length = (arguments.length == 2) ? length : token.minWidth;
  if(typeof token.arg != 'string'){
    token.arg = '' + token.arg;
  }
  var tenless = length - 10;
  while(token.arg.length < tenless){
    token.arg = (token.rightJustify) ? token.arg + this._spaces10 : this._spaces10 + token.arg;
  }
  var pad = length - token.arg.length;
  token.arg = (token.rightJustify) ? token.arg + this._spaces10.substring(0, pad) : this._spaces10.substring(0, pad) + token.arg;
};


module.exports = function(){
  var args = Array.prototype.slice.call(arguments),
    stream, format;
  if(args[0] instanceof require('stream').Stream){
    stream = args.shift();
  }
  format = args.shift();
  var formatter = new Formatter(format);
  var string = formatter.format.apply(formatter, args);
  if(stream){
    stream.write(string);
  }else{
    return string;
  }
};

module.exports.Formatter = Formatter;


},{"stream":5,"util":7}]},{},[15]);
