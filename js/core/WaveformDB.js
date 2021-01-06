

import {
    WaveformRow
} from './WaveformRow.js';

import {
    SimulationObject
} from './SimulationObject.js';

import {
    simDB
} from '../core.js';


class WaveformDB{
    constructor(){
        /**  @type {WaveformRow[]} */
        this.rows = []; 
        /**  @type {number} */
        this._idGenerator=0;
    }

    /**
     * Insert a new signal to waveform window.
     * 
     * @param {string[]} hierarchy 
     * @param {number} position 
     */
    insertWaveSignal(hierarchy, position=-1){
        /** @type {WaveformRow} rowItem */
        const obj = simDB.getObject(hierarchy);
        const rowItem = new WaveformRow(obj)
        
        rowItem.id = encodeURIComponent(obj.signal.name).replace(/\./g, '_') + `_${waveformDB._idGenerator++}`;
        
        this.rows.splice(position, 0, rowItem);
    }

    /**
     * Insert a new signal to waveform window.
     * 
     * @param {string[]} hierarchy 
     * @param {number} position 
     */
    removeRow(waveformRow=undefined, position=-1){
        if(position < 0){
            for( var i = 0; i < this.rows.length; i++){ 
                if ( this.rows[i] === waveformRow) {
                    position = i;
                }
            }
        }
        this.rows.splice(position, 1);
    }

    /**
     * Add all signal from the simDB to the waveform window.
     */
    addAllWaveSignal(clear = true){
        if(clear){
            /**  @type {WaveformRow[]} */
            this.rows = []; 
        }
        
        for (var key in simDB.objects) {
            if (Object.prototype.hasOwnProperty.call(simDB.objects, key)){
                if(simDB.objects[key].type == SimulationObject.Type.SIGNAL){
                    this.insertWaveSignal(key.split("."));
                }
            }
          }
    }
}

// The static / global instance:
export var waveformDB = new WaveformDB();
