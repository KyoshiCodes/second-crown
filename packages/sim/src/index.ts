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
export type { UnitType, UnitRole } from "./content/units.js";
export { matchupModifier, matchupRow } from "./content/matchup.js";
export { unitPayoffNote, roleMatchupNote } from "./content/unitPayoff.js";

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
  tryAssignCitizen,
  tryIdleCitizen,
} from "./systems/citizens.js";

export { CULTURES, getCulture, NPC_CULTURE_IDS, MIST_FARM_BONUS, GLEN_QUARRY_BONUS, SALT_WOOD_BONUS, FEN_COTTAGE_BONUS, PEAK_KEEP_VISION_BONUS } from "./content/cultures.js";
export type { CultureDef } from "./content/cultures.js";
export { setPlayerCulture, playerCultureId, cultureOfRealm, farmCultureBonus, quarryCultureBonus, woodCultureBonus, cottageCultureBonus, keepVisionCultureBonus } from "./systems/culture.js";

export { CULTURE_UNITS, cultureKitId, playerCultureKit, cultureUnitGate, isCultureUnit, cultureUnitForKit, playerCultureUnitId, unitInRoster, listRosterUnitTypes } from "./systems/cultureUnits.js";
export type { CultureKitId, CultureUnitGate } from "./systems/cultureUnits.js";

export { playerTitle, extraArchetypes } from "./content/world.js";

export { EconomySystem, computeIncomePerSecond, productionBonus, staffBonus, workStationBonus, workStationDepthBonus, stationPairBonus, stationPairState, stationRestBonus, nextStationRestTick, adjacencyBonus, pairBonus, keepBonus } from "./systems/economy.js";
export { unpairedWorks, PAIR_LABEL, PAIR_MATE } from "./systems/pairHint.js";
export { emptyStaffWorks } from "./systems/staffHint.js";
export { realmPower, resolveBattle, fortificationPower, defenseBonus } from "./systems/combat.js";
export type { BattleResult } from "./systems/combat.js";
export { lastBattleStory } from "./systems/lastBattle.js";
export type { LastBattleStory } from "./systems/lastBattle.js";
export { sunMoonPosition, sunMoonPositionAt } from "./systems/dayNight.js";
export type { SunMoonPosition } from "./systems/dayNight.js";
export { RivalSystem, tickWorldPulse, maybeContestFlag } from "./systems/rival.js";
export { EventSystem, EVENT_PERIOD, getEventLog, getWorldLog, pushWorldLog } from "./systems/events.js";
export type { WorldEvent } from "./systems/events.js";

export { tryBuild, canAfford, canPlaceAt, canPlaceType, isHoldRim, isUniqueBuilding, realmOwnsType, buildingAt, buildCostMultiplier, tryCancelBuild, tryDemolish, listWorksInProgress, buildTicksLeft } from "./actions/build.js";
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
  keepNotice,
  clearKeepNotice,
} from "./actions/upgrade.js";
export type { UpgradeJob } from "./actions/upgrade.js";
export { KEEP_GATES, keepGateFor, currentKeepGate } from "./systems/keepGate.js";
export type { KeepGateRow } from "./systems/keepGate.js";

export { tryTrain, canAffordTrain, trainCostMultiplier } from "./actions/train.js";
export type { TrainPayload } from "./actions/train.js";
export { listTraining, trainDurationTicks, trainingTicksLeft, tryCancelTraining, trainingQueueCap } from "./systems/training.js";
export type { TrainingJob } from "./systems/training.js";

export {
  RESEARCH,
  tryStartResearch,
  tryCancelResearch,
  researchDone,
  researchDuration,
  researchTicksLeft,
  unitUnlocked,
  researchKeepMin,
  researchKeepReady,
  researchRequires,
  researchTier,
  researchPrereqReady,
  researchPaid,
} from "./systems/research.js";
export type { ResearchId } from "./systems/research.js";

export { tryDeclareWar, tryResolveWar, tryWhitePeace, peaceTicksRemaining, warSummary, activeWarFor, warInvolves } from "./actions/war.js";
export type { DeclareWarPayload, WarSummary } from "./actions/war.js";

export { tryTrade, canTrade, MARKET_OFFERS } from "./actions/trade.js";
export type { TradeOffer } from "./actions/trade.js";

export {
  tryGiftGold,
  giftOffer,
  giftOpinionGain,
  giftBonusOpinion,
  GIFT_GOLD_COST,
  GIFT_BASE_OPINION,
  type GiftOffer,
  type GiftBlock,
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

export { tryClaimSeason, seasonClaimed, seasonBoonPreview } from "./systems/seasonClaim.js";
export { tryClaimDaily, dailyClaimed, dailyMsLeft } from "./systems/daily.js";

export { QUESTS, listQuests, tryClaimQuest } from "./systems/quest.js";

export { tryFoodLevy, levyTicksLeft } from "./systems/levy.js";

export {
  tryBanquet,
  banquetTicksLeft,
  tryFortify,
  fortifyTicksLeft,
  fortifyPower,
} from "./systems/court.js";

export {
  tryAppointMarshal,
  tryPromoteMarshal,
  canPromoteMarshal,
  playerMarshal,
  applyMarshalBonuses,
  marshalSkillName,
  marshalSkillBlurb,
  MARSHAL_TREES,
  MARSHAL_PROMOTE_GOLD,
  MARSHAL_PROMOTE_KEEP,
} from "./systems/marshal.js";
export { listLedger, recordCrown } from "./systems/ledger.js";
export type { LedgerEntry } from "./systems/ledger.js";

export { tryStrikeHorde, raidTicksLeft } from "./systems/raid.js";
export { storageCap, resourceLedger } from "./systems/storage.js";
export { fullStores } from "./systems/storageHint.js";
export type { ResourceLedger } from "./systems/storage.js";
export { tryBuyBazaar, ITEMS, ITEM_TIERS } from "./systems/loot.js";

export { settlementName, tryRenameSettlement } from "./actions/settlement.js";
export { tryStamp, listStamps } from "./actions/stamp.js";
export type { Stamp } from "./actions/stamp.js";

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

export { incomingOnHome, watchtowerWarning, maybeNpcRaid, homeRaidAllowed, homeRaidSnapshot, getHomeRaid } from "./systems/raidMarch.js";
export type { HomeRaidSnapshot, HomeRaidRecord } from "./systems/raidMarch.js";
export { canSally, trySally } from "./systems/sally.js";
export { resolveSiegeHold, yardPower, keepPower } from "./systems/siege.js";
export type { SiegeReport } from "./systems/siege.js";
export { forcePower, takeForce, returnForce } from "./systems/column.js";
export { gateOnRim, gateHp } from "./systems/gate.js";
export { hallBonuses, hallRoomBuilt, HALL_ROOM_NEEDS, YARD_HEAL_TICKS, LECTERN_STUDY_MULT } from "./systems/hallBonus.js";
export type { HallBonus, HallRoom } from "./systems/hallBonus.js";
export { campThreat, campTier, campTierId } from "./systems/camp.js";
export { CAMP_TIERS, formatCampLoot } from "./content/camps.js";
export type { CampTier, CampTierId } from "./content/camps.js";
export { RAID_STAGES, BREACH_RESPITE_TICKS, BREACH_SHRINK_PER_TYPE, RAID_MIN_PER_TYPE } from "./content/raids.js";
export type { RaidStage, RaidStageId } from "./content/raids.js";
export { raidStage, breachRun, homeRaidGap, homeRaidPerType, noteHomeSiegeResult } from "./systems/raidPressure.js";

export {
  woundedCount,
  infirmaryBeds,
  tryTreatWounded,
  infirmaryStaffed,
  autoHealActive,
  autoHealAmount,
  autoHealTicksLeft,
  autoHealTick,
  AUTO_HEAL_EVERY,
  AUTO_HEAL_SHARE,
  tryRepair,
  listScarred,
  isScarred,
  healTicksLeft,
  healTicks,
  listHealing,
  absorbBattleCasualties,
} from "./systems/ward.js";

export { laborPerTick, applyLabor, maxMarches } from "./systems/labor.js";
export {
  armyMouths,
  upkeepPerTick,
  starveTicks,
  ticksToNextStarveLoss,
  isTrainedUnit,
  starveShed,
  STARVE_GRACE_TICKS,
  STARVE_PULSE_TICKS,
  STARVE_SHED_FRACTION,
} from "./systems/upkeep.js";
export { housingCap, population, canHouse, workPlotCap, workPlotsUsed, canRaiseWork, WORK_PLOTS } from "./systems/housing.js";
export { isProvinceSeen, tryScoutProvince, revealProvince, ensureFog, visionRange, scoutCost, rimWatchtowers } from "./systems/fog.js";
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

export type { GameState, CitizenInstance, CitizenJobId, CitizenTile, Province, BoardState, MarshalTree } from "@second-crown/shared";
export { formatLetterSuffix, BOARD_W, BOARD_H } from "@second-crown/shared";
export { tryGather, tryRecallGather, tryNpcGather, listGathers, GATHER_NODES, GatherSystem } from "./systems/gather.js";
export type { Gather } from "./systems/gather.js";
export { nodeStock, nodeStockMax, storedNodeStock, NODE_REGEN_PERIOD } from "./systems/nodeStock.js";
export {
  tryGarrison,
  tryRecallGarrison,
  tryAbandonOutpost,
  garrisonAt,
  garrisonPower,
  listGarrisons,
} from "./systems/garrison.js";
export {
  livingSwitches,
  setLivingSwitch,
  livingCounts,
  getCultureNews,
  maybeNpcTrade,
  maybeWhisper,
  tickCorrespondence,
  replyableWhispers,
  replyToWhisper,
  formationSnapshot,
  columnMarkSnapshot,
  columnRanks,
  ranksLabel,
  ranksNote,
  COLUMN_RANKS,
  whisperLineIndex,
  distinctWhisperLines,
  nextWhisperHint,
  lastWhisperSummary,
  friendlyPresenceSnapshot,
  friendlyRealmIds,
  standardStrength,
  realmRelationshipSummary,
  relationshipStanceWith,
  relationshipHistorySnapshot,
  friendlyRoutesSnapshot,
  getPendingReplies,
  joinedWarOutcome,
  latestJoinedWarOutcome,
  maybeNpcWar,
  settleNpcWars,
  applyNpcWarLoss,
  getNpcWarLosses,
  npcWarLossesFor,
  isNpcWar,
  warPhase,
  playerWarPhase,
  tickWarPhases,
  warPhaseTimeline,
  playerFightOpen,
  warFightOpen,
  joinableWars,
  joinSide,
  warImagerySnapshot,
  LIVING_SWITCH_FLAGS,
} from "./systems/livingRealm.js";
export {
  npcBoardSnapshot,
  npcBoardActivityAt,
  maybeNpcClaim,
  maybeNpcCampMarch,
  maybeNpcGatherCrew,
  pickNpcTarget,
  inPlayerRing,
  getNpcClaims,
  claimMarkers,
  NPC_BOARD_KINDS,
} from "./systems/npcBoard.js";
export type { NpcBoardSnapshot, NpcBoardActivity, NpcBoardKind, NpcBoardPhase, NpcClaim } from "./systems/npcBoard.js";
export {
  flagContestSnapshot,
  flagContestOpen,
  getFlagContests,
} from "./systems/flagContest.js";
export type { FlagContestSnapshot, FlagContestEntry, FlagCooldownEntry, FlagContestRecord } from "./systems/flagContest.js";
export type { LivingSwitches, CultureNews, WarPhase, NpcWarLosses, WarSide, JoinableWar, WarImageryEntry, PendingReply, JoinedWarOutcome, ReplyableWhisper, JoinedWarFormation, FormationSide, ColumnMark, ColumnRanks, NextWhisperHint, LastWhisperSummary, FriendlyPresence, FriendlyPresenceKind, FriendlyRoute, FriendlyRouteKind, StandardStrength, RealmRelationship, RelationshipStance, RelationshipInteraction, RelationshipNext, RelationshipHistoryEntry } from "./systems/livingRealm.js";
export {
  economyPressureSnapshot,
  economyYieldsSnapshot,
  economyYieldBreakdownSnapshot,
  storagePressureDetailSnapshot,
  isBareFood,
  researchProgressSnapshot,
  courtStatusSnapshot,
  boardFeedbackSnapshot,
  researchDetailSnapshot,
  courtDetailSnapshot,
  boardInteractionDetailSnapshot,
  researchProgressDetailSnapshot,
  studyEffectPreviewSnapshot,
  academyFeedbackSnapshot,
  decreeEffectSummarySnapshot,
  inspectDetailSnapshot,
  jobSummarySnapshot,
  staffingPressureSnapshot,
  trainingProgressSnapshot,
  unitUnlockSnapshot,
  relationshipDetailSnapshot,
  columnStatusSnapshot,
  marchEtaSnapshot,
  battleOutcomeNoteSnapshot,
  clashResultSnapshot,
  unitWaitingSnapshot,
  boardSurfaceSnapshot,
  selectionFeedbackSnapshot,
  battleFeedbackSnapshot,
  boardPolishSnapshot,
  buildingDetailSnapshot,
  boardScaleSnapshot,
  buildingLifeSnapshot,
  workStationStagingSnapshot,
  boardExpansionSnapshot,
  buildingVarietySnapshot,
  workStationBenefitSnapshot,
  environmentSnapshot,
  workStationDepthSnapshot,
  extraBuildingSnapshot,
  stationPairSnapshot,
  stationRestSnapshot,
} from "./systems/livingStatus.js";
export type {
  PressureLevel,
  EconomyPressure,
  EconomyYields,
  YieldSource,
  YieldBreakdown,
  StoragePressureDetail,
  ResearchActive,
  ResearchProgress,
  CourtDecreeRef,
  CourtStatus,
  BoardFeedbackProvince,
  PendingMarch,
  BoardFeedback,
  BoardView,
  ResearchRef,
  ResearchUnlock,
  ResearchDetail,
  CourtActiveDecree,
  CourtDetail,
  BoardInteractionDetail,
  ResearchProgressDetail,
  StudyEffectPreview,
  AcademyFeedback,
  DecreeEffect,
  DecreeEffectSummary,
  InspectStock,
  InspectMarch,
  InspectDetail,
  JobBuilding,
  JobSummaryEntry,
  JobSummary,
  StaffingPressure,
  TrainingActive,
  TrainingQueued,
  TrainingProgress,
  UnitReady,
  UnitLocked,
  UnitUnlocks,
  RelationshipDetail,
  ColumnStatusEntry,
  ColumnStatus,
  MarchEtaEntry,
  MarchEta,
  BattleOutcomeNote,
  ClashForce,
  ClashResult,
  UnitPosted,
  UnitWaiting,
  UnitWaitingStates,
  BoardSurface,
  SelectionFeedback,
  BattleFeedback,
  BoardPolish,
  BuildingDetail,
  BoardScale,
  BuildingLife,
  WorkStationStaging,
  BoardExpansion,
  BuildingVariety,
  WorkStationBenefit,
  Environment,
  WorkStationDepth,
  ExtraBuilding,
  StationPair,
  StationRest,
} from "./systems/livingStatus.js";
export {
  WAR_PHASE_IDS,
  WAR_PHASE_START,
  WAR_PHASE_TITLE,
  WAR_AFTERMATH_TICKS,
  WHISPERS,
  WHISPERS_PLAIN,
  WHISPER_REPLIES,
  WHISPER_REPLIES_PLAIN,
  RANKS_LABEL,
  RANKS_NOTE,
  WHISPER_REPLY_DELAY_TICKS,
  PLAYER_REPLIES,
  PLAYER_REPLIES_PLAIN,
  PLAYER_REPLIES_NPC_ONLY,
  STANDARD_STRENGTH,
  FRIENDLY_PRESENCE_CAP,
  FRIENDLY_TRADE_WINDOW_TICKS,
  RELATIONSHIP_SUMMARY_CAP,
  FRIENDLY_ROUTES_CAP,
  ECONOMY_PRESSURE_HIGH_FILL,
  ECONOMY_PRESSURE_LOW_FILL,
  RELATIONSHIP_HISTORY_CAP,
  YIELD_BREAKDOWN_CAP,
  RESEARCH_NEXT_UNLOCKS_CAP,
  COURT_GUIDANCE_IDLE,
  COURT_GUIDANCE_FULL,
  BOARD_NEARBY_RADIUS,
  BOARD_NEARBY_FRIENDLY_CAP,
  STUDY_EFFECT_CAP,
  STUDY_EFFECTS,
  ACADEMY_NOTE_BUILDING,
  ACADEMY_NOTE_IDLE,
  ACADEMY_NOTE_EARLY,
  DECREE_EFFECTS,
  DECREE_SUGGESTIONS,
  DECREE_SUGGEST_SAVE,
  INSPECT_NODE_NAMES,
  INSPECT_OUTPOST_CAP,
  INSPECT_MARCH_CAP,
  INSPECT_NOTE_CAP,
  INSPECT_NOTE_HOME,
  INSPECT_NOTE_OUTPOST,
  INSPECT_NOTE_RIVAL,
  INSPECT_NOTE_CAMP,
  INSPECT_NOTE_THREAT,
  INSPECT_NOTE_WORKED,
  INSPECT_NOTE_DEPLETED,
  JOB_SUMMARY_BUILDING_CAP,
  STAFFING_NOTE_ASSIGN,
  STAFFING_NOTE_SHORT,
  STAFFING_NOTE_SPARE,
  TRAINING_NOTE_IDLE,
  TRAINING_NOTE_FULL,
  UNIT_UNLOCK_CAP,
  UNIT_REQUIRES_FALLBACK,
  RELATIONSHIP_GIFT_RECENT,
  RELATIONSHIP_GIFT_OLD,
  RELATIONSHIP_GIFT_RECENT_TICKS,
  RELATIONSHIP_WARM_OPINION,
  RELATIONSHIP_SUGGEST_WAR,
  RELATIONSHIP_SUGGEST_CAP,
  RELATIONSHIP_SUGGEST_GIFT,
  RELATIONSHIP_SUGGEST_SAVE,
  COLUMN_STATUS_CAP,
  COLUMN_NOTE_THREAT,
  COLUMN_NOTE_MORE,
  MARCH_ETA_CAP,
  BATTLE_NOTE_RECENT_TICKS,
  BATTLE_NOTE_WON,
  BATTLE_NOTE_LOST,
  BATTLE_NOTE_OTHERS,
  BATTLE_SUGGEST_WON,
  BATTLE_SUGGEST_LOST,
  CLASH_FORCE_CAP,
  CLASH_OUTCOME_WON,
  CLASH_OUTCOME_LOST,
  CLASH_OUTCOME_OTHERS,
  CLASH_NOTE_COSTLY,
  CLASH_NOTE_CLEAN,
  UNIT_WAITING_CAP,
  SURFACE_ELEVATION,
  SURFACE_ELEVATION_DEFAULT,
  SURFACE_FOG_CLEAR,
  SURFACE_FOG_VEILED,
  SURFACE_KEEP_HOME,
  SURFACE_KEEP_RIVAL,
  SURFACE_KEEP_EMPTY,
  SURFACE_MARCH_ENEMY,
  SURFACE_MARCH_OWN,
  SURFACE_MARCH_LEAVING,
  SELECTION_NOTE_HOME,
  SELECTION_NOTE_VEILED,
  SELECTION_NOTE_OWN,
  SELECTION_NOTE_RIVAL,
  SELECTION_NOTE_OPEN,
  BATTLE_FEEDBACK_NOTE_WON,
  BATTLE_FEEDBACK_NOTE_LOST,
  BATTLE_FEEDBACK_NOTE_OTHERS,
  BATTLE_FEEDBACK_MARK_WON,
  BATTLE_FEEDBACK_MARK_LOST,
  BATTLE_FEEDBACK_MARK_OTHERS,
  POLISH_MARCH_ENEMY,
  POLISH_MARCH_OWN,
  POLISH_MARCH_LEAVING,
  POLISH_KEEP_HOME,
  POLISH_KEEP_RIVAL,
  POLISH_KEEP_EMPTY,
  BUILDING_TIER_LABELS,
  BUILDING_WORK_STATIONS,
  BUILDING_NOTE_BUILDING,
  BUILDING_NOTE_UPGRADING,
  BUILDING_NOTE_NO_STATION,
  BUILDING_NOTE_STAFFED,
  BUILDING_NOTE_UNSTAFFED,
  BOARD_SCALE_SMALL_TILES,
  BOARD_SCALE_MID_TILES,
  BOARD_SCALE_NOTE_SMALL,
  BOARD_SCALE_NOTE_MID,
  BOARD_SCALE_NOTE_WIDE,
  BUILDING_LIFE_TIER_ELEMENTS,
  BUILDING_LIFE_MOTION_SCAFFOLD,
  BUILDING_LIFE_MOTION_HAMMERS,
  BUILDING_LIFE_MOTION_WORK,
  BUILDING_LIFE_NOTE_BUILDING,
  BUILDING_LIFE_NOTE_UPGRADING,
  BUILDING_LIFE_NOTE_NO_STATION,
  BUILDING_LIFE_NOTE_STAFFED,
  BUILDING_LIFE_NOTE_UNSTAFFED,
  WORK_STATION_STAGED,
  WORK_STATION_NOTE_BUILDING,
  WORK_STATION_NOTE_UPGRADING,
  WORK_STATION_NOTE_STAFFED,
  WORK_STATION_NOTE_EMPTY,
  BOARD_BAND_SMALL,
  BOARD_BAND_MID,
  BOARD_BAND_WIDE,
  BOARD_EXPANSION_NOTE_PLANNED,
  BOARD_EXPANSION_NOTE_WIDEST,
  BUILDING_VARIETY,
  BUILDING_VARIETY_DEFAULT,
  BUILDING_VARIETY_TIER_DETAIL,
  BUILDING_VARIETY_NOTE_BUILDING,
  BUILDING_VARIETY_NOTE_UPGRADING,
  BUILDING_VARIETY_NOTE_TOP,
  BUILDING_VARIETY_NOTE_GROWING,
  WORK_STATION_BENEFIT_MULT,
  WORK_STATION_BENEFIT_LABEL,
  WORK_STATION_BENEFIT_NOTE_ACTIVE,
  WORK_STATION_BENEFIT_NOTE_BUILDING,
  WORK_STATION_BENEFIT_NOTE_UPGRADING,
  WORK_STATION_BENEFIT_NOTE_EMPTY,
  ENVIRONMENT_FEATURES,
  ENVIRONMENT_AMBIENT,
  ENVIRONMENT_NOTE,
  WORK_STATION_DEPTH_MULT,
  WORK_STATION_DEPTH_MIN_LEVEL,
  WORK_STATION_DEPTH_LABEL,
  WORK_STATION_DEPTH_NOTE_ACTIVE,
  WORK_STATION_DEPTH_NOTE_BUILDING,
  WORK_STATION_DEPTH_NOTE_UPGRADING,
  WORK_STATION_DEPTH_NOTE_LOW_TIER,
  WORK_STATION_DEPTH_NOTE_EMPTY,
  WORK_STATION_DEPTH_NOTE_NO_BASE,
  EXTRA_BUILDINGS,
  EXTRA_BUILDING_DETAIL_UPGRADING,
  EXTRA_BUILDING_DETAIL_SMALL,
  EXTRA_BUILDING_DETAIL_FULL,
  EXTRA_BUILDING_FULL_LEVEL,
  EXTRA_BUILDING_NOTE_BUILDING,
  EXTRA_BUILDING_NOTE_UPGRADING,
  EXTRA_BUILDING_NOTE_STANDING,
  ENVIRONMENT_MOOD_RESTLESS,
  ENVIRONMENT_MOOD_SOFT,
  ENVIRONMENT_MOOD_STILL,
  ENVIRONMENT_MOOD_OPEN,
  STATION_PAIR_MULT,
  STATION_PAIR_NOTE_LEAD,
  STATION_PAIR_NOTE_TWIN,
  STATION_PAIR_NOTE_BUILDING,
  STATION_PAIR_NOTE_ALONE,
  ENVIRONMENT_SEASON_NOTE,
  STATION_REST_MULT,
  STATION_REST_NOTE_RESTING,
  STATION_REST_NOTE_FRESH,
  STATION_REST_NOTE_WORKING,
  STATION_REST_NOTE_BUILDING,
  FORMATION_IDS,
  COLUMN_MARK_IDS,
  FIGHT_LOCKED_LINE,
  NPC_PLAYER_RING,
  NPC_BOARD_GRACE_TICKS,
  NPC_CLAIM_CAP,
  FLAG_CONTEST_COLUMNS_PER_FLAG,
  FLAG_CONTEST_COOLDOWN_TICKS,
  NPC_WAR_LOSS_SHARE,
  NPC_WAR_LOSS_CAP,
  HOME_RAID_IN_FLIGHT,
  HOME_RAID_COOLDOWN_TICKS,
} from "./content/livingRealm.js";
export type { WarPhaseId, FormationId, ColumnMarkId } from "./content/livingRealm.js";
export { workerSnapshot, unitActivity, unitActivityAt, WORKER_TASK_TAGS, UNIT_DOING_LABEL } from "./systems/boardActivity.js";
export type { WorkerSnapshot, WorkerPost, WorkerTaskTag, UnitActivity, UnitDoing } from "./systems/boardActivity.js";
