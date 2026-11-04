import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, DECREES } from "@second-crown/sim";
import { DecreeHint, decreeCostText, nextDecree } from "./DecreeHint";

function swear(state: ReturnType<typeof createGameState>, id: string) {
  state.flags[`decree_${id}_until`] = state.meta.tick + 100;
}

describe("decreeCostText", () => {
  it("reads costs straight from the sim decree table", () => {
    expect(decreeCostText(DECREES[0])).toBe("40 gold");
    expect(decreeCostText(DECREES[1])).toBe("50 food");
  });
});

describe("DecreeHint", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<DecreeHint state={undefined} />)).toBe("");
  });

  it("names the first decree the stores can cover", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "0";
    s.resources.food = "60";
    expect(nextDecree(s)).toEqual({ decree: DECREES[1], ready: true });
    const html = renderToStaticMarkup(<DecreeHint state={s} />);
    expect(html).toContain(DECREES[1].name);
    expect(html).toContain("50 food");
    expect(html).toContain("is-ready");
  });

  it("falls back to the first open decree when nothing is affordable", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "0";
    s.resources.food = "0";
    expect(nextDecree(s)).toEqual({ decree: DECREES[0], ready: false });
    const html = renderToStaticMarkup(<DecreeHint state={s} />);
    expect(html).toContain("40 gold");
    expect(html).toContain("not enough in stores");
  });

  it("skips active decrees and says when all are sworn", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "999";
    s.resources.food = "999";
    swear(s, "muster");
    expect(nextDecree(s)?.decree.id).toBe("rite");
    for (const d of DECREES) swear(s, d.id);
    expect(nextDecree(s)).toBeNull();
    expect(renderToStaticMarkup(<DecreeHint state={s} />)).toContain("every decree already sworn");
  });
});
