import { describe, expect, it } from "vitest";
import { stockBadge } from "./stockBadge";

describe("stockBadge", () => {
  it("shows stock over max", () => {
    expect(stockBadge(12, 40)).toBe("12/40");
  });

  it("shows 0/40 on a dry tile", () => {
    expect(stockBadge(0, 40)).toBe("0/40");
  });

  it("is null when stockMax is 0", () => {
    expect(stockBadge(0, 0)).toBeNull();
  });
});
