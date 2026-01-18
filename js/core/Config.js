// TODO should be moved somewhere else.
export class Config {
  /**  @type {number} */
  static rowHeight = 24;

  static setValues(values) {
    // set all fileds in the values
    for (const [key, value] of Object.entries(values)) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    }
  }
}
