import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CULTURES } from "@second-crown/sim";
import { BalanceNotes, unitCostText } from "./BalanceNotes";
import { cultureUnitId } from "./cultureLines";

describe("unitCostText", () => {
  it("reads base costs straight from the sim unit table", () => {
    expect(unitCostText("ranger")).toBe("food 5 · wood 6 · gold 1");
    expect(unitCostText("lancer")).toBe("food 12 · gold 8 · wood 4");
    expect(unitCostText("nope")).toBeNull();
  });
});

describe("BalanceNotes", () => {
  it("lists every culture with its edge and unit cost", () => {
    const html = renderToStaticMarkup(<BalanceNotes />);
    expect(html.match(/<tr/g)?.length).toBe(CULTURES.length + 1);
    expect(html).toContain("Farm +1 food");
    expect(html).toContain("Ranger");
    expect(html).toContain(unitCostText(cultureUnitId("mist")!)!);
    expect(html).toContain("base roster");
  });
});
