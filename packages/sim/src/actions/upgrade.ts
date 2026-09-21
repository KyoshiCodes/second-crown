import type { GameState, InputRecord } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getBuildingType } from "../content/buildings.js";
import { buildCostMultiplier } from "./build.js";
import { addCapped } from "../systems/storage.js";
import { recordCrown } from "../systems/ledger.js";

export const MAX_BUILDING_LEVEL = 5;

export interface UpgradeJob {
  id: string;
  buildingId: string;
  fromLevel: number;
  doneTick: number;
  ticks: number;
  paid: Record<string, string>;
}

function readJobs(state: GameState): UpgradeJob[] {
  const raw = state.flags.upgrades_json;
  return Array.isArray(raw) ? (raw as UpgradeJob[]) : [];
}

function writeJobs(state: GameState, jobs: UpgradeJob[]): void {
  state.flags.upgrades_json = jobs;
}

export function listUpgrades(state: GameState): UpgradeJob[] {
  return readJobs(state);
}

export function upgradeJobFor(state: GameState, buildingId: string): UpgradeJob | undefined {
  return readJobs(state).find((j) => j.buildingId === buildingId);
}

export function keepLevel(state: GameState, realmId = "player"): number {
  const keeps = state.buildings.filter(
    (b) => b.realmId === realmId && b.typeId === "keep" && b.completesAtTick === null
  );
  if (keeps.length === 0) return 0;
  return Math.max(...keeps.map((b) => b.level));
}

/** Other buildings may reach keepLevel+1, floored at 2, capped at 5. Keep uses the hard cap. */
export function maxLevelFor(state: GameState, typeId: string, realmId = "player"): number {
  if (typeId === "keep") return MAX_BUILDING_LEVEL;
  return Math.min(MAX_BUILDING_LEVEL, Math.max(2, keepLevel(state, realmId) + 1));
}

export function keepNotice(state: GameState): string {
  return String(state.flags.keep_notice ?? "");
}

export function clearKeepNotice(state: GameState): void {
  delete state.flags.keep_notice;
}

export function upgradeDurationTicks(state: GameState, buildingId: string): number {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b) return 0;
  const def = getBuildingType(b.typeId);
  if (!def) return 0;
  return Math.max(20, def.buildTicks * b.level);
}

export function upgradeCost(state: GameState, buildingId: string): Record<string, string> | null {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick !== null) return null;
  if (b.level >= maxLevelFor(state, b.typeId, b.realmId)) return null;
  const def = getBuildingType(b.typeId);
  if (!def) return null;
  const mult = buildCostMultiplier(state, b.realmId);
  const scale = b.level + 1;
  const out: Record<string, string> = {};
  for (const [res, costStr] of Object.entries(def.cost)) {
    out[res] = toDecimalString(D(costStr ?? "0").mul(scale).mul(mult).ceil());
  }
  return out;
}

export function canUpgrade(state: GameState, buildingId: string): boolean {
  if (upgradeJobFor(state, buildingId)) return false;
  const cost = upgradeCost(state, buildingId);
  if (!cost) return false;
  for (const [res, need] of Object.entries(cost)) {
    if (D(state.resources[res] ?? "0").lt(D(need))) return false;
  }
  return true;
}

export function tryUpgrade(state: GameState, buildingId: string): boolean {
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick !== null) return false;
  if (upgradeJobFor(state, buildingId)) return false;
  if (b.level >= maxLevelFor(state, b.typeId, b.realmId)) return false;
  const cost = upgradeCost(state, buildingId);
  if (!cost) return false;
  for (const [res, need] of Object.entries(cost)) {
    if (D(state.resources[res] ?? "0").lt(D(need))) return false;
  }
  for (const [res, need] of Object.entries(cost)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(D(need)));
  }
  const ticks = upgradeDurationTicks(state, buildingId);
  const jobs = readJobs(state);
  jobs.push({
    id: `up_${state.meta.tick}_${buildingId}`,
    buildingId,
    fromLevel: b.level,
    doneTick: state.meta.tick + ticks,
    ticks,
    paid: { ...cost },
  });
  writeJobs(state, jobs);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "upgrade",
    payload: { buildingId, level: b.level + 1 },
    issuerId: b.realmId,
  } satisfies InputRecord);
  return true;
}

export function tryCancelUpgrade(state: GameState, buildingId: string): boolean {
  const jobs = readJobs(state);
  const job = jobs.find((j) => j.buildingId === buildingId);
  if (!job) return false;
  const left = Math.max(0, job.doneTick - state.meta.tick);
  const frac = job.ticks > 0 ? Math.min(1, left / job.ticks) : 0;
  for (const [res, paid] of Object.entries(job.paid)) {
    addCapped(state, res, D(paid).mul(frac));
  }
  writeJobs(
    state,
    jobs.filter((j) => j.buildingId !== buildingId)
  );
  state.inputLog.push({
    tick: state.meta.tick,
    type: "cancel_upgrade",
    issuerId: "player",
    payload: { buildingId },
  });
  return true;
}

function noteKeepUpgrade(state: GameState, fromLevel: number, toLevel: number, realmId: string): void {
  if (realmId !== "player") return;
  const note =
    toLevel === 2
      ? "Keep II stands. Works may reach level 3. Marshal rank 2 is open (80 gold)."
      : `Keep ${toLevel} stands. Works may reach level ${Math.min(5, Math.max(2, toLevel + 1))}.`;
  state.flags.keep_notice = note;
  recordCrown(state, "keep", note);
  void fromLevel;
}

export function completeUpgrades(state: GameState, tick: number): void {
  const jobs = readJobs(state);
  if (jobs.length === 0) return;
  const left: UpgradeJob[] = [];
  for (const job of jobs) {
    if (job.doneTick > tick) {
      left.push(job);
      continue;
    }
    const b = state.buildings.find((x) => x.id === job.buildingId);
    if (b) {
      b.level = job.fromLevel + 1;
      if (b.typeId === "keep") noteKeepUpgrade(state, job.fromLevel, b.level, b.realmId);
    }
  }
  writeJobs(state, left);
}

export const UpgradeSystem = {
  nextEventTick(state: GameState): number | null {
    const jobs = readJobs(state);
    if (jobs.length === 0) return null;
    return Math.min(...jobs.map((j) => j.doneTick));
  },
  processEventsAt(state: GameState, tick: number): void {
    completeUpgrades(state, tick);
  },
  advanceAnalytic(state: GameState, _from: number, toTick: number): void {
    completeUpgrades(state, toTick);
  },
};
