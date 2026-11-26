import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH, computeIncomePerSecond, upkeepPerTick } from "@second-crown/sim";
import {
  blockReasons,
  foodDeficitText,
  formatSignedRate,
  projectCost,
  projectionWorthShowing,
  realmRates,
  starvationNote,
  ticksToSeconds,
  type RealmRates,
} from "./projection";
import { BottleneckLine, StudyProjection, bottleneckPhrase, bottlenecks, projectionText } from "./CostProjection";
import { ResearchBar } from "./ResearchBar";
import { TICKS_PER_SECOND } from "@second-crown/shared";

function rates(partial: Partial<RealmRates>): RealmRates {
  return { rate: {}, have: {}, cap: {}, ...partial };
}

describe("projectCost", () => {
  it("names the slowest store as the limiter and measures cost in seconds of income", () => {
    const p = projectCost(
      { food: "100", stone: "600" },
      rates({ rate: { food: 1, stone: 0.5 }, have: { food: 100, stone: 300 }, cap: { food: 1000, stone: 1000 } }),
    );
    expect(p.limiter?.res).toBe("stone");
    expect(p.productionSeconds).toBe(1200);
    expect(p.waitSeconds).toBe(600);
    expect(p.parts[0]).toMatchObject({ res: "food", short: 0, waitSeconds: 0 });
  });

  it("marks a cost the warehouse cannot hold, and a store with no income, as never ready", () => {
    const over = projectCost({ stone: "600" }, rates({ rate: { stone: 5 }, have: { stone: 10 }, cap: { stone: 400 } }));
    expect(over.limiter).toMatchObject({ res: "stone", overCap: true, waitSeconds: Infinity });
    const dry = projectCost({ gold: "50", food: "10" }, rates({ rate: { food: 1 }, have: { food: 0 } }));
    expect(dry.limiter?.res).toBe("gold");
    expect(dry.waitSeconds).toBe(Infinity);
  });

  it("is deterministic and leaves its inputs alone", () => {
    const r = rates({ rate: { wood: 2 }, have: { wood: 3 }, cap: { wood: 500 } });
    const snap = JSON.stringify(r);
    expect(projectCost({ wood: "40" }, r)).toEqual(projectCost({ wood: "40" }, r));
    expect(JSON.stringify(r)).toBe(snap);
  });

  it("only flags costs worth a line", () => {
    const cheap = projectCost({ food: "10" }, rates({ rate: { food: 1 }, have: { food: 0 }, cap: { food: 200 } }));
    expect(projectionWorthShowing(cheap)).toBe(false);
    expect(projectionText(cheap)).toBeNull();
    const dear = projectCost({ food: "100" }, rates({ rate: { food: 0.2 }, have: { food: 40 }, cap: { food: 200 } }));
    expect(projectionWorthShowing(dear)).toBe(true);
    expect(projectionText(dear)?.text).toBe(
      "Ready to pay in ~5m (food is the limiter).",
    );
    expect(projectionText(dear, { finishSeconds: 6 * 3600 })?.text).toBe(
      "Ready to pay in ~5m (food is the limiter) · finishes in ~6h after you start.",
    );
  });
});

describe("realmRates", () => {
  it("uses sim income with army food upkeep taken off", () => {
    const s = createGameState({ seed: 1 });
    const r = realmRates(s);
    const gross = Number(computeIncomePerSecond(s).food ?? 0);
    expect(r.rate.food).toBeCloseTo(gross - upkeepPerTick(s) * TICKS_PER_SECOND);
    expect(Number.isFinite(r.cap.stone)).toBe(true);
  });
});

describe("projection UI", () => {
  it("hides the study line once the study is paid for", () => {
    const r = rates({ rate: {}, have: {}, cap: {} });
    expect(renderToStaticMarkup(<StudyProjection cost={{ food: "50" }} rates={r} paid />)).toBe("");
    expect(renderToStaticMarkup(<StudyProjection cost={{ food: "50" }} rates={r} paid={false} />)).toContain(
      "No food income",
    );
  });

  it("names a limiter for the next study on a fresh realm with empty stores", () => {
    const s = createGameState({ seed: 1 });
    for (const k of Object.keys(s.resources)) s.resources[k] = "0";
    const list = bottlenecks(s);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].kind).toBe("study");
    const html = renderToStaticMarkup(<BottleneckLine state={s} />);
    expect(html).toContain("Limiter");
    expect(html).toContain(bottleneckPhrase(list[0]));
  });

  it("stays quiet when stores cover everything", () => {
    const s = createGameState({ seed: 1 });
    for (const k of ["food", "wood", "stone", "gold"]) s.resources[k] = "100000";
    expect(bottlenecks(s)).toEqual([]);
    expect(renderToStaticMarkup(<BottleneckLine state={s} />)).toBe("");
  });

  it("puts a projection line on lectern cards without changing state", () => {
    const s = createGameState({ seed: 1 });
    for (const k of Object.keys(s.resources)) s.resources[k] = "0";
    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<ResearchBar state={s} act={() => undefined} />);
    expect(html).toContain("data-cost-projection");
    expect(JSON.stringify(s)).toBe(before);
    expect(Object.keys(RESEARCH).length).toBeGreaterThan(0);
  });
});

describe("actionable cues", () => {
  it("shows a negative net food rate as a deficit instead of hiding it", () => {
    const r = rates({ rate: { food: -2 }, have: { food: 5 }, cap: { food: 500 } });
    expect(foodDeficitText(r)).toBe("Food −2/s after upkeep");
    expect(foodDeficitText(rates({ rate: { food: 1 } }))).toBeNull();
    expect(formatSignedRate(-0.44)).toBe("−0.4/s");
    const p = projectCost({ food: "100" }, r);
    expect(projectionText(p)?.text).toBe("Food −2/s after upkeep, so the 95 food short will not refill.");
  });

  it("names every reason a project is blocked, structural gates first", () => {
    const p = projectCost(
      { stone: "600", gold: "50" },
      rates({ rate: { stone: 1, gold: 1 }, have: { stone: 0, gold: 10 }, cap: { stone: 400, gold: 500 } }),
    );
    const kinds = blockReasons(p, { prereq: "Masonry", keepNeed: 2, halls: ["Academy"], busyWith: "Forestry" });
    expect(kinds.map((k) => k.kind)).toEqual(["prereq", "keep", "hall", "busy", "warehouse", "stores"]);
    expect(kinds.map((k) => k.text)).toEqual([
      "missing prerequisite (Masonry)",
      "needs Keep II",
      "needs Academy",
      "lectern busy (Forestry)",
      "warehouse too small (stone 600 > 400)",
      "stores short (40 gold)",
    ]);
    expect(blockReasons(projectCost({ gold: "5" }, rates({ have: { gold: 10 } })))).toEqual([]);
  });

  it("renders a visible Blocked label on a study card", () => {
    const r = rates({ rate: { gold: 1 }, have: { gold: 0 }, cap: { gold: 500 } });
    const html = renderToStaticMarkup(
      <StudyProjection cost={{ gold: "20" }} rates={r} paid={false} gates={{ busyWith: "Forestry" }} />,
    );
    expect(html).toContain('<span class="sc-blocked-label">Blocked</span>');
    expect(html).toContain("lectern busy (Forestry)");
    expect(html).toContain("stores short (20 gold)");
  });

  it("converts ticks with the shared tick rate", () => {
    expect(ticksToSeconds(TICKS_PER_SECOND * 6)).toBe(6);
  });

  it("puts ready-to-pay and finish time in the Kingdom limiter line", () => {
    const s = createGameState({ seed: 1 });
    for (const k of Object.keys(s.resources)) s.resources[k] = "0";
    const html = renderToStaticMarkup(<BottleneckLine state={s} />);
    expect(html).toContain("after you start");
    expect(html).toContain('<span class="sc-blocked-label">Limiter</span>');
  });
});

describe("starvationNote", () => {
  function host(food: string) {
    const s = createGameState({ seed: 1 });
    s.units = s.units.filter((u) => u.realmId !== "player");
    s.units.push({ id: "sp", realmId: "player", typeId: "spearman", count: "500", armyId: null });
    s.resources.food = food;
    return s;
  }

  it("stays hidden when food holds", () => {
    const s = host("100");
    expect(starvationNote(s, rates({ rate: { food: 1 }, have: { food: 100 } }))).toBeNull();
  });

  it("warns ahead of time while food falls toward empty", () => {
    const s = host("100");
    const n = starvationNote(s, rates({ rate: { food: -10 }, have: { food: 100 } }));
    expect(n?.state).toBe("imminent");
    expect(n?.text).toBe("Larder empty in 10s; trained troops start deserting 1m after");
    expect(n?.seconds).toBe(70);
  });

  it("counts down to the next desertion once starving, and shows in the Bottleneck line", () => {
    const s = host("0");
    s.flags.starve_ticks = 150;
    const n = starvationNote(s, rates({ rate: { food: -10 }, have: { food: 0 } }));
    expect(n?.state).toBe("starving");
    expect(n?.text).toBe("Starving: trained troops desert 2% in 45s");
    const html = renderToStaticMarkup(<BottleneckLine state={s} />);
    expect(html).toContain('data-starve="starving"');
    expect(html).toContain("Starving: trained troops desert 2% in 45s");
  });

  it("says nothing for a militia-only host (militia keep their own rule)", () => {
    const s = createGameState({ seed: 1 });
    s.units = s.units.filter((u) => u.realmId !== "player");
    s.units.push({ id: "m", realmId: "player", typeId: "militia", count: "500", armyId: null });
    expect(starvationNote(s, rates({ rate: { food: -10 }, have: { food: 0 } }))).toBeNull();
  });
});
