
export var drawDB = {};
export var now = -1;

export function setDrawDB(db, n){
    drawDB = db;
    now = n;
}

export function getTimeAtI(vcdArr, i) {
    if (i < 0){
        throw 'Negative index';
    }
    if (i < vcdArr.length){
        return vcdArr[i].time;
    }
    if (i == vcdArr.length){
        return now;
    }
    else {
        throw 'Index is too great';
    }
}

export function getValueAtI(vcdArr, i) {
    if (i < 0){
        throw 'Negative index';
    }
    if (i >= vcdArr.length){
        i = vcdArr.length -1;
    }
    return vcdArr[i].val;
}

export function updateDBNow(){
    // now = db.now;
    return;
    drawDB.forEach(element => {
        var wave = element.wave;
        if(wave.length == 0){
            // Empty array
            wave.push({time:now});
            return;
        }
        if(wave[wave.length-1].val == now){
            // There is a (real or phantom) change at now
            return;
        }
        if(wave[wave.length-1].val === undefined){
            // Update now value
            wave[wave.length-1].time = now;
            return;
        }
        else{
            // Append the phantom now value.
            wave.push({time:now});
            return;
        }
    });
}

export function updateDBInitialX(){
    drawDB.forEach(element => {
        var wave = element.wave;
        if(wave.length == 0){
            // Empty array
            wave.push({time:0, val:'x'});
            return;
        }
        if(wave[0].time != 0){
            // Append the phantom zero-th value.
            wave.unshift({time:0, val:'x'});
        }
    });
}

/*
 * Binary search in JavaScript.
 * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point for the new element.
 * Parameters:
 *     ar - A sorted array
 *     el - An element to search for
 *     compare_fn - A comparator function. The function takes two arguments: (a, b) and returns:
 *        a negative number  if a is less than b;
 *        0 if a is equal to b;
 *        a positive number of a is greater than b.
 * The array may contain duplicate elements. If there are more than one equal elements in the array,
 * the returned value can be the index of any one of the equal elements.
 *
 * https://stackoverflow.com/a/29018745/2506522
 */
function binarySearch(ar, el, compare_fn) {
    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
      var k = (n + m) >> 1;
      var cmp = compare_fn(el, ar[k]);
      if (cmp > 0) {
        m = k + 1;
      } else if (cmp < 0) {
        n = k - 1;
      } else {
        return k;
      }
    }
    return -m - 1;
}
  
  
export function getChangeIndexAt(signal, time) {
    var idx = binarySearch(signal.wave, time, (time, wave) => {
      return time - wave.time;
    })
    if (idx < 0) {
      idx = -idx - 2;
    }
    return idx;
}
  
  
export function getValueAt(signal, time, def='- NA -') {
    try {
        const idx = getChangeIndexAt(signal, time);
        const wave = signal.wave[idx];
        return wave.val;
      }
      catch (err) {
        return def;
      }
}
  