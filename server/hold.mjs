// Shared hold (docs/REALTIME.md Phase 3, ADR-011, INVARIANTS 17). Memory only: a restart forgets it.
// The server runs packages/sim here and nowhere else, and only for a realm marked shared.
// No game rule lives in this file: every change to the realm is a call into the sim.
// It never reads or writes a solo save and never takes a client state as the realm.

import { fileURLToPath } from "node:url";
import { REALM_ID_RE } from "./realmclock.mjs";

export const MAX_HOLDS = 100;
export const MAX_PENDING = 64;
export const INTENT_ONLY = "Send one intent, not a state.";
export const CANNOT_TRAIN = "The hold cannot afford a militia, or its training queue is full.";
export const STORES = ["food", "wood", "stone", "gold"];
const INTENT_TYPES = new Set(["stamp", "train"]);

export class HoldError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Load packages/sim as-is through Vite. Called only when a shared hold is first touched. */
export async function loadSimFromSource() {
  const { runnerImport } = await import("vite");
  const entry = fileURLToPath(new URL("../packages/sim/src/index.ts", import.meta.url));
  const { module } = await runnerImport(entry, { configFile: false, logLevel: "silent" });
  return module;
}

/** Same realm id, same seed. FNV-1a, 32 bit. */
export function seedForRealm(realmId) {
  let h = 0x811c9dc5;
  for (let i = 0; i < realmId.length; i++) {
    h ^= realmId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * The only intent shapes accepted: exactly { type: "stamp" } or { type: "train" } (one militia).
 * Anything else, a save included, is refused.
 */
export function parseIntent(body) {
  const ok = body !== null && typeof body === "object" && !Array.isArray(body)
    && Object.keys(body).length === 1 && INTENT_TYPES.has(body.type);
  if (!ok) throw new HoldError(400, INTENT_ONLY);
  return { type: body.type };
}

/**
 * clocks: the Phase 1 realm clocks (createRealmClocks), so the hold and GET /realm/:id/tick agree.
 * isShared(realmId): true only for a realm the owner marked shared. None is today.
 * loadSim(): resolves to the packages/sim module.
 */
export function createHolds({ clocks, isShared, loadSim = loadSimFromSource }) {
  const holds = new Map();
  let simPromise = null;

  function sharedId(realmId) {
    return typeof realmId === "string" && REALM_ID_RE.test(realmId) && isShared(realmId) === true;
  }

  async function holdFor(realmId) {
    let hold = holds.get(realmId);
    if (hold) return hold;
    if (holds.size >= MAX_HOLDS) throw new HoldError(503, "Too many holds.");
    simPromise ??= Promise.resolve().then(loadSim).catch((e) => { simPromise = null; throw e; });
    const sim = await simPromise;
    hold = holds.get(realmId); // another reader may have made it while the sim loaded
    if (hold) return hold;
    // The same new game a solo player starts with, but fresh: never a client's save.
    const state = sim.createGameState({ seed: seedForRealm(realmId), now: 0, withStarterBuildings: true });
    hold = { sim, state, engine: new sim.TickEngine(state), pending: [] };
    holds.set(realmId, hold);
    return hold;
  }

  // Bring the hold up to the clock. Pending intents go in at the first tick boundary crossed.
  function advance(hold, target) {
    const { sim, state, engine } = hold;
    if (target <= state.meta.tick) return;
    if (hold.pending.length > 0) {
      engine.settleTicks(1);
      for (const intent of hold.pending) sim.tryStamp(state, intent.by);
      hold.pending = [];
    }
    engine.settleTicks(target - state.meta.tick);
  }

  // Read-only: what the sim already holds. Counts are summed, nothing is computed from rules.
  function view(realmId, hold) {
    const { sim, state } = hold;
    const stores = {};
    for (const res of STORES) stores[res] = state.resources[res] ?? "0";
    const militia = state.units
      .filter((u) => u.realmId === "player" && u.typeId === "militia")
      .reduce((n, u) => n + Number(u.count), 0);
    const training = sim.listTraining(state, "player")
      .filter((j) => j.typeId === "militia")
      .reduce((n, j) => n + j.count, 0);
    return {
      realmId,
      tick: state.meta.tick,
      stores,
      militia,
      training,
      stamps: sim.listStamps(state),
      pending: hold.pending.length,
    };
  }

  async function sync(realmId) {
    const hold = await holdFor(realmId);
    const tick = clocks.tick(realmId);
    if (tick === null) throw new HoldError(503, "No clock for this realm.");
    advance(hold, tick);
    return hold;
  }

  return {
    /** What every reader of a shared realm sees. null when the realm is not shared. */
    async read(realmId) {
      if (!sharedId(realmId)) return null;
      return view(realmId, await sync(realmId));
    },
    /**
     * One intent from `by`. A stamp is queued and lands on the next tick boundary. A train goes
     * through the sim's tryTrain at the settled tick, so a hold that cannot pay is refused at once.
     * null when the realm is not shared.
     */
    async intent(realmId, by, body) {
      if (!sharedId(realmId)) return null;
      const intent = parseIntent(body);
      if (typeof by !== "string" || !REALM_ID_RE.test(by)) throw new HoldError(400, "Bad issuer.");
      const hold = await sync(realmId);
      if (intent.type === "train") {
        if (!hold.sim.tryTrain(hold.state, { typeId: "militia", count: 1 })) throw new HoldError(409, CANNOT_TRAIN);
        return view(realmId, hold);
      }
      if (hold.pending.length >= MAX_PENDING) throw new HoldError(429, "Too many intents this tick.");
      hold.pending.push({ ...intent, by });
      return view(realmId, hold);
    },
    get size() {
      return holds.size;
    },
  };
}
