import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SEASONS,
  computeIncomePerSecond,
  createGameState,
  currentSeason,
  isProvinceSeen,
  neighbors,
  productionBonus,
  visionRange,
  type GameState,
} from "@second-crown/sim";
import {
  SEASON_SIGHT,
  SEASON_YIELD_STEPS,
  SeasonEffectLine,
  YIELD_PCT_PER_STEP,
  seasonEffectStatus,
} from "./SeasonEffectLine";
import { ProvinceInspect } from "../ProvinceInspect";
import { KingdomTab } from "../tabs/KingdomTab";

function readFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

/** First tick of each season: Spring 0, Summer 2000, Autumn 4000, Winter 6000. */
const TICK = { Spring: 0, Summer: 2000, Autumn: 4000, Winter: 6000 } as const;

function at(season: keyof typeof TICK, seed = 1): GameState {
  const s = createGameState({ seed });
  s.meta.tick = TICK[season];
  return s;
}

/**
 * True when this season's sky shortens sight. Forgets every scouted tile but the home hold, then
 * asks the sim whether a tile one step away is still seen: with vision 1 it is, unless fog is thick.
 */
function sightShortened(s: GameState): boolean {
  expect(visionRange(s)).toBe(1);
  s.flags.fog_seen = JSON.stringify([s.board.homeProvinceId]);
  const next = neighbors(s, s.board.homeProvinceId)[0];
  return !isProvinceSeen(s, next.id);
}

describe("seasonEffectStatus", () => {
  it("reads the season from the sim", () => {
    for (const season of SEASONS) {
      const s = at(season);
      expect(currentSeason(s)).toBe(season);
      expect(seasonEffectStatus(s).season).toBe(season);
    }
  });

  it("lifts yields in Spring and Autumn only", () => {
    expect(seasonEffectStatus(at("Spring")).yieldText).toBe("Building yields +4%");
    expect(seasonEffectStatus(at("Autumn")).yieldText).toBe("Building yields +4%");
    expect(seasonEffectStatus(at("Summer")).yieldText).toBe("No yield bonus");
    expect(seasonEffectStatus(at("Winter")).yieldText).toBe("No yield bonus");
  });

  it("warns about snow in Winter and storms otherwise", () => {
    expect(seasonEffectStatus(at("Winter")).sightRisk).toBe("snow");
    expect(seasonEffectStatus(at("Winter")).sightText).toBe("Sight: snow is likely and shortens it");
    for (const season of ["Spring", "Summer", "Autumn"] as const) {
      expect(seasonEffectStatus(at(season)).sightRisk).toBe("storm");
      expect(seasonEffectStatus(at(season)).sightText).toBe("Sight: normal unless a storm sets in");
    }
  });

  it("holds through the whole season and turns with it", () => {
    const s = at("Spring");
    s.meta.tick = 1999;
    expect(seasonEffectStatus(s).season).toBe("Spring");
    s.meta.tick = 2000;
    expect(seasonEffectStatus(s).season).toBe("Summer");
    s.meta.tick = 8000;
    expect(seasonEffectStatus(s).season).toBe("Spring");
  });
});

describe("display copies match the sim", () => {
  it("yield steps equal the sim's season production bonus", () => {
    // A fresh realm has no other tick-driven bonus, so the gap to Summer is the season's share.
    const base = productionBonus(at("Summer"));
    for (const season of SEASONS) {
      expect(productionBonus(at(season)) - base).toBe(SEASON_YIELD_STEPS[season]);
    }
  });

  it("one step is worth 4% of building yields", () => {
    const spring = at("Spring");
    const summer = at("Summer");
    // Steps the realm already has from other sources (the same in both seasons).
    const other = productionBonus(summer);
    expect(productionBonus(spring)).toBe(other + 1);
    // One finished farm and no citizens, so food income is a pure building yield.
    for (const s of [spring, summer]) {
      s.citizens = [];
      s.buildings = [{ id: "farm", typeId: "farm", realmId: "player", x: 9, y: 9, level: 1, completesAtTick: null }];
    }
    const lo = Number(computeIncomePerSecond(summer).food);
    const hi = Number(computeIncomePerSecond(spring).food);
    expect(lo).toBeGreaterThan(0);
    const step = YIELD_PCT_PER_STEP / 100;
    expect(hi / lo).toBeCloseTo((1 + (other + 1) * step) / (1 + other * step), 6);
  });

  it("sight is shortened in most winters and few other seasons", () => {
    const seeds = Array.from({ length: 200 }, (_, i) => i + 1);
    const share = (season: keyof typeof TICK) =>
      seeds.filter((seed) => sightShortened(at(season, seed))).length / seeds.length;
    expect(share("Winter")).toBeGreaterThan(0.5);
    for (const season of ["Spring", "Summer", "Autumn"] as const) {
      const n = share(season);
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(0.4);
      expect(SEASON_SIGHT[season].risk).toBe("storm");
    }
    expect(SEASON_SIGHT.Winter.risk).toBe("snow");
  });
});

describe("SeasonEffectLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<SeasonEffectLine state={undefined} />)).toBe("");
  });

  it("shows season, yield effect and sight effect", () => {
    const html = renderToStaticMarkup(<SeasonEffectLine state={at("Autumn")} />);
    expect(html).toContain("sc-season-effect is-autumn has-yield");
    expect(html).toContain('data-season="autumn"');
    expect(html).toContain('data-yield-pct="4"');
    expect(html).toContain("<strong>Autumn</strong>");
    expect(html).toContain("Building yields +4%");
    expect(html).toContain("Sight: normal unless a storm sets in");
    expect(html).toContain('data-season-pip="true"');
  });

  it("marks a season with no yield bonus", () => {
    const html = renderToStaticMarkup(<SeasonEffectLine state={at("Winter")} />);
    expect(html).toContain("sc-season-effect is-winter");
    expect(html).not.toContain("has-yield");
    expect(html).toContain('data-yield-pct="0"');
    expect(html).toContain('data-sight-risk="snow"');
    expect(html).toContain("No yield bonus");
  });
});

describe("where the line shows", () => {
  it("shows on the Kingdom tab", () => {
    const s = at("Spring");
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-season-effect is-spring has-yield");
    expect(html).toContain("Building yields +4%");
  });

  it("shows on the inspect card for a seen tile", () => {
    const s = at("Winter");
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain("sc-season-effect is-winter");
    expect(html).toContain("Sight: snow is likely and shortens it");
  });

  it("stays off the inspect card for an unseen tile", () => {
    const s = at("Summer");
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).not.toContain("sc-season-effect");
  });
});

describe("season-effect.css", () => {
  const css = readFile("./season-effect.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      ".sc-season-effect",
      ".sc-season-effect-text",
      ".sc-season-effect-label",
      ".sc-season-effect-yield",
      ".sc-season-effect-sight",
      ".sc-season-effect.has-yield",
      ".sc-season-effect.is-winter",
    ]) {
      expect(css).toContain(cls);
    }
  });

  it("is scoped to its own prefix and leaves theme.css alone", () => {
    const selectors = css.match(/^[^{}/@\r\n][^{}]*\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) expect(sel.trim().startsWith(".sc-season-effect")).toBe(true);
    expect(readFile("../theme.css")).not.toContain("sc-season-effect");
  });
});
