/** This script generates a vcd file with a counter signal.
 */

import { writeFileSync } from "fs";

// Parameters:
const cntrPeriod = 10; // in ns
const cntrStart = 0; // init value of the counter
const cntrEndEnd = 100; // last value of the counter
const cntrStep = 1; // step of the counter (use fraction for float values)
const bitWidth = 32; // Width of the counter in bits
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

  // Generate a counter but...
  var binValue;
  var time = 0;
  for (let cntrEnd = 1; cntrEnd < cntrEndEnd; cntrEnd++) {
    for (let i = cntrStart; i <= cntrEnd; i += cntrStep) {
      time = time + cntrPeriod;
      vcdLines.push(`#${time}`);
      binValue = intToBinString(i, bitWidth);
      vcdLines.push(`b${binValue} ${vcdId}`);
    }
    // take a breath
    time = time + cntrPeriod * 100;
  }

  // Write to file
  writeFileSync(`zcmp_${cntrEndEnd}.vcd`, vcdLines.join("\n"));
}

// Run the function to generate the VCD file
generateCounterVCD();
