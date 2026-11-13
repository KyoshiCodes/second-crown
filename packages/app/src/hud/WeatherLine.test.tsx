import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, visionRange, type GameState } from "@second-crown/sim";
// The sim does not export its weather module from its index, so the checks below read it directly.
// Test only: the app itself never reaches into the sim's files.
import {
  fogThickness,
  gatherYieldFactor,
  marchSpeedFactor,
  weatherFor,
} from "../../../sim/src/systems/weather";
import {
  WEATHER_FOG_THICKNESS,
  WEATHER_GATHER_YIELD,
  WEATHER_MARCH_SPEED,
  WEATHER_NAMES,
  WeatherLine,
  currentWeather,
  keepSightReach,
  weatherStatus,
  type WeatherKind,
} from "./WeatherLine";
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

const KINDS: WeatherKind[] = ["clear", "rain", "storm", "snow"];
/** First tick of each season: Spring 0, Summer 2000, Autumn 4000, Winter 6000. */
const SEASON_TICKS = [0, 2000, 4000, 6000];

function at(tick: number, seed = 1): GameState {
  const s = createGameState({ seed });
  s.meta.tick = tick;
  return s;
}

/** A fresh realm under the wanted sky, found by asking the sim. */
function stateWith(weather: WeatherKind): GameState {
  for (let seed = 1; seed < 500; seed++) {
    for (const tick of SEASON_TICKS) {
      const s = at(tick, seed);
      if (weatherFor(s) === weather) return s;
    }
  }
  throw new Error(`no seed rolls ${weather}`);
}

/** Same realm with `n` finished watchtowers, so the keep sees further than one tile. */
function withWatchtowers(s: GameState, n: number): GameState {
  for (let i = 0; i < n; i++) {
    s.buildings.push({ id: `wt-${i}`, typeId: "watchtower", realmId: "player", x: 20 + i, y: 20, level: 1, completesAtTick: null });
  }
  return s;
}

describe("display copies match the sim", () => {
  it("the sky on the line is the sim's sky, for every seed and season tried", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      for (const tick of [0, 1999, 2000, 3500, 4000, 6000, 7999, 8000, 14000, 123456]) {
        const s = at(tick, seed);
        expect(currentWeather(s)).toBe(weatherFor(s));
        seen.add(currentWeather(s));
      }
    }
    expect([...seen].sort()).toEqual([...KINDS].sort());
  });

  it("march, gather and fog numbers equal the sim's", () => {
    for (const w of KINDS) {
      expect(WEATHER_MARCH_SPEED[w]).toBe(marchSpeedFactor(w));
      expect(WEATHER_GATHER_YIELD[w]).toBe(gatherYieldFactor(w));
      expect(WEATHER_FOG_THICKNESS[w]).toBe(fogThickness(w));
    }
  });

  it("the sight reach on the line is exactly how far the sim's keep sees", () => {
    for (const w of KINDS) {
      for (const towers of [0, 1, 2, 4, 6]) {
        const s = withWatchtowers(stateWith(w), towers);
        expect(visionRange(s)).toBe(1 + towers);
        // Forget every scouted tile but the keep, so only the keep's own sight is left.
        s.flags.fog_seen = JSON.stringify([s.board.homeProvinceId]);
        const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
        const reach = weatherStatus(s).sightReach;
        for (const p of s.board.provinces) {
          if (p.id === home.id) continue;
          const d = Math.abs(p.x - home.x) + Math.abs(p.y - home.y);
          expect(isProvinceSeen(s, p.id)).toBe(d <= reach);
        }
      }
    }
  });
});

describe("keepSightReach", () => {
  it("is the full range under a clear sky and shorter in thick fog", () => {
    expect(keepSightReach(5, 1)).toBe(5);
    expect(keepSightReach(5, 1.2)).toBe(4);
    expect(keepSightReach(5, 1.4)).toBe(3);
    expect(keepSightReach(1, 1.2)).toBe(0);
    expect(keepSightReach(7, 1.4)).toBe(5);
  });
});

describe("weatherStatus", () => {
  it("clear changes nothing", () => {
    const st = weatherStatus(stateWith("clear"));
    expect(st.name).toBe("Clear");
    expect(st.isCalm).toBe(true);
    expect(st.sightText).toBe("Sight: normal");
    expect(st.marchText).toBe("Marches: normal");
    expect(st.gatherText).toBe("Gather hauls: normal");
  });

  it("rain slows marches and cuts gather hauls, sight stays normal", () => {
    const st = weatherStatus(stateWith("rain"));
    expect(st.name).toBe("Rain");
    expect(st.isCalm).toBe(false);
    expect(st.sightText).toBe("Sight: normal");
    expect(st.marchSlowPct).toBe(20);
    expect(st.marchText).toBe("Marches: 20% slower");
    expect(st.gatherPenaltyPct).toBe(10);
    expect(st.gatherText).toBe("Gather hauls: 10% less");
  });

  it("storm shortens sight, slows marches most and cuts gather hauls most", () => {
    const st = weatherStatus(withWatchtowers(stateWith("storm"), 4));
    expect(st.name).toBe("Storm");
    expect(st.sightClearReach).toBe(5);
    expect(st.sightReach).toBe(3);
    expect(st.sightText).toBe("Sight: keep sees 3 tiles out, down from 5");
    expect(st.marchText).toBe("Marches: 40% slower");
    expect(st.gatherText).toBe("Gather hauls: 25% less");
  });

  it("snow shortens sight only", () => {
    const st = weatherStatus(withWatchtowers(stateWith("snow"), 4));
    expect(st.name).toBe("Snow");
    expect(st.isCalm).toBe(false);
    expect(st.sightText).toBe("Sight: keep sees 4 tiles out, down from 5");
    expect(st.marchText).toBe("Marches: normal");
    expect(st.gatherText).toBe("Gather hauls: normal");
  });

  it("says 1 tile, not 1 tiles", () => {
    const st = weatherStatus(withWatchtowers(stateWith("snow"), 1));
    expect(st.sightText).toBe("Sight: keep sees 1 tile out, down from 2");
  });

  it("holds through the whole season", () => {
    const s = at(2000, 7);
    const first = weatherStatus(s).weather;
    s.meta.tick = 3999;
    expect(weatherStatus(s).weather).toBe(first);
  });
});

describe("WeatherLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<WeatherLine state={undefined} />)).toBe("");
  });

  it("shows the sky and all three effects", () => {
    for (const w of KINDS) {
      const s = stateWith(w);
      const st = weatherStatus(s);
      const html = renderToStaticMarkup(<WeatherLine state={s} />);
      expect(html).toContain(`sc-weather-line is-${w}`);
      expect(html).toContain(`data-weather="${w}"`);
      expect(html).toContain("Weather");
      expect(html).toContain(`<strong>${WEATHER_NAMES[w]}</strong>`);
      expect(html).toContain(st.sightText);
      expect(html).toContain(st.marchText);
      expect(html).toContain(st.gatherText);
    }
  });

  it("marks only the effects the sky changes", () => {
    const rain = renderToStaticMarkup(<WeatherLine state={stateWith("rain")} />);
    expect(rain).toContain('data-march-slow-pct="20"');
    expect(rain).toContain('data-gather-penalty-pct="10"');
    expect(rain).toContain('class="sc-weather-line-sight"');
    expect(rain).toContain('class="sc-weather-line-march is-hit"');
    expect(rain).toContain('class="sc-weather-line-gather is-hit"');
    const clear = renderToStaticMarkup(<WeatherLine state={stateWith("clear")} />);
    expect(clear).toContain("is-calm");
    expect(clear).not.toContain("is-hit");
  });

  it("keeps the icon decorative", () => {
    const html = renderToStaticMarkup(<WeatherLine state={stateWith("storm")} />);
    expect(html).toContain('class="sc-weather-line-icon"');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("where the line shows", () => {
  it("shows on the Kingdom tab", () => {
    const s = stateWith("rain");
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-weather-line is-rain");
    expect(html).toContain("Marches: 20% slower");
  });

  it("shows on the inspect card for a seen tile", () => {
    const s = stateWith("storm");
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain("sc-weather-line is-storm");
    expect(html).toContain("<strong>Storm</strong>");
  });

  it("stays off the inspect card for an unseen tile", () => {
    const s = stateWith("clear");
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).not.toContain("sc-weather-line");
  });
});

describe("weather-line.css", () => {
  const css = readFile("./weather-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      ".sc-weather-line",
      ".sc-weather-line-icon",
      ".sc-weather-line-text",
      ".sc-weather-line-label",
      ".sc-weather-line-sight",
      ".sc-weather-line-march",
      ".sc-weather-line-gather",
      ".sc-weather-line.is-clear",
      ".sc-weather-line.is-rain",
      ".sc-weather-line.is-storm",
      ".sc-weather-line.is-snow",
      ".is-hit",
    ]) {
      expect(css).toContain(cls);
    }
  });

  it("is scoped to its own prefix and leaves theme.css alone", () => {
    const selectors = css.match(/^[^{}/@\r\n][^{}]*\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) expect(sel.trim().startsWith(".sc-weather-line")).toBe(true);
    expect(readFile("../theme.css")).not.toContain("sc-weather-line");
  });
});
