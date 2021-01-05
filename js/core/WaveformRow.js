
export class WaveformRow{
    /**
     * 
     * @param {SimulationObject} simObj 
     */
    constructor (simObj){

        /** @type {string} */
        this.type = 'signal'
        /** @type {string} */
        this.id = 'ABC123'
        /** @type {Signal} */
        this.simObj = simObj
        /** @type {string} */
        this.radix = 'hex'
        /** @type {string} */
        this.waveStyle = ''
        /** @type {number} */
        this.height = -1
        /** @type {string} */
        this.name = simObj.hierarchy.join('.')
        
        if (simObj.signal.width == 1) {
            this.waveStyle = 'bit';
        } else {
            this.waveStyle = 'bus';
        }
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
