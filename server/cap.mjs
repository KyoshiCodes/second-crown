// Per-address caps (wave/realtime-cap). Memory only: a restart forgets the counts.
// One stranger cannot fill the joined-hold table or users.json by making guests or holds in a loop.
// It never reads or writes a save and never runs the sim.

export const DAY_MS = 24 * 60 * 60 * 1000;
// New guest accounts one address may make per day.
export const MAX_GUESTS_PER_ADDRESS = 10;
// New holds (a first join of an id nobody has used) one address may make per day.
export const MAX_NEW_HOLDS_PER_ADDRESS = 3;
// Addresses tracked at once. When full and none has expired, a new address is refused, not let through.
export const MAX_ADDRESSES = 10_000;

export const GUEST_CAP = "Too many new guest accounts from this address today. Use the token you already have.";
export const HOLD_CAP = "Too many new holds from this address today. Join a hold you already have, or try tomorrow.";

/** A fixed-window counter per address: at most `max` takes per `windowMs`. */
export function createAddressCap({ max, windowMs = DAY_MS, maxAddresses = MAX_ADDRESSES, now = Date.now }) {
  const seen = new Map(); // address -> { start, n }

  function prune(at) {
    for (const [addr, rec] of seen) if (at - rec.start >= windowMs) seen.delete(addr);
  }

  return {
    /** Count one create for this address. false, and nothing counted, when it is over the cap. */
    take(address) {
      const addr = typeof address === "string" ? address : "";
      const at = now();
      let rec = seen.get(addr);
      if (rec && at - rec.start >= windowMs) rec = undefined;
      if (!rec) {
        if (seen.size >= maxAddresses) prune(at);
        if (seen.size >= maxAddresses) return false;
        rec = { start: at, n: 0 };
        seen.set(addr, rec);
      }
      if (rec.n >= max) return false;
      rec.n++;
      return true;
    },
    get size() {
      return seen.size;
    },
  };
}
