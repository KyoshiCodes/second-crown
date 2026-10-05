import type { GameState } from "@second-crown/shared";

// Shared hold (docs/REALTIME.md Phase 3): the one intent the server applies so far.
// A stamp changes nothing but the input log, so it proves two readers see one realm.

export type Stamp = { tick: number; by: string };

const ISSUER_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** Record a stamp by `by` at the current tick. Bad issuer ids are refused. */
export function tryStamp(state: GameState, by: string): boolean {
  if (typeof by !== "string" || !ISSUER_RE.test(by)) return false;
  state.inputLog.push({ tick: state.meta.tick, type: "stamp", issuerId: by, payload: {} });
  return true;
}

/** Every stamp in the input log, oldest first. */
export function listStamps(state: GameState): Stamp[] {
  return state.inputLog
    .filter((rec) => rec.type === "stamp" && typeof rec.issuerId === "string")
    .map((rec) => ({ tick: rec.tick, by: rec.issuerId as string }));
}
