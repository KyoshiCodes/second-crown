import { describe, expect, it } from "vitest";
import { woodLine } from "./woodLine";

describe("woodLine", () => {
  it("shows for a seen wood tile", () => {
    expect(woodLine(true, "wood")).toBe("Wood · trees");
  });

  it("stays hidden on an unseen wood tile", () => {
    expect(woodLine(false, "wood")).toBeNull();
  });

  it("stays hidden on other seen terrain", () => {
    for (const terrain of ["plain", "shore", "hill", "waste", "peak"]) {
      expect(woodLine(true, terrain)).toBeNull();
    }
  });
});
