import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { createHoldStore } from "./keep.mjs";

const sim = await loadSimFromSource();
const ALICE = "guest_alice";
const EVE = "guest_eve";
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "sc-reload-"));

/** One server process. A second call with the same dir is a restart: fresh memory, same disk. */
function boot(dir, wall) {
  const clocks = createRealmClocks(() => wall.ms);
  const store = createHoldStore(dir);
  return createJoinableHolds({ clocks, loadSim: async () => sim, store, now: () => wall.ms });
}

const keptState = (dir) => sim.deserializeState(JSON.parse(fs.readFileSync(path.join(dir, "join-oak-hill.json"), "utf8")).state);

test("a fresh hold restart does not add a farm worker before its lumber camp is done", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const s = boot(dir, wall);
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  const before = keptState(dir);
  assert.ok(before.buildings.some((b) => b.typeId === "lumber_camp" && b.completesAtTick !== null), "lumber camp still building");
  assert.equal(before.citizens.length, 0);

  const again = boot(dir, wall); // restart at the same wall time
  await again.join({ realm: "oak-hill" }, alice.key, EVE);
  await again.intent(alice.realmId, EVE, { type: "stamp" }, alice.key, EVE); // written through the reloaded hold
  const after = keptState(dir);
  assert.equal(after.citizens.filter((c) => c.job === "farmer").length, 0, "no farm worker from the restart");
  assert.deepEqual(after.citizens, before.citizens);
});

test("a hold's empty army survives a restart", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const s = boot(dir, wall);
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  const file = path.join(dir, "join-oak-hill.json");
  const kept = JSON.parse(fs.readFileSync(file, "utf8"));
  const state = JSON.parse(kept.state);
  state.units = [];
  state.citizens = [];
  kept.state = JSON.stringify(state);
  fs.writeFileSync(file, JSON.stringify(kept));

  const again = boot(dir, wall);
  await again.join({ realm: "oak-hill" }, alice.key, EVE);
  await again.intent(alice.realmId, EVE, { type: "stamp" }, alice.key, EVE);
  const after = keptState(dir);
  assert.deepEqual(after.units, []);
  assert.deepEqual(after.citizens, []);
});
