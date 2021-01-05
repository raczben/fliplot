/**
 * Value change type builds up the wave list of the signal. Each element describes a value change of
 * a signal.
 * 
 * @typedef {Object} valueChange_t 
 * @property {number} time Simulation time in the unit of the simulation timePrecision.
 * @property {string} bin The raw value in binary form. Each character represents a bit in the
 *      bitvector. All other (optional) value format is derived from this.
 * @property {string} [hex] A derived value from raw bin. Optional: calculated only when the user
 *      wants to see hex values. Each hex digit will be X and Z if there is an X or Z bit value in
 *      its region.
 * @property {number} [u30] Fixed point float number. First character (s/u) note signed and unsigned
 *      format. The number of bits used to represent the fraction value (the number of bits below the
 *      decimal point) This means, that u0 means that the whole bitvector represents a fixed point
 *      unsigned integer. Note, that the full word length is defined at signal level. Derived,
 *      optional as above. Note, that if any X or Z located in the raw binary format, this value
 *      will be NaN.
 * @property {number} [float] Single point float number. Derived, optional as above.
 * @property {number} [double] Double point float number. Derived, optional as above.
*/

  
/******************************************************************************
 * 
 * Get time and value
 * 
 ******************************************************************************/

/******************************************************************************
 * 
 * Interface API
 * 
 ******************************************************************************/

import {
    SimDB
  } from './core/SimDB.js';

  
/**
 * This function returns simulation time of the previous/next (arbirtary) transitition of the given
 * signal.
 * 
 * @param {Signal} signal 
 * @param {number} time 
 * @param {number} deltaTransition 
 */
export function getTimeAnyTransition(signal, time, deltaTransition) {
    const idx = signal.getChangeIndexAt(time);
    if(deltaTransition < 0){
        // previous nth change
        const changeT = signal.getTimeAtI(idx);
        if(changeT != time){
            // cursor is not located at value change
            deltaTransition++;
        }
    }
    const t = signal.getTimeAtI(idx+deltaTransition);
    console.log(t)
    return t;
}


/******************************************************************************
 * 
 * OTHER / UTIL FUNCTIONS
 * 
 ******************************************************************************/

// The static / global instance:
export var simDB = new SimDB();
simDB.now = -2;