const { WaveformRow } = require("./WaveformRow.js");

// Mock SimulationObject
class MockSimObj {
  constructor(width = 1) {
    this.signal = { width };
    this.hierarchy = ["top", "sig"];
    this.getChangeIndexAt = jest.fn((time) => time);
    this.getValueAt = jest.fn((time, radix, def) => `val_${time}_${radix}`);
    this.getValueAtI = jest.fn((i, radix, def) => `valI_${i}_${radix}`);
    this.getTimeAtI = jest.fn((i, now) => i * 10);
  }
}

describe("WaveformRow", () => {
  test("constructor sets properties for bit signal", () => {
    const simObj = new MockSimObj(1);
    const row = new WaveformRow(simObj);
    expect(row.type).toBe("signal");
    expect(row.simObj).toBe(simObj);
    expect(row.radix).toBe("bin");
    expect(row.waveStyle).toBe("bit");
    expect(row.name).toBe("top.sig");
  });

  test("constructor sets properties for bus signal", () => {
    const simObj = new MockSimObj(8);
    const row = new WaveformRow(simObj);
    expect(row.radix).toBe("hex");
    expect(row.waveStyle).toBe("bus");
  });

  test("getChangeIndexAt delegates to simObj", () => {
    const simObj = new MockSimObj();
    const row = new WaveformRow(simObj);
    expect(row.getChangeIndexAt(5)).toBe(5);
    expect(simObj.getChangeIndexAt).toHaveBeenCalledWith(5);
  });

  test("getValueAt returns prefixed value", () => {
    const simObj = new MockSimObj(8);
    const row = new WaveformRow(simObj);
    row.radixPrefix = "0x";
    expect(row.getValueAt(12)).toBe("0xval_12_hex");
    expect(simObj.getValueAt).toHaveBeenCalledWith(12, "hex", "- NA -");
  });

  test("getValueAtI returns prefixed value", () => {
    const simObj = new MockSimObj(8);
    const row = new WaveformRow(simObj);
    row.radixPrefix = "0x";
    expect(row.getValueAtI(2)).toBe("0xvalI_2_hex");
    expect(simObj.getValueAtI).toHaveBeenCalledWith(2, "hex", undefined);
  });

  test("getTimeAtI delegates to simObj", () => {
    const simObj = new MockSimObj();
    const row = new WaveformRow(simObj);
    expect(row.getTimeAtI(3)).toBe(30);
    expect(simObj.getTimeAtI).toHaveBeenCalledWith(3, -1);
  });

  test("setRadix sets correct radix and prefix for bit", () => {
    const simObj = new MockSimObj(1);
    const row = new WaveformRow(simObj);
    row.setRadix("hex", "0x");
    expect(row.radix).toBe("bin");
    expect(row.radixPrefix).toBe("");
  });

  test("setRadix sets correct radix and prefix for bus", () => {
    const simObj = new MockSimObj(8);
    const row = new WaveformRow(simObj);

    row.setRadix("hex", "0x");
    expect(row.radix).toBe("hex");
    expect(row.radixPrefix).toBe("0x");

    row.setRadix("bin", "0b");
    expect(row.radix).toBe("bin");
    expect(row.radixPrefix).toBe("0b");

    row.setRadix("unsigned");
    expect(row.radix).toBe("u0");
    expect(row.radixPrefix).toBe("");

    row.setRadix("signed");
    expect(row.radix).toBe("s0");
    expect(row.radixPrefix).toBe("");
  });
});
