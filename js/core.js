export var now = -1; // Todo should be integrated to signalDB

/**
 * Value change type builds up the wave list of the signal. Each element describes a value change of
 * a signal.
 * 
 * @typedef {Object} valueChange_t 
 * @property {number} time Simulation time in the unit of the simulation timePrecision.
 * @property {string} val The raw value in binary. Each character represents a bit in the bitvector.
 * @property {string} [hex] A derived value from raw val. Optional: calculated only when the user
 *      wants to see hex values. Each hex digit will be X and Z if there is an X or Z bit value in
 *      its region.
 * @property {number} [s30] Fixed point float number. First character (s/u) note signed and unsigned
 *      format. The number of bits used to represent the integer value (the number of bits above the
 *      decimal point) Note, that the full word length is defined at signal level. So the len and
 *      this numbers are equal, the value is a fixed point integer. Derived, optional as above.
 *      Note, that if any X or Z located in the raw binary format, this value will be NaN.
 * @property {number} [float] Single point float number. Derived, optional as above.
 * @property {number} [double] Double point float number. Derived, optional as above.
*/

/**
 * Signal type-definition.
 * @typedef {Object} signal_t 
 * @property {string[]} hierarcy
 * @property {string} name
 * @property {string[]} references
 * @property {string} type
 * @property {string} vcdid
 * @property {valueChange_t[]} wave
 * @property {number} width
*/

/**
 * waveformRow type-definition.
 * @typedef {Object} waveformRow_t 
 * @property {string} type
 * @property {string} id
 * @property {signal_t} signal
 * @property {string} radix
 * @property {string} waveStyle
 * @property {number} height
*/

class SimDB{
    constructor(db){
        /** @type {signal_t[]} */
        this.signals = [];
        /** @type {number} */
        this.now = -1;
        /** @type {number} */
        this.timePrecision = -1;
        /** @type {number} */
        this.timeUnit = -1;

        if(db){
            this.signals = db.signals.reduce(function(acc, element) {
                acc.push(new Signal(element));
                return acc;
            },[])
        }
    }

    updateDBInitialX(){
        this.signals.forEach(element => {
            var wave = element.wave;
            if(wave.length == 0){
                // Empty array
                wave.push({time:0, val:'x'});
                return;
            }
            if(wave[0].time != 0){
                // Append the phantom zero-th value.
                wave.unshift({time:0, val:'x'});
            }
        });
    }
}

class WaveformDB{
    constructor(){
        /**  @type {waveformRow_t[]} */
        this.rows = []; 
        /**  @type {number} */
        this._idGenerator=0;
    }

    /**
     * Insert a new signal to waveform window.
     * 
     * @param {*} signalID 
     * @param {number} position 
     */
    insertWaveSignal(signalID, position=-1){
        /** @type {waveformRow_t} rowItem */
        const rowItem = {
            radix: 'bin',
            signal: simDB.signals[signalID]
        };
        if (rowItem.signal.width == 1) {
            rowItem.waveStyle = 'bit';
        } else {
            rowItem.waveStyle = 'bus';
        }
        rowItem.id = encodeURIComponent(rowItem.signal.name).replace(/\./g, '_') + `_${waveformDB._idGenerator++}`;
        
        this.rows.splice(position, 0, rowItem);
    }

    /**
     * Add all signal from the simDB to the waveform window.
     */
    addAllWaveSignal(){
        simDB.signals.forEach((_element, index) => {
            this.insertWaveSignal(index);
        });
    }
}

export function setSimDB(db, n){
    simDB = new SimDB(db);
    waveformDB = new WaveformDB();
    now = n;
    waveformDB.addAllWaveSignal();
}

  
/******************************************************************************
 * 
 * Get time and value
 * 
 ******************************************************************************/

class Signal {
    constructor(sig){
        /** @type {string[]} */
        this.hierarcy = [];
        /** @type {string} */
        this.name = undefined;
        /** @type {string[]} */
        this.references = [];
        /** @type {string} */
        this.type = undefined;
        /** @type {string} */
        this.vcdid = undefined;
        /** @type {valueChange_t[]} */
        this.wave = [];
        /** @type {number} */
        this.width = 1;

        Object.assign(this, sig);
    }
    /**
     * @param {number} time 
     */
    getChangeIndexAt(time) {
        var idx = binarySearch(this.wave, time, (time, wave) => {
        return time - wave.time;
        })
        if (idx < 0) {
        idx = -idx - 2;
        }
        return idx;
    }

    /**
     * 
     * @param {number} time 
     * @param {number} def 
     */
    getValueAt(time, radix, def='- NA -') {
        const idx = this.getChangeIndexAt(time);
        return this.getValueAtI(idx, radix, def);
    }

    /**
     * @param {number} i 
     * @param {number} def 
     */
    getValueAtI(i, radix='val', def) {
        if (i < 0){
            if(def !== undefined){
                return def;
            }
            throw 'Negative index';
        }
        if (i >= this.wave.length){
            i = this.wave.length -1;
        }
        
        if(this.wave[i][radix] === undefined){
            this.wave[i][radix] = bin2radix(this.wave[i].val, radix);
        }
        return this.wave[i][radix];
    }
    
    /**
     * @param {int} i 
     */
    getTimeAtI(i) {
        if (i < 0){
            throw 'Negative index';
        }
        if (i < this.wave.length){
            return this.wave[i].time;
        }
        if (i == this.wave.length){
            return now;
        }
        else {
            throw 'Index is too great';
        }
    }

}

/**
 * 
 * @param {string} bin 
 * @param {string} radix 
 */
function bin2radix(bin, radix){
    if(radix == 'hex'){
        return Bin2Hex2(bin); //TODO
    } else if (radix == 'float'){
        return NaN; //TODO
    } else if (radix == 'double'){
        return NaN; //TODO
    } else{
        const m=radix.match(/[us]\d+/)
        if (m){
            const signed = (m[1]=='s')
            const digits = m[2]
            return Bin2Dec2(bin); //TODO
        }
    }
}

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
 
function Bin2Hex2(n, len){
    const ret = Bin2Hex(n)
    if(isNaN(ret)){
        // TODO: Should be splitted and converted by 4 bits.
        return 'x'.repeat(Math.ceil(n.length / 4));
    } else{
        return ret;
    }
}
 
function Bin2Dec2(n, len){
    const ret = Bin2Dec(n)
    if(isNaN(ret)){
        // TODO: Should be splitted and converted by 4 bits.
        return 'x'.repeat(Math.ceil(n.length / 4));
    } else{
        return ret;
    }
}

/******************************************************************************
 * 
 * Interface API
 * 
 ******************************************************************************/

  
/**
 * This function returns simulation time of the previous/next (arbirtary) transitition of the given
 * signal.
 * 
 * @param {signal_t} signal 
 * @param {number} time 
 * @param {number} deltaTransition 
 */
export function getTimeAnyTransition(signal, time, deltaTransition) {
    const idx = signal.getChangeIndexAt(time);
    if(deltaTransition < 0){
        // previous nth change
        const changeT = signal.getTimeAtI(idx);
        if(changeT != time){
            // cursor is not located at value change
            deltaTransition++;
        }
    }
    const t = signal.getTimeAtI(idx+deltaTransition);
    console.log(t)
    return t;
}


/******************************************************************************
 * 
 * OTHER / UTIL FUNCTIONS
 * 
 ******************************************************************************/


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
function binarySearch(ar, el, compare_fn) {
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
 * simDB is mainly the parsed VCD file.
 * This contains all data from the simulation or from the VCD file. First of all it stores all
 * signals with its values, the *now* pointer, the VCD file name, etc...
 * 
 * waveformDB is mainly the wave.do file.
 * This stores the drawing config. It stores entries for each visualized signals (a reference to
 * the simDB) stores the radix, signal type, and other plotting related information.
 * 
 * Note, that if the same signal will be added twice to the wave-view, the simDB will be untouched.
 * Only a new waveformDB-entry will be created with a reference to that signals simDB's entry.
 */
export var simDB = new SimDB();
export var waveformDB = new WaveformDB();
