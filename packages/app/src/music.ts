/** Soft original pentatonic bed. Starts after first click (browser rule). */

let ctx: AudioContext | null = null;
let timer: number | null = null;
let muted = false;
let step = 0;
const PATTERN = [196, 246, 220, 293, 246, 329, 293, 196];

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function pluck(freq: number) {
  const a = audio();
  if (!a || muted) return;
  if (a.state === "suspended") void a.resume();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "triangle";
  o.frequency.value = freq;
  g.gain.value = 0.018;
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.55);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.55);
}

export function startMusicBed(): void {
  if (timer !== null) return;
  audio();
  timer = window.setInterval(() => {
    pluck(PATTERN[step % PATTERN.length]);
    step += 1;
  }, 640);
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
