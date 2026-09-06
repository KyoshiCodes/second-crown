import type { GameState } from "@second-crown/shared";
import { SAVE_VERSION } from "@second-crown/shared";

/** Serialize GameState to a plain JSON-safe object (already is, but centralize). */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

/** Parse a save string into GameState. Applies migrations if needed later. */
export function deserializeState(json: string): GameState {
  const raw = JSON.parse(json) as GameState;
  if (typeof raw?.meta?.version !== "number") {
    throw new Error("Invalid save: missing meta.version");
  }
  // Future: while (raw.meta.version < SAVE_VERSION) migrate...
  if (raw.meta.version !== SAVE_VERSION) {
    // For now only v0 exists
    if (raw.meta.version > SAVE_VERSION) {
      throw new Error(`Save version ${raw.meta.version} is newer than supported ${SAVE_VERSION}`);
    }
  }
  return raw;
}
