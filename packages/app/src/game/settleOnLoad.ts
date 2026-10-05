import { applyOfflineProgress, type GameState } from "@second-crown/sim";
import { fetchRealmTick } from "../net/realmClock";
import { readHold, type HoldView } from "../net/hold";

/**
 * The realm id when this realm is shared, else null. No realm is shared yet
 * (docs/REALTIME.md Phases 1-3), so every load takes the solo path and joins no hold.
 */
export function sharedRealmId(_state: GameState): string | null {
  return null;
}

export type SettleDeps = {
  sharedRealmId: (state: GameState) => string | null;
  applyOfflineProgress: (state: GameState) => number;
  fetchRealmTick: (realmId: string) => Promise<number>;
  joinHold: (realmId: string) => Promise<HoldView>;
};

const defaultDeps: SettleDeps = { sharedRealmId, applyOfflineProgress, fetchRealmTick, joinHold: readHold };

export type Settled =
  | { mode: "solo"; settled: number }
  | { mode: "shared"; realmId: string; serverTick: number | null; hold: HoldView | null };

/**
 * Solo: offline catch-up, as before, and never a hold. Shared: read the server's
 * tick count, join the shared hold (Phase 3), and do not fast-forward. A failed
 * read gives null rather than throwing, so the load path never falls through to a
 * fresh realm.
 */
export async function settleOnLoad(state: GameState, deps: SettleDeps = defaultDeps): Promise<Settled> {
  const realmId = deps.sharedRealmId(state);
  if (realmId === null) return { mode: "solo", settled: deps.applyOfflineProgress(state) };
  let serverTick: number | null = null;
  try {
    serverTick = await deps.fetchRealmTick(realmId);
  } catch {
    /* server unreachable: leave the realm as saved */
  }
  let hold: HoldView | null = null;
  try {
    hold = await deps.joinHold(realmId);
  } catch {
    /* no hold reachable: the realm stays as saved */
  }
  return { mode: "shared", realmId, serverTick, hold };
}
