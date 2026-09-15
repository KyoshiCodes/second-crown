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
export { RivalSystem, tickWorldPulse, maybeContestFlag } from "./systems/rival.js";
export { EventSystem, EVENT_PERIOD, getEventLog, getWorldLog, pushWorldLog } from "./systems/events.js";
export type { WorldEvent } from "./systems/events.js";

export { tryBuild, canAfford, canPlaceAt, buildingAt, buildCostMultiplier, tryCancelBuild, tryDemolish, listWorksInProgress, buildTicksLeft } from "./actions/build.js";
export type { BuildPayload } from "./actions/build.js";

export {
  tryUpgrade,
  canUpgrade,
  upgradeCost,
  MAX_BUILDING_LEVEL,
  keepLevel,
  maxLevelFor,
  listUpgrades,
  upgradeJobFor,
  tryCancelUpgrade,
  upgradeDurationTicks,
} from "./actions/upgrade.js";
export type { UpgradeJob } from "./actions/upgrade.js";

export { tryTrain, canAffordTrain, trainCostMultiplier } from "./actions/train.js";
export type { TrainPayload } from "./actions/train.js";
export { listTraining, trainDurationTicks, trainingTicksLeft, tryCancelTraining } from "./systems/training.js";
export type { TrainingJob } from "./systems/training.js";

export {
  RESEARCH,
  tryStartResearch,
  tryCancelResearch,
  researchDone,
  researchTicksLeft,
  unitUnlocked,
} from "./systems/research.js";

export { tryDeclareWar, tryResolveWar, tryWhitePeace, peaceTicksRemaining, warSummary } from "./actions/war.js";
export type { DeclareWarPayload, WarSummary } from "./actions/war.js";

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
export { storageCap, resourceLedger } from "./systems/storage.js";
export type { ResourceLedger } from "./systems/storage.js";
export { tryBuyBazaar, ITEMS, ITEM_TIERS } from "./systems/loot.js";

export { settlementName, tryRenameSettlement } from "./actions/settlement.js";

export {
  seedBoard,
  ensureBoard,
  getProvince,
  provinceAt,
  neighbors,
  provinceId,
} from "./systems/board.js";

export {
  tryMarch,
  tryMarchWith,
  tryNpcMarch,
  listMarches,
  activePlayerMarch,
  hasClosedWallRing,
  wallHp,
  edgeWallCount,
  siegeDefense,
  applySiegeBlow,
  tryDispatchGarrison,
  tryDispatchRecallGarrison,
  tryRecallMarch,
  MarchSystem,
} from "./systems/march.js";
export type { March } from "./systems/march.js";
export { tryDispatchScout } from "./systems/scoutColumn.js";
export { incomingOnProvince, incomingOnPlayerFlags } from "./systems/incoming.js";

export { incomingOnHome, watchtowerWarning, maybeNpcRaid } from "./systems/raidMarch.js";
export { resolveSiegeHold, yardPower, keepPower } from "./systems/siege.js";
export type { SiegeReport } from "./systems/siege.js";
export { forcePower, takeForce, returnForce } from "./systems/column.js";
export { gateOnRim, gateHp } from "./systems/gate.js";
export { campThreat } from "./systems/camp.js";

export {
  woundedCount,
  infirmaryBeds,
  tryTreatWounded,
  tryRepair,
  listScarred,
  healTicksLeft,
  listHealing,
} from "./systems/ward.js";

export { laborPerTick, applyLabor, maxMarches } from "./systems/labor.js";
export { housingCap, population, canHouse } from "./systems/housing.js";
export { isProvinceSeen, tryScoutProvince, revealProvince, ensureFog, visionRange, scoutCost } from "./systems/fog.js";
export { listRimForts } from "./systems/rimForts.js";
export type { RimFort } from "./systems/rimForts.js";
export { listOutposts, plantOutpost, outpostTithePerTick } from "./systems/outpost.js";
export { vaultProtects, takePlunder } from "./systems/vault.js";
export { listTroopPosts, troopWounded } from "./systems/troops.js";
export {
  TUTORIAL_STEPS,
  tutorialIndex,
  tutorialDone,
  currentTutorial,
  tryAdvanceTutorial,
  skipTutorial,
} from "./systems/tutorial.js";

export { serializeState, deserializeState, ensureWorldStubs } from "./save/serialize.js";

export { applyOfflineProgress } from "./offline.js";

export type { GameState, CitizenInstance, CitizenJobId, CitizenTile, Province, BoardState } from "@second-crown/shared";
export { formatLetterSuffix, BOARD_W, BOARD_H } from "@second-crown/shared";
export { tryGather, tryRecallGather, tryNpcGather, listGathers, GATHER_NODES, GatherSystem } from "./systems/gather.js";
export type { Gather } from "./systems/gather.js";
export { nodeStock, nodeStockMax, NODE_REGEN_PERIOD } from "./systems/nodeStock.js";
export {
  tryGarrison,
  tryRecallGarrison,
  tryAbandonOutpost,
  garrisonAt,
  garrisonPower,
  listGarrisons,
} from "./systems/garrison.js";
