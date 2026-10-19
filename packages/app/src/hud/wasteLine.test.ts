import { describe, expect, it } from "vitest";
import { wasteLine } from "./wasteLine";

describe("wasteLine", () => {
  it("shows for a seen waste tile", () => {
    expect(wasteLine(true, "waste")).toBe("Waste · scorched");
  });

  it("stays hidden on an unseen waste tile", () => {
    expect(wasteLine(false, "waste")).toBeNull();
  });

  it("stays hidden on other seen terrain", () => {
    for (const terrain of ["plain", "shore", "peak", "hill", "wood"]) {
      expect(wasteLine(true, terrain)).toBeNull();
    }
  });
});
