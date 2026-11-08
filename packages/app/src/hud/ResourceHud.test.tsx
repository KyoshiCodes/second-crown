import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResourceHud } from "./ResourceHud";

const RESOURCES = { food: "1200", wood: "40", stone: "0", gold: "7.5" };
const INCOME = { food: "3", wood: "0", stone: "0", gold: "1.5" };

describe("ResourceHud living status rows", () => {
  it("stacks name, stock and income rows on every resource card", () => {
    const html = renderToStaticMarkup(<ResourceHud resources={RESOURCES} income={INCOME} />);
    for (const r of ["food", "wood", "stone", "gold"]) {
      expect(html).toContain(`sc-resource-living is-${r}`);
    }
    expect(html.match(/sc-resource-living-row is-name/g)?.length).toBe(4);
    expect(html.match(/sc-resource-living-row is-amount/g)?.length).toBe(4);
    expect(html.match(/sc-resource-living-row is-income/g)?.length).toBe(4);
  });

  it("reads amount and income straight from props", () => {
    const html = renderToStaticMarkup(<ResourceHud resources={RESOURCES} income={INCOME} />);
    expect(html).toContain("+3/s");
    expect(html).toContain("+1.5/s");
    expect(html.match(/sc-ledger-rate is-idle/g)?.length).toBe(2);
    expect(html).toContain('aria-label="Stores"');
  });

  it("omits the meter when there is no cap to show", () => {
    const html = renderToStaticMarkup(<ResourceHud resources={RESOURCES} income={INCOME} />);
    expect(html).not.toContain("sc-resource-living-meter");
  });
});
