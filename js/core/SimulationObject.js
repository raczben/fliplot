

import {
    Signal
  } from './Signal.js';

export class SimulationObject{
    static Type = Object.freeze({
        SIGNAL:'signal',
        MODULE:'module'
    })
    static _idGenerator = 0;
    
    /**
     * 
     * @param {SimulationObject.Type} type 
     * @param {sting[]} hierarchy 
     * @param {*} data 
     */
    constructor(type, hierarchy, data, parent){
        /** @type {SimulationObject.Type}  */
        this.type = type;
        /** @type {string[]}  */
        this.hierarchy = hierarchy;
        /** @type {SimulationObject}  */
        this.parent = parent;
        /** @type {Signal}  */
        this.signal = undefined;
        /** @type {String}  */

        if(data !== undefined ){
            switch (this.type) {
                case SimulationObject.Type.SIGNAL:
                    if(data instanceof Signal){
                        this.signal = data;
                    } else {
                        this.signal = new Signal(data);
                    }
                    break;
                case SimulationObject.Type.MODULE:
                    break;
                default:
                    throw `Unknown type ${this.type}`
            }
            /** @type {string} */
            this.definedAt = data.definedAt;
        }
    }

    cloneRange(from, to=-1){
        if(to<0){to = from;}
        var con = `[${from}]`;
        if(to > from){
            con = `[${to}:${from}]`;
        }
        const hierarchy = this.hierarchy.concat([con]);
        const signal = this.signal.cloneRange(from, to);
        const ret = new SimulationObject(
            this.type, hierarchy, signal, this
            );
        return ret;
    }

    /**
     * @param {number} time 
     */
    getChangeIndexAt(time) {
        return this.signal.getChangeIndexAt(time);
    }

    /**
     * 
     * @param {number} time 
     * @param {number} def 
     */
    getValueAt(time, radix, def='- NA -') {
        return this.signal.getValueAt(time, radix, def);
    }

    /**
     * @param {number} i 
     * @param {number} def 
     */
    getValueAtI(i, radix, def) {
        return this.signal.getValueAtI(i, radix, def);
    }
    
    /**
     * @param {int} i 
     */
    getTimeAtI(i) {
        return this.signal.getTimeAtI(i);
    }
}
