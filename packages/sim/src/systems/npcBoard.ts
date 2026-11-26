import type { GameState, Province } from "@second-crown/shared";
import {
  NPC_BOARD_GRACE_TICKS,
  NPC_CAMP_PULSES,
  NPC_CLAIM_CAP,
  NPC_CLAIM_LOG_CAP,
  NPC_CLAIM_PULSES,
  NPC_CLAIM_SHOW_TICKS,
  NPC_GATHER_PULSES,
  NPC_PLAYER_RING,
  NPC_RAID_PULSE_TICKS,
} from "../content/livingRealm.js";
import { pushWorldLog } from "./events.js";
import { listGathers, nodeBusy, npcGatherable, tryNpcGather } from "./gather.js";
import { listMarches, travelTicks, tryNpcMarch } from "./march.js";
import { bumpCount, livingSwitches, nameOf, realmSalt } from "./livingRealm.js";

/**
 * Living Realm, slice 2: NPC realms act on the board. They plant claim markers on open
 * tiles, ride on free camps, and send foraging crews to resource nodes. Each runs on the
 * 100-tick world pulse at `(pulse + realmSalt) % N === 0`, so every realm gets a turn
 * (the old `(tick + salt) % 200` gate never matched a pulse tick for most salts).
 *
 * Player ring rule: a tile within NPC_PLAYER_RING (Manhattan) of the player's hold is
 * off-limits before NPC_BOARD_GRACE_TICKS. After that, NPCs still take any target outside
 * the ring first and only reach into it when nothing outside is left. NPCs never target a
 * tile the player holds. Targets are picked nearest to the NPC's own hold, ties by board
 * order. No RNG; replays match.
 */

// ---------------------------------------------------------------- targeting

function manhattan(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function playerHome(state: GameState): Province | undefined {
  return state.board.provinces.find((p) => p.id === state.board.homeProvinceId);
}

function npcHold(state: GameState, realmId: string): Province | undefined {
  return state.board.provinces.find((p) => p.occupantRealmId === realmId && p.node === "hold");
}

/** True when `p` sits inside the player ring. */
export function inPlayerRing(state: GameState, p: { x: number; y: number }): boolean {
  const home = playerHome(state);
  return !!home && manhattan(home, p) <= NPC_PLAYER_RING;
}

/**
 * Pick a target from `candidates` under the ring rule: outside the ring first; inside only
 * after the grace window and when nothing outside qualifies. Nearest to the NPC's hold.
 */
export function pickNpcTarget(state: GameState, realmId: string, candidates: Province[], atTick: number): Province | null {
  const hold = npcHold(state, realmId);
  const origin = hold ?? { x: 0, y: 0 };
  const playerId = state.board.homeProvinceId;
  const ok = candidates.filter((p) => p.occupantRealmId !== "player" && p.id !== playerId && p.id !== hold?.id);
  const byNear = (list: Province[]) =>
    list
      .map((p, i) => ({ p, i, d: manhattan(origin, p) }))
      .sort((a, b) => a.d - b.d || a.i - b.i)
      .map((e) => e.p);
  const outside = byNear(ok.filter((p) => !inPlayerRing(state, p)));
  if (outside.length) return outside[0];
  if (atTick < NPC_BOARD_GRACE_TICKS) return null;
  return byNear(ok)[0] ?? null;
}

function onCadence(realmId: string, atTick: number, every: number): boolean {
  const pulse = Math.floor(atTick / 100);
  return pulse > 0 && (pulse + realmSalt(realmId)) % every === 0;
}

// ---------------------------------------------------------------- claims

export interface NpcClaim {
  realmId: string;
  provinceId: string;
  tick: number;
}

export function getNpcClaims(state: GameState): NpcClaim[] {
  const raw = state.flags.npc_claims;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as NpcClaim[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushNpcClaim(state: GameState, claim: NpcClaim): void {
  const list = getNpcClaims(state);
  list.push(claim);
  state.flags.npc_claims = JSON.stringify(list.slice(-NPC_CLAIM_LOG_CAP));
}

/** Markers a realm holds on open tiles (not holds, not resource nodes). */
export function claimMarkers(state: GameState, realmId: string): number {
  return state.board.provinces.filter((p) => p.occupantRealmId === realmId && p.node === "none").length;
}

/**
 * Claim: plant a marker on an open tile (node "none", unoccupied). Never on a camp or a
 * resource node, so claims never block the player's gathering or camp raids. At most
 * NPC_CLAIM_CAP markers per realm. Returns the province, or null.
 */
export function maybeNpcClaim(state: GameState, realmId: string, atTick: number): Province | null {
  if (realmId === "player" || !livingSwitches(state).npcClaim) return null;
  if (!onCadence(realmId, atTick, NPC_CLAIM_PULSES)) return null;
  if (claimMarkers(state, realmId) >= NPC_CLAIM_CAP) return null;
  const open = state.board.provinces.filter((p) => p.node === "none" && !p.occupantRealmId);
  const tile = pickNpcTarget(state, realmId, open, atTick);
  if (!tile) return null;
  tile.occupantRealmId = realmId;
  pushNpcClaim(state, { realmId, provinceId: tile.id, tick: atTick });
  bumpCount(state, "living_npc_claims");
  pushWorldLog(state, "claim", `${nameOf(state, realmId)} plants a marker on ${tile.x},${tile.y}`);
  return tile;
}

// ---------------------------------------------------------------- camp marches

/** An NPC camp march: a column of `realmId` headed at a camp the player does not hold. */
function isNpcCampMarch(state: GameState, m: { realmId: string; kind: string; toId: string; purpose?: string }): boolean {
  if (m.realmId === "player" || m.kind !== "camp" || m.purpose) return false;
  const dest = state.board.provinces.find((p) => p.id === m.toId);
  return !!dest && dest.occupantRealmId !== "player";
}

/**
 * True when a column leaving `atTick` and travelling `dist` tiles would still be on the
 * road at the next home-raid pulse. An NPC has one column; a camp march must never take
 * the slot a home raid needs, so raid pressure stays as tuned.
 */
export function campMarchBlocksRaid(state: GameState, dist: number, atTick: number): boolean {
  if (atTick % NPC_RAID_PULSE_TICKS === 0) return true;
  const nextRaid = (Math.floor(atTick / NPC_RAID_PULSE_TICKS) + 1) * NPC_RAID_PULSE_TICKS;
  return atTick + travelTicks(state, Math.max(1, dist)) >= nextRaid;
}

/**
 * Camp march: ride on a free camp (node "camp", unoccupied) under the ring rule. Uses the
 * existing NPC column (tryNpcMarch) and camp resolution on arrival. Skipped when the
 * column would still be out at the next home-raid pulse. Returns the camp, or null.
 */
export function maybeNpcCampMarch(state: GameState, realmId: string, atTick: number): Province | null {
  if (realmId === "player" || !livingSwitches(state).npcCamp) return null;
  if (!onCadence(realmId, atTick, NPC_CAMP_PULSES)) return null;
  const headed = new Set(listMarches(state).filter((m) => m.realmId !== "player").map((m) => m.toId));
  const camps = state.board.provinces.filter((p) => p.node === "camp" && !p.occupantRealmId && !headed.has(p.id));
  const camp = pickNpcTarget(state, realmId, camps, atTick);
  if (!camp) return null;
  const hold = npcHold(state, realmId);
  if (!hold || campMarchBlocksRaid(state, manhattan(hold, camp), atTick)) return null;
  if (!tryNpcMarch(state, realmId, camp.id)) return null;
  bumpCount(state, "living_npc_camp_marches");
  pushWorldLog(state, "raid", `${nameOf(state, realmId)} rides on a camp at ${camp.x},${camp.y}`);
  return camp;
}

// ---------------------------------------------------------------- gathering

/**
 * Gather: send a foraging crew to a resource node with stock that no crew is working,
 * under the ring rule. Board-only: no world-log line (the snapshot shows it).
 */
export function maybeNpcGatherCrew(state: GameState, realmId: string, atTick: number): Province | null {
  if (realmId === "player" || !livingSwitches(state).npcGather) return null;
  if (!onCadence(realmId, atTick, NPC_GATHER_PULSES)) return null;
  if (listGathers(state).some((g) => g.realmId === realmId && g.phase !== "returning")) return null;
  const nodes = state.board.provinces.filter((p) => npcGatherable(state, realmId, p) && !nodeBusy(state, p.id));
  const node = pickNpcTarget(state, realmId, nodes, atTick);
  if (!node) return null;
  if (!tryNpcGather(state, realmId, node.id)) return null;
  bumpCount(state, "living_npc_gathers");
  return node;
}

// ---------------------------------------------------------------- snapshot

export type NpcBoardKind = "claim" | "camp" | "gather";
export const NPC_BOARD_KINDS: readonly NpcBoardKind[] = ["claim", "camp", "gather"];

export type NpcBoardPhase = "planted" | "marching" | "outbound" | "gathering" | "returning";

export interface NpcBoardActivity {
  /** Stable id: `claim_<realm>_<province>_<tick>`, the march id, or the gather id. */
  id: string;
  realmId: string;
  realmName: string;
  kind: NpcBoardKind;
  phase: NpcBoardPhase;
  /** Target tile (the claimed tile, the camp, or the node). */
  provinceId: string;
  x: number;
  y: number;
  /** Where the column or crew set out from; null for a claim. */
  fromId: string | null;
  sinceTick: number;
  /** Arrival for a march or travelling crew; show-until for a claim; null while a crew works. */
  untilTick: number | null;
}

export interface NpcBoardSnapshot {
  tick: number;
  activities: NpcBoardActivity[];
  counts: Record<NpcBoardKind, number>;
}

/**
 * What every NPC realm is doing on the board right now: fresh claims (for
 * NPC_CLAIM_SHOW_TICKS), camp marches on the road, and foraging crews. Pure read;
 * nothing here moves NPC or player state. Order: claims, camp marches, crews, each in
 * state order.
 */
export function npcBoardSnapshot(state: GameState): NpcBoardSnapshot {
  const now = state.meta.tick;
  const at = (id: string) => state.board.provinces.find((p) => p.id === id);
  const activities: NpcBoardActivity[] = [];
  for (const c of getNpcClaims(state)) {
    const p = at(c.provinceId);
    if (!p || p.occupantRealmId !== c.realmId || now - c.tick >= NPC_CLAIM_SHOW_TICKS || c.tick > now) continue;
    activities.push({
      id: `claim_${c.realmId}_${c.provinceId}_${c.tick}`,
      realmId: c.realmId,
      realmName: nameOf(state, c.realmId),
      kind: "claim",
      phase: "planted",
      provinceId: p.id,
      x: p.x,
      y: p.y,
      fromId: null,
      sinceTick: c.tick,
      untilTick: c.tick + NPC_CLAIM_SHOW_TICKS,
    });
  }
  for (const m of listMarches(state)) {
    if (!isNpcCampMarch(state, m)) continue;
    const p = at(m.toId)!;
    activities.push({
      id: m.id,
      realmId: m.realmId,
      realmName: nameOf(state, m.realmId),
      kind: "camp",
      phase: "marching",
      provinceId: p.id,
      x: p.x,
      y: p.y,
      fromId: m.fromId,
      sinceTick: Number(m.id.split("_").pop()) || now,
      untilTick: m.arrivesTick,
    });
  }
  for (const g of listGathers(state)) {
    if (g.realmId === "player") continue;
    const p = at(g.toId);
    if (!p) continue;
    activities.push({
      id: g.id,
      realmId: g.realmId,
      realmName: nameOf(state, g.realmId),
      kind: "gather",
      phase: g.phase,
      provinceId: p.id,
      x: p.x,
      y: p.y,
      fromId: g.fromId,
      sinceTick: g.phase === "gathering" ? g.gatherStartedTick : g.departedTick,
      untilTick: g.phase === "gathering" ? null : g.arrivesTick,
    });
  }
  const counts = { claim: 0, camp: 0, gather: 0 } as Record<NpcBoardKind, number>;
  for (const a of activities) counts[a.kind] += 1;
  return { tick: now, activities, counts };
}

/** Activities on one province (claim on it, column headed to it, crew working it). */
export function npcBoardActivityAt(state: GameState, provinceId: string): NpcBoardActivity[] {
  return npcBoardSnapshot(state).activities.filter((a) => a.provinceId === provinceId);
}
