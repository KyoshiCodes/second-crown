import type { DecimalString } from "./index.js";

/**
 * Letter-suffix display (ADR-011): K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, ...
 * Uses powers of 1e3. Values under 1000 show as plain integers/decimals.
 */
const SUFFIXES = [
  "",
  "K",
  "M",
  "B",
  "T",
  "Qa",
  "Qi",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
];

export function formatLetterSuffix(value: DecimalString | number | string): string {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return "0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs < 1000) {
    if (Number.isInteger(abs)) return sign + String(abs);
    // up to 1 decimal for small fractions
    const t = Math.round(abs * 10) / 10;
    return sign + String(t);
  }

  // log10 based tier
  const exp = Math.floor(Math.log10(abs));
  const tier = Math.min(Math.floor(exp / 3), SUFFIXES.length - 1);
  const scaled = abs / Math.pow(1000, tier);
  const rounded =
    scaled >= 100 ? Math.round(scaled) : scaled >= 10 ? Math.round(scaled * 10) / 10 : Math.round(scaled * 100) / 100;
  const suffix = SUFFIXES[tier] || `e${tier * 3}`;
  return sign + String(rounded) + suffix;
}
