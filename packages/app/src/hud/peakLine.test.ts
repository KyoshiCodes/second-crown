import { describe, expect, it } from "vitest";
import { peakLine } from "./peakLine";

describe("peakLine", () => {
  it("shows for a seen peak tile", () => {
    expect(peakLine(true, "peak")).toBe("Peak · mountain");
  });

  it("stays hidden on an unseen peak tile", () => {
    expect(peakLine(false, "peak")).toBeNull();
  });

  it("stays hidden on other seen terrain", () => {
    for (const terrain of ["plain", "shore", "hill", "waste", "wood"]) {
      expect(peakLine(true, terrain)).toBeNull();
    }
  });
});
