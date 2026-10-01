import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { getProvince } from "./board.js";
import { listMarches, tryNpcMarch, type March } from "./march.js";
import { realmPower } from "./combat.js";
import { pushWorldLog } from "./events.js";
import { isShielded } from "./wave.js";

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
/** At most one home raid per this many ticks, across all rivals. */
export const HOME_RAID_GAP = 1500;

export function homeRaidAllowed(state: GameState, atTick: number): boolean {
  if (atTick < HOME_RAID_FIRST_TICK) return false;
  const last = state.flags.home_raid_last;
  return typeof last !== "number" || atTick - last >= HOME_RAID_GAP;
}

export function maybeNpcRaid(state: GameState, realmId: string, atTick: number): boolean {
  if (!homeRaidAllowed(state, atTick)) return false;
  if (isShielded(state)) return false;
  if (incomingOnHome(state).length > 0) return false;
  if (realmPower(state, realmId) < 8) return false;
  const home = state.board.homeProvinceId;
  if (!getProvince(state, home)) return false;
  const ok = tryNpcMarch(state, realmId, home);
  if (!ok) return false;
  state.flags.home_raid_last = atTick;
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "raid", `${name} marches on your hold`);
  return true;
}
