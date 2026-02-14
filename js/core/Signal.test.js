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

  let signal;
  beforeEach(() => {
    signal = new Signal(bitSigObj);
    bus = new Signal(busSigObj);
  });

  test("getChangeIndexAt returns correct index", () => {
    expect(signal.getChangeIndexAt(0)).toBe(0);
    expect(signal.getChangeIndexAt(5)).toBe(0);
    expect(signal.getChangeIndexAt(10)).toBe(1);
    expect(signal.getChangeIndexAt(15)).toBe(1);
    expect(signal.getChangeIndexAt(20)).toBe(2);
    expect(signal.getChangeIndexAt(25)).toBe(2);

    expect(bus.getChangeIndexAt(0)).toBe(-1);
  });

  test("getValueAtI returns correct value", () => {
    expect(signal.getValueAtI(0, "bin")).toBe("0");
    expect(signal.getValueAtI(1, "bin")).toBe("1");
    expect(signal.getValueAtI(2, "bin")).toBe("x");
    expect(signal.getValueAtI(3, "bin")).toBe("z");
    expect(signal.getValueAtI(3, "bin")).toBe("z");
  });

  test("getValueAtI for bus values", () => {
    expect(bus.getValueAtI(0, "hex")).toBe("0000");
    expect(bus.getValueAtI(1, "hex")).toBe("0001");
    expect(bus.getValueAtI(2, "hex")).toBe("0002");
    expect(bus.getValueAtI(3, "hex")).toBe("0003");
    expect(bus.getValueAtI(4, "hex")).toBe("000b");
    expect(bus.getValueAtI(5, "hex")).toBe("5555");
    expect(bus.getValueAtI(6, "hex")).toBe("aaaa");
    expect(bus.getValueAtI(7, "hex")).toBe("cccc");
    expect(bus.getValueAtI(8, "hex")).toBe("ffff");
  });

  test("getValueAt returns correct value for time", () => {
    expect(signal.getValueAt(0, "bin")).toBe("0");
    expect(signal.getValueAt(10, "bin")).toBe("1");
    expect(signal.getValueAt(15, "bin")).toBe("1");
    expect(signal.getValueAt(25, "bin")).toBe("x");
  });

  test("getTimeAtI returns correct time", () => {
    expect(signal.getTimeAtI(0, now)).toBe(0);
    expect(signal.getTimeAtI(1, now)).toBe(10);
    expect(signal.getTimeAtI(2, now)).toBe(20);
    expect(signal.getTimeAtI(3, now)).toBe(30);
    expect(signal.getTimeAtI(4, now)).toBe(now); // simDB.now
  });

  test("getTimeAtI strange args", () => {
    expect(() => signal.getTimeAtI(-1, now)).toThrow("Negative index");
    expect(() => signal.getTimeAtI(5, now)).toThrow("Index is too great");
    expect(signal.getValueAtI(-1, "bin", "default")).toBe("default");
  });

  test("cloneRange returns a new Signal with correct width", () => {
    const clone1 = bus.cloneRange(0);
    expect(clone1).toBeInstanceOf(Signal);
    expect(clone1.width).toBe(1);
    expect(clone1.getValueAt(10, "bin")).toBe("- NA -");
    expect(clone1.getValueAt(1000, "bin")).toBe("0");
    expect(clone1.getValueAt(1015, "bin")).toBe("1");
    expect(clone1.getValueAt(1025, "bin")).toBe("0");
    expect(clone1.getValueAt(1035, "bin")).toBe("1");

    const clone2 = bus.cloneRange(15, 8);
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
    expect(() => signal.cloneRange(1, 2)).toThrow(
      "Cannot clone range [1:2] of signal sig with width 1"
    );
  });
});
