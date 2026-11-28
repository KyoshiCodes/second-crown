import React from "react";
import {
  audioSnapshot,
  type AudioAmbientId,
  type AudioSnapshot,
  type AudioWeatherLayerId,
  type GameState,
} from "@second-crown/sim";

export const AMBIENT_MASTER_CEILING = 0.08;
export const WEATHER_CROSSFADE_SEC = 0.8;

export type WeatherAudioBranch = Exclude<AudioWeatherLayerId, "clear">;

export const AMBIENT_LOOP_PROFILES: Readonly<
  Record<AudioAmbientId, { primaryHz: number; harmonicHz: number; filterHz: number }>
> = {
  hold_dawn: { primaryHz: 146.83, harmonicHz: 220, filterHz: 420 },
  hold_day: { primaryHz: 130.81, harmonicHz: 196, filterHz: 480 },
  hold_dusk: { primaryHz: 110, harmonicHz: 164.81, filterHz: 360 },
  hold_night: { primaryHz: 98, harmonicHz: 146.83, filterHz: 260 },
};

export const WEATHER_LAYER_PROFILES: Readonly<
  Record<WeatherAudioBranch, { filterType: BiquadFilterType; frequency: number; q: number; gain: number }>
> = {
  rain: { filterType: "bandpass", frequency: 1400, q: 0.9, gain: 0.55 },
  wind: { filterType: "bandpass", frequency: 420, q: 2.2, gain: 0.5 },
  mist: { filterType: "lowpass", frequency: 620, q: 0.7, gain: 0.32 },
};

const WEATHER_BRANCHES: readonly WeatherAudioBranch[] = ["rain", "wind", "mist"];

/**
 * Pure wrapper around `audioSnapshot(state)` with safe guards.
 * Returns `null` when the snapshot is null (`living_audio` off) or state is missing.
 */
export function resolveBoardAudio(state: GameState | null | undefined): AudioSnapshot | null {
  if (!state?.flags) return null;
  return audioSnapshot(state);
}

function defaultCreateContext(): AudioContext | null {
  try {
    const g = globalThis as unknown as {
      AudioContext?: new () => AudioContext;
      webkitAudioContext?: new () => AudioContext;
    };
    const Ctor = g.AudioContext ?? g.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  } catch {
    return null;
  }
}

function rampParam(param: AudioParam | undefined, target: number, now: number, durationSec: number): void {
  if (!param) return;
  try {
    if (
      typeof param.cancelScheduledValues === "function" &&
      typeof param.setValueAtTime === "function" &&
      typeof param.linearRampToValueAtTime === "function"
    ) {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(target, now + durationSec);
      return;
    }
  } catch {
    /* fallback to direct value assignment */
  }
  param.value = target;
}

function fillDeterministicNoise(data: Float32Array): void {
  // Deterministic LCG PRNG so no Math.random() is needed.
  let seed = 0x517cc1b7;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    data[i] = ((seed >>> 16) / 32768) - 1;
  }
}

export interface BoardAmbientAudioState {
  running: boolean;
  snapshot: AudioSnapshot | null;
  masterGain: number;
  layerGains: Record<WeatherAudioBranch, number>;
}

/**
 * Lightweight Web Audio procedural ambient loop + weather layer crossfader.
 * Uses local synthesis only (no external audio URLs, keys, or heavy deps).
 */
export class BoardAmbientAudioEngine {
  private readonly createContext: () => AudioContext | null;
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private layerNodes: Record<WeatherAudioBranch, { filter: BiquadFilterNode; gain: GainNode }> | null = null;

  private running = false;
  private currentSnapshot: AudioSnapshot | null = null;
  private targetMasterGain = 0;
  private targetLayerGains: Record<WeatherAudioBranch, number> = {
    rain: 0,
    wind: 0,
    mist: 0,
  };
  private resumeCleanup: (() => void) | null = null;

  public constructor(opts?: { createContext?: () => AudioContext | null }) {
    this.createContext = opts?.createContext ?? defaultCreateContext;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getState(): BoardAmbientAudioState {
    return {
      running: this.running,
      snapshot: this.currentSnapshot ? { ...this.currentSnapshot } : null,
      masterGain: this.targetMasterGain,
      layerGains: { ...this.targetLayerGains },
    };
  }

  public sync(snapshot: AudioSnapshot | null): void {
    if (!snapshot) {
      this.stop();
      return;
    }

    const volume = Number.isFinite(snapshot.volume)
      ? Math.min(1, Math.max(0, snapshot.volume))
      : 0;
    const normalized: AudioSnapshot = {
      ambient: snapshot.ambient,
      weatherLayer: snapshot.weatherLayer,
      volume,
    };

    if (!this.running && !this.startGraph(normalized)) {
      return;
    }

    const ctx = this.ctx;
    if (!ctx) return;

    this.currentSnapshot = normalized;
    const now = typeof ctx.currentTime === "number" ? ctx.currentTime : 0;

    // Update ambient bed frequencies and warmth filter for the day phase.
    const bed = AMBIENT_LOOP_PROFILES[normalized.ambient] ?? AMBIENT_LOOP_PROFILES.hold_day;
    rampParam(this.primaryOsc?.frequency, bed.primaryHz, now, 0.6);
    rampParam(this.harmonicOsc?.frequency, bed.harmonicHz, now, 0.6);
    rampParam(this.ambientFilter?.frequency, bed.filterHz, now, 0.6);

    // Crossfade weather layer branches (all 0 when "clear").
    for (const branch of WEATHER_BRANCHES) {
      const target =
        normalized.weatherLayer === branch ? WEATHER_LAYER_PROFILES[branch].gain : 0;
      this.targetLayerGains[branch] = target;
      rampParam(this.layerNodes?.[branch].gain.gain, target, now, WEATHER_CROSSFADE_SEC);
    }

    // Respect snapshot volume under a calm master ceiling.
    const nextMaster = volume * AMBIENT_MASTER_CEILING;
    this.targetMasterGain = nextMaster;
    rampParam(this.masterGainNode?.gain, nextMaster, now, 0.35);

    this.ensureResumed(ctx);
  }

  public stop(): void {
    this.clearResumeListeners();

    const stopNode = (node: { stop?: () => void; disconnect?: () => void } | null) => {
      if (!node) return;
      try {
        node.stop?.();
      } catch {
        /* ignore */
      }
      try {
        node.disconnect?.();
      } catch {
        /* ignore */
      }
    };

    stopNode(this.primaryOsc);
    stopNode(this.harmonicOsc);
    stopNode(this.noiseSource);

    try {
      this.ambientFilter?.disconnect?.();
      this.ambientGainNode?.disconnect?.();
      if (this.layerNodes) {
        for (const branch of WEATHER_BRANCHES) {
          this.layerNodes[branch].filter.disconnect?.();
          this.layerNodes[branch].gain.disconnect?.();
        }
      }
      this.masterGainNode?.disconnect?.();
    } catch {
      /* ignore */
    }

    if (this.ctx) {
      try {
        void this.ctx.close?.();
      } catch {
        /* ignore */
      }
    }

    this.ctx = null;
    this.masterGainNode = null;
    this.ambientGainNode = null;
    this.ambientFilter = null;
    this.primaryOsc = null;
    this.harmonicOsc = null;
    this.noiseSource = null;
    this.layerNodes = null;
    this.running = false;
    this.currentSnapshot = null;
    this.targetMasterGain = 0;
    this.targetLayerGains = { rain: 0, wind: 0, mist: 0 };
  }

  private startGraph(initial: AudioSnapshot): boolean {
    const ctx = this.createContext();
    if (!ctx) return false;

    try {
      const now = typeof ctx.currentTime === "number" ? ctx.currentTime : 0;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);

      // Quiet ambient loop: dual harmonic oscillators through a gentle lowpass filter.
      const bed = AMBIENT_LOOP_PROFILES[initial.ambient] ?? AMBIENT_LOOP_PROFILES.hold_day;
      const ambientFilter = ctx.createBiquadFilter();
      ambientFilter.type = "lowpass";
      ambientFilter.frequency.value = bed.filterHz;

      const ambientGain = ctx.createGain();
      ambientGain.gain.value = 0.45;
      ambientFilter.connect(ambientGain);
      ambientGain.connect(masterGain);

      const primaryOsc = ctx.createOscillator();
      primaryOsc.type = "sine";
      primaryOsc.frequency.value = bed.primaryHz;
      primaryOsc.connect(ambientFilter);
      primaryOsc.start();

      const harmonicOsc = ctx.createOscillator();
      harmonicOsc.type = "triangle";
      harmonicOsc.frequency.value = bed.harmonicHz;
      harmonicOsc.connect(ambientFilter);
      harmonicOsc.start();

      // Looping deterministic noise buffer feeding rain/wind/mist crossfade branches.
      const sampleRate = typeof ctx.sampleRate === "number" && ctx.sampleRate > 0 ? ctx.sampleRate : 44100;
      const buffer = ctx.createBuffer(1, Math.max(1024, Math.floor(sampleRate * 2)), sampleRate);
      if (typeof buffer.getChannelData === "function") {
        fillDeterministicNoise(buffer.getChannelData(0));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      const windFilter = ctx.createBiquadFilter();
      const mistFilter = ctx.createBiquadFilter();
      const rainGain = ctx.createGain();
      const windGain = ctx.createGain();
      const mistGain = ctx.createGain();

      const layerNodes: Record<WeatherAudioBranch, { filter: BiquadFilterNode; gain: GainNode }> = {
        rain: { filter: rainFilter, gain: rainGain },
        wind: { filter: windFilter, gain: windGain },
        mist: { filter: mistFilter, gain: mistGain },
      };

      for (const branch of WEATHER_BRANCHES) {
        const prof = WEATHER_LAYER_PROFILES[branch];
        const node = layerNodes[branch];
        node.filter.type = prof.filterType;
        node.filter.frequency.value = prof.frequency;
        if (node.filter.Q) node.filter.Q.value = prof.q;
        node.gain.gain.value = 0;
        noiseSource.connect(node.filter);
        node.filter.connect(node.gain);
        node.gain.connect(masterGain);
      }

      noiseSource.start(now);

      this.ctx = ctx;
      this.masterGainNode = masterGain;
      this.ambientFilter = ambientFilter;
      this.ambientGainNode = ambientGain;
      this.primaryOsc = primaryOsc;
      this.harmonicOsc = harmonicOsc;
      this.noiseSource = noiseSource;
      this.layerNodes = layerNodes;
      this.running = true;
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  private ensureResumed(ctx: AudioContext): void {
    if (ctx.state !== "suspended") {
      this.clearResumeListeners();
      return;
    }

    try {
      const p = ctx.resume?.();
      if (p && typeof p.then === "function") {
        void p.then(() => {
          if (this.ctx === ctx && ctx.state === "running") {
            this.clearResumeListeners();
          }
        }).catch(() => {
          /* autoplay may block until user gesture */
        });
      }
    } catch {
      /* ignore */
    }

    if (this.resumeCleanup || typeof document === "undefined" || typeof document.addEventListener !== "function") {
      return;
    }

    const onGesture = () => {
      if (!this.running || this.ctx !== ctx) {
        this.clearResumeListeners();
        return;
      }
      try {
        void ctx.resume?.().then(() => {
          if (ctx.state === "running") this.clearResumeListeners();
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    };

    document.addEventListener("pointerdown", onGesture, { passive: true });
    document.addEventListener("keydown", onGesture, { passive: true });
    this.resumeCleanup = () => {
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("keydown", onGesture);
    };
  }

  private clearResumeListeners(): void {
    if (this.resumeCleanup) {
      this.resumeCleanup();
      this.resumeCleanup = null;
    }
  }
}

export const boardAmbientAudio = new BoardAmbientAudioEngine();

/**
 * Non-visual board audio bridge reading `audioSnapshot(state)`.
 * Starts/crossfades when non-null and stops cleanly when null, flagged off, or hidden.
 */
export const BoardAudioBridge: React.FC<{
  state: GameState | null | undefined;
  active?: boolean;
  engine?: BoardAmbientAudioEngine;
}> = ({ state, active = true, engine = boardAmbientAudio }) => {
  const snap = active ? resolveBoardAudio(state) : null;
  const ambient = snap?.ambient ?? null;
  const weatherLayer = snap?.weatherLayer ?? null;
  const volume = snap?.volume ?? null;

  React.useEffect(() => {
    if (ambient === null || weatherLayer === null || volume === null) {
      engine.stop();
      return;
    }
    engine.sync({ ambient, weatherLayer, volume });
  }, [ambient, weatherLayer, volume, engine]);

  React.useEffect(() => {
    return () => {
      engine.stop();
    };
  }, [engine]);

  if (!snap) return null;

  return (
    <span
      className="sc-baudio-bridge"
      data-baudio-ambient={snap.ambient}
      data-baudio-weather={snap.weatherLayer}
      data-baudio-volume={snap.volume.toFixed(3)}
      aria-hidden="true"
      style={{ display: "none", pointerEvents: "none" }}
    />
  );
};
