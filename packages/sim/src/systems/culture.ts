import type { GameState } from "@second-crown/shared";
import { CULTURES, getCulture } from "../content/cultures.js";

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
  const seeded = CULTURES[(realmId.length * 7) % CULTURES.length].id;
  state.flags[`culture_${realmId}`] = seeded;
  return seeded;
}

export { getCulture, CULTURES };
