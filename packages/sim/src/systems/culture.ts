import type { GameState } from "@second-crown/shared";
import { CULTURES, NPC_CULTURE_IDS, MIST_FARM_BONUS, GLEN_QUARRY_BONUS, SALT_WOOD_BONUS, FEN_COTTAGE_BONUS, PEAK_KEEP_VISION_BONUS, getCulture } from "../content/cultures.js";

export function playerCultureId(state: GameState): string {
  return String(state.flags.culture ?? "western");
}

export function setPlayerCulture(state: GameState, id: string): boolean {
  const def = CULTURES.find((c) => c.id === id);
  if (!def) return false;
  state.flags.culture = id;
  const realm = state.realms.find((r) => r.id === "player");
  if (realm) {
    realm.lifestyle = def.name;
    realm.era = def.blurb;
  }
  return true;
}

export function cultureOfRealm(state: GameState, realmId: string): string {
  if (realmId === "player") return playerCultureId(state);
  const raw = state.flags[`culture_${realmId}`];
  if (typeof raw === "string" && raw) return raw;
  const seeded = NPC_CULTURE_IDS[(realmId.length * 7) % NPC_CULTURE_IDS.length];
  state.flags[`culture_${realmId}`] = seeded;
  return seeded;
}

/** Extra base food per farm for this realm. Reads only; never seeds an NPC culture flag. */
export function farmCultureBonus(state: GameState, realmId: string): number {
  const id = realmId === "player" ? playerCultureId(state) : state.flags[`culture_${realmId}`];
  return id === "mist" ? MIST_FARM_BONUS : 0;
}

/** Extra base stone per quarry for this realm. Reads only; never seeds an NPC culture flag. */
export function quarryCultureBonus(state: GameState, realmId: string): number {
  const id = realmId === "player" ? playerCultureId(state) : state.flags[`culture_${realmId}`];
  return id === "glen" ? GLEN_QUARRY_BONUS : 0;
}

/** Extra base wood per lumber camp for this realm. Reads only; never seeds an NPC culture flag. */
export function woodCultureBonus(state: GameState, realmId: string): number {
  const id = realmId === "player" ? playerCultureId(state) : state.flags[`culture_${realmId}`];
  return id === "salt" ? SALT_WOOD_BONUS : 0;
}

/** Extra citizen beds per finished cottage for this realm. Reads only; never seeds an NPC culture flag. */
export function cottageCultureBonus(state: GameState, realmId: string): number {
  const id = realmId === "player" ? playerCultureId(state) : state.flags[`culture_${realmId}`];
  return id === "fen" ? FEN_COTTAGE_BONUS : 0;
}

/** Extra hold vision once this realm has a finished keep. Reads only; never seeds an NPC culture flag. */
export function keepVisionCultureBonus(state: GameState, realmId: string): number {
  const id = realmId === "player" ? playerCultureId(state) : state.flags[`culture_${realmId}`];
  return id === "peak" ? PEAK_KEEP_VISION_BONUS : 0;
}

export { getCulture, CULTURES };
