/** Tiny Web Audio stingers. Client-only — does not touch sim determinism. */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur = 0.12, type: OscillatorType = "triangle", gain = 0.04) {
  const a = audio();
  if (!a) return;
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

export const sfx = {
  click: () => tone(520, 0.06, "square", 0.03),
  build: () => {
    tone(220, 0.1);
    setTimeout(() => tone(330, 0.1), 70);
  },
  train: () => tone(180, 0.14, "sawtooth", 0.03),
  war: () => {
    tone(140, 0.2, "sawtooth", 0.05);
    setTimeout(() => tone(110, 0.25, "sawtooth", 0.05), 120);
  },
  win: () => {
    tone(392, 0.12);
    setTimeout(() => tone(523, 0.16), 90);
  },
  lose: () => tone(98, 0.28, "sine", 0.05),
  gift: () => tone(660, 0.1),
};
