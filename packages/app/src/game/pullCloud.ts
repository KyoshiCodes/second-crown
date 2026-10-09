import { deserializeState } from "@second-crown/sim";
import { pullSave } from "../net/cloud";
import {
  clearPulledFromIndexedDb,
  loadFromIndexedDb,
  loadPulledFromIndexedDb,
  saveToIndexedDb,
  savePulledToIndexedDb,
} from "../save/indexedDb";

export type PullDeps = {
  pullServerSave: () => Promise<string>;
  writePulled: (raw: string) => Promise<void>;
};

const defaultPullDeps: PullDeps = { pullServerSave: () => pullSave(), writePulled: savePulledToIndexedDb };

/**
 * Pull save. Fetches the cloud copy and parks it in its own slot until the next reload.
 * The crown on screen keeps running and keeps writing its autosave; neither is touched here.
 * A failed fetch, or a copy that does not parse, writes nothing and throws.
 */
export async function pullCloudCopy(deps: PullDeps = defaultPullDeps): Promise<void> {
  const raw = await deps.pullServerSave();
  deserializeState(raw);
  await deps.writePulled(raw);
}

export type StartDeps = {
  readPulled: () => Promise<string | null>;
  clearPulled: () => Promise<void>;
  readLocal: () => Promise<string | null>;
  writeLocal: (raw: string) => Promise<void>;
};

const defaultStartDeps: StartDeps = {
  readPulled: loadPulledFromIndexedDb,
  clearPulled: clearPulledFromIndexedDb,
  readLocal: loadFromIndexedDb,
  writeLocal: saveToIndexedDb,
};

/**
 * The save a page load starts from. A pulled cloud copy wins once: it becomes the local
 * save, then its slot is cleared. Otherwise the local save, as before.
 */
export async function startSave(deps: StartDeps = defaultStartDeps): Promise<string | null> {
  let pulled: string | null = null;
  try {
    pulled = await deps.readPulled();
  } catch {
    /* no pulled slot readable: the local save, as before */
  }
  if (pulled === null) return deps.readLocal();
  await deps.writeLocal(pulled);
  try {
    await deps.clearPulled();
  } catch {
    /* the next reload loads the same copy again */
  }
  return pulled;
}
