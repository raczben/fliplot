import { Signal } from "./Signal.js";
import { SimulationObject } from "./SimulationObject.js";
import { replaceAt } from "../core/util.js";

/**
 * SimDB is a database for managing simulation objects such as modules and signals.
 */
export class SimDB {
  /**
   * Creates an instance of SimDB and initializes it with the provided database.
   * @param {Object} db - The database object containing simulation data.
   */
  constructor(db) {
    this.init(db);
  }

  /**
   * Initializes the SimDB instance with the given database.
   * @param {Object} db - The database object containing simulation data.
   */
  init(db) {
    /** @type {SimulationObject[]} */
    this.objects = [];
    /** @type {number} */
    this.now = -1;
    /** @type {number} */
    this.timePrecision = -1;
    /** @type {number} */
    this.timeUnit = -1;

    if (db) {
      Object.values(db.signals).forEach((sig) => {
        sig.references.forEach((ref) => {
          const hierarchy = ref;
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
  addSignal(hierarchy, signal) {
    const associativeIndex = hierarchy.join(".") + "__S";
    var parent = this.addModule(hierarchy.slice(0, -1));

    const child = new SimulationObject(SimulationObject.SOType.SIGNAL, hierarchy, signal, parent);
    this.objects[associativeIndex] = child;
    return child;
  }

  /**
   * Adds a module to the database using its hierarchy.
   * If the module already exists, returns the existing object.
   * @param {string[]} hierarchy - The hierarchical path of the module.
   * @returns {SimulationObject} The created or existing module SimulationObject.
   */
  addModule(hierarchy) {
    const associativeIndex = hierarchy.join(".");
    var parent = null;
    // if child exists:
    var child = this.getObject(hierarchy);
    if (child !== undefined) {
      return child;
    }

    if (hierarchy.length > 1) {
      parent = this.addModule(hierarchy.slice(0, -1));
    }
    child = new SimulationObject(SimulationObject.SOType.MODULE, hierarchy, undefined, parent);
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
  isPathExist(hierarchy, recursive = true) {
    const associativeIndex = hierarchy.join(".");
    var ret = associativeIndex in this.objects;
    if (recursive) {
      if (hierarchy.length == 1) {
        return ret;
      }
      return ret && this.isPathExist(hierarchy.slice(0, -1));
    }
    return ret;
  }

  /**
   * Retrieves a simulation object by its hierarchy.
   * @param {string[]} hierarchy - The hierarchical path of the object.
   * @returns {SimulationObject|undefined} The simulation object, or undefined if not found.
   */
  getObject(hierarchy) {
    var associativeIndex = hierarchy;
    if (Array.isArray(hierarchy)) {
      associativeIndex = hierarchy.join(".");
    }
    return this.objects[associativeIndex];
  }

  /**
   * Retrieves all signal objects from the database.
   * @returns {Object[]} An array of all signal objects.
   */
  getAllSignals() {
    const ret = [];
    for (var key in this.objects) {
      if (Object.prototype.hasOwnProperty.call(this.objects, key)) {
        var obj = this.objects[key];
        if (obj.soType == SimulationObject.SOType.SIGNAL) {
          ret.push(obj.signal);
        }
      }
    }
    return ret;
  }

  /**
   *
   * @param {[SimulationObject]} simObjects
   * @param {string} busName
   * @returns {SimulationObject}
   */
  createVirtualBus(simObjects, busName = "New Virtual Bus") {
    const nOfBits = simObjects.length;
    const retSig = new Signal({
      references: "Virtual Bus, see bits...",
      vcdid: "Virtual Bus, see bits...",
      sigType: "virtual-bus",
      wave: [],
      width: nOfBits,
      bit_references: simObjects.map((so) => so[0])
    });
    // clone all the wave item bits into a new virtual bus signal
    // the postition of the bits corewsponds to the position in the simObject array
    const retWi = [];
    for (let i = 0; i < nOfBits; i++) {
      const bitSig = simObjects[i].signal;
      bitSig.wave.forEach((wi) => {
        retWi.push({
          pos: i,
          bin: wi.bin,
          time: wi.time
        });
      });
    }

    // lets sort retWi by time:
    retWi.sort((a, b) => a.time - b.time);

    //lets merge the wave itms at the same time.
    var currentVi = {
      time: -1,
      bin: "x".repeat(nOfBits)
    };
    var lastVi = currentVi;
    retWi.forEach((wi) => {
      currentVi = {
        bin: replaceAt(lastVi.bin, wi.pos, wi.bin),
        time: wi.time
      };
      if (lastVi.time == currentVi.time) {
        retSig.wave[retSig.wave.length - 1] = currentVi;
      } else {
        retSig.wave.push(currentVi);
      }
      lastVi = currentVi;
    });

    const ret = new SimulationObject(SimulationObject.SOType.SIGNAL, [busName], retSig, null);

    return ret;
  }
}
