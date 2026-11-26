import type { GameState } from "@second-crown/shared";
import { D } from "../core/decimal.js";
import { forcePower } from "./column.js";
import { listGathers } from "./gather.js";
import { listGarrisons } from "./garrison.js";
import { listMarches } from "./march.js";

/**
 * Read-only snapshots the board can draw from: where workers are posted and what the
 * player's troops are doing. Nothing here moves or changes sim state; it only reads
 * citizens, buildings, gathers, marches and garrisons, in state order (deterministic).
 */

// ---------------------------------------------------------------- workers

/** farm = food work, quarry = stone work, yard = any other posted trade (lumber, market, watch, study), march = a crew on the road. */
export type WorkerTaskTag = "farm" | "quarry" | "yard" | "idle" | "march";
export const WORKER_TASK_TAGS: readonly WorkerTaskTag[] = ["farm", "quarry", "yard", "idle", "march"];

export interface WorkerPost {
  id: string;
  /** citizen = a hold worker at a building; crew = a gather column working a board node. */
  kind: "citizen" | "crew";
  tag: WorkerTaskTag;
  /** Citizen job, or the gather node for a crew. */
  job: string;
  /** Hold tile for a citizen (null when idle). */
  tile: { x: number; y: number } | null;
  /** The finished building on that tile, if any. */
  buildingId: string | null;
  /** Board province for a crew (its node), null for citizens. */
  provinceId: string | null;
  /** Heads: 1 for a citizen, column size for a crew. */
  heads: number;
}

export interface WorkerSnapshot {
  tick: number;
  posts: WorkerPost[];
  /** Posts per tag. */
  counts: Record<WorkerTaskTag, number>;
  /** Citizens at a post (not idle). Matches what labor.ts pays. */
  posted: number;
}

function citizenTag(job: string, posted: boolean): WorkerTaskTag {
  if (!posted) return "idle";
  if (job === "farmer") return "farm";
  if (job === "miner") return "quarry";
  return "yard";
}

const NODE_TAG: Record<string, WorkerTaskTag> = { field: "farm", quarry: "quarry", woodcut: "yard" };

export function workerSnapshot(state: GameState, realmId = "player"): WorkerSnapshot {
  const posts: WorkerPost[] = [];
  for (const c of state.citizens) {
    if (c.realmId !== realmId) continue;
    const posted = c.job !== "unassigned" && c.tile != null;
    const b = posted
      ? state.buildings.find((x) => x.realmId === realmId && x.x === c.tile!.x && x.y === c.tile!.y && x.completesAtTick === null)
      : undefined;
    posts.push({
      id: c.id,
      kind: "citizen",
      tag: citizenTag(c.job, posted),
      job: c.job,
      tile: posted ? { x: c.tile!.x, y: c.tile!.y } : null,
      buildingId: b?.id ?? null,
      provinceId: null,
      heads: 1,
    });
  }
  for (const g of listGathers(state)) {
    if (g.realmId !== realmId) continue;
    posts.push({
      id: g.id,
      kind: "crew",
      tag: g.phase === "gathering" ? NODE_TAG[g.node] ?? "yard" : "march",
      job: g.node,
      tile: null,
      buildingId: null,
      provinceId: g.toId,
      heads: Object.values(g.force).reduce((n, v) => n + Math.max(0, v), 0),
    });
  }
  const counts = { farm: 0, quarry: 0, yard: 0, idle: 0, march: 0 } as Record<WorkerTaskTag, number>;
  for (const p of posts) counts[p.tag] += 1;
  const posted = posts.filter((p) => p.kind === "citizen" && p.tag !== "idle").length;
  return { tick: state.meta.tick, posts, counts, posted };
}

// ---------------------------------------------------------------- troops

export type UnitDoing = "home" | "marching" | "returning" | "garrisoned" | "scouting" | "gathering";

export const UNIT_DOING_LABEL: Record<UnitDoing, string> = {
  home: "At the hold",
  marching: "Marching",
  returning: "Returning",
  garrisoned: "Garrisoned",
  scouting: "Scouting",
  gathering: "Gathering",
};

export interface UnitActivity {
  id: string;
  doing: UnitDoing;
  label: string;
  /** Where the group is headed or posted (home province for `home`). */
  provinceId: string;
  fromId: string | null;
  arrivesTick: number | null;
  force: Record<string, number>;
  men: number;
  power: number;
}

function men(force: Record<string, number>): number {
  return Object.values(force).reduce((n, v) => n + Math.max(0, v), 0);
}

/** What every group of the player's troops is doing right now: home, on the road, posted, or working a node. */
export function unitActivity(state: GameState): UnitActivity[] {
  const out: UnitActivity[] = [];
  const homeId = state.board.homeProvinceId;
  const home: Record<string, number> = {};
  for (const u of state.units) {
    if (u.realmId !== "player") continue;
    const n = Math.floor(D(u.count).toNumber());
    if (n > 0) home[u.typeId] = (home[u.typeId] ?? 0) + n;
  }
  if (men(home) > 0) {
    out.push({ id: "home", doing: "home", label: UNIT_DOING_LABEL.home, provinceId: homeId, fromId: null, arrivesTick: null, force: home, men: men(home), power: forcePower(home) });
  }
  for (const m of listMarches(state)) {
    if (m.realmId !== "player") continue;
    const force = m.force ?? { militia: m.levy };
    const doing: UnitDoing = m.purpose === "scout" ? "scouting" : m.purpose === "garrison_home" ? "returning" : "marching";
    out.push({ id: m.id, doing, label: UNIT_DOING_LABEL[doing], provinceId: m.toId, fromId: m.fromId, arrivesTick: m.arrivesTick, force, men: men(force), power: forcePower(force) });
  }
  for (const g of listGathers(state)) {
    if (g.realmId !== "player") continue;
    const doing: UnitDoing = g.phase === "gathering" ? "gathering" : g.phase === "returning" ? "returning" : "marching";
    const to = g.phase === "returning" ? g.fromId : g.toId;
    out.push({ id: g.id, doing, label: UNIT_DOING_LABEL[doing], provinceId: to, fromId: g.phase === "returning" ? g.toId : g.fromId, arrivesTick: g.phase === "gathering" ? null : g.arrivesTick, force: g.force, men: men(g.force), power: forcePower(g.force) });
  }
  for (const gar of listGarrisons(state)) {
    out.push({ id: `garrison_${gar.provinceId}`, doing: "garrisoned", label: UNIT_DOING_LABEL.garrisoned, provinceId: gar.provinceId, fromId: null, arrivesTick: null, force: gar.force, men: men(gar.force), power: forcePower(gar.force) });
  }
  return out;
}

/** Activities touching one province (headed to, posted at, or working it). */
export function unitActivityAt(state: GameState, provinceId: string): UnitActivity[] {
  return unitActivity(state).filter((a) => a.provinceId === provinceId);
}
