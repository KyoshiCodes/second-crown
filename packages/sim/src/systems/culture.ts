import type { GameState } from "@second-crown/shared";
import { CULTURES, NPC_CULTURE_IDS, MIST_FARM_BONUS, getCulture } from "../content/cultures.js";

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

export { getCulture, CULTURES };
