import { VCDParser } from "./VCDParser.js";
import fs from "fs";
import path from "path";

describe("VCDParser", () => {
  let vcdContent;

  beforeAll(() => {
    // Adjust the path as needed to point to your test/wiki.vcd file
    const vcdPath = path.resolve(__dirname, "../../public/test/wiki.vcd");
    vcdContent = fs.readFileSync(vcdPath, "utf8");
  });

  test("parses signals and value changes from wiki.vcd", () => {
    const parser = new VCDParser({ vcdcontent: vcdContent });
    const data = parser.getData();

    expect(data).toHaveProperty("signals");
    expect(Array.isArray(data.variables)).toBe(true);
    expect(data.variables.length).toBeGreaterThan(0);

    // Check that each signal has id, name, type, width, and changes
    for (const v of data.variables) {
      expect(v).toHaveProperty("vcdid");
      expect(v).toHaveProperty("name");
      expect(v).toHaveProperty("type");
      expect(v).toHaveProperty("width");
    }

    // Check that endtime is a number and >= 0
    expect(typeof data.now).toBe("number");
    expect(data.now).toBeGreaterThanOrEqual(0);

    // Optionally, check for a known signal and its changes
    const rx_en = data.signals["&"]; // vcdid for rx_en in wiki.vcd is "&"
    expect(rx_en).toBeDefined();
    expect(Array.isArray(rx_en.wave)).toBe(true);
    expect(rx_en.wave.length).toBeGreaterThan(0);
    expect(rx_en.wave[0]).toHaveProperty("time");
    expect(rx_en.wave[0]).toHaveProperty("bin");
  });

  // Test AxiRegTC_test_write.vcd and compare with AxiRegTC_test_write_parsed.json
  test("parses AxiRegTC_test_write.vcd and matches expected output", () => {
    const vcdPath = path.resolve(__dirname, "../../public/test/AxiRegTC_test_write.vcd");
    const expectedOutputPath = path.resolve(
      __dirname,
      "../../public/test/AxiRegTC_test_write_parsed.json"
    );
    const expectedOutput = JSON.parse(fs.readFileSync(expectedOutputPath, "utf8"));

    const parser = new VCDParser({
      vcdcontent: fs.readFileSync(vcdPath, "utf8")
    });
    const data = parser.getData();
    // export JSON:
    // fs.writeFileSync("out.json", JSON.stringify(parser.getData(), null, 2));

    expect(data).toEqual(expectedOutput);
  });
});
