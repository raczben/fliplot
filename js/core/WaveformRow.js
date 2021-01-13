import { SimulationObject } from "./SimulationObject.js"

export class WaveformRow{
    /**
     * 
     * @param {SimulationObject} simObj 
     */
    constructor (simObj, parent){

        /** @type {string} */
        this.type = 'signal';
        /** @type {string} */
        this.id = 'ABC123';
        /** @type {SimulationObject} */
        this.simObj = simObj;
        /** @type {string} */
        this.radix = 'hex';
        /** @type {string} */
        this.waveStyle = '';
        /** @type {number} */
        this.height = -1;
        /** @type {string} */
        this.name = simObj.hierarchy.join('.');
        /** @type {WaveformRow} */
        this.parent = parent;
        this.opened = false;
        
        if (simObj.signal.width == 1) {
            this.waveStyle = 'bit';
        } else {
            this.waveStyle = 'bus';
        }
    }

    isVisible() {
        if(this.parent){
            return this.parent.isVisible() && this.parent.opened;
        } else{
            return true;
        }
    }

    openGroup(){
        this.opened = true;
    }

    closeGroup(){
        this.opened = false;
    }

    /**
     * @param {number} time 
     */
    getChangeIndexAt(time) {
        return this.simObj.getChangeIndexAt(time);
    }

    /**
     * 
     * @param {number} time 
     * @param {number} def 
     */
    getValueAt(time, def='- NA -') {
        return this.simObj.getValueAt(time, this.radix, def);
    }

    /**
     * @param {number} i 
     * @param {number} def 
     */
    getValueAtI(i, def) {
        return this.simObj.getValueAtI(i, this.radix, def);
    }
    
    /**
     * @param {int} i 
     */
    getTimeAtI(i) {
        return this.simObj.getTimeAtI(i);
    }
}
