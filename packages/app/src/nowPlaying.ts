/** One "now playing" view over every music source, plus the actions the music panel uses.
 *
 * Sources (each keeps its own engine):
 *   travis — recorded tracks by Travis Brown (travisMusic.ts, own <audio>)
 *   lofi   — HoliznaCC0 CC0 library (music.ts lofi <audio>)
 *   realm  — procedural seasonal / holiday score (music.ts synth, mode "bed")
 * Only one source plays at a time (travisMusic switches music.ts Off; music.ts going non-off pauses Travis).
 *
 * Read-only hooks for visual work (no audio side effects):
 *   getNowPlaying()                    snapshot { trackId, title, artist, source, playing }
 *   window event "sc-now-playing"      fired on any change, detail = snapshot
 *   <html data-music-playing="true|false" data-music-track-id="lofi-4" data-music-source="lofi">
 *   useNowPlaying()                    React hook
 *
 * Persists the last chosen track id in localStorage (sc-music-last-track). Never autoplays.
 */
import React from "react";
import {
  getLofiIndex,
  getLofiStatus,
  getMusicMode,
  lofiTrackName,
  pickLofiTrack,
  setLofiVolume,
  setMusicMode,
  startMusicBed,
  LOFI_STATUS_EVENT,
  LOFI_TRACK_EVENT,
  LOFI_TRACKS,
  MUSIC_CHANGE_EVENT,
} from "./music";
import {
  getTravisState,
  pauseTravis,
  selectTravisTrack,
  setTravisVolume,
  playTravis,
  TRAVIS_CHANGE_EVENT,
  TRAVIS_TRACKS,
} from "./travisMusic";

export type MusicSource = "travis" | "lofi" | "realm";

export interface MusicTrack {
  /** Stable id: "travis-0", "lofi-12", "realm". */
  id: string;
  title: string;
  artist: string;
  source: MusicSource;
  /** Index inside its source list (0 for realm). */
  index: number;
  /** File path, empty for the synth score. */
  src: string;
}

export interface NowPlaying {
  trackId: string;
  title: string;
  artist: string;
  source: MusicSource;
  playing: boolean;
}

export const NOW_PLAYING_EVENT = "sc-now-playing";
export const LAST_TRACK_KEY = "sc-music-last-track";
export const DEFAULT_TRACK_ID = "travis-0";

export const MUSIC_LIBRARY: readonly MusicTrack[] = [
  ...TRAVIS_TRACKS.map((t, i) => ({
    id: `travis-${i}`,
    title: t.title,
    artist: "Travis Brown",
    source: "travis" as const,
    index: i,
    src: t.src,
  })),
  {
    id: "realm",
    title: "Realm score",
    artist: "Follows the season and holiday",
    source: "realm" as const,
    index: 0,
    src: "",
  },
  ...LOFI_TRACKS.map((src, i) => ({
    id: `lofi-${i}`,
    title: lofiTrackName(i),
    artist: "HoliznaCC0",
    source: "lofi" as const,
    index: i,
    src,
  })),
];

const BY_ID = new Map(MUSIC_LIBRARY.map((t) => [t.id, t]));

export function findTrack(id: string | null | undefined): MusicTrack | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Stored id, or the default when missing / unknown. */
export function parseLastTrackId(raw: string | null): string {
  return raw && BY_ID.has(raw) ? raw : DEFAULT_TRACK_ID;
}

function readLastTrackId(): string {
  try {
    return parseLastTrackId(localStorage.getItem(LAST_TRACK_KEY));
  } catch {
    return DEFAULT_TRACK_ID;
  }
}

let lastTrackId = readLastTrackId();

function rememberTrack(id: string): void {
  if (!BY_ID.has(id) || id === lastTrackId) return;
  lastTrackId = id;
  try {
    localStorage.setItem(LAST_TRACK_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Which source is live right now, or null when everything is silent. */
function liveTrackId(): string | null {
  if (getTravisState().playing) return `travis-${getTravisState().index}`;
  const mode = getMusicMode();
  if (mode === "bed") return "realm";
  if (mode === "lofi") return `lofi-${getLofiIndex()}`;
  return null;
}

export function getNowPlaying(): NowPlaying {
  const travis = getTravisState();
  const mode = getMusicMode();
  const live = liveTrackId();
  const track = findTrack(live ?? lastTrackId) ?? MUSIC_LIBRARY[0];
  let playing = false;
  if (track.source === "travis") playing = travis.playing;
  else if (track.source === "realm") playing = mode === "bed";
  else playing = mode === "lofi" && getLofiStatus() === "playing";
  return { trackId: track.id, title: track.title, artist: track.artist, source: track.source, playing };
}

/** Last error from the active source, for the panel status line. */
export function getMusicError(): string {
  const np = getNowPlaying();
  if (np.source === "travis") return getTravisState().error;
  if (np.source === "lofi" && getMusicMode() === "lofi") {
    const s = getLofiStatus();
    if (s === "blocked") return "Browser blocked playback. Press play again.";
    if (s === "missing") return "Track failed to load. Pick another.";
  }
  return "";
}

export function getMusicVolume(): number {
  return getTravisState().volume;
}

/** One volume for recorded music (Travis + Lofi). The Realm synth keeps its own soft level. */
export function setMusicVolume(v: number): void {
  setTravisVolume(v);
  setLofiVolume(getTravisState().volume);
}

/** Play a library track. Call from a click handler so play() runs inside the user gesture. */
export function playTrack(id: string): void {
  const t = findTrack(id);
  if (!t) return;
  rememberTrack(t.id);
  if (t.source === "travis") {
    const s = getTravisState();
    if (s.index === t.index) playTravis();
    else selectTravisTrack(t.index, true);
    return;
  }
  pauseTravis();
  startMusicBed();
  if (t.source === "realm") {
    if (getMusicMode() !== "bed") setMusicMode("bed");
    return;
  }
  setLofiVolume(getMusicVolume());
  if (getMusicMode() === "lofi") {
    // Already in Lofi: a new pick reloads; re-picking the playing track leaves it alone.
    if (getLofiIndex() !== t.index || getLofiStatus() !== "playing") pickLofiTrack(t.index);
  } else {
    // Sets the index without loading, so resuming the same track continues where it paused.
    pickLofiTrack(t.index);
    setMusicMode("lofi");
  }
}

export function pauseMusic(): void {
  pauseTravis();
  if (getMusicMode() !== "off") setMusicMode("off");
}

export function toggleMusic(): void {
  const np = getNowPlaying();
  if (np.playing) pauseMusic();
  else playTrack(np.trackId);
}

/** Step through the library (skips the synth score). */
export function stepTrack(delta: number): void {
  const list = MUSIC_LIBRARY.filter((t) => t.source !== "realm");
  const cur = list.findIndex((t) => t.id === getNowPlaying().trackId);
  const n = list.length;
  const next = list[(((cur < 0 ? 0 : cur + delta) % n) + n) % n];
  playTrack(next.id);
}

/* ---------- change broadcast + <html> data attributes ---------- */

let installed = false;
let lastSig = "";

function broadcast(): void {
  const np = getNowPlaying();
  if (np.playing) rememberTrack(np.trackId);
  const sig = `${np.trackId}|${np.playing}`;
  if (typeof document !== "undefined") {
    const ds = document.documentElement.dataset;
    ds.musicPlaying = np.playing ? "true" : "false";
    ds.musicTrackId = np.trackId;
    ds.musicSource = np.source;
  }
  if (sig === lastSig) return;
  lastSig = sig;
  try {
    window.dispatchEvent(new CustomEvent<NowPlaying>(NOW_PLAYING_EVENT, { detail: np }));
  } catch {
    /* ignore */
  }
}

/** Wire the sources to one "sc-now-playing" event and the <html> data attributes. Idempotent. */
export function installNowPlaying(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  setLofiVolume(getMusicVolume());
  for (const ev of [MUSIC_CHANGE_EVENT, LOFI_TRACK_EVENT, LOFI_STATUS_EVENT, TRAVIS_CHANGE_EVENT]) {
    window.addEventListener(ev, broadcast);
  }
  broadcast();
}

/** React view of getNowPlaying(), re-rendered on any source change (including errors / volume). */
export function useNowPlaying(): NowPlaying & { error: string; volume: number } {
  const read = () => ({ ...getNowPlaying(), error: getMusicError(), volume: getMusicVolume() });
  const [s, setS] = React.useState(read);
  React.useEffect(() => {
    const sync = () => setS(read());
    const evs = [MUSIC_CHANGE_EVENT, LOFI_TRACK_EVENT, LOFI_STATUS_EVENT, TRAVIS_CHANGE_EVENT, NOW_PLAYING_EVENT];
    for (const ev of evs) window.addEventListener(ev, sync);
    sync();
    return () => {
      for (const ev of evs) window.removeEventListener(ev, sync);
    };
  }, []);
  return s;
}
