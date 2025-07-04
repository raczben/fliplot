
import {
    binarySearch,
    bin2radix
  } from './util.js';

/**
 * Value change type builds up the wave list of the signal. Each element describes a value change of
 * a signal.
 * 
 * @typedef {Object} valueChange_t 
 * @property {number} time Simulation time in the unit of the simulation timePrecision.
 * @property {string} bin The raw value in binary form. Each character represents a bit in the
 *      bitvector. All other (optional) value format is derived from this.
 * @property {string} [hex] A derived value from raw bin. Optional: calculated only when the user
 *      wants to see hex values. Each hex digit will be X and Z if there is an X or Z bit value in
 *      its region.
 * @property {number} [u30] Fixed point float number. First character (s/u) note signed and unsigned
 *      format. The number of bits used to represent the fraction value (the number of bits below the
 *      decimal point) This means, that u0 means that the whole bitvector represents a fixed point
 *      unsigned integer. Note, that the full word length is defined at signal level. Derived,
 *      optional as above. Note, that if any X or Z located in the raw binary format, this value
 *      will be NaN.
 * @property {number} [float] Single point float number. Derived, optional as above.
 * @property {number} [double] Double point float number. Derived, optional as above.
*/

export class Signal {
    constructor(sig){
        /** @type {string[]} */
        this.references = sig.references;
        /** @type {string} */
        this.vcdid = sig.vcdid;

        /** @type {string} */
        this.type = sig.type;
        /** @type {valueChange_t[]} */
        this.wave = sig.wave;
        /** @type {number} */
        this.width = sig.width;
    }

    cloneRange(from, to=-1){
        if(to<0){
            to = from;
        }
        if(from < to){
            // Big endian
            console.warn('Big endian not tested...')
        }
        const nOfBits = Math.abs(from-to)+1;
        if(nOfBits > this.width){
            throw `Cannot clone range [${from}:${to}] of signal ${this.references[0]} with width ${this.width}`;
        }
        const retType = (this.width == 1) ? 'bit' : 'bus';
        const ret = new Signal(
            {references: this.references.concat([`[${from}:${to}]`]),
             vcdid: `${this.vcdid}-cloned[${from}:${to}]`,
             type: retType,
             wave: [],
             width: nOfBits
        });
        // little endian conversion:
        const fromLE = this.width - 1 - from;
        const toLE = this.width - 1 - to;
        this.wave.forEach(wi => {
            const retWi = {time: wi.time, bin: wi.bin.substring(fromLE, toLE+1)};
            ret.wave.push(retWi);
        });
        // ret.width = to-from+1;
        return ret;
    }
    
    /**
     * @param {number} time 
     * @return {number} The index of the last change value before the given time.
     * If the time is before the first change, it returns -1.
     */
    getChangeIndexAt(time) {
        var idx = binarySearch(this.wave, time, (time, wave) => {
            return time - wave.time;
        })
        // Binary search returns the exact index if time is found,
        // and a negative value if not found.
        // Calculate complement: (we need the index of the previous change value)
        if (idx < 0) {
            idx = -idx - 2;
        }
        // if idx is -1, it means that the time is before the first change.
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
    getValueAtI(i, radix='bin', def) {
        if (i < 0){
            if(def !== undefined){
                return def;
            }
            throw 'Negative index';
        }
        
        if(this.wave[i][radix] === undefined){
            this.wave[i][radix] = bin2radix(this.wave[i].bin, radix);
        }
        return this.wave[i][radix];
    }
    
    /**
     * @param {int} i 
     */
    getTimeAtI(i, now=-1) {
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

// export var mySignal = new Signal();