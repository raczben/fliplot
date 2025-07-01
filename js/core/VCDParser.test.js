import { VCDParser } from './VCDParser.js';
import fs from 'fs';
import path from 'path';

describe('VCDParser', () => {
  let vcdContent;

  beforeAll(() => {
    // Adjust the path as needed to point to your test/wiki.vcd file
    const vcdPath = path.resolve(__dirname, '../../public/test/wiki.vcd');
    vcdContent = fs.readFileSync(vcdPath, 'utf8');
  });

  test('parses signals and value changes from wiki.vcd', () => {
    const parser = new VCDParser({ vcdcontent: vcdContent });
    const data = parser.getData();

    expect(data).toHaveProperty('signals');
    expect(Array.isArray(data.signals)).toBe(true);
    expect(data.signals.length).toBeGreaterThan(0);

    // Check that each signal has id, name, type, width, and changes
    for (const sig of data.signals) {
      expect(sig).toHaveProperty('vcdid');
      expect(sig).toHaveProperty('name');
      expect(sig).toHaveProperty('type');
      expect(sig).toHaveProperty('width');
      expect(Array.isArray(sig.wave)).toBe(true);
    }

    // Check that endtime is a number and >= 0
    expect(typeof data.now).toBe('number');
    expect(data.now).toBeGreaterThanOrEqual(0);

    // Optionally, check for a known signal and its changes
    const clk = data.signals.find(s => s.name.includes('rx_en'));
    expect(clk).toBeDefined();
    expect(Array.isArray(clk.wave)).toBe(true);
    expect(clk.wave.length).toBeGreaterThan(0);
    expect(clk.wave[0]).toHaveProperty('time');
    expect(clk.wave[0]).toHaveProperty('bin');
  });

  // Test AxiRegTC_test_write.vcd and compare with AxiRegTC_test_write_parsed.json
    test('parses AxiRegTC_test_write.vcd and matches expected output', () => {
        const vcdPath = path.resolve(__dirname, '../../public/test/AxiRegTC_test_write.vcd');
        const expectedOutputPath = path.resolve(__dirname, '../../public/test/AxiRegTC_test_write_parsed.json');
        const expectedOutput = JSON.parse(fs.readFileSync(expectedOutputPath, 'utf8'));
    
        const parser = new VCDParser({ vcdcontent: fs.readFileSync(vcdPath, 'utf8') });
        const data = parser.getData();
    
        expect(data).toEqual(expectedOutput);
    });
});