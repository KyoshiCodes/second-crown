// Opt-in shared hold (docs/REALTIME.md, after Phase 3). A player types a short realm id and joins.
// Everyone who types the same id reads the same hold from hold.mjs. With a hold store the hold is
// kept on disk: after a restart, the next join on that id loads it. It never marks a solo save
// shared and never takes a client state.

import { createHolds, HoldError, MAX_HOLDS } from "./hold.mjs";

export const JOIN_PREFIX = "join-";
export const JOIN_CODE_RE = /^[a-z0-9-]{1,24}$/;
export const JOIN_ONLY = "Send a realm id to join, not a state.";

/** The hold realm id for a typed code, or null for a blank or bad code. Case and spaces at the ends do not matter. */
export function joinRealmId(code) {
  if (typeof code !== "string") return null;
  const clean = code.trim().toLowerCase();
  return JOIN_CODE_RE.test(clean) ? JOIN_PREFIX + clean : null;
}

/** The only join body accepted: exactly { realm: "<code>" }. Anything else, a save included, is refused. */
export function parseJoin(body) {
  const ok = body !== null && typeof body === "object" && !Array.isArray(body)
    && Object.keys(body).length === 1 && typeof body.realm === "string";
  if (!ok) throw new HoldError(400, JOIN_ONLY);
  const realmId = joinRealmId(body.realm);
  if (realmId === null) throw new HoldError(400, "Type a realm id: letters, numbers, dashes, up to 24.");
  return realmId;
}

/**
 * The hold table plus opt-in joins. isShared: the owner-marked realms (none today).
 * A joined realm id always starts with JOIN_PREFIX, so a join never names an owner-marked realm.
 */
export function createJoinableHolds({ clocks, isShared = () => false, loadSim, store, now, maxJoins = MAX_HOLDS }) {
  const joined = new Set();
  const holds = createHolds({
    clocks,
    isShared: (id) => isShared(id) === true || joined.has(id),
    ...(loadSim ? { loadSim } : {}),
    ...(store ? { store } : {}),
    ...(now ? { now } : {}),
  });
  return {
    holds,
    /** Join a realm by typed code and return the hold view every joiner sees. */
    async join(body) {
      const realmId = parseJoin(body);
      const fresh = !joined.has(realmId);
      if (fresh && joined.size >= maxJoins) throw new HoldError(503, "Too many holds.");
      joined.add(realmId);
      try {
        return await holds.read(realmId);
      } catch (e) {
        if (fresh) joined.delete(realmId);
        throw e;
      }
    },
    isJoined: (realmId) => joined.has(realmId),
  };
}
