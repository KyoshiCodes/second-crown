// Shared hold (docs/REALTIME.md Phase 3, ADR-011, INVARIANTS 17). Kept in memory, and written
// through a hold store (keep.mjs) when one is given, so it survives a restart.
// The server runs packages/sim here and nowhere else, and only for a realm marked shared.
// No game rule lives in this file: every change to the realm is a call into the sim.
// It never reads or writes a solo save and never takes a client state as the realm.

import { fileURLToPath } from "node:url";
import { REALM_ID_RE } from "./realmclock.mjs";
import { downTicks } from "./keep.mjs";

export const MAX_HOLDS = 100;
export const MAX_PENDING = 64;
export const INTENT_ONLY = "Send one intent, not a state.";
export const CANNOT_TRAIN = "The hold cannot afford a militia, or its training queue is full.";
export const CANNOT_BUILD = "The hold cannot afford a farm.";
export const NO_TILE = "The hold has no free tile for a farm: no open plot, or no free work plot (a cottage or keep adds plots).";
export const CANNOT_COTTAGE = "The hold cannot afford a cottage.";
export const NO_COTTAGE_TILE = "The hold has no open plot for a cottage.";
export const CANNOT_LUMBER = "The hold cannot afford a lumber camp.";
export const NO_LUMBER_TILE = "The hold has no free tile for a lumber camp: no open plot, or no free work plot (a cottage or keep adds plots).";
export const STORES = ["food", "wood", "stone", "gold"];
const INTENT_TYPES = new Set(["stamp", "train", "build", "cottage", "lumber"]);
// Build intents: the sim building each places, and the reasons for a refusal. Cost and plot rules stay in the sim.
const BUILDS = {
  build: ["farm", NO_TILE, CANNOT_BUILD],
  cottage: ["cottage", NO_COTTAGE_TILE, CANNOT_COTTAGE],
  lumber: ["lumber_camp", NO_LUMBER_TILE, CANNOT_LUMBER],
};
// Scan range for a free tile. Only a bound on the loop: the sim's canPlaceType says which tiles
// are inside the hold and open, so the grid size is not copied here.
const TILE_SCAN = 64;
// Ticks that only settled are written at most this often. An intent is written at once. Losing the
// last few settled ticks costs nothing: on load the clock counts them again from savedAt.
export const SETTLE_SAVE_MS = 5000;
// A hold nobody has read or sent an intent to for this long may be dropped from memory when the table
// is full. Its kept file stays, and the same key opens it again.
export const HOLD_IDLE_MS = 15 * 60 * 1000;
export const FULL = "The server is full. New holds are paused; a hold you already have still opens.";
export const NOT_SAVED = "The hold could not be saved. Nothing was spent; try again.";

export class HoldError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/**
 * Load packages/sim as-is through Vite. Called only when a shared hold is first touched.
 * Uses runnerImport when the installed Vite has it; otherwise a short-lived middleware-mode
 * server and ssrLoadModule, which every Vite since 3 has. `vite` is injectable for tests.
 */
export async function loadSimFromSource(vite = null) {
  const v = vite ?? await import("vite");
  const entry = fileURLToPath(new URL("../packages/sim/src/index.ts", import.meta.url));
  if (typeof v.runnerImport === "function") {
    const { module } = await v.runnerImport(entry, { configFile: false, logLevel: "silent" });
    return module;
  }
  const server = await v.createServer({
    configFile: false,
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  try {
    return await server.ssrLoadModule(entry);
  } finally {
    await server.close();
  }
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
 * The only intent shapes accepted: exactly { type: "stamp" }, { type: "train" } (one militia),
 * { type: "build" } (one farm), { type: "cottage" } (one cottage), or { type: "lumber" } (one lumber
 * camp). No tile, type, or count is taken from the client.
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
 * store: optional hold store (keep.mjs createHoldStore). Without one, a restart forgets every hold.
 * now(): wall clock in ms, the same one the realm clocks use.
 * maxHolds: holds in memory at once. idleMs: how long unused before a hold may be dropped from memory.
 * onDrop(realmId): told when a hold is dropped from memory.
 */
export function createHolds({ clocks, isShared, loadSim = loadSimFromSource, store = null, now = Date.now, maxHolds = MAX_HOLDS, idleMs = HOLD_IDLE_MS, onDrop = () => {} }) {
  const holds = new Map();
  let simPromise = null;

  function sharedId(realmId) {
    return typeof realmId === "string" && REALM_ID_RE.test(realmId) && isShared(realmId) === true;
  }

  async function holdFor(realmId) {
    let hold = holds.get(realmId);
    if (hold) return touch(hold);
    if (holds.size >= maxHolds && dropIdle() === null) throw new HoldError(503, FULL);
    simPromise ??= Promise.resolve().then(loadSim).catch((e) => { simPromise = null; throw e; });
    const sim = await simPromise;
    hold = holds.get(realmId); // another reader may have made it while the sim loaded
    if (hold) return touch(hold);
    const kept = store ? store.load(realmId) : null;
    if (kept) {
      // This id's own kept hold, written by this server. The clock counts on from where it stopped,
      // plus the time the process was down, capped like solo offline catch-up.
      const state = sim.deserializeState(kept.state);
      const pending = Array.isArray(kept.pending) ? kept.pending.slice(0, MAX_PENDING) : [];
      const keyHash = typeof kept.keyHash === "string" ? kept.keyHash : null;
      hold = { sim, state, engine: new sim.TickEngine(state), pending, keyHash, savedTick: state.meta.tick, savedAt: kept.savedAt };
      clocks.resume(realmId, state.meta.tick + downTicks(kept.savedAt, now()));
    } else {
      // The same new game a solo player starts with, but fresh: never a client's save.
      const state = sim.createGameState({ seed: seedForRealm(realmId), now: 0, withStarterBuildings: true });
      hold = { sim, state, engine: new sim.TickEngine(state), pending: [], keyHash: null, savedTick: -1, savedAt: -Infinity };
    }
    holds.set(realmId, touch(hold));
    return hold;
  }

  function touch(hold) {
    hold.usedAt = now();
    return hold;
  }

  // Drop the longest-unused hold that has been idle for idleMs, from memory only. It is brought up to
  // its clock and written first, so its kept file is whole and the same key opens it later. Never
  // without a store: that would lose the hold. Returns the dropped id, or null when none may go.
  function dropIdle() {
    if (!store) return null;
    const at = now();
    let oldest = null;
    for (const [id, hold] of holds) {
      if (at - hold.usedAt >= idleMs && (oldest === null || hold.usedAt < holds.get(oldest).usedAt)) oldest = id;
    }
    if (oldest === null) return null;
    const hold = holds.get(oldest);
    const tick = clocks.tick(oldest);
    if (tick !== null) advance(hold, tick);
    keep(oldest, hold, true);
    holds.delete(oldest);
    clocks.drop(oldest);
    onDrop(oldest);
    return oldest;
  }

  // Write the hold through the store. force: write now (a hold leaving memory). Otherwise only settled
  // ticks, throttled. A hold action is written by commit, before it goes live.
  function keep(realmId, hold, force) {
    if (!store) return;
    const at = now();
    if (!force && (hold.state.meta.tick === hold.savedTick || at - hold.savedAt < SETTLE_SAVE_MS)) return;
    try {
      store.save(realmId, { savedAt: at, state: hold.sim.serializeState(hold.state), pending: hold.pending, keyHash: hold.keyHash });
    } catch (e) {
      // A hold leaving memory must be written. Settled ticks may wait: the next read tries again.
      if (force) throw e;
      return;
    }
    hold.savedTick = hold.state.meta.tick;
    hold.savedAt = at;
  }

  // One hold action (wave/hold-write). act(draft) changes a copy of the hold, or throws a refusal.
  // The copy is written whole; only then is it made the live hold. A refusal or a failed write leaves
  // the live hold, its stores, and its kept file as they were, so the same intent can be sent again
  // and spends once.
  function commit(realmId, hold, act) {
    const { sim } = hold;
    const draft = {
      state: sim.deserializeState(sim.serializeState(hold.state)),
      pending: hold.pending.slice(),
      keyHash: hold.keyHash,
    };
    act(draft);
    const at = now();
    if (store) {
      try {
        store.save(realmId, { savedAt: at, state: sim.serializeState(draft.state), pending: draft.pending, keyHash: draft.keyHash });
      } catch {
        throw new HoldError(503, NOT_SAVED);
      }
    }
    hold.state = draft.state;
    hold.engine = new sim.TickEngine(draft.state);
    hold.pending = draft.pending;
    hold.keyHash = draft.keyHash;
    if (store) {
      hold.savedTick = draft.state.meta.tick;
      hold.savedAt = at;
    }
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
    // Every player farm, cottage, or lumber camp, finished or still building.
    const count = (typeId) => state.buildings.filter((b) => b.realmId === "player" && b.typeId === typeId).length;
    const farms = count("farm");
    const cottages = count("cottage");
    const lumberCamps = count("lumber_camp");
    return {
      realmId,
      tick: state.meta.tick,
      stores,
      militia,
      training,
      farms,
      cottages,
      lumberCamps,
      stamps: sim.listStamps(state),
      pending: hold.pending.length,
    };
  }

  // The first tile, row by row, where the sim says this building may go. null when there is none.
  function freeTile(sim, state, typeId) {
    for (let y = 0; y < TILE_SCAN; y++) {
      for (let x = 0; x < TILE_SCAN; x++) {
        if (sim.canPlaceType(state, typeId, x, y)) return { x, y };
      }
    }
    return null;
  }

  async function sync(realmId) {
    const hold = await holdFor(realmId);
    const tick = clocks.tick(realmId);
    if (tick === null) throw new HoldError(503, "No clock for this realm.");
    advance(hold, tick);
    keep(realmId, hold, false);
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
     * A build places one farm on the first free tile through the sim's tryBuild, the same call a
     * solo build makes: refused with 409 when there is no tile or the hold cannot pay. A cottage
     * goes the same way; once the sim finishes it, the sim's work-plot cap rises and a farm can land.
     * A lumber camp goes the same way and, like a farm, needs a free work plot.
     * null when the realm is not shared.
     */
    async intent(realmId, by, body) {
      if (!sharedId(realmId)) return null;
      const intent = parseIntent(body);
      if (typeof by !== "string" || !REALM_ID_RE.test(by)) throw new HoldError(400, "Bad issuer.");
      const hold = await sync(realmId);
      const { sim } = hold;
      commit(realmId, hold, (draft) => {
        if (intent.type === "train") {
          if (!sim.tryTrain(draft.state, { typeId: "militia", count: 1 })) throw new HoldError(409, CANNOT_TRAIN);
        } else if (Object.hasOwn(BUILDS, intent.type)) {
          const [typeId, noTile, cannot] = BUILDS[intent.type];
          const tile = freeTile(sim, draft.state, typeId);
          if (tile === null) throw new HoldError(409, noTile);
          if (!sim.tryBuild(draft.state, { typeId, x: tile.x, y: tile.y })) throw new HoldError(409, cannot);
        } else {
          if (draft.pending.length >= MAX_PENDING) throw new HoldError(429, "Too many intents this tick.");
          draft.pending.push({ ...intent, by });
        }
      });
      return view(realmId, hold);
    },
    /**
     * The hold key hash (join.mjs) for this id without loading the sim: a string when the hold has a
     * key, null for a hold kept before keys, undefined when there is no hold in memory or on disk.
     */
    keyHashOf(realmId) {
      if (typeof realmId !== "string" || !REALM_ID_RE.test(realmId)) return undefined;
      const hold = holds.get(realmId);
      if (hold) return hold.keyHash;
      const kept = store ? store.load(realmId) : null;
      if (!kept) return undefined;
      return typeof kept.keyHash === "string" ? kept.keyHash : null;
    },
    /** Give a shared hold with no key its key hash, write it at once, and return the view. A hold that has one is refused. */
    async claim(realmId, keyHash) {
      if (!sharedId(realmId)) return null;
      const hold = await sync(realmId);
      if (hold.keyHash !== null) throw new HoldError(409, "This hold already has a key.");
      commit(realmId, hold, (draft) => { draft.keyHash = keyHash; });
      return view(realmId, hold);
    },
    /** Drop one idle hold from memory, its file kept. The id, or null when none may go. */
    dropIdle,
    has: (realmId) => holds.has(realmId),
    get size() {
      return holds.size;
    },
  };
}
