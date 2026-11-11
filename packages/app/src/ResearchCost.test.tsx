import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH, tryStartResearch } from "@second-crown/sim";
import { ResearchBar } from "./ResearchBar";
import { ResearchCostRow, studyCostNote, studyCostParts } from "./ResearchCost";

type State = ReturnType<typeof createGameState>;

function realm(): State {
  const s = createGameState({ seed: 1 });
  s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
  return s;
}

function card(html: string, id: string): string {
  const start = html.indexOf(`data-study="${id}"`);
  expect(start).toBeGreaterThan(-1);
  const next = html.indexOf("data-study=", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

const act = () => undefined;

describe("studyCostParts", () => {
  it("lists every resource in table order with the whole amount still missing", () => {
    expect(studyCostParts({ food: "20", wood: "12" }, { food: "7.5", wood: "12" })).toEqual([
      { res: "food", need: 20, short: 13 },
      { res: "wood", need: 12, short: 0 },
    ]);
  });

  it("treats a missing store as empty", () => {
    expect(studyCostParts({ gold: "30" }, {})).toEqual([{ res: "gold", need: 30, short: 30 }]);
  });
});

describe("studyCostNote", () => {
  const covered = [{ res: "food", need: 20, short: 0 }];
  const short = [
    { res: "food", need: 20, short: 13 },
    { res: "wood", need: 12, short: 0 },
    { res: "gold", need: 5, short: 5 },
  ];

  it("names only the resources that are short", () => {
    expect(studyCostNote({ status: "open", parts: short })).toEqual({ text: "Short 13 food, 5 gold.", tone: "short" });
  });

  it("says ready, busy, or paid", () => {
    expect(studyCostNote({ status: "open", parts: covered }).text).toBe("Stores cover it. Ready to study.");
    expect(studyCostNote({ status: "open", parts: covered, busyWith: "Drill" })).toEqual({
      text: "Stores cover it. Lectern is busy with Drill.",
      tone: "wait",
    });
    expect(studyCostNote({ status: "locked", parts: covered }).text).toBe("Stores cover it.");
    expect(studyCostNote({ status: "studying", parts: short }).text).toBe("Paid.");
    expect(studyCostNote({ status: "known", parts: short }).text).toBe("Paid.");
  });
});

describe("ResearchCostRow", () => {
  it("marks short chips only while the cost is still due", () => {
    const parts = studyCostParts({ food: "20", wood: "12" }, { food: "0", wood: "50" });
    const due = renderToStaticMarkup(<ResearchCostRow status="open" parts={parts} />);
    expect(due).toContain('data-study-cost="due"');
    expect(due).toMatch(/is-short" data-res="food">20 food/);
    expect(due).toMatch(/sc-research-tree-cost-chip" data-res="wood">12 wood/);
    const paid = renderToStaticMarkup(<ResearchCostRow status="known" parts={parts} />);
    expect(paid).toContain('data-study-cost="paid"');
    expect(paid).not.toContain("is-short");
  });
});

describe("cost row on the lectern cards", () => {
  it("every study card shows name, cost, progress, and a short Study button", () => {
    const s = realm();
    const html = renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    const cards = (html.match(/data-study="/g) ?? []).length;
    expect(cards).toBe(Object.keys(RESEARCH).length);
    expect((html.match(/data-study-cost="/g) ?? []).length).toBe(cards);

    const h = card(html, "husbandry");
    expect(h).toContain("Husbandry");
    expect(h).toContain("20 food");
    expect(h).toContain("12 wood");
    expect(h).toContain("Short 20 food, 12 wood.");
    expect(h).toContain("Not started");
    // 180 ticks, Academy discount 20% -> 144 ticks -> 14s
    expect(h).toContain("Study husbandry (14s)</span>");
    // The cost and hall list no longer ride in the button label.
    expect(h).not.toContain("Study husbandry (20 food");
  });

  it("turns green when the stores cover it and the sim agrees", () => {
    const s = realm();
    s.resources.food = "20";
    s.resources.wood = "12";
    const h = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "husbandry");
    expect(h).toContain("Stores cover it. Ready to study.");
    expect(h).not.toContain("is-short");
    expect(tryStartResearch(s, "husbandry")).toBe(true);
  });

  it("shows Paid on the active study and a busy lectern on the others", () => {
    const s = realm();
    s.resources.food = "100";
    s.resources.wood = "100";
    expect(tryStartResearch(s, "husbandry")).toBe(true);
    const html = renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    const active = card(html, "husbandry");
    expect(active).toContain('data-study-cost="paid"');
    expect(active).toContain("Paid.");
    expect(active).toContain(">Cancel</button>");
    expect(card(html, "forestry")).toContain("Lectern is busy with Husbandry.");
  });

  it("rendering the cost row does not change the stores", () => {
    const s = realm();
    s.resources.food = "33";
    const before = JSON.stringify(s.resources);
    renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    expect(JSON.stringify(s.resources)).toBe(before);
  });
});
