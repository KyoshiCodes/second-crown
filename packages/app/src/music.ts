/** Soft procedural pentatonic bed that adapts to seasons and holidays.
 * Starts after first click (browser autoplay rule).
 * Completely client-side; zero sim determinism impact.
 */

export type SeasonName = "Spring" | "Summer" | "Autumn" | "Winter";

let ctx: AudioContext | null = null;
let timer: number | null = null;
let muted = false;
let step = 0;
let currentSeasonName: SeasonName = "Spring";
let currentHolidayId: string | null = null;

// Musical patterns by season
const SEASON_PATTERNS: Record<SeasonName, { notes: number[]; intervalMs: number; oscType: OscillatorType }> = {
  // Lydian / bright major pentatonic (G4, B4, D5, E5, F#5, D5, B4, G4)
  Spring: {
    notes: [392.00, 493.88, 587.33, 659.25, 739.99, 587.33, 493.88, 392.00],
    intervalMs: 580,
    oscType: "triangle",
  },
  // Sunlit warm meadow pentatonic (G3, B3, D4, E4, G4, A4, E4, D4)
  Summer: {
    notes: [196.00, 246.94, 293.66, 329.63, 392.00, 440.00, 329.63, 293.66],
    intervalMs: 640,
    oscType: "triangle",
  },
  // Dorian / contemplative harvest minor pentatonic (A3, C4, D4, E4, G4, E4, D4, A3)
  Autumn: {
    notes: [220.00, 261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 220.00],
    intervalMs: 680,
    oscType: "sine",
  },
  // Frost / crystalline winter glockenspiel (C4, E4, G4, C5, B4, G4, E4, C4)
  Winter: {
    notes: [261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 261.63],
    intervalMs: 760,
    oscType: "sine",
  },
};

// Holiday special patterns
const HOLIDAY_PATTERNS: Record<string, { notes: number[]; intervalMs: number; oscType: OscillatorType }> = {
  halloween: {
    notes: [196.00, 207.65, 246.94, 293.66, 207.65, 261.63, 311.13, 196.00],
    intervalMs: 620,
    oscType: "triangle",
  },
  midwinter: {
    notes: [261.63, 329.63, 392.00, 523.25, 587.33, 523.25, 392.00, 329.63],
    intervalMs: 700,
    oscType: "sine",
  },
  easter: {
    notes: [261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 523.25, 392.00],
    intervalMs: 560,
    oscType: "triangle",
  },
  harvest: {
    notes: [196.00, 220.00, 261.63, 293.66, 329.63, 293.66, 220.00, 196.00],
    intervalMs: 660,
    oscType: "sine",
  },
  midsummer: {
    notes: [329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 493.88, 392.00],
    intervalMs: 580,
    oscType: "triangle",
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

function pluck(freq: number, type: OscillatorType, durSec: number) {
  const a = audio();
  if (!a || muted) return;
  if (a.state === "suspended") void a.resume();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0.016;
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + durSec);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + durSec);
}

function getActivePattern() {
  if (currentHolidayId && HOLIDAY_PATTERNS[currentHolidayId]) {
    return HOLIDAY_PATTERNS[currentHolidayId];
  }
  return SEASON_PATTERNS[currentSeasonName] ?? SEASON_PATTERNS.Spring;
}

function restartTimer() {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  const pat = getActivePattern();
  timer = window.setInterval(() => {
    const current = getActivePattern();
    const note = current.notes[step % current.notes.length];
    pluck(note, current.oscType, current.intervalMs * 0.0009);
    step += 1;
  }, pat.intervalMs);
}

export function startMusicBed(): void {
  if (timer !== null) return;
  audio();
  restartTimer();
}

export function setMusicSeason(season: SeasonName): void {
  if (currentSeasonName === season) return;
  currentSeasonName = season;
  if (timer !== null) {
    restartTimer();
  }
}

export function setMusicHoliday(holidayId: string | null): void {
  if (currentHolidayId === holidayId) return;
  currentHolidayId = holidayId;
  if (timer !== null) {
    restartTimer();
  }
}

export function isMusicMuted(): boolean {
  return muted;
}

export function setMusicMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem("sc-music-muted", next ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadMusicMuted(): boolean {
  try {
    muted = localStorage.getItem("sc-music-muted") === "1";
  } catch {
    muted = false;
  }
  return muted;
}

