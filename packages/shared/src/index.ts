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

export interface Realm {
  id: string;
  name: string;
  rulerId: string;
}

export interface Character {
  id: string;
  name: string;
  role: "ruler" | "heir" | "advisor" | "general" | "other";
  realmId: string;
  traits: TraitId[];
  ambition: AmbitionId | null;
}

export interface OpinionEdge {
  from: string;
  to: string;
  value: number;
  expiresTick: number | null;
}

export interface War {
  id: string;
  attackerRealmId: string;
  defenderRealmId: string;
  startedTick: number;
  status: "active" | "attacker_won" | "defender_won" | "white_peace";
}

export interface InputRecord {
  tick: number;
  type: string;
  payload: unknown;
  issuerId?: string;
}

export interface GameState {
  meta: MetaState;
  resources: Record<string, DecimalString>;
  buildings: BuildingInstance[];
  units: UnitInstance[];
  realms: Realm[];
  characters: Character[];
  opinions: OpinionEdge[];
  wars: War[];
  inputLog: InputRecord[];
  flags: Record<string, boolean | number | string>;
  unlocks: string[];
}

/** Current save schema version */
export const SAVE_VERSION = 0;

/** Fine ticks per second while tab is focused */
export const TICKS_PER_SECOND = 10;

/** Maximum offline window in real milliseconds (30 days) */
export const MAX_OFFLINE_MS = 30 * 24 * 60 * 60 * 1000;

export { formatLetterSuffix } from "./formatNumber.js";
