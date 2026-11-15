import type { HoldView } from "../net/hold";

/**
 * The joined hold's latest view, shared with read-only lines outside the Join hold card
 * (StampsStatusLine on the Kingdom tab and the inspect card).
 *
 * In memory only. JoinHoldCard publishes the view the server sent and publishes null when the
 * player leaves or the card unmounts. The hold key is never stored here, and nothing here is
 * written to the local save or sent anywhere.
 */
let current: HoldView | null = null;
const listeners = new Set<() => void>();

/** Called by JoinHoldCard whenever its view changes. Null means no hold is joined. */
export function publishHoldView(view: HoldView | null): void {
  if (current === view) return;
  current = view;
  for (const listener of listeners) listener();
}

/** Stable snapshot for React.useSyncExternalStore. */
export function getHoldViewSnapshot(): HoldView | null {
  return current;
}

export function subscribeHoldView(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
