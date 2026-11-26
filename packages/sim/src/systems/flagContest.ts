import type { GameState } from "@second-crown/shared";
import { FLAG_CONTEST_COLUMNS_PER_FLAG, FLAG_CONTEST_COOLDOWN_TICKS } from "../content/livingRealm.js";
import { getProvince } from "./board.js";
import { listMarches } from "./march.js";
import { bumpCount, livingSwitches, nameOf } from "./livingRealm.js";

/**
 * Flag contest timing (Living Realm slice 3). Decides only WHO may start a contest on a
 * player flag and WHEN; the fight itself is unchanged (march.ts resolveOutpostAssault).
 *
 * Rule: at most FLAG_CONTEST_COLUMNS_PER_FLAG (1) contesting column per flag. A contest runs
 * from the tick its column leaves to the column's arrival tick; the flag then rests for
 * FLAG_CONTEST_COOLDOWN_TICKS (500 = 50 s) before any realm may contest it again.
 * Records live in `flags.flag_contests_json`; flag `living_flag_cooldown: false` turns the
 * limit off (every realm may contest every pulse, as before).
 */

export interface FlagContestRecord {
  provinceId: string;
  realmId: string;
  marchId: string;
  /** Tick the column left. */
  sinceTick: number;
  /** Column arrival tick: the contest ends here. */
  untilTick: number;
  /** No new contest on this flag before this tick. */
  cooldownUntil: number;
}

const KEY = "flag_contests_json";

export function getFlagContests(state: GameState): FlagContestRecord[] {
  const raw = state.flags[KEY];
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as FlagContestRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFlagContests(state: GameState, list: FlagContestRecord[]): void {
  if (list.length) state.flags[KEY] = JSON.stringify(list);
  else delete state.flags[KEY];
}

/** Drop records whose cooldown has run out. */
export function pruneFlagContests(state: GameState, atTick: number): void {
  const list = getFlagContests(state);
  const kept = list.filter((r) => atTick < r.cooldownUntil);
  if (kept.length !== list.length) saveFlagContests(state, kept);
}

/** Contesting columns still on the road to `provinceId` at `atTick`. */
function liveContests(state: GameState, provinceId: string, atTick: number): FlagContestRecord[] {
  const marchIds = new Set(listMarches(state).map((m) => m.id));
  return getFlagContests(state).filter(
    (r) => r.provinceId === provinceId && atTick < r.untilTick && marchIds.has(r.marchId)
  );
}

/**
 * True when a new contest may start on `provinceId` at `atTick`: the limit is off, or the flag
 * has fewer than FLAG_CONTEST_COLUMNS_PER_FLAG live columns and no cooldown running.
 */
export function flagContestOpen(state: GameState, provinceId: string, atTick: number): boolean {
  if (!livingSwitches(state).flagCooldown) return true;
  if (liveContests(state, provinceId, atTick).length >= FLAG_CONTEST_COLUMNS_PER_FLAG) return false;
  return !getFlagContests(state).some((r) => r.provinceId === provinceId && atTick < r.cooldownUntil);
}

/**
 * Record a contest that just launched. `marchId` is the column tryNpcMarch queued.
 * Always bumps the playtest counter; records only while the limit is on.
 */
export function noteFlagContest(state: GameState, provinceId: string, realmId: string, atTick: number): void {
  bumpCount(state, "living_flag_contests");
  if (!livingSwitches(state).flagCooldown) return;
  const march = listMarches(state).find((m) => m.realmId === realmId && m.toId === provinceId);
  const untilTick = march?.arrivesTick ?? atTick;
  const list = getFlagContests(state);
  list.push({
    provinceId,
    realmId,
    marchId: march?.id ?? "",
    sinceTick: atTick,
    untilTick,
    cooldownUntil: untilTick + FLAG_CONTEST_COOLDOWN_TICKS,
  });
  saveFlagContests(state, list);
}

// ---------------------------------------------------------------- snapshot

export interface FlagContestEntry {
  provinceId: string;
  x: number;
  y: number;
  realmId: string;
  realmName: string;
  marchId: string;
  sinceTick: number;
  /** Column arrival tick. */
  untilTick: number;
}

export interface FlagCooldownEntry {
  provinceId: string;
  x: number;
  y: number;
  /** No new contest before this tick. */
  untilTick: number;
}

export interface FlagContestSnapshot {
  tick: number;
  /** False when `living_flag_cooldown` is off (no records kept). */
  limited: boolean;
  /** Flags with a contesting column on the road. */
  contests: FlagContestEntry[];
  /** Flags resting after a contest (column arrived, cooldown running). */
  cooldowns: FlagCooldownEntry[];
}

/** Read-only board snapshot: which flags are under contest, by whom, and which are resting. */
export function flagContestSnapshot(state: GameState, atTick = state.meta.tick): FlagContestSnapshot {
  const limited = livingSwitches(state).flagCooldown;
  const marchIds = new Set(listMarches(state).map((m) => m.id));
  const contests: FlagContestEntry[] = [];
  const cooldowns: FlagCooldownEntry[] = [];
  for (const r of getFlagContests(state)) {
    const p = getProvince(state, r.provinceId);
    const x = p?.x ?? -1;
    const y = p?.y ?? -1;
    if (atTick < r.untilTick && marchIds.has(r.marchId)) {
      contests.push({ provinceId: r.provinceId, x, y, realmId: r.realmId, realmName: nameOf(state, r.realmId), marchId: r.marchId, sinceTick: r.sinceTick, untilTick: r.untilTick });
    } else if (atTick < r.cooldownUntil) {
      cooldowns.push({ provinceId: r.provinceId, x, y, untilTick: r.cooldownUntil });
    }
  }
  return { tick: atTick, limited, contests, cooldowns };
}
