/**
 * mulberry32 — fast 32-bit seeded PRNG.
 * Returns a function that yields values in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive an independent stream seed from a master seed and a stream name.
 */
export function deriveSeed(masterSeed: number, streamName: string): number {
  let h = masterSeed >>> 0;
  for (let i = 0; i < streamName.length; i++) {
    h = Math.imul(h ^ streamName.charCodeAt(i), 0x9e3779b1);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export interface RngStreams {
  master: () => number;
  battle: () => number;
  character: () => number;
  event: () => number;
}

export function createRngStreams(masterSeed: number): RngStreams {
  return {
    master: mulberry32(masterSeed),
    battle: mulberry32(deriveSeed(masterSeed, "battle")),
    character: mulberry32(deriveSeed(masterSeed, "character")),
    event: mulberry32(deriveSeed(masterSeed, "event")),
  };
}
