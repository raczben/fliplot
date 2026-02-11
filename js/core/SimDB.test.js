const { SimDB } = require("./SimDB.js");
const { SimulationObject } = require("./SimulationObject.js");

describe("SimDB", () => {
  const dbMock = {
    now: 42,
    signals: [
      {
        references: [
          ["top", "a"],
          ["top", "b"]
        ],
        vcdid: "v1",
        type: "wire",
        wave: [
          { time: 0, bin: "0" },
          { time: 10, bin: "1" }
        ],
        width: 1
      }
    ],
    varialbes: [
      {
        vcdid: "v1",
        name: "a",
        hierarchy: ["top"],
        type: "wire",
        width: 1
      },
      {
        vcdid: "v1",
        name: "b",
        hierarchy: ["top"],
        type: "wire",
        width: 1
      }
    ]
  };

  let simdb;
  beforeEach(() => {
    simdb = new SimDB(dbMock);
  });

  test("constructor initializes properties and adds signals", () => {
    expect(simdb.now).toBe(42);
    expect(simdb.objects["top.a__S"]).toBeInstanceOf(SimulationObject);
    expect(simdb.objects["top.b__S"]).toBeInstanceOf(SimulationObject);
  });

  test("addSignal adds a signal object", () => {
    const hierarchy = ["top", "c"];
    const signal = {
      references: ["top.c"],
      vcdid: "v2",
      type: "wire",
      wave: [],
      width: 1
    };
    const obj = simdb.addSignal(hierarchy, signal);
    expect(obj).toBeInstanceOf(SimulationObject);
    expect(simdb.objects["top.c__S"]).toBe(obj);
  });

  test("addModule adds a module object", () => {
    const hierarchy = ["top", "mod1"];
    const obj = simdb.addModule(hierarchy);
    expect(obj).toBeInstanceOf(SimulationObject);
    expect(obj.soType).toBe(SimulationObject.SOType.MODULE);
    expect(simdb.objects["top.mod1"]).toBe(obj);
  });

  test("isPathExist returns true for existing path", () => {
    expect(simdb.isPathExist(["top", "a__S"])).toBe(true);
    expect(simdb.isPathExist(["top", "b__S"])).toBe(true);
  });

  test("isPathExist returns false for non-existing path", () => {
    expect(simdb.isPathExist(["top", "not_exist"])).toBe(false);
  });

  test("getObject returns correct object", () => {
    const obj = simdb.getObject(["top", "a__S"]);
    expect(obj).toBeInstanceOf(SimulationObject);
    expect(obj.soType).toBe(SimulationObject.SOType.SIGNAL);
  });

  test("getAllSignals returns all signal objects", () => {
    const signals = simdb.getAllSignals();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
    signals.forEach((sig) => {
      expect(sig).toBeDefined();
    });
  });
});
