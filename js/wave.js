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
