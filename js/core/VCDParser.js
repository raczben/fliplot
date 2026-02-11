export class VCDParser {
  /**
   * @param {Object} opts
   *   opts.vcdcontent: string (VCD file content as text)
   */
  constructor(opts = {}) {
    this.vcdcontent = opts.vcdcontent || "";
    this.data = null;
    if (this.vcdcontent) {
      this.parse(this.vcdcontent);
    }
  }

  /**
   *
   * @param {string} bin
   * @param {number} width
   * @returns {string}
   */
  _padBin(bin, width) {
    bin = bin.toLocaleLowerCase();
    // if starts with b or B, remove it before padding:
    if (/^[b]/.test(bin)) {
      bin = bin.slice(1);
    }
    // https://0x04.net/~mwk/vstd/ieee-1364-2001.pdf
    // Automatic left padding (page 9)
    // pad the left character:
    const firstch = bin.substring(0, 1).toLowerCase();
    if (firstch == "x" || firstch == "z") {
      return bin.padStart(width, firstch);
    }
    return bin.padStart(width, "0");
  }

  /**
   *
   * Convert hex string to binary string, e.g. "1A3F" -> "0001101000111111"
   * If the hex string contains non-hex characters (e.g. "x", "z"), repeat them into 4 bits, e.g. "xz" -> "xxxxzzzz"
   *
   * @param {string} hex
   * @returns {string}
   */
  _hexToBin(hex) {
    bin = hex
      .split("")
      .map((hexDigit) => {
        if (!/[0-9a-fA-F]/.test(hexDigit)) {
          // repeat all hex digits into 4 bits binary:
          return hexDigit.repeat(4);
        } else {
          return parseInt(hexDigit, 16).toString(2).padStart(4, "0");
        }
      })
      .join("");
    return bin;
  }

  /**
   *
   * @typedef {Object} VarType
   * @property {string} type
   * @property {number} width
   * @property {string} id
   * @property {string} name
   * @property {string} dimension
   *
   * @param {string} line
   * @returns {VarType}
   */
  _parseVAR(line) {
    line = line.trim();
    if (!line.startsWith("$var")) {
      throw new Error(`Expected $var line, got: ${line}`);
    }
    // Example: $var wire 1 ! clk $end
    // or: $var wire 8 # data[7:0] $end
    const parts = line.split(/\s+/);
    const type = parts[1];
    const width = parseInt(parts[2]);
    const id = parts[3];
    let name = parts[4];
    let dimension = null;

    // trunk dimension from name:
    if (name.includes("[")) {
      const nameParts = name.split("[");
      name = nameParts[0];
      dimension = "[" + nameParts[1];
    } else if (parts.length > 5) {
      dimension = parts[5];
    }

    return {
      type,
      width,
      id,
      name,
      dimension
    };
  }

  /**
   * Parse the VCD content and return a structured object.
   * This is a minimal parser for signal hierarchy and value changes.
   * @param {string} vcdcontent
   * @param {boolean} [duplicate_repeted_values=false]
   * @returns {Object}
   */
  parse(vcdcontent, duplicate_repeted_values = false) {
    const lines = vcdcontent.split(/\r?\n/);
    const variables = [];
    const signals = {};
    let hierarchy = [];
    let currentTime = 0;
    let endtime = 0;
    let state = "";

    for (const [ln, rawLine] of lines.entries()) {
      try {
        let line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith("$")) {
          // Directive line, e.g. $scope, $var, $upscope, etc.
          // We will handle $scope, $upscope, and $var for this minimal parser.
          if (line === "$end") {
            if (["comment", "timescale", "date", "version", "dumpvars"].includes(state)) {
              state = "";
            } else {
              console.warn(`Warning: Unmatched $end at line ${ln + 1}: ${rawLine}`);
            }
            continue;
          } else if (line.startsWith("$comment")) {
            if (line.includes("$end")) {
              continue; // Handle single-line comment
            }
            state = "comment";
            continue;
          } else if (line.startsWith("$timescale")) {
            if (line.includes("$end")) {
              continue; // Handle single-line timescale
            }
            state = "timescale";
            continue;
          } else if (line.startsWith("$date")) {
            if (line.includes("$end")) {
              continue; // Handle single-line date
            }
            state = "date";
            continue;
          } else if (line.startsWith("$version")) {
            if (line.includes("$end")) {
              continue; // Handle single-line version
            }
            state = "version";
            continue;
          } else if (line.startsWith("$dumpvars")) {
            if (line.includes("$end")) {
              continue; // Handle single-line version
            }
            state = "dumpvars";
            continue;
          } else if (line.startsWith("$enddefinitions")) {
            if (state) {
              console.warn(
                `Warning: state: ${state} Unmatched $enddefinitions at line ${ln + 1}: ${rawLine}`
              );
            }
            state = "";
            continue;
          } else if (line.startsWith("$scope")) {
            // Example: $scope module top $end
            const parts = line.split(/\s+/);
            hierarchy.push(parts[2]);
          } else if (line.startsWith("$upscope")) {
            hierarchy.pop();
          } else if (line.startsWith("$var")) {
            // Example: $var wire 1 ! clk $end
            const { type, width, id, name, _dimension } = this._parseVAR(line);

            const fullName = [...hierarchy, name].join(".");

            console.log(hierarchy);
            const variable = {
              vcdid: id,
              name: name,
              hierarchy: hierarchy.slice(0),
              type,
              width
            };
            variables.push(variable);
            if (signals[id]) {
              signals[id].references.push(hierarchy.slice(0) + name);
              if (type != signals[id].type || width != signals[id].width) {
                console.warn(
                  `Warning: Inconsistent signal type/width for id "${id}" ln: ${ln + 1}: ${rawLine}`
                );
              }
            } else {
              signals[id] = {
                vcdid: id,
                references: [hierarchy.slice(0).concat(name)],
                wave: [],
                type: type,
                width: width
              };
            }
          } else {
            console.warn(`Warning: Unrecognized directive at line ${ln + 1}: ${rawLine}`);
          }
        } else if (["comment", "timescale", "date", "version"].includes(state)) {
          continue;
        } else if (line.startsWith("#")) {
          // Time marker example: #10
          currentTime = parseInt(line.slice(1), 10);
          endtime = currentTime;
        } else {
          // Value change line, e.g. 1! or b1010 !
          var value, id, _full;
          if (/^[01xXzZuU]/.test(line)) {
            // Scalar value change: e.g. 1!
            value = line[0];
            id = line.slice(1);
          } else if (/^[bBrRsShH]/.test(line)) {
            const formatChar = Array.from(line)[0].toLowerCase();
            line = line.slice(1);
            if (formatChar == "r") {
              // real value change: e.g. r3.14 !
              [_full, value, id] = line.match(/^([\d.eE+-]+)\s+(\S+)/) || [];
              value = parseFloat(value);
              if (value == 0) {
                value = 0.0; // to avoid -0
              }
            } else if (formatChar == "b") {
              // Vector value change: e.g. b1010 !
              [_full, value, id] = line.match(/^([01xXzZuU-]+)\s+(\S+)/) || [];
            } else if (formatChar == "h") {
              // Hex value change: e.g. h12345678 !
              [_full, value, id] = line.match(/^([\w]+)\s+(\S+)/) || [];
              value = _hexToBin(value); // convert hex to binary string
              formatChar = "b"; // treat as binary for padding
            } else if (formatChar == "s") {
              // String value change: e.g. s"hello" ! MyHDL uses s for string values
              [_full, value, id] = line.match(/^([^\s]+)\s+(\S+)/) || [];
            } else {
              console.error(
                `ERROR: Unrecognized format character "${formatChar}" at line ${ln + 1}: ${rawLine}`
              );
            }
          } else {
            console.warn(`Warning: Unrecognized line format at line ${ln + 1}: ${rawLine}`);
            continue;
          }

          // Store the value change in the corresponding signal's wave array
          if (signals[id]) {
            let bin;
            const signal = signals[id];
            if (typeof value === "string") {
              bin = this._padBin(value, signal.width);
            } else {
              bin = value;
            }
            const lastEntry = signal.wave[signal.wave.length - 1];
            if (!duplicate_repeted_values) {
              if (lastEntry && lastEntry.bin === bin) {
                continue; // Skip duplicate value
              }
            }
            signal.wave.push({ time: currentTime, bin: bin });
          } else {
            console.warn(
              `Warning: No signal found for id "${id}" at time ${currentTime} (line ${ln + 1})`
            );
            console.warn(`Warning: line: ${rawLine} )`);
          }
        }
      } catch (err) {
        console.error(`Error parsing line ${ln + 1}: ${rawLine}`);
        console.error(err);
        throw err;
      }
    }

    this.data = {
      signals,
      variables,
      now: endtime,
      name: "dduummyy",
      type: "struct"
    };
    return this.data;
  }

  /**
   * Get the parsed VCD data.
   * @returns {Object}
   */
  getData() {
    return this.data;
  }
}
