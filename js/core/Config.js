/**
 * Configuration class for setting and getting configuration values.
 * These are the default values, but these values will be updated by the 
 * `defaults.json` file under the `public` directory.
 */
export class Config {
  /**  @type {number} */
  static rowHeight = 24;
  static bitWavePadding = 5;
  static axisHeight = 20;

  static setValues(values) {
    // set all fileds in the values
    for (const [key, value] of Object.entries(values)) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    }
  }
}
