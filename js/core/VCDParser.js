export class VCDParser {
  /**
   * @param {Object} opts
   *   opts.vcdcontent: string (VCD file content as text)
   */
  constructor(opts = {}) {
    this.vcdcontent = opts.vcdcontent || '';
    this.data = null;
    if (this.vcdcontent) {
      this.data = this.parse(this.vcdcontent);
    }
  }

  /**
   * Parse the VCD content and return a structured object.
   * This is a minimal parser for signal hierarchy and value changes.
   * @param {string} vcdcontent
   * @returns {Object}
   */
  parse(vcdcontent) {
    const lines = vcdcontent.split(/\r?\n/);
    const signals = [];
    const idToSignal = {};
    let hierarchy = [];
    let currentTime = 0;
    let endtime = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('$scope')) {
        // Example: $scope module top $end
        const parts = line.split(/\s+/);
        hierarchy.push(parts[2]);
      } else if (line.startsWith('$upscope')) {
        hierarchy.pop();
      } else if (line.startsWith('$var')) {
        // Example: $var wire 1 ! clk $end
        const parts = line.split(/\s+/);
        const type = parts[1];
        const width = parseInt(parts[2]);
        const id = parts[3];
        const name = parts.slice(4, parts.length - 1).join(' ');
        const fullName = [...hierarchy, name].join('.');
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
        idToSignal[id] = signal;
      } else if (line.startsWith('#')) {
        // Time marker
        currentTime = parseInt(line.slice(1), 10);
        endtime = currentTime;
      } else if (/^[01xXzZ]/.test(line)) {
        // Scalar value change: e.g. 1!
        const value = line[0];
        const id = line.slice(1);
        if (idToSignal[id]) {
          idToSignal[id].wave.push({ time: currentTime, bin: value });
        }
      } else if (/^[brBR]/.test(line)) {
        // Vector value change: e.g. b1010 !
        const [_, value, id] = line.match(/^([brBR][01xXzZ]+)\s+(\S+)/) || [];
        if (idToSignal[id]) {
          idToSignal[id].wave.push({ time: currentTime, bin: value.slice(1) });
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