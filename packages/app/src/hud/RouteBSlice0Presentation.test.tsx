import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  audioSnapshot,
  createGameState,
  setLivingSwitch,
  weatherParticleSnapshot,
  type AudioWeatherLayerId,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  AMBIENT_MASTER_CEILING,
  BoardAmbientAudioEngine,
  BoardAudioBridge,
  WEATHER_LAYER_PROFILES,
  resolveBoardAudio,
} from "./BoardAmbientAudio";
import {
  BoardWeatherParticles,
  resolveBoardWeatherParticles,
} from "./BoardWeatherParticles";

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

function snowState(): GameState {
  for (let day = 0; day < 400; day++) {
    for (let seed = 1; seed <= 40; seed++) {
      const s = freshState(day * DAY_CYCLE_TICKS + 1200, seed);
      if (audioSnapshot(s)?.weatherLayer === "mist") return s;
    }
  }
  throw new Error("no snow seed found");
}

function makeFakeAudioContext() {
  const makeParam = (initial = 0) => ({
    value: initial,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn((target: number) => {
      param.value = target;
    }),
  });
  let param: ReturnType<typeof makeParam>;

  const gains: Array<{ gain: ReturnType<typeof makeParam>; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
  const filters: Array<{
    type: BiquadFilterType;
    frequency: ReturnType<typeof makeParam>;
    Q: ReturnType<typeof makeParam>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const oscillators: Array<{
    type: OscillatorType;
    frequency: ReturnType<typeof makeParam>;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const bufferSources: Array<{
    buffer: unknown;
    loop: boolean;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  const ctx = {
    state: "running" as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(async () => {
      ctx.state = "running";
    }),
    close: vi.fn(async () => {
      ctx.state = "closed";
    }),
    createGain: vi.fn(() => {
      param = makeParam(1);
      const node = { gain: param, connect: vi.fn(), disconnect: vi.fn() };
      gains.push(node);
      return node;
    }),
    createBiquadFilter: vi.fn(() => {
      const freq = makeParam(350);
      const q = makeParam(1);
      const node = {
        type: "lowpass" as BiquadFilterType,
        frequency: freq,
        Q: q,
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      filters.push(node);
      return node;
    }),
    createOscillator: vi.fn(() => {
      const freq = makeParam(440);
      const node = {
        type: "sine" as OscillatorType,
        frequency: freq,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
      oscillators.push(node);
      return node;
    }),
    createBuffer: vi.fn((_ch: number, len: number) => {
      const data = new Float32Array(len);
      return { getChannelData: () => data };
    }),
    createBufferSource: vi.fn(() => {
      const node = {
        buffer: null as unknown,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
      bufferSources.push(node);
      return node;
    }),
  };

  return {
    ctx: ctx as unknown as AudioContext,
    raw: ctx,
    gains,
    filters,
    oscillators,
    bufferSources,
  };
}

describe("Route B Slice 0: board audio and weather particle presentation", () => {
  it("renders light rain and mist particle overlays on the board with intensity controlling density, and hides on none or flag off", () => {
    expect(resolveBoardWeatherParticles(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardWeatherParticles state={undefined} />)).toBe("");

    const clear = withWeatherLayer("clear");
    expect(weatherParticleSnapshot(clear)).toEqual({ kind: "none", intensity: 0 });
    expect(resolveBoardWeatherParticles(clear)).toBeNull();
    expect(renderToStaticMarkup(<BoardWeatherParticles state={clear} />)).toBe("");
    const clearBoardHtml = renderToStaticMarkup(<BoardLiving visible state={clear} selectedId={null} />);
    expect(clearBoardHtml).not.toContain("sc-bwpart-overlay");

    const rain = withWeatherLayer("rain");
    const rainView = resolveBoardWeatherParticles(rain)!;
    expect(rainView.kind).toBe("rain");
    expect(rainView.intensity).toBe(0.6);

    const storm = withWeatherLayer("wind");
    const stormView = resolveBoardWeatherParticles(storm)!;
    expect(stormView.kind).toBe("rain");
    expect(stormView.intensity).toBe(1);
    expect(stormView.particles.length).toBeGreaterThan(rainView.particles.length);

    const rainBoardHtml = renderToStaticMarkup(<BoardLiving visible state={rain} selectedId={null} />);
    expect(rainBoardHtml).toContain("sc-bwpart-overlay is-rain");
    expect(rainBoardHtml).toContain('data-bwpart-kind="rain"');
    expect(rainBoardHtml).toContain('data-bwpart-intensity="0.60"');
    expect(rainBoardHtml).toContain("sc-bwpart-drop");

    const snow = snowState();
    const mistView = resolveBoardWeatherParticles(snow)!;
    expect(mistView.kind).toBe("mist");
    expect(mistView.intensity).toBe(0.5);
    const mistHtml = renderToStaticMarkup(<BoardWeatherParticles state={snow} />);
    expect(mistHtml).toContain("sc-bwpart-overlay is-mist");
    expect(mistHtml).toContain('data-bwpart-kind="mist"');
    expect(mistHtml).toContain("sc-bwpart-wisp");

    // Flag off hides particle overlay while leaving other living board layers intact
    setLivingSwitch(rain, "weatherParticles", false);
    expect(resolveBoardWeatherParticles(rain)).toBeNull();
    const disabledHtml = renderToStaticMarkup(<BoardLiving visible state={rain} selectedId={null} />);
    expect(disabledHtml).toContain("sc-board-living-keeps");
    expect(disabledHtml).not.toContain("sc-bwpart-overlay");
  });

  it("resolves audioSnapshot accurately and renders BoardAudioBridge only when living_audio is enabled", () => {
    expect(resolveBoardAudio(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardAudioBridge state={undefined} />)).toBe("");

    for (const tick of [DAWN, MIDDAY, DUSK, NIGHT]) {
      const s = freshState(tick);
      expect(resolveBoardAudio(s)).toEqual(audioSnapshot(s));
    }

    const stormNight = withWeatherLayer("wind", NIGHT);
    const expected = audioSnapshot(stormNight)!;
    const html = renderToStaticMarkup(<BoardLiving visible state={stormNight} selectedId={null} />);
    expect(html).toContain("sc-baudio-bridge");
    expect(html).toContain(`data-baudio-ambient="${expected.ambient}"`);
    expect(html).toContain(`data-baudio-weather="${expected.weatherLayer}"`);
    expect(html).toContain(`data-baudio-volume="${expected.volume.toFixed(3)}"`);

    setLivingSwitch(stormNight, "audio", false);
    expect(resolveBoardAudio(stormNight)).toBeNull();
    const mutedHtml = renderToStaticMarkup(<BoardLiving visible state={stormNight} selectedId={null} />);
    expect(mutedHtml).not.toContain("sc-baudio-bridge");
    expect(mutedHtml).toContain("sc-bwpart-overlay");
  });

  it("starts ambient loop, crossfades weather layers, respects volume, and stops cleanly when null or AudioContext is missing", () => {
    const fake = makeFakeAudioContext();
    const engine = new BoardAmbientAudioEngine({ createContext: () => fake.ctx });

    expect(engine.isRunning()).toBe(false);

    // Rain at day: ambient loop starts, rain branch active, wind/mist 0
    engine.sync({ ambient: "hold_day", weatherLayer: "rain", volume: 0.6 });
    expect(engine.isRunning()).toBe(true);
    expect(fake.oscillators).toHaveLength(2);
    expect(fake.bufferSources).toHaveLength(1);
    expect(engine.getState().masterGain).toBeCloseTo(0.6 * AMBIENT_MASTER_CEILING, 6);
    expect(engine.getState().layerGains).toEqual({
      rain: WEATHER_LAYER_PROFILES.rain.gain,
      wind: 0,
      mist: 0,
    });

    // Crossfade to wind at night (quieter volume)
    engine.sync({ ambient: "hold_night", weatherLayer: "wind", volume: 0.45 });
    expect(engine.getState().masterGain).toBeCloseTo(0.45 * AMBIENT_MASTER_CEILING, 6);
    expect(engine.getState().layerGains).toEqual({
      rain: 0,
      wind: WEATHER_LAYER_PROFILES.wind.gain,
      mist: 0,
    });

    // Crossfade to mist, then clear (all weather layers at 0, ambient still running)
    engine.sync({ ambient: "hold_dusk", weatherLayer: "mist", volume: 0.4 });
    expect(engine.getState().layerGains).toEqual({
      rain: 0,
      wind: 0,
      mist: WEATHER_LAYER_PROFILES.mist.gain,
    });

    engine.sync({ ambient: "hold_dawn", weatherLayer: "clear", volume: 0.5 });
    expect(engine.isRunning()).toBe(true);
    expect(engine.getState().layerGains).toEqual({ rain: 0, wind: 0, mist: 0 });

    // Null snapshot (flag off / unmounted) stops cleanly
    engine.sync(null);
    expect(engine.isRunning()).toBe(false);
    expect(engine.getState().snapshot).toBeNull();
    expect(engine.getState().masterGain).toBe(0);
    expect(fake.oscillators[0].stop).toHaveBeenCalledTimes(1);
    expect(fake.oscillators[1].stop).toHaveBeenCalledTimes(1);
    expect(fake.bufferSources[0].stop).toHaveBeenCalledTimes(1);
    expect(fake.raw.close).toHaveBeenCalledTimes(1);

    // Safe no-op without Web Audio
    const noAudioEngine = new BoardAmbientAudioEngine({ createContext: () => null });
    expect(() => noAudioEngine.sync({ ambient: "hold_day", weatherLayer: "rain", volume: 0.6 })).not.toThrow();
    expect(noAudioEngine.isRunning()).toBe(false);
    expect(() => noAudioEngine.stop()).not.toThrow();
  });

  it("reads snapshots without mutating GameState", () => {
    const s = withWeatherLayer("wind", NIGHT);
    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain("sc-bwpart-overlay");
    expect(html).toContain("sc-baudio-bridge");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates particle CSS with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, and zero forbidden selectors", () => {
    const css = readTextFile("./board-weather-particles.css");
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

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
