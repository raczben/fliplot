/** This script generates a vcd file with a clock signal.
 */

import { writeFileSync } from "fs";

// Parameters:
const clockPeriod = 10; // in ns
const clockStart = 0; // in ns
const clockEnd = 1000000; // in ns
const clockName = "clk"; // Name of the clock signal
const numberOfClkSig = 1;
const vcdId = "`c";

function intToVCDID(n) {
  return "`" + String.fromCharCode(97 + n); // 97 is 'a', 65 is 'A'
}

function generateClockVCD() {
  const vcdLines = [];
  vcdLines.push("$timescale 1ns $end");
  vcdLines.push("$scope module test $end");
  for (let i = 0; i < numberOfClkSig; i++) {
    vcdLines.push(`$var wire 1 ${intToVCDID(i)} ${clockName}${i} $end`);
  }
  vcdLines.push("$upscope $end");
  vcdLines.push("$enddefinitions $end");
  vcdLines.push("$dumpvars");

  // Generate clock signal
  for (let time = clockStart; time <= clockEnd; time += clockPeriod) {
    vcdLines.push(`#${time}`);
    for (let i = 0; i < numberOfClkSig; i++) {
      vcdLines.push(`${time % (2 * clockPeriod) < clockPeriod ? "1" : "0"}${intToVCDID(i)}`);
    }
  }

  // Write to file
  writeFileSync(`clock_${clockEnd}.vcd`, vcdLines.join("\n"));
}

// Run the function to generate the VCD file
generateClockVCD();
