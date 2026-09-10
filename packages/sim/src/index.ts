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

export { CITIZEN_JOBS, getCitizenJob, listCitizenJobs } from "./content/citizens.js";
export type { CitizenJob } from "./content/citizens.js";

export {
  createCitizen,
  assignJob,
  assignTile,
  citizensByRealm,
  countCitizensByJob,
  jobForBuildingType,
  walkerRoleForJob,
} from "./systems/citizens.js";

export { CULTURES, getCulture } from "./content/cultures.js";
export type { CultureDef } from "./content/cultures.js";
export { setPlayerCulture, playerCultureId, cultureOfRealm } from "./systems/culture.js";

export { playerTitle, extraArchetypes } from "./content/world.js";

export { EconomySystem, computeIncomePerSecond, productionBonus } from "./systems/economy.js";
export { realmPower, resolveBattle, fortificationPower, defenseBonus } from "./systems/combat.js";
export type { BattleResult } from "./systems/combat.js";
export { RivalSystem, tickWorldPulse } from "./systems/rival.js";
export { EventSystem, EVENT_PERIOD, getEventLog, getWorldLog, pushWorldLog } from "./systems/events.js";
export type { WorldEvent } from "./systems/events.js";

export { tryBuild, canAfford, buildCostMultiplier } from "./actions/build.js";
export type { BuildPayload } from "./actions/build.js";

export { tryUpgrade, canAffordTrain, trainCostMultiplier } from "./actions/train.js";
