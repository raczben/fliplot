import { Config } from "../core/Config.js";
import { SimulationObject } from "../core/SimulationObject.js";
import { Node } from "../core/tree.js";

export class WaveformRow extends Node {
  /**  @type {number} */
  static _idGenerator = 0;

  static WaveStyle = Object.freeze({
    BIT: "bit",
    BUS: "bus",
    ANALOG: "analog",
    BLANK: "blank"
  });

  static WFRType = Object.freeze({
    SIGNAL: "signal",
    GROUP: "group"
  });

  /**
   *
   * @param {SimulationObject} simObj
   * @param {WaveformRow} parent
   * @param {Array} children
   * @param {boolean} opened
   */
  constructor(simObj, parent, pos = -1, children = [], opened = false) {
    const id = `wfr-${WaveformRow._idGenerator++}`;
    super(id, parent, pos, children, opened);

    /** @type {WaveformRow.Type} */
    if (simObj.soType !== undefined) {
      this.wfrType = simObj.soType;
    } else {
      this.wfrType = WaveformRow.WFRType.SIGNAL;
    }
    /** @type {SimulationObject} */
    this.simObj = null;
    if (this.wfrType == WaveformRow.WFRType.SIGNAL) {
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
      if (this.isBitSignal() == false) {
        this.name += `[${simObj.signal.width - 1}:0]`;
      }
    }

    let wstyle = "";
    if (this.wfrType == WaveformRow.WFRType.GROUP) {
      wstyle = WaveformRow.WaveStyle.BLANK;
    } else {
      if (this.isBitSignal()) {
        wstyle = WaveformRow.WaveStyle.BIT;
      } else {
        wstyle = WaveformRow.WaveStyle.BUS;
      }
    }
    this.setWaveStyle(wstyle);
    this.setRadix();
  }

  /**
   *
   * @returns {boolean}
   */
  isBitSignal() {
    return this.wfrType == WaveformRow.WFRType.SIGNAL && this.simObj.signal.width == 1;
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
    if (this.wfrType == WaveformRow.WFRType.GROUP) {
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

  getHeight(defalultAsNegative = false) {
    if (defalultAsNegative) {
      // if we want default as negative, just return the height
      return this.height;
    }
    if (this.height < 0) {
      return Config.rowHeight;
    }
    return this.height;
  }

  /**
   * @param {String} radix
   */
  setRadix(radix, prefix) {
    if (this.wfrType == WaveformRow.WFRType.GROUP) {
      this.radix = "group";
      this.radixPrefix = "group";
      return;
    }
    if (this.isBitSignal()) {
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

  setWaveStyle(wstyle) {
    this.waveStyle = wstyle;
    // analog waves have more height
    if (wstyle == WaveformRow.WaveStyle.ANALOG) {
      this.height = 60;
      return;
    } else {
      this.height = -1;
    }
  }
}
