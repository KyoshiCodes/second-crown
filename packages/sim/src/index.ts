export { createGameState } from "./state/createGameState.js";
export type { CreateGameStateOptions } from "./state/createGameState.js";

export { TickEngine } from "./core/tickEngine.js";

export { mulberry32, deriveSeed, createRngStreams } from "./core/rng.js";
export type { RngStreams } from "./core/rng.js";

export { D, toDecimalString, ZERO, ONE } from "./core/decimal.js";

export {
  BUILDING_TYPES,
  getBuildingType,
  listBuildableTypes,
  countBuilding,
} from "./content/buildings.js";
export type { BuildingType } from "./content/buildings.js";

export { UNIT_TYPES, getUnitType, listUnitTypes } from "./content/units.js";
export type { UnitType } from "./content/units.js";

export { EconomySystem, computeIncomePerSecond, productionBonus } from "./systems/economy.js";
export { realmPower, resolveBattle } from "./systems/combat.js";
export type { BattleResult } from "./systems/combat.js";
export { RivalSystem } from "./systems/rival.js";
export { EventSystem, EVENT_PERIOD, getEventLog } from "./systems/events.js";
export type { WorldEvent } from "./systems/events.js";

export { tryBuild, canAfford, buildCostMultiplier } from "./actions/build.js";
export type { BuildPayload } from "./actions/build.js";

export { tryUpgrade, canUpgrade, upgradeCost, MAX_BUILDING_LEVEL } from "./actions/upgrade.js";

export { tryTrain, canAffordTrain, trainCostMultiplier } from "./actions/train.js";
export type { TrainPayload } from "./actions/train.js";

export { tryDeclareWar, tryResolveWar, tryWhitePeace, peaceTicksRemaining } from "./actions/war.js";
export type { DeclareWarPayload } from "./actions/war.js";

export { tryTrade, canTrade, MARKET_OFFERS } from "./actions/trade.js";
export type { TradeOffer } from "./actions/trade.js";

export { tryAscend, canAscend, ascendThreshold } from "./actions/prestige.js";

export { serializeState, deserializeState, ensureWorldStubs } from "./save/serialize.js";

export { applyOfflineProgress } from "./offline.js";

export type { GameState } from "@second-crown/shared";
export { formatLetterSuffix } from "@second-crown/shared";
