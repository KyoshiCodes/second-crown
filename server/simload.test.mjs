import { test } from "node:test";
import assert from "node:assert/strict";
import * as vite from "vite";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { keyedJoin } from "./testkeys.mjs";

// A Vite without runnerImport: loadSimFromSource must take the createServer path.
const { runnerImport: _omit, ...viteWithoutRunner } = vite;

const direct = await loadSimFromSource();
const fallback = await loadSimFromSource(viteWithoutRunner);

// Test-only: one finished cottage so the hold has free work plots for a farm, as in build.test.mjs.
function withCottage(sim) {
  return {
    ...sim,
    createGameState(opts) {
      const state = sim.createGameState(opts);
      state.buildings.push({ id: "b_test_cottage", typeId: "cottage", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null });
      return state;
    },
  };
}

function setup(sim) {
  let wall = 100_000;
  let loads = 0;
  const clocks = createRealmClocks(() => wall);
  const { holds, join } = createJoinableHolds({ clocks, loadSim: async () => { loads++; return sim; } });
  return { holds, join: keyedJoin(join), step: (ms) => { wall += ms; }, loads: () => loads };
}

test("both load paths give the same sim exports", () => {
  assert.equal(typeof direct.createGameState, "function");
  assert.deepEqual(Object.keys(fallback).sort(), Object.keys(direct).sort());
});

test("a shared hold loaded without runnerImport can still train and build", async () => {
  const { holds, join, step } = setup(withCottage(fallback));
  const alice = await join({ realm: "oak-hill" });
  step(10_000);
  const trained = await holds.intent(alice.realmId, "guest_alice", { type: "train" });
  assert.equal(trained.training, 1);
  const built = await holds.intent(alice.realmId, "guest_alice", { type: "build" });
  assert.equal(built.farms, alice.farms + 1);
});

test("a solo load does not join on the fallback path: no hold, no sim", async () => {
  const { holds, loads } = setup(fallback);
  for (const id of ["guest_alice", "player"]) {
    assert.equal(await holds.read(id), null);
    assert.equal(await holds.intent(id, "guest_alice", { type: "build" }), null);
  }
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});
