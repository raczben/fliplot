/**
 * Configuration class for setting and getting configuration values.
 * These are the default values, but these values will be updated by the
 * `defaults.json` file under the `public` directory.
 */
export class Config {
  /**
   * The default height of the row in the waveform view. Note, that analog signals has different row height.
   * @type {number}
   * */
  static rowHeight = 24;

  /**
   * The padding of the wave in the waveform view, so The "0" signal will be at `bitWavePadding` px
   * and the `1` at `rowHeight-bitWavePadding`
   * @type {number}
   * */
  static bitWavePadding = 5;

  /**
   * The height of the axis aka. the ruler at the bottom in the waveformview.
   * @type {number}
   * */
  static axisHeight = 25;

  /**
   * The zoomcompression:
   * If in the current zoom, in `zcmpPixels` px there is more than `zcmpChanges` value changes
   * in the wave the Signal's wave, it will be compressed to plot less data.
   * @type {number}
   * */
  static zcmpChanges = 6;
  /** @type {number} */
  static zcmpPixels = 6;

  static setValues(values) {
    // set all fileds in the values
    for (const [key, value] of Object.entries(values)) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    }
  }
}
