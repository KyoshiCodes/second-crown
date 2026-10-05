import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError, CANNOT_LUMBER, NO_LUMBER_TILE, INTENT_ONLY } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { keyedJoin } from "./testkeys.mjs";
import { createHoldStore } from "./keep.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

/** One server process. A second call with the same dir and wall is a restart: fresh memory, same disk. */
function boot(dir = null, wall = { ms: 100_000 }) {
  let loads = 0;
  const clocks = createRealmClocks(() => wall.ms);
  const store = dir ? createHoldStore(dir) : null;
  const { holds, join: rawJoin } = createJoinableHolds({
    clocks,
    loadSim: async () => { loads++; return sim; },
    store,
    now: () => wall.ms,
  });
  const join = keyedJoin(rawJoin, wall.ring ??= new Map());
  return { holds, join, step: (ms) => { wall.ms += ms; }, loads: () => loads };
}

/** A hold with a finished cottage, so the work-plot cap has room for a lumber camp. */
async function roomyHold(server, realm = "oak-hill") {
  const view = await server.join({ realm });
  server.step(10_000);
  await server.holds.intent(view.realmId, "guest_alice", { type: "cottage" });
  server.step(10_000); // well past the cottage's build time
  return view.realmId;
}

test("a fresh hold shows its starter lumber camp", async () => {
  const { join } = boot();
  assert.equal((await join({ realm: "oak-hill" })).lumberCamps, 1);
});

test("a lumber camp on one id shows on the other", async () => {
  const server = boot();
  const realmId = await roomyHold(server);
  const before = await server.join({ realm: "oak-hill" });
  const built = await server.holds.intent(realmId, "guest_alice", { type: "lumber" });
  assert.equal(built.lumberCamps, 2);
  assert.ok(Number(built.stores.wood) < Number(before.stores.wood), "the sim took the wood");
  assert.ok(Number(built.stores.food) < Number(before.stores.food), "the sim took the food");
  const bob = await server.join({ realm: "oak-hill" });
  assert.equal(bob.lumberCamps, 2);
  assert.deepEqual(bob.stores, built.stores);
});

test("a lumber camp the hold cannot afford is rejected and does not spend", async () => {
  // Test-only: the same sim, with one finished cottage in the new game, so a fresh hold (0 wood)
  // has a free work plot and the refusal is the cost, not the tile.
  const simWithCottage = {
    ...sim,
    createGameState(opts) {
      const state = sim.createGameState(opts);
      state.buildings.push({ id: "b_test_cottage", typeId: "cottage", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null });
      return state;
    },
  };
  const clocks = createRealmClocks(() => 100_000);
  const { holds, join: rawJoin } = createJoinableHolds({ clocks, loadSim: async () => simWithCottage });
  const join = keyedJoin(rawJoin);
  const view = await join({ realm: "oak-hill" });
  assert.equal(view.stores.wood, "0");
  await assert.rejects(
    holds.intent(view.realmId, "guest_alice", { type: "lumber" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === CANNOT_LUMBER,
  );
  const after = await holds.read(view.realmId);
  assert.deepEqual(after.stores, view.stores);
  assert.equal(after.lumberCamps, 1);
});

test("a fresh hold has no free work plot for a lumber camp, and nothing is spent", async () => {
  const server = boot();
  const view = await server.join({ realm: "oak-hill" });
  server.step(10_000);
  const before = await server.holds.read(view.realmId);
  await assert.rejects(
    server.holds.intent(view.realmId, "guest_alice", { type: "lumber" }),
    (e) => e instanceof HoldError && e.status === 409 && e.message === NO_LUMBER_TILE,
  );
  const after = await server.holds.read(view.realmId);
  assert.deepEqual(after.stores, before.stores);
  assert.equal(after.lumberCamps, 1);
});

test("a lumber camp built before a restart is still there after the in-memory hold is dropped", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-lumber-"));
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const realmId = await roomyHold(first);
  const built = await first.holds.intent(realmId, "guest_alice", { type: "lumber" });
  assert.equal(built.lumberCamps, 2);

  const second = boot(dir, wall);
  assert.equal(second.holds.size, 0);
  const back = await second.join({ realm: "oak-hill" });
  assert.equal(back.lumberCamps, 2);
  assert.equal(back.cottages, built.cottages);
  assert.deepEqual(back.stores, built.stores);
});

test("a different id does not see that lumber camp", async () => {
  const server = boot();
  const realmId = await roomyHold(server);
  await server.holds.intent(realmId, "guest_alice", { type: "lumber" });
  assert.equal((await server.holds.read(realmId)).lumberCamps, 2);
  const elm = await server.join({ realm: "elm-fen" });
  assert.equal(elm.lumberCamps, 1);
  assert.equal(server.holds.size, 2);
});

test("a lumber intent with a tile or a state is refused", async () => {
  const server = boot();
  const realmId = await roomyHold(server);
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const body of [{ type: "lumber", x: 3, y: 3 }, { type: "lumber", count: 5 }, { type: "lumber", state: save }, { type: "lumber_camp" }]) {
    await assert.rejects(server.holds.intent(realmId, "guest_alice", body), (e) => e instanceof HoldError && e.status === 400 && e.message === INTENT_ONLY);
  }
  assert.equal((await server.holds.read(realmId)).lumberCamps, 1);
});

test("train militia, build cottage, and build farm still work next to lumber camp", async () => {
  const server = boot();
  const realmId = await roomyHold(server);
  assert.equal((await server.holds.intent(realmId, "guest_alice", { type: "lumber" })).lumberCamps, 2);
  const farm = await server.holds.intent(realmId, "guest_bob", { type: "build" });
  assert.equal(farm.farms, 2);
  server.step(10_000);
  assert.equal((await server.holds.intent(realmId, "guest_alice", { type: "train" })).training, 1);
  const cottage = await server.holds.intent(realmId, "guest_bob", { type: "cottage" });
  assert.equal(cottage.cottages, 2);
  assert.equal(cottage.lumberCamps, 2);
});

test("a solo load does not join: no hold, no sim", async () => {
  const { holds, loads } = boot();
  for (const id of ["guest_alice", "oak-hill", "player"]) {
    assert.equal(await holds.read(id), null);
    assert.equal(await holds.intent(id, "guest_alice", { type: "lumber" }), null);
  }
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("hold source builds the lumber camp through the sim and copies no rules", () => {
  const src = fs.readFileSync(path.join(here, "hold.mjs"), "utf8");
  assert.match(src, /sim\.tryBuild\(/);
  assert.match(src, /"lumber_camp"/);
  assert.doesNotMatch(src, /applyOfflineProgress|workPlotCap|housingCap|buildCostMultiplier|WORK_PLOTS|cost:|buildTicks|resolveBattle|Decimal|break_infinity|node:fs/);
});
