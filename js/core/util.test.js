const { binarySearch, isInt, ceiln, bin2radix, mostUndefined } = require("./util.js");
const { truncateTextToWidth } = require("./util.js");

describe("binarySearch", () => {
  const arr = [1, 3, 5, 7, 9];
  const cmp = (a, b) => a - b;

  test("finds existing element", () => {
    expect(binarySearch(arr, 5, cmp)).toBe(2);
    expect(binarySearch(arr, 1, cmp)).toBe(0);
    expect(binarySearch(arr, 9, cmp)).toBe(4);
  });

  test("returns insertion point for missing element", () => {
    expect(binarySearch(arr, 2, cmp)).toBe(-2);
    expect(binarySearch(arr, 8, cmp)).toBe(-5);
    expect(binarySearch(arr, 0, cmp)).toBe(-1);
    expect(binarySearch(arr, 10, cmp)).toBe(-6);
  });
});

describe("isInt", () => {
  test("returns true for integers", () => {
    expect(isInt(5)).toBe(true);
    expect(isInt("10")).toBe(true);
    expect(isInt(0)).toBe(true);
    expect(isInt(-3)).toBe(true);
  });

  test("returns false for non-integers", () => {
    expect(isInt(3.14)).toBe(false);
    expect(isInt("abc")).toBe(false);
    expect(isInt(NaN)).toBe(false);
    expect(isInt(undefined)).toBe(false);
    expect(isInt(null)).toBe(false);
  });
});

describe("ceiln", () => {
  test("rounds up to nearest multiple", () => {
    expect(ceiln(7, 5)).toBe(10);
    expect(ceiln(12, 4)).toBe(12);
    expect(ceiln(13, 4)).toBe(16);
    expect(ceiln(0, 3)).toBe(0);
    expect(ceiln(-2, 3)).toBe(-0);
  });
});

describe("bin2radix ", () => {
  test("converts binary to hex", () => {
    expect(bin2radix("1010", "hex")).toBe("a");
    expect(bin2radix("1111", "hex")).toBe("f");
    expect(bin2radix("0000", "hex")).toBe("0");
    expect(bin2radix("001100", "hex")).toBe("0c");
    expect(bin2radix("0011x0", "hex")).toBe("0x");
    expect(bin2radix("0z1100", "hex")).toBe("zc");

    // invalid formats
    expect(bin2radix("", "hex")).toBe("");
  });

  test("converts binary to fixed point", () => {
    expect(bin2radix("1010", "u0")).toBe(10);
    expect(bin2radix("01111111", "s0")).toBe(127);
    expect(bin2radix("01000000", "s0")).toBe(64);
    expect(bin2radix("00000001", "s0")).toBe(1);
    expect(bin2radix("00000000", "s0")).toBe(0);
    expect(bin2radix("11111111", "s0")).toBe(-1);
    expect(bin2radix("10000001", "s0")).toBe(-127);
    expect(bin2radix("10000000", "s0")).toBe(-128);

    expect(bin2radix("01111100", "s4")).toBe(7.75);
    expect(bin2radix("01000000", "s8")).toBe(0.25);

    // invalid formats
    expect(bin2radix("1010x1", "u0")).toBe(NaN);
  });

  test("converts binary to single float", () => {
    expect(bin2radix("11000000000000000000000000000000", "float")).toBeCloseTo(-2, 10);
    expect(bin2radix("00000000000000000000000000000000", "float")).toBeCloseTo(0, 10);
    expect(bin2radix("00111110101010101010101010101011", "float")).toBeCloseTo(
      0.333333343267440796,
      10
    );
    expect(bin2radix("01000000010010010000111111011011", "float")).toBeCloseTo(
      3.14159274101257324,
      10
    );
    expect(bin2radix("01000001010001010111000010100100", "float")).toBeCloseTo(12.340000152587, 10);
    expect(bin2radix("00000000000000000000000000000000", "float")).toBeCloseTo(0.0, 10);
    expect(bin2radix("00111111100000000000000000000000", "float")).toBeCloseTo(1.0, 10);

    //invalid formats:
    expect(bin2radix("0011111110000000000000000000000", "float")).toBe(NaN);
    expect(bin2radix("0011111110000000000000000000000s", "float")).toBe(NaN);
  });

  test("converts binary to double", () => {
    expect(
      bin2radix("0011111111110000000000000000000000000000000000000000000000000000", "double")
    ).toBeCloseTo(1.0, 20);
    expect(
      bin2radix("0000000000000000000000000000000000000000000000000000000000000000", "double")
    ).toBeCloseTo(0, 20);
    expect(
      bin2radix("0011111111110000000000000000000000000000000000000000000000000010", "double")
    ).toBeCloseTo(1.0000000000000004441, 20);
    expect(
      bin2radix("0100000000000000000000000000000000000000000000000000000000000000", "double")
    ).toBeCloseTo(2, 20);
    expect(
      bin2radix("1100000000000000000000000000000000000000000000000000000000000000", "double")
    ).toBeCloseTo(-2, 20);
    expect(
      bin2radix("0100001101111011011010011011010010111010110011010000010111110001", "double")
    ).toBeCloseTo(123456789123456789, 20);
    expect(
      bin2radix("1100001101111011011010011011010010111010110011010000010111110001", "double")
    ).toBeCloseTo(-123456789123456789, 20);

    //invalid formats:
    expect(
      bin2radix("110000110111101101101001101101001011101011001101000001011111000", "double")
    ).toBe(NaN);
    expect(
      bin2radix("110000110111101101101001101101001011101011001101000001011111000s", "double")
    ).toBe(NaN);
  });
});

describe("truncateTextToWidth", () => {
  // Mock CanvasRenderingContext2D
  function mockCtx(charWidth = 10, ellipsisWidth = 10) {
    return {
      measureText: (str) => ({
        width: str === "…" ? ellipsisWidth : str.length * charWidth
      })
    };
  }

  test("returns original string if it fits", () => {
    const ctx = mockCtx(10);
    expect(truncateTextToWidth(ctx, "abc", 30)).toBe("abc");
    expect(truncateTextToWidth(ctx, "abc", 31)).toBe("abc");
  });

  test("returns original string if width <= ellipsisWidth", () => {
    const ctx = mockCtx(10, 40);
    expect(truncateTextToWidth(ctx, "abc", 30)).toBe("abc");
  });

  test("truncates and adds ellipsis if string too wide", () => {
    const ctx = mockCtx(10);
    expect(truncateTextToWidth(ctx, "abcdef", 45)).toBe("abc…");
    expect(truncateTextToWidth(ctx, "abcdef", 35)).toBe("ab…");
    expect(truncateTextToWidth(ctx, "abcdef", 25)).toBe("a…");
    expect(truncateTextToWidth(ctx, "abcdef", 15)).toBe("…");
  });

  test("returns original string if maxWidth is very large", () => {
    const ctx = mockCtx(10);
    expect(truncateTextToWidth(ctx, "abcdef", 1000)).toBe("abcdef");
  });

  test("handles empty string", () => {
    const ctx = mockCtx(10);
    expect(truncateTextToWidth(ctx, "", 4)).toBe("");
    expect(truncateTextToWidth(ctx, "", 10)).toBe("…");
  });
});

describe("mostUndefined", () => {
  test("mostUndefined", () => {
    expect(mostUndefined("0")).toBe("0");
    expect(mostUndefined("1")).toBe("0");
    expect(mostUndefined("112345")).toBe("0");
    expect(mostUndefined("x")).toBe("x");
    expect(mostUndefined("xxxx")).toBe("x");
    expect(mostUndefined("z")).toBe("z");
    expect(mostUndefined("zzzz")).toBe("z");
    expect(mostUndefined("u")).toBe("u");
    expect(mostUndefined("uuuu")).toBe("u");
    expect(mostUndefined("auxz1")).toBe("u");
    expect(mostUndefined("axz1")).toBe("x");
    expect(mostUndefined("az1")).toBe("z");
    expect(mostUndefined("abcdef1")).toBe("0");

    expect(mostUndefined("abc", "0")).toBe("0");
    expect(mostUndefined("abc", "1")).toBe("0");
    expect(mostUndefined("abc", "112345")).toBe("0");
    expect(mostUndefined("abc", "x")).toBe("x");
    expect(mostUndefined("abc", "xxxx")).toBe("x");
    expect(mostUndefined("abc", "z")).toBe("z");
    expect(mostUndefined("abc", "zzzz")).toBe("z");
    expect(mostUndefined("abc", "u")).toBe("u");
    expect(mostUndefined("abc", "uuuu")).toBe("u");
    expect(mostUndefined("abc", "auxz1")).toBe("u");
    expect(mostUndefined("abc", "axz1")).toBe("x");
    expect(mostUndefined("abc", "az1")).toBe("z");
    expect(mostUndefined("abc", "abcdef1")).toBe("0");

    expect(mostUndefined(Infinity, "abcdef1")).toBe("x");
    expect(mostUndefined("abcdef1", Infinity)).toBe("x");
  });
});
