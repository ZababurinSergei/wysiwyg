var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../node_modules/multiformats/dist/src/bytes.js
var empty = new Uint8Array(0);
function coerce(o2) {
  if (o2 instanceof Uint8Array && o2.constructor.name === "Uint8Array") {
    return o2;
  }
  if (o2 instanceof ArrayBuffer) {
    return new Uint8Array(o2);
  }
  if (ArrayBuffer.isView(o2)) {
    return new Uint8Array(o2.buffer, o2.byteOffset, o2.byteLength);
  }
  throw new Error("Unknown type, must be binary type");
}
__name(coerce, "coerce");

// ../node_modules/multiformats/dist/src/vendor/base-x.js
function base(ALPHABET, name) {
  if (ALPHABET.length >= 255) {
    throw new TypeError("Alphabet too long");
  }
  var BASE_MAP = new Uint8Array(256);
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }
  for (var i2 = 0; i2 < ALPHABET.length; i2++) {
    var x = ALPHABET.charAt(i2);
    var xc = x.charCodeAt(0);
    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(x + " is ambiguous");
    }
    BASE_MAP[xc] = i2;
  }
  var BASE = ALPHABET.length;
  var LEADER = ALPHABET.charAt(0);
  var FACTOR = Math.log(BASE) / Math.log(256);
  var iFACTOR = Math.log(256) / Math.log(BASE);
  function encode2(source) {
    if (source instanceof Uint8Array)
      ;
    else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source);
    }
    if (!(source instanceof Uint8Array)) {
      throw new TypeError("Expected Uint8Array");
    }
    if (source.length === 0) {
      return "";
    }
    var zeroes = 0;
    var length = 0;
    var pbegin = 0;
    var pend = source.length;
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }
    var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
    var b58 = new Uint8Array(size);
    while (pbegin !== pend) {
      var carry = source[pbegin];
      var i3 = 0;
      for (var it1 = size - 1; (carry !== 0 || i3 < length) && it1 !== -1; it1--, i3++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length = i3;
      pbegin++;
    }
    var it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }
    var str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) {
      str += ALPHABET.charAt(b58[it2]);
    }
    return str;
  }
  __name(encode2, "encode");
  function decodeUnsafe(source) {
    if (typeof source !== "string") {
      throw new TypeError("Expected String");
    }
    if (source.length === 0) {
      return new Uint8Array();
    }
    var psz = 0;
    if (source[psz] === " ") {
      return;
    }
    var zeroes = 0;
    var length = 0;
    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }
    var size = (source.length - psz) * FACTOR + 1 >>> 0;
    var b256 = new Uint8Array(size);
    while (source[psz]) {
      var carry = BASE_MAP[source.charCodeAt(psz)];
      if (carry === 255) {
        return;
      }
      var i3 = 0;
      for (var it3 = size - 1; (carry !== 0 || i3 < length) && it3 !== -1; it3--, i3++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length = i3;
      psz++;
    }
    if (source[psz] === " ") {
      return;
    }
    var it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }
    var vch = new Uint8Array(zeroes + (size - it4));
    var j2 = zeroes;
    while (it4 !== size) {
      vch[j2++] = b256[it4++];
    }
    return vch;
  }
  __name(decodeUnsafe, "decodeUnsafe");
  function decode2(string) {
    var buffer = decodeUnsafe(string);
    if (buffer) {
      return buffer;
    }
    throw new Error(`Non-${name} character`);
  }
  __name(decode2, "decode");
  return {
    encode: encode2,
    decodeUnsafe,
    decode: decode2
  };
}
__name(base, "base");
var src = base;
var _brrp__multiformats_scope_baseX = src;
var base_x_default = _brrp__multiformats_scope_baseX;

// ../node_modules/multiformats/dist/src/bases/base.js
var Encoder = class {
  static {
    __name(this, "Encoder");
  }
  name;
  prefix;
  baseEncode;
  constructor(name, prefix, baseEncode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
  }
  encode(bytes) {
    if (bytes instanceof Uint8Array) {
      return `${this.prefix}${this.baseEncode(bytes)}`;
    } else {
      throw Error("Unknown type, must be binary type");
    }
  }
};
var Decoder = class {
  static {
    __name(this, "Decoder");
  }
  name;
  prefix;
  baseDecode;
  prefixCodePoint;
  constructor(name, prefix, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    const prefixCodePoint = prefix.codePointAt(0);
    if (prefixCodePoint === void 0) {
      throw new Error("Invalid prefix character");
    }
    this.prefixCodePoint = prefixCodePoint;
    this.baseDecode = baseDecode;
  }
  decode(text) {
    if (typeof text === "string") {
      if (text.codePointAt(0) !== this.prefixCodePoint) {
        throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
      }
      return this.baseDecode(text.slice(this.prefix.length));
    } else {
      throw Error("Can only multibase decode strings");
    }
  }
  or(decoder) {
    return or(this, decoder);
  }
};
var ComposedDecoder = class {
  static {
    __name(this, "ComposedDecoder");
  }
  decoders;
  constructor(decoders) {
    this.decoders = decoders;
  }
  or(decoder) {
    return or(this, decoder);
  }
  decode(input) {
    const prefix = input[0];
    const decoder = this.decoders[prefix];
    if (decoder != null) {
      return decoder.decode(input);
    } else {
      throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
    }
  }
};
function or(left, right) {
  return new ComposedDecoder({
    ...left.decoders ?? { [left.prefix]: left },
    ...right.decoders ?? { [right.prefix]: right }
  });
}
__name(or, "or");
var Codec = class {
  static {
    __name(this, "Codec");
  }
  name;
  prefix;
  baseEncode;
  baseDecode;
  encoder;
  decoder;
  constructor(name, prefix, baseEncode, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name, prefix, baseEncode);
    this.decoder = new Decoder(name, prefix, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
};
function from({ name, prefix, encode: encode2, decode: decode2 }) {
  return new Codec(name, prefix, encode2, decode2);
}
__name(from, "from");
function baseX({ name, prefix, alphabet }) {
  const { encode: encode2, decode: decode2 } = base_x_default(alphabet, name);
  return from({
    prefix,
    name,
    encode: encode2,
    decode: /* @__PURE__ */ __name((text) => coerce(decode2(text)), "decode")
  });
}
__name(baseX, "baseX");
function decode(string, alphabetIdx, bitsPerChar, name) {
  let end = string.length;
  while (string[end - 1] === "=") {
    --end;
  }
  const out = new Uint8Array(end * bitsPerChar / 8 | 0);
  let bits = 0;
  let buffer = 0;
  let written = 0;
  for (let i2 = 0; i2 < end; ++i2) {
    const value = alphabetIdx[string[i2]];
    if (value === void 0) {
      throw new SyntaxError(`Non-${name} character`);
    }
    buffer = buffer << bitsPerChar | value;
    bits += bitsPerChar;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = 255 & buffer >> bits;
    }
  }
  if (bits >= bitsPerChar || (255 & buffer << 8 - bits) !== 0) {
    throw new SyntaxError("Unexpected end of data");
  }
  return out;
}
__name(decode, "decode");
function encode(data, alphabet, bitsPerChar) {
  const pad = alphabet[alphabet.length - 1] === "=";
  const mask = (1 << bitsPerChar) - 1;
  let out = "";
  let bits = 0;
  let buffer = 0;
  for (let i2 = 0; i2 < data.length; ++i2) {
    buffer = buffer << 8 | data[i2];
    bits += 8;
    while (bits > bitsPerChar) {
      bits -= bitsPerChar;
      out += alphabet[mask & buffer >> bits];
    }
  }
  if (bits !== 0) {
    out += alphabet[mask & buffer << bitsPerChar - bits];
  }
  if (pad) {
    while ((out.length * bitsPerChar & 7) !== 0) {
      out += "=";
    }
  }
  return out;
}
__name(encode, "encode");
function createAlphabetIdx(alphabet) {
  const alphabetIdx = {};
  for (let i2 = 0; i2 < alphabet.length; ++i2) {
    alphabetIdx[alphabet[i2]] = i2;
  }
  return alphabetIdx;
}
__name(createAlphabetIdx, "createAlphabetIdx");
function rfc4648({ name, prefix, bitsPerChar, alphabet }) {
  const alphabetIdx = createAlphabetIdx(alphabet);
  return from({
    prefix,
    name,
    encode(input) {
      return encode(input, alphabet, bitsPerChar);
    },
    decode(input) {
      return decode(input, alphabetIdx, bitsPerChar, name);
    }
  });
}
__name(rfc4648, "rfc4648");

// ../node_modules/multiformats/dist/src/bases/base32.js
var base32 = rfc4648({
  prefix: "b",
  name: "base32",
  alphabet: "abcdefghijklmnopqrstuvwxyz234567",
  bitsPerChar: 5
});
var base32upper = rfc4648({
  prefix: "B",
  name: "base32upper",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  bitsPerChar: 5
});
var base32pad = rfc4648({
  prefix: "c",
  name: "base32pad",
  alphabet: "abcdefghijklmnopqrstuvwxyz234567=",
  bitsPerChar: 5
});
var base32padupper = rfc4648({
  prefix: "C",
  name: "base32padupper",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=",
  bitsPerChar: 5
});
var base32hex = rfc4648({
  prefix: "v",
  name: "base32hex",
  alphabet: "0123456789abcdefghijklmnopqrstuv",
  bitsPerChar: 5
});
var base32hexupper = rfc4648({
  prefix: "V",
  name: "base32hexupper",
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
  bitsPerChar: 5
});
var base32hexpad = rfc4648({
  prefix: "t",
  name: "base32hexpad",
  alphabet: "0123456789abcdefghijklmnopqrstuv=",
  bitsPerChar: 5
});
var base32hexpadupper = rfc4648({
  prefix: "T",
  name: "base32hexpadupper",
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=",
  bitsPerChar: 5
});
var base32z = rfc4648({
  prefix: "h",
  name: "base32z",
  alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769",
  bitsPerChar: 5
});

// ../node_modules/multiformats/dist/src/bases/base58.js
var base58btc = baseX({
  name: "base58btc",
  prefix: "z",
  alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
});
var base58flickr = baseX({
  name: "base58flickr",
  prefix: "Z",
  alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
});

// ../node_modules/multiformats/dist/src/bases/base64.js
var base64 = rfc4648({
  prefix: "m",
  name: "base64",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  bitsPerChar: 6
});
var base64pad = rfc4648({
  prefix: "M",
  name: "base64pad",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  bitsPerChar: 6
});
var base64url = rfc4648({
  prefix: "u",
  name: "base64url",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  bitsPerChar: 6
});
var base64urlpad = rfc4648({
  prefix: "U",
  name: "base64urlpad",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=",
  bitsPerChar: 6
});

// ../node_modules/weald/node_modules/ms/dist/index.js
var e = 1e3;
var t = e * 60;
var n = t * 60;
var r = n * 24;
var i = r * 7;
var a = r * 365.25;
var o = a / 12;
function s(e2, t2) {
  if (typeof e2 == `string`) return l(e2);
  if (typeof e2 == `number`) return p(e2, t2);
  throw Error(`Value provided to ms() must be a string or number. value=${JSON.stringify(e2)}`);
}
__name(s, "s");
var c = s;
function l(s2) {
  if (typeof s2 != `string` || s2.length === 0 || s2.length > 100) throw Error(`Value provided to ms.parse() must be a string with length between 1 and 99. value=${JSON.stringify(s2)}`);
  let c2 = /^(?<value>-?\d*\.?\d+) *(?<unit>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mo|years?|yrs?|y)?$/i.exec(s2);
  if (!c2?.groups) return NaN;
  let { value: l2, unit: u = `ms` } = c2.groups, d2 = parseFloat(l2), f2 = u.toLowerCase();
  switch (f2) {
    case `years`:
    case `year`:
    case `yrs`:
    case `yr`:
    case `y`:
      return d2 * a;
    case `months`:
    case `month`:
    case `mo`:
      return d2 * o;
    case `weeks`:
    case `week`:
    case `w`:
      return d2 * i;
    case `days`:
    case `day`:
    case `d`:
      return d2 * r;
    case `hours`:
    case `hour`:
    case `hrs`:
    case `hr`:
    case `h`:
      return d2 * n;
    case `minutes`:
    case `minute`:
    case `mins`:
    case `min`:
    case `m`:
      return d2 * t;
    case `seconds`:
    case `second`:
    case `secs`:
    case `sec`:
    case `s`:
      return d2 * e;
    case `milliseconds`:
    case `millisecond`:
    case `msecs`:
    case `msec`:
    case `ms`:
      return d2;
    default:
      throw Error(`Unknown unit "${f2}" provided to ms.parse(). value=${JSON.stringify(s2)}`);
  }
}
__name(l, "l");
function d(s2) {
  let c2 = Math.abs(s2);
  return c2 >= a ? `${Math.round(s2 / a)}y` : c2 >= o ? `${Math.round(s2 / o)}mo` : c2 >= i ? `${Math.round(s2 / i)}w` : c2 >= r ? `${Math.round(s2 / r)}d` : c2 >= n ? `${Math.round(s2 / n)}h` : c2 >= t ? `${Math.round(s2 / t)}m` : c2 >= e ? `${Math.round(s2 / e)}s` : `${s2}ms`;
}
__name(d, "d");
function f(s2) {
  let c2 = Math.abs(s2);
  return c2 >= a ? m(s2, c2, a, `year`) : c2 >= o ? m(s2, c2, o, `month`) : c2 >= i ? m(s2, c2, i, `week`) : c2 >= r ? m(s2, c2, r, `day`) : c2 >= n ? m(s2, c2, n, `hour`) : c2 >= t ? m(s2, c2, t, `minute`) : c2 >= e ? m(s2, c2, e, `second`) : `${s2} ms`;
}
__name(f, "f");
function p(e2, t2) {
  if (typeof e2 != `number` || !Number.isFinite(e2)) throw Error(`Value provided to ms.format() must be of type number.`);
  return t2?.long ? f(e2) : d(e2);
}
__name(p, "p");
function m(e2, t2, n2, r2) {
  let i2 = t2 >= n2 * 1.5;
  return `${Math.round(e2 / n2)} ${r2}${i2 ? `s` : ``}`;
}
__name(m, "m");

// ../node_modules/weald/dist/src/common.js
function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce2;
  createDebug.disable = disable2;
  createDebug.enable = enable2;
  createDebug.enabled = enabled;
  createDebug.humanize = c;
  createDebug.destroy = destroy;
  Object.keys(env).forEach((key) => {
    createDebug[key] = env[key];
  });
  createDebug.names = [];
  createDebug.skips = [];
  createDebug.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i2 = 0; i2 < namespace.length; i2++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i2);
      hash |= 0;
    }
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  __name(selectColor, "selectColor");
  createDebug.selectColor = selectColor;
  function createDebug(namespace, options) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self = debug;
      const curr = Number(/* @__PURE__ */ new Date());
      const ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        if (match === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug.formatters[format];
        if (typeof formatter === "function") {
          const val = args[index];
          match = formatter.call(self, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });
      createDebug.formatArgs.call(self, args);
      if (options?.onLog != null) {
        options.onLog(...args);
      }
      const logFn = self.log || createDebug.log;
      logFn.apply(self, args);
    }
    __name(debug, "debug");
    debug.namespace = namespace;
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend;
    debug.destroy = createDebug.destroy;
    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: /* @__PURE__ */ __name(() => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug.namespaces) {
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }
        return enabledCache;
      }, "get"),
      set: /* @__PURE__ */ __name((v) => {
        enableOverride = v;
      }, "set")
    });
    if (typeof createDebug.init === "function") {
      createDebug.init(debug);
    }
    return debug;
  }
  __name(createDebug, "createDebug");
  function extend(namespace, delimiter) {
    const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  __name(extend, "extend");
  function enable2(namespaces) {
    createDebug.save(namespaces);
    createDebug.namespaces = namespaces;
    createDebug.names = [];
    createDebug.skips = [];
    let i2;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i2 = 0; i2 < len; i2++) {
      if (!split[i2]) {
        continue;
      }
      namespaces = split[i2].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
      } else {
        createDebug.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  __name(enable2, "enable");
  function disable2() {
    const namespaces = [
      ...createDebug.names.map(toNamespace),
      ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug.enable("");
    return namespaces;
  }
  __name(disable2, "disable");
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i2;
    let len;
    for (i2 = 0, len = createDebug.skips.length; i2 < len; i2++) {
      if (createDebug.skips[i2].test(name)) {
        return false;
      }
    }
    for (i2 = 0, len = createDebug.names.length; i2 < len; i2++) {
      if (createDebug.names[i2].test(name)) {
        return true;
      }
    }
    return false;
  }
  __name(enabled, "enabled");
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  __name(toNamespace, "toNamespace");
  function coerce2(val) {
    if (val instanceof Error) {
      return val.stack ?? val.message;
    }
    return val;
  }
  __name(coerce2, "coerce");
  function destroy() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  __name(destroy, "destroy");
  createDebug.setupFormatters(createDebug.formatters);
  createDebug.enable(createDebug.load());
  return createDebug;
}
__name(setup, "setup");

// ../node_modules/weald/dist/src/browser.js
var storage = localstorage();
var colors = [
  "#0000CC",
  "#0000FF",
  "#0033CC",
  "#0033FF",
  "#0066CC",
  "#0066FF",
  "#0099CC",
  "#0099FF",
  "#00CC00",
  "#00CC33",
  "#00CC66",
  "#00CC99",
  "#00CCCC",
  "#00CCFF",
  "#3300CC",
  "#3300FF",
  "#3333CC",
  "#3333FF",
  "#3366CC",
  "#3366FF",
  "#3399CC",
  "#3399FF",
  "#33CC00",
  "#33CC33",
  "#33CC66",
  "#33CC99",
  "#33CCCC",
  "#33CCFF",
  "#6600CC",
  "#6600FF",
  "#6633CC",
  "#6633FF",
  "#66CC00",
  "#66CC33",
  "#9900CC",
  "#9900FF",
  "#9933CC",
  "#9933FF",
  "#99CC00",
  "#99CC33",
  "#CC0000",
  "#CC0033",
  "#CC0066",
  "#CC0099",
  "#CC00CC",
  "#CC00FF",
  "#CC3300",
  "#CC3333",
  "#CC3366",
  "#CC3399",
  "#CC33CC",
  "#CC33FF",
  "#CC6600",
  "#CC6633",
  "#CC9900",
  "#CC9933",
  "#CCCC00",
  "#CCCC33",
  "#FF0000",
  "#FF0033",
  "#FF0066",
  "#FF0099",
  "#FF00CC",
  "#FF00FF",
  "#FF3300",
  "#FF3333",
  "#FF3366",
  "#FF3399",
  "#FF33CC",
  "#FF33FF",
  "#FF6600",
  "#FF6633",
  "#FF9900",
  "#FF9933",
  "#FFCC00",
  "#FFCC33"
];
function useColors() {
  if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
    return true;
  }
  if (typeof navigator !== "undefined" && navigator.userAgent?.toLowerCase().match(/(edge|trident)\/(\d+)/) != null) {
    return false;
  }
  return typeof document !== "undefined" && document.documentElement?.style?.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
  // @ts-expect-error window.console.firebug and window.console.exception are not in the types
  typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
  // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
  typeof navigator !== "undefined" && navigator.userAgent?.toLowerCase().match(/firefox\/(\d+)/) != null && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
  typeof navigator !== "undefined" && navigator.userAgent?.toLowerCase().match(/applewebkit\/(\d+)/);
}
__name(useColors, "useColors");
function formatArgs(args) {
  args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + c(this.diff);
  if (!this.useColors) {
    return;
  }
  const c2 = "color: " + this.color;
  args.splice(1, 0, c2, "color: inherit");
  let index = 0;
  let lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, (match) => {
    if (match === "%%") {
      return;
    }
    index++;
    if (match === "%c") {
      lastC = index;
    }
  });
  args.splice(lastC, 0, c2);
}
__name(formatArgs, "formatArgs");
var log = console.debug ?? console.log ?? (() => {
});
function save(namespaces) {
  try {
    if (namespaces) {
      storage?.setItem("debug", namespaces);
    } else {
      storage?.removeItem("debug");
    }
  } catch (error) {
  }
}
__name(save, "save");
function load() {
  let r2;
  try {
    r2 = storage?.getItem("debug");
  } catch (error) {
  }
  if (!r2 && typeof globalThis.process !== "undefined" && "env" in globalThis.process) {
    r2 = globalThis.process.env.DEBUG;
  }
  return r2;
}
__name(load, "load");
function localstorage() {
  try {
    return localStorage;
  } catch (error) {
  }
}
__name(localstorage, "localstorage");
function setupFormatters(formatters) {
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
}
__name(setupFormatters, "setupFormatters");
var browser_default = setup({ formatArgs, save, load, useColors, setupFormatters, colors, storage, log });

// ../node_modules/weald/dist/src/index.js
var src_default = browser_default;

// ../node_modules/@libp2p/logger/dist/src/index.js
src_default.formatters.b = (v) => {
  return v == null ? "undefined" : base58btc.baseEncode(v);
};
src_default.formatters.t = (v) => {
  return v == null ? "undefined" : base32.baseEncode(v);
};
src_default.formatters.m = (v) => {
  return v == null ? "undefined" : base64.baseEncode(v);
};
src_default.formatters.p = (v) => {
  return v == null ? "undefined" : v.toString();
};
src_default.formatters.c = (v) => {
  return v == null ? "undefined" : v.toString();
};
src_default.formatters.k = (v) => {
  return v == null ? "undefined" : v.toString();
};
src_default.formatters.a = (v) => {
  return v == null ? "undefined" : v.toString();
};
function formatError(v, indent = "") {
  const message = notEmpty(v.message);
  const stack = notEmpty(v.stack);
  if (message != null && stack != null) {
    if (stack.includes(message)) {
      return `${stack.split("\n").join(`
${indent}`)}`;
    }
    return `${message}
${indent}${stack.split("\n").join(`
${indent}`)}`;
  }
  if (stack != null) {
    return `${stack.split("\n").join(`
${indent}`)}`;
  }
  if (message != null) {
    return `${message}`;
  }
  return `${v.toString()}`;
}
__name(formatError, "formatError");
function isAggregateError(err) {
  return err instanceof AggregateError || err?.name === "AggregateError" && Array.isArray(err.errors);
}
__name(isAggregateError, "isAggregateError");
function printError(err, indent = "") {
  if (isAggregateError(err)) {
    let output = formatError(err, indent);
    if (err.errors.length > 0) {
      indent = `${indent}    `;
      output += `
${indent}${err.errors.map((err2) => `${printError(err2, `${indent}`)}`).join(`
${indent}`)}`;
    } else {
      output += `
${indent}[Error list was empty]`;
    }
    return output.trim();
  }
  return formatError(err, indent);
}
__name(printError, "printError");
src_default.formatters.e = (v) => {
  if (v == null) {
    return "undefined";
  }
  return printError(v);
};
function createDisabledLogger(namespace) {
  const logger2 = /* @__PURE__ */ __name(() => {
  }, "logger");
  logger2.enabled = false;
  logger2.color = "";
  logger2.diff = 0;
  logger2.log = () => {
  };
  logger2.namespace = namespace;
  logger2.destroy = () => true;
  logger2.extend = () => logger2;
  return logger2;
}
__name(createDisabledLogger, "createDisabledLogger");
function logger(name, options) {
  let trace = createDisabledLogger(`${name}:trace`);
  if (src_default.enabled(`${name}:trace`) && src_default.names.map((r2) => r2.toString()).find((n2) => n2.includes(":trace")) != null) {
    trace = src_default(`${name}:trace`, options);
  }
  return Object.assign(src_default(name, options), {
    error: src_default(`${name}:error`, options),
    trace,
    newScope: /* @__PURE__ */ __name((scope) => logger(`${name}:${scope}`, options), "newScope")
  });
}
__name(logger, "logger");
function notEmpty(str) {
  if (str == null) {
    return;
  }
  str = str.trim();
  if (str.length === 0) {
    return;
  }
  return str;
}
__name(notEmpty, "notEmpty");

// ../modules/index.mjs
var COLORS = {
  WARN: "\x1B[33m",
  // Темно-желтый
  INFO: "\x1B[36m",
  // Голубой
  DEBUG: "\x1B[90m",
  // Серый
  ERROR: "\x1B[31m",
  // Красный
  RESET: "\x1B[0m"
  // Сброс
};
function createLogger(prefix) {
  const baseLogger = logger(prefix);
  const enhancedLogger = /* @__PURE__ */ __name((...args) => baseLogger(...args), "enhancedLogger");
  enhancedLogger.trace = baseLogger.trace;
  enhancedLogger.warn = (...args) => {
    baseLogger(`${COLORS.WARN}\u26A0\uFE0F WARN:${COLORS.RESET}`, ...args);
  };
  enhancedLogger.info = (...args) => {
    baseLogger(`${COLORS.INFO}\u2139\uFE0F INFO:${COLORS.RESET}`, ...args);
  };
  enhancedLogger.debug = (...args) => {
    baseLogger(`${COLORS.DEBUG}\u{1F50D} DEBUG:${COLORS.RESET}`, ...args);
  };
  enhancedLogger.error = (...args) => {
    baseLogger(`${COLORS.ERROR}\u274C ERROR:${COLORS.RESET}`, ...args);
  };
  return enhancedLogger;
}
__name(createLogger, "createLogger");

// wysiwyg/public/scroll.mjs
var ScrollManager = class {
  static {
    __name(this, "ScrollManager");
  }
  constructor() {
    this.scrollTimeout = null;
    this.isScrolling = false;
    this.debounceDelay = 200;
    this.init();
  }
  init() {
    document.addEventListener("scroll", () => {
      this.handleScrollStart();
    }, { passive: true });
    this.checkScrollNecessity();
  }
  handleScrollStart() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      document.documentElement.classList.add("scrolling");
    }
    this.clearTimeout();
    this.scrollTimeout = setTimeout(() => {
      this.handleScrollEnd();
    }, this.debounceDelay);
  }
  handleScrollEnd() {
    this.isScrolling = false;
    document.documentElement.classList.remove("scrolling");
  }
  clearTimeout() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }
  checkScrollNecessity() {
    const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
    if (!hasScrollbar) {
      document.documentElement.style.setProperty("--scrollbar-visibility", "hidden");
      document.documentElement.style.setProperty("--scrollbar-opacity", "0");
    }
  }
  // Метод для принудительного показа/скрытия
  showScrollbar() {
    document.documentElement.classList.add("scrolling");
  }
  hideScrollbar() {
    document.documentElement.classList.remove("scrolling");
  }
  // Обновить настройки
  updateSettings(delay = 1500) {
    this.debounceDelay = delay;
  }
};

// wysiwyg/public/base/base-component.mjs
var log2 = logger("base-component");
var exclusion = [];
var BaseComponent = class _BaseComponent extends HTMLElement {
  static {
    __name(this, "BaseComponent");
  }
  static pendingRequests = /* @__PURE__ */ new Map();
  static observedAttributes = ["*"];
  static MAX_POLLING_INTERVAL = 100;
  // ms
  static errorStore = [];
  static ERROR_STORE_LIMIT = 10;
  // Лимит записей
  constructor() {
    super();
    if (new.target === _BaseComponent) {
      throw new Error("\u042F\u0422\u041E-ABS1: \u041D\u0435\u043B\u044C\u0437\u044F \u0438\u043D\u0441\u0442\u0430\u043D\u0446\u0438\u0438\u0440\u043E\u0432\u0430\u0442\u044C BaseComponent \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E");
    }
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.#templateImported = false;
    this.getComponentAsync = _BaseComponent.getComponentAsync;
    this.addError = _BaseComponent.addError;
    this.getErrors = _BaseComponent.getErrors;
    this.clearErrors = _BaseComponent.clearErrors;
    this.getComponent = _BaseComponent.getComponent;
    this.pendingRequests = _BaseComponent.pendingRequests;
    this.#isReady = false;
    this.#isQuantum = false;
    this.entropy = 1;
    this.qubits = 0;
    this.getTemplate = () => "<div>\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D</div>";
    this._id = this.constructor.generateId();
    this._isLoading = false;
    log2(`\u0421\u043E\u0437\u0434\u0430\u043D \u044D\u043A\u0437\u0435\u043C\u043F\u043B\u044F\u0440 ${this.constructor.name} \u0441 ID: ${this._id}`);
  }
  // Приватные поля
  #templateImported = false;
  #isReady = false;
  #isQuantum = false;
  /**
   * Добавляет ошибку в статическое хранилище ошибок.
   * @param {Object} errorData - Данные об ошибке.
   * @param {string} errorData.componentName - Имя компонента, где произошла ошибка.
   * @param {string} errorData.source - Источник ошибки (например, 'controller', 'actions', 'render').
   * @param {string} errorData.message - Сообщение об ошибки.
   * @param {any} [errorData.details] - Дополнительные детали (например, объект ошибки, состояние).
   * @param {number} [errorData.timestamp] - Временная метка ошибки.
   */
  static addError(errorData) {
    const errorEntry = {
      timestamp: Date.now(),
      ...errorData
    };
    _BaseComponent.errorStore.unshift(errorEntry);
    if (_BaseComponent.errorStore.length > _BaseComponent.ERROR_STORE_LIMIT) {
      _BaseComponent.errorStore = _BaseComponent.errorStore.slice(0, _BaseComponent.ERROR_STORE_LIMIT);
    }
    console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430 \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435. \u0412\u0441\u0435\u0433\u043E \u0437\u0430\u043F\u0438\u0441\u0435\u0439: ${_BaseComponent.errorStore.length}`, errorEntry);
  }
  /**
   * Получает копию текущего хранилища ошибок.
   * @returns {Array} Массив объектов с данными об ошибках.
   */
  static getErrors() {
    return [..._BaseComponent.errorStore];
  }
  /**
   * Очищает хранилище ошибок.
   */
  static clearErrors() {
    _BaseComponent.errorStore = [];
    log2("\u0425\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u043E\u0448\u0438\u0431\u043E\u043A \u043E\u0447\u0438\u0449\u0435\u043D\u043E.");
  }
  /**
   * Отображает универсальное модальное окно.
   * @param {Object} options - Параметры модального окна.
   * @param {string} options.title - Заголовок модального окна.
   * @param {string} options.content - HTML-содержимое модального окна.
   * @param {Array<Object>} [options.buttons] - Массив объектов кнопок.
   *   Каждый объект: { text: string, type: string (e.g., 'primary', 'secondary'), action: Function }
   * @param {boolean} [options.closeOnBackdropClick=true] - Закрывать ли окно по клику на подложке.
   * @returns {Promise<void>} - Promise, разрешающийся при закрытии модального окна.
   */
  showModal({ title = "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F", content = "", buttons = [], closeOnBackdropClick = true } = {}) {
    return new Promise((resolve) => {
      const modalBackdrop = document.createElement("div");
      modalBackdrop.className = "yato-modal-backdrop";
      const currentModal = document.body.querySelector(".yato-modal-backdrop");
      if (currentModal) {
        currentModal.remove();
      }
      const closeModal = /* @__PURE__ */ __name(() => {
        if (modalBackdrop.parentNode) {
          modalBackdrop.parentNode.removeChild(modalBackdrop);
        }
        resolve();
      }, "closeModal");
      const modalWrapper = document.createElement("div");
      modalWrapper.className = "yato-modal-wrapper";
      modalWrapper.setAttribute("role", "dialog");
      modalWrapper.setAttribute("aria-modal", "true");
      modalWrapper.setAttribute("aria-labelledby", "yato-modal-title");
      const modalContent = document.createElement("div");
      modalContent.className = "yato-modal-content";
      const modalHeader = document.createElement("div");
      modalHeader.className = "yato-modal-header";
      const modalTitle = document.createElement("h3");
      modalTitle.id = "yato-modal-title";
      modalTitle.className = "yato-modal-title";
      modalTitle.textContent = title;
      const modalCloseButton = document.createElement("button");
      modalCloseButton.type = "button";
      modalCloseButton.className = "yato-modal-close-button";
      modalCloseButton.setAttribute("aria-label", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C");
      modalCloseButton.innerHTML = "&times;";
      const modalBody = document.createElement("div");
      modalBody.className = "yato-modal-body";
      modalBody.innerHTML = content;
      const modalFooter = document.createElement("div");
      modalFooter.className = "yato-modal-footer";
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(modalCloseButton);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      if (buttons && buttons.length > 0) {
        buttons.forEach((btnConfig) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `yato-button ${btnConfig.type ? btnConfig.type : "secondary"}`;
          button.textContent = btnConfig.text || "OK";
          button.onclick = () => {
            if (typeof btnConfig.action === "function") {
              try {
                btnConfig.action();
              } catch (e2) {
                console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0435 \u043A\u043D\u043E\u043F\u043A\u0438 \u043C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u043A\u043D\u0430:", e2);
              }
            }
            closeModal();
          };
          modalFooter.appendChild(button);
        });
        modalContent.appendChild(modalFooter);
      } else {
        const defaultCloseButton = document.createElement("button");
        defaultCloseButton.type = "button";
        defaultCloseButton.className = "yato-button primary";
        defaultCloseButton.textContent = "\u0417\u0430\u043A\u0440\u044B\u0442\u044C";
        defaultCloseButton.onclick = closeModal;
        modalFooter.appendChild(defaultCloseButton);
        modalContent.appendChild(modalFooter);
      }
      modalWrapper.appendChild(modalContent);
      modalBackdrop.appendChild(modalWrapper);
      modalCloseButton.onclick = closeModal;
      if (closeOnBackdropClick !== false) {
        modalBackdrop.onclick = (event) => {
          if (event.target === modalBackdrop) {
            closeModal();
          }
        };
      }
      const handleKeyDown = /* @__PURE__ */ __name((event) => {
        if (event.key === "Escape") {
          closeModal();
          document.removeEventListener("keydown", handleKeyDown);
        }
      }, "handleKeyDown");
      document.addEventListener("keydown", handleKeyDown);
      document.body.appendChild(modalBackdrop);
    });
  }
  static generateId() {
    return "yato-" + Math.random().toString(36).substr(2, 9);
  }
  /**
   * @private
   */
  async connectedCallback() {
    try {
      log2(`${this.constructor.name} \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u043A DOM.`);
      await this.#initComponent(this.state);
      log2(`${this.constructor.name} \u0433\u043E\u0442\u043E\u0432.`);
    } catch (error) {
      console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u0432 connectedCallback \u0434\u043B\u044F ${this.constructor.name}:`, error);
      await this.#render({ error: error.message });
    }
  }
  /**
   * @private
   */
  async disconnectedCallback() {
    log2(`${this.constructor.name} \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D \u043E\u0442 DOM.`);
    await this._componentDisconnected();
  }
  /**
   * @private
   */
  async adoptedCallback() {
    log2(`${this.constructor.name} \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D \u0432 \u043D\u043E\u0432\u044B\u0439 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442.`);
    await this._componentAdopted();
  }
  /**
   * @private
   */
  async attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (this.#templateImported) {
      await this._componentAttributeChanged(name, oldValue, newValue);
      log2(`\u0410\u0442\u0440\u0438\u0431\u0443\u0442 ${name} \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u0441 '${oldValue}' \u043D\u0430 '${newValue}'.`);
    }
  }
  async #initComponent(state) {
    const type = this.dataset.type;
    if (!exclusion.includes(this.tagName)) {
      this.#templateImported = true;
      if (type !== "server" && !this.hasAttribute("data-no-render")) {
        await this.#loadComponentStyles();
        await this.showSkeleton();
      }
    }
    await this._componentReady();
    await this.#registerComponent();
  }
  async #loadComponentStyles() {
    try {
      const componentTagName = this.constructor.tagName || this.tagName.toLowerCase();
      let cssPath = new URL(`../components/${componentTagName}/css/index.css`, import.meta.url);
      const style = document.createElement("style");
      style.textContent = `@import url('.${cssPath.pathname}');`;
      this.shadowRoot.appendChild(style);
      log2(`\u0421\u0442\u0438\u043B\u0438 \u0434\u043B\u044F ${this.constructor.name} \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B \u0438\u0437 ${cssPath}`);
    } catch (error) {
      console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u0442\u0438\u043B\u0435\u0439 \u0434\u043B\u044F ${this.constructor.name}:`, error);
    }
  }
  // В метод showSkeleton добавляем:
  async showSkeleton() {
    this._isLoading = true;
    const container = this.shadowRoot.querySelector("#root") || document.createElement("div");
    container.id = "root";
    container.classList.add("skeleton-container");
    if (!this.shadowRoot.querySelector("#skeleton-styles")) {
      const style = document.createElement("style");
      style.id = "skeleton-styles";
      style.textContent = `
                /* \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u0442\u0438\u043B\u0438 \u0441\u043A\u0435\u043B\u0435\u0442\u043E\u043D\u0430 \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432 */
                :host {
                    position: relative;
                }
                .skeleton-container * {
                    pointer-events: none !important;
                    user-select: none !important;
                }
                
                .skeleton-container :not(style, script, link, meta) {
                    color: transparent !important;
                    background-size: 200% 100% !important;
                    animation: skeleton-loading 1.5s infinite !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                }
                
                .skeleton-container :not(style, script, link, meta)::before {
                    content: "" !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: inherit !important;
                    border-radius: inherit !important;
                    z-index: 1 !important;
                }
                
                @keyframes skeleton-loading {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                /* \u0422\u0435\u043C\u043D\u0430\u044F \u0442\u0435\u043C\u0430 \u0434\u043B\u044F \u0441\u043A\u0435\u043B\u0435\u0442\u043E\u043D\u0430 */
                [data-theme="dark"] .skeleton-container :not(style, script, link, meta) {
                    background: linear-gradient(90deg, #2d3748 25%, #4a5568 50%, #2d3748 75%) !important;
                }
                
                /* \u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B \u0444\u043E\u0440\u043C */
                .skeleton-container form,
                .skeleton-container input,
                .skeleton-container textarea,
                .skeleton-container select,
                .skeleton-container button {
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: block !important;
                }
                
                /* \u041A\u0440\u0443\u0433\u043B\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B */
                .skeleton-container img,
                .skeleton-container [class*="avatar"],
                .skeleton-container [class*="circle"] {
                    border-radius: 50% !important;
                }
        `;
      this.shadowRoot.appendChild(style);
    }
  }
  async hideSkeleton() {
    this._isLoading = false;
    const container = this.shadowRoot.querySelector("#root");
    if (container) {
      container.classList.remove("skeleton-container");
    }
  }
  /**
   * Проверяет, активна ли скелетон-загрузка
   * @returns {boolean}
   */
  isLoading() {
    return this._isLoading;
  }
  // В класс BaseComponent добавим метод fullRender
  async fullRender(state = {}) {
    try {
      await this.#render({
        state,
        context: this
      });
      this.#isReady = true;
      log2(`\u041F\u043E\u043B\u043D\u044B\u0439 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D \u0434\u043B\u044F ${this.constructor.name}`);
      return true;
    } catch (error) {
      console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u043D\u043E\u0433\u043E \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430:`, error);
      return false;
    }
  }
  /**
   * Рендерит конкретную часть шаблона в указанный селектор
   * @param {Object} options - Параметры рендеринга
   * @param {string} options.partName - Название метода шаблона (по умолчанию 'defaultTemplate')
   * @param {Object} options.state - Состояние для рендеринга
   * @param {string} options.selector - CSS селектор целевого элемента
   * @param {string} [options.method='innerHTML'] - Метод вставки: 'innerHTML', 'append', 'prepend', 'before', 'after'
   * @returns {Promise<boolean>} Успешность операции
   */
  async renderPart({ partName = "defaultTemplate", state = {}, selector, method = "innerHTML" } = {}) {
    try {
      if (!this._templateMethods || !this._templateMethods[partName]) {
        console.error(`\u041C\u0435\u0442\u043E\u0434 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 '${partName}' \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 ${this.constructor.name}`);
        return false;
      }
      if (!selector) {
        console.error(`\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u0434\u043B\u044F \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430 \u0447\u0430\u0441\u0442\u0438 '${partName}'`);
        return false;
      }
      const targetElement = this.shadowRoot.querySelector(selector);
      if (!targetElement) {
        console.error(`\u042D\u043B\u0435\u043C\u0435\u043D\u0442 \u0441 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u043E\u043C '${selector}' \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D`);
        return false;
      }
      const htmlContent = await this._templateMethods[partName]({
        state,
        context: this
      });
      switch (method) {
        case "innerHTML":
          targetElement.innerHTML = htmlContent;
          break;
        case "append":
          targetElement.insertAdjacentHTML("beforeend", htmlContent);
          break;
        case "prepend":
          targetElement.insertAdjacentHTML("afterbegin", htmlContent);
          break;
        case "before":
          targetElement.insertAdjacentHTML("beforebegin", htmlContent);
          break;
        case "after":
          targetElement.insertAdjacentHTML("afterend", htmlContent);
          break;
        default:
          console.error(`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043C\u0435\u0442\u043E\u0434 \u0432\u0441\u0442\u0430\u0432\u043A\u0438: ${method}`);
          return false;
      }
      log2(`\u0427\u0430\u0441\u0442\u044C '${partName}' \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u0440\u0435\u043D\u0434\u0435\u0440\u0435\u043D\u0430 \u0432 '${selector}' \u043C\u0435\u0442\u043E\u0434\u043E\u043C '${method}'`);
      await this.#waitForDOMUpdate();
      await this.#setupEventListeners();
      return true;
    } catch (error) {
      console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430 \u0447\u0430\u0441\u0442\u0438 '${partName}':`, error);
      this.addError({
        componentName: this.constructor.name,
        source: "renderPart",
        message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430 \u0447\u0430\u0441\u0442\u0438 ${partName}`,
        details: error
      });
      return false;
    }
  }
  /**
   * Универсальный метод для обновления содержимого элементов
   * @param {Object} options - Параметры обновления
   * @param {string} options.selector - CSS селектор целевого элемента
   * @param {string|number|boolean} options.value - Значение для установки
   * @param {string} [options.property='textContent'] - Свойство элемента для обновления:
   *   - 'textContent' для текстового содержимого
   *   - 'innerHTML' для HTML содержимого
   *   - 'value' для input, textarea, select
   *   - 'checked' для checkbox
   *   - 'src' для изображений
   *   - 'href' для ссылок
   *   - 'className' для классов
   *   - 'style' для стилей (передавать объект)
   *   - любое другое свойство элемента
   * @param {string} [options.action='set'] - Действие: 'set', 'append', 'prepend', 'toggle', 'add', 'remove'
   * @returns {Promise<boolean>} Успешность операции
   */
  async updateElement({ selector, value, property = "textContent", action = "set" } = {}) {
    try {
      if (!selector) {
        console.warn(`[\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442] \u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430`);
        return false;
      }
      const targetElement = this.shadowRoot.querySelector(selector);
      if (!targetElement) {
        console.warn(`[\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442] \u042D\u043B\u0435\u043C\u0435\u043D\u0442 \u0441 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u043E\u043C '${selector}' \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D`);
        return false;
      }
      if (selector === ".network-addresses") {
        console.log("--------------------- targetElement ----------------------------", action, targetElement);
      }
      switch (action) {
        case "set":
          if (property === "style" && typeof value === "object") {
            Object.assign(targetElement.style, value);
          } else if (property === "className" && typeof value === "string") {
            targetElement.className = value;
          } else if (property === "dataset.theme" && typeof value === "string") {
            targetElement.dataset.theme = value;
          } else {
            targetElement[property] = value;
          }
          break;
        case "append":
          if (property === "innerHTML" || property === "textContent") {
            targetElement[property] += value;
          } else if (property === "value") {
            targetElement.value += String(value);
          }
          break;
        case "prepend":
          if (property === "innerHTML" || property === "textContent") {
            targetElement[property] = value + targetElement[property];
          } else if (property === "value") {
            targetElement.value = String(value) + targetElement.value;
          }
          break;
        case "toggle":
          if (property === "checked" || property === "disabled" || property === "hidden") {
            targetElement[property] = !targetElement[property];
          } else if (property === "className") {
            targetElement.classList.toggle(String(value));
          }
          break;
        case "add":
          if (property === "className") {
            targetElement.classList.add(String(value));
          }
          break;
        case "remove":
          if (property === "className") {
            targetElement.classList.remove(String(value));
          }
          break;
        default:
          console.warn(`[\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442] \u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435: ${action}`);
          return false;
      }
      return true;
    } catch (error) {
      console.error(`[\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 '${selector}':`, error);
      this.addError({
        componentName: this.constructor.name,
        source: "updateElement",
        message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 ${selector}`,
        details: error
      });
      return false;
    }
  }
  async #render({ partName = "defaultTemplate", state = {}, selector = "*" } = {}) {
    try {
      if (this._templateMethods) {
        const storedState = this.state || {};
        const mergedState = { ...storedState, ...state };
        const rootContainer = document.createElement("div");
        if (!this._templateMethods[partName]) {
          partName = "default";
        }
        rootContainer.insertAdjacentHTML("beforeend", await this._templateMethods[partName]({
          state: mergedState,
          context: this
        }));
        rootContainer.id = "root";
        if (selector === "*") {
          const rootContainerExist = this.shadowRoot.querySelector("#root");
          if (rootContainerExist) {
            rootContainerExist.remove();
          }
          this.shadowRoot.appendChild(rootContainer);
        } else {
          const rootContainerExist = this.shadowRoot.querySelector(selector);
          rootContainerExist.innerHTML = "";
          rootContainerExist.appendChild(rootContainer);
        }
        await this.#waitForDOMUpdate();
        await this.#setupEventListeners();
        await this.hideSkeleton();
        log2(`${this.constructor.name} \u043E\u0442\u0440\u0435\u043D\u0434\u0435\u0440\u0435\u043D \u0441 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435\u043C:`, mergedState);
      } else {
        console.error(`${this.constructor.name} \u0442\u0435\u043C\u043F\u043B\u0435\u0439\u0442 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D`);
      }
    } catch (error) {
      console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430 \u0434\u043B\u044F ${this.constructor.name}:`, error);
      this.shadowRoot.innerHTML = `<p style="color:red;">\u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430: ${error.message}</p>`;
    }
  }
  async #waitForDOMUpdate(timeout = 100) {
    return new Promise((resolve) => {
      const rafId = requestAnimationFrame(() => {
        clearTimeout(timeoutId);
        resolve();
      });
      const timeoutId = setTimeout(() => {
        cancelAnimationFrame(rafId);
        resolve();
      }, timeout);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
      };
    });
  }
  async #setupEventListeners() {
    if (this?._controller?.destroy) {
      this._controller.destroy();
    }
    if (this?._controller?.init) {
      this._controller.init();
    }
    log2(`${this.constructor.name} \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u043E\u0432 \u0441\u043E\u0431\u044B\u0442\u0438\u0439 (\u0431\u0430\u0437\u043E\u0432\u0430\u044F \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F).`);
  }
  async #registerComponent() {
    try {
      if (!this.id) {
        console.error("\u042F\u0422\u041E-ID1: \u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u0436\u0435\u043B\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u0438\u043C\u0435\u0435\u0442 ID \u0434\u043B\u044F \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438");
        throw new Error("\u042F\u0422\u041E-ID1: \u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 ID");
        return;
      }
      const key = `${this.tagName.toLowerCase()}:${this.id}`;
      _BaseComponent.pendingRequests.set(key, this);
      if (this.tagName.toLowerCase() === "navigation-manager" || this.tagName.toLowerCase() === "navigation-sections") {
        log2(`${this.constructor.name} \u0441 ID ${this.id} \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D.`);
      }
    } catch (e2) {
      console.error(e2.toString(), this.tagName.toLowerCase());
    }
  }
  /**
   * Асинхронно получает экземпляр компонента, ожидая его регистрации, если необходимо.
   * @param {string} tagName - Тег компонента.
   * @param {string} id - Идентификатор экземпляра.
   * @param {number} timeout - Таймаут в миллисекундах.
   * @returns {Promise<BaseComponent|null>}
   * @static
   */
  static async getComponentAsync(tagName, id, timeout = 5e3) {
    const key = `${tagName}:${id}`;
    let component = _BaseComponent.pendingRequests.get(key);
    if (component) {
      return Promise.resolve(component);
    }
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error(`\u0422\u0430\u0439\u043C\u0430\u0443\u0442 \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430 '${key}'.`);
          resolve(null);
        }
      }, timeout);
      const checkComponent = /* @__PURE__ */ __name(() => {
        if (resolved) return;
        component = _BaseComponent.pendingRequests.get(key);
        if (component) {
          clearTimeout(timeoutId);
          resolved = true;
          log2(`\u0410\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u043E \u043D\u0430\u0439\u0434\u0435\u043D \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 '${key}'.`);
          resolve(component);
        } else {
          setTimeout(checkComponent, _BaseComponent.MAX_POLLING_INTERVAL);
        }
      }, "checkComponent");
      checkComponent();
    });
  }
  async postMessage(event) {
    log2(`\u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430 ${this.constructor.name} \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u043E.`);
  }
  async _componentReady() {
    log2(`${this.constructor.name} \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u0433\u043E\u0442\u043E\u0432 (\u0431\u0430\u0437\u043E\u0432\u0430\u044F \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F).`);
  }
  async _componentAttributeChanged() {
    log2(`${this.constructor.name} \u0410\u0442\u0440\u0438\u0431\u0443\u0442\u044B \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u044B (\u0431\u0430\u0437\u043E\u0432\u0430\u044F \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F).`);
  }
  async _componentAdopted() {
    log2(`${this.constructor.name} \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D (\u0431\u0430\u0437\u043E\u0432\u0430\u044F \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F).`);
  }
  async _componentDisconnected() {
    log2(`${this.constructor.name} \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D (\u0431\u0430\u0437\u043E\u0432\u0430\u044F \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F).`);
  }
};

// wysiwyg/public/components/wysiwyg-editor/template/index.mjs
var template_exports = {};
__export(template_exports, {
  advancedTemplate: () => advancedTemplate,
  compactTemplate: () => compactTemplate,
  defaultTemplate: () => defaultTemplate,
  editorOnlyTemplate: () => editorOnlyTemplate,
  errorTemplate: () => errorTemplate,
  loadingTemplate: () => loadingTemplate,
  minimalTemplate: () => minimalTemplate,
  readOnlyTemplate: () => readOnlyTemplate,
  statsTemplate: () => statsTemplate,
  toolbarTemplate: () => toolbarTemplate
});
async function defaultTemplate({ state = {} }) {
  const {
    wordCount = 0,
    charCount = 0,
    paragraphCount = 0,
    formats = [],
    id = "",
    theme = "light",
    readOnly = false
  } = state;
  return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">\u{1F4DD}</span>
                        WYSIWYG Editor
                        ${readOnly ? '<span class="read-only-badge">\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435</span>' : ""}
                    </h3>
                    <div class="action-bar">
                        <button class="btn btn-success export-html" title="Export as HTML" ${readOnly ? "disabled" : ""}>
                            <span>\u{1F4C4}</span> Export HTML
                        </button>
                        <button class="btn btn-info export-text" title="Export as Text" ${readOnly ? "disabled" : ""}>
                            <span>\u{1F4DD}</span> Export Text
                        </button>
                        <button class="btn btn-warning theme-toggle" title="Toggle Theme">
                            <span>${theme === "light" ? "\u{1F319}" : "\u2600\uFE0F"}</span> 
                            ${theme === "light" ? "Dark" : "Light"} Mode
                        </button>
                        <button class="btn btn-danger clear-editor" title="Clear Editor" ${readOnly ? "disabled" : ""}>
                            <span>\u{1F5D1}\uFE0F</span> Clear
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="editor-container">
                        <div id="editor-${id}" class="quill-editor"></div>
                    </div>
                    <div class="stats-section">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value" id="wordCount">${wordCount}</div>
                                <div class="stat-label">Words</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="charCount">${charCount}</div>
                                <div class="stat-label">Characters</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="paragraphCount">${paragraphCount}</div>
                                <div class="stat-label">Paragraphs</div>
                            </div>
                        </div>
                        
                        <div class="format-info">
                            <strong>Current Format:</strong>
                            <div class="formats-display" id="formatsDisplay">
                                ${formats.length > 0 ? formats.join(", ") : "Normal text"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(defaultTemplate, "defaultTemplate");
async function minimalTemplate({ state = {} }) {
  const { id = "", theme = "light" } = state;
  return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-content">
                    <div class="editor-container">
                        <div id="editor-${id}" class="quill-editor"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(minimalTemplate, "minimalTemplate");
async function editorOnlyTemplate({ state = {} }) {
  const { id = "", theme = "light" } = state;
  return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="editor-container">
                <div id="editor-${id}" class="quill-editor"></div>
            </div>
        </div>
    `;
}
__name(editorOnlyTemplate, "editorOnlyTemplate");
async function statsTemplate({ state = {} }) {
  const {
    wordCount = 0,
    charCount = 0,
    paragraphCount = 0,
    formats = []
  } = state;
  return `
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${wordCount}</div>
                    <div class="stat-label">Words</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${charCount}</div>
                    <div class="stat-label">Characters</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${paragraphCount}</div>
                    <div class="stat-label">Paragraphs</div>
                </div>
            </div>
            
            <div class="format-info">
                <strong>Current Format:</strong>
                <div class="formats-display">
                    ${formats.length > 0 ? formats.join(", ") : "Normal text"}
                </div>
            </div>
        </div>
    `;
}
__name(statsTemplate, "statsTemplate");
async function toolbarTemplate({ state = {} }) {
  const { theme = "light", readOnly = false } = state;
  return `
        <div class="card-header">
            <h3 class="card-title">
                <span class="card-icon">\u{1F4DD}</span>
                WYSIWYG Editor
                <span class="theme-badge">${theme === "light" ? "\u2600\uFE0F" : "\u{1F319}"}</span>
                ${readOnly ? '<span class="read-only-badge">\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435</span>' : ""}
            </h3>
            <div class="action-bar">
                <button class="btn btn-success export-html" title="Export as HTML" ${readOnly ? "disabled" : ""}>
                    <span>\u{1F4C4}</span> Export HTML
                </button>
                <button class="btn btn-info export-text" title="Export as Text" ${readOnly ? "disabled" : ""}>
                    <span>\u{1F4DD}</span> Export Text
                </button>
                <button class="btn btn-warning theme-toggle" title="Toggle Theme">
                    <span>${theme === "light" ? "\u{1F319}" : "\u2600\uFE0F"}</span> 
                    ${theme === "light" ? "Dark" : "Light"} Mode
                </button>
                <button class="btn btn-danger clear-editor" title="Clear Editor" ${readOnly ? "disabled" : ""}>
                    <span>\u{1F5D1}\uFE0F</span> Clear
                </button>
            </div>
        </div>
    `;
}
__name(toolbarTemplate, "toolbarTemplate");
async function loadingTemplate({ state = {} }) {
  const {
    message = "Loading editor...",
    theme = "light"
  } = state;
  return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-content">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(loadingTemplate, "loadingTemplate");
async function errorTemplate({ state = {} }) {
  const {
    error = "Unknown error",
    solution = "Please try refreshing the page",
    theme = "light"
  } = state;
  return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-content">
                    <div class="error-state">
                        <div class="error-icon">\u274C</div>
                        <h4 class="error-title">Editor Error</h4>
                        <p class="error-message">${error}</p>
                        <p class="error-solution">${solution}</p>
                        <button class="btn btn-primary retry-button">
                            <span>\u{1F504}</span> Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(errorTemplate, "errorTemplate");
async function readOnlyTemplate({ state = {} }) {
  const {
    id = "",
    theme = "light",
    value = ""
  } = state;
  return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">\u{1F4C4}</span>
                        WYSIWYG Viewer
                        <span class="read-only-badge">\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435</span>
                    </h3>
                </div>
                <div class="card-content">
                    <div class="editor-container read-only">
                        <div id="editor-${id}" class="quill-editor">${value}</div>
                    </div>
                    <div class="read-only-notice">
                        <span class="notice-icon">\u{1F441}\uFE0F</span>
                        \u042D\u0442\u043E\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(readOnlyTemplate, "readOnlyTemplate");
async function compactTemplate({ state = {} }) {
  const {
    id = "",
    theme = "light",
    placeholder = "Start typing..."
  } = state;
  return `
        <div class="wysiwyg-editor compact" data-theme="${theme}">
            <div class="card">
                <div class="card-content">
                    <div class="editor-container compact">
                        <div id="editor-${id}" class="quill-editor" data-placeholder="${placeholder}"></div>
                    </div>
                    <div class="compact-stats">
                        <span class="word-count" id="wordCount">0 words</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(compactTemplate, "compactTemplate");
async function advancedTemplate({ state = {} }) {
  const {
    id = "",
    theme = "light",
    readOnly = false
  } = state;
  return `
        <div class="wysiwyg-editor advanced" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">\u270F\uFE0F</span>
                        Advanced Editor
                        ${readOnly ? '<span class="read-only-badge">\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435</span>' : ""}
                    </h3>
                    <div class="advanced-toolbar">
                        <div class="toolbar-group">
                            <button class="btn btn-sm btn-format" data-format="bold" title="Bold" ${readOnly ? "disabled" : ""}>
                                <strong>B</strong>
                            </button>
                            <button class="btn btn-sm btn-format" data-format="italic" title="Italic" ${readOnly ? "disabled" : ""}>
                                <em>I</em>
                            </button>
                            <button class="btn btn-sm btn-format" data-format="underline" title="Underline" ${readOnly ? "disabled" : ""}>
                                <u>U</u>
                            </button>
                        </div>
                        <div class="toolbar-group">
                            <button class="btn btn-sm insert-image" title="Insert Image" ${readOnly ? "disabled" : ""}>
                                \u{1F5BC}\uFE0F
                            </button>
                            <button class="btn btn-sm insert-link" title="Insert Link" ${readOnly ? "disabled" : ""}>
                                \u{1F517}
                            </button>
                            <button class="btn btn-sm insert-table" title="Insert Table" ${readOnly ? "disabled" : ""}>
                                \u{1F4CA}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-content">
                    <div class="editor-container">
                        <div id="editor-${id}" class="quill-editor"></div>
                    </div>
                    <div class="advanced-stats">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value" id="wordCount">0</div>
                                <div class="stat-label">Words</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="charCount">0</div>
                                <div class="stat-label">Chars</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="paragraphCount">0</div>
                                <div class="stat-label">Paragraphs</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="readingTime">0</div>
                                <div class="stat-label">Min Read</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
__name(advancedTemplate, "advancedTemplate");

// wysiwyg/public/components/wysiwyg-editor/controller/index.mjs
var controller = /* @__PURE__ */ __name((context2) => {
  let eventListeners = [];
  let currentSelection = null;
  const addEventListener = /* @__PURE__ */ __name((element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  }, "addEventListener");
  const saveSelection = /* @__PURE__ */ __name(() => {
    if (context2.quill) {
      currentSelection = context2.quill.getSelection();
    }
  }, "saveSelection");
  const restoreSelection = /* @__PURE__ */ __name(() => {
    if (context2.quill && currentSelection) {
      try {
        context2.quill.setSelection(currentSelection);
      } catch (error) {
        console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435:", error);
      }
    }
  }, "restoreSelection");
  const withSelectionPreservation = /* @__PURE__ */ __name((callback) => {
    return async (...args) => {
      saveSelection();
      const result = await callback(...args);
      setTimeout(restoreSelection, 0);
      return result;
    };
  }, "withSelectionPreservation");
  return {
    async init() {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!context2.quill) {
        console.warn("Quill \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
        return;
      }
      const themeToggle = context2.shadowRoot.querySelector(".theme-toggle");
      if (themeToggle) {
        addEventListener(themeToggle, "click", () => {
          context2._actions.toggleTheme();
        });
      }
      context2.quill.on("selection-change", (range, oldRange, source) => {
        console.log("---------- selection-change --------------", range);
        if (range) {
          currentSelection = range;
        }
      });
      const toolbar = context2.shadowRoot.querySelector(".ql-toolbar");
      if (toolbar) {
        addEventListener(toolbar, "mousedown", (e2) => {
          if (e2.target.closest("button") || e2.target.closest(".ql-picker-label")) {
            saveSelection();
          }
        });
        addEventListener(toolbar, "click", (e2) => {
          const target = e2.target.closest("button");
          if (!target) return;
          setTimeout(() => {
            if (currentSelection) {
              try {
                context2.quill.setSelection(currentSelection);
              } catch (error) {
                console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0441\u043B\u0435 \u043A\u043B\u0438\u043A\u0430:", error);
              }
            }
          }, 10);
        });
      }
      const actionBar = context2.shadowRoot.querySelector(".action-bar");
      if (actionBar) {
        const handlers = {
          "export-html": withSelectionPreservation(() => context2._actions.exportContent("html")),
          "export-text": withSelectionPreservation(() => context2._actions.exportContent("text")),
          "clear-editor": withSelectionPreservation(() => context2._actions.clearContent()),
          "theme-toggle": withSelectionPreservation(() => context2._actions.toggleTheme())
        };
        addEventListener(actionBar, "click", (e2) => {
          const target = e2.target.closest("button");
          if (!target) return;
          const handler = handlers[target.classList[1]];
          if (handler) {
            handler();
          }
        });
      }
      addEventListener(context2.shadowRoot, "keydown", (e2) => {
        if (e2.key === "Enter" && !e2.shiftKey) {
          saveSelection();
          setTimeout(() => {
            if (context2._correctCursorPosition) {
              context2._correctCursorPosition();
            }
            restoreSelection();
          }, 50);
        }
        if (e2.ctrlKey || e2.metaKey) {
          saveSelection();
          console.log("dddddddddddddddddddddddddddddddddd");
          switch (e2.key) {
            case "b":
              e2.preventDefault();
              context2._actions.toggleFormat("bold");
              setTimeout(restoreSelection, 0);
              break;
            case "i":
              e2.preventDefault();
              context2._actions.toggleFormat("italic");
              setTimeout(restoreSelection, 0);
              break;
            case "u":
              e2.preventDefault();
              context2._actions.toggleFormat("underline");
              setTimeout(restoreSelection, 0);
              break;
            case "k":
              e2.preventDefault();
              context2._actions.insertLink();
              setTimeout(restoreSelection, 0);
              break;
          }
        }
      });
      addEventListener(context2.shadowRoot, "keyup", (e2) => {
        if (e2.key === "Enter" && !e2.shiftKey) {
          setTimeout(() => {
            if (context2._correctCursorPosition) {
              context2._correctCursorPosition();
            }
          }, 10);
        }
      });
      setTimeout(() => {
        if (context2.quill && typeof context2.quill.getText === "function") {
          context2._updateContentStats();
        }
      }, 500);
    },
    async destroy() {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      eventListeners = [];
      currentSelection = null;
    },
    // Публичные методы для управления выделением
    getCurrentSelection() {
      return currentSelection;
    },
    saveCurrentSelection() {
      saveSelection();
    },
    restoreCurrentSelection() {
      restoreSelection();
    }
  };
}, "controller");

// wysiwyg/public/components/wysiwyg-editor/actions/index.mjs
async function createActions(context2) {
  return {
    getContent: getContent.bind(context2),
    setContent: setContent.bind(context2),
    clearContent: clearContent.bind(context2),
    insertText: insertText.bind(context2),
    insertHTML: insertHTML.bind(context2),
    insertImage: insertImage.bind(context2),
    insertLink: insertLink.bind(context2),
    toggleFormat: toggleFormat.bind(context2),
    getFormats: getFormats.bind(context2),
    exportContent: exportContent.bind(context2),
    toggleTheme: toggleTheme.bind(context2),
    focus: focus.bind(context2),
    blur: blur.bind(context2),
    enable: enable.bind(context2),
    disable: disable.bind(context2),
    getStats: getStats.bind(context2),
    insertTable: insertTable.bind(context2),
    addEmbed: addEmbed.bind(context2),
    _updatePlaceholderState: _updatePlaceholderState.bind(context2),
    _insertLinkHandler: _insertLinkHandler.bind(context2)
  };
}
__name(createActions, "createActions");
async function getContent(format = "html") {
  if (!this.quill) return "";
  switch (format) {
    case "html":
      return this.quill.root.innerHTML;
    case "text":
      return this.quill.getText();
    case "delta":
      return this.quill.getContents();
    case "formatted-text":
      return this.quill.getSemanticHTML();
    default:
      return this.quill.root.innerHTML;
  }
}
__name(getContent, "getContent");
async function setContent(content, format = "html") {
  if (!this.quill) return;
  const selection = this.quill.getSelection();
  const wasEmpty = this.quill.getText().trim() === "";
  try {
    switch (format) {
      case "html":
        this.quill.root.innerHTML = content;
        break;
      case "text":
        this.quill.setText(content);
        break;
      case "delta":
        this.quill.setContents(content);
        break;
      default:
        this.quill.root.innerHTML = content;
    }
    await this._updatePlaceholderState();
    if (selection && !wasEmpty) {
      setTimeout(() => {
        try {
          this.quill.setSelection(selection);
        } catch (error) {
          console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0441\u043B\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430:", error);
        }
      }, 10);
    }
    await this._handleTextChange();
    await this._sendContentChangedMessage({
      type: "content-set",
      format,
      contentLength: content.length
    });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "setContent",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430",
      details: error
    });
  }
}
__name(setContent, "setContent");
async function clearContent() {
  if (!this.quill) return;
  try {
    const length = this.quill.getLength();
    this.quill.deleteText(0, length);
    await this._updatePlaceholderState();
    await this._sendContentChangedMessage({
      type: "content-cleared"
    });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0447\u0438\u0441\u0442\u043A\u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "clearContent",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0447\u0438\u0441\u0442\u043A\u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430",
      details: error
    });
  }
}
__name(clearContent, "clearContent");
async function insertText(text, formats = {}) {
  if (!this.quill) return;
  try {
    const selection = this.quill.getSelection();
    if (selection) {
      this.quill.insertText(selection.index, text, formats);
      this.quill.setSelection(selection.index + text.length, 0);
    } else {
      const length = this.quill.getLength();
      this.quill.insertText(length - 1, text, formats);
      this.quill.setSelection(length - 1 + text.length, 0);
    }
    await this._updatePlaceholderState();
    await this._sendContentChangedMessage({
      type: "text-inserted",
      text,
      formats
    });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0442\u0435\u043A\u0441\u0442\u0430:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "insertText",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0442\u0435\u043A\u0441\u0442\u0430",
      details: error
    });
  }
}
__name(insertText, "insertText");
async function insertHTML(html) {
  if (!this.quill) return;
  try {
    const selection = this.quill.getSelection();
    if (selection) {
      const range = selection.index;
      this.quill.clipboard.dangerouslyPasteHTML(range, html);
      await this._updatePlaceholderState();
      await this._sendContentChangedMessage({
        type: "html-inserted",
        html
      });
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 HTML:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "insertHTML",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 HTML",
      details: error
    });
  }
}
__name(insertHTML, "insertHTML");
async function insertImage(url, alt = "") {
  if (!this.quill) return;
  try {
    const selection = this.quill.getSelection();
    if (selection) {
      this.quill.insertEmbed(selection.index, "image", {
        url,
        alt
      });
      await this._updatePlaceholderState();
      await this._sendContentChangedMessage({
        type: "image-inserted",
        url,
        alt
      });
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "insertImage",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F",
      details: error
    });
  }
}
__name(insertImage, "insertImage");
async function insertLink() {
  if (!this.quill) return;
  try {
    const selection = this.quill.getSelection();
    if (!selection) {
      await this.showModal({
        title: "\u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435",
        content: "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0441\u044B\u043B\u043A\u0438",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return;
    }
    const selectedText = this.quill.getText(selection.index, selection.length);
    await this.showModal({
      title: "\u0412\u0441\u0442\u0430\u0432\u043A\u0430 \u0441\u0441\u044B\u043B\u043A\u0438",
      content: `
        <div class="link-dialog">
          <div class="form-group">
            <label for="link-url">URL \u0441\u0441\u044B\u043B\u043A\u0438:</label>
            <input type="url" id="link-url" placeholder="https://example.com" class="link-input" required>
          </div>
          <div class="form-group">
            <label for="link-text">\u0422\u0435\u043A\u0441\u0442 \u0441\u0441\u044B\u043B\u043A\u0438:</label>
            <input type="text" id="link-text" value="${selectedText}" class="link-input" placeholder="\u0422\u0435\u043A\u0441\u0442 \u0441\u0441\u044B\u043B\u043A\u0438">
          </div>
          <div class="form-group">
            <label for="link-title">\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A (title):</label>
            <input type="text" id="link-title" class="link-input" placeholder="\u0412\u0441\u043F\u043B\u044B\u0432\u0430\u044E\u0449\u0430\u044F \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430">
          </div>
        </div>
      `,
      buttons: [
        {
          text: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C",
          type: "primary",
          action: /* @__PURE__ */ __name(() => this._actions._insertLinkHandler(), "action")
        },
        {
          text: "\u041E\u0442\u043C\u0435\u043D\u0430",
          type: "secondary"
        }
      ]
    });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0441\u0441\u044B\u043B\u043A\u0438:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "insertLink",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0441\u0441\u044B\u043B\u043A\u0438",
      details: error
    });
  }
}
__name(insertLink, "insertLink");
async function _insertLinkHandler() {
  if (!this.quill) return;
  const urlInput = this.shadowRoot.getElementById("link-url");
  const textInput = this.shadowRoot.getElementById("link-text");
  const titleInput = this.shadowRoot.getElementById("link-title");
  const url = urlInput?.value?.trim();
  const text = textInput?.value?.trim();
  const title = titleInput?.value?.trim();
  if (!url) {
    await this.showModal({
      title: "\u041E\u0448\u0438\u0431\u043A\u0430",
      content: "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0443\u043A\u0430\u0436\u0438\u0442\u0435 URL \u0441\u0441\u044B\u043B\u043A\u0438",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return;
  }
  const selection = this.quill.getSelection();
  if (selection) {
    if (text && text !== this.quill.getText(selection.index, selection.length)) {
      this.quill.deleteText(selection.index, selection.length);
      this.quill.insertText(selection.index, text, { link: url });
    } else {
      this.quill.formatText(selection.index, selection.length, "link", url);
    }
    await this._updatePlaceholderState();
    await this._sendContentChangedMessage({
      type: "link-inserted",
      url,
      text,
      title
    });
  }
}
__name(_insertLinkHandler, "_insertLinkHandler");
async function toggleFormat(format, value = null) {
  if (!this.quill) return;
  try {
    await this._saveCurrentSelection();
    let selection = this.quill.getSelection();
    if (!selection && this._lastKnownSelection) {
      const timeDiff = Date.now() - this._lastKnownSelection.timestamp;
      if (timeDiff < 5e3) {
        selection = this._lastKnownSelection;
      }
    }
    if (!selection) {
      const length = this.quill.getLength();
      this.quill.setSelection(length - 1, 0);
      return;
    }
    if (value === null) {
      const currentFormat = this.quill.getFormat(selection);
      value = !currentFormat[format];
    }
    this.quill.formatText(selection.index, selection.length, format, value);
    setTimeout(() => {
      try {
        this.quill.setSelection(selection);
      } catch (error) {
        console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0441\u043B\u0435 \u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F:", error);
      }
    }, 0);
    await this._sendContentChangedMessage({
      type: "format-toggled",
      format,
      value
    });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u0430:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "toggleFormat",
      message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u0430: ${format}`,
      details: error
    });
  }
}
__name(toggleFormat, "toggleFormat");
async function getFormats() {
  if (!this.quill) return {};
  try {
    const selection = this.quill.getSelection();
    if (selection) {
      return this.quill.getFormat(selection);
    }
    return {};
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u043E\u0432:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "getFormats",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u043E\u0432",
      details: error
    });
    return {};
  }
}
__name(getFormats, "getFormats");
async function exportContent(format = "html") {
  try {
    const content = await this._actions.getContent(format);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url;
    a2.download = `editor-content.${format === "html" ? "html" : "txt"}`;
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    URL.revokeObjectURL(url);
    await this._sendContentChangedMessage({
      type: "content-exported",
      format,
      content,
      wordCount: this.state.wordCount,
      charCount: this.state.charCount
    });
    return content;
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "exportContent",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E",
      details: error
    });
    const content = await this._actions.getContent(format);
    await this.showModal({
      title: `\u042D\u043A\u0441\u043F\u043E\u0440\u0442 (${format.toUpperCase()})`,
      content: `
        <div style="max-height: 300px; overflow: auto;">
          <pre style="background: var(--surface-100); padding: var(--space); border-radius: var(--radius); white-space: pre-wrap; font-size: 12px;">${content}</pre>
        </div>
      `,
      buttons: [
        {
          text: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
          type: "primary",
          action: /* @__PURE__ */ __name(() => {
            navigator.clipboard.writeText(content);
          }, "action")
        },
        {
          text: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
          type: "secondary"
        }
      ]
    });
    return content;
  }
}
__name(exportContent, "exportContent");
async function toggleTheme() {
  try {
    const newTheme = this.state.theme === "light" ? "dark" : "light";
    await this.updateElement({
      selector: ".wysiwyg-editor",
      value: newTheme,
      property: "dataset.theme",
      action: "set"
    });
    this.state.theme = newTheme;
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("wysiwyg-theme", newTheme);
    const themeButton = this.shadowRoot.querySelector(".theme-toggle");
    if (themeButton) {
      const themeIcon = themeButton.querySelector("span");
      if (themeIcon) {
        themeIcon.textContent = newTheme === "light" ? "\u{1F319}" : "\u2600\uFE0F";
      }
      const themeText = themeButton.querySelector(".theme-text");
      if (themeText) {
        themeText.textContent = newTheme === "light" ? "Dark Mode" : "Light Mode";
      }
    }
    console.log(`\u0422\u0435\u043C\u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0430 \u043D\u0430: ${newTheme}`);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0442\u0435\u043C\u044B:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "toggleTheme",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0442\u0435\u043C\u044B",
      details: error
    });
  }
}
__name(toggleTheme, "toggleTheme");
async function focus() {
  if (this.quill) {
    this.quill.focus();
    await this._sendContentChangedMessage({
      type: "editor-focused"
    });
  }
}
__name(focus, "focus");
async function blur() {
  if (this.quill) {
    this.quill.blur();
    await this._sendContentChangedMessage({
      type: "editor-blurred"
    });
  }
}
__name(blur, "blur");
async function enable() {
  if (this.quill) {
    this.quill.enable(true);
    this.state.readOnly = false;
    await this._sendContentChangedMessage({
      type: "editor-enabled"
    });
  }
}
__name(enable, "enable");
async function disable() {
  if (this.quill) {
    this.quill.enable(false);
    this.state.readOnly = true;
    await this._sendContentChangedMessage({
      type: "editor-disabled"
    });
  }
}
__name(disable, "disable");
async function getStats() {
  if (!this.quill) return {};
  const text = this.quill.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const paragraphs = (text.match(/\n\s*\n/g) || []).length + 1;
  const stats = {
    words,
    characters,
    paragraphs,
    readingTime: Math.ceil(words / 200)
    // среднее время чтения в минутах
  };
  await this._sendContentChangedMessage({
    type: "stats-calculated",
    stats
  });
  return stats;
}
__name(getStats, "getStats");
async function insertTable(rows = 3, cols = 3) {
  if (!this.quill) return;
  try {
    const selection = this.quill.getSelection();
    if (selection) {
      let tableHTML = '<table style="border-collapse: collapse; width: 100%;">';
      for (let i2 = 0; i2 < rows; i2++) {
        tableHTML += "<tr>";
        for (let j = 0; j < cols; j++) {
          tableHTML += `<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>`;
        }
        tableHTML += "</tr>";
      }
      tableHTML += "</table><br>";
      this.quill.clipboard.dangerouslyPasteHTML(selection.index, tableHTML);
      await this._updatePlaceholderState();
      await this._sendContentChangedMessage({
        type: "table-inserted",
        rows,
        columns: cols
      });
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0442\u0430\u0431\u043B\u0438\u0446\u044B:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "insertTable",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0442\u0430\u0431\u043B\u0438\u0446\u044B",
      details: error
    });
  }
}
__name(insertTable, "insertTable");
async function addEmbed(type, url) {
  if (!this.quill) return;
  try {
    const selection = this.quill.getSelection();
    if (selection) {
      let embedHTML = "";
      switch (type) {
        case "youtube":
          const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (videoId) {
            embedHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId[1]}" frameborder="0" allowfullscreen></iframe>`;
          }
          break;
        case "vimeo":
          const vimeoId = url.match(/vimeo\.com\/(\d+)/);
          if (vimeoId) {
            embedHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId[1]}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
          }
          break;
        case "twitter":
          embedHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`;
          break;
        default:
          console.warn(`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F embed: ${type}`);
          return;
      }
      if (embedHTML) {
        this.quill.clipboard.dangerouslyPasteHTML(selection.index, embedHTML);
        await this._updatePlaceholderState();
        await this._sendContentChangedMessage({
          type: "embed-inserted",
          embedType: type,
          url
        });
      }
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 embed:", error);
    await this.addError({
      componentName: this.constructor.name,
      source: "addEmbed",
      message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 embed: ${type}`,
      details: error
    });
  }
}
__name(addEmbed, "addEmbed");
async function _updatePlaceholderState() {
  if (!this.quill) return;
  const isEmpty = this.quill.getText().trim() === "";
  const editorElement = this.quill.root;
  if (isEmpty) {
    editorElement.classList.add("ql-blank");
  } else {
    editorElement.classList.remove("ql-blank");
  }
}
__name(_updatePlaceholderState, "_updatePlaceholderState");

// wysiwyg/public/components/wysiwyg-editor/index.mjs
import quill from "https://cdn.jsdelivr.net/npm/quill@2.0.3/+esm";
var WysiwygEditor = class extends BaseComponent {
  static {
    __name(this, "WysiwygEditor");
  }
  static observedAttributes = ["value", "placeholder", "read-only", "theme", "height"];
  constructor() {
    super();
    this._templateMethods = template_exports;
    this.state = {
      value: "",
      placeholder: "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0432\u0432\u043E\u0434\u0438\u0442\u044C \u0442\u0435\u043A\u0441\u0442...",
      readOnly: false,
      theme: "light",
      height: "300px",
      formats: [],
      wordCount: 0,
      charCount: 0,
      paragraphCount: 0,
      id: this._id
    };
    window.Quill = quill;
    this.quill = null;
    this.quillLoaded = false;
    this._lastKnownSelection = null;
    this._isRestoringSelection = false;
    this._mutationObserver = null;
    this._ignoreNextSelectionChange = false;
    this._boundHandleTextChange = this._handleTextChange.bind(this);
    this._boundHandleSelectionChange = this._handleSelectionChange.bind(this);
  }
  /**
   * Правильная реализация postMessage для входящих сообщений
   * @param {Object} message - Входящее сообщение
   * @param {string} message.type - Тип сообщения
   * @param {*} message.data - Данные сообщения
   * @param {string} message.source - Источник сообщения
   * @returns {Promise<Object>} Ответ на сообщение
   */
  async postMessage(message) {
    const { type, data, source } = message;
    console.log(`[WysiwygEditor] \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442 ${source}:`, { type, data });
    const messageHandlers = {
      // Запрос состояния редактора
      "get-editor-state": /* @__PURE__ */ __name(async () => {
        const state = await this.getEditorState();
        return {
          success: true,
          data: state,
          component: this.constructor.name,
          id: this.id
        };
      }, "get-editor-state"),
      // Установка содержимого редактора
      "set-content": /* @__PURE__ */ __name(async () => {
        if (data && data.content !== void 0) {
          await this._actions.setContent(data.content, data.format || "html");
          return {
            success: true,
            message: "Content set successfully",
            wordCount: this.state.wordCount,
            charCount: this.state.charCount
          };
        }
        return { success: false, error: "No content provided" };
      }, "set-content"),
      // Очистка редактора
      "clear-content": /* @__PURE__ */ __name(async () => {
        await this._actions.clearContent();
        return {
          success: true,
          message: "Editor cleared successfully"
        };
      }, "clear-content"),
      // Применение форматирования
      "apply-format": /* @__PURE__ */ __name(async () => {
        if (data && data.format) {
          await this._actions.toggleFormat(data.format, data.value);
          return {
            success: true,
            message: `Format ${data.format} applied`,
            formats: this.state.formats
          };
        }
        return { success: false, error: "No format specified" };
      }, "apply-format"),
      // Экспорт содержимого
      "export-content": /* @__PURE__ */ __name(async () => {
        const content = await this._actions.getContent(data?.format || "html");
        return {
          success: true,
          data: {
            content,
            format: data?.format || "html",
            wordCount: this.state.wordCount,
            charCount: this.state.charCount,
            paragraphCount: this.state.paragraphCount
          }
        };
      }, "export-content"),
      // Фокус на редактор
      "focus-editor": /* @__PURE__ */ __name(async () => {
        await this._actions.focus();
        return {
          success: true,
          message: "Editor focused"
        };
      }, "focus-editor"),
      // Запрос статистики
      "get-stats": /* @__PURE__ */ __name(async () => {
        const stats = await this._actions.getStats();
        return {
          success: true,
          data: stats
        };
      }, "get-stats"),
      // Вставка текста
      "insert-text": /* @__PURE__ */ __name(async () => {
        if (data && data.text) {
          await this._actions.insertText(data.text, data.formats || {});
          return {
            success: true,
            message: "Text inserted successfully"
          };
        }
        return { success: false, error: "No text provided" };
      }, "insert-text"),
      // Вставка HTML
      "insert-html": /* @__PURE__ */ __name(async () => {
        if (data && data.html) {
          await this._actions.insertHTML(data.html);
          return {
            success: true,
            message: "HTML inserted successfully"
          };
        }
        return { success: false, error: "No HTML provided" };
      }, "insert-html"),
      // Переключение темы
      "toggle-theme": /* @__PURE__ */ __name(async () => {
        await this._actions.toggleTheme();
        return {
          success: true,
          message: "Theme toggled",
          theme: this.state.theme
        };
      }, "toggle-theme"),
      // Включение/выключение редактора
      "set-readonly": /* @__PURE__ */ __name(async () => {
        if (data && typeof data.readOnly === "boolean") {
          if (data.readOnly) {
            await this._actions.disable();
          } else {
            await this._actions.enable();
          }
          return {
            success: true,
            message: `Editor ${data.readOnly ? "disabled" : "enabled"}`,
            readOnly: this.state.readOnly
          };
        }
        return { success: false, error: "No readOnly value provided" };
      }, "set-readonly"),
      // Вставка изображения
      "insert-image": /* @__PURE__ */ __name(async () => {
        if (data && data.url) {
          await this._actions.insertImage(data.url, data.alt || "");
          return {
            success: true,
            message: "Image inserted successfully"
          };
        }
        return { success: false, error: "No image URL provided" };
      }, "insert-image"),
      // Вставка ссылки
      "insert-link": /* @__PURE__ */ __name(async () => {
        await this._actions.insertLink();
        return {
          success: true,
          message: "Link insertion dialog opened"
        };
      }, "insert-link"),
      // Вставка таблицы
      "insert-table": /* @__PURE__ */ __name(async () => {
        const rows = data?.rows || 3;
        const cols = data?.cols || 3;
        await this._actions.insertTable(rows, cols);
        return {
          success: true,
          message: "Table inserted successfully",
          rows,
          columns: cols
        };
      }, "insert-table"),
      // Получение текущих форматов
      "get-formats": /* @__PURE__ */ __name(async () => {
        const formats = await this._actions.getFormats();
        return {
          success: true,
          data: formats
        };
      }, "get-formats")
    };
    if (messageHandlers[type]) {
      try {
        const response = await messageHandlers[type]();
        console.log(`[WysiwygEditor] \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${type}:`, response);
        return response;
      } catch (error) {
        console.error(`[WysiwygEditor] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F ${type}:`, error);
        this.addError({
          componentName: this.constructor.name,
          source: "postMessage",
          message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F ${type}`,
          details: error
        });
        return {
          success: false,
          error: error.message,
          component: this.constructor.name,
          id: this.id
        };
      }
    }
    console.warn(`[WysiwygEditor] \u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:`, type);
    return {
      success: false,
      error: `Unknown message type: ${type}`,
      component: this.constructor.name,
      id: this.id
    };
  }
  /**
   * Отправляет сообщение другому компоненту
   * @param {string} targetComponent - Имя целевого компонента
   * @param {string} targetId - ID целевого компонента
   * @param {string} type - Тип сообщения
   * @param {*} data - Данные сообщения
   * @returns {Promise<Object>} Ответ от целевого компонента
   */
  async sendMessageToComponent(targetComponent, targetId, type, data = {}) {
    try {
      const target = await this.getComponentAsync(targetComponent, targetId);
      if (target && typeof target.postMessage === "function") {
        const response = await target.postMessage({
          type,
          data,
          source: `${this.constructor.name}:${this.id}`
        });
        return response;
      } else {
        console.warn(`\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 ${targetComponent}:${targetId} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 postMessage`);
        return { success: false, error: "Target component not found" };
      }
    } catch (error) {
      console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0443 ${targetComponent}:${targetId}:`, error);
      this.addError({
        componentName: this.constructor.name,
        source: "sendMessageToComponent",
        message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0443 ${targetComponent}`,
        details: error
      });
      return { success: false, error: error.message };
    }
  }
  async _componentReady() {
    this._controller = await controller(this);
    this._actions = await createActions(this);
    const savedTheme = localStorage.getItem("wysiwyg-theme") || this.getAttribute("theme") || "light";
    this.state.theme = savedTheme;
    document.documentElement.setAttribute("data-theme", this.state.theme);
    await this.fullRender(this.state);
    await this._initEditor();
    return true;
  }
  async _initEditor() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const container = this.shadowRoot.getElementById(`editor-${this._id}`);
    if (!container) {
      console.error("\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D, \u043F\u0435\u0440\u0435\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C...");
      await new Promise((resolve) => setTimeout(resolve, 200));
      const retryContainer = this.shadowRoot.getElementById(`editor-${this._id}`);
      if (!retryContainer) {
        throw new Error(`\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 #editor-${this._id} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0439 \u043F\u043E\u043F\u044B\u0442\u043A\u0438`);
      }
    }
    if (!window.Quill) {
      throw new Error("Quill.js \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D");
    }
    const toolbarOptions = [
      [{ "header": [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ "color": [] }, { "background": [] }],
      [{ "list": "ordered" }, { "list": "bullet" }],
      [{ "indent": "-1" }, { "indent": "+1" }],
      [{ "align": [] }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"]
    ];
    try {
      this.quill = new window.Quill(container, {
        modules: {
          toolbar: toolbarOptions,
          history: {
            delay: 1e3,
            maxStack: 100,
            userOnly: true
          }
        },
        placeholder: this.state.placeholder,
        readOnly: this.state.readOnly,
        theme: "snow",
        formats: [
          "header",
          "bold",
          "italic",
          "underline",
          "strike",
          "color",
          "background",
          "list",
          "indent",
          "align",
          "blockquote",
          "code-block",
          "link",
          "image"
        ]
      });
      const initialValue = this.getAttribute("value");
      if (initialValue) {
        this.quill.root.innerHTML = initialValue;
        this.state.value = initialValue;
      }
      await this._setupQuillEventListeners();
      setTimeout(() => {
        if (this.quill) {
          const length = this.quill.getLength();
          if (length > 1) {
            this.quill.setSelection(0, 0, "silent");
            this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
          } else {
            this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
          }
          this._updateCurrentFormats();
          console.log("Editor initialized with cursor at start");
        }
      }, 100);
      await this._setupResizeObserver();
      await this._applyCustomStyles();
      await this._updateContentStats();
      console.log(`WYSIWYG \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D \u0441 ID: ${this._id}`);
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 Quill:", error);
      throw error;
    }
  }
  async _setupQuillEventListeners() {
    if (!this.quill) return;
    const editorElement = this.quill.root;
    editorElement.addEventListener("input", this._boundHandleTextChange);
    editorElement.addEventListener("keyup", (e2) => {
      this._boundHandleTextChange();
      if (e2.key === "Enter") {
        this._correctCursorPosition();
      }
    });
    editorElement.addEventListener("keydown", this._boundHandleTextChange);
    editorElement.addEventListener("click", this._boundHandleSelectionChange);
    editorElement.addEventListener("mouseup", this._boundHandleSelectionChange);
    editorElement.addEventListener("keyup", this._boundHandleSelectionChange);
    await this._setupMutationObserver();
    console.log("Quill event listeners setup completed");
  }
  async _setupMutationObserver() {
    if (!this.quill) return;
    this._mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" || mutation.type === "characterData") {
          setTimeout(() => {
            this._boundHandleTextChange();
          }, 0);
        }
      });
    });
    this._mutationObserver.observe(this.quill.root, {
      childList: true,
      subtree: true,
      characterData: true
    });
    console.log("MutationObserver setup completed");
  }
  async _handleTextChange(delta, oldDelta, source) {
    if (!this.quill || this._isRestoringSelection) return;
    const contents = this.quill.root.innerHTML;
    const text = this.quill.getText();
    this.state.value = contents;
    await this._updateContentStats();
    await this._saveCurrentSelection();
    setTimeout(() => {
      this._updateCurrentFormats();
    }, 0);
  }
  async _handleSelectionChange(range, oldRange, source) {
    if (!this.quill) return;
    if (this._isRestoringSelection || this._ignoreNextSelectionChange) {
      console.log("Ignoring selection change during restoration");
      this._ignoreNextSelectionChange = false;
      return;
    }
    console.log("Selection changed:", { range, source });
    if (range) {
      this._lastKnownSelection = {
        index: range.index,
        length: range.length,
        timestamp: Date.now()
      };
      await this._updateCurrentFormats();
    }
  }
  async _correctCursorPosition() {
    if (!this.quill) return;
    const selection = this.quill.getSelection();
    if (!selection) return;
    const text = this.quill.getText();
    if (selection.index > 0 && selection.length === 0) {
      const prevChar = text.charAt(selection.index - 1);
      const nextChar = text.charAt(selection.index);
      if (prevChar === "\n" && nextChar !== "\n") {
        setTimeout(() => {
          try {
            this.quill.setSelection(selection.index, 0, "silent");
          } catch (error) {
            console.warn("\u041E\u0448\u0438\u0431\u043A\u0430 \u043A\u043E\u0440\u0440\u0435\u043A\u0446\u0438\u0438 \u043A\u0443\u0440\u0441\u043E\u0440\u0430:", error);
          }
        }, 10);
      }
    }
  }
  async _saveCurrentSelection() {
    if (!this.quill) return;
    try {
      const selection = this.quill.getSelection();
      if (selection) {
        this._lastKnownSelection = {
          index: selection.index,
          length: selection.length,
          timestamp: Date.now()
        };
        console.log("Selection saved:", this._lastKnownSelection);
      }
    } catch (error) {
      console.warn("Error saving selection:", error);
    }
  }
  async _restoreSelection() {
    if (!this.quill || !this._lastKnownSelection) return;
    this._isRestoringSelection = true;
    this._ignoreNextSelectionChange = true;
    try {
      const length = this.quill.getLength();
      let safeIndex = Math.max(0, Math.min(this._lastKnownSelection.index, length - 1));
      let safeLength = Math.max(0, Math.min(this._lastKnownSelection.length, length - safeIndex));
      if (length <= 1) {
        safeIndex = 0;
        safeLength = 0;
      }
      console.log("Restoring selection:", {
        original: this._lastKnownSelection,
        safe: { index: safeIndex, length: safeLength },
        documentLength: length
      });
      setTimeout(() => {
        try {
          this.quill.setSelection(safeIndex, safeLength, "silent");
          this._lastKnownSelection = {
            index: safeIndex,
            length: safeLength,
            timestamp: Date.now()
          };
          console.log("Selection successfully restored");
        } catch (error) {
          console.warn("Error in selection restoration:", error);
          try {
            this.quill.setSelection(0, 0, "silent");
          } catch (fallbackError) {
            console.error("Fallback selection also failed:", fallbackError);
          }
        }
      }, 0);
    } catch (error) {
      console.warn("Error preparing selection restoration:", error);
    } finally {
      setTimeout(() => {
        this._isRestoringSelection = false;
        this._ignoreNextSelectionChange = false;
      }, 50);
    }
  }
  async _updateCurrentFormats() {
    if (!this.quill) return;
    try {
      let selection = this.quill.getSelection();
      if (!selection && this._lastKnownSelection) {
        const timeDiff = Date.now() - this._lastKnownSelection.timestamp;
        if (timeDiff < 5e3) {
          selection = this._lastKnownSelection;
        }
      }
      if (!selection) {
        return;
      }
      const format = this.quill.getFormat(selection);
      this.state.formats = Object.keys(format).filter((key) => format[key]);
      await this._updateFormatsDisplay();
    } catch (error) {
      console.warn("Error updating formats:", error);
    }
  }
  async _updateContentStats() {
    if (!this.quill) return;
    const text = this.quill.getText().trim();
    const html = this.quill.root.innerHTML;
    const textWithoutTags = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = textWithoutTags ? textWithoutTags.split(/\s+/).length : 0;
    const characters = text.replace(/\s/g, "").length;
    const paragraphs = (html.match(/<p[^>]*>/g) || []).length;
    this.state.wordCount = words;
    this.state.charCount = characters;
    this.state.paragraphCount = paragraphs;
    await this._updateStatsDisplay();
  }
  async _setupResizeObserver() {
    if (!this.quill) return;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        this._handleResize(entry);
      }
    });
    const editorElement = this.shadowRoot.querySelector(".ql-editor");
    if (editorElement) {
      this.resizeObserver.observe(editorElement);
    }
  }
  async _handleResize(entry) {
    console.log("Editor resized:", entry.contentRect);
  }
  async _applyCustomStyles() {
    if (!this.quill) return;
    const editorContainer = this.shadowRoot.querySelector(".ql-container");
    if (editorContainer && this.state.height) {
      editorContainer.style.height = this.state.height;
      editorContainer.style.minHeight = this.state.height;
    }
  }
  async _updateStatsDisplay() {
    await this.updateElement({
      selector: "#wordCount",
      value: this.state.wordCount.toString(),
      property: "textContent"
    });
    await this.updateElement({
      selector: "#charCount",
      value: this.state.charCount.toString(),
      property: "textContent"
    });
    await this.updateElement({
      selector: "#paragraphCount",
      value: this.state.paragraphCount.toString(),
      property: "textContent"
    });
  }
  async _updateFormatsDisplay() {
    const formats = this.state.formats?.join(", ") || "Normal text";
    await this.updateElement({
      selector: "#formatsDisplay",
      value: formats,
      property: "textContent"
    });
  }
  async _componentAttributeChanged(name, oldValue, newValue) {
    if (!this.quill) return;
    const attributeHandlers = {
      "value": /* @__PURE__ */ __name(async () => {
        if (newValue !== this.state.value) {
          await this._actions.setContent(newValue, "html");
        }
      }, "value"),
      "placeholder": /* @__PURE__ */ __name(async () => {
        this.quill.root.setAttribute("data-placeholder", newValue);
        this.state.placeholder = newValue;
      }, "placeholder"),
      "read-only": /* @__PURE__ */ __name(async () => {
        const isReadOnly = newValue !== null;
        this.quill.enable(!isReadOnly);
        this.state.readOnly = isReadOnly;
      }, "read-only"),
      "theme": /* @__PURE__ */ __name(async () => {
        this.state.theme = newValue;
        await this._applyTheme();
      }, "theme"),
      "height": /* @__PURE__ */ __name(async () => {
        this.state.height = newValue;
        await this._applyCustomStyles();
      }, "height")
    };
    if (attributeHandlers[name]) {
      await attributeHandlers[name]();
    }
  }
  async _applyTheme() {
    const editorElement = this.shadowRoot.querySelector(".wysiwyg-editor");
    if (editorElement) {
      editorElement.setAttribute("data-theme", this.state.theme);
    }
  }
  async _componentDisconnected() {
    await this._cleanupEventListeners();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
    }
    if (this.quill) {
      this.quill.off("text-change");
      this.quill.off("selection-change");
    }
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
  }
  async _cleanupEventListeners() {
    if (!this.quill) return;
    const editorElement = this.quill.root;
    editorElement.removeEventListener("input", this._boundHandleTextChange);
    editorElement.removeEventListener("keyup", this._boundHandleTextChange);
    editorElement.removeEventListener("keydown", this._boundHandleTextChange);
    editorElement.removeEventListener("click", this._boundHandleSelectionChange);
    editorElement.removeEventListener("mouseup", this._boundHandleSelectionChange);
    editorElement.removeEventListener("keyup", this._boundHandleSelectionChange);
  }
  // Публичные методы для API (используют actions)
  async getEditorState() {
    return {
      value: this.state.value,
      wordCount: this.state.wordCount,
      charCount: this.state.charCount,
      paragraphCount: this.state.paragraphCount,
      formats: this.state.formats,
      readOnly: this.state.readOnly,
      theme: this.state.theme
    };
  }
  // Методы для удобства использования компонента
  async getContent(format = "html") {
    return await this._actions.getContent(format);
  }
  async setContent(content, format = "html") {
    return await this._actions.setContent(content, format);
  }
  async clearContent() {
    return await this._actions.clearContent();
  }
  async insertText(text, formats = {}) {
    return await this._actions.insertText(text, formats);
  }
  async insertHTML(html) {
    return await this._actions.insertHTML(html);
  }
  async toggleFormat(format, value = null) {
    return await this._actions.toggleFormat(format, value);
  }
  async focusEditor() {
    return await this._actions.focus();
  }
  async blurEditor() {
    return await this._actions.blur();
  }
  async enableEditor() {
    return await this._actions.enable();
  }
  async disableEditor() {
    return await this._actions.disable();
  }
  async toggleTheme() {
    return await this._actions.toggleTheme();
  }
  async getStats() {
    return await this._actions.getStats();
  }
  async exportContent(format = "html") {
    return await this._actions.exportContent(format);
  }
};
if (!customElements.get("wysiwyg-editor")) {
  customElements.define("wysiwyg-editor", WysiwygEditor);
}

// wysiwyg/public/index.mjs
var log3 = createLogger("incoming_message");
var app = {};
var isTests = false;
var root;
var context = {};
app = window.onload = (async () => {
  function loadTemplateBasedOnPath() {
    const container = document.getElementById("main-container");
    const path = window.location.pathname;
    let templateId;
    if (path.includes("/youtube/receiver")) {
      templateId = "receiver-template";
    } else if (path.includes("/youtube/sender")) {
      templateId = "sender-template";
    } else if (path.includes("/youtube/")) {
      templateId = "main-template";
    } else {
      if (path.includes("/receiver")) {
        templateId = "receiver-template";
      } else if (path.includes("/sender")) {
        templateId = "sender-template";
      } else {
        templateId = "main-template";
      }
    }
    const template = document.getElementById(templateId);
    if (template) {
      container.innerHTML = "";
      const content = template.content.cloneNode(true);
      container.appendChild(content);
      updateActiveNavLinks(path);
    }
  }
  __name(loadTemplateBasedOnPath, "loadTemplateBasedOnPath");
  app.startTime = Date.now();
  app.NODE_PORT = 6832;
  const html = document.body.querySelector(".container");
  const components = [];
  for (let item of components) {
    const isAttribute = item.hasOwnProperty("attributes");
    context[`${item.component}`] = [];
    const element = document.createElement(`${item.component}`);
    element.setAttribute("id", `${item.id}`);
    element.setAttribute("slot", `${item.slot}`);
    if (isAttribute) {
      for (let key in item.attributes) {
        element.setAttribute(key, `${item.attributes[key]}`);
      }
    }
    context[`${item.component}`].push({
      element
    });
    if (!components[`${item.component}`]) {
      components[`${item.component}`] = {
        id: {
          [`${item.id}`]: element
        }
      };
      root = root ? root : element;
    } else if (!components[`${item.component}`].id[item.id]) {
      components[`${item.component}`].id[item.id] = element;
      root = root ? root : element;
    } else {
      console.log("item", item);
      console.error("\u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C");
    }
    html.appendChild(element);
  }
  setTimeout(async () => {
    if (html?.classList?.contains?.("invisible")) {
      html.classList.remove("invisible");
    }
    try {
      const editor = await customElements.get("wysiwyg-editor").getComponentAsync("wysiwyg-editor", "wysiwyg-main");
      console.log("\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D:", editor);
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430:", error);
    }
  }, 6e3);
  if (isTests) {
    test({
      path: "/tests/index.mjs"
    }).catch((e2) => {
      console.log("error devtool", e2);
    });
  }
  return components;
})();
if (document.readyState === "loading") {
  console.log("------------------- loading -------------------");
  document.addEventListener("DOMContentLoaded", () => {
    window.scrollManager = new ScrollManager();
  });
} else {
  window.scrollManager = new ScrollManager();
}
export {
  app,
  createLogger
};
//# sourceMappingURL=index.bundle.mjs.map
