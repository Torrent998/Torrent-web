import { describe, expect, it } from "vitest";
import { formatBaseUnits, parseToBaseUnits } from "@/lib/money";

describe("money", () => {
  it("formats base units exactly, with grouping and no float rounding", () => {
    expect(formatBaseUnits("0")).toBe("0");
    expect(formatBaseUnits("1")).toBe("0.0000001");
    expect(formatBaseUnits("10000000")).toBe("1");
    expect(formatBaseUnits("123456789012345678901234567890")).toBe("12,345,678,901,234,567,890,123.456789");
    expect(formatBaseUnits("-5000000")).toBe("-0.5");
    expect(() => formatBaseUnits("1.5")).toThrow();
  });
  it("parses typed amounts strictly", () => {
    expect(parseToBaseUnits("12.5")).toBe("125000000");
    expect(parseToBaseUnits("0.0000001")).toBe("1");
    for (const bad of ["", "0", "-1", "1e3", "1.00000001", "1,5", " ", "abc", "0.0"]) expect(parseToBaseUnits(bad), bad).toBeNull();
  });
  it("round-trips", () => {
    for (const s of ["1", "9999999", "10000000", "123456789"]) expect(parseToBaseUnits(formatBaseUnits(s))).toBe(s);
  });
});
