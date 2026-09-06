/** Layered procedural bed: pad + phrase + optional battle pulse.
 * Starts after first Music click (browser autoplay).
 * Client-only. Not a licensed soundtrack — recorded tracks can drop into public/audio later.
 */

export type SeasonName = "Spring" | "Summer" | "Autumn" | "Winter";

let ctx: AudioContext | null = null;
let melodyTimer: number | null = null;
let padTimer: number | null = null;
let battleTimer: number | null = null;
let muted = false;
let step = 0;
let currentSeasonName: SeasonName = "Spring";
let currentHolidayId: string | null = null;
let battleOn = false;
let started = false;

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
  if (currentHolidayId && HOLIDAY[currentHolidayId]) return HOLIDAY[currentHolidayId];
  return SEASON[currentSeasonName] ?? SEASON.Spring;
}

function clearTimers() {
  if (melodyTimer !== null) window.clearInterval(melodyTimer);
  if (padTimer !== null) window.clearInterval(padTimer);
  if (battleTimer !== null) window.clearInterval(battleTimer);
  melodyTimer = padTimer = battleTimer = null;
}

let synthMelodySuppressed = false;

function runBed() {
  if (!started || muted) return;
  clearTimers();
  if (!synthMelodySuppressed) {
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
  if (battleOn) {
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

export function startMusicBed(): void {
  started = true;
  audio();
  if (!muted) runBed();
}

export function setMusicSeason(season: SeasonName): void {
  if (currentSeasonName === season) return;
  currentSeasonName = season;
  if (started && !muted) runBed();
}

export function setMusicHoliday(holidayId: string | null): void {
  if (currentHolidayId === holidayId) return;
  currentHolidayId = holidayId;
  if (started && !muted) runBed();
}

export function setMusicBattle(on: boolean): void {
  if (battleOn === on) return;
  battleOn = on;
  if (started && !muted) runBed();
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
  if (next) clearTimers();
  else if (started) runBed();
}

export function loadMusicMuted(): boolean {
  try {
    muted = localStorage.getItem("sc-music-muted") === "1";
  } catch {
    muted = false;
  }
  return muted;
}

loadMusicMuted();
