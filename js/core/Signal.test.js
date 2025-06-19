const { Signal } = require('./Signal.js');

// Mocking the global simDB object
const now = 1234.5678;

describe('Signal', () => {
  const wave = [
    { time: 0, bin: '0' },
    { time: 10, bin: '1' },
    { time: 20, bin: 'x' },
    { time: 30, bin: 'z' }
  ];
  const sigObj = {
    references: ['sig'],
    vcdid: 'v1',
    type: 'wire',
    wave: wave,
    width: 1
  };

  let signal;
  beforeEach(() => {
    signal = new Signal(sigObj);
  });

  test('getChangeIndexAt returns correct index', () => {
    expect(signal.getChangeIndexAt(0)).toBe(0);
    expect(signal.getChangeIndexAt(5)).toBe(0);
    expect(signal.getChangeIndexAt(10)).toBe(1);
    expect(signal.getChangeIndexAt(15)).toBe(1);
    expect(signal.getChangeIndexAt(20)).toBe(2);
    expect(signal.getChangeIndexAt(25)).toBe(2);
  });

  test('getValueAtI returns correct value', () => {
    expect(signal.getValueAtI(0, 'bin')).toBe('0');
    expect(signal.getValueAtI(1, 'bin')).toBe('1');
    expect(signal.getValueAtI(2, 'bin')).toBe('x');
    expect(signal.getValueAtI(3, 'bin')).toBe('z');
  });

  test('getValueAt returns correct value for time', () => {
    expect(signal.getValueAt(0, 'bin')).toBe('0');
    expect(signal.getValueAt(10, 'bin')).toBe('1');
    expect(signal.getValueAt(15, 'bin')).toBe('1');
    expect(signal.getValueAt(25, 'bin')).toBe('x');
  });

  test('getTimeAtI returns correct time', () => {
    expect(signal.getTimeAtI(0, now)).toBe(0);
    expect(signal.getTimeAtI(1, now)).toBe(10);
    expect(signal.getTimeAtI(2, now)).toBe(20);
    expect(signal.getTimeAtI(3, now)).toBe(30);
    expect(signal.getTimeAtI(4, now)).toBe(now); // simDB.now
  });

  test('getTimeAtI throws on negative index', () => {
    expect(() => signal.getTimeAtI(-1, now)).toThrow('Negative index');
  });

  test('getTimeAtI throws on too large index', () => {
    expect(() => signal.getTimeAtI(5, now)).toThrow('Index is too great');
  });

  test('getValueAtI returns default for negative index', () => {
    expect(signal.getValueAtI(-1, 'bin', 'default')).toBe('default');
  });

  test('cloneRange returns a new Signal with correct width', () => {
    const clone = signal.cloneRange(1, 2);
    expect(clone).toBeInstanceOf(Signal);
    expect(clone.width).toBe(2);
    expect(clone.wave).toEqual([]);
  });
});