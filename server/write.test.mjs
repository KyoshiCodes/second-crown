import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError, NOT_SAVED } from "./hold.mjs";
import { createJoinableHolds, BAD_KEY } from "./join.mjs";
import { createHoldStore } from "./keep.mjs";

const sim = await loadSimFromSource();

// Test-only: one finished cottage in the new game, so farms and lumber camps have free work plots.
const roomySim = {
  ...sim,
  createGameState(opts) {
    const state = sim.createGameState(opts);
    state.buildings.push({ id: "b_test_cottage", typeId: "cottage", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null });
    return state;
  },
};

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "sc-write-"));
const ALICE = "guest_alice";
const EVE = "guest_eve";
const SPENDS = ["train", "build", "cottage", "lumber", "stamp"];
const COUNTS = ["militia", "training", "farms", "cottages", "lumberCamps", "pending"];
const notSaved = (e) => e instanceof HoldError && e.status === 503 && e.message === NOT_SAVED;

/** A real hold store whose writes fail while `broken` is set, like a full or read-only disk. */
function flakyStore(dir) {
  const real = createHoldStore(dir);
  const store = {
    broken: false,
    saves: 0,
    load: (id) => real.load(id),
    save: (id, rec) => {
      store.saves++;
      if (store.broken) throw new Error("ENOSPC: no space left on device");
      return real.save(id, rec);
    },
  };
  return store;
}

/** One server process. A second call with the same dir and wall is a restart: fresh memory, same disk. */
function boot(dir, wall) {
  const clocks = createRealmClocks(() => wall.ms);
  const store = flakyStore(dir);
  const server = createJoinableHolds({ clocks, loadSim: async () => roomySim, store, now: () => wall.ms });
  return { ...server, store };
}

/** A hold with stores to spend: joined, then left to fill for ten seconds. */
async function richHold(dir, wall) {
  const s = boot(dir, wall);
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  wall.ms += 10_000;
  await s.read(alice.realmId, alice.key, ALICE); // settles and writes the ten seconds
  return { s, alice };
}

test("a failed write leaves militia, farms, cottages, lumber camps, and stores unchanged", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const { s, alice } = await richHold(dir, wall);
  const file = path.join(dir, "join-oak-hill.json");
  const keptBefore = fs.readFileSync(file, "utf8");
  const before = await s.read(alice.realmId, alice.key, ALICE);

  s.store.broken = true;
  for (const type of SPENDS) {
    await assert.rejects(s.intent(alice.realmId, ALICE, { type }, alice.key, ALICE), notSaved, type);
  }
  const after = await s.read(alice.realmId, alice.key, ALICE);
  assert.equal(after.tick, before.tick);
  assert.deepEqual(after.stores, before.stores);
  for (const field of COUNTS) assert.equal(after[field], before[field], field);
  assert.equal(fs.readFileSync(file, "utf8"), keptBefore, "the kept file is the last good copy");
});

test("after a failed write the same intents spend once, like a server whose disk never failed", async () => {
  const wall = { ms: 100_000 };
  const { s, alice } = await richHold(tempDir(), wall);
  const twinWall = { ms: 100_000 };
  const { s: twin, alice: twinAlice } = await richHold(tempDir(), twinWall);

  s.store.broken = true;
  for (const type of SPENDS) {
    await assert.rejects(s.intent(alice.realmId, ALICE, { type }, alice.key, ALICE), notSaved);
  }
  s.store.broken = false;
  let last;
  let twinLast;
  for (const type of SPENDS) {
    last = await s.intent(alice.realmId, ALICE, { type }, alice.key, ALICE);
    twinLast = await twin.intent(twinAlice.realmId, ALICE, { type }, twinAlice.key, ALICE);
  }
  assert.equal(last.training, 1);
  assert.equal(last.farms, twinLast.farms);
  assert.equal(last.cottages, 2);
  assert.equal(last.lumberCamps, twinLast.lumberCamps);
  assert.equal(last.pending, 1);
  assert.deepEqual(last.stores, twinLast.stores, "spent once, not twice");
  for (const field of COUNTS) assert.equal(last[field], twinLast[field], field);
});

test("a normal refusal spends nothing and writes nothing", async () => {
  const wall = { ms: 100_000 };
  const s = boot(tempDir(), wall);
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  // Spend the hold down until the sim refuses, then check the refusal changed nothing.
  let refused = null;
  for (let i = 0; i < 50 && refused === null; i++) {
    try { await s.intent(alice.realmId, ALICE, { type: "train" }, alice.key, ALICE); } catch (e) { refused = e; }
  }
  assert.equal(refused?.status, 409);
  const before = await s.read(alice.realmId, alice.key, ALICE);
  const saves = s.store.saves;
  await assert.rejects(s.intent(alice.realmId, ALICE, { type: "train" }, alice.key, ALICE), (e) => e.status === 409);
  const after = await s.read(alice.realmId, alice.key, ALICE);
  assert.deepEqual(after.stores, before.stores);
  for (const field of COUNTS) assert.equal(after[field], before[field], field);
  assert.equal(s.store.saves, saves, "a refusal is not written");
});

test("a successful write survives a restart and the next keyed join sees the new stores", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const { s, alice } = await richHold(dir, wall);
  await s.intent(alice.realmId, ALICE, { type: "train" }, alice.key, ALICE);
  await s.intent(alice.realmId, ALICE, { type: "lumber" }, alice.key, ALICE);
  const built = await s.intent(alice.realmId, ALICE, { type: "cottage" }, alice.key, ALICE);
  assert.deepEqual((await s.join({ realm: "oak-hill" }, alice.key, EVE)).stores, built.stores, "the next keyed join, same process");

  const again = boot(dir, wall); // restart at the same wall time
  const back = await again.join({ realm: "oak-hill" }, alice.key, EVE);
  assert.equal(back.tick, built.tick);
  assert.deepEqual(back.stores, built.stores);
  for (const field of COUNTS) assert.equal(back[field], built[field], field);
});

test("a failed first join leaves no key behind, and the id can be joined again", async () => {
  const wall = { ms: 100_000 };
  const s = boot(tempDir(), wall);
  s.store.broken = true;
  await assert.rejects(s.join({ realm: "oak-hill" }, undefined, ALICE), notSaved);
  s.store.broken = false;
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  assert.match(alice.key, /^[A-Za-z0-9_-]{16}$/);
  assert.equal((await s.read(alice.realmId, alice.key, ALICE)).realmId, "join-oak-hill");
});

test("a wrong hold key still does not spend or write", async () => {
  const wall = { ms: 100_000 };
  const { s, alice } = await richHold(tempDir(), wall);
  const before = await s.read(alice.realmId, alice.key, ALICE);
  const saves = s.store.saves;
  const wrong = alice.key.slice(1) + (alice.key[0] === "A" ? "B" : "A");
  for (const type of SPENDS) {
    await assert.rejects(s.intent(alice.realmId, EVE, { type }, wrong, `guest_${type}`), (e) => e.status === 403 && e.message === BAD_KEY);
  }
  const after = await s.read(alice.realmId, alice.key, ALICE);
  assert.deepEqual(after.stores, before.stores);
  for (const field of COUNTS) assert.equal(after[field], before[field], field);
  assert.equal(s.store.saves, saves);
});

test("Repair still does not finish a cottage the hold is building", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const { s, alice } = await richHold(dir, wall);
  await s.intent(alice.realmId, ALICE, { type: "cottage" }, alice.key, ALICE);
  const kept = JSON.parse(fs.readFileSync(path.join(dir, "join-oak-hill.json"), "utf8"));
  const state = sim.deserializeState(kept.state);
  const building = state.buildings.filter((b) => b.typeId === "cottage" && b.completesAtTick !== null);
  assert.equal(building.length, 1, "the written cottage is still under construction");
  const stone = state.resources.stone;
  assert.equal(sim.tryRepair(state, building[0].id), false);
  assert.notEqual(building[0].completesAtTick, null);
  assert.equal(state.resources.stone, stone);
});

test("a solo load does not join: no hold, no write", async () => {
  const wall = { ms: 100_000 };
  const s = boot(tempDir(), wall);
  for (const id of ["guest_alice", "discord_1", "player", "oak-hill"]) {
    assert.equal(await s.holds.read(id), null);
    assert.equal(await s.holds.intent(id, ALICE, { type: "train" }), null);
  }
  assert.equal(s.holds.size, 0);
  assert.equal(s.store.saves, 0);
});
