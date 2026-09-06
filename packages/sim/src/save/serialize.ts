import type { GameState } from "@second-crown/shared";
import { SAVE_VERSION } from "@second-crown/shared";

/** Serialize GameState to a plain JSON-safe object. */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

/** Ensure post-Phase-I fields exist on saves created before realms/war. */
export function ensureWorldStubs(state: GameState): void {
  if (!Array.isArray(state.realms)) state.realms = [];
  if (!Array.isArray(state.characters)) state.characters = [];
  if (!Array.isArray(state.opinions)) state.opinions = [];
  if (!Array.isArray(state.wars)) state.wars = [];
  if (!Array.isArray(state.units)) state.units = [];
  if (!Array.isArray(state.buildings)) state.buildings = [];
  if (!Array.isArray(state.inputLog)) state.inputLog = [];
  if (!state.flags) state.flags = {};
  if (!Array.isArray(state.unlocks)) state.unlocks = [];
  if (!state.resources) state.resources = {};

  if (!state.realms.some((r) => r.id === "player")) {
    state.realms.push({ id: "player", name: "Your Crown", rulerId: "char_player" });
  }
  if (!state.realms.some((r) => r.id === "rival")) {
    state.realms.push({ id: "rival", name: "Iron March", rulerId: "char_rival" });
  }

  if (!state.characters.some((c) => c.id === "char_player")) {
    state.characters.push({
      id: "char_player",
      name: "You",
      role: "ruler",
      realmId: "player",
      traits: ["ambitious"],
      ambition: "expand",
    });
  }
  if (!state.characters.some((c) => c.id === "char_rival")) {
    state.characters.push({
      id: "char_rival",
      name: "Lord Varric",
      role: "ruler",
      realmId: "rival",
      traits: ["ruthless"],
      ambition: "conquer",
    });
  }
  if (!state.characters.some((c) => c.id === "char_advisor")) {
    state.characters.push({
      id: "char_advisor",
      name: "Mira the Steward",
      role: "advisor",
      realmId: "player",
      traits: ["clever"],
      ambition: null,
    });
  }

  // Give rival a garrison if they have no units at all
  const rivalUnits = state.units.filter((u) => u.realmId === "rival");
  if (rivalUnits.length === 0) {
    state.units.push({
      id: "u_rival_migrated",
      typeId: "militia",
      realmId: "rival",
      count: "15",
      armyId: null,
    });
  }
}

/** Parse a save string into GameState. Applies stub migration for older saves. */
export function deserializeState(json: string): GameState {
  const raw = JSON.parse(json) as GameState;
  if (typeof raw?.meta?.version !== "number") {
    throw new Error("Invalid save: missing meta.version");
  }
  if (raw.meta.version > SAVE_VERSION) {
    throw new Error(`Save version ${raw.meta.version} is newer than supported ${SAVE_VERSION}`);
  }
  ensureWorldStubs(raw);
  return raw;
}
