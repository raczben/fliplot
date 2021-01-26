

import {
    WaveformRow
} from './WaveformRow.js';

import {
    SimulationObject
} from './SimulationObject.js';

import {
    simDB
} from '../interact.js';
import { Tree } from './tree.js';


class WaveformDB{
    constructor(){
        /**  @type {Tree} */
        this.rows = new Tree();
    }

    /**
     * Insert a new signal to waveform window.
     * 
     * @param {string[]} hierarchy 
     * @param {number} position 
     */
    insertWaveSignal(hierarchy, parent=null, position=-1, busAsBus=true){
        /** @type {SimulationObject} obj */
        const obj = simDB.getObject(hierarchy);
        /** @type {WaveformRow} rowItem */
        const rowItem = new WaveformRow(obj)
        
        this.rows.insert(rowItem.id, parent, position, rowItem);

        if(busAsBus && rowItem.waveStyle=='bus'){
            for(var i=0; i<obj.signal.width; i++){
                const subObj = obj.cloneRange(i);
                const subRowItem = new WaveformRow(subObj, rowItem);
                this.rows.insert(subRowItem.id, rowItem.id, i, subRowItem);
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
    removeRow(id, recursive=true){
        id = this.getId(id);
        this.rows.remove(id);
    }

    getVisible(parent){
        return this.rows.getVisible(parent).map(node => node.data)
    }

    getChildren(parent){
        return this.rows.getVisible(parent).map(node => node.data)
    }

    /**
     * Add all signal from the simDB to the waveform window.
     */
    addAllWaveSignal(clear = true){
        if(clear){
            this.rows = new Tree();
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
    get(id) {
        if(id.constructor == WaveformRow){
            id = id.id;
        }
        return this.rows.get(id).data;
    }

    /**
     * Get signal by waveform id.
     */
    getId(row) {
        if(row.constructor != WaveformRow){
            row = this.rows.get(row);
        }
        return row.id;
    }


    moveRow(row, pos, parent, force=false){
        this.rows.move(row, pos, parent, force);
    }

    open(id, open=true){
        id = this.getId(id);
        this.rows.open(id, open);
    }

    close(node){
        this.open(node, false);
    }

    openAll(open=true){
        this.rows.openAll(open);
    }

    closeAll(){
        this.openAll(false);
    }


}

// The static / global instance:
export var waveformDB = new WaveformDB();
