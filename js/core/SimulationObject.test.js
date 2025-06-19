const { SimulationObject } = require('./SimulationObject.js');
const { Signal } = require('./Signal.js');

describe('SimulationObject', () => {
  const wave = [
    { time: 0, bin: '0' },
    { time: 10, bin: '1' },
    { time: 20, bin: '0' }
  ];
  const sigObj = {
    references: ['sig'],
    vcdid: 'v1',
    type: 'wire',
    wave: wave,
    width: 1
  };

  let simObj;
  beforeEach(() => {
    simObj = new SimulationObject(SimulationObject.Type.SIGNAL, ['top', 'sig'], sigObj, null);
  });

  test('constructor initializes properties', () => {
    expect(simObj.type).toBe(SimulationObject.Type.SIGNAL);
    expect(simObj.hierarchy).toEqual(['top', 'sig']);
    expect(simObj.signal).toBeInstanceOf(Signal);
    expect(simObj.parent).toBeNull();
    expect(simObj.definedAt).toBeUndefined(); // sigObj has no definedAt
  });

  test('getChangeIndexAt delegates to signal', () => {
    expect(simObj.getChangeIndexAt(0)).toBe(0);
    expect(simObj.getChangeIndexAt(15)).toBe(1);
  });

  test('getValueAt delegates to signal', () => {
    expect(simObj.getValueAt(0, 'bin')).toBe('0');
    expect(simObj.getValueAt(10, 'bin')).toBe('1');
  });

  test('getValueAtI delegates to signal', () => {
    expect(simObj.getValueAtI(2, 'bin')).toBe('0');
  });

  test('getTimeAtI delegates to signal', () => {
    global.simDB = { now: 1000 };
    expect(simObj.getTimeAtI(0)).toBe(0);
    expect(simObj.getTimeAtI(2)).toBe(20);
  });

  test('cloneRange creates a new SimulationObject with correct hierarchy and signal', () => {
    const clone = simObj.cloneRange(1, 2);
    expect(clone).toBeInstanceOf(SimulationObject);
    expect(clone.hierarchy).toEqual(['top', 'sig', '[2:1]']);
    expect(clone.signal).toBeInstanceOf(Signal);
    expect(clone.parent).toBe(simObj);
  });

  test('getTimeAnyTransition returns correct transition time', () => {
    global.simDB = { now: 1000 };
    // At time 10, next transition (deltaTransition=1) is at 20
    expect(simObj.getTimeAnyTransition(10, 1)).toBe(20);
    // At time 10, previous transition (deltaTransition=-1) is at 0
    expect(simObj.getTimeAnyTransition(10, -1)).toBe(0);
    // At time 15 (between transitions), previous transition is at 10
    expect(simObj.getTimeAnyTransition(15, -1)).toBe(10);
  });
});