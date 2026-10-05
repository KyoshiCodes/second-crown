import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError, CANNOT_BUILD, NO_TILE, INTENT_ONLY } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { keyedJoin } from "./testkeys.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

// A fresh hold uses both starter work plots, as a solo new game does. Test-only: the same sim,
// with one finished cottage in the new game so the hold has free work plots for farms.
const simWithCottage = {
  ...sim,
  createGameState(opts) {
    const state = sim.createGameState(opts);
    state.buildings.push({ id: "b_test_cottage", typeId: "cottage", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null });
    return state;
  },
};

function setup(base = simWithCottage) {
  let wall = 100_000;
  let loads = 0;
  const clocks = createRealmClocks(() => wall);
  const { holds, join: rawJoin } = createJoinableHolds({ clocks, loadSim: async () => { loads++; return base; } });
  const join = keyedJoin(rawJoin);
  return { holds, join, step: (ms) => { wall += ms; }, loads: () => loads };
}

test("a joined hold shows its starter farm", async () => {
  const { join } = setup(sim);
  const view = await join({ realm: "oak-hill" });
  assert.equal(view.farms, 1);
});

test("a build on one id shows on the other", async () => {
  const { holds, join, step } = setup();
  const alice = await join({ realm: "oak-hill" });
  step(10_000);
  const before = await join({ realm: "oak-hill" });
  assert.equal(before.farms, 1);
  const built = await holds.intent(alice.realmId, "guest_alice", { type: "build" });
  assert.equal(built.farms, 2);
  assert.ok(Number(built.stores.wood) < Number(before.stores.wood), "the sim took the cost");
  const bob = await holds.read(alice.realmId);
  assert.equal(bob.farms, 2);
  assert.deepEqual(bob.stores, built.stores);
  step(60_000);
  const later = await join({ realm: "oak-hill" });
  const aliceLater = await holds.read(alice.realmId);
  assert.equal(later.farms, 2);
  assert.deepEqual(aliceLater.stores, later.stores);
});

test("a build the hold cannot afford is rejected and does not spend", async () => {
  const { holds, join } = setup();
  const view = await join({ realm: "oak-hill" });
  assert.equal(view.stores.wood, "0");
  await assert.rejects(
    holds.intent(view.realmId, "guest_alice", { type: "build" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === CANNOT_BUILD,
  );
  const after = await holds.read(view.realmId);
  assert.deepEqual(after.stores, view.stores);
  assert.equal(after.farms, 1);
});

test("a build with no free tile is rejected and does not spend", async () => {
  const { holds, join, step } = setup(sim);
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  const before = await holds.read(view.realmId);
  assert.ok(Number(before.stores.wood) > 6, "the hold could pay");
  await assert.rejects(
    holds.intent(view.realmId, "guest_alice", { type: "build" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === NO_TILE,
  );
  const after = await holds.read(view.realmId);
  assert.deepEqual(after.stores, before.stores);
  assert.equal(after.farms, 1);
});

test("a different id does not see that farm", async () => {
  const { holds, join, step } = setup();
  const oak = await join({ realm: "oak-hill" });
  step(10_000);
  await holds.intent(oak.realmId, "guest_alice", { type: "build" });
  assert.equal((await holds.read(oak.realmId)).farms, 2);
  const elm = await join({ realm: "elm-fen" });
  assert.equal(elm.farms, 1);
  assert.equal(holds.size, 2);
});

test("a build intent with a type, a tile, or a state is refused", async () => {
  const { holds, join, step } = setup();
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const body of [{ type: "build", typeId: "keep" }, { type: "build", x: 3, y: 3 }, { type: "build", state: save }, save]) {
    await assert.rejects(holds.intent(view.realmId, "guest_alice", body), (e) => e instanceof HoldError && e.status === 400 && e.message === INTENT_ONLY);
  }
  assert.equal((await holds.read(view.realmId)).farms, 1);
});

test("train militia still works next to build", async () => {
  const { holds, join, step } = setup();
  const view = await join({ realm: "oak-hill" });
  step(10_000);
  await holds.intent(view.realmId, "guest_alice", { type: "build" });
  const trained = await holds.intent(view.realmId, "guest_alice", { type: "train" });
  assert.equal(trained.training, 1);
  assert.equal(trained.farms, 2);
});

test("a solo load does not join: no hold, no sim", async () => {
  const { holds, loads } = setup();
  for (const id of ["guest_alice", "oak-hill", "player"]) {
    assert.equal(await holds.read(id), null);
    assert.equal(await holds.intent(id, "guest_alice", { type: "build" }), null);
  }
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("hold source calls the sim's build and copies no rules", () => {
  const src = fs.readFileSync(path.join(here, "hold.mjs"), "utf8");
  assert.match(src, /sim\.tryBuild\(/);
  assert.match(src, /sim\.canPlaceType\(/);
  assert.doesNotMatch(src, /applyOfflineProgress|buildCostMultiplier|WORK_PLOTS|HOLD_W|cost:|resolveBattle|Decimal|break_infinity|node:fs/);
});
