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
    realms: [],
    characters: [],
    opinions: [],
    wars: [],
    inputLog: [],
    flags: {},
    unlocks: [],
  };

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
        completesAtTick: 50,
      }
    );
  }

  return state;
}
