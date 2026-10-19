import { describe, expect, it } from "vitest";
import { hillLine } from "./hillLine";

describe("hillLine", () => {
  it("shows for a seen hill tile", () => {
    expect(hillLine(true, "hill")).toBe("Hill · rise");
  });

  it("stays hidden on an unseen hill tile", () => {
    expect(hillLine(false, "hill")).toBeNull();
  });

  it("stays hidden on other seen terrain", () => {
    for (const terrain of ["plain", "shore", "peak", "waste", "wood"]) {
      expect(hillLine(true, terrain)).toBeNull();
    }
  });
});
