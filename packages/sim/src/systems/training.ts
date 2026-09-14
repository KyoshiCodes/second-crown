import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { countBuilding } from "../content/buildings.js";

export interface TrainingJob {
  id: string;
  realmId: string;
  typeId: string;
  count: number;
  startedTick: number;
  doneTick: number;
}

function read(state: GameState): TrainingJob[] {
  const raw = state.flags["training_json"];
  return typeof raw === "string" ? (JSON.parse(raw) as TrainingJob[]) : [];
}

function save(state: GameState, jobs: TrainingJob[]): void {
  state.flags["training_json"] = JSON.stringify(jobs);
}

export function listTraining(state: GameState): TrainingJob[] {
  return read(state);
}

export function trainDurationTicks(state: GameState, typeId: string, count: number): number {
  const def = getUnitType(typeId);
  if (!def || count < 1) return 0;
  const barracks = countBuilding(state, "barracks");
  const mult = Math.max(0.4, 1 - barracks * 0.08);
  return Math.max(1, Math.ceil(def.trainTicks * count * mult));
}

export function trainingTicksLeft(state: GameState, jobId?: string): number {
  const jobs = read(state);
  const job = jobId ? jobs.find((j) => j.id === jobId) : jobs[0];
  if (!job) return 0;
  return Math.max(0, job.doneTick - state.meta.tick);
}

export function deliverUnits(state: GameState, typeId: string, count: number, realmId: string): void {
  const existing = state.units.find((u) => u.typeId === typeId && u.realmId === realmId && u.armyId === null);
  if (existing) {
    existing.count = toDecimalString(D(existing.count).add(count));
  } else {
    state.units.push({
      id: `u_${state.meta.tick}_${state.units.length}`,
      typeId,
      realmId,
      count: toDecimalString(count),
      armyId: null,
    });
  }
}

export function enqueueTraining(
  state: GameState,
  typeId: string,
  count: number,
  realmId: string,
): TrainingJob | null {
  const duration = trainDurationTicks(state, typeId, count);
  if (duration < 1) return null;
  const jobs = read(state);
  const serial = Number(state.flags["training_serial"] ?? 0) + 1;
  state.flags["training_serial"] = serial;
  const start = jobs.reduce((t, j) => Math.max(t, j.doneTick), state.meta.tick);
  const job: TrainingJob = {
    id: `tr_${serial}`,
    realmId,
    typeId,
    count,
    startedTick: start,
    doneTick: start + duration,
  };
  save(state, [...jobs, job]);
  return job;
}

export const TrainingSystem = {
  nextEventTick(state: GameState): number | null {
    const jobs = read(state);
    return jobs.length ? Math.min(...jobs.map((j) => j.doneTick)) : null;
  },
  processEventsAt(state: GameState, tick: number): void {
    const jobs = read(state);
    if (!jobs.some((j) => j.doneTick === tick)) return;
    const remaining: TrainingJob[] = [];
    for (const job of jobs) {
      if (job.doneTick === tick) {
        deliverUnits(state, job.typeId, job.count, job.realmId);
      } else {
        remaining.push(job);
      }
    }
    save(state, remaining);
  },
  advanceAnalytic(): void {},
  tick(): void {},
};
