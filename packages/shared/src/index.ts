/** @second-crown/shared — pure types and constants shared across packages */

export type DecimalString = string;

export type ResourceId = "gold" | "food" | "wood" | "stone" | "mana" | (string & {});

export type TraitId = string;
export type AmbitionId = string;
export type BuildingTypeId = string;
export type UnitTypeId = string;

export interface MetaState {
  version: number;
  seed: number;
  tick: number;
  lastRealTime: number;
  playTimeMs: number;
}

export interface BuildingInstance {
  id: string;
  typeId: BuildingTypeId;
  realmId: string;
  x: number;
  y: number;
  level: number;
  completesAtTick: number | null;
}

export interface UnitInstance {
  id: string;
  typeId: UnitTypeId;
  realmId: string;
  count: DecimalString;
  armyId: string | null;
}

export type CitizenJobId =
  | "unassigned"
  | "farmer"
  | "woodcutter"
  | "miner"
  | "merchant"
  | "guard"
  | "scholar";

export interface CitizenTile {
  x: number;
  y: number;
}

export interface CitizenInstance {
  id: string;
  realmId: string;
  job: CitizenJobId;
  tile: CitizenTile | null;
}

export interface CharacterInstance {
  id: string;
  name: string;
  role: string;
  realmId: string;
  traits: TraitId[];
  ambition: AmbitionId | null;
}

export interface RealmInstance {
  id: string;
  name: string;
  rulerId: string;
  era?: string;
  lifestyle?: string;
  aiProfile?: string;
}

export interface OpinionEdge {
  from: string;
  to: string;
  value: number;
  expiresTick: number | null;
}

export type WarStatus = "active" | "ended" | "white_peace" | "attacker_won" | "defender_won";

export interface WarInstance {
  id: string;
  attackerRealmId: string;
  defenderRealmId: string;
  startedTick: number;
  status: WarStatus;
  endedTick?: number | null;
}

export interface FactionInstance {
  id: string;
  name: string;
  leaderRealmId: string | null;
  memberRealmIds: string[];
  stance: number;
  kind?: string;
  crestId?: string;
}

export type TerrainId = "plain" | "wood" | "hill" | "waste" | "shore" | "peak";
export type NodeId = "none" | "hold" | "camp" | "woodcut" | "quarry" | "field" | "ruins";
export type ProvinceNode = NodeId;

export interface Province {
  id: string;
  x: number;
  y: number;
  terrain: TerrainId;
  node: NodeId;
  occupantRealmId: string | null;
}

export interface BoardState {
  width: number;
  height: number;
  homeProvinceId: string;
  provinces: Province[];
}

export interface InputRecord {
  tick: number;
  type: string;
  payload?: unknown;
  issuerId?: string;
  [key: string]: unknown;
}

export interface GameState {
  meta: MetaState;
  resources: Record<string, DecimalString>;
  buildings: BuildingInstance[];
  units: UnitInstance[];
  citizens: CitizenInstance[];
  realms: RealmInstance[];
  characters: CharacterInstance[];
  opinions: OpinionEdge[];
  wars: WarInstance[];
  factions: FactionInstance[];
  inputLog: InputRecord[];
  flags: Record<string, unknown>;
  unlocks: string[];
  board: BoardState;
}

export type Character = CharacterInstance;
export type Realm = RealmInstance;
export type Faction = FactionInstance;
export type War = WarInstance;

export const SAVE_VERSION = 1;

export const TICKS_PER_SECOND = 10;

export const MAX_OFFLINE_MS = 30 * 24 * 60 * 60 * 1000;

export const BOARD_W = 12;
export const BOARD_H = 8;

export { formatLetterSuffix } from "./formatNumber.js";
