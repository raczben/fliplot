

import {
    SimulationObject
  } from './SimulationObject.js';

export class SimDB{
    constructor(db){
        this.init(db);
    }
    
    init(db){
        /** @type {Signal[]} */
        this.objects = [];
        /** @type {number} */
        this.now = -1;
        /** @type {number} */
        this.timePrecision = -1;
        /** @type {number} */
        this.timeUnit = -1;

        if(db){
            db.signals.forEach(sig => {
                sig.references.forEach(ref => {
                    const hierarchy = ref.split('.')
                    this.addSignal(hierarchy, sig);
                });
            });
            this.now = db.now;
        }
    }


    /**
     * @param {string[]} hierarchy 
     */
    addSignal(hierarchy, signal){
        const associativeIndex = hierarchy.join('.') + '__S';
        var parent = this.addModule(hierarchy.slice(0,-1));

        const child = new SimulationObject(SimulationObject.Type.SIGNAL, hierarchy, signal, parent);
        this.objects[associativeIndex] = child;
        return child;
    }

    /**
     * @param {string[]} hierarchy 
     */
    addModule(hierarchy){
        const associativeIndex = hierarchy.join('.');
        var parent = null;
        // if child exists:
        var child = this.getObject(hierarchy);
        if(child !== undefined){
            return child;
        }
        
        if(hierarchy.length > 1) {
            parent = this.addModule(hierarchy.slice(0,-1));
        }
        child = new SimulationObject(SimulationObject.Type.MODULE, hierarchy, undefined, parent);
        this.objects[associativeIndex] = child;
        return child;
    }

    /**
     * @param {string[]} hierarchy 
     * @param {boolean} recursive 
     */
    isPathExist(hierarchy, recursive=true){
        const associativeIndex = hierarchy.join('.');
        var ret =  associativeIndex in this.objects;
        if(recursive){
            if(hierarchy.length == 1) {
                return ret;
            }
            return ret && this.isPathExist(hierarchy.slice(0,-1));
        }
        return ret;
    }

    /**
     * @param {string[]} hierarchy 
     */
    getObject(hierarchy){
        const associativeIndex = hierarchy.join('.');
        return this.objects[associativeIndex];
    }

    getAllSignals(){
        const ret = []
        for (var key in this.objects) {
            if (Object.prototype.hasOwnProperty.call(this.objects, key)){
                var obj = this.objects[key];
                if(obj.type == SimulationObject.Type.SIGNAL){
                    ret.push(obj.signal)
                }
            }
        }
        return ret;
    }

    updateDBInitialX(){
        this.getAllSignals().forEach(element => {
            var wave = element.wave;
            if(wave.length == 0){
                // Empty array
                wave.push({time:0, bin:'x'});
                return;
            }
            if(wave[0].time != 0){
                // Append the phantom zero-th value.
                wave.unshift({time:0, bin:'x'});
            }
        });
    }
}

