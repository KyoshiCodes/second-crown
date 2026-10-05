// Opt-in shared hold (docs/REALTIME.md, after Phase 3). A player types a short realm id and joins.
// The first join of an id makes the hold and hands back a random hold key, once. Every later join,
// read, and intent on that id must send the key (wave/realtime-key). With a hold store the hold and
// the key's hash are kept on disk: after a restart, the same key opens the same hold.
// It never marks a solo save shared and never takes a client state.

import crypto from "node:crypto";
import { createHolds, HoldError, MAX_HOLDS } from "./hold.mjs";

export const JOIN_PREFIX = "join-";
export const JOIN_CODE_RE = /^[a-z0-9-]{1,24}$/;
export const JOIN_ONLY = "Send a realm id to join, not a state.";
// One answer for a missing key, a wrong key, and a hold that does not exist, so a guess learns nothing.
export const BAD_KEY = "Wrong or missing hold key.";
export const TOO_MANY_TRIES = "Too many wrong hold keys. Ask your friend for the key and try later.";
// Wrong or missing keys one session may send before every key try from it is refused.
export const MAX_KEY_TRIES = 5;
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** A new random hold key: 96 bits, 16 URL-safe characters. */
export function newHoldKey() {
  return crypto.randomBytes(12).toString("base64url");
}

/** What is kept for a key. The key itself is never written. */
export function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function keyMatches(key, hash) {
  if (typeof key !== "string" || !KEY_RE.test(key) || typeof hash !== "string") return false;
  const a = Buffer.from(hashKey(key), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

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
 * session: who is asking (the account id). Wrong key tries are counted per session.
 */
export function createJoinableHolds({ clocks, isShared = () => false, loadSim, store, now, maxJoins = MAX_HOLDS, maxKeyTries = MAX_KEY_TRIES, newKey = newHoldKey }) {
  const joined = new Set();
  const keys = new Map(); // realm id -> key hash, set the moment a first join claims the id
  const fails = new Map(); // session -> wrong or missing keys sent
  const holds = createHolds({
    clocks,
    isShared: (id) => isShared(id) === true || joined.has(id),
    ...(loadSim ? { loadSim } : {}),
    ...(store ? { store } : {}),
    ...(now ? { now } : {}),
  });

  function sessionOf(session) {
    if (typeof session !== "string" || session === "") throw new HoldError(401, "unauthorized");
    if ((fails.get(session) ?? 0) >= maxKeyTries) throw new HoldError(429, TOO_MANY_TRIES);
    return session;
  }

  function refuse(session) {
    fails.set(session, (fails.get(session) ?? 0) + 1);
    throw new HoldError(403, BAD_KEY);
  }

  // A string when the hold has a key, null for a hold kept before keys, undefined for no hold.
  function keyHashOf(realmId) {
    return keys.get(realmId) ?? holds.keyHashOf(realmId);
  }

  function markJoined(realmId) {
    if (joined.has(realmId)) return false;
    if (joined.size >= maxJoins) throw new HoldError(503, "Too many holds.");
    joined.add(realmId);
    return true;
  }

  // Open a joined hold with its key. Nothing is loaded or made unless the key is right.
  function unlock(realmId, key, session) {
    const hash = keyHashOf(realmId);
    if (!keyMatches(key, hash)) refuse(session);
    keys.set(realmId, hash);
    markJoined(realmId);
  }

  const isJoinId = (realmId) => typeof realmId === "string" && realmId.startsWith(JOIN_PREFIX);

  return {
    holds,
    /**
     * Join a realm by typed code. With no key: the first join makes the hold and returns
     * { ...view, key } once; a hold that has a key is refused. With a key: the view, if the key is right.
     */
    async join(body, key, session) {
      const realmId = parseJoin(body);
      const who = sessionOf(session);
      if (key !== undefined && key !== null && key !== "") {
        unlock(realmId, key, who);
        return holds.read(realmId);
      }
      if (typeof keyHashOf(realmId) === "string") refuse(who);
      const fresh = markJoined(realmId);
      const made = newKey();
      const hash = hashKey(made);
      keys.set(realmId, hash); // set before any await, so a second keyless join is refused
      try {
        return { ...(await holds.claim(realmId, hash)), key: made };
      } catch (e) {
        keys.delete(realmId);
        if (fresh) joined.delete(realmId);
        throw e;
      }
    },
    /** Read a hold. A joined id needs its key; an owner-marked realm reads as before. null when not shared. */
    async read(realmId, key, session) {
      if (!isJoinId(realmId)) return holds.read(realmId);
      unlock(realmId, key, sessionOf(session));
      return holds.read(realmId);
    },
    /** One intent. A joined id needs its key, checked before anything is spent. null when not shared. */
    async intent(realmId, by, body, key, session) {
      if (!isJoinId(realmId)) return holds.intent(realmId, by, body);
      unlock(realmId, key, sessionOf(session));
      return holds.intent(realmId, by, body);
    },
    isJoined: (realmId) => joined.has(realmId),
  };
}
