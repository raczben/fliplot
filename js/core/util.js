/**
 * From: https://stackoverflow.com/a/12987042/2506522
 *
 */ //Useful Functions
function checkBin(n) {
  return /^[01]{1,64}$/.test(n);
}
//  function checkDec(n){return/^[0-9]{1,64}$/.test(n)}
//  function checkHex(n){return/^[0-9A-Fa-f]{1,64}$/.test(n)}
//  function pad(s,z){s=""+s;return s.length<z?pad("0"+s,z):s}
//  function unpad(s){s=""+s;return s.replace(/^0+/,'')}

//Decimal operations
//  function Dec2Bin(n){if(!checkDec(n)||n<0)return NaN;return n.toString(2)}
//  function Dec2Hex(n){if(!checkDec(n)||n<0)return NaN;return n.toString(16)}

//Binary Operations
function Bin2Dec(n) {
  if (!checkBin(n)) return NaN;
  return parseInt(n, 2).toString(10);
}

/**
 *
 * @param {string} n
 * @returns
 */
function Bin2Hex(n) {
  if (!checkBin(n)) {
    n = n.toLowerCase();
    if (n.includes("x")) {
      return "x";
    } else if (n.includes("u")) {
      return "u";
    } else if (n.includes("z")) {
      return "z";
    } else {
      console.warn(`unknown bin: ${n}`);
      return "x";
    }
  } else {
    return parseInt(n, 2).toString(16);
  }
}

//Hexadecimal Operations
//  function Hex2Bin(n){if(!checkHex(n))return NaN;return parseInt(n,16).toString(2)}
//  function Hex2Dec(n){if(!checkHex(n))return NaN;return parseInt(n,16).toString(10)}

function Bin2Hex2(n) {
  if (n.length % 4 != 0) {
    // Pad the binary string to the nearest 4 bits.
    n = "0".repeat(4 - (n.length % 4)) + n;
  }
  // get each 4 bits and convert to hex
  const hexChars = [];
  for (let i = 0; i < n.length; i += 4) {
    const binChunk = n.slice(i, i + 4);
    //append the hex character to the array
    hexChars.push(Bin2Hex(binChunk));
  }
  // join the hex characters to a string
  return hexChars.join("");
}

/** * Generic binary to fixed point converter.
 *
 * Bin2Dec2(bin) convert a simple unsigned binary (no fractional) to decimal
 *
 * @param {string} bin - The binary string to be converted.
 * @param {boolean} signed - Twos complement signed format.
 * @param {number} fractionalDigits - Number of fractional digits in the binary number.
 * @returns number
 */
function Bin2Dec2(bin, signed = false, fractionalDigits = 0) {
  let ret = Bin2Dec(bin);
  if (isNaN(ret)) {
    return NaN;
  }
  if (signed) {
    const signBit = bin[0];
    if (signBit === "1") {
      ret = ret - Math.pow(2, bin.length);
    }
  }
  ret = ret / Math.pow(2, fractionalDigits);
  return ret;
}

/** * Convert a 32/64-bit binary string to a float using IEEE 754 format.
 * Call Bin2Float(bin, 32, 8, 127) for 32 bit single precision float.
 * Call Bin2Float(bin, 64, 11, 1023) for 64 bit double precision float.
 *
 * @param {string} bin - The binary string to be converted.
 * @param {number} binLen - Length of the binary string (32 for single precision, 64 for double precision)
 * @param {number} expBits - Number of exponent bits (8 for single precision, 11 for double precision)
 * @param {number} expBias - Bias for the exponent (127 for single precision, 1023 for double precision)
 * @returns number
 */
function Bin2Float(bin, binLen, expBits, expBias) {
  if (!checkBin(bin)) {
    console.warn("Invalid binary string for float conversion:", bin);
    return NaN; // invalid binary string
  }
  if (bin.length !== binLen) {
    console.warn("Binary string for float conversion must be 32 bits:", bin);
    return NaN; // invalid length for float conversion
  }
  // Convert binary to float using IEEE 754 format
  // This is a simplified version and may not handle all edge cases.
  const sign = bin[0] === "1" ? -1 : 1;
  const exponentBits = bin.slice(1, expBits + 1);
  const mantissaBits = bin.slice(expBits + 1);
  const exponent = parseInt(exponentBits, 2) - expBias; // Bias for single precision
  let mantissa = 1; // Implicit leading 1 for normalized numbers
  for (let i = 0; i < mantissaBits.length; i++) {
    if (mantissaBits[i] === "1") {
      mantissa += Math.pow(2, -(i + 1));
    }
  }
  const value = sign * mantissa * Math.pow(2, exponent);
  return value;
}

/*
 * Binary search in JavaScript.
 * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point
 * for the new element.
 * Parameters:
 *     ar - A sorted array
 *     el - An element to search for
 *     compare_fn - A comparator function. The function takes two arguments: (a, b) and returns:
 *        a negative number  if a is less than b;
 *        0 if a is equal to b;
 *        a positive number of a is greater than b.
 * The array may contain duplicate elements. If there are more than one equal elements in the array,
 * the returned value can be the index of any one of the equal elements.
 *
 * https://stackoverflow.com/a/29018745/2506522
 */
export function binarySearch(ar, el, compare_fn) {
  var m = 0;
  var n = ar.length - 1;
  while (m <= n) {
    var k = (n + m) >> 1;
    var cmp = compare_fn(el, ar[k]);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return -m - 1;
}

/**
 *
 * @param {string} bin
 * @param {string} radix
 */
export function bin2radix(bin, radix) {
  if (radix == "hex") {
    return Bin2Hex2(bin);
  } else if (radix == "float") {
    return Bin2Float(bin, 32, 8, 127);
  } else if (radix == "double") {
    return Bin2Float(bin, 64, 11, 1023);
  } else {
    // Fixed point binary to decimal convertion.
    const m = radix.match(/([us])(\d+)/);
    if (m) {
      const signed = m[1] == "s";
      const digits = m[2];
      return Bin2Dec2(bin, signed, digits);
    }
  }
}

export function isInt(value) {
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

/** * Round a number to the nearest multiple of another number.
 * @param {number} x - The number to round.
 * @param {number} n - The multiple to round to.
 * @returns {number} - The rounded number.
 */
export function ceiln(x, n) {
  return Math.ceil(x / n) * n;
}

/**
 * Truncate text with ellipsis so it fits within maxWidth in a canvas context.
 * https://stackoverflow.com/a/10511598/2506522
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} str
 * @param {number} maxWidth
 * @returns {string}
 */
export function truncateTextToWidth(ctx, str, maxWidth) {
  if (maxWidth < 5) {
    return "";
  } else if (maxWidth < 20) {
    return "…";
  }
  var width = ctx.measureText(str).width;
  var ellipsis = "…";
  var ellipsisWidth = ctx.measureText(ellipsis).width;
  if (width <= maxWidth || width <= ellipsisWidth) {
    return str;
  } else {
    var len = str.length;
    while (width >= maxWidth - ellipsisWidth && len-- > 0) {
      str = str.substring(0, len);
      width = ctx.measureText(str).width;
    }
    return str + ellipsis;
  }
}

// Source - https://stackoverflow.com/a/1431113/2506522
// Posted by Cem Kalyoncu, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-05, License - CC BY-SA 4.0
export function replaceAt(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + replacement.length);
}
