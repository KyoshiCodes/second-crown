import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError } from "./hold.mjs";
import { createJoinableHolds, BAD_KEY, TOO_MANY_TRIES, MAX_KEY_TRIES, JOIN_ONLY } from "./join.mjs";
import { createHoldStore } from "./keep.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
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

/** One server process. A second call with the same dir and wall is a restart: fresh memory, same disk. */
function boot(dir = null, wall = { ms: 100_000 }) {
  let loads = 0;
  const clocks = createRealmClocks(() => wall.ms);
  const server = createJoinableHolds({
    clocks,
    loadSim: async () => { loads++; return roomySim; },
    store: dir ? createHoldStore(dir) : null,
    now: () => wall.ms,
  });
  return { ...server, step: (ms) => { wall.ms += ms; }, loads: () => loads };
}

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "sc-key-"));
const badKey = (e) => e instanceof HoldError && e.status === 403 && e.message === BAD_KEY;
const ALICE = "guest_alice";
const BOB = "guest_bob";
const EVE = "guest_eve";

test("the first join returns a key, once; a different id has a different key", async () => {
  const s = boot();
  const first = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  assert.equal(first.realmId, "join-oak-hill");
  assert.match(first.key, /^[A-Za-z0-9_-]{16}$/);
  const again = await s.join({ realm: "oak-hill" }, first.key, BOB);
  assert.equal(again.key, undefined, "the key is not handed out again");
  const other = await s.join({ realm: "elm-fen" }, undefined, ALICE);
  assert.notEqual(other.key, first.key);
  await assert.rejects(s.join({ realm: "elm-fen" }, first.key, BOB), badKey);
});

test("a second join without the key is rejected and makes no second hold", async () => {
  const s = boot();
  const first = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  s.step(1000);
  await assert.rejects(s.join({ realm: "oak-hill" }, undefined, EVE), badKey);
  await assert.rejects(s.join({ realm: " OAK-HILL " }, "", EVE), badKey);
  assert.equal(s.holds.size, 1);
  assert.equal(s.loads(), 1);
  const back = await s.join({ realm: "oak-hill" }, first.key, ALICE);
  assert.ok(back.tick > first.tick, "the same hold, still ticking");
});

test("a second join with the key sees the same stores", async () => {
  const s = boot();
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  s.step(10_000);
  const built = await s.intent(alice.realmId, ALICE, { type: "cottage" }, alice.key, ALICE);
  const bob = await s.join({ realm: "oak-hill" }, alice.key, BOB);
  assert.deepEqual(bob.stores, built.stores);
  assert.equal(bob.cottages, built.cottages);
  assert.deepEqual(await s.read(alice.realmId, alice.key, BOB), bob);
});

test("an intent with a wrong or missing key does not spend", async () => {
  const s = boot();
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  s.step(10_000);
  const before = await s.read(alice.realmId, alice.key, ALICE);
  const wrong = alice.key.slice(1) + (alice.key[0] === "A" ? "B" : "A");
  for (const type of ["train", "cottage", "build", "lumber", "stamp"]) {
    await assert.rejects(s.intent(alice.realmId, EVE, { type }, wrong, `guest_${type}`), badKey);
    await assert.rejects(s.intent(alice.realmId, EVE, { type }, undefined, `guest_${type}`), badKey);
  }
  const after = await s.read(alice.realmId, alice.key, ALICE);
  assert.deepEqual(after.stores, before.stores);
  for (const field of ["militia", "training", "farms", "cottages", "lumberCamps", "pending"]) assert.equal(after[field], before[field], field);
  assert.deepEqual(after.stamps, []);
  // The right key still spends.
  assert.equal((await s.intent(alice.realmId, ALICE, { type: "train" }, alice.key, ALICE)).training, 1);
});

test("a wrong key does not reveal whether the hold exists", async () => {
  const s = boot();
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  const errors = [];
  for (const id of ["join-oak-hill", "join-nobody-here"]) {
    for (const call of [
      () => s.read(id, alice.key.toLowerCase() + "x", EVE),
      () => s.intent(id, EVE, { type: "train" }, "not-the-key-at-all", EVE),
    ]) {
      try { await call(); } catch (e) { errors.push([e.status, e.message]); }
    }
  }
  try { await s.join({ realm: "nobody-here" }, "not-the-key-at-all", BOB); } catch (e) { errors.push([e.status, e.message]); }
  assert.equal(errors.length, 5);
  for (const e of errors) assert.deepEqual(e, [403, BAD_KEY]);
  assert.equal(s.holds.size, 1, "a key try on an unknown id makes no hold");
});

test("a guesser is refused after a few wrong keys", async () => {
  const s = boot();
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  for (let i = 0; i < MAX_KEY_TRIES; i++) {
    await assert.rejects(s.read(alice.realmId, `guess-number-${i}`, EVE), badKey);
  }
  const locked = (e) => e instanceof HoldError && e.status === 429 && e.message === TOO_MANY_TRIES;
  await assert.rejects(s.read(alice.realmId, alice.key, EVE), locked, "even the right key, from that session");
  await assert.rejects(s.join({ realm: "oak-hill" }, alice.key, EVE), locked);
  await assert.rejects(s.join({ realm: "new-hold" }, undefined, EVE), locked);
  assert.equal((await s.read(alice.realmId, alice.key, BOB)).realmId, alice.realmId, "another session is not locked");
  await assert.rejects(s.read(alice.realmId, alice.key), (e) => e.status === 401);
});

test("after the in-memory hold is dropped the same key opens it and a wrong key does not", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const alice = await first.join({ realm: "oak-hill" }, undefined, ALICE);
  wall.ms += 10_000;
  const built = await first.intent(alice.realmId, ALICE, { type: "cottage" }, alice.key, ALICE);
  const file = fs.readFileSync(path.join(dir, "join-oak-hill.json"), "utf8");
  assert.doesNotMatch(file, new RegExp(alice.key), "the key itself is never written");
  assert.match(JSON.parse(file).keyHash, /^[0-9a-f]{64}$/);

  const second = boot(dir, wall);
  assert.equal(second.holds.size, 0);
  await assert.rejects(second.join({ realm: "oak-hill" }, "wrong-key-after-restart", EVE), badKey);
  await assert.rejects(second.join({ realm: "oak-hill" }, undefined, EVE), badKey, "no fresh hold over the kept one");
  await assert.rejects(second.read(alice.realmId, "wrong-key-after-restart", BOB), badKey);
  assert.equal(second.loads(), 0, "a wrong key loads nothing");
  const back = await second.join({ realm: "oak-hill" }, alice.key, BOB);
  assert.equal(back.cottages, built.cottages);
  assert.deepEqual(back.stores, built.stores);
  assert.equal(back.key, undefined);

  // A read with the key also opens it after a restart, with no join first.
  const third = boot(dir, wall);
  assert.equal((await third.read(alice.realmId, alice.key, ALICE)).cottages, built.cottages);
});

test("two first joins at once: only one gets a key", async () => {
  const s = boot();
  const results = await Promise.allSettled([
    s.join({ realm: "oak-hill" }, undefined, ALICE),
    s.join({ realm: "oak-hill" }, undefined, BOB),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(badKey(results.find((r) => r.status === "rejected").reason));
  assert.equal(s.holds.size, 1);
});

test("a hold kept before keys is claimed by the next join", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const alice = await first.join({ realm: "oak-hill" }, undefined, ALICE);
  wall.ms += 10_000;
  const built = await first.intent(alice.realmId, ALICE, { type: "cottage" }, alice.key, ALICE);
  const file = path.join(dir, "join-oak-hill.json");
  const rec = JSON.parse(fs.readFileSync(file, "utf8"));
  delete rec.keyHash;
  fs.writeFileSync(file, JSON.stringify(rec));

  const second = boot(dir, wall);
  const claimed = await second.join({ realm: "oak-hill" }, undefined, BOB);
  assert.equal(claimed.cottages, built.cottages, "the kept hold, not a fresh one");
  assert.match(claimed.key, /^[A-Za-z0-9_-]{16}$/);
  await assert.rejects(second.join({ realm: "oak-hill" }, undefined, EVE), badKey);
});

test("a full client state is still not accepted, with or without a key", async () => {
  const s = boot();
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const key of [undefined, "some-key-12345"]) {
    await assert.rejects(s.join({ realm: "oak-hill", state: save }, key, ALICE), (e) => e.status === 400 && e.message === JOIN_ONLY);
  }
  assert.equal(s.holds.size, 0);
});

test("a solo load does not join: no hold, no sim, no key asked", async () => {
  const s = boot();
  for (const id of ["guest_alice", "oak-hill", "player", "discord_1"]) {
    assert.equal(await s.read(id), null);
    assert.equal(await s.intent(id, ALICE, { type: "train" }), null);
  }
  assert.equal(s.holds.size, 0);
  assert.equal(s.loads(), 0);
});

test("the live server sends the key header through the gate and marks no save shared", () => {
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /X-Hold-Key/);
  assert.match(src, /joinable\.join\(body, holdKey\(req\), u\.id, clientAddress\(req\)\)/);
  assert.match(src, /joinable\.read\(/);
  assert.match(src, /joinable\.intent\(/);
  assert.doesNotMatch(src, /holds\.(read|intent)\(/, "no route skips the key");
  assert.match(src, /const SHARED_SAVES = new Set\(\);/);
  assert.doesNotMatch(src, /SHARED_SAVES\.add/);
  const join = fs.readFileSync(path.join(here, "join.mjs"), "utf8");
  assert.doesNotMatch(join, /node:fs|readSave|writeFile|applyOfflineProgress|resolveBattle|realmPower|matchup|Decimal|break_infinity/);
});
