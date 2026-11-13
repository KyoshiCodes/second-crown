import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  GatherSystem,
  createGameState,
  currentSeason,
  isProvinceSeen,
  sunMoonPositionAt,
  visionRange,
  type Gather,
  type GameState,
} from "@second-crown/sim";
import {
  DAY_NIGHT_SIGHT_TEXT,
  DAY_PHASE_NAMES,
  DayNightLine,
  NIGHT_GATHER_PENALTY_PCT,
  dayNightStatus,
} from "./DayNightLine";
import { resolveBoardLightPhase } from "../BoardLiving";
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

/** One tick inside each phase of the first day: dawn 0-539, day 540-1979, dusk 1980-2519, night 2520-3599. */
const TICK = { dawn: 100, day: 1000, dusk: 2200, night: 3000 } as const;
const DAY_TICKS = 3600;

function at(tick: number, seed = 1): GameState {
  const s = createGameState({ seed });
  s.meta.tick = tick;
  return s;
}

/** Wood banked when a player gather column carrying `load` gets home at `tick`. Runs the sim's own rule. */
function woodBankedAt(tick: number, load: number, seed = 1): number {
  const s = at(tick, seed);
  const home = s.board.homeProvinceId;
  const gather: Gather = {
    id: "g-test",
    realmId: "player",
    fromId: home,
    toId: home,
    node: "woodcut",
    force: {},
    phase: "returning",
    departedTick: tick - 20,
    arrivesTick: tick,
    travelTicks: 10,
    gatherStartedTick: tick - 10,
    capacity: String(load),
    load: String(load),
  };
  s.flags.gathers_json = JSON.stringify([gather]);
  const before = Number(s.resources.wood ?? "0");
  GatherSystem.processEventsAt(s, tick);
  return Number(s.resources.wood ?? "0") - before;
}

describe("dayNightStatus", () => {
  it("names each phase of the day", () => {
    for (const phase of ["dawn", "day", "dusk", "night"] as const) {
      const st = dayNightStatus(at(TICK[phase]));
      expect(st.phase).toBe(phase);
      expect(st.name).toBe(DAY_PHASE_NAMES[phase]);
      expect(st.isNight).toBe(phase === "night");
    }
  });

  it("cuts gather hauls at night only", () => {
    const night = dayNightStatus(at(TICK.night));
    expect(night.gatherPenaltyPct).toBe(20);
    expect(night.workText).toBe("Gather columns that get home now bring 20% less");
    for (const phase of ["dawn", "day", "dusk"] as const) {
      const st = dayNightStatus(at(TICK[phase]));
      expect(st.gatherPenaltyPct).toBe(0);
      expect(st.workText).toBe("Gather columns bring full loads home");
    }
  });

  it("says sight is the same in every phase", () => {
    for (const phase of ["dawn", "day", "dusk", "night"] as const) {
      expect(dayNightStatus(at(TICK[phase])).sightText).toBe(DAY_NIGHT_SIGHT_TEXT);
    }
  });

  it("turns at the phase edges and repeats every day", () => {
    const phaseAt = (tick: number) => dayNightStatus(at(tick)).phase;
    expect(phaseAt(0)).toBe("dawn");
    expect(phaseAt(539)).toBe("dawn");
    expect(phaseAt(540)).toBe("day");
    expect(phaseAt(1979)).toBe("day");
    expect(phaseAt(1980)).toBe("dusk");
    expect(phaseAt(2519)).toBe("dusk");
    expect(phaseAt(2520)).toBe("night");
    expect(phaseAt(3599)).toBe("night");
    expect(phaseAt(3600)).toBe("dawn");
    expect(phaseAt(TICK.night + DAY_TICKS * 3)).toBe("night");
  });
});

describe("display copies match the sim", () => {
  it("night on the line is exactly when the sim's moon is up, and matches the board light", () => {
    const s = at(0);
    for (let tick = 0; tick < DAY_TICKS * 2; tick += 7) {
      s.meta.tick = tick;
      const st = dayNightStatus(s);
      expect(st.isNight).toBe(sunMoonPositionAt(tick).kind === "moon");
      expect(st.phase).toBe(resolveBoardLightPhase(s));
    }
  });

  it("a gather column that gets home at night banks 20% less, in the sim", () => {
    // Night tick 3000 and dawn tick 3700 sit in the same season, so the sky is the same for both.
    const nightTick = 3000;
    const dawnTick = 3700;
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(currentSeason(at(nightTick, seed))).toBe(currentSeason(at(dawnTick, seed)));
      expect(dayNightStatus(at(nightTick, seed)).isNight).toBe(true);
      expect(dayNightStatus(at(dawnTick, seed)).isNight).toBe(false);
      const full = woodBankedAt(dawnTick, 100000, seed);
      const cut = woodBankedAt(nightTick, 100000, seed);
      expect(full).toBeGreaterThan(0);
      expect(cut / full).toBeCloseTo(1 - NIGHT_GATHER_PENALTY_PCT / 100, 3);
    }
  });

  it("dawn, day and dusk bank the same haul", () => {
    // Dawn tick 100, day tick 1000 and dusk tick 1990 are all in Spring, so the sky is the same for all three.
    expect(woodBankedAt(1000, 100000)).toBe(woodBankedAt(1990, 100000));
    expect(woodBankedAt(100, 100000)).toBe(woodBankedAt(1000, 100000));
  });

  it("the hour does not change what the realm sees", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      // Night tick 3000 and dawn tick 3700: same season and sky, different hour.
      const night = at(3000, seed);
      const dawn = at(3700, seed);
      expect(visionRange(night)).toBe(visionRange(dawn));
      for (const p of night.board.provinces) {
        expect(isProvinceSeen(night, p.id)).toBe(isProvinceSeen(dawn, p.id));
      }
    }
  });
});

describe("DayNightLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<DayNightLine state={undefined} />)).toBe("");
  });

  it("shows the phase, the work effect and the sight effect by day", () => {
    const html = renderToStaticMarkup(<DayNightLine state={at(TICK.day)} />);
    expect(html).toContain("sc-day-night is-day");
    expect(html).toContain('data-day-phase="day"');
    expect(html).toContain('data-gather-penalty-pct="0"');
    expect(html).toContain("Time of day");
    expect(html).toContain("<strong>Day</strong>");
    expect(html).toContain("Gather columns bring full loads home");
    expect(html).toContain(DAY_NIGHT_SIGHT_TEXT);
  });

  it("warns about gather hauls at night", () => {
    const html = renderToStaticMarkup(<DayNightLine state={at(TICK.night)} />);
    expect(html).toContain("sc-day-night is-night");
    expect(html).toContain('data-day-phase="night"');
    expect(html).toContain('data-gather-penalty-pct="20"');
    expect(html).toContain("<strong>Night</strong>");
    expect(html).toContain("Gather columns that get home now bring 20% less");
  });

  it("keeps the icon decorative", () => {
    const html = renderToStaticMarkup(<DayNightLine state={at(TICK.dusk)} />);
    expect(html).toContain('class="sc-day-night-icon"');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("where the line shows", () => {
  it("shows on the Kingdom tab", () => {
    const s = at(TICK.night);
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-day-night is-night");
    expect(html).toContain("Gather columns that get home now bring 20% less");
  });

  it("shows on the inspect card for a seen tile", () => {
    const s = at(TICK.dawn);
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain("sc-day-night is-dawn");
    expect(html).toContain("<strong>Dawn</strong>");
  });

  it("stays off the inspect card for an unseen tile", () => {
    const s = at(TICK.day);
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).not.toContain("sc-day-night");
  });
});

describe("day-night-line.css", () => {
  const css = readFile("./day-night-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      ".sc-day-night",
      ".sc-day-night-icon",
      ".sc-day-night-text",
      ".sc-day-night-label",
      ".sc-day-night-work",
      ".sc-day-night-sight",
      ".sc-day-night.is-dawn",
      ".sc-day-night.is-day",
      ".sc-day-night.is-dusk",
      ".sc-day-night.is-night",
    ]) {
      expect(css).toContain(cls);
    }
  });

  it("is scoped to its own prefix and leaves theme.css alone", () => {
    const selectors = css.match(/^[^{}/@\r\n][^{}]*\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) expect(sel.trim().startsWith(".sc-day-night")).toBe(true);
    expect(readFile("../theme.css")).not.toContain("sc-day-night");
  });
});
