import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  audioSnapshot,
  createGameState,
  lightingSnapshot,
  setLivingSwitch,
  type AudioWeatherLayerId,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardLightingTint,
  resolveBoardLighting,
} from "./BoardLightingTint";

const DAY_CYCLE_TICKS = 3600;
const DAY = 7 * DAY_CYCLE_TICKS;
const DAWN = DAY + 100;
const MIDDAY = DAY + 1200;
const DUSK = DAY + 2200;
const NIGHT = DAY + 3000;

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function freshState(tick = MIDDAY, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
  return s;
}

function withWeatherLayer(layer: AudioWeatherLayerId, tick = MIDDAY): GameState {
  for (let seed = 1; seed <= 500; seed++) {
    const s = freshState(tick, seed);
    if (audioSnapshot(s)?.weatherLayer === layer) return s;
  }
  throw new Error(`no seed found with weatherLayer ${layer}`);
}

function snowState(tickOffset = 1200): GameState {
  for (let day = 0; day < 400; day++) {
    for (let seed = 1; seed <= 40; seed++) {
      const s = freshState(day * DAY_CYCLE_TICKS + tickOffset, seed);
      if (audioSnapshot(s)?.weatherLayer === "mist") return s;
    }
  }
  throw new Error("no snow seed found");
}

describe("Route B Slice 1: board lighting tint presentation", () => {
  it("resolves calm phase/weather lighting tints, scales opacity by intensity, and hides on null or living_lighting off", () => {
    expect(resolveBoardLighting(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardLightingTint state={undefined} />)).toBe("");

    const phases = [
      { tick: DAWN, phase: "dawn" },
      { tick: MIDDAY, phase: "day" },
      { tick: DUSK, phase: "dusk" },
      { tick: NIGHT, phase: "night" },
    ] as const;

    const views = phases.map(({ tick, phase }) => {
      const s = withWeatherLayer("clear", tick);
      const snap = lightingSnapshot(s)!;
      const view = resolveBoardLighting(s)!;
      expect(view.timeOfDay).toBe(phase);
      expect(view.weatherTint).toBe("clear");
      expect(view.intensity).toBe(snap.intensity);
      expect(view.phaseOpacity).toBeGreaterThan(0);
      expect(view.phaseOpacity).toBeLessThanOrEqual(0.3);
      return view;
    });

    // Day/dawn/dusk/night read as distinct calm strengths
    expect(views[0].phaseOpacity).toBeGreaterThan(views[1].phaseOpacity);
    expect(views[2].phaseOpacity).toBeGreaterThan(views[0].phaseOpacity);
    expect(views[3].phaseOpacity).toBeGreaterThan(views[2].phaseOpacity);

    // Clear weather omits weather tint layer; rain/storm/snow include light weather shift
    const clearDayHtml = renderToStaticMarkup(<BoardLightingTint state={withWeatherLayer("clear", MIDDAY)} />);
    expect(clearDayHtml).toContain("sc-btint-overlay is-phase-day is-weather-clear");
    expect(clearDayHtml).toContain("sc-btint-phase");
    expect(clearDayHtml).not.toContain("sc-btint-weather");

    const rainDay = withWeatherLayer("rain", MIDDAY);
    const stormNight = withWeatherLayer("wind", NIGHT);
    const snowDay = snowState(1200);

    const rainView = resolveBoardLighting(rainDay)!;
    const stormView = resolveBoardLighting(stormNight)!;
    const snowView = resolveBoardLighting(snowDay)!;
    expect(stormView.phaseOpacity).toBeGreaterThan(rainView.phaseOpacity);
    expect(stormView.weatherOpacity).toBeGreaterThan(snowView.weatherOpacity);
    expect(stormView.weatherOpacity).toBeLessThanOrEqual(0.2);

    const rainHtml = renderToStaticMarkup(<BoardLightingTint state={rainDay} />);
    expect(rainHtml).toContain("is-weather-rain");
    expect(rainHtml).toContain("sc-btint-weather");

    const snowHtml = renderToStaticMarkup(<BoardLightingTint state={snowDay} />);
    expect(snowHtml).toContain("is-weather-snow");
    expect(snowHtml).toContain("sc-btint-weather");

    // Flag off hides cleanly
    setLivingSwitch(stormNight, "lighting", false);
    expect(resolveBoardLighting(stormNight)).toBeNull();
    expect(renderToStaticMarkup(<BoardLightingTint state={stormNight} />)).toBe("");
  });

  it("integrates into BoardLiving without breaking Slice 0 audio or weather particle layers", () => {
    const rainNight = withWeatherLayer("rain", NIGHT);
    const snap = lightingSnapshot(rainNight)!;

    const html = renderToStaticMarkup(<BoardLiving visible state={rainNight} selectedId={null} />);
    expect(html).toContain(`data-btint-phase="${snap.timeOfDay}"`);
    expect(html).toContain(`data-btint-weather="${snap.weatherTint}"`);
    expect(html).toContain(`data-btint-intensity="${snap.intensity.toFixed(3)}"`);
    expect(html).toContain("sc-btint-overlay");
    expect(html).toContain("sc-bwpart-overlay");
    expect(html).toContain("sc-baudio-bridge");

    // Lighting off keeps Slice 0 audio & particles intact
    setLivingSwitch(rainNight, "lighting", false);
    const noLightingHtml = renderToStaticMarkup(<BoardLiving visible state={rainNight} selectedId={null} />);
    expect(noLightingHtml).not.toContain("sc-btint-overlay");
    expect(noLightingHtml).toContain("sc-bwpart-overlay");
    expect(noLightingHtml).toContain("sc-baudio-bridge");

    // Slice 0 off keeps lighting intact
    setLivingSwitch(rainNight, "lighting", true);
    setLivingSwitch(rainNight, "audio", false);
    setLivingSwitch(rainNight, "weatherParticles", false);
    const lightingOnlyHtml = renderToStaticMarkup(<BoardLiving visible state={rainNight} selectedId={null} />);
    expect(lightingOnlyHtml).toContain("sc-btint-overlay");
    expect(lightingOnlyHtml).not.toContain("sc-bwpart-overlay");
    expect(lightingOnlyHtml).not.toContain("sc-baudio-bridge");
  });

  it("reads lightingSnapshot without mutating GameState", () => {
    const s = withWeatherLayer("wind", DUSK);
    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain("sc-btint-overlay");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates lighting CSS with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, no heavy filters, and zero forbidden selectors", () => {
    const css = readTextFile("./board-lighting-tint.css");
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toContain("backdrop-filter");

    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const token of forbidden) {
      expect(css).not.toContain(token);
    }
  });
});
