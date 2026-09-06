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
    setTimeout(() => tone(659, 0.22), 180);
  },
  lose: () => {
    tone(130, 0.2, "sawtooth", 0.04);
    setTimeout(() => tone(98, 0.35, "sine", 0.06), 140);
  },
  gift: () => tone(660, 0.1),
  seasonShift: (season: string) => {
    if (season === "Spring") {
      tone(440, 0.15, "triangle", 0.03);
      setTimeout(() => tone(587.33, 0.2, "triangle", 0.03), 100);
      setTimeout(() => tone(739.99, 0.3, "triangle", 0.03), 200);
    } else if (season === "Summer") {
      tone(329.63, 0.18, "triangle", 0.03);
      setTimeout(() => tone(493.88, 0.28, "triangle", 0.03), 120);
    } else if (season === "Autumn") {
      tone(392, 0.2, "sine", 0.03);
      setTimeout(() => tone(329.63, 0.25, "sine", 0.03), 130);
      setTimeout(() => tone(261.63, 0.35, "sine", 0.03), 260);
    } else {
      // Winter
      tone(523.25, 0.25, "sine", 0.025);
      setTimeout(() => tone(659.25, 0.35, "sine", 0.025), 140);
    }
  },
  holiday: (holidayId: string) => {
    if (holidayId === "halloween") {
      tone(207.65, 0.25, "sawtooth", 0.03);
      setTimeout(() => tone(196, 0.35, "triangle", 0.04), 160);
    } else if (holidayId === "midwinter") {
      tone(523.25, 0.18, "triangle", 0.03);
      setTimeout(() => tone(659.25, 0.18, "triangle", 0.03), 110);
      setTimeout(() => tone(783.99, 0.3, "triangle", 0.03), 220);
    } else if (holidayId === "easter") {
      tone(440, 0.12, "triangle", 0.03);
      setTimeout(() => tone(554.37, 0.14, "triangle", 0.03), 90);
      setTimeout(() => tone(659.25, 0.25, "triangle", 0.03), 180);
    } else {
      tone(392, 0.15, "sine", 0.03);
      setTimeout(() => tone(523.25, 0.25, "sine", 0.03), 120);
    }
  },
};

