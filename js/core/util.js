

/**
 * From: https://stackoverflow.com/a/12987042/2506522
 * 
 *///Useful Functions
 function checkBin(n){return/^[01]{1,64}$/.test(n)}
//  function checkDec(n){return/^[0-9]{1,64}$/.test(n)}
//  function checkHex(n){return/^[0-9A-Fa-f]{1,64}$/.test(n)}
//  function pad(s,z){s=""+s;return s.length<z?pad("0"+s,z):s}
//  function unpad(s){s=""+s;return s.replace(/^0+/,'')}
 
 //Decimal operations
//  function Dec2Bin(n){if(!checkDec(n)||n<0)return NaN;return n.toString(2)}
//  function Dec2Hex(n){if(!checkDec(n)||n<0)return NaN;return n.toString(16)}
 
 //Binary Operations
 function Bin2Dec(n){if(!checkBin(n))return NaN;return parseInt(n,2).toString(10)}
 function Bin2Hex(n){if(!checkBin(n))return NaN;return parseInt(n,2).toString(16)}
 
 //Hexadecimal Operations
//  function Hex2Bin(n){if(!checkHex(n))return NaN;return parseInt(n,16).toString(2)}
//  function Hex2Dec(n){if(!checkHex(n))return NaN;return parseInt(n,16).toString(10)}
 
function Bin2Hex2(n){
    const ret = Bin2Hex(n)
    if(isNaN(ret)){
        // TODO: Should be splitted and converted by 4 bits.
        return 'x'.repeat(Math.ceil(n.length / 4));
    } else{
        return ret;
    }
}
 
function Bin2Dec2(n, signed=false, fractionalDigits=0){
    if(fractionalDigits != 0){
        throw 'Non-zero number of fractional digits is not supported yet.'
    }
    if(signed){
        throw 'Signed format is not supported yet.'
    }
    const ret = Bin2Dec(n)
    if(isNaN(ret)){
        return 'x'.repeat(Math.ceil(n.length / 4));
    } else{
        return ret;
    }
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
export function bin2radix(bin, radix){
    if(radix == 'hex'){
        return '0x' + Bin2Hex2(bin); //TODO
    } else if (radix == 'float'){
        return NaN; //TODO
    } else if (radix == 'double'){
        return NaN; //TODO
    } else{
        const m=radix.match(/[us]\d+/)
        if (m){
            const signed = (m[1]=='s')
            const digits = m[2]
            return Bin2Dec2(bin, signed, digits);
        }
    }
}