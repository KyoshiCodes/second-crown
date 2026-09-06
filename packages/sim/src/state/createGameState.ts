import type { GameState } from "@second-crown/shared";
import { SAVE_VERSION } from "@second-crown/shared";

export interface CreateGameStateOptions {
  seed?: number;
  now?: number;
  withStarterBuildings?: boolean;
}

export function createGameState(options: CreateGameStateOptions = {}): GameState {
  const seed = options.seed ?? (Math.random() * 0xffffffff) >>> 0;
  const now = options.now ?? Date.now();

  const state: GameState = {
    meta: {
      version: SAVE_VERSION,
      seed,
      tick: 0,
      lastRealTime: now,
      playTimeMs: 0,
    },
    resources: {
      gold: "0",
      food: "0",
      wood: "0",
      stone: "0",
    },
    buildings: [],
    units: [],
    realms: [
      { id: "player", name: "Your Crown", rulerId: "char_player" },
      { id: "rival", name: "Iron March", rulerId: "char_rival" },
    ],
    characters: [
      {
        id: "char_player",
        name: "You",
        role: "ruler",
        realmId: "player",
        traits: ["ambitious"],
        ambition: "expand",
      },
      {
        id: "char_rival",
        name: "Lord Varric",
        role: "ruler",
        realmId: "rival",
        traits: ["ruthless"],
        ambition: "conquer",
      },
      {
        id: "char_advisor",
        name: "Mira the Steward",
        role: "advisor",
        realmId: "player",
        traits: ["clever"],
        ambition: null,
      },
    ],
    opinions: [
      { from: "char_player", to: "char_rival", value: -20, expiresTick: null },
      { from: "char_rival", to: "char_player", value: -30, expiresTick: null },
    ],
    wars: [],
    inputLog: [],
    flags: {},
    unlocks: [],
  };

  // Rival starts with a small defensive force
  state.units.push({
    id: "u_rival_0",
    typeId: "militia",
    realmId: "rival",
    count: "15",
    armyId: null,
  });

  if (options.withStarterBuildings) {
    state.buildings.push(
      {
        id: "b1",
        typeId: "farm",
        realmId: "player",
        x: 0,
        y: 0,
        level: 1,
        completesAtTick: null,
      },
      {
        id: "b2",
        typeId: "lumber_camp",
        realmId: "player",
        x: 1,
        y: 0,
        level: 1,
        completesAtTick: 40,
      }
    );
  }

  return state;
}
