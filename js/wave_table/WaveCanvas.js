import { simDB } from "../interact.js";
import { Config } from "../core/Config.js";
import { ceiln, isInt, mostUndefined, truncateTextToWidth } from "../core/util.js";
import { WaveTable } from "./WaveTable.js";
import { WebGL2UtilTR } from "./WebGL2UtilTR.js";
import { WaveformRow } from "./WaveformRow.js";
import { Signal } from "../core/Signal.js";

/**
 * Simple utility functio to help rendering bit signals.
 *
 * @param {string} intToPare - string represented binary value to parse.
 * @param {number} def - defalult value to return in case of parse error.
 * @returns {number} - Returns a level of the signlas. (1 for '1', 0 for '0', 0.5 for 'x' or 'z)
 */
function parseIntDef(intToPare, def = 0.5) {
  if (isInt(intToPare)) {
    return parseInt(intToPare);
  } else {
    return def;
  }
}

/**
 *
 * @param {string} val
 * @param {boolean} selected
 * @returns
 */
function value2ColorWGL(bin, selected) {
  const colorMap = {
    0: [0.0, 1.0, 0.0, 1.0], //"#00FF00";
    x: [1.0, 0.0, 0.0, 1.0], // "#FF0000";
    u: [1.0, 0.0, 0.0, 1.0], // "#FF0000";
    z: [0.0, 0.0, 1.0, 1.0] // "#0000FF";
  };
  const muv = mostUndefined(bin);
  let color = colorMap[muv];
  if (!color) {
    color = colorMap["x"];
  }

  // Do some staff for WebGL interface
  // copy array:
  let line_color = [...color];
  let shadow_color = [...color];
  if (selected) {
    // make the color not transparent if it is selected
    line_color[3] = 1.0;
    shadow_color[3] = 0.1;
  } else {
    // make the color transparent if it is not selected
    line_color[3] = 0.7;
    shadow_color[3] = 0.1;
  }
  return { line_color, shadow_color };
}

/**
 * Linear scale: maps [domainMin, domainMax] to [rangeMin, rangeMax]
 * Based on d3's linear scale, but simplified for our use case
 * Usage: const scale = linearScale([0, 100], [0, 500]);
 * scale(50) -> 250
 *
 * @param {number[]} domain
 * @param {number[]} range
 * @returns the scale function
 */
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
  scale.invert = function (y) {
    return domainMin + ((y - rangeMin) / rangeSpan) * domainSpan;
  };
  return scale;
}

export class WaveCanvas {
  /**
   *
   * @param {WaveTable} waveTable
   */
  constructor(waveTable) {
    /** @type {WaveTable} */
    this.waveTable = waveTable;

    /** @type {string} */
    this.rowIdPrefix = "#signalRow_";
    this.rowClass = ".signalRow";

    // (Note that canvas fills only the visible area and scrolling is done by rendereing function.)
    this.scrollTop = 0; // offset of the top of the canvas Unit: px.
    this.scrollLeft = 0; // offset of the left of the canvas Unit: px.
    this.timeScale = 1.0; // Ratio: simulation time units per pixel. Unit: px/simTimeUnit.
    this.cursorTime = 0; // The time of the cursor in simulation time units. Unit: simTimeUnit.

    /**  @type {HTMLElement} */
    this.canvas = document.getElementById("wave-axis-canvas");
    /**  @type {HTMLElement} */
    this.canvasWebGL2 = document.getElementById("wave-axis-canvas-webgl2");

    /** @type {WebGL2UtilTR} */
    this.wglu = new WebGL2UtilTR(this.canvasWebGL2);

    this._renderScheduled = false;
  }

  init() {}

  /**
   *
   * @param {boolean} render
   */
  reload(render = false) {
    console.log("Reloading waveform display", { render });
  }

  /**
   *
   * @param {number} scrollTop
   */
  setScrollTop(scrollTop) {
    // Set the scroll position of the wave display
    this.scrollTop = scrollTop;
  }

  /**
   *
   * @param {number} scrollTop
   */
  setLeftOffset(scrollLeft) {
    // Set the scroll position of the wave display
    this.scrollLeft = scrollLeft;
    console.log("Set scroll left to:", scrollLeft);
  }

  refresh() {}

  /** * Zoom in or out of the waveform display.
   * This is like zooming in or out of the waveform display.
   * @param {number} delta - The zoom factor
   * @returns {number} - The new scroll position based on the fix point
   * * Positive values zoom in, negative values zoom out.
   * * default is 0.3: zoomIn 30%
   */
  zoomInOut(delta = 0.3, fixPointX = -1) {
    const deltaRatio = delta + 1;
    if (fixPointX < 0) {
      // If no fix point is given, use the center of the canvas
      fixPointX = this.canvas.width / 2;
    } else if (fixPointX > this.canvas.width) {
      // If the fix point is outside the canvas, clamp it to the canvas width
      fixPointX = this.canvas.width;
    }

    const oldTimeScale = this.timeScale;
    const newTimeScale = this.timeScale * deltaRatio;
    // Protect time scale: the 'now' should be at least 50 pixels wide.
    if (newTimeScale * simDB.now < 50) {
      console.error("Zoom: time scale is too small:", this.timeScale * simDB.now);
      return;
    }

    // Calculate the new scroll position based on the fix point
    const fixXAbs = fixPointX + this.scrollLeft; // absolute x position in pixels
    const fixTime = fixXAbs / oldTimeScale; // time at the fix point in simulation time units
    const newXAbs = fixTime * newTimeScale; // new x position in pixels at the fix point
    const scrollLeft = newXAbs - fixPointX; // new scroll position in pixels

    this.timeScale = newTimeScale;

    this.adjustWaveTimePlaceholder();

    return scrollLeft;
  }

  /** * set the canvas size but not render it.
   * @param {number} width - The new width of the canvas in pixels
   * @param {number} height - The new height of the canvas in pixels
   */
  setSize(width, height) {
    // Resize the canvas to fit the given dimensions
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvasWebGL2.width = width;
    this.canvasWebGL2.height = height;

    // fix blurry text in canvas
    // https://stackoverflow.com/a/65124939/2506522:
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.canvasWebGL2.style.width = width + "px";
    this.canvasWebGL2.style.height = height + "px";

    const stickyDiv = document.getElementById("wave-axis-canvas-sticky");
    stickyDiv.style.width = width + "px";
    console.log("Resized canvas to:", { width, height });
  }

  /**
   * Get the current size of the canvas.
   * @return {Object} - An object containing the width and height of the canvas
   */
  getSize() {
    // Get the current size of the canvas
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   *
   * @returns {number} the current time scale of the waveform display.
   */
  getTimeScale() {
    // Get the current time scale of the waveform display
    return this.timeScale;
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
   * Get the time in simulation time units from a given x-coordinate.
   * @param {number} x - The x-coordinate in pixels (relative to the left edge of the canvas)
   * @returns {number} - The time in simulation time units
   */
  getTimeFromX(x) {
    return (x + this.scrollLeft) / this.timeScale;
  }

  /**
   * Set the cursor time in simulation time units.
   * @param {number} time - The time in simulation time units
   */
  setCursorTime(time) {
    if (time < 0) {
      console.error("Invalid cursor time:", time);
      return;
    }
    this.cursorTime = time;
  }

  /**
   * Get the cursor time in simulation time units.
   * @return {number} time - The time in simulation time units
   */
  getCursorTime() {
    return this.cursorTime;
  }

  /**
   *  Adjust the width of the wave-time-placeholder element based on the current time scale.
   * This is used to visually represent the current simulation time in the waveform display.
   * And fill the space for horisontal scroll bar.
   */
  adjustWaveTimePlaceholder() {
    // Set the width of the wave-time-placeholder element
    const waveTimePlaceholder = document.getElementById("wave-time-placeholder");
    if (waveTimePlaceholder) {
      waveTimePlaceholder.style.width = this.timeScale * simDB.now + "px";
    } else {
      console.error("Wave time placeholder element not found");
    }
  }

  /**
   * Render all signals on a canvas.
   * Do not call this directly, use requestRender() instead.
   */
  render() {
    console.debug("Rendering waveform display");
    const ctx = this.canvas.getContext("2d");

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.wglu.clear();

    // visible rangey:
    const visibleRangeY = {
      top: this.scrollTop,
      bottom: this.scrollTop + this.canvas.height
    };
    let yBase = 0;
    // Example: render each row in waveTable.rows
    const rowsToPlot = this.waveTable.getRows({ hidden: false, content: true });
    rowsToPlot.forEach((row, rowIdx) => {
      try {
        const waveStyle = row.waveStyle;
        const rowHeight = row.getHeight();

        // // Skip rows that are not in the visible range
        if (yBase + rowHeight < visibleRangeY.top || yBase > visibleRangeY.bottom) {
          yBase = yBase + row.getHeight();
          return;
        }

        const selected = this.waveTable.isSelected(row.id);
        // draw light gray background for the selected signals:
        if (selected) {
          ctx.fillStyle = "rgba(200, 200, 200, 0.19)";
          ctx.fillRect(0, yBase - this.scrollTop, this.canvas.width, rowHeight);
        }

        if (!row.simObj.signal.isWaveSet) {
          row.simObj.signal.cloneWaveFromOrigin();
        }
        if (waveStyle === WaveformRow.WaveStyle.BIT) {
          // Draw bit wave as rectangles
          this.drawBitSignal(
            this.wglu,
            row,
            yBase - this.scrollTop,
            this.scrollLeft,
            this.timeScale,
            selected,
            2
          );
        } else if (waveStyle === WaveformRow.WaveStyle.BUS) {
          this.drawBusSignal(
            ctx,
            this.wglu,
            row,
            yBase - this.scrollTop,
            this.scrollLeft,
            this.timeScale,
            selected,
            2
          );
        } else if (waveStyle === WaveformRow.WaveStyle.ANALOG) {
          this.drawAnalogSignal(
            ctx,
            this.wglu,
            row,
            yBase - this.scrollTop,
            this.scrollLeft,
            this.timeScale,
            selected,
            2
          );
        } else if (waveStyle === WaveformRow.WaveStyle.BLANK) {
          // Do nothing for blank wave style
        } else {
          // Unsupported style
          ctx.fillStyle = "rgba(150,70,60,0.5)";
          ctx.fillRect(0, yBase, this.canvas.width, rowHeight);
          ctx.fillStyle = "#fff";
          ctx.fillText(`Unsupported: ${waveStyle}`, 10, yBase + rowHeight / 2);
        }
        yBase = yBase + row.getHeight();
      } catch (e) {
        console.error("Error rendering row:", row, e);
        throw e;
      }
    });
    this.drawCursor(ctx, this.cursorTime, this.scrollLeft, this.timeScale);
    this.drawAxis(ctx, this.scrollLeft, this.timeScale);
    this.wglu.draw();
  }

  /**
   * Draw a single bit-style signal on the canvas.
   * @param {WebGL2UtilTR} wglu - The WebGL utility wrapper class.
   * @param {WaveformRow} row - The rowToPlot element (signal row object)
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   * @param {boolean} selected - Selected row is lighter
   * @param {number} lineWidth - The line width of the signal.
   */
  drawBitSignal(wglu, row, yOffset, xOffset, timeScale, selected, lineWidth) {
    const signal = row.simObj.signal;
    const rowHeight = row.getHeight();
    const bitWavePadding = Config.bitWavePadding || 2;
    const timeRange = this.getTimeRange(xOffset, this.canvas.width);

    const valueScale = linearScale([0, 1], [rowHeight - bitWavePadding, bitWavePadding]);

    const one = valueScale(1) + yOffset;
    const zero = valueScale(0) + yOffset;

    let wiPrev = null;
    for (let wi of signal.waveIterator(timeRange[0], timeRange[1], timeScale, simDB.now)) {
      // trasform to pixel coordinates
      const t1 = wi.time;
      const x1 = t1 * timeScale - xOffset;
      const v1 = wi.val;
      const y1r = valueScale(parseIntDef(v1));
      const y1abbs = y1r + yOffset;

      if (wiPrev == null) {
        // first iteration
        wglu.begin_line(x1, y1abbs);
        wiPrev = wi;
        continue;
      }

      // trasform to pixel coordinates
      const t0 = wiPrev.time;
      const y0r = valueScale(parseIntDef(wiPrev.val));
      const y0abbs = y0r + yOffset;
      const x0 = t0 * timeScale - xOffset;

      let { line_color, shadow_color } = value2ColorWGL(wiPrev.val, selected);

      if (wiPrev.wiType === Signal.WITYPE.ZOOM_COMPRESSION) {
        // handle zoom compression
        wglu.add_rect(x0, zero + lineWidth / 2, x1, one - lineWidth / 2, line_color);
        wglu.line_to(x1, y1abbs, lineWidth, [0.0, 0.0, 0.0, 0.0]);
      } else {
        if (x1 - x0 > 10) {
          // --- Rectangle (transRect) ---
          const rectHeight = valueScale(1 - parseIntDef(wiPrev.val)) - bitWavePadding;
          // if frequiency is too high (zooming out is too much) do not draw the rectangle:
          wglu.add_rect(x0, y0abbs, x1, y0abbs + rectHeight, shadow_color);
        }

        // --- Horizontal line (timeholder) ---
        wglu.line_to(x1, y0abbs, lineWidth, line_color);

        // --- Vertical line (valuechanger) ---
        if (wi.wiType === Signal.WITYPE.NATIVE) {
          wglu.line_to(x1, y1abbs, lineWidth, line_color);
        }
      }
      wiPrev = wi;
    }
    wglu.end_line();
  }

  /**
   * Draw a single bit-style signal on the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context for the values
   * @param {WebGL2UtilTR} wglu - The WebGL utility wrapper class, for the signal wave
   * @param {WaveformRow} row - The rowToPlot element (signal row object)
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   * @param {boolean} selected - Selected row is lighter
   * @param {number} lineWidth - The line width of the signal.
   */
  drawBusSignal(ctx, wglu, row, yOffset, xOffset, timeScale, selected, lineWidth) {
    const signal = row.simObj.signal;
    const rowHeight = Config.rowHeight;
    const bitWavePadding = Config.bitWavePadding || 2;

    const valueScale = linearScale([0, 1], [rowHeight - bitWavePadding, bitWavePadding]);

    const timeRange = this.getTimeRange(xOffset, this.canvas.width);

    const half = valueScale(0.5) + yOffset;
    const one = valueScale(1) + yOffset;
    const zero = valueScale(0) + yOffset;

    let wiPrev = null;
    for (let wi of signal.waveIterator(
      timeRange[0],
      timeRange[1],
      timeScale,
      simDB.now,
      false, // initialX
      row.radix
    )) {
      // trasform to pixel coordinates

      if (wiPrev == null) {
        // first iteration
        // begin line in the middle of nowhere, anywhere
        wglu.begin_line(0, half);
        wiPrev = wi;
        continue;
      }

      // segment values:
      const t0 = wiPrev.time;
      const t1 = wi.time;
      const v0 = wiPrev.val;

      // trasform to pixel coordinates
      let x0 = t0 * timeScale - xOffset;
      let x1 = t1 * timeScale - xOffset;

      let { line_color, _ } = value2ColorWGL(v0, selected);

      if (wiPrev.wiType === Signal.WITYPE.ZOOM_COMPRESSION) {
        // handle zoom compression
        wglu.add_rect(x0, zero + lineWidth / 2, x1, one - lineWidth / 2, line_color);
        wiPrev = wi;
        continue;
      }

      // --- the 'hexagon' of the bus ---
      wglu.line_to(x0, half, lineWidth, [0, 0, 0, 0]);
      wglu.line_to(x0 + 2, one, lineWidth, line_color);
      wglu.line_to(x1 - 2, one, lineWidth, line_color);
      wglu.line_to(x1, half, lineWidth, line_color);
      wglu.line_to(x1 - 2, zero, lineWidth, line_color);
      wglu.line_to(x0 + 2, zero, lineWidth, line_color);
      wglu.line_to(x0, half, lineWidth, line_color);

      // write the value in the middle of the bus
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "ideographic";
      ctx.font = "12px sans-serif";
      // if the bus overflows the canvas' edges write the value
      // in the middel of the visible area
      const x0satured = Math.max(x0, 0);
      const x1satured = Math.min(x1, this.canvas.width);
      const xpos = (x0satured + x1satured) / 2;
      const txt = row.radixPrefix + wiPrev.val;
      let truncedStr = truncateTextToWidth(ctx, txt, x1satured - x0satured - 4);
      ctx.fillText(truncedStr, xpos, zero - 1);
      wiPrev = wi;
    }
    wglu.end_line();
  }

  /**
   * Draw an analog-style signal on the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {WebGL2UtilTR} wglu - The WebGL utility wrapper class, for the signal wave
   * @param {WaveformRow} row - The rowToPlot element (signal row object)
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   * @param {boolean} selected - Selected row is lighter
   * @param {number} lineWidth - The line width of the signal.
   */
  drawAnalogSignal(ctx, wglu, row, yOffset, xOffset, timeScale, selected, lineWidth) {
    const signal = row.simObj.signal;
    const rowHeight = row.getHeight();
    const bitWavePadding = Config.bitWavePadding || 2;

    const timeRange = this.getTimeRange(xOffset, this.canvas.width);

    const absTop = rowHeight - bitWavePadding + yOffset;
    const absBottom = bitWavePadding + yOffset;

    const valueScalify = linearScale(
      row.getYAxisRange(), // domain
      [absTop, absBottom] // range
    );

    let firstIteration = true;
    for (let wi of signal.waveIterator(
      timeRange[0],
      timeRange[1],
      timeScale, // timeScale
      -1, // now
      false, // initialX
      row.radix
    )) {
      const t1 = wi.time;

      // trasform to pixel coordinates
      const v1 = wi.val;
      const { line_color, _ } = value2ColorWGL(v1, selected);

      if (wi.wiType === Signal.WITYPE.ZOOM_COMPRESSION) {
        // handle zoom compression
        let timeValuePairs = [];
        if (wi.mintime < wi.maxtime) {
          timeValuePairs = [
            [wi.mintime, wi.minval],
            [wi.maxtime, wi.maxval]
          ];
        } else {
          timeValuePairs = [
            [wi.maxtime, wi.maxval],
            [wi.mintime, wi.minval]
          ];
        }
        for (const [t, v] of timeValuePairs) {
          const y = valueScalify(v);
          const x = t * timeScale - xOffset;
          if (firstIteration) {
            wglu.begin_line(x, y);
            firstIteration = false;
          } else {
            wglu.line_to(x, y, lineWidth, line_color, true);
          }
        }
        console.log("ANALOG ZOOM_COMPRESSION");
        continue;
      }

      const y1 = valueScalify(v1);
      const x1 = t1 * timeScale - xOffset;
      if (firstIteration) {
        wglu.begin_line(x1, y1);
        firstIteration = false;
      } else {
        wglu.line_to(x1, y1, lineWidth, line_color, true);
      }
    }
    wglu.end_line();
  }

  /**
   * plot the time axis to the waveform display.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {number} yOffset - The vertical offset (pixels from top)
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   */
  drawAxis(ctx, xOffset, timeScale) {
    // Always draw the axis 25px above the bottom edge of the canvas
    const axisY = this.canvas.height - Config.axisHeight;

    // Clear the axis area
    ctx.fillStyle = "#222";
    ctx.fillRect(0, axisY, this.canvas.width, this.canvas.height - axisY);

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
    let timeStep = Math.pow(10, -orderOfMagnitude) * 100;
    if (timeStep * timeScale > 200) {
      timeStep = timeStep / 2;
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

  /**
   * Draw the cursor on the waveform display.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {number} cursorTime - The time of the cursor in simulation time units
   * @param {number} xOffset - The horizontal offset (pixels from top)
   * @param {number} timeScale - Ratio: simulation time units per pixel
   */
  drawCursor(ctx, cursorTime, xOffset, timeScale) {
    // Draw the cursor line at the current cursor time
    const x = cursorTime * timeScale - xOffset;
    if (x < 0 || x > this.canvas.width) {
      return; // Cursor is out of bounds
    }

    ctx.strokeStyle = "rgba(251, 255, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.canvas.height);
    ctx.stroke();
  }

  /**
   * Request a render of the waveform display.
   *
   * render() is called from different event which could be called (more or less) at the
   * same time (like scrolling and resize). This requestRender garantees that render():
   *  - not to be called too frequently
   *  - to update and to be coerent with all request
   */
  requestRender() {
    if (!this._renderScheduled) {
      this._renderScheduled = true;
      window.requestAnimationFrame(() => {
        this._renderScheduled = false;
        this.render();
      });
    }
  }
}
