
import {
    binarySearch,
    bin2radix
  } from './util.js';
import {
    simDB
  } from '../core.js';

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
    getValueAtI(i, radix='bin', def) {
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
            this.wave[i][radix] = bin2radix(this.wave[i].bin, radix);
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
            return simDB.now;
        }
        else {
            throw 'Index is too great';
        }
    }
    
    test2(){
        console.log('asdasdq');
    }
}

export function test(){
    console.log('asd');
}

// export var mySignal = new Signal();