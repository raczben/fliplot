

import {
    WaveformRow
} from './WaveformRow.js';

import {
    SimulationObject
} from './SimulationObject.js';

import {
    simDB
} from '../interact.js';


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
    insertWaveSignal(hierarchy, position=-1, busAsBus=true){
        if(position<0){
            position = this.rows.length;
        }
        /** @type {SimulationObject} obj */
        const obj = simDB.getObject(hierarchy);
        /** @type {WaveformRow} rowItem */
        const rowItem = new WaveformRow(obj)
        rowItem.id = `waveform_row_${waveformDB._idGenerator++}`;
        
        this.rows.splice(position, 0, rowItem);

        if(busAsBus && rowItem.waveStyle=='bus'){
            for(var i=0; i<obj.signal.width; i++){
                const subObj = obj.cloneRange(i);
                const subRowItem = new WaveformRow(subObj, rowItem);
                subRowItem.id = `waveform_row_${waveformDB._idGenerator++}`;
                this.rows.splice(position+i+1, 0, subRowItem);
            }
        }

        return rowItem.id;
    }

    /**
     * Remove multiple rows from waveform window.
     * 
     * @param {waveformRow[]} waveformRow 
     */
    removeRows(waveformRows, recursive=true){
        waveformRows.forEach(element => {
            this.removeRow(element, recursive);
        });
    }

    /**
     * Remove a single row from waveform window.
     * 
     * @param {waveformRow} waveformRow 
     */
    removeRow(waveformRow, recursive=true){
        var idx = -1;
        if(typeof waveformRow == 'number'){
            idx = waveformRow;
        } else {
            idx = this.getIdx(waveformRow);
        }
        waveformRow = this.rows[idx];
        if(recursive){
            this.removeRows(this.getChildren(waveformRow));
        }
        idx = this.getIdx(waveformRow);
        this.rows.splice(idx, 1);
    }

    getChildren(parent){
        parent = this.get(parent);
        return this.rows.filter(
            row => row.parent == parent
        );
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

    /**
     * Get signal by waveform id.
     */
    get(idOrRow){
        if(this.rows.includes(idOrRow)){
            // the id is a row
            return idOrRow;
        }
        for(const i in this.rows){
            if(this.rows[i].id == idOrRow){
                return this.rows[i];
            }
        }
    }

    /**
     * Get idx by waveform id.
     */
    getIdx(idOrRow){
        for(const i in this.rows){
            if(this.rows[i].id == idOrRow || this.rows[i] == idOrRow){
                return i;
            }
        }
    }

    moveRow(row, pos){
        // Based on: https://stackoverflow.com/a/7180095/2506522
        const idx = this.getIdx(row);
        this.rows.splice(pos, 0, this.rows.splice(idx, 1)[0]);
    }

}

// The static / global instance:
export var waveformDB = new WaveformDB();
