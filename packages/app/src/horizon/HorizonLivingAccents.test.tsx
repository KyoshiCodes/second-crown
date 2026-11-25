import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { isPaceBreathing, unitTierRank, unitTierShape } from "./horizon";
import { PaceLine, UnitTierNote, UnitTierPip } from "./HorizonTime";
import { UnitCard } from "../hud/UnitCard";
import { RaiseImproveFold } from "../hud/RaiseImproveFold";
import { ResearchBar } from "../ResearchBar";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function setKeepLevel(level: number) {
  const s = createGameState({ seed: 1 });
  const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (keep) {
    keep.level = level;
    keep.completesAtTick = null;
  } else {
    s.buildings.push({
      id: "keep_test",
      typeId: "keep",
      realmId: "player",
      x: 3,
      y: 3,
      level,
      completesAtTick: null,
    });
  }
  return s;
}

describe("horizon living helpers", () => {
  it("clamps unit tiers to 1..5 and maps distinct shapes", () => {
    expect(unitTierRank(undefined)).toBe(1);
    expect(unitTierRank(0)).toBe(1);
    expect(unitTierRank(1)).toBe(1);
    expect(unitTierRank(3)).toBe(3);
    expect(unitTierRank(5)).toBe(5);
    expect(unitTierRank(9)).toBe(5);

    expect(unitTierShape(1)).toBe("circle");
    expect(unitTierShape(2)).toBe("chevron");
    expect(unitTierShape(3)).toBe("diamond");
    expect(unitTierShape(4)).toBe("star");
    expect(unitTierShape(5)).toBe("crown");
  });

  it("enables pace breathing only for mid and late stages", () => {
    expect(isPaceBreathing("early")).toBe(false);
    expect(isPaceBreathing("mid")).toBe(true);
    expect(isPaceBreathing("late")).toBe(true);
  });
});

describe("living unit tier pips", () => {
  it("renders distinct tier pips and SVG geometry for tiers I–V", () => {
    const shapes = ["circle", "chevron", "diamond", "star", "crown"] as const;
    for (let t = 1; t <= 5; t += 1) {
      const pipHtml = renderToStaticMarkup(<UnitTierPip tier={t} />);
      expect(pipHtml).toContain(`sc-horizon-tier-pip tier-${t} shape-${shapes[t - 1]}`);
      expect(pipHtml).toContain(`data-tier-rank="${t}"`);
      expect(pipHtml).toContain(`data-tier-shape="${shapes[t - 1]}"`);
      expect(pipHtml).toContain("<svg");

      const noteHtml = renderToStaticMarkup(<UnitTierNote tier={t} />);
      expect(noteHtml).toContain(`class="sc-horizon-tier tier-${t}"`);
      expect(noteHtml).toContain(`data-tier-shape="${shapes[t - 1]}"`);
    }
  });

  it("mounts inside UnitCard without block elements inside the button", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="knight"
        name="Knight"
        power={8}
        cost={{ food: 20, iron: 10 }}
        ticks={50}
        open
        lock=""
        affordable
        tier={4}
        onTrain={() => {}}
      />,
    );
    expect(html).toContain('data-tier-rank="4"');
    expect(html).toContain('data-tier-shape="star"');
    expect(html).not.toMatch(/<(div|p|dl)\b/);
  });
});

describe("living pace breathing", () => {
  it("keeps early pace still and enables breathing in mid and late pace", () => {
    const earlyHtml = renderToStaticMarkup(<PaceLine state={setKeepLevel(1)} />);
    expect(earlyHtml).toContain('data-pace="early"');
    expect(earlyHtml).not.toContain("is-pace-breathing");
    expect(earlyHtml).not.toContain("data-pace-breathing");

    const midHtml = renderToStaticMarkup(<PaceLine state={setKeepLevel(2)} />);
    expect(midHtml).toContain('data-pace="mid"');
    expect(midHtml).toContain("sc-horizon-pace is-mid is-pace-breathing");
    expect(midHtml).toContain('data-pace-breathing="true"');

    const lateHtml = renderToStaticMarkup(<PaceLine state={setKeepLevel(4)} />);
    expect(lateHtml).toContain('data-pace="late"');
    expect(lateHtml).toContain("sc-horizon-pace is-late is-pace-breathing");
    expect(lateHtml).toContain('data-pace-breathing="true"');
  });
});

describe("long-horizon row glow on builds and research", () => {
  it("glows hour and day building rows in RaiseImproveFold while leaving short rows calm", () => {
    const shortState = createGameState({ seed: 1 });
    shortState.buildings.push({
      id: "b_short",
      typeId: "cottage",
      realmId: "player",
      x: 1,
      y: 1,
      level: 1,
      completesAtTick: shortState.meta.tick + 50,
    });
    const shortHtml = renderToStaticMarkup(
      <RaiseImproveFold state={shortState} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(shortHtml).not.toContain("is-long-horizon");

    const longState = createGameState({ seed: 1 });
    longState.buildings.push(
      {
        id: "b_hours",
        typeId: "farm",
        realmId: "player",
        x: 1,
        y: 1,
        level: 1,
        completesAtTick: longState.meta.tick + 72_000, // 2h
      },
      {
        id: "b_days",
        typeId: "academy",
        realmId: "player",
        x: 2,
        y: 1,
        level: 1,
        completesAtTick: longState.meta.tick + 900_000, // 1d+
      },
    );
    const longHtml = renderToStaticMarkup(
      <RaiseImproveFold state={longState} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(longHtml).toContain("sc-raise-work is-raise is-long-horizon is-horizon-hours");
    expect(longHtml).toContain('data-long-horizon="hours"');
    expect(longHtml).toContain("sc-raise-work is-raise is-long-horizon is-horizon-days");
    expect(longHtml).toContain('data-long-horizon="days"');
  });

  it("glows active research cards and horizon rows for hour/day waits in ResearchBar", () => {
    const shortStudy = setKeepLevel(3);
    shortStudy.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
    shortStudy.flags.research_husbandry_until = shortStudy.meta.tick + 50;
    shortStudy.flags.research_husbandry_total = 100;
    const shortHtml = renderToStaticMarkup(<ResearchBar state={shortStudy} act={() => {}} />);
    // Other cards may now show hour-scale "Takes" times (pacing pass 1); only husbandry must stay calm.
    expect(shortHtml).not.toMatch(/is-long-horizon[^"]*" data-study="husbandry"/);
    expect(shortHtml).not.toMatch(/is-long-horizon[^"]*" data-horizon-study="husbandry"/);

    const hourStudy = setKeepLevel(3);
    hourStudy.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
    hourStudy.flags.research_husbandry_until = hourStudy.meta.tick + 72_000;
    hourStudy.flags.research_husbandry_total = 100_000;
    const hourHtml = renderToStaticMarkup(<ResearchBar state={hourStudy} act={() => {}} />);
    expect(hourHtml).toContain('is-long-horizon is-horizon-hours" data-study="husbandry"');
    expect(hourHtml).toContain('class="sc-horizon-study is-long-horizon is-horizon-hours" data-horizon-study="husbandry"');

    const dayStudy = setKeepLevel(3);
    dayStudy.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
    dayStudy.flags.research_husbandry_until = dayStudy.meta.tick + 1_728_000;
    dayStudy.flags.research_husbandry_total = 2_000_000;
    const dayHtml = renderToStaticMarkup(<ResearchBar state={dayStudy} act={() => {}} />);
    expect(dayHtml).toContain('is-long-horizon is-horizon-days" data-study="husbandry"');
    expect(dayHtml).toContain('class="sc-horizon-study is-long-horizon is-horizon-days" data-horizon-study="husbandry"');
  });
});

describe("horizon-living.css isolation and safety", () => {
  const css = readTextFile("./horizon-living.css");
  const horizonTimeSrc = readTextFile("./HorizonTime.tsx");

  it("is imported after horizon.css in HorizonTime.tsx", () => {
    const baseIdx = horizonTimeSrc.indexOf('import "./horizon.css";');
    const livingIdx = horizonTimeSrc.indexOf('import "./horizon-living.css";');
    expect(baseIdx).toBeGreaterThan(-1);
    expect(livingIdx).toBeGreaterThan(baseIdx);
  });

  it("supports Dusk, Night, and Parchment chrome themes and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses pointer-events: none !important on pips and badges", () => {
    expect(css).toMatch(/\.sc-horizon-tier-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-horizon-badge-glass\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-horizon-pace-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
  });

  it("defines keyframes for hours/days glow, tier pips, and mid/late pace breathing", () => {
    expect(css).toContain("@keyframes sc-horizon-glow-hours");
    expect(css).toContain("@keyframes sc-horizon-glow-days");
    expect(css).toContain("@keyframes sc-tier-pip-breathe");
    expect(css).toContain("@keyframes sc-tier-pip-crown");
    expect(css).toContain("@keyframes sc-pace-breathe-mid");
    expect(css).toContain("@keyframes sc-pace-breathe-late");
  });

  it("does not touch board, chat, admin, or theme dock selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
  });
});
