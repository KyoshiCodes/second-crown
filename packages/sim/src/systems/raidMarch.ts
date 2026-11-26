import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { getProvince } from "./board.js";
import { listMarches, tryNpcMarch, type March } from "./march.js";
import { realmPower } from "./combat.js";
import { pushWorldLog } from "./events.js";
import { isShielded } from "./wave.js";
import { homeRaidGap, homeRaidPerType } from "./raidPressure.js";
import { HOME_RAID_COOLDOWN_TICKS, HOME_RAID_IN_FLIGHT, NPC_RAID_PULSE_TICKS } from "../content/livingRealm.js";
import { bumpCount, livingSwitches, nameOf } from "./livingRealm.js";

export function incomingOnHome(state: GameState): March[] {
  const home = state.board.homeProvinceId;
  return listMarches(state).filter((m) => m.realmId !== "player" && m.toId === home);
}

export function watchtowerWarning(state: GameState): March | undefined {
  if (countBuilding(state, "watchtower") < 1) return undefined;
  return incomingOnHome(state)[0];
}

/** No rival column on the hold before this tick (~5 game minutes). */
export const HOME_RAID_FIRST_TICK = 3000;
/** Base gap between home raids (walled stage). The live gap is `homeRaidGap` (content/raids.ts). */
export const HOME_RAID_GAP = 1500;

// ---------------------------------------------------------------- home-raid timing (living slice 4)

/**
 * The last home raid launched while `living_home_raid_cooldown` is on. A raid runs from the
 * tick its column leaves to its arrival tick (where march.ts resolves the siege); the hold
 * then rests HOME_RAID_COOLDOWN_TICKS. Kept in `flags.home_raid_json`. Timing only: raid
 * strength (homeRaidPerType) and the siege outcome are untouched.
 */
export interface HomeRaidRecord {
  realmId: string;
  marchId: string;
  sinceTick: number;
  /** Column arrival tick: the raid resolves here. */
  untilTick: number;
  /** No new home raid before this tick. */
  cooldownUntil: number;
}

const RAID_KEY = "home_raid_json";

export function getHomeRaid(state: GameState): HomeRaidRecord | null {
  const raw = state.flags[RAID_KEY];
  if (typeof raw !== "string" || !raw) return null;
  try {
    const r = JSON.parse(raw) as HomeRaidRecord;
    return r && typeof r.cooldownUntil === "number" ? r : null;
  } catch {
    return null;
  }
}

/** True when the timing rules (first tick, launch gap, in-flight limit, cooldown) let a raid start at `atTick`. */
export function homeRaidAllowed(state: GameState, atTick: number): boolean {
  if (atTick < HOME_RAID_FIRST_TICK) return false;
  const last = state.flags.home_raid_last;
  if (typeof last === "number" && atTick - last < homeRaidGap(state)) return false;
  if (!livingSwitches(state).homeRaidCooldown) return true;
  if (incomingOnHome(state).length >= HOME_RAID_IN_FLIGHT) return false;
  const rec = getHomeRaid(state);
  return !rec || atTick >= rec.cooldownUntil;
}

export function maybeNpcRaid(state: GameState, realmId: string, atTick: number): boolean {
  if (!homeRaidAllowed(state, atTick)) return false;
  if (isShielded(state)) return false;
  if (incomingOnHome(state).length > 0) return false;
  if (realmPower(state, realmId) < 8) return false;
  const home = state.board.homeProvinceId;
  if (!getProvince(state, home)) return false;
  const ok = tryNpcMarch(state, realmId, home, homeRaidPerType(state));
  if (!ok) return false;
  state.flags.home_raid_last = atTick;
  bumpCount(state, "living_home_raids");
  if (livingSwitches(state).homeRaidCooldown) {
    const march = listMarches(state).find((m) => m.realmId === realmId && m.toId === home);
    // The column is stamped from state.meta.tick; never let the raid "resolve" before it launched.
    const untilTick = Math.max(atTick, march?.arrivesTick ?? atTick);
    const rec: HomeRaidRecord = {
      realmId,
      marchId: march?.id ?? "",
      sinceTick: atTick,
      untilTick,
      cooldownUntil: untilTick + HOME_RAID_COOLDOWN_TICKS,
    };
    state.flags[RAID_KEY] = JSON.stringify(rec);
  }
  pushWorldLog(state, "raid", `${nameOf(state, realmId)} marches on your hold`);
  return true;
}

// ---------------------------------------------------------------- snapshot

export interface HomeRaidSnapshot {
  tick: number;
  /** False when `living_home_raid_cooldown` is off (only the old launch gap applies). */
  limited: boolean;
  /** The rival column on the road to the hold, or null. */
  inbound: { realmId: string; realmName: string; marchId: string; sinceTick: number; arrivesTick: number } | null;
  /** End of the post-raid cooldown, or null when none is running. */
  cooldownUntil: number | null;
  /**
   * Earliest raid pulse at which the timing rules allow a new home raid (first tick, launch gap,
   * cooldown), or null while a raid is inbound. A shield, a weak rival, or a busy column can
   * still delay it; this is timing only.
   */
  nextStartTick: number | null;
}

/** Read-only: is a home raid inbound, and when can the next one start. */
export function homeRaidSnapshot(state: GameState, atTick = state.meta.tick): HomeRaidSnapshot {
  const limited = livingSwitches(state).homeRaidCooldown;
  const m = incomingOnHome(state)[0];
  const rec = limited ? getHomeRaid(state) : null;
  const inbound = m
    ? {
        realmId: m.realmId,
        realmName: nameOf(state, m.realmId),
        marchId: m.id,
        sinceTick: rec && rec.marchId === m.id ? rec.sinceTick : Number(m.id.split("_").pop()) || atTick,
        arrivesTick: m.arrivesTick,
      }
    : null;
  const cooldownUntil = rec && atTick < rec.cooldownUntil ? rec.cooldownUntil : null;
  let nextStartTick: number | null = null;
  if (!inbound) {
    const last = state.flags.home_raid_last;
    let t = Math.max(atTick, HOME_RAID_FIRST_TICK, typeof last === "number" ? last + homeRaidGap(state) : 0, cooldownUntil ?? 0);
    t = Math.ceil(t / NPC_RAID_PULSE_TICKS) * NPC_RAID_PULSE_TICKS;
    nextStartTick = t;
  }
  return { tick: atTick, limited, inbound, cooldownUntil, nextStartTick };
}
