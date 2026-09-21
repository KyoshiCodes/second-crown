import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";

const REPAIR_STONE = 8;
const TREAT_FOOD = 4;
export const HEAL_TICKS = 50;

interface HealJob {
  doneTick: number;
}

function readHeals(state: GameState): HealJob[] {
  const raw = state.flags["heal_json"];
  return typeof raw === "string" ? (JSON.parse(raw) as HealJob[]) : [];
}

function saveHeals(state: GameState, jobs: HealJob[]): void {
  state.flags["heal_json"] = JSON.stringify(jobs);
}

export function woundedCount(state: GameState): number {
  return Math.max(0, Number(state.flags.wounded_player ?? 0));
}

export function infirmaryBeds(state: GameState): number {
  return countBuilding(state, "infirmary") * 10;
}

export function healTicksLeft(state: GameState): number {
  const jobs = readHeals(state);
  if (!jobs.length) return 0;
  return Math.max(0, Math.min(...jobs.map((j) => j.doneTick)) - state.meta.tick);
}

export function listHealing(state: GameState): HealJob[] {
  return readHeals(state);
}

function takeBeds(state: GameState, n: number): number {
  if (n <= 0) return 0;
  const beds = infirmaryBeds(state);
  const have = woundedCount(state);
  const space = Math.max(0, beds - have);
  const saved = Math.min(space, Math.floor(n));
  state.flags.wounded_player = have + saved;
  return saved;
}

/** Legacy half-save used by older call sites. */
export function absorbWounded(state: GameState, lost: number): number {
  if (lost <= 0) return 0;
  return takeBeds(state, Math.floor(lost * 0.5));
}

/** Winner: every loss that fits a bed. Loser: beds first, overflow already dead on the field. */
export function absorbBattleCasualties(
  state: GameState,
  lost: number,
  side: "winner" | "loser"
): { saved: number; dead: number } {
  if (lost <= 0) return { saved: 0, dead: 0 };
  const want = side === "winner" ? lost : lost;
  const saved = takeBeds(state, want);
  return { saved, dead: Math.max(0, lost - saved) };
}

function deliverMilitia(state: GameState): void {
  const militia = state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
  if (militia) militia.count = toDecimalString(D(militia.count).add(1));
  else {
    state.units.push({
      id: `u_heal_${state.meta.tick}`,
      typeId: "militia",
      realmId: "player",
      count: "1",
      armyId: null,
    });
  }
}

export function tryTreatWounded(state: GameState): boolean {
  const n = woundedCount(state);
  if (n <= 0) return false;
  if (D(state.resources.food ?? "0").lt(TREAT_FOOD)) return false;
  state.resources.food = toDecimalString(D(state.resources.food ?? "0").sub(TREAT_FOOD));
  state.flags.wounded_player = n - 1;
  const jobs = readHeals(state);
  const start = jobs.reduce((t, j) => Math.max(t, j.doneTick), state.meta.tick);
  saveHeals(state, [...jobs, { doneTick: start + HEAL_TICKS }]);
  state.inputLog.push({ tick: state.meta.tick, type: "treat", issuerId: "player" });
  return true;
}

export function listScarred(state: GameState) {
  return state.buildings.filter((b) => b.realmId === "player" && b.completesAtTick !== null && b.level >= 1);
}

export function tryRepair(state: GameState, buildingId: string): boolean {
  const b = state.buildings.find((x) => x.id === buildingId && x.realmId === "player");
  if (!b || b.completesAtTick === null) return false;
  if (D(state.resources.stone ?? "0").lt(REPAIR_STONE)) return false;
  state.resources.stone = toDecimalString(D(state.resources.stone ?? "0").sub(REPAIR_STONE));
  b.completesAtTick = null;
  return true;
}

export const WardSystem = {
  nextEventTick(state: GameState): number | null {
    const jobs = readHeals(state);
    return jobs.length ? Math.min(...jobs.map((j) => j.doneTick)) : null;
  },
  processEventsAt(state: GameState, tick: number): void {
    const jobs = readHeals(state);
    if (!jobs.some((j) => j.doneTick === tick)) return;
    const remaining: HealJob[] = [];
    for (const job of jobs) {
      if (job.doneTick === tick) deliverMilitia(state);
      else remaining.push(job);
    }
    saveHeals(state, remaining);
  },
  advanceAnalytic(): void {},
  tick(): void {},
};
