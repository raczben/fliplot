import { binarySearch, bin2radix } from "./util.js";

/**
 * The value change type composes the wave list of the signal. Each element describes a value change in
 * a signal.
 *
 * @typedef {Object} valueChange_t
 * @property {number} time Simulation time, in the unit defined by simulation timePrecision.
 * @property {string} bin The raw value in binary form. Each character represents a bit in the
 *      bit vector. All other (optional) value formats are derived from this.
 * @property {string} [hex] A value derived from the raw bin. Optional: calculated only when the user
 *      wants to see hex values. Each hex digit will be X or Z if there is an X or Z bit value in
 *      its region.
 * @property {number} [u30] Fixed-point floating-point number. The first character (s/u) denotes signed or unsigned
 *      format. The number indicates how many bits represent the fractional value (the number of bits below the
 *      decimal point). For example, u0 means that the whole bit vector represents a fixed-point
 *      unsigned integer. Note that the full word length is defined at the signal level. This is derived,
 *      and optional as above. If any X or Z is present in the raw binary format, this value
 *      will be NaN.
 * @property {number} [float] Single-precision floating-point number. Derived and optional as above.
 * @property {number} [double] Double-precision floating-point number. Derived and optional as above.
 */

export class Signal {
  constructor(sig) {
    /** @type {string[]} */
    this.references = sig.references;
    /** @type {string} */
    this.vcdid = sig.vcdid;

    /** @type {string} */
    this.type = sig.type;
    /** @type {valueChange_t[]} */
    this.wave = sig.wave;
    /** @type {number} */
    this.width = sig.width;
  }

  /**
   * Clones a range of bits of a bus signal and returns a new Signal object representing that bit-range.
   *
   * @param {number} from The starting bit index (inclusive).
   * @param {number} to The ending bit index (inclusive). Defaults to 'from' if not specified.
   * @returns {Signal} A new Signal object representing the specified bit range.
   */
  cloneRange(from, to = -1) {
    if (to < 0) {
      to = from;
    }
    if (from < to) {
      // Big endian
      console.warn("Big endian has not been tested...");
    }
    const nOfBits = Math.abs(from - to) + 1;
    if (nOfBits > this.width) {
      throw `Cannot clone range [${from}:${to}] of signal ${this.references[0]} with width ${this.width}`;
    }
    const retType = nOfBits == 1 ? "bit" : "bus";
    const ret = new Signal({
      references: this.references.concat([`[${from}:${to}]`]),
      vcdid: `${this.vcdid}-cloned[${from}:${to}]`,
      type: retType,
      wave: [],
      width: nOfBits
    });
    // Little endian conversion:
    const fromLE = this.width - 1 - from;
    const toLE = this.width - 1 - to;
    var retWi;
    let retWiPrev = { time: -1, bin: "" };
    this.wave.forEach((wi) => {
      retWi = { time: wi.time, bin: wi.bin.substring(fromLE, toLE + 1) };
      if (retWi.bin != retWiPrev.bin) {
        // instert the new value only if it is different from the previous one
        ret.wave.push(retWi);
      }
      retWiPrev = retWi;
    });
    // ret.width = to-from+1;
    return ret;
  }

  /**
   *
   * @return {number} The width of the signal in bits.
   */
  getWidth() {
    return this.width;
  }

  getLenght() {
    return this.wave.length;
  }

  /**
   * Iterator for the signal's wave.
   *
   * @param {number} t0 - Start of the time range
   * @param {number} t1 - End of the time range
   * @param {number} timeScale - The time scale to use for the wave.
   * @param {number} now - Iterator adds phantom values at the end of the iteration till the current simulation time.
   * @param {boolean} initialX - If true first phantom 'x' value will be added at the beginning of the wave.
   * @returns {IterableIterator<valueChange_t>} An iterator over the signal's wave.
   */
  *waveIterator(t0 = 0, t1 = Infinity, timeScale = Infinity, now = -1, initialX = false) {
    this.zcmpChanges = 8;
    this.zcmpPixels = 8;

    // Search segments to be compress at `timeScale`
    const compressionInterval = this.zcmpPixels / timeScale;

    // Find indices in wave that are within the visible time range
    // getChangeIndexAt returns -1 if the time is before the first change.
    // in this case we start plot at the first change.
    const startIdx = Math.max(0, this.getChangeIndexAt(t0));
    const endIdx = Math.min(this.getLenght(), this.getChangeIndexAt(t1) + 1);

    const waveArr = this.wave;
    if (initialX) {
      if (waveArr.length == 0 || t0 < waveArr[startIdx].time) {
        // If the first value is not at time zero, prepend a phantom value at time zero.
        yield { time: 0, bin: "x".repeat(this.width), index: -1 };
      }
    }
    for (let i = startIdx; i < endIdx; i++) {
      const wi = waveArr[i];

      // zoom compression
      const zcmpIdx = this.getChangeIndexAt(compressionInterval + wi.time);
      if (zcmpIdx > i + this.zcmpChanges) {
        // do the compression
        const y = { time: waveArr[i].time, index: i, bin: "/zcmp-123" };
        i = zcmpIdx - 1; // skip the following wave items. step the index
        yield y;
      } else {
        // return a simple copy of the wave item
        const y = { time: waveArr[i].time, index: i, bin: waveArr[i].bin };
        yield y;
      }
    }
    if (now >= 0) {
      // if the user request to add the current (phantom) value.
      if (waveArr.length >= endIdx || t1 > waveArr[endIdx - 1].time) {
        // if the requested time is over the last value change, add a phantom value at the end
        // (the values started by '/' charater are internal simbols)
        yield { time: now, bin: "/phantom-now", index: endIdx };
      }
    }
  }

  /**
   * Returns the index of the last value change before the given time.
   * @param {number} time
   * @return {number} The index of the last value change before the given time.
   * If the time is before the first change, returns -1.
   */
  getChangeIndexAt(time) {
    var idx = binarySearch(this.wave, time, (time, wave) => {
      return time - wave.time;
    });
    // Binary search returns the exact index if time is found,
    // and a negative value if not found.
    // Calculate complement: (we need the index of the previous value change)
    if (idx < 0) {
      idx = -idx - 2;
    }
    // If idx is -1, it means that the time is before the first change.
    return idx;
  }
  /**
   * Returns the value at the specified time in the given radix.
   * @param {number} time
   * @param {string} radix
   * @param {any} def The default value to return if the index is negative.
   */
  getValueAt(time, radix, def = "- NA -") {
    const idx = this.getChangeIndexAt(time);
    return this.getValueAtI(idx, radix, def);
  }

  /**
   * Returns the value at the specified index in the given radix.
   * @param {number} i
   * @param {string} radix
   * @param {any} def The default value to return if the index is negative.
   */
  getValueAtI(i, radix = "bin", def) {
    if (i < 0) {
      if (def !== undefined) {
        return def;
      }
      throw "Negative index";
    }
    if (i >= this.wave.length) {
      if (def !== undefined) {
        return def;
      }
      throw "idx is too great";
    }

    if (this.wave[i][radix] === undefined) {
      this.wave[i][radix] = bin2radix(this.wave[i].bin, radix);
    }
    return this.wave[i][radix];
  }

  /**
   * Returns the time at the specified index.
   * @param {number} i
   * @param {number} now The current time, used if i equals the wave length.
   */
  getTimeAtI(i, now = -1) {
    if (i < 0) {
      throw "Negative index";
    }
    if (i < this.wave.length) {
      return this.wave[i].time;
    }
    if (i == this.wave.length) {
      return now;
    } else {
      throw "Index is too great";
    }
  }
}
