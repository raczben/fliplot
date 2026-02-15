const { Signal } = require("./Signal.js");

// Mocking the global simDB object
const now = 1234.5678;

describe("Signal", () => {
  const bit_wave = [
    { time: 0, bin: "0" },
    { time: 10, bin: "1" },
    { time: 20, bin: "x" },
    { time: 30, bin: "z" }
  ];

  const bus_wave = [
    { time: 1000, bin: "0000000000000000" },
    { time: 1010, bin: "0000000000000001" },
    { time: 1020, bin: "0000000000000010" },
    { time: 1030, bin: "0000000000000011" },
    { time: 1100, bin: "0000000000001011" },
    { time: 1200, bin: "0101010101010101" },
    { time: 1300, bin: "1010101010101010" },
    { time: 1400, bin: "1100110011001100" },
    { time: 1500, bin: "1111111111111111" }
  ];

  const bitSigObj = {
    references: ["sig"],
    vcdid: "v1",
    type: "wire",
    wave: bit_wave,
    width: 1,
    value_type: "bin"
  };
  const busSigObj = {
    references: ["bus"],
    vcdid: "b",
    type: "wire",
    wave: bus_wave,
    width: 16,
    value_type: "bin"
  };

  /** @type {Signal} */
  let bitSignal;
  /** @type {Signal} */
  let busSignal;
  beforeEach(() => {
    bitSignal = new Signal(bitSigObj);
    busSignal = new Signal(busSigObj);
  });

  test("getChangeIndexAt returns correct index", () => {
    expect(bitSignal.getChangeIndexAt(0)).toBe(0);
    expect(bitSignal.getChangeIndexAt(5)).toBe(0);
    expect(bitSignal.getChangeIndexAt(10)).toBe(1);
    expect(bitSignal.getChangeIndexAt(15)).toBe(1);
    expect(bitSignal.getChangeIndexAt(20)).toBe(2);
    expect(bitSignal.getChangeIndexAt(25)).toBe(2);

    expect(busSignal.getChangeIndexAt(0)).toBe(-1);
  });

  test("getValueAtI returns correct value", () => {
    expect(bitSignal.getValueAtI(0, "bin")).toBe("0");
    expect(bitSignal.getValueAtI(1, "bin")).toBe("1");
    expect(bitSignal.getValueAtI(2, "bin")).toBe("x");
    expect(bitSignal.getValueAtI(3, "bin")).toBe("z");
    expect(bitSignal.getValueAtI(3, "bin")).toBe("z");
  });

  test("getValueAtI for bus values", () => {
    expect(busSignal.getValueAtI(0, "hex")).toBe("0000");
    expect(busSignal.getValueAtI(1, "hex")).toBe("0001");
    expect(busSignal.getValueAtI(2, "hex")).toBe("0002");
    expect(busSignal.getValueAtI(3, "hex")).toBe("0003");
    expect(busSignal.getValueAtI(4, "hex")).toBe("000b");
    expect(busSignal.getValueAtI(5, "hex")).toBe("5555");
    expect(busSignal.getValueAtI(6, "hex")).toBe("aaaa");
    expect(busSignal.getValueAtI(7, "hex")).toBe("cccc");
    expect(busSignal.getValueAtI(8, "hex")).toBe("ffff");
  });

  test("getValueAt returns correct value for time", () => {
    expect(bitSignal.getValueAt(0, "bin")).toBe("0");
    expect(bitSignal.getValueAt(10, "bin")).toBe("1");
    expect(bitSignal.getValueAt(15, "bin")).toBe("1");
    expect(bitSignal.getValueAt(25, "bin")).toBe("x");
  });

  test("getTimeAtI returns correct time", () => {
    expect(bitSignal.getTimeAtI(0, now)).toBe(0);
    expect(bitSignal.getTimeAtI(1, now)).toBe(10);
    expect(bitSignal.getTimeAtI(2, now)).toBe(20);
    expect(bitSignal.getTimeAtI(3, now)).toBe(30);
    expect(bitSignal.getTimeAtI(4, now)).toBe(now); // simDB.now
  });

  test("getTimeAtI strange args", () => {
    expect(() => bitSignal.getTimeAtI(-1, now)).toThrow("Negative index");
    expect(() => bitSignal.getTimeAtI(5, now)).toThrow("Index is too great");
    expect(bitSignal.getValueAtI(-1, "bin", "default")).toBe("default");
  });

  test("Wave iterator simple", () => {
    const now = 3000;
    for (wi of bitSignal.waveIterator(0, 1500, Infinity, now, false, "bin")) {
      if (bit_wave[wi.index]) {
        expect(wi.time).toBe(bit_wave[wi.index].time);
        expect(wi.val).toBe(bit_wave[wi.index].bin);
      } else {
        expect(wi.time).toBe(now);
        expect(wi.val).toBe(bit_wave[wi.index - 1].bin);
      }
    }
  });

  test("Wave iterator bus", () => {
    const now = 3000;
    for (wi of busSignal.waveIterator(0, 1500, Infinity, now, false, "bin")) {
      if (bus_wave[wi.index]) {
        expect(wi.time).toBe(bus_wave[wi.index].time);
        expect(wi.val).toBe(bus_wave[wi.index].bin);
      } else {
        expect(wi.time).toBe(now);
        expect(wi.val).toBe(bus_wave[wi.index - 1].bin);
      }
    }
  });

  test("Wave iterator bus zcmp", () => {
    const now = 3000;
    const scale = 6 / 420;

    const result = [
      {
        time: 1000,
        index: 0,
        val: "0",
        minval: 0,
        maxval: 43690,
        mintime: 1000,
        maxtime: 1300,
        wiType: Signal.WITYPE.ZOOM_COMPRESSION
      },
      {
        index: 7,
        time: 1400,
        val: 52428,
        wiType: Signal.WITYPE.NATIVE
      },
      {
        index: 8,
        time: 1500,
        val: 65535,
        wiType: Signal.WITYPE.NATIVE
      },
      {
        index: 9,
        time: now,
        val: 65535,
        wiType: Signal.WITYPE.PHANTOM_NOW
      }
    ];

    let i = 0;
    for (wi of busSignal.waveIterator(0, 1500, scale, now, false, "u0")) {
      expect(wi).toMatchObject(result[i]);
      i = i + 1;
    }
  });
  test("Wave iterator bus radix", () => {
    const now = 3000;

    const bus_wave_hex = [
      { time: 1000, bin: "0000" },
      { time: 1010, bin: "0001" },
      { time: 1020, bin: "0002" },
      { time: 1030, bin: "0003" },
      { time: 1100, bin: "000b" },
      { time: 1200, bin: "5555" },
      { time: 1300, bin: "aaaa" },
      { time: 1400, bin: "cccc" },
      { time: 1500, bin: "ffff" }
    ];

    for (wi of busSignal.waveIterator(0, 1500, Infinity, now, false, "hex")) {
      if (bus_wave_hex[wi.index]) {
        expect(wi.time).toBe(bus_wave_hex[wi.index].time);
        expect(wi.val).toBe(bus_wave_hex[wi.index].bin);
      } else {
        expect(wi.time).toBe(now);
        expect(wi.val).toBe(bus_wave_hex[wi.index - 1].bin);
      }
    }
  });

  test("cloneRange returns a new Signal with correct width", () => {
    const clone1 = busSignal.cloneRange(0);
    expect(clone1).toBeInstanceOf(Signal);
    expect(clone1.width).toBe(1);
    expect(clone1.getValueAt(10, "bin")).toBe("- NA -");
    expect(clone1.getValueAt(1000, "bin")).toBe("0");
    expect(clone1.getValueAt(1015, "bin")).toBe("1");
    expect(clone1.getValueAt(1025, "bin")).toBe("0");
    expect(clone1.getValueAt(1035, "bin")).toBe("1");

    const clone2 = busSignal.cloneRange(15, 8);
    expect(clone2.width).toBe(8);
    expect(clone2.getValueAt(10, "bin")).toBe("- NA -");
    expect(clone2.getValueAt(1000, "bin")).toBe("00000000");
    expect(clone2.getValueAt(1015, "bin")).toBe("00000000");
    expect(clone2.getValueAt(1025, "bin")).toBe("00000000");
    expect(clone2.getValueAt(1035, "bin")).toBe("00000000");
    expect(clone2.getValueAt(1100, "bin")).toBe("00000000");
    expect(clone2.getValueAt(1200, "bin")).toBe("01010101");
    expect(clone2.getValueAt(1300, "bin")).toBe("10101010");
    expect(clone2.getValueAt(1400, "bin")).toBe("11001100");
    expect(clone2.getValueAt(1500, "bin")).toBe("11111111");

    // Invalid args:
    expect(() => bitSignal.cloneRange(1, 2)).toThrow(
      "Cannot clone range [1:2] of signal sig with width 1"
    );
  });
});
