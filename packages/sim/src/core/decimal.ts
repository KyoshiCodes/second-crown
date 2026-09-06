import Decimal from "break_infinity.js";
import type { DecimalString } from "@second-crown/shared";

/** Create a Decimal from a compact string or number. */
export function D(value: DecimalString | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/** Convert a Decimal to the canonical compact string form used in saves. */
export function toDecimalString(value: Decimal | number | string): DecimalString {
  return new Decimal(value).toString();
}

/** Zero constant. */
export const ZERO = new Decimal(0);

/** One constant. */
export const ONE = new Decimal(1);
