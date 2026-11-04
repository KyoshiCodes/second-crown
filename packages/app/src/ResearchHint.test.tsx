import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import { nextResearch, ResearchHint, researchCostText } from "./ResearchHint";

function done(state: ReturnType<typeof createGameState>, ...ids: string[]) {
  for (const id of ids) state.flags[`research_${id}`] = 1;
}

describe("researchCostText", () => {
  it("reads costs straight from the sim research table", () => {
    expect(researchCostText("husbandry")).toBe("20 food, 12 wood");
    expect(researchCostText("logistics")).toBe("30 gold, 16 wood, 12 food");
  });
});

describe("ResearchHint", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<ResearchHint state={undefined} />)).toBe("");
  });

  it("names the first unknown study with its cost and missing hall", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [];
    expect(nextResearch(s)).toEqual({ id: "husbandry", ready: false });
    const html = renderToStaticMarkup(<ResearchHint state={s} />);
    expect(html).toContain(RESEARCH.husbandry.name);
    expect(html).toContain("20 food, 12 wood");
    expect(html).toContain("needs farm or granary or academy");
  });

  it("prefers a study whose hall is already built", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [{ typeId: "quarry", completesAtTick: null } as (typeof s.buildings)[number]];
    expect(nextResearch(s)).toEqual({ id: "masonry", ready: true });
    const html = renderToStaticMarkup(<ResearchHint state={s} />);
    expect(html).toContain("is-ready");
    expect(html).not.toContain("needs");
  });

  it("skips known and underway studies and says when all are known", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [];
    done(s, "husbandry");
    s.flags["research_forestry_until"] = s.meta.tick + 100;
    expect(nextResearch(s)?.id).toBe("masonry");
    done(s, ...Object.keys(RESEARCH));
    expect(nextResearch(s)).toBeNull();
    expect(renderToStaticMarkup(<ResearchHint state={s} />)).toContain("every study known");
  });
});
