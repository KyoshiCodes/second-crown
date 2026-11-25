import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  RESEARCH,
  computeIncomePerSecond,
  createGameState,
  productionBonus,
  storageCap,
  trainCostMultiplier,
} from "@second-crown/sim";
import { STUDY_YIELD_LABELS, StudyLine } from "./StudyLine";

function cleanProducerState() {
  const s = createGameState({ seed: 1 });
  s.characters = [];
  s.citizens = [];
  // Pick a season tick where seasonal productionBonus is 0 so yield deltas equal exact study bonuses.
  for (const t of [0, 2000, 4000, 6000]) {
    s.meta.tick = t;
    if (productionBonus(s) === 0) break;
  }
  s.buildings = [
    { id: "k", typeId: "keep", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null },
    { id: "f", typeId: "granary", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
    { id: "l", typeId: "sawmill", realmId: "player", x: 4, y: 4, level: 1, completesAtTick: null },
    { id: "q", typeId: "mason", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null },
    { id: "g", typeId: "mint", realmId: "player", x: 8, y: 8, level: 1, completesAtTick: null },
  ];
  return s;
}

describe("StudyLine labels match sim bonuses", () => {
  it("shows +15% gold on Logistics (never stale +8%)", () => {
    const s = createGameState({ seed: 1 });
    s.flags.research_logistics = 1;
    const html = renderToStaticMarkup(<StudyLine state={s} />);
    expect(html).toContain("+15% gold, +50 store, +1 column");
    expect(html).not.toContain("+8% gold");
  });

  it("matches every study yield and discount multiplier exposed by packages/sim", () => {
    const baseState = cleanProducerState();
    const baseIncome = computeIncomePerSecond(baseState);
    const baseGoldCap = storageCap(baseState, "gold");

    const tier1 = cleanProducerState();
    tier1.flags.research_husbandry = 1;
    tier1.flags.research_forestry = 1;
    tier1.flags.research_masonry = 1;
    tier1.flags.research_logistics = 1;
    const t1Income = computeIncomePerSecond(tier1);

    const pct = (next: string | undefined, base: string | undefined) =>
      Math.round((Number(next) / Number(base) - 1) * 100);

    expect(STUDY_YIELD_LABELS.husbandry).toBe(`+${pct(t1Income.food, baseIncome.food)}% food`);
    expect(STUDY_YIELD_LABELS.forestry).toBe(`+${pct(t1Income.wood, baseIncome.wood)}% wood`);
    expect(STUDY_YIELD_LABELS.masonry).toBe(`+${pct(t1Income.stone, baseIncome.stone)}% stone`);
    expect(STUDY_YIELD_LABELS.logistics).toContain(`+${pct(t1Income.gold, baseIncome.gold)}% gold`);
    expect(STUDY_YIELD_LABELS.logistics).toContain(`+${storageCap(tier1, "gold") - baseGoldCap} store`);

    const tier2 = cleanProducerState();
    tier2.flags.research_crop_rotation = 1;
    tier2.flags.research_timber_framing = 1;
    tier2.flags.research_fortification = 1;
    tier2.flags.research_quartermastery = 1;
    const t2Income = computeIncomePerSecond(tier2);

    expect(STUDY_YIELD_LABELS.crop_rotation).toBe(`+${pct(t2Income.food, baseIncome.food)}% food`);
    expect(STUDY_YIELD_LABELS.timber_framing).toBe(`+${pct(t2Income.wood, baseIncome.wood)}% wood`);
    expect(STUDY_YIELD_LABELS.fortification).toContain(`+${pct(t2Income.stone, baseIncome.stone)}% stone`);
    expect(RESEARCH.fortification.effect).toContain("+24 HP");
    expect(RESEARCH.supply_trains.effect).toContain("+100 warehouse space");
    expect(RESEARCH.cartography.effect).toContain("4 gold less");
    expect(STUDY_YIELD_LABELS.quartermastery).toBe(
      `-${Math.round((1 - trainCostMultiplier(tier2)) * 100)}% training cost`,
    );
  });
});
