const { binarySearch, isInt, ceiln } = require('./util.js');

describe('binarySearch', () => {
  const arr = [1, 3, 5, 7, 9];
  const cmp = (a, b) => a - b;

  test('finds existing element', () => {
    expect(binarySearch(arr, 5, cmp)).toBe(2);
    expect(binarySearch(arr, 1, cmp)).toBe(0);
    expect(binarySearch(arr, 9, cmp)).toBe(4);
  });

  test('returns insertion point for missing element', () => {
    expect(binarySearch(arr, 2, cmp)).toBe(-2);
    expect(binarySearch(arr, 8, cmp)).toBe(-5);
    expect(binarySearch(arr, 0, cmp)).toBe(-1);
    expect(binarySearch(arr, 10, cmp)).toBe(-6);
  });
});

describe('isInt', () => {
  test('returns true for integers', () => {
    expect(isInt(5)).toBe(true);
    expect(isInt('10')).toBe(true);
    expect(isInt(0)).toBe(true);
    expect(isInt(-3)).toBe(true);
  });

  test('returns false for non-integers', () => {
    expect(isInt(3.14)).toBe(false);
    expect(isInt('abc')).toBe(false);
    expect(isInt(NaN)).toBe(false);
    expect(isInt(undefined)).toBe(false);
    expect(isInt(null)).toBe(false);
  });
});

describe('ceiln', () => {
  test('rounds up to nearest multiple', () => {
    expect(ceiln(7, 5)).toBe(10);
    expect(ceiln(12, 4)).toBe(12);
    expect(ceiln(13, 4)).toBe(16);
    expect(ceiln(0, 3)).toBe(0);
    expect(ceiln(-2, 3)).toBe(-0);
  });
});