import React from "react";
import {
  getLofiIndex,
  getLofiStatus,
  getMusicMode,
  LOFI_STATUS_EVENT,
  LOFI_TRACK_EVENT,
  LOFI_TRACKS,
  lofiTrackName,
  MUSIC_CHANGE_EVENT,
  type LofiStatus,
  type MusicMode,
} from "../music";
import "./music-reactive.css";

export type MusicTrackProfile = "all-we-know" | "holding-on" | "ambient" | "idle";
export type MusicReactiveTone = "gold" | "slate" | "neutral" | "none";

export interface MusicReactiveInput {
  mode: MusicMode;
  lofiStatus: LofiStatus;
  trackName: string;
  trackSrc?: string;
  trackIndex?: number;
  trackCount?: number;
}

export interface MusicReactiveState {
  playing: boolean;
  mode: MusicMode;
  profile: MusicTrackProfile;
  tone: MusicReactiveTone;
  trackName: string;
}

export interface MusicReactiveLayerProps {
  stateOverride?: MusicReactiveState;
}

const PROFILE_TO_TONE: Record<Exclude<MusicTrackProfile, "idle">, Exclude<MusicReactiveTone, "none">> = {
  "all-we-know": "gold",
  "holding-on": "slate",
  ambient: "neutral",
};

/** Classifies a track name/source into its reactive palette profile. */
export function resolveMusicTrackProfile(
  trackName: string,
  trackSrc?: string,
  trackIndex?: number,
  trackCount?: number,
): Exclude<MusicTrackProfile, "idle"> {
  const hay = `${trackName ?? ""} ${trackSrc ?? ""}`.toLowerCase().replace(/[-_]+/g, " ");
  if (hay.includes("all we know") || /(?:^|[\s/])lofi\s+a(?:\b|\.)/.test(hay)) {
    return "all-we-know";
  }
  if (hay.includes("holding on") || /(?:^|[\s/])lofi\s+b(?:\b|\.)/.test(hay)) {
    return "holding-on";
  }
  if (trackCount === 2 && trackIndex === 0) {
    return "all-we-know";
  }
  if (trackCount === 2 && trackIndex === 1) {
    return "holding-on";
  }
  return "ambient";
}

/** Resolves whether music-reactive visuals should pulse and which track tone applies. */
export function resolveMusicReactiveState(input: MusicReactiveInput): MusicReactiveState {
  const playing = input.mode === "lofi" ? input.lofiStatus === "playing" : input.mode === "bed";
  if (!playing) {
    return {
      playing: false,
      mode: input.mode,
      profile: "idle",
      tone: "none",
      trackName: "",
    };
  }
  if (input.mode === "bed") {
    return {
      playing: true,
      mode: "bed",
      profile: "ambient",
      tone: "neutral",
      trackName: "Realm",
    };
  }
  const profile = resolveMusicTrackProfile(
    input.trackName,
    input.trackSrc,
    input.trackIndex,
    input.trackCount,
  );
  return {
    playing: true,
    mode: "lofi",
    profile,
    tone: PROFILE_TO_TONE[profile],
    trackName: input.trackName,
  };
}

/** Reads live playback state from music.ts with zero side effects. */
export function readCurrentMusicReactiveState(): MusicReactiveState {
  const mode = getMusicMode();
  const lofiStatus = getLofiStatus();
  const trackIndex = getLofiIndex();
  const trackName = lofiTrackName(trackIndex);
  const trackSrc = LOFI_TRACKS[trackIndex];
  return resolveMusicReactiveState({
    mode,
    lofiStatus,
    trackName,
    trackSrc,
    trackIndex,
    trackCount: LOFI_TRACKS.length,
  });
}

export interface DatasetTarget {
  dataset: Record<string, string | undefined>;
}

/** Mirrors reactive playback state onto documentElement data-* hooks for isolated CSS. */
export function applyMusicReactiveAttributes(
  target: DatasetTarget | null | undefined,
  state: MusicReactiveState,
): void {
  if (!target) return;
  target.dataset.musicReactive = state.playing ? "playing" : "idle";
  target.dataset.musicTrack = state.profile;
}

/** Removes music-reactive data-* attributes cleanly on unmount. */
export function clearMusicReactiveAttributes(
  target: DatasetTarget | null | undefined,
): void {
  if (!target) return;
  delete target.dataset.musicReactive;
  delete target.dataset.musicTrack;
}

/** Subscribes to music mode, track, and playback status events. */
export function useMusicReactiveState(): MusicReactiveState {
  const [state, setState] = React.useState<MusicReactiveState>(readCurrentMusicReactiveState);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sync = () => setState(readCurrentMusicReactiveState());
    sync();
    window.addEventListener(MUSIC_CHANGE_EVENT, sync);
    window.addEventListener(LOFI_TRACK_EVENT, sync);
    window.addEventListener(LOFI_STATUS_EVENT, sync);
    return () => {
      window.removeEventListener(MUSIC_CHANGE_EVENT, sync);
      window.removeEventListener(LOFI_TRACK_EVENT, sync);
      window.removeEventListener(LOFI_STATUS_EVENT, sync);
    };
  }, []);

  return state;
}

/**
 * Purely decorative music-reactive backdrop and document data-* sync layer.
 * All visual elements use pointer-events: none and leave layout/theme.css untouched.
 */
export function MusicReactiveLayer({ stateOverride }: MusicReactiveLayerProps) {
  const liveState = useMusicReactiveState();
  const state = stateOverride ?? liveState;

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    applyMusicReactiveAttributes(root, state);
    return () => {
      clearMusicReactiveAttributes(root);
    };
  }, [state]);

  return (
    <div
      className={`sc-music-reactive-layer ${state.playing ? "is-playing" : "is-idle"} track-${state.profile} tone-${state.tone}`}
      data-music-reactive={state.playing ? "playing" : "idle"}
      data-music-track={state.profile}
      data-music-tone={state.tone}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <div className="sc-music-reactive-wash" style={{ pointerEvents: "none" }} />
      <div className="sc-music-reactive-vignette" style={{ pointerEvents: "none" }} />
    </div>
  );
}
