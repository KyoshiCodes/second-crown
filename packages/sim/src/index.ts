export { createGameState } from "./state/createGameState.js";
export type { CreateGameStateOptions } from "./state/createGameState.js";

export { TickEngine } from "./core/tickEngine.js";

export { mulberry32, deriveSeed, createRngStreams } from "./core/rng.js";
export type { RngStreams } from "./core/rng.js";

export { D, toDecimalString, ZERO, ONE } from "./core/decimal.js";

export { BUILDING_TYPES, getBuildingType, listBuildableTypes } from "./content/buildings.js";
export type { BuildingType } from "./content/buildings.js";

export { EconomySystem, computeIncomePerSecond } from "./systems/economy.js";

export { tryBuild, canAfford } from "./actions/build.js";
export type { BuildPayload } from "./actions/build.js";

export { serializeState, deserializeState } from "./save/serialize.js";

export { applyOfflineProgress } from "./offline.js";

export type { GameState } from "@second-crown/shared";
export { formatLetterSuffix } from "@second-crown/shared";
