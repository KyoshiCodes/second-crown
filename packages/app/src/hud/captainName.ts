/** Display-only captain names for War force cards. Not sim state. */
const CAPTAINS = [
  "Aldric", "Brannoc", "Cenwyn", "Dagny", "Edric", "Fenna", "Garrick", "Hild",
  "Isolde", "Jorund", "Kestrel", "Leofric", "Maelis", "Norrin", "Osric", "Perrin",
  "Quenby", "Rowena", "Sigrun", "Tamsin", "Ulric", "Vesna", "Wulfric", "Ysolde",
] as const;

/** Same id → same captain, every render and every reload (FNV-1a over the id). */
export function captainName(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return CAPTAINS[h % CAPTAINS.length];
}
