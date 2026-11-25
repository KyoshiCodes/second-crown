import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH, computeIncomePerSecond, upkeepPerTick } from "@second-crown/sim";
import { projectCost, projectionWorthShowing, realmRates, type RealmRates } from "./projection";
import { BottleneckLine, StudyProjection, bottleneckPhrase, bottlenecks, projectionText } from "./CostProjection";
import { ResearchBar } from "./ResearchBar";

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
      "At current income this is about 8m 20s of food production. Ready in about 5m; food is the limiter.",
    );
  });
});

describe("realmRates", () => {
  it("uses sim income with army food upkeep taken off", () => {
    const s = createGameState({ seed: 1 });
    const r = realmRates(s);
    const gross = Number(computeIncomePerSecond(s).food ?? 0);
    expect(r.rate.food).toBeCloseTo(gross - upkeepPerTick(s) * 10);
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
