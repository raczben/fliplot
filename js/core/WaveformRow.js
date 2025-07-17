import { SimulationObject } from "./SimulationObject.js";

export class WaveformRow {
  /**  @type {number} */
  static _idGenerator = 0;

  /**
   *
   * @param {SimulationObject} simObj
   */
  constructor(simObj) {
    /** @type {string} */
    this.type = "signal";
    /** @type {string} */
    this.id = `wfr-${WaveformRow._idGenerator++}`;
    /** @type {SimulationObject} */
    this.simObj = simObj;
    /** @type {string} */
    this.radix = "hex";
    /** @type {string} */
    this.waveStyle = "";
    /** @type {number} */
    this.height = -1;
    /** @type {string} */
    this.name = simObj.hierarchy.join(".");

    this.setRadix();

    if (simObj.signal.width == 1) {
      this.waveStyle = "bit";
    } else {
      this.waveStyle = "bus";
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
  getValueAt(time, def = "- NA -") {
    return this.radixPrefix + this.simObj.getValueAt(time, this.radix, def);
  }

  /**
   * @param {number} i
   * @param {number} def
   */
  getValueAtI(i, def) {
    return this.radixPrefix + this.simObj.getValueAtI(i, this.radix, def);
  }

  /**
   * @param {int} i
   */
  getTimeAtI(i, now = -1) {
    return this.simObj.getTimeAtI(i, now);
  }

  /**
   * @param {String} radix
   */
  setRadix(radix, prefix) {
    if (this.simObj.signal.width == 1) {
      this.radix = "bin";
      this.radixPrefix = "";
      return;
    }
    if (radix === undefined) {
      radix = "hex";
    }
    radix = radix.toLowerCase();
    if (["unsigned", "u"].includes(radix)) {
      radix = "u0";
      prefix = "";
    } else if (["signed", "s", "decimal"].includes(radix)) {
      radix = "s0";
      prefix = "";
    } else if (radix.startsWith("h")) {
      prefix = "0x";
    } else if (radix.startsWith("b")) {
      prefix = "0b";
    }

    this.radix = radix;
    this.radixPrefix = prefix;
  }
}
