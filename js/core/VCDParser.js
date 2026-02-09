export class VCDParser {
  /**
   * @param {Object} opts
   *   opts.vcdcontent: string (VCD file content as text)
   */
  constructor(opts = {}) {
    this.vcdcontent = opts.vcdcontent || "";
    this.data = null;
    if (this.vcdcontent) {
      this.data = this.parse(this.vcdcontent);
    }
  }

  _padBin(bin, width) {
    // if starts with b or B, remove it before padding:
    if (/^[bB]/.test(bin)) {
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
   * @returns {Object}
   */
  parse(vcdcontent, duplicate_repeted_values = false) {
    const lines = vcdcontent.split(/\r?\n/);
    const signals = [];
    const idToSignal = {};
    let hierarchy = [];
    let currentTime = 0;
    let endtime = 0;
    let state = "";

    for (const [ln, rawLine] of lines.entries()) {
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
          const signal = {
            vcdid: id,
            name: name,
            references: [fullName], // TUDO: should be parsed the references field...
            type,
            width,
            hierarchy: hierarchy.slice(0),
            wave: []
          };
          signals.push(signal);
          if (idToSignal[id]) {
            idToSignal[id].push(signal);
          } else {
            idToSignal[id] = [signal];
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
        var value, id, _x;
        if (/^[01xXzZuU]/.test(line)) {
          // Scalar value change: e.g. 1!
          value = line[0];
          id = line.slice(1);
        } else if (/^[brBR]/.test(line)) {
          // Vector value change: e.g. b1010 !
          [_x, value, id] = line.match(/^([brBR][01xXzZuU]+)\s+(\S+)/) || [];
        } else {
          console.warn(`Warning: Unrecognized line format at line ${ln + 1}: ${rawLine}`);
          continue;
        }

        value = value.toLocaleLowerCase();
        // Store the value change in the corresponding signal's wave array
        if (idToSignal[id]) {
          for (const signal of idToSignal[id]) {
            const bin = this._padBin(value, signal.width);
            if (!duplicate_repeted_values) {
              const lastEntry = signal.wave[signal.wave.length - 1];
              if (lastEntry && lastEntry.bin === bin) {
                continue; // Skip duplicate value
              }
            }
            signal.wave.push({ time: currentTime, bin: bin.toUpperCase() });
          }
        } else {
          console.warn(
            `Warning: No signal found for id "${id}" at time ${currentTime} (line ${ln + 1})`
          );
          console.warn(`Warning: line: ${rawLine} )`);
        }
      }
      // Ignore other lines for this minimal parser
    }

    return {
      signals,
      now: endtime,
      name: "dduummyy",
      type: "struct"
    };
  }

  /**
   * Get the parsed VCD data.
   * @returns {Object}
   */
  getData() {
    return this.data;
  }
}
