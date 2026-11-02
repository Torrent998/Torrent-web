/** Token amounts are integer base units (bigint / decimal string). Never floats. */
export function formatBaseUnits(raw: string, decimals = 7): string {
  if (!/^-?\d+$/.test(raw)) throw new Error("not an integer amount");
  const neg = raw.startsWith("-");
  const digits = (neg ? raw.slice(1) : raw).padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}

/** Parse a user-typed decimal ("12.5") into base units; rejects >decimals places, signs, exponents. */
export function parseToBaseUnits(input: string, decimals = 7): string | null {
  const m = /^(\d{1,20})(?:\.(\d{1,20}))?$/.exec(input.trim());
  if (!m) return null;
  const frac = m[2] ?? "";
  if (frac.length > decimals) return null;
  const v = BigInt(m[1]! + frac.padEnd(decimals, "0"));
  return v > 0n && v < 1n << 127n ? v.toString() : null;
}
