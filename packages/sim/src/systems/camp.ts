import type { GameState, Province } from "@second-crown/shared";

function hash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Bandit camp or ruin strength. 4–8 so a 5-militia levy still clears the old test camps. */
export function campThreat(state: GameState, p: Province): number {
  if (p.node !== "camp" && p.node !== "ruins") return 0;
  const h = hash(state.meta.seed + p.x * 17 + p.y * 31);
  const base = p.node === "ruins" ? 6 : 4;
  return base + (h % 5);
}
