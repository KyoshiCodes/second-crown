import type { GameState } from "@second-crown/shared";
import { livingSwitches } from "./livingRealm.js";
import { weatherFor, type Weather } from "./weather.js";
import { dayPhase, type DayPhase } from "./dayNight.js";

// Route B slice 0: read-only presentation snapshots for the client (audio and weather particles).
// The sim never plays sound or draws particles. Pure reads of weather and day phase; no state.

export type AudioAmbientId = "hold_dawn" | "hold_day" | "hold_dusk" | "hold_night";
export type AudioWeatherLayerId = "clear" | "rain" | "wind" | "mist";
export type WeatherParticleKind = "rain" | "mist" | "none";

export interface AudioSnapshot {
  /** Fixed ambient bed id from the day phase. */
  ambient: AudioAmbientId;
  /** Fixed weather layer id from the current weather. */
  weatherLayer: AudioWeatherLayerId;
  /** Suggested mix volume, 0 to 1. */
  volume: number;
}

export interface WeatherParticleSnapshot {
  kind: WeatherParticleKind;
  /** 0 to 1. Zero when kind is "none". */
  intensity: number;
}

export const AUDIO_AMBIENT: Readonly<Record<DayPhase, AudioAmbientId>> = {
  dawn: "hold_dawn",
  day: "hold_day",
  dusk: "hold_dusk",
  night: "hold_night",
};

export const AUDIO_WEATHER_LAYER: Readonly<Record<Weather, AudioWeatherLayerId>> = {
  clear: "clear",
  rain: "rain",
  storm: "wind",
  snow: "mist",
};

/** Base volume per weather. Night plays at AUDIO_NIGHT_FACTOR of it. */
export const AUDIO_VOLUME: Readonly<Record<Weather, number>> = {
  clear: 0.5,
  rain: 0.6,
  storm: 0.8,
  snow: 0.4,
};
export const AUDIO_NIGHT_FACTOR = 0.75;

export const WEATHER_PARTICLES: Readonly<Record<Weather, WeatherParticleSnapshot>> = {
  clear: { kind: "none", intensity: 0 },
  rain: { kind: "rain", intensity: 0.6 },
  storm: { kind: "rain", intensity: 1 },
  snow: { kind: "mist", intensity: 0.5 },
};

/** Route B slice 0: audio cue ids and volume. Null with living_audio off. */
export function audioSnapshot(state: GameState): AudioSnapshot | null {
  if (!livingSwitches(state).audio) return null;
  const weather = weatherFor(state);
  const phase = dayPhase(state);
  const base = AUDIO_VOLUME[weather] ?? AUDIO_VOLUME.clear;
  const volume = phase === "night" ? base * AUDIO_NIGHT_FACTOR : base;
  return {
    ambient: AUDIO_AMBIENT[phase] ?? AUDIO_AMBIENT.day,
    weatherLayer: AUDIO_WEATHER_LAYER[weather] ?? AUDIO_WEATHER_LAYER.clear,
    volume: Math.min(1, Math.max(0, volume)),
  };
}

/** Route B slice 0: weather particle kind and intensity. Null with living_weather_particles off. */
export function weatherParticleSnapshot(state: GameState): WeatherParticleSnapshot | null {
  if (!livingSwitches(state).weatherParticles) return null;
  const p = WEATHER_PARTICLES[weatherFor(state)] ?? WEATHER_PARTICLES.clear;
  return { kind: p.kind, intensity: p.intensity };
}

// Route B slice 1: lighting tint for the current board. Pure read of day phase and weather.

export type LightingTimeOfDay = DayPhase;
export type LightingWeatherTint = "clear" | "rain" | "storm" | "snow";

export interface LightingSnapshot {
  /** Day phase from the existing day cycle. */
  timeOfDay: LightingTimeOfDay;
  /** Short tint id from the current weather. */
  weatherTint: LightingWeatherTint;
  /** How strong the tint should be, 0 to 1. */
  intensity: number;
}

export const LIGHTING_WEATHER_TINT: Readonly<Record<Weather, LightingWeatherTint>> = {
  clear: "clear",
  rain: "rain",
  storm: "storm",
  snow: "snow",
};

/** Base tint strength per phase (full day light needs no tint). */
export const LIGHTING_PHASE_INTENSITY: Readonly<Record<DayPhase, number>> = {
  dawn: 0.3,
  day: 0,
  dusk: 0.35,
  night: 0.6,
};

/** Added tint strength per weather. Sum is clamped to 0..1. */
export const LIGHTING_WEATHER_INTENSITY: Readonly<Record<Weather, number>> = {
  clear: 0,
  rain: 0.2,
  storm: 0.35,
  snow: 0.15,
};

/** Route B slice 1: lighting tint. Null with living_lighting off. */
export function lightingSnapshot(state: GameState): LightingSnapshot | null {
  if (!livingSwitches(state).lighting) return null;
  const weather = weatherFor(state);
  const phase = dayPhase(state);
  const raw = (LIGHTING_PHASE_INTENSITY[phase] ?? 0) + (LIGHTING_WEATHER_INTENSITY[weather] ?? 0);
  return {
    timeOfDay: phase,
    weatherTint: LIGHTING_WEATHER_TINT[weather] ?? "clear",
    intensity: Math.round(Math.min(1, Math.max(0, raw)) * 1000) / 1000,
  };
}
