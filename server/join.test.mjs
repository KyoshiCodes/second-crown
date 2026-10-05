import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError } from "./hold.mjs";
import { createJoinableHolds, joinRealmId, JOIN_ONLY } from "./join.mjs";
import { keyedJoin } from "./testkeys.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

function setup() {
  let wall = 100_000;
  let loads = 0;
  const clocks = createRealmClocks(() => wall);
  const { holds, join: rawJoin, isJoined } = createJoinableHolds({ clocks, loadSim: async () => { loads++; return sim; } });
  const join = keyedJoin(rawJoin);
  return { holds, join, isJoined, step: (ms) => { wall += ms; }, loads: () => loads };
}

test("two joins on the same id see the same tick and the same stamp", async () => {
  const { holds, join, step } = setup();
  const alice = await join({ realm: "oak-hill" });
  step(300);
  const bob = await join({ realm: "  Oak-Hill " });
  assert.equal(alice.realmId, "join-oak-hill");
  assert.equal(bob.realmId, alice.realmId);
  assert.equal(bob.tick, 3);
  assert.equal((await join({ realm: "oak-hill" })).tick, bob.tick);
  await holds.intent(bob.realmId, "guest_alice", { type: "stamp" });
  step(100);
  const a = await join({ realm: "oak-hill" });
  const b = await holds.read(bob.realmId);
  assert.equal(a.tick, 4);
  assert.equal(b.tick, a.tick);
  assert.deepEqual(a.stamps, [{ tick: 4, by: "guest_alice" }]);
  assert.deepEqual(b.stamps, a.stamps);
  assert.equal(holds.size, 1);
});

test("a different id does not see that stamp", async () => {
  const { holds, join, step } = setup();
  const a = await join({ realm: "oak-hill" });
  await holds.intent(a.realmId, "guest_alice", { type: "stamp" });
  step(200);
  assert.equal((await holds.read(a.realmId)).stamps.length, 1);
  const other = await join({ realm: "elm-fen" });
  assert.equal(other.realmId, "join-elm-fen");
  assert.deepEqual(other.stamps, []);
  assert.equal(holds.size, 2);
});

test("a blank or bad id does not join and loads no sim", async () => {
  const { holds, join, loads } = setup();
  for (const realm of ["", "   ", "a b", "../saves/x", "x".repeat(25)]) {
    await assert.rejects(join({ realm }), (e) => e instanceof HoldError && e.status === 400);
  }
  assert.equal(joinRealmId(""), null);
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("a full client state is not accepted as the new realm", async () => {
  const { holds, join, loads } = setup();
  const save = sim.createGameState({ seed: 1, now: 0 });
  for (const body of [save, JSON.parse(sim.serializeState(save)), { realm: "oak-hill", state: save }, { realm: save }, null, [], "oak-hill"]) {
    await assert.rejects(join(body), (e) => e instanceof HoldError && e.status === 400);
  }
  await assert.rejects(join({ realm: "oak-hill", state: save }), (e) => e.message === JOIN_ONLY);
  assert.equal(holds.size, 0);
  assert.equal(loads(), 0);
});

test("an id nobody joined has no hold, and a solo realm id is never shared by a join", async () => {
  const { holds, join, isJoined } = setup();
  await join({ realm: "oak-hill" });
  assert.equal(await holds.read("oak-hill"), null);
  assert.equal(await holds.read("join-elm-fen"), null);
  assert.equal(await holds.read("guest_alice"), null);
  assert.equal(isJoined("join-oak-hill"), true);
  assert.equal(isJoined("guest_alice"), false);
});

test("the live server joins under a prefix and marks no save shared", () => {
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /const SHARED_SAVES = new Set\(\);/);
  assert.match(src, /const SHARED_REALMS = new Set\(\);/);
  assert.match(src, /createJoinableHolds\(/);
  assert.doesNotMatch(src, /SHARED_SAVES\.add/);
});

test("join source copies no rules and touches no saves", () => {
  const src = fs.readFileSync(path.join(here, "join.mjs"), "utf8");
  assert.doesNotMatch(src, /node:fs|from "fs"|readSave|writeFile|applyOfflineProgress|resolveBattle|realmPower|matchup|Decimal|break_infinity/);
});
