/** Optional recorded background music by Travis Brown.
 * Own <audio> element, separate from music.ts (Lofi / Realm).
 * Only one source plays at a time: playing a Travis track sets the music.ts mode to Off,
 * and turning Lofi or Realm back on pauses Travis.
 * Persists the chosen track (sc-travis-track) and the shared music volume (sc-music-volume). Never autoplays.
 * When a track ends, the next one starts and becomes the saved choice.
 */
import { getMusicMode, setMusicMode, MUSIC_CHANGE_EVENT } from "./music";

export const TRAVIS_TRACK_KEY = "sc-travis-track";
/** Shared with the Lofi player: one volume for all recorded music. */
export const TRAVIS_VOLUME_KEY = "sc-music-volume";
/** Fired on any track / volume / playing change. */
export const TRAVIS_CHANGE_EVENT = "sc-travis-change";
export const TRAVIS_CREDIT = "Music by Travis Brown";
export const TRAVIS_DEFAULT_VOLUME = 0.5;

export const TRAVIS_TRACKS: readonly { title: string; src: string }[] = [
  { title: "All We Know", src: `/audio/${encodeURIComponent("01 All We Know.ogg")}` },
  { title: "Holding On", src: `/audio/${encodeURIComponent("01 Holding On.ogg")}` },
];

export interface TravisState {
  index: number;
  volume: number;
  playing: boolean;
  /** Last load / play failure, shown by the panel. Empty when fine. */
  error: string;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Stored index, or 0 when missing / out of range. */
export function parseTrackIndex(raw: string | null): number {
  const n = raw === null ? NaN : Number(raw);
  return Number.isInteger(n) && n >= 0 && n < TRAVIS_TRACKS.length ? n : 0;
}

/** Stored volume clamped to 0..1, or the default when missing / invalid. */
export function parseVolume(raw: string | null): number {
  const n = raw === null || raw === "" ? NaN : Number(raw);
  if (!Number.isFinite(n)) return TRAVIS_DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, n));
}

const state: TravisState = {
  index: parseTrackIndex(readStorage(TRAVIS_TRACK_KEY)),
  volume: parseVolume(readStorage(TRAVIS_VOLUME_KEY)),
  playing: false,
  error: "",
};

let el: HTMLAudioElement | null = null;
let listening = false;

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(TRAVIS_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function getTravisState(): TravisState {
  return { ...state };
}

function listenForOtherMusic(): void {
  if (listening) return;
  listening = true;
  try {
    window.addEventListener(MUSIC_CHANGE_EVENT, () => {
      if (getMusicMode() !== "off") pauseTravis();
    });
  } catch {
    /* ignore */
  }
}

function audio(): HTMLAudioElement | null {
  if (el) return el;
  try {
    el = new Audio();
  } catch {
    return null;
  }
  el.preload = "none";
  el.volume = state.volume;
  el.addEventListener("ended", () => {
    selectTravisTrack(state.index + 1, true);
  });
  el.addEventListener("error", () => {
    if (!el?.getAttribute("src")) return;
    state.playing = false;
    state.error = `Could not load "${TRAVIS_TRACKS[state.index].title}".`;
    emit();
  });
  el.addEventListener("pause", () => {
    if (!state.playing) return;
    state.playing = false;
    emit();
  });
  listenForOtherMusic();
  return el;
}

function startPlayback(a: HTMLAudioElement): void {
  // Hand the speakers over: Lofi / Realm go quiet while Travis plays.
  if (getMusicMode() !== "off") setMusicMode("off");
  state.playing = true;
  state.error = "";
  emit();
  let p: Promise<void> | undefined;
  try {
    p = a.play();
  } catch {
    state.playing = false;
    state.error = "Audio could not start.";
    emit();
    return;
  }
  void p?.catch((err: unknown) => {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "AbortError") return; // superseded by a newer pick
    state.playing = false;
    state.error = name === "NotAllowedError" ? "Browser blocked playback. Press play again." : "Track could not play.";
    emit();
  });
}

function loadCurrent(a: HTMLAudioElement): void {
  const src = TRAVIS_TRACKS[state.index].src;
  if (a.getAttribute("src") !== src) {
    a.src = src;
    a.load();
  }
}

/** Call from a click handler so play() runs inside the user gesture. */
export function playTravis(): void {
  const a = audio();
  if (!a) {
    state.error = "Audio is not available in this browser.";
    emit();
    return;
  }
  loadCurrent(a);
  startPlayback(a);
}

export function pauseTravis(): void {
  if (!state.playing && (!el || el.paused)) return;
  state.playing = false;
  el?.pause();
  emit();
}

export function toggleTravis(): void {
  if (state.playing) pauseTravis();
  else playTravis();
}

/** Pick track i (wraps) and save it. Keeps playing if it was playing, or when autoplay is set. */
export function selectTravisTrack(i: number, autoplay = false): void {
  const n = TRAVIS_TRACKS.length;
  const wasPlaying = state.playing;
  state.index = ((i % n) + n) % n;
  state.error = "";
  writeStorage(TRAVIS_TRACK_KEY, String(state.index));
  if (wasPlaying || autoplay) {
    playTravis();
  } else {
    if (el) loadCurrent(el);
    emit();
  }
}

export function setTravisVolume(v: number): void {
  state.volume = Math.min(1, Math.max(0, Number.isFinite(v) ? v : TRAVIS_DEFAULT_VOLUME));
  writeStorage(TRAVIS_VOLUME_KEY, String(state.volume));
  if (el) el.volume = state.volume;
  emit();
}
