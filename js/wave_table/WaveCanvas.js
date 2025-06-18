import { config, simDB} from "../interact.js";
import { ceiln, isInt, wrap_fast } from "../core/util.js";
import { WaveTable } from "./WaveTable.js";

/* index definitions for render data */
const WAVEARRAY = 0;
const IDX = 1;


function parseIntDef(intToPare, def = 0.5) {
  if (isInt(intToPare)) {
    return parseInt(intToPare);
  } else {
    return def;
  }
}

function value2Color(val) {
  if (isInt(val))
    return "#00FF00";
  else if (val == 'z')
    return "#0000FF";
  else
    return "#FF0000";
}

// Linear scale: maps [domainMin, domainMax] to [rangeMin, rangeMax]
// Based on d3's linear scale, but simplified for our use case
// Usage: const scale = linearScale([0, 100], [0, 500]);
// scale(50) -> 250
function linearScale(domain, range) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  const domainSpan = domainMax - domainMin;
  const rangeSpan = rangeMax - rangeMin;

  // Forward: domain -> range
  function scale(x) {
    return rangeMin + ((x - domainMin) / domainSpan) * rangeSpan;
  }

  // Inverse: range -> domain
  scale.invert = function(y) {
    return domainMin + ((y - rangeMin) / rangeSpan) * domainSpan;
  };

  return scale;
}
export class WaveCanvas {
  constructor(waveTable) {

    /** @type {WaveTable} */
    this.waveTable = waveTable;

    /** @type {string} */
    this.rowIdPrefix = '#signalRow_';
    this.rowClass = '.signalRow';

    // (Note that canvas fills only the visible area and scrolling is done by rendereing function.)
    this.scrollTop = 0; // offset of the top of the canvas Unit: px.
    this.scrollLeft = 0; // offset of the left of the canvas Unit: px.
    this.timeScale = 1.0; // Ratio: simulation time units per pixel. Unit: px/simTimeUnit.

    this.canvas = document.getElementById('wave-axis-canvas'); 
  }

  init() {
  }

  reload(render=false) {
    console.log("Reloading waveform display", { render });
    
  }

  setScrollTop(scrollTop) {
    // Set the scroll position of the wave display
    this.scrollTop = scrollTop;
  }

  setLeftOffset(scrollLeft) {
    // Set the scroll position of the wave display
    this.scrollLeft = scrollLeft;
    console.log("Set scroll left to:", scrollLeft);
    console.log("Render range set to:", this.renderRange);
  }

  refresh() {
  }

  clearAll() {
  }

  /** * Zoom in or out of the waveform display.
   * This is like zooming in or out of the waveform display.
   * @param {number} delta - The zoom factor
   * * Positive values zoom in, negative values zoom out.
   * * default is 0.3: zoomIn 30%
   */
  zoomInOut(delta=0.3) {
    const deltaRatio = delta + 1
    // Zoom the waveform display by a given factor
    if (deltaRatio > 5 || deltaRatio < 0.2) {
      console.error("Zoom: delta is out of range:", delta);
      return;
    }
    const newTimeScale = this.timeScale * deltaRatio;
    // Protect time scale: the 'now' should be at least 50 pixels wide.
    if (newTimeScale * simDB.now < 50) {
      console.error("Zoom: time scale is too small:", this.timeScale * simDB.now);
      return;
    }
    this.timeScale = newTimeScale;
  }

  /** * set the canvas size but not render it.
   * @param {number} width - The new width of the canvas in pixels
   * @param {number} height - The new height of the canvas in pixels
   */
  setSize(width, height) {
    // Resize the canvas to fit the given dimensions
    this.canvas.width = width;
    this.canvas.height = height;
    console.log("Resized canvas to:", { width, height });
  }

  /**
   *  Returns the render range for the waveform display.
   *  
   * @param {number} offs - The left offset in pixels from the start of the waveform
   * @param {number} width - The width of the render area in pixels
   * @returns 
   */
  getTimeRange(offs, width) {
    // Set the render range for the waveform display
    if (width <= 0) {
      console.error("Invalid width for render range:", width);
      return;
    }
    return [offs / this.timeScale, (offs + width) / this.timeScale];
  }

  

  /**
   * Render all signals on a canvas.
   */
  render() {
    // Set the width of the wave-time-placeholder element
    const waveTimePlaceholder = document.getElementById('wave-time-placeholder');
    if (waveTimePlaceholder) {
      waveTimePlaceholder.style.width = (this.timeScale * simDB.now) + "px";
    }

    const ctx = this.canvas.getContext('2d');

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // visible rangey:
    const visibleRangeY = {
      top: this.scrollTop,
      bottom: this.scrollTop + this.canvas.height
    };
    // Example: render each row in waveTable.rows
    const rowsToPlot = this.waveTable.getRows({hidden:false, content:true});
    rowsToPlot.forEach((row, rowIdx) => {
      const waveStyle = row.waveStyle;
      const rowHeight = config.rowHeight;
      const yBase = rowIdx * rowHeight;

      // // Skip rows that are not in the visible range
      if (yBase + rowHeight < visibleRangeY.top || yBase > visibleRangeY.bottom) {
        return; 
      }

      if (waveStyle === 'bit') {
        // Draw bit wave as rectangles
        // setTimeout(() => {
          this.drawBitSignal(ctx, row, yBase-this.scrollTop, this.scrollLeft, this.timeScale);
        // },0);
      } else if (waveStyle === 'bus') {
          this.drawBusSignal(ctx, row, yBase-this.scrollTop, this.scrollLeft, this.timeScale);
      } else {
        // Unsupported style
        ctx.fillStyle = "rgba(150,70,60,0.5)";
        ctx.fillRect(0, yBase, this.canvas.width, config.rowHeight);
        ctx.fillStyle = "#fff";
        ctx.fillText(`Unsupported: ${waveStyle}`, 10, yBase + config.rowHeight / 2);
      }
    });
    this.drawAxis(ctx, this.scrollTop, this.scrollLeft, this.timeScale);
  }


  /**
   * Draw a single bit-style signal on the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} row - The rowToPlot element (signal row object)
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   */
  drawBitSignal(ctx, row, yOffset, xOffset, timeScale) {
    const signal = row.simObj.signal;
    const rowHeight = config.rowHeight;
    const bitWavePadding = config.bitWavePadding || 2;
    const timeRange = this.getTimeRange(xOffset, this.canvas.width);

    const valueScale = linearScale(
      [0, 1],
      [rowHeight - bitWavePadding, bitWavePadding]
    );

    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    // Find indices in wave that are within the visible time range
    const startIdx = signal.getChangeIndexAt(timeRange[0]);
    if (startIdx < 0) {
      console.warn("No signal changes in visible time range", timeRange);
      return;
    }
    for (let i = startIdx; i < signal.wave.length; i++) {
      // segment values:
      const t0 = signal.getTimeAtI(i);
      const t1 = signal.getTimeAtI(i+1);
      const v0 = signal.getValueAtI(i);

      // trasform to pixel coordinates
      let x0 = t0 * timeScale - xOffset;
      let x1 = t1 * timeScale - xOffset;
      let y0r = valueScale(parseIntDef(v0));
      let y0abbs = y0r + yOffset;
      let c0 = ctx.fillStyle = value2Color(v0);

      // --- Rectangle (transRect) ---
      ctx.fillStyle = c0 + "20"; // Add transparency
      const rectHeight = valueScale(1-parseIntDef(v0))-bitWavePadding;
      ctx.fillRect(x0, y0abbs, x1 - x0, rectHeight);

      // --- Horizontal line (timeholder) ---
      ctx.strokeStyle = c0;
      ctx.beginPath();
      ctx.moveTo(x0, y0abbs);
      ctx.lineTo(x1, y0abbs);
      ctx.stroke();

      // --- Vertical line (valuechanger) ---
      try {
        const vm1 = signal.getValueAtI(i - 1);
        const ym1r = valueScale(parseIntDef(vm1));
        const ym1abbs = ym1r + yOffset;
        ctx.strokeStyle = c0;
        ctx.beginPath();
        ctx.moveTo(x0, ym1abbs);
        ctx.lineTo(x0, y0abbs);
        ctx.lineCap = "round";
        ctx.stroke();
      } catch (e) {
        console.debug("negative index in valuechanger", e);
      }
    }
  }

  /**
   * Draw a single bit-style signal on the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} row - The rowToPlot element (signal row object)
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   */
  drawBusSignal(ctx, row, yOffset, xOffset, timeScale) {
    const signal = row.simObj.signal;
    const rowHeight = config.rowHeight;
    const bitWavePadding = config.bitWavePadding || 2;

    const valueScale = linearScale(
      [0, 1],
      [rowHeight - bitWavePadding, bitWavePadding]
    );

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const timeRange = this.getTimeRange(xOffset, this.canvas.width);

    // Find indices in wave that are within the visible time range
    const startIdx = signal.getChangeIndexAt(timeRange[0]);
    if (startIdx < 0) {
      console.warn("No signal changes in visible time range", timeRange);
      return;
    }
    for (let i = startIdx; i < signal.wave.length; i++) {
      // segment values:
      const t0 = signal.getTimeAtI(i);
      const t1 = signal.getTimeAtI(i+1);
      const v0 = signal.getValueAtI(i);

      // trasform to pixel coordinates
      let half = valueScale(0.5) + yOffset;
      let one = valueScale(1) + yOffset;
      let zero = valueScale(0) + yOffset;
      let x0 = t0 * timeScale - xOffset;
      let x1 = t1 * timeScale - xOffset;
      let c0 = ctx.fillStyle = value2Color(v0);

      // --- the 'hexagon' of the bus ---
      ctx.strokeStyle = c0;
      ctx.beginPath();
      ctx.moveTo(x0, half);
      ctx.lineTo(x0+2, one);
      ctx.lineTo(x1-2, one);
      ctx.lineTo(x1, half);
      ctx.lineTo(x1-2, zero);
      ctx.lineTo(x0+2, zero);
      ctx.lineTo(x0, half);
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  /**
   * plot the time axis to the waveform display.
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   */
  drawAxis(ctx, yOffset, xOffset, timeScale) {
    // Always draw the axis 15px above the bottom edge of the canvas
    const axisY = this.canvas.height - 25;

    // Clear the axis area
    ctx.clearRect(0, axisY, this.canvas.width, this.canvas.height - axisY);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(this.canvas.width, axisY);
    ctx.stroke();

    // calculate the time step based on the time scale
    //  the labels should be more or less 50 pixels apart
    const orderOfMagnitude = Math.floor(Math.log10(timeScale));
    let timeStep = Math.pow(10, -(orderOfMagnitude))*100;
    if (timeStep * timeScale > 200) {
      timeStep = timeStep/2;
    }

    // Draw time labels and ticks at each time step
    const timeRange = this.getTimeRange(xOffset, this.canvas.width);
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Create a counter for ticks
    let tickIdx = 0;

    for (let t = ceiln(timeRange[0], timeStep); t <= timeRange[1]; t += timeStep) {
      const x = (t - timeRange[0]) * timeScale;
      ctx.fillText(t.toFixed(2), x + 2, axisY + 8);
      ctx.beginPath();
      ctx.moveTo(x, axisY);

      if (tickIdx % 2 === 0) {
        // Every even tick: draw tick to top of canvas
        ctx.lineTo(x, 0);
      } else {
        ctx.lineTo(x, axisY + 5);
      }
      ctx.stroke();
      tickIdx++;
    }
  }



}
