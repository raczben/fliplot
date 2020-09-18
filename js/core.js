
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
