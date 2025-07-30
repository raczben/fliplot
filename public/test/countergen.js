/** This script generates a vcd file with a counter signal.
 */

import { writeFileSync } from "fs";

// Parameters:
const cntrPeriod = 10; // in ns
const cntrStart = 0; // init value of the counter
const cntrEnd = 500; // last value of the counter
const cntrStep = 1; // step of the counter (use fraction for float values)
const bitWidth = 32; // Width of the counter in bits
const cntrName = "cntr"; // Name of the clock signal
const vcdId = "`c";
const number_format = "float";

function intToBinString(num, width) {
  let binStr = num.toString(2);
  while (binStr.length < width) {
    binStr = "0" + binStr;
  }
  return binStr;
}

function floatToBinString(num) {
  // Convert float to binary string (32-bit representation)
  const buffer = new ArrayBuffer(4);
  const view = new Float32Array(buffer);
  view[0] = num;
  const intView = new Uint32Array(buffer);
  return intView[0].toString(2).padStart(32, "0");
}

function generateCounterVCD() {
  const vcdLines = [];
  vcdLines.push("$timescale 1ns $end");
  vcdLines.push("$scope module test $end");
  vcdLines.push(`$var wire ${bitWidth} ${vcdId} ${cntrName} $end`);
  vcdLines.push("$upscope $end");
  vcdLines.push("$enddefinitions $end");
  vcdLines.push("$dumpvars");

  //check the arguments:
  if (number_format === "float" && bitWidth !== 32) {
    throw new Error("For float format, the bit width must be 32.");
  }

  // Generate clock signal
  var binValue;
  for (let i = cntrStart; i <= cntrEnd; i += cntrStep) {
    const time = i * cntrPeriod;
    vcdLines.push(`#${time}`);

    if (number_format === "float") {
      binValue = floatToBinString(i);
    } else {
      binValue = intToBinString(i, bitWidth);
    }
    vcdLines.push(`b${binValue} ${vcdId}`);
  }

  // Write to file
  writeFileSync(`counter_${cntrEnd}.vcd`, vcdLines.join("\n"));
}

// Run the function to generate the VCD file
generateCounterVCD();
