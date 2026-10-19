import { describe, expect, it } from "vitest";
import { plainLine } from "./plainLine";

describe("plainLine", () => {
  it("shows for a seen plain tile", () => {
    expect(plainLine(true, "plain")).toBe("Plain · meadow");
  });

  it("stays hidden on an unseen plain tile", () => {
    expect(plainLine(false, "plain")).toBeNull();
  });

  it("stays hidden on other seen terrain", () => {
    for (const terrain of ["shore", "peak", "hill", "wood", "waste"]) {
      expect(plainLine(true, terrain)).toBeNull();
    }
  });
});
