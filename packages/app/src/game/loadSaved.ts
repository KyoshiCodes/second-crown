import { deserializeState, type GameState } from "@second-crown/sim";
import { pullSave } from "../net/cloud";
import { saveToIndexedDb } from "../save/indexedDb";
import { sharedRealmId } from "./settleOnLoad";

export type LoadDeps = {
  sharedRealmId: (state: GameState) => string | null;
  pullServerSave: (realmId: string) => Promise<string>;
  writeCache: (raw: string) => Promise<void>;
};

// Phase 2 keeps a shared realm in its owner's cloud save, so the realm id is not sent yet.
const defaultDeps: LoadDeps = { sharedRealmId, pullServerSave: () => pullSave(), writeCache: saveToIndexedDb };

export type Loaded = { state: GameState; source: "local" | "server" | "cache" };

/**
 * docs/REALTIME.md Phase 2. Solo: the local save, untouched. Shared: the server save is the
 * source of truth, so a reload reads it and overwrites the browser cache with it. If the server
 * cannot be reached the cache is shown; the server refuses any push from it.
 */
export async function loadSaved(local: GameState, deps: LoadDeps = defaultDeps): Promise<Loaded> {
  const realmId = deps.sharedRealmId(local);
  if (realmId === null) return { state: local, source: "local" };
  let raw: string;
  let state: GameState;
  try {
    raw = await deps.pullServerSave(realmId);
    state = deserializeState(raw);
  } catch {
    return { state: local, source: "cache" };
  }
  try {
    await deps.writeCache(raw);
  } catch {
    /* the next reload reads the server again */
  }
  return { state, source: "server" };
}
