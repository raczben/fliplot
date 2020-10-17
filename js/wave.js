'use strict';
import {
  config
} from './interact.js';
import {
  now,
  waveformDB,
  getTimeAtI, 
  getValueAtI,
  getValueAt,
  simDB
} from './core.js';

var zoom = d3.zoom();
var x_grid = d3.axisBottom();
var x_axis = d3.axisBottom();

var initialTimeScale = d3.scaleLinear();
var timeScale = d3.scaleLinear();
var renderTimeScale = d3.scaleLinear();
var bitWaveScale = d3.scaleLinear();

var renderRange = [];
var renderDomain = [];

function init() {
  renderRange = [0, now];
  renderDomain = [0, now];

  renderTimeScale
    .domain(renderDomain)
    .range(renderRange);
  initialTimeScale
    .domain([0, now])
    .range([0, now]);
  timeScale
    .domain([0, now])
    .range([0, now]);
  bitWaveScale
    .domain([0, 1])
    .range([config.rowHeight - config.bitWavePadding, config.bitWavePadding]);
}

/* Debug variables */
var dbg_enableUpdateRenderRange = true;
var dbg_enableRender = true;

export function dbg_setEnableUpdateRenderRange(val){
  dbg_enableUpdateRenderRange = val;
}

export function dbg_setEnableRender(val){
  dbg_enableRender = val;
}

/* index definitions for render data */
const WAVEARRAY = 0;
const IDX = 1;

/******************************************************************************
 * 
 * EXPORTED API FUNCTIONS
 * 
 ******************************************************************************/

/**
 * Zoom fit: show whole data in the screen. Now will be at the right edge of the window.
 */
export function zoomFit() {
  var width = $("#wave-axis-container").width();
  // The average change should be ~20px;
  var scale = (width - 202) / now;

  var autozoom = d3.zoomIdentity;
  autozoom.k = scale;

  d3.select("#wave-axis-container")
    .call(zoom.transform, autozoom);
}

/**
 * Zoom in: show more details
 */
export function zoomIn() {
  zoom.scaleBy(d3.select("#wave-axis-container"), 1.3);
}

/**
 * Zoom out: show more overview-ed view
 */
export function zoomOut() {
  zoom.scaleBy(d3.select("#wave-axis-container"), 1 / 1.3);
}

/**
 * Autoscale: scale to show enough detail for humans
 */
export function zoomAutoscale() {
  var signals = simDB.signals

  if(signals.length > 0) {
    // Average wave change times
    var avgDelta = signals.reduce((acc, signal) => {
      if (signal.wave.length) {
        return acc + now / signal.wave.length
      } else {
        return 1;
      }
    }, 0) / signals.length;

    // The average change should be ~20px;
    var scale = 500 / avgDelta;

    var autozoom = d3.zoomIdentity;
    autozoom.k = scale;

    console.log(`avgDelta: ${avgDelta}`);
    console.log(`scale: ${scale}`);
    console.log(autozoom);

    d3.select("#wave-axis-container")
      .call(zoom.transform, autozoom);
  }
}

/**
 * Updates the render-range.
 * 
 * The render range contains the time/pixel range which must be rendered. (which are visible)
 */
function updateRenderRange(){
  if(dbg_enableUpdateRenderRange) {
    const wrapper = d3.select('#wave-axis-container');

    const visibleWidth = wrapper.node().getBoundingClientRect().width,
      visibleLeft = wrapper.node().scrollLeft,
      visibleRight = visibleLeft + visibleWidth;

    renderRange = [visibleLeft-200, visibleRight+200];
    renderDomain = [timeScale.invert(renderRange[0]), timeScale.invert(renderRange[1])];
    renderTimeScale
      .range(renderRange)
      .domain(renderDomain);
    console.log(renderRange)
    console.log(renderDomain)
  }
}

/**
 * Update the axis
 */
function updateAxis(){
  const rangeWidth = renderTimeScale.range()[1]-renderTimeScale.range()[0];

  x_axis
    .scale(renderTimeScale)
    .ticks(rangeWidth/150);
  d3.select('#time-axis-gr').call(x_axis);

  x_grid.scale(renderTimeScale)
    .ticks(rangeWidth/300);
  d3.select('#grid-gr').call(x_grid);

}

/******************************************************************************
 * 
 * D3 CALLBACK FUNCTIONS
 * 
 ******************************************************************************/

/**
 * Zoom end called after the d3 zoom event.
 * 
 * `end` event is emitted when no wheel events are received for 150ms.
 * This function do an exact render.
 */
function zoom_end() {
  console.log(d3.event);
  drawWave2();
}

/**
 * Called by the d3 zoom at all zoom event.
 * 
 * zoom_fast do sort and fast transformation. The exact re-render is done by the zoom_end at the
 * end of the zoom.
 */
function zoom_fast() {
  console.log(d3.event);

  const wrapper = d3.select('#wave-axis-container');
  timeScale.range([0, now*d3.event.transform.k]);

  d3.select('#mainSVG')
  .attr('width', d3.event.transform.k * (now) + 200);
  
  // Move scrollbars.
  wrapper.node().scrollLeft = -d3.event.transform.x;

  updateRenderRange();
  
  // Fast Zoom:
  d3.selectAll('.time-scale-group')
    .attr('transform', 'scale(' + d3.event.transform.k + ',1)');  

  updateAxis();

  d3.selectAll('#cursorGr')
    .attr('transform', 'scale(' + d3.event.transform.k + ',1)');  
    
  d3.selectAll('.bus-value')
    .attr('x', d => timeScale(getTimeAtI(d[WAVEARRAY], d[IDX]) + getTimeAtI(d[WAVEARRAY], d[IDX]+1))/2)
      
}

/**
 * Called by d3, when the waveform is scrolled left/right (aka. in time).
 */
function scrolled() {
  const wrapper = d3.select('#wave-axis-container');
  d3.zoomTransform(wrapper.node()).x = -wrapper.node().scrollLeft;
  
  updateRenderRange();
  updateAxis();
}


/******************************************************************************
 * 
 * RENDER FUNCTIONS
 * 
 ******************************************************************************/

/**
 * Remove all signals from the waveform table.
 */
export function removeAllSignals(){
  d3.select('#mainGr').selectAll("*").remove();
  d3.select('#names-col').selectAll("*").remove();
  d3.select('#values-col').selectAll("*").remove();
}

/**
 * Generate waveform table.
 *
 * Adds all signals to table. Adds to names- values- and waves-column.
 * 
 * @param {Object} signals is the drawing database, which contains the signals to be added.
 */
function generateTable() {

  zoom
    .scaleExtent([200 / timeScale(now), 20])
    .on("zoom", zoom_fast).filter(
      // Use Ctrl+Wheel, with mouse to zoom (simple wheel will scrolls up/down)
      // Or use touch gesture on touch devices
      () => d3.event.ctrlKey | d3.event.type.startsWith("touch"))
    .on("end", zoom_end);

  // zoom
  d3.select("#wave-axis-container")
    .on('scroll', scrolled)
    .call(zoom)
    .on("wheel", () => {
      if (d3.event.ctrlKey)
        d3.event.preventDefault()
    })

  removeAllSignals();

  d3.select('#mainSVG')
    .attr('width', now + 200)
    .attr('height', config.rowHeight * (waveformDB.rows.length+1));

  const mainGr = d3.select('#mainGr');
  
  mainGr.append('g')
    .attr('id', 'grid-gr')
    .attr('transform', `translate(0, ${config.rowHeight * waveformDB.rows.length})`);

  const signalsTable = mainGr.append('g')
    .attr('id', 'signals-table');

  const signalRow = signalsTable.selectAll('.signalRow')
    .data(waveformDB.rows)
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(0, ${i * config.rowHeight})`)
    .attr('id', d => `signalRow_${d.id}`)
    .attr('class', d => `signalRow ${d.id}`);

  const timeScaleGroup = signalRow.append('g')
    .attr('class', 'time-scale-group');

  var namesCol = d3.select('#names-col');

  namesCol.selectAll('.signal-name')
    .data(waveformDB.rows)
    .enter()
    .append('li')
    .attr('id', d => `signalName_${d.id}`)
    .attr('class', d => `signal-name ${d.id} signal-highlighter`)
    .text(d => d.name)
    .on('click', function (d) {
      highlightSignal(d.id);
    });

  var valuesCol = d3.select('#values-col');

  valuesCol.selectAll('.signal-value')
    .data(waveformDB.rows)
    .enter()
    .append('div')
    .attr('id', d => `signalName_${d.id}`)
    .attr('class', d => `signal-value ${d.id} signal-highlighter`)
    .on('click', function (d) {
      highlightSignal(d.id);
    });

  timeScaleGroup
    .append('g')
    .attr('id', d => `signalWave_${d.id}`)
    .attr('class', () => `signalWave`);

  signalRow
    .append('g')
    .attr('class', 'signalValues');

  timeScaleGroup
    .append('g')
    .attr('class', 'signal-highlighter-group')
    .append('rect')
    .attr('class', 'signal-highlighter')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', initialTimeScale(now))
    .attr('height', config.rowHeight)
    .on('click', function (d) {
      highlightSignal(d.id);
    });
      
  mainGr.append('g')
    .attr('id', 'time-axis-gr')
    .attr('transform', () => `translate(0, ${config.rowHeight * waveformDB.rows.length})`);
    
  const timeAxisGr = d3.select('#time-axis-gr');
  x_axis.scale(timeScale);
  x_grid
    .tickSize(-config.rowHeight * waveformDB.rows.length)
    .tickFormat("");
  timeAxisGr.call(x_axis);

  mainGr.append('g')
    .attr('id', 'cursorGr');

  d3.select('#cursorGr').append('line')
    .classed('cursor', true)
    .attr('id', 'main-cursor')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('y1', 0)
    .attr('y2', config.rowHeight * waveformDB.rows.length);

  d3.select('#mainGr').on("click", function() {
      const click_time = timeScale.invert(d3.mouse(this)[0]);
      moveCursorTo(click_time);
  });

}


/**
 * Re-order the signals in the waveform.
 *
 * Updates the signals' order in both names-col, values-col and mainGr
 * 
 * @param {Object} signals contains the signals in the *wanted* order
 */
function reOrderSignals(signals) {
  function reOrder(containerSelector, childSelector) {
    // originalSignals: contains the signals in the *original* order
    var originalSignals = d3.select(containerSelector).selectAll(childSelector).data();
    // indexMapping: contains the original indexes in the wanted order.
    var indexMapping = signals.map(x => originalSignals.indexOf(x));

    var containerElement = $(containerSelector);
    var childrenList = containerElement.children(childSelector);
    containerElement.append($.map(indexMapping, v => childrenList[v]));
  }

  reOrder('#names-col', '.signal-name');
  reOrder('#values-col', '.signal-value');
  reOrder('#signals-table', '.signalRow');

  d3.select('#mainSVG').selectAll('.signalRow')
    .attr('transform', (d, i) => {
      return `translate(0, ${i * config.rowHeight})`
    });
}


/**
 * Show signal names in the names-col
 */
function fillSignalNames() {
    d3.selectAll('.signal-name')
      .append("text")
      .attr("y", config.rowHeight / 2)
      .attr("x", 10)
      .attr('text-anchor', 'left')
      .attr('alignment-baseline', 'central')
      .attr("class", "signalNameText")
      .text(d => d.signal.name);
  }
  
  
/**
 * Show values in the values column at the given simulation-time.
 *
 * @param {int} time the simulation time at the values must be shown.
 */
function showValuesAt(time) {
  d3.selectAll('.signal-value')
    .text(d => getValueAt(d.signal, time));
}

/**
 * Renred all singals in the waveform
 */
function drawWave2() {
  if(dbg_enableRender) {
    d3.selectAll('.signalRow')
      .each(function () {
        drawWave(d3.select(this));
      });
  }
}

/**
 * Render the given signal
 * 
 * @param {d3 Object} signalWaveSVG is the d3 object to be render
 */
function drawWave(timeScaleGroup) {

  const signalWaveSVG = timeScaleGroup.select('.signalWave')
  const signalValuesSVG = timeScaleGroup.select('.signalValues')
  const rowData = signalWaveSVG.datum();

  function parseIntDef(intToPare, def=0.5) {
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
  
  var waveChangesIndex = rowData.signal.wave.reduce((res, current, i, waveArr) => {
    if (waveIInRenderRange(waveArr, i)) {
      res.push([waveArr, i]);
    }
    return res;
  }, []);

  // console.log(waveChangesIndex);
  signalWaveSVG.classed(`wave-style-${rowData.waveStyle}`, true);

  if (rowData.waveStyle == 'bit') {

    // horizontal aka. timeholder:
    const timeholders = signalWaveSVG.selectAll('.timeholder')
      .data(waveChangesIndex);

    timeholders.exit().remove();

    timeholders.enter()
      .append('line')
      .classed('timeholder', true);

    // vertical aka. valuechanger
    const valuechanger = signalWaveSVG.selectAll('.valuechanger')
      .data(waveChangesIndex.slice(1));

    valuechanger.exit().remove();

    valuechanger.enter()
      .append('line')
      .classed('valuechanger', true);

    // transparent rect
    const transRect = signalWaveSVG.selectAll('.transparent-rect')
      .data(waveChangesIndex);
      
    transRect.exit().remove();
      
    transRect.enter()
      .append('rect')
      .classed('transparent-rect', true);
    
    signalWaveSVG.selectAll('.transparent-rect')
      .attr('x', d => initialTimeScale(getTimeAtI(d[WAVEARRAY], d[IDX])))
      .attr('y', d => bitWaveScale(parseIntDef(getValueAtI(d[WAVEARRAY], d[IDX]))))
      .attr('width', d => initialTimeScale((getTimeAtI(d[WAVEARRAY], d[IDX]+1)) - getTimeAtI(d[WAVEARRAY], d[IDX])))
      .attr('height', d => bitWaveScale(1-parseIntDef(getValueAtI(d[WAVEARRAY], d[IDX]))) - 2 )
      .style("fill", d => value2Color(getValueAtI(d[WAVEARRAY], d[IDX])));

    signalWaveSVG.selectAll('.timeholder')
      .attr('x1', d => initialTimeScale(getTimeAtI(d[WAVEARRAY], d[IDX])))
      .attr('y1', d => bitWaveScale(parseIntDef(getValueAtI(d[WAVEARRAY], d[IDX]))))
      .attr('x2', d => initialTimeScale(getTimeAtI(d[WAVEARRAY], d[IDX]+1)))
      .attr('y2', d => bitWaveScale(parseIntDef(getValueAtI(d[WAVEARRAY], d[IDX]))))
      .style("stroke", d => value2Color(getValueAtI(d[WAVEARRAY], d[IDX])))
      .attr('vector-effect', 'non-scaling-stroke');

    signalWaveSVG.selectAll('.valuechanger')
      .attr('x1', d => initialTimeScale(getTimeAtI(d[WAVEARRAY], d[IDX])))
      .attr('y1', d => bitWaveScale(parseIntDef(d[WAVEARRAY][d[IDX]-1].val)))
      .attr('x2', d => initialTimeScale(getTimeAtI(d[WAVEARRAY], d[IDX])))
      .attr('y2', d => bitWaveScale(parseIntDef(getValueAtI(d[WAVEARRAY], d[IDX]))))
      .style("stroke", d => value2Color(getValueAtI(d[WAVEARRAY], d[IDX])))
      .attr('vector-effect', 'non-scaling-stroke');

  } else if (rowData.waveStyle == 'bus') {
    const busPath = signalWaveSVG.selectAll('path')
      .data(waveChangesIndex);
      
    signalValuesSVG.selectAll('.bus-value-group').remove();
    const busValue = signalValuesSVG.selectAll('.bus-value-group')
      .data(waveChangesIndex);

    busPath.exit().remove();
    busValue.exit().remove();

    busPath.enter()
      .append('path')
      .classed('bus-path', true);
    busValue.enter()
      .append('g')
      .classed('bus-value-group', true)
      .append('text')
      .classed('bus-value', true);

    signalWaveSVG.selectAll('.bus-path')
      .attr('vector-effect', 'non-scaling-stroke')
      .style("stroke", d => value2Color(getValueAtI(d[WAVEARRAY], d[IDX])))
      .style("fill", d => value2Color(getValueAtI(d[WAVEARRAY], d[IDX])))
      .style("stroke-width", "2")
      .attr('d', d => {
        var ret = '';
        ret += `M${(getTimeAtI(d[WAVEARRAY], d[IDX]+1)) - (timeScale.invert(2))},${bitWaveScale(1)} `
        ret += `${(getTimeAtI(d[WAVEARRAY], d[IDX])) + (timeScale.invert(2))},${bitWaveScale(1)} `
        ret += `${(getTimeAtI(d[WAVEARRAY], d[IDX]))},${bitWaveScale(0.5)} `
        ret += `${(getTimeAtI(d[WAVEARRAY], d[IDX])) + (timeScale.invert(2))},${bitWaveScale(0)} `
        ret += `${(getTimeAtI(d[WAVEARRAY], d[IDX]+1)) - (timeScale.invert(2))},${bitWaveScale(0)} `
        if (getTimeAtI(d[WAVEARRAY], d[IDX]+1) < now) {
          ret += `${getTimeAtI(d[WAVEARRAY], d[IDX]+1)},${bitWaveScale(0.5)} `
          ret += `${getTimeAtI(d[WAVEARRAY], d[IDX]+1) - (timeScale.invert(2))},${bitWaveScale(1)} `
        }
        return ret;
      });
      
    d3.selectAll('.bus-value')
      .text(d => getValueAtI(d[WAVEARRAY], d[IDX]))
      .attr("y", config.rowHeight / 2)
      .attr('x', d => timeScale(getTimeAtI(d[WAVEARRAY], d[IDX]) + getTimeAtI(d[WAVEARRAY], d[IDX]+1))/2)
      .each(function(d){
      wrap_fast(this, timeScale(getTimeAtI(d[WAVEARRAY], d[IDX]+1) - getTimeAtI(d[WAVEARRAY], d[IDX])));
    });
      
  } else {

    signalWaveSVG
      .append('rect')
      .attr('height', config.rowHeight)
      .attr('width', now)
      .attr('fill', 'rgba(180, 0, 0, 0.5)');
    signalWaveSVG.append('text')
      .text(`Unsupported waveStyle: ${rowData.waveStyle}`)
      .attr("y", config.rowHeight / 2)
      .attr("x", 10)
      .attr('text-anchor', 'left')
      .attr('alignment-baseline', 'middle');
    return;
  }
}


/******************************************************************************
 * 
 * OTHER / UTIL FUNCTIONS
 * 
 ******************************************************************************/

/**
 * Fast wrap of svg text. Exact wrap can be done as this:
 * https://stackoverflow.com/a/27723752/2506522
 * 
 * @param {*} element DOM-SVG text element which should be wrapped
 * @param {*} width the pixel width of the maximum text length.
 */
function wrap_fast(element, width) {
  element = d3.select(element);
  const maxCharLen = (width/10)-1;
  var text = element.text();
  if(text.length > maxCharLen){
      text = text.slice(0, maxCharLen);
      element.text(text + '...');
  }
}

export function moveCursorTo(sim_time){
  d3.select('#cursorGr').select('#main-cursor')
  .datum(sim_time)
  .attr('x1', d => d)
  .attr('x2', d => d);
  
  showValuesAt(sim_time);
}

export function getHighlightedSignal(){
  var sig = d3.select('.signal-name.highlighted-signal').datum();
  console.log(sig);
  return sig;
}

export function getCursorTime(){
  var t = d3.select('#main-cursor').datum();
  console.log(t);
  return t;
}

/**
 * applies the JQuery-UI sortable to names-col
 */
$("#names-col").sortable({
    update: function () {
      reOrderSignals(d3.select("#names-col").selectAll('.signal-name').data());
    }
});
  
/**
 * applies the JQuery-UI sortable to values-col
 */
$("#values-col").sortable({
    update: function () {
      reOrderSignals(d3.select("#values-col").selectAll('.signal-value').data());
    }
});

/**
 * Highlight a given signal. The highlighted signal has vivid blue background color, and the cursor
 * will step on this signal's transients.
 * 
 * @param {string} signalID The ID of the signal that has to be highlighted 
 */
function highlightSignal(signalID){
  d3.selectAll('.highlighted-signal').classed('highlighted-signal', false);
  d3.selectAll(`.${signalID}`).classed('highlighted-signal', true);
}

  
function isInt(value) {
    return !isNaN(value) &&
      parseInt(Number(value)) == value &&
      !isNaN(parseInt(value, 10));
  }

/**
 * Filter value change elements, pass which are inside the rendering region.
 *
 * @param {Object} waveChange a wave change element, to filter
 * @return {boolean} true if the waveChange element inside the rendering region.
 */
function waveIInRenderRange(wave, i){
  var t0 = getTimeAtI(wave, i),
    t1 = getTimeAtI(wave, i+1),
    domainMin = d3.min(renderTimeScale.domain()),
    domainMax = d3.max(renderTimeScale.domain());

  return t0 <= domainMax && t1 >= domainMin;
}


export function showSignals() {
  init();
  generateTable();
  fillSignalNames();
  moveCursorTo(0);
  zoomAutoscale();
}
