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
  playerTitle,
  productionBonus,
  tryAscend,
  type GameState,
} from "@second-crown/sim";
import { PrestigeRankLine, YIELD_PCT_PER_PRODUCTION, prestigeRank } from "./PrestigeRankLine";
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

describe("prestigeRank reads the sim", () => {
  it("reports the rank and the sim's title", () => {
    const s = crown(2);
    const r = prestigeRank(s);
    expect(r.dawn).toBe(2);
    expect(r.title).toBe(playerTitle(s));
    expect(r.rankText).toBe(`Dawn 2 · ${playerTitle(s)}`);
    expect(prestigeRank(crown(0)).rankText).toBe(`Dawn 0 · ${playerTitle(crown(0))}`);
  });

  it("reports the sim's threshold for the next rank at every rank", () => {
    for (const level of [0, 1, 2, 5]) {
      const s = crown(level, 15_000);
      const r = prestigeRank(s);
      expect(r.need).toBe(ascendThreshold(s));
      expect(r.ready).toBe(false);
      expect(r.nextText).toBe(
        `Dawn ${level + 1} at ${formatLetterSuffix(ascendThreshold(s))} total resources (${r.percent}% there)`,
      );
    }
    expect(prestigeRank(crown(0, 15_000)).percent).toBe(50);
  });

  it("says ready exactly when the sim says so", () => {
    const under = crown(1, 54_999);
    const over = crown(1, 55_000);
    expect(canAscend(under)).toBe(false);
    expect(prestigeRank(under).ready).toBe(false);
    expect(canAscend(over)).toBe(true);
    expect(prestigeRank(over).ready).toBe(true);
    expect(prestigeRank(over).nextText).toBe("Ready for Dawn 2: ascend from the Kingdom or Crown tab");
  });

  it("matches the sim's dawn bonus: one production point per dawn", () => {
    const base = productionBonus(crown(0));
    for (const level of [1, 2, 3, 7]) {
      const s = crown(level);
      expect(productionBonus(s) - base).toBe(level);
      expect(prestigeRank(s).production).toBe(level);
      expect(prestigeRank(s).yieldPct).toBe(level * YIELD_PCT_PER_PRODUCTION);
    }
  });

  it("uses the same yield step as the sim's economy", () => {
    const src = readFile("../../../sim/src/systems/economy.ts");
    expect(src).toContain(`productionBonus(state) * ${YIELD_PCT_PER_PRODUCTION / 100}`);
  });

  it("lists nothing at Dawn 0 and the stacked bonus after", () => {
    expect(prestigeRank(crown(0)).grantsText).toBe("Grants: nothing yet");
    expect(prestigeRank(crown(3)).grantsText).toBe(
      "Grants: +3 production on every finished building (+12% yield) · a doctrine, not sworn yet (Crown tab)",
    );
  });

  it("names the sworn doctrine with the sim's own wording", () => {
    for (const d of DOCTRINES) {
      const s = crown(1);
      s.flags.doctrine = d.id;
      const r = prestigeRank(s);
      expect(r.doctrine).toEqual({ name: d.name, blurb: d.blurb });
      expect(r.grantsText).toContain(`${d.name}: ${d.blurb}`);
    }
  });

  it("says what one more dawn adds, with the first-dawn gift only while unclaimed", () => {
    const fresh = prestigeRank(crown(0));
    expect(fresh.giftPending).toBe(true);
    expect(fresh.nextGrantsText).toBe(
      "Dawn 1 grants: +1 production on every finished building (+4% yield), a doctrine, a one-time gift of 1 militia, 20 food and 10 wood",
    );
    const s = crown(0, 30_000);
    expect(tryAscend(s)).toBe(true);
    const after = prestigeRank(s);
    expect(after.dawn).toBe(1);
    expect(after.giftPending).toBe(false);
    expect(after.nextGrantsText).toBe(
      "Dawn 2 grants: +2 production on every finished building (+8% yield), a fresh doctrine pick",
    );
  });

  it("does not change the save", () => {
    const s = crown(2, 40_000);
    const before = JSON.stringify(s);
    prestigeRank(s);
    renderToStaticMarkup(<PrestigeRankLine state={s} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("PrestigeRankLine markup", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<PrestigeRankLine state={undefined} />)).toBe("");
  });

  it("shows rank, next threshold and bonuses", () => {
    const s = crown(2, 20_000);
    const r = prestigeRank(s);
    const html = renderToStaticMarkup(<PrestigeRankLine state={s} />);
    expect(html).toContain("sc-prestige-rank-line is-waiting");
    expect(html).toContain('data-dawn="2"');
    expect(html).toContain('data-production="2"');
    expect(html).toContain(`<strong>${r.rankText}</strong>`);
    expect(html).toContain(r.nextText);
    expect(html).toContain("+2 production on every finished building (+8% yield)");
    expect(html).toContain("Dawn 3 grants: +3 production");
    expect(html).toContain("sc-prestige-rank-grants is-active");
  });

  it("can leave the threshold out", () => {
    const s = crown(1, 20_000);
    const html = renderToStaticMarkup(<PrestigeRankLine state={s} threshold={false} />);
    expect(html).not.toContain("sc-prestige-rank-next");
    expect(html).not.toContain("total resources");
    expect(html).toContain("Grants: +1 production");
  });

  it("marks a ready crown", () => {
    const html = renderToStaticMarkup(<PrestigeRankLine state={crown(0, 30_000)} />);
    expect(html).toContain("sc-prestige-rank-line is-ready");
    expect(html).toContain('data-ready="true"');
  });

  it("has no button and keeps the glyph decorative", () => {
    const html = renderToStaticMarkup(<PrestigeRankLine state={crown(0, 30_000)} />);
    expect(html).not.toContain("<button");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("where the line shows", () => {
  it("shows on the Kingdom tab under the Age line, which keeps its threshold and Ascend button", () => {
    const s = crown(1, 55_000);
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const age = html.indexOf('class="sc-prestige-line');
    const rank = html.indexOf('class="sc-prestige-rank-line');
    expect(age).toBeGreaterThan(-1);
    expect(rank).toBeGreaterThan(age);
    expect(html).toContain("Grants: +1 production on every finished building (+4% yield)");
    expect(html).not.toContain("sc-prestige-rank-next");
    expect(html).toContain(">Ascend</button>");
  });

  it("shows the Kingdom tab threshold on the Age line", () => {
    const s = crown(1, 11_000);
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain(`${formatLetterSuffix(ascendThreshold(s))} total resources (20%)`);
  });

  it("shows in full on the inspect card", () => {
    const s = crown(2, 20_000);
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain("sc-prestige-rank-line is-waiting");
    expect(html).toContain(prestigeRank(s).nextText);
    expect(html).toContain("Grants: +2 production");
  });

  it("shows on the inspect card for an unseen tile too: the rank belongs to the realm, not the tile", () => {
    const s = crown(0);
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain("sc-prestige-rank-line");
  });
});

describe("prestige-rank-line.css", () => {
  const css = readFile("./prestige-rank-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-prestige-rank-line",
      "sc-prestige-rank-icon",
      "sc-prestige-rank-text",
      "sc-prestige-rank-label",
      "sc-prestige-rank-next",
      "sc-prestige-rank-grants",
      "sc-prestige-rank-upcoming",
    ]) {
      expect(css).toContain(`.${cls}`);
    }
  });

  it("is scoped to the line, has no animation, and keeps the glyph click-through", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}")
      .map((block) => block.split("{")[0].trim())
      .filter(Boolean);
    for (const sel of selectors) {
      for (const part of sel.split(",")) expect(part.trim().startsWith(".sc-prestige-rank-")).toBe(true);
    }
    expect(css).not.toMatch(/animation|@keyframes|transition/);
    expect(css).toMatch(/\.sc-prestige-rank-icon\s*\{[^}]*pointer-events:\s*none/);
  });
});
