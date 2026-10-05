import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError, CANNOT_COTTAGE, NO_TILE, INTENT_ONLY } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { keyedJoin } from "./testkeys.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

function setup() {
  let wall = 100_000;
  let loads = 0;
  const clocks = createRealmClocks(() => wall);
  const { holds, join: rawJoin } = createJoinableHolds({ clocks, loadSim: async () => { loads++; return sim; } });
  const join = keyedJoin(rawJoin);
  return { holds, join, step: (ms) => { wall += ms; }, loads: () => loads };
}

test("a fresh hold has no cottage", async () => {
  const { join } = setup();
  const view = await join({ realm: "oak-hill" });
  assert.equal(view.cottages, 0);
});

test("a cottage on one id shows on the other", async () => {
  const { holds, join, step } = setup();
  const alice = await join({ realm: "oak-hill" });
  step(10_000);
  const before = await join({ realm: "oak-hill" });
  const built = await holds.intent(alice.realmId, "guest_alice", { type: "cottage" });
  assert.equal(built.cottages, 1);
  assert.ok(Number(built.stores.wood) < Number(before.stores.wood), "the sim took the wood");
  assert.ok(Number(built.stores.food) < Number(before.stores.food), "the sim took the food");
  const bob = await holds.read(alice.realmId);
  assert.equal(bob.cottages, 1);
  assert.deepEqual(bob.stores, built.stores);
  step(60_000);
  const later = await join({ realm: "oak-hill" });
  assert.equal(later.cottages, 1);
  assert.deepEqual((await holds.read(alice.realmId)).stores, later.stores);
});

test("a cottage the hold cannot afford is rejected and does not spend", async () => {
  const { holds, join } = setup();
  const view = await join({ realm: "oak-hill" });
  assert.equal(view.stores.wood, "0");
  await assert.rejects(
    holds.intent(view.realmId, "guest_alice", { type: "cottage" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === CANNOT_COTTAGE,
  );
  const after = await holds.read(view.realmId);
  assert.deepEqual(after.stores, view.stores);
  assert.equal(after.cottages, 0);
});

test("after a cottage finishes, a farm refused for no free tile can land", async () => {
  const { holds, join, step } = setup();
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  await assert.rejects(
    holds.intent(view.realmId, "guest_alice", { type: "build" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === NO_TILE,
  );
  await holds.intent(view.realmId, "guest_alice", { type: "cottage" });
  // Still scaffolding: the sim does not count its plots yet.
  await assert.rejects(
    holds.intent(view.realmId, "guest_bob", { type: "build" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === NO_TILE,
  );
  step(10_000); // well past the cottage's build time
  const farm = await holds.intent(view.realmId, "guest_bob", { type: "build" });
  assert.equal(farm.farms, 2);
  assert.equal(farm.cottages, 1);
});

test("a different id does not see that cottage", async () => {
  const { holds, join, step } = setup();
  const oak = await join({ realm: "oak-hill" });
  step(10_000);
  await holds.intent(oak.realmId, "guest_alice", { type: "cottage" });
  assert.equal((await holds.read(oak.realmId)).cottages, 1);
  const elm = await join({ realm: "elm-fen" });
  assert.equal(elm.cottages, 0);
  assert.equal(holds.size, 2);
});

test("a cottage intent with a tile or a state is refused", async () => {
  const { holds, join, step } = setup();
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const body of [{ type: "cottage", x: 3, y: 3 }, { type: "cottage", count: 5 }, { type: "cottage", state: save }]) {
    await assert.rejects(holds.intent(view.realmId, "guest_alice", body), (e) => e instanceof HoldError && e.status === 400 && e.message === INTENT_ONLY);
  }
  assert.equal((await holds.read(view.realmId)).cottages, 0);
});

test("train militia and build farm still work next to cottage", async () => {
  const { holds, join, step } = setup();
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  await holds.intent(view.realmId, "guest_alice", { type: "cottage" });
  const trained = await holds.intent(view.realmId, "guest_alice", { type: "train" });
  assert.equal(trained.training, 1);
  assert.equal(trained.cottages, 1);
  step(10_000);
  assert.equal((await holds.intent(view.realmId, "guest_alice", { type: "build" })).farms, 2);
});

test("a solo load does not join: no hold, no sim", async () => {
  const { holds, loads } = setup();
  for (const id of ["guest_alice", "oak-hill", "player"]) {
    assert.equal(await holds.read(id), null);
    assert.equal(await holds.intent(id, "guest_alice", { type: "cottage" }), null);
  }
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("hold source builds the cottage through the sim and copies no rules", () => {
  const src = fs.readFileSync(path.join(here, "hold.mjs"), "utf8");
  assert.match(src, /sim\.tryBuild\(/);
  assert.match(src, /"cottage"/);
  assert.doesNotMatch(src, /applyOfflineProgress|workPlotCap|housingCap|buildCostMultiplier|WORK_PLOTS|cost:|buildTicks|resolveBattle|Decimal|break_infinity|node:fs/);
});
