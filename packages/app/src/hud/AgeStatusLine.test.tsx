import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DOCTRINES,
  ascendThreshold,
  canAscend,
  createGameState,
  formatLetterSuffix,
  isProvinceSeen,
  productionBonus,
  type GameState,
} from "@second-crown/sim";
import { AgeStatusLine, ageStatus } from "./AgeStatusLine";
import { YIELD_PCT_PER_PRODUCTION } from "./PrestigeRankLine";
import { KingdomTab } from "../tabs/KingdomTab";
import { ProvinceInspect } from "../ProvinceInspect";

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

/** A fresh crown at `level` dawns holding exactly `gold` gold and nothing else. */
function crown(level = 0, gold = 0): GameState {
  const s = createGameState({ seed: 1 });
  if (level > 0) s.flags["prestige_level"] = level;
  s.resources = { gold: String(gold), food: "0", wood: "0", stone: "0" };
  return s;
}

describe("ageStatus reads the sim", () => {
  it("shows the current age and progress toward the sim's threshold", () => {
    const s = crown(0);
    const need = ascendThreshold(s);
    s.resources.gold = String(need / 2);
    const a = ageStatus(s);
    expect(a.kind).toBe("waiting");
    expect(a.ageText).toBe("Dawn 0");
    expect(a.percent).toBe(50);
    expect(a.progressText).toBe(
      `50% · ${formatLetterSuffix(need / 2)} of ${formatLetterSuffix(need)} total resources toward Dawn 1`,
    );
  });

  it("is ready exactly when the sim's canAscend is", () => {
    const s = crown(2);
    s.resources.gold = String(ascendThreshold(s) - 1);
    expect(canAscend(s)).toBe(false);
    expect(ageStatus(s).kind).toBe("waiting");
    expect(ageStatus(s).percent).toBeLessThan(100);
    s.resources.gold = String(ascendThreshold(s));
    expect(canAscend(s)).toBe(true);
    const a = ageStatus(s);
    expect(a.kind).toBe("ready");
    expect(a.percent).toBe(100);
    expect(a.progressText).toContain("Ready for Dawn 3");
  });

  it("grants nothing at Dawn 0", () => {
    const a = ageStatus(crown(0));
    expect(a.bonuses).toEqual([]);
    expect(a.bonusText).toBe("No age bonus yet");
  });

  it("grants one production point per dawn, matching the sim's productionBonus step", () => {
    const base = productionBonus(crown(0));
    for (const level of [1, 3]) {
      const s = crown(level);
      expect(productionBonus(s) - base).toBe(level);
      expect(ageStatus(s).bonuses[0]).toBe(
        `+${level} production on every finished building (+${level * YIELD_PCT_PER_PRODUCTION}% yield)`,
      );
    }
  });

  it("names the sworn doctrine, or says one is waiting", () => {
    const s = crown(1);
    expect(ageStatus(s).bonusText).toContain("a doctrine to swear (Crown tab)");
    s.flags.doctrine = DOCTRINES[1].id;
    expect(ageStatus(s).bonusText).toContain(`${DOCTRINES[1].name}: ${DOCTRINES[1].blurb}`);
  });
});

describe("AgeStatusLine", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<AgeStatusLine state={undefined} />)).toBe("");
  });

  it("renders age, progress bar and grants", () => {
    const s = crown(2, 1000);
    const html = renderToStaticMarkup(<AgeStatusLine state={s} />);
    expect(html).toContain('data-age-status="waiting"');
    expect(html).toContain('data-dawn="2"');
    expect(html).toContain("<strong>Dawn 2</strong>");
    expect(html).toContain("sc-age-status-fill");
    expect(html).toContain("sc-age-status-bonus is-active");
    expect(html).toContain("+2 production on every finished building");
  });

  it("drops the bar when ready", () => {
    const s = crown(0);
    s.resources.gold = String(ascendThreshold(s));
    const html = renderToStaticMarkup(<AgeStatusLine state={s} />);
    expect(html).toContain('data-age-status="ready"');
    expect(html).not.toContain("sc-age-status-bar");
  });

  it("shows once on the Kingdom tab, right after the Prestige line", () => {
    const s = crown(1, 500);
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const rank = html.indexOf('class="sc-prestige-rank-line');
    const line = html.indexOf('class="sc-age-status-line');
    expect(rank).toBeGreaterThan(-1);
    expect(line).toBeGreaterThan(rank);
    expect(html.match(/class="sc-age-status-line/g)?.length).toBe(1);
  });

  it("shows once on the inspect card, seen or not: the age belongs to the crown", () => {
    const s = crown(0);
    const home = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(home.match(/class="sc-age-status-line/g)?.length).toBe(1);
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const unseen = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(unseen).toContain('data-age-status="waiting"');
  });
});

describe("age-status-line.css", () => {
  const css = readFile("./age-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-age-status-line",
      "sc-age-status-icon",
      "sc-age-status-text",
      "sc-age-status-label",
      "sc-age-status-progress",
      "sc-age-status-bar",
      "sc-age-status-fill",
      "sc-age-status-bonus",
    ]) {
      expect(css).toContain(`.${cls}`);
    }
  });

  it("stays out of theme.css", () => {
    expect(readFile("../theme.css")).not.toContain("sc-age-status");
  });
});
