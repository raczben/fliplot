/** This script generates a vcd file with a counter signal.
 */

import { writeFileSync } from "fs";

// Parameters:
const cntrPeriod = 10; // in ns
const cntrStart = 0; // in ns
const cntrEnd = 100000; // in ns
const bitWidth = 16; // Width of the counter in bits
const cntrName = "cntr"; // Name of the clock signal
const vcdId = "`c";

function intToBinString(num, width) {
  let binStr = num.toString(2);
  while (binStr.length < width) {
    binStr = "0" + binStr;
  }
  return binStr;
}

function generateCounterVCD() {
  const vcdLines = [];
  vcdLines.push("$timescale 1ns $end");
  vcdLines.push("$scope module test $end");
  vcdLines.push(`$var wire ${bitWidth} ${vcdId} ${cntrName} $end`);
  vcdLines.push("$upscope $end");
  vcdLines.push("$enddefinitions $end");
  vcdLines.push("$dumpvars");

  // Generate clock signal
  for (let i = cntrStart; i <= cntrEnd; i++) {
    const time = i * cntrPeriod;
    vcdLines.push(`#${time}`);
    const binValue = intToBinString(i, bitWidth);
    vcdLines.push(`b${binValue} ${vcdId}`);
  }

  // Write to file
  writeFileSync(`counter_${cntrEnd}.vcd`, vcdLines.join("\n"));
}

// Run the function to generate the VCD file
generateCounterVCD();
