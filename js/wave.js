'use strict';
import {
  config,
  updateHighlighterListener,
  highlightSignal,
  deHighlightSignal,
  openSignalGroup,
  closeSignalGroup
} from './interact.js';
import {
  waveformDB,
} from './core/WaveformDB.js';
import {
  simDB,
} from './core.js';
import { WaveTable } from './wave_table/WaveTable.js';


export const waveTable = new WaveTable();


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
  d3.select('#names-col-container-scroll').selectAll("*").remove();
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

  removeAllSignals();
  
    /*
     * Signal names
     */
    waveTable.reload();

  // updateHighlighterListener();
}


/**
 * Re-order the signals in the waveform.
 *
 * Updates the signals' order in both names-col-container-scroll, values-col and mainGr
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
 * Show values in the values column at the given simulation-time.
 *
 * @param {int} time the simulation time at the values must be shown.
 */
function showValuesAt(time) {
  waveTable.valueCol.showValuesAt(time);
}


export function showSignals(reset = true) {
  if(reset){
    waveTable.wave.init();
  }

  generateTable();
  // fillSignalNames();
  
  setTimeout(() => {
    if(reset){
      waveTable.moveCursorTo(0);
      waveTable.wave.zoomAutoscale();
    } else{
      waveTable.moveCursorTo(0); //TODO
      zoom.scaleBy(d3.select("#wave-axis-container"), 1.0);
    }
  }, 0)
}
