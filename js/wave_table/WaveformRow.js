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
    } else if (this.simObj.signal.sigType == "real") {
      wstyle = WaveformRow.WaveStyle.BUS;
    } else if (this.isBitSignal()) {
      wstyle = WaveformRow.WaveStyle.BIT;
    } else {
      wstyle = WaveformRow.WaveStyle.BUS;
    }

    this.yAxisRange = [0, 1];
    this.setWaveStyle(wstyle);
    this.setRadix();
  }

  /**
   *
   * @returns {boolean}
   */
  isBitSignal() {
    return this.simObj.signal.hasSubBits == false;
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

  /**
   *
   * @param {boolean} defalultAsNegative If the current row height is equals the default height, return -1
   *                            instead of the actual height. (This is useful for saving settings and faster drawing,
   *                            using the css defaults.)
   * @returns {number} the row height in pixels
   */
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
   *
   * @returns {[number]} the min max range of the y axis range.
   */
  getYAxisRange() {
    return this.yAxisRange;
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
    if (this.simObj.signal.sigType == "real") {
      this.radix = "float";
      this.radixPrefix = "";
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

  /**
   * This method set three things:
   *  - the wave style (obviously)
   *  - the row-height in the canvas,
   *  - and the Y-axis range.
   *
   * @param {WaveformRow.WaveStyle} wstyle The wave style to set
   * @returns
   */
  setWaveStyle(wstyle) {
    this.waveStyle = wstyle;
    // analog waves have more height
    if (wstyle == WaveformRow.WaveStyle.ANALOG) {
      // the radix must be compatible with analog (float, double, signed, unsigned)
      if (
        ["float", "double"].includes(this.radix) == false &&
        this.radix.startsWith("s") == false &&
        this.radix.startsWith("u") == false
      ) {
        // set to signed if incompatible
        this.setRadix("signed");
      }

      this.height = 60;
      // search for min and max values in the signal
      let minV = Number.POSITIVE_INFINITY;
      let maxV = Number.NEGATIVE_INFINITY;

      for (let wi of this.simObj.signal.waveIterator(
        0, // t0
        Infinity, // t1
        Infinity, // timeScale
        -1, // now
        false, //initialX
        this.radix
      )) {
        const v = wi.val;
        if (isNaN(v)) {
          continue;
        } else {
          if (v < minV) {
            minV = v;
          }
          if (v > maxV) {
            maxV = v;
          }
        }
      }
      this.yAxisRange = [minV, maxV];
    } else {
      // if the wavestyle is not analog
      this.yAxisRange = [0, 1];
      this.height = -1;
    }
  }
}
