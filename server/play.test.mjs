import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError, CANNOT_TRAIN, INTENT_ONLY } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

function setup() {
  let wall = 100_000;
  let loads = 0;
  const clocks = createRealmClocks(() => wall);
  const { holds, join } = createJoinableHolds({ clocks, loadSim: async () => { loads++; return sim; } });
  return { holds, join, step: (ms) => { wall += ms; }, loads: () => loads };
}

const STORE_KEYS = ["food", "gold", "stone", "wood"];

test("a joined hold starts as the sim's new game, not a client save", async () => {
  const { join } = setup();
  const view = await join({ realm: "oak-hill" });
  const fresh = sim.createGameState({ seed: 1, now: 0, withStarterBuildings: true });
  assert.equal(view.tick, 0);
  assert.deepEqual(Object.keys(view.stores).sort(), STORE_KEYS);
  for (const res of STORE_KEYS) assert.equal(view.stores[res], fresh.resources[res]);
  assert.equal(view.militia, 0);
  assert.equal(view.training, 0);
});

test("two readers on one id see the same stores, settled through the sim", async () => {
  const { holds, join, step } = setup();
  const alice = await join({ realm: "oak-hill" });
  step(10_000);
  const bob = await join({ realm: "oak-hill" });
  const alice2 = await holds.read(alice.realmId);
  assert.equal(bob.tick, 100);
  assert.equal(alice2.tick, bob.tick);
  assert.deepEqual(alice2.stores, bob.stores);
  assert.equal(alice2.militia, bob.militia);
  assert.ok(Number(bob.stores.food) > 0, "the starter farm fed the hold");
});

test("a train on one id shows on the other", async () => {
  const { holds, join, step } = setup();
  const alice = await join({ realm: "oak-hill" });
  step(10_000);
  const before = await join({ realm: "oak-hill" });
  const trained = await holds.intent(alice.realmId, "guest_alice", { type: "train" });
  assert.equal(trained.training, 1);
  assert.ok(Number(trained.stores.food) < Number(before.stores.food), "the sim took the cost");
  const bob = await holds.read(alice.realmId);
  assert.equal(bob.training, 1);
  assert.deepEqual(bob.stores, trained.stores);
  step(60_000);
  const later = await join({ realm: "oak-hill" });
  const aliceLater = await holds.read(alice.realmId);
  assert.equal(later.militia, 1);
  assert.equal(later.training, 0);
  assert.equal(aliceLater.militia, later.militia);
  assert.deepEqual(aliceLater.stores, later.stores);
});

test("a train the hold cannot afford is rejected and changes nothing", async () => {
  const { holds, join } = setup();
  const view = await join({ realm: "oak-hill" });
  await assert.rejects(
    holds.intent(view.realmId, "guest_alice", { type: "train" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === CANNOT_TRAIN,
  );
  const after = await holds.read(view.realmId);
  assert.deepEqual(after.stores, view.stores);
  assert.equal(after.training, 0);
  assert.equal(after.militia, 0);
});

test("a different id does not see that militia", async () => {
  const { holds, join, step } = setup();
  const oak = await join({ realm: "oak-hill" });
  step(10_000);
  await holds.intent(oak.realmId, "guest_alice", { type: "train" });
  step(60_000);
  assert.equal((await holds.read(oak.realmId)).militia, 1);
  const elm = await join({ realm: "elm-fen" });
  assert.equal(elm.militia, 0);
  assert.equal(elm.training, 0);
  assert.equal(holds.size, 2);
});

test("a train intent with a unit, a count, or a state is refused", async () => {
  const { holds, join, step } = setup();
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const body of [{ type: "train", typeId: "knight" }, { type: "train", count: 50 }, { type: "train", state: save }, save]) {
    await assert.rejects(holds.intent(view.realmId, "guest_alice", body), (e) => e instanceof HoldError && e.status === 400 && e.message === INTENT_ONLY);
  }
  assert.equal((await holds.read(view.realmId)).training, 0);
});

test("a solo load does not join: no hold, no sim", async () => {
  const { holds, loads } = setup();
  for (const id of ["guest_alice", "oak-hill", "player"]) {
    assert.equal(await holds.read(id), null);
    assert.equal(await holds.intent(id, "guest_alice", { type: "train" }), null);
  }
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("hold source calls the sim's train and copies no rules", () => {
  const src = fs.readFileSync(path.join(here, "hold.mjs"), "utf8");
  assert.match(src, /sim\.tryTrain\(/);
  assert.doesNotMatch(src, /applyOfflineProgress|trainCostMultiplier|cost:|resolveBattle|Decimal|break_infinity|node:fs/);
});
