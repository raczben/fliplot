

import {
    SimulationObject
  } from './SimulationObject.js';

/**
 * SimDB is a database for managing simulation objects such as modules and signals.
 */
export class SimDB{
    /**
     * Creates an instance of SimDB and initializes it with the provided database.
     * @param {Object} db - The database object containing simulation data.
     */
    constructor(db){
        this.init(db);
    }
    
    /**
     * Initializes the SimDB instance with the given database.
     * @param {Object} db - The database object containing simulation data.
     */
    init(db){
        /** @type {SimulationObject[]} */
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
     * Adds a signal to the database using its hierarchy.
     * @param {string[]} hierarchy - The hierarchical path of the signal.
     * @param {Object} signal - The signal object to add.
     * @returns {SimulationObject} The created SimulationObject of the signal.
     */
    addSignal(hierarchy, signal){
        const associativeIndex = hierarchy.join('.') + '__S';
        var parent = this.addModule(hierarchy.slice(0,-1));

        const child = new SimulationObject(SimulationObject.Type.SIGNAL, hierarchy, signal, parent);
        this.objects[associativeIndex] = child;
        return child;
    }

    /**
     * Adds a module to the database using its hierarchy.
     * If the module already exists, returns the existing object.
     * @param {string[]} hierarchy - The hierarchical path of the module.
     * @returns {SimulationObject} The created or existing module SimulationObject.
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
     * Checks if a path exists in the database.
     * If recursive is true, checks all parent paths as well.
     * @param {string[]} hierarchy - The hierarchical path to check.
     * @param {boolean} [recursive=true] - Whether to check parent paths recursively.
     * @returns {boolean} True if the path exists, otherwise false.
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
     * Retrieves a simulation object by its hierarchy.
     * @param {string[]} hierarchy - The hierarchical path of the object.
     * @returns {SimulationObject|undefined} The simulation object, or undefined if not found.
     */
    getObject(hierarchy){
        var associativeIndex = hierarchy;
        if(Array.isArray(hierarchy)){
            associativeIndex = hierarchy.join('.');
        }
        return this.objects[associativeIndex];
    }

    /**
     * Retrieves all signal objects from the database.
     * @returns {Object[]} An array of all signal objects.
     */    
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

    /**
     * Updates all signals to ensure they have an initial value at time zero.
     * If a signal's wave is empty, adds a default value at time zero.
     * If the first entry is not at time zero, prepends a phantom value at time zero.
     */
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
                wave.unshift({time:0, bin:'x'.repeat(element.width)});
            }
        });
    }
}

