import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { createHolds, loadSimFromSource, HoldError, INTENT_ONLY } from "./hold.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

function setup(shared = new Set(["realm-a"])) {
  let wall = 100_000;
  let loads = 0;
  const clocks = createRealmClocks(() => wall);
  const holds = createHolds({
    clocks,
    isShared: (id) => shared.has(id),
    loadSim: async () => { loads++; return sim; },
  });
  return { holds, clocks, step: (ms) => { wall += ms; }, loads: () => loads };
}

test("two readers of one shared realm get the same tick from the Phase 1 clock", async () => {
  const { holds, clocks, step } = setup();
  const a = await holds.read("realm-a");
  const b = await holds.read("realm-a");
  assert.equal(a.tick, 0);
  assert.equal(b.tick, a.tick);
  step(1_250);
  const a2 = await holds.read("realm-a");
  const b2 = await holds.read("realm-a");
  assert.equal(a2.tick, 12);
  assert.equal(b2.tick, a2.tick);
  assert.equal(clocks.tick("realm-a"), 12);
  assert.equal(holds.size, 1);
});

test("a stamp from one reader is visible to the other after the next tick boundary", async () => {
  const { holds, step } = setup();
  await holds.read("realm-a");
  step(500);
  const queued = await holds.intent("realm-a", "guest_alice", { type: "stamp" });
  assert.equal(queued.tick, 5);
  assert.equal(queued.pending, 1);
  assert.deepEqual(queued.stamps, []);
  step(100);
  const bob = await holds.read("realm-a");
  assert.equal(bob.tick, 6);
  assert.deepEqual(bob.stamps, [{ tick: 6, by: "guest_alice" }]);
  assert.equal(bob.pending, 0);
  const alice = await holds.read("realm-a");
  assert.deepEqual(alice.stamps, bob.stamps);
});

test("the stamp goes through the sim: it lands on the boundary even after a long gap", async () => {
  const { holds, step } = setup();
  await holds.intent("realm-a", "guest_alice", { type: "stamp" });
  step(60_000);
  const view = await holds.read("realm-a");
  assert.equal(view.tick, 600);
  assert.deepEqual(view.stamps, [{ tick: 1, by: "guest_alice" }]);
});

test("a full client state is refused", async () => {
  const { holds } = setup();
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const body of [save, JSON.parse(sim.serializeState(save)), { type: "stamp", state: save }, { type: "build", typeId: "keep" }, null, [], "stamp"]) {
    await assert.rejects(holds.intent("realm-a", "guest_alice", body), (e) => e instanceof HoldError && e.status === 400 && e.message === INTENT_ONLY);
  }
  assert.deepEqual((await holds.read("realm-a")).stamps, []);
});

test("an unshared realm gets no hold and loads no sim", async () => {
  const { holds, loads } = setup(new Set());
  assert.equal(await holds.read("realm-a"), null);
  assert.equal(await holds.intent("realm-a", "guest_alice", { type: "stamp" }), null);
  assert.equal(await holds.read("../saves/x"), null);
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("the live server marks no realm shared", () => {
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /const SHARED_REALMS = new Set\(\);/);
  assert.match(src, /const SHARED_SAVES = new Set\(\);/);
});

test("hold source copies no rules and touches no saves", () => {
  const src = fs.readFileSync(path.join(here, "hold.mjs"), "utf8");
  assert.doesNotMatch(src, /node:fs|from "fs"|saves|readSave|writeFile|resolveBattle|realmPower|matchup|Decimal|break_infinity/);
});
