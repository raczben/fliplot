import { SimulationObject } from "../core/SimulationObject.js";

export class WaveformRow {
  /**  @type {number} */
  static _idGenerator = 0;

  static WaveStyle = Object.freeze({
    BIT: "bit",
    BUS: "bus",
    ANALOG: "analog",
    BLANK: "blank"
  });

  static Type = Object.freeze({
    SIGNAL: "signal",
    GROUP: "group"
  });

  /**
   *
   * @param {SimulationObject} simObj
   */
  constructor(simObj) {
    /** @type {WaveformRow.Type} */
    if (simObj.type !== undefined) {
      this.type = simObj.type;
    } else {
      this.type = WaveformRow.Type.SIGNAL;
    }
    /** @type {string} */
    this.id = `wfr-${WaveformRow._idGenerator++}`;
    /** @type {SimulationObject} */
    this.simObj = null;
    if (this.type == WaveformRow.Type.SIGNAL) {
      this.simObj = simObj;
    }
    /** @type {string} */
    this.radixPrefix = "";
    /** @type {string} */
    this.radix = "hex";
    /** @type {WaveformRow.WaveStyle} */
    this.waveStyle = "";
    /** @type {number} */
    this.height = -1;
    /** @type {string} */
    if (simObj.name !== undefined) {
      this.name = simObj.name;
    } else {
      this.name = simObj.hierarchy.join(".");
      if (simObj.signal.width > 1) {
        this.name += `[${simObj.signal.width - 1}:0]`;
      }

      this.setRadix();

      if (this.type == WaveformRow.Type.GROUP) {
        this.waveStyle = WaveformRow.WaveStyle.BLANK;
      } else {
        if (simObj.signal.width == 1) {
          this.waveStyle = WaveformRow.WaveStyle.BIT;
        } else {
          this.waveStyle = WaveformRow.WaveStyle.BUS;
        }
      }
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
    if (this.type == WaveformRow.Type.GROUP) {
      return "";
    }
    return this.radixPrefix + this.simObj.getValueAt(time, this.radix, def);
  }

  /**
   * @param {number} i
   * @param {number} def
   */
  getValueAtI(i, def) {
    const ret = this.radixPrefix + this.simObj.getValueAtI(i, this.radix, def);
    return ret;
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
    if (this.type == WaveformRow.Type.GROUP) {
      this.radix = "group";
      this.radixPrefix = "group";
      return;
    }
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
    } else if ("float" === radix) {
      radix = "float";
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
