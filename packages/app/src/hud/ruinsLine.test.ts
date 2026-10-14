import { describe, expect, it } from "vitest";
import { ruinsLine } from "./ruinsLine";

describe("ruinsLine", () => {
  it("shows for a seen ruins tile", () => {
    expect(ruinsLine(true, "ruins")).toBe("Ruins · no stock");
  });

  it("stays hidden on an unseen ruins tile", () => {
    expect(ruinsLine(false, "ruins")).toBeNull();
  });

  it("stays hidden on other seen nodes", () => {
    for (const node of ["none", "hold", "camp", "woodcut", "quarry", "field"]) {
      expect(ruinsLine(true, node)).toBeNull();
    }
  });
});
