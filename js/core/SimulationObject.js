import { Signal } from "./Signal.js";

/**
 * Represents an object in the simulation, which can be either a signal or a module.
 * Handles signal hierarchy, parent relationships, and provides methods for querying signal values and transitions.
 *
 * @class
 */
export class SimulationObject {
  static Type = Object.freeze({
    SIGNAL: "signal",
    MODULE: "module"
  });
  static _idGenerator = 0;

  /**
   *
   * @param {SimulationObject.Type} type
   * @param {string[]} hierarchy
   * @param {*} data
   * @param {SimulationObject} parent
   */
  constructor(type, hierarchy, data, parent) {
    /** @type {SimulationObject.Type}  */
    this.type = type;
    /** @type {string[]}  */
    this.hierarchy = hierarchy;
    /** @type {SimulationObject}  */
    this.parent = parent;
    /** @type {Signal}  */
    this.signal = undefined;
    /** @type {String}  */

    if (data !== undefined) {
      switch (this.type) {
        case SimulationObject.Type.SIGNAL:
          if (data instanceof Signal) {
            this.signal = data;
          } else {
            this.signal = new Signal(data);
          }
          break;
        case SimulationObject.Type.MODULE:
          break;
        default:
          throw `Unknown type ${this.type}`;
      }
      /** @type {string} */
      this.definedAt = data.definedAt;
    }
  }
  /** Clones a range of a bus signal.
   *
   * @param {number} from
   * @param {number} to
   * @returns {SimulationObject}
   */
  cloneRange(from, to = -1) {
    if (to < 0) {
      to = from;
    }
    const nOfBits = Math.abs(to - from) + 1;
    if (nOfBits > this.signal.width) {
      throw `Cannot clone range [${from}:${to}] of signal ${this.hierarchy.join(".")} with width ${this.signal.width}`;
    }
    var con = `[${from}]`;
    if (to > from) {
      con = `[${to}:${from}]`;
    }
    const hierarchy = this.hierarchy.concat([con]);
    const signal = this.signal.cloneRange(from, to);
    const ret = new SimulationObject(this.type, hierarchy, signal, this);
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
  getValueAt(time, radix, def = "- NA -") {
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
  getTimeAtI(i, now = -1) {
    return this.signal.getTimeAtI(i, now);
  }

  isTransition(idx, fnc) {
    // get values in fixed unsigned format
    // TODO: should be used the custom radix
    let vprev = this.getValueAtI(idx - 1, "u0");
    let vcurr = this.getValueAtI(idx, "u0");
    return fnc(vprev, vcurr);
  }
  /**
   * Returns the simulation time of the previous or next transition of the given
   * signal.
   * @param {number} time - The initial time to start searching for the transition.
   * @param {number} deltaTransition - -1 for previous transition, +1 for next transition.
   * @param {function} fnc - Function that returns true at the desired transition.
   */
  getTransitionTime(time, deltaTransition, fnc = undefined) {
    if (fnc === undefined) {
      fnc = (_v0, _v1) => {
        return true;
      };
    }
    let idx = this.getChangeIndexAt(time);
    if (deltaTransition < 0) {
      // previous nth change
      const changeT = this.getTimeAtI(idx);
      if (changeT != time) {
        // cursor is not located at value change
        deltaTransition++;
      }
    }
    let deltaTransitionAbs = Math.abs(deltaTransition);
    const increment = deltaTransition < 0 ? -1 : 1;
    while (deltaTransitionAbs > 0) {
      if (idx < 0) {
        console.warn(`getTransitionTime: no previous transition at time ${time}`);
        return -1; // no previous transition (TODO: Exception?)
      } else if (idx >= this.signal.wave.length) {
        console.warn(`getTransitionTime: no next transition at time ${time}`);
        return -1; // no previous transition (TODO: Exception?)
      }
      // get values in fixed unsigned format
      // TODO: should be used the custom radix
      idx += increment;
      if (this.isTransition(idx, fnc)) {
        deltaTransitionAbs--;
      }
    }
    const t = this.getTimeAtI(idx);
    return t;
  }

  /**
   * Wrapper for getTransitionTime():
   * Returns the simulation time of the previous or next transition of any type
   * (rising, falling, etc.) of the given signal.
   *
   * @param {number} time - The initial time to start searching for the transition.
   * @param {number} deltaTransition - -1 for previous transition, +1 for next transition.
   */
  getTransitionTimeAny(time, deltaTransition) {
    return this.getTransitionTime(time, deltaTransition);
  }
  /**
   * Wrapper for getTransitionTime():
   * Returns the simulation time of the previous or next transition of only the RISING type
   * of the given signal.
   *
   * @param {number} time - The initial time to start searching for the transition.
   * @param {number} deltaTransition - -1 for previous transition, +1 for next transition.
   */
  getTransitionTimeRising(time, deltaTransition) {
    const frising = (vprev, vcurr) => {
      return vprev < vcurr; // rising edge
    };
    return this.getTransitionTime(time, deltaTransition, frising);
  }
  /**
   * Wrapper for getTransitionTime():
   * Returns the simulation time of the previous or next transition of only the FALLING type
   * of the given signal.
   *
   * @param {number} time - The initial time to start searching for the transition.
   * @param {number} deltaTransition - -1 for previous transition, +1 for next transition.
   */
  getTransitionTimeFalling(time, deltaTransition) {
    const ffalling = (vprev, vcurr) => {
      return vprev > vcurr; // rising edge
    };
    return this.getTransitionTime(time, deltaTransition, ffalling);
  }
}
