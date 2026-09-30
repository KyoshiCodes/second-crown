/** Layered procedural bed: pad + phrase + optional battle pulse.
 * Recorded holiday tracks mute the whole synth, including the 520ms battle bounce.
 * Music mode (key sc-music): off (default), lofi (lofi-a/b.ogg, synth lofi fallback),
 * or bed (the seasonal / holiday bed above).
 */

export type SeasonName = "Spring" | "Summer" | "Autumn" | "Winter";
export type MusicMode = "off" | "lofi" | "bed";

export const MUSIC_KEY = "sc-music";
export const MUSIC_MODES: readonly MusicMode[] = ["off", "lofi", "bed"];
export const MUSIC_CHANGE_EVENT = "sc-music-change";
export const LOFI_TRACKS = ["/audio/lofi-a.ogg", "/audio/lofi-b.ogg"];

let ctx: AudioContext | null = null;
let melodyTimer: number | null = null;
let padTimer: number | null = null;
let battleTimer: number | null = null;
let mode: MusicMode = "off";
let muted = true;
let lastOnMode: MusicMode = "lofi";
let lofiEl: HTMLAudioElement | null = null;
let lofiIndex = 0;
let lofiErrors = 0;
let lofiRecordingPlaying = false;
let step = 0;
let currentSeasonName: SeasonName = "Spring";
let currentHolidayId: string | null = null;
let battleOn = false;
let started = false;
let synthMelodySuppressed = false;

const RECORDED_HOLIDAYS = new Set(["halloween", "midwinter", "easter"]);

const SEASON: Record<SeasonName, { melody: number[]; bass: number; intervalMs: number; osc: OscillatorType }> = {
  Spring: {
    melody: [392, 494, 587, 659, 740, 659, 587, 494, 392, 330, 392, 494, 587, 523, 494, 392],
    bass: 98,
    intervalMs: 420,
    osc: "triangle",
  },
  Summer: {
    melody: [196, 247, 294, 330, 392, 440, 392, 330, 294, 247, 220, 247, 294, 330, 294, 196],
    bass: 73.4,
    intervalMs: 480,
    osc: "triangle",
  },
  Autumn: {
    melody: [220, 262, 294, 330, 392, 330, 294, 220, 196, 220, 262, 294, 247, 220, 196, 165],
    bass: 110,
    intervalMs: 520,
    osc: "sine",
  },
  Winter: {
    melody: [262, 330, 392, 523, 494, 392, 330, 262, 247, 262, 330, 392, 349, 330, 262, 196],
    bass: 65.4,
    intervalMs: 560,
    osc: "sine",
  },
};

/** Synth fallback when no lofi files are present: slow, soft maj7 / min7 arpeggios. */
const LOFI = {
  melody: [262, 330, 392, 494, 440, 392, 330, 294, 220, 262, 330, 392, 349, 330, 262, 247],
  bass: 65.4,
  intervalMs: 700,
  osc: "sine" as OscillatorType,
};

const HOLIDAY: Record<string, { melody: number[]; bass: number; intervalMs: number; osc: OscillatorType }> = {
  halloween: {
    melody: [196, 208, 247, 294, 208, 262, 311, 196, 185, 196, 233, 277, 233, 196, 175, 155],
    bass: 73.4,
    intervalMs: 500,
    osc: "triangle",
  },
  midwinter: {
    melody: [262, 330, 392, 523, 587, 523, 392, 330, 349, 392, 523, 392, 330, 262, 196, 262],
    bass: 87.3,
    intervalMs: 540,
    osc: "sine",
  },
  easter: {
    melody: [262, 330, 392, 440, 523, 659, 523, 392, 349, 392, 440, 523, 440, 392, 330, 262],
    bass: 98,
    intervalMs: 400,
    osc: "triangle",
  },
  harvest: {
    melody: [196, 220, 262, 294, 330, 294, 220, 196, 175, 196, 220, 262, 247, 220, 196, 147],
    bass: 98,
    intervalMs: 500,
    osc: "sine",
  },
  midsummer: {
    melody: [330, 392, 440, 494, 587, 659, 494, 392, 440, 494, 587, 494, 440, 392, 330, 294],
    bass: 82.4,
    intervalMs: 420,
    osc: "triangle",
  },
};

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, type: OscillatorType, dur: number, gain: number) {
  const a = audio();
  if (!a || muted) return;
  if (a.state === "suspended") void a.resume();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function pattern() {
  if (mode === "lofi") return LOFI;
  if (currentHolidayId && HOLIDAY[currentHolidayId]) return HOLIDAY[currentHolidayId];
  return SEASON[currentSeasonName] ?? SEASON.Spring;
}

function clearTimers() {
  if (melodyTimer !== null) window.clearInterval(melodyTimer);
  if (padTimer !== null) window.clearInterval(padTimer);
  if (battleTimer !== null) window.clearInterval(battleTimer);
  melodyTimer = padTimer = battleTimer = null;
}

function recordedHolidayOn(): boolean {
  return Boolean(currentHolidayId && RECORDED_HOLIDAYS.has(currentHolidayId));
}

function runBed() {
  if (!started || muted) return;
  clearTimers();
  const hush = mode === "lofi" ? lofiRecordingPlaying : synthMelodySuppressed || recordedHolidayOn();
  if (!hush) {
    const p = pattern();
    melodyTimer = window.setInterval(() => {
      const cur = pattern();
      const note = cur.melody[step % cur.melody.length];
      tone(note, cur.osc, 0.55, 0.045);
      if (step % 4 === 0) tone(note / 2, "sine", 0.8, 0.02);
      step += 1;
    }, p.intervalMs);
    padTimer = window.setInterval(() => {
      tone(pattern().bass, "sine", 1.6, 0.03);
    }, p.intervalMs * 4);
  }
  // Battle bounce stays off while a recorded holiday owns the speakers.
  if (battleOn && !hush && mode === "bed") {
    battleTimer = window.setInterval(() => {
      tone(70, "sawtooth", 0.18, 0.05);
      setTimeout(() => tone(90, "square", 0.08, 0.02), 90);
      setTimeout(() => tone(55, "sine", 0.28, 0.04), 160);
    }, 520);
  }
}

export function setSynthMelodySuppressed(suppressed: boolean): void {
  if (synthMelodySuppressed === suppressed) return;
  synthMelodySuppressed = suppressed;
  if (started && !muted) runBed();
}

function lofi(): HTMLAudioElement | null {
  if (lofiEl) return lofiEl;
  try {
    lofiEl = new Audio();
  } catch {
    return null;
  }
  lofiEl.volume = 0.38;
  lofiEl.addEventListener("playing", () => {
    lofiErrors = 0;
    if (!lofiRecordingPlaying) {
      lofiRecordingPlaying = true;
      runBed();
    }
  });
  // a -> b -> a ... one file each, so either can be dropped in alone.
  lofiEl.addEventListener("ended", () => {
    lofiIndex = (lofiIndex + 1) % LOFI_TRACKS.length;
    playLofi();
  });
  lofiEl.addEventListener("error", () => {
    lofiErrors += 1;
    lofiIndex = (lofiIndex + 1) % LOFI_TRACKS.length;
    if (lofiErrors < LOFI_TRACKS.length) {
      playLofi();
    } else if (lofiRecordingPlaying) {
      lofiRecordingPlaying = false;
      runBed();
    }
  });
  return lofiEl;
}

function playLofi() {
  if (!started || mode !== "lofi" || lofiErrors >= LOFI_TRACKS.length) return;
  const el = lofi();
  if (!el) return;
  const src = LOFI_TRACKS[lofiIndex];
  if (!el.src.endsWith(src)) el.src = src;
  void el.play().catch(() => {
    /* autoplay block or missing file; the error listener handles files */
  });
}

function stopLofi() {
  if (lofiEl && !lofiEl.paused) lofiEl.pause();
  lofiRecordingPlaying = false;
}

export function startMusicBed(): void {
  started = true;
  audio();
  if (!muted) runBed();
  if (mode === "lofi" && lofiEl?.paused !== false) playLofi();
}

export function setMusicSeason(season: SeasonName): void {
  if (currentSeasonName === season) return;
  currentSeasonName = season;
  if (started && !muted) runBed();
}

export function setMusicHoliday(holidayId: string | null): void {
  if (currentHolidayId === holidayId) return;
  currentHolidayId = holidayId;
  if (recordedHolidayOn()) synthMelodySuppressed = true;
  if (started && !muted) runBed();
}

export function setMusicBattle(on: boolean): void {
  if (battleOn === on) return;
  battleOn = on;
  if (started && !muted) runBed();
}

/** True when the seasonal / holiday bed (and its recorded tracks) should be silent. */
export function isMusicMuted(): boolean {
  return mode !== "bed";
}

export function getMusicMode(): MusicMode {
  return mode;
}

export function setMusicMode(next: MusicMode, persist = true): void {
  mode = next;
  muted = next === "off";
  if (next !== "off") lastOnMode = next;
  if (persist) {
    try {
      localStorage.setItem(MUSIC_KEY, next);
    } catch {
      /* ignore */
    }
  }
  clearTimers();
  if (next === "lofi") {
    lofiErrors = 0;
    playLofi();
  } else {
    stopLofi();
  }
  if (started && !muted) runBed();
  try {
    window.dispatchEvent(new CustomEvent(MUSIC_CHANGE_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
}

/** Legacy on/off toggle: off, or back to the last non-off mode. */
export function setMusicMuted(next: boolean): void {
  setMusicMode(next ? "off" : lastOnMode);
}

export function loadMusicMode(): MusicMode {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(MUSIC_KEY);
  } catch {
    /* ignore */
  }
  // Default Off: nothing plays until the player picks a mode.
  mode = stored && (MUSIC_MODES as readonly string[]).includes(stored) ? (stored as MusicMode) : "off";
  muted = mode === "off";
  if (mode !== "off") lastOnMode = mode;
  return mode;
}

export function loadMusicMuted(): boolean {
  loadMusicMode();
  return muted;
}

loadMusicMode();
