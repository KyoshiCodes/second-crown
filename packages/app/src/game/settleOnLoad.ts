import { applyOfflineProgress, type GameState } from "@second-crown/sim";
import { fetchRealmTick } from "../net/realmClock";

/**
 * The realm id when this realm is shared, else null. No realm is shared yet
 * (docs/REALTIME.md Phase 1), so every load takes the solo path.
 */
export function sharedRealmId(_state: GameState): string | null {
  return null;
}

export type SettleDeps = {
  sharedRealmId: (state: GameState) => string | null;
  applyOfflineProgress: (state: GameState) => number;
  fetchRealmTick: (realmId: string) => Promise<number>;
};

const defaultDeps: SettleDeps = { sharedRealmId, applyOfflineProgress, fetchRealmTick };

export type Settled =
  | { mode: "solo"; settled: number }
  | { mode: "shared"; realmId: string; serverTick: number | null };

/**
 * Solo: offline catch-up, as before. Shared: read the server's tick count and
 * do not fast-forward. Phase 1 only reads the count; it does not apply it.
 * A failed read gives serverTick null rather than throwing, so the load path
 * never falls through to a fresh realm.
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
  return { mode: "shared", realmId, serverTick };
}
