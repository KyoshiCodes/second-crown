import { describe, expect, it } from "vitest";
import { shoreLine } from "./shoreLine";

describe("shoreLine", () => {
  it("shows for a seen shore tile", () => {
    expect(shoreLine(true, "shore")).toBe("Shore · water");
  });

  it("stays hidden on an unseen shore tile", () => {
    expect(shoreLine(false, "shore")).toBeNull();
  });

  it("stays hidden on other seen terrain", () => {
    for (const terrain of ["plain", "wood", "hill", "waste", "peak"]) {
      expect(shoreLine(true, terrain)).toBeNull();
    }
  });
});
