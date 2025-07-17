const { SimulationObject } = require("./SimulationObject.js");
const { Signal } = require("./Signal.js");

describe("SimulationObject", () => {
  const bit_wave = [
    { time: 0, bin: "0" },
    { time: 10, bin: "1" },
    { time: 20, bin: "x" },
    { time: 30, bin: "z" },
    { time: 40, bin: "0" },
    { time: 50, bin: "1" },
    { time: 60, bin: "0" },
    { time: 70, bin: "1" },
    { time: 80, bin: "0" },
    { time: 90, bin: "1" }
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
  const bitSignal = {
    references: ["sig"],
    vcdid: "v1",
    type: "wire",
    wave: bit_wave,
    width: 1
  };
  const busSignal = {
    references: ["databus"],
    vcdid: "b",
    type: "wire",
    wave: bus_wave,
    width: 16
  };

  let bitSimObj, busSimObj;
  beforeEach(() => {
    bitSimObj = new SimulationObject(SimulationObject.Type.SIGNAL, ["top", "sig"], bitSignal, null);
  });

  beforeEach(() => {
    busSimObj = new SimulationObject(
      SimulationObject.Type.SIGNAL,
      ["top", "databus"],
      busSignal,
      null
    );
  });

  test("constructor initializes properties", () => {
    expect(bitSimObj.type).toBe(SimulationObject.Type.SIGNAL);
    expect(bitSimObj.hierarchy).toEqual(["top", "sig"]);
    expect(bitSimObj.signal).toBeInstanceOf(Signal);
    expect(bitSimObj.parent).toBeNull();
    expect(bitSimObj.definedAt).toBeUndefined(); // sigObj has no definedAt
  });

  test("getChangeIndexAt delegates to signal", () => {
    expect(bitSimObj.getChangeIndexAt(0)).toBe(0);
    expect(bitSimObj.getChangeIndexAt(15)).toBe(1);
  });

  test("getValueAt(I) delegates to signal", () => {
    expect(bitSimObj.getValueAt(0, "bin")).toBe("0");
    expect(bitSimObj.getValueAt(10, "bin")).toBe("1");
    expect(bitSimObj.getValueAtI(2, "bin")).toBe("x");
  });

  test("getTimeAtI delegates to signal", () => {
    global.simDB = { now: 1000 };
    expect(bitSimObj.getTimeAtI(0)).toBe(0);
    expect(bitSimObj.getTimeAtI(2)).toBe(20);
  });

  test("cloneRange creates a new SimulationObject with correct hierarchy and signal", () => {
    const clone1 = busSimObj.cloneRange(0);
    expect(clone1).toBeInstanceOf(SimulationObject);
    expect(clone1.hierarchy).toEqual(["top", "databus", "[0]"]);
    expect(clone1.signal).toBeInstanceOf(Signal);
    expect(clone1.parent).toBe(busSimObj);

    expect(clone1.getValueAt(10, "bin")).toBe("- NA -");
    expect(clone1.getValueAt(1000, "bin")).toBe("0");
    expect(clone1.getValueAt(1015, "bin")).toBe("1");
    expect(clone1.getValueAt(1025, "bin")).toBe("0");
    expect(clone1.getValueAt(1035, "bin")).toBe("1");

    const clone2 = busSimObj.cloneRange(15, 8);
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

    // invalid inputs
    expect(() => bitSimObj.cloneRange(1, 3)).toThrow(
      "Cannot clone range [1:3] of signal top.sig with width 1"
    );
  });

  test("isTransition", () => {
    frising = (vprev, vcurr) => {
      return vprev < vcurr; // rising edge
    };
    ffalling = (vprev, vcurr) => {
      return vprev > vcurr; // rising edge
    };

    expect(bitSimObj.isTransition(5, frising)).toBe(true);
    expect(bitSimObj.isTransition(6, frising)).toBe(false);
    expect(bitSimObj.isTransition(7, frising)).toBe(true);

    expect(bitSimObj.isTransition(6, ffalling)).toBe(true);
    expect(bitSimObj.isTransition(7, ffalling)).toBe(false);
    expect(bitSimObj.isTransition(8, ffalling)).toBe(true);
  });

  test("getTransitionTimeAny returns correct transition time", () => {
    global.simDB = { now: 1000 };
    // At time 10, next transition (deltaTransition=1) is at 20
    expect(bitSimObj.getTransitionTimeAny(10, 1)).toBe(20);
    // At time 10, previous transition (deltaTransition=-1) is at 0
    // expect(bitSimObj.getTransitionTimeAny(10, -1)).toBe(0);
    // At time 15 (between transitions), previous transition is at 10
    expect(bitSimObj.getTransitionTimeAny(15, -1)).toBe(10);

    expect(bitSimObj.getTransitionTimeRising(50, 1)).toBe(70);
    expect(bitSimObj.getTransitionTimeRising(55, 1)).toBe(70);
    expect(bitSimObj.getTransitionTimeRising(60, 1)).toBe(70);
    expect(bitSimObj.getTransitionTimeRising(65, 1)).toBe(70);

    expect(bitSimObj.getTransitionTimeRising(55, -1)).toBe(50);
    expect(bitSimObj.getTransitionTimeRising(60, -1)).toBe(50);
    // expect(bitSimObj.getTransitionTimeRising(65, -1)).toBe(50);
    expect(bitSimObj.getTransitionTimeRising(70, -1)).toBe(50);

    // Test falling transition
    expect(bitSimObj.getTransitionTimeFalling(60, 1)).toBe(80);
    expect(bitSimObj.getTransitionTimeFalling(65, 1)).toBe(80);
    expect(bitSimObj.getTransitionTimeFalling(70, 1)).toBe(80);
    expect(bitSimObj.getTransitionTimeFalling(75, 1)).toBe(80);

    expect(bitSimObj.getTransitionTimeFalling(65, -1)).toBe(60);
    expect(bitSimObj.getTransitionTimeFalling(70, -1)).toBe(60);
    // expect(bitSimObj.getTransitionTimeFalling(75, -1)).toBe(60);
    expect(bitSimObj.getTransitionTimeFalling(80, -1)).toBe(60);
  });
});
