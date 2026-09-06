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

export { playerTitle, extraArchetypes } from "./content/world.js";

export { EconomySystem, computeIncomePerSecond, productionBonus } from "./systems/economy.js";
export { realmPower, resolveBattle } from "./systems/combat.js";
export type { BattleResult } from "./systems/combat.js";
export { RivalSystem } from "./systems/rival.js";
export { EventSystem, EVENT_PERIOD, getEventLog, getWorldLog, pushWorldLog } from "./systems/events.js";
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

export {
  tryGiftGold,
  getOpinion,
  rivalOpinionOfPlayer,
  playerOpinionOfRival,
  opinionOfPlayerFromRealm,
} from "./actions/diplomacy.js";

export { tryFoundGuild, tryJoinFaction, tryLeaveFaction } from "./actions/faction.js";

export { tryAscend, canAscend, ascendThreshold, tryPickDoctrine, DOCTRINES } from "./actions/prestige.js";

export {
  ACHIEVEMENTS,
  CRAFTS,
  KINGDOM_OFFERS,
  GUILD_CRESTS,
  flagNum,
  shieldTicksLeft,
  isShielded,
  tryBuyShield,
  tryCraft,
  tryKingdomTrade,
  tryRenameGuild,
  trySetGuildCrest,
  playerGuild,
  listAchievements,
} from "./systems/wave.js";

export { activeClash, tryJoinClash } from "./systems/worldClash.js";

export {
  DECREES,
  tryDecree,
  decreeActive,
  decreeUntil,
  tryScout,
  isScouted,
} from "./systems/decree.js";

export {
  SEASONS,
  currentSeason,
  tryHireChampion,
  tryNameChampion,
  championName,
  tryHireMercs,
  tryCollectTithe,
  titheTicksLeft,
  tryOpenRoute,
  routeGoldPerTick,
} from "./systems/age.js";

export { QUESTS, listQuests, tryClaimQuest } from "./systems/quest.js";

export { tryFoodLevy, levyTicksLeft } from "./systems/levy.js";

export {
  tryBanquet,
  banquetTicksLeft,
  tryFortify,
  fortifyTicksLeft,
  fortifyPower,
} from "./systems/court.js";

export { tryStrikeHorde, raidTicksLeft } from "./systems/raid.js";
export { tryBuyBazaar, ITEMS, ITEM_TIERS } from "./systems/loot.js";

export { settlementName, tryRenameSettlement } from "./actions/settlement.js";

export { serializeState, deserializeState, ensureWorldStubs } from "./save/serialize.js";

export { applyOfflineProgress } from "./offline.js";

export type { GameState } from "@second-crown/shared";
export { formatLetterSuffix } from "@second-crown/shared";
