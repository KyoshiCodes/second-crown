import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, SETTLE_SAVE_MS } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { createHoldStore, downTicks, MAX_OFFLINE_MS } from "./keep.mjs";
import { TICK_MS } from "./clock.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sc-keep-"));
}

/** A store that counts its reads and writes. */
function spyStore(dir) {
  const real = createHoldStore(dir);
  const calls = { load: [], save: [] };
  return {
    calls,
    load: (id) => { calls.load.push(id); return real.load(id); },
    save: (id, rec) => { calls.save.push(id); return real.save(id, rec); },
  };
}

/** One server process. A second call with the same dir and wall is a restart: fresh memory, same disk. */
function boot(dir, wall) {
  const clocks = createRealmClocks(() => wall.ms);
  const store = spyStore(dir);
  const { holds, join } = createJoinableHolds({ clocks, loadSim: async () => sim, store, now: () => wall.ms });
  return { holds, join, clocks, store };
}

test("MAX_OFFLINE_MS mirrors packages/shared", () => {
  const shared = fs.readFileSync(path.join(here, "../packages/shared/src/index.ts"), "utf8");
  const m = /MAX_OFFLINE_MS = ([\d\s*]+);/.exec(shared);
  assert.ok(m, "packages/shared exports MAX_OFFLINE_MS");
  assert.equal(Function(`return ${m[1]}`)(), MAX_OFFLINE_MS);
});

test("a cottage survives dropping the in-memory hold", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const view = await first.join({ realm: "oak-hill" });
  wall.ms += 10_000;
  const built = await first.holds.intent(view.realmId, "guest_alice", { type: "cottage" });
  assert.equal(built.cottages, 1);
  assert.ok(fs.existsSync(path.join(dir, "join-oak-hill.json")), "the hold was written by realm id");

  // Restart: new memory, new clocks, same save folder.
  const second = boot(dir, wall);
  assert.equal(second.holds.size, 0);
  const back = await second.join({ realm: "oak-hill" });
  assert.equal(back.cottages, 1);
  assert.equal(back.farms, built.farms);
  assert.equal(back.militia, built.militia);
  assert.deepEqual(back.stores, built.stores);
  assert.equal(back.tick, built.tick);
});

test("farms, cottages, and militia all come back after a restart", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const { realmId } = await first.join({ realm: "oak-hill" });
  wall.ms += 10_000;
  await first.holds.intent(realmId, "guest_alice", { type: "cottage" });
  await first.holds.intent(realmId, "guest_alice", { type: "train" });
  wall.ms += 20_000; // cottage and militia finish
  await first.holds.intent(realmId, "guest_bob", { type: "build" });
  const before = await first.holds.read(realmId);
  assert.equal(before.farms, 2);
  assert.ok(before.militia >= 1);

  const second = boot(dir, wall);
  const after = await second.join({ realm: "oak-hill" });
  assert.equal(after.farms, before.farms);
  assert.equal(after.cottages, before.cottages);
  assert.equal(after.militia, before.militia);
});

test("the clock counts the time the process was down", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const { realmId } = await first.join({ realm: "oak-hill" });
  wall.ms += 10_000;
  const saved = await first.holds.intent(realmId, "guest_alice", { type: "cottage" });

  wall.ms += 30_000; // down for 30 seconds
  const second = boot(dir, wall);
  const back = await second.join({ realm: "oak-hill" });
  assert.equal(back.tick, saved.tick + 30_000 / TICK_MS);
  assert.equal(second.clocks.tick(realmId), back.tick, "GET /realm/:id/tick agrees with the hold");
  assert.ok(Number(back.stores.food) > Number(saved.stores.food), "the sim settled the down time");
});

test("down time is capped like solo offline catch-up", () => {
  assert.equal(downTicks(0, 60_000), 600);
  assert.equal(downTicks(0, MAX_OFFLINE_MS), MAX_OFFLINE_MS / TICK_MS);
  assert.equal(downTicks(0, MAX_OFFLINE_MS * 3), MAX_OFFLINE_MS / TICK_MS);
  assert.equal(downTicks(50_000, 10_000), 0);
});

test("a different id starts empty", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const { realmId } = await first.join({ realm: "oak-hill" });
  wall.ms += 10_000;
  await first.holds.intent(realmId, "guest_alice", { type: "cottage" });

  const second = boot(dir, wall);
  const elm = await second.join({ realm: "elm-fen" });
  assert.equal(elm.cottages, 0);
  assert.equal(elm.tick, 0);
  assert.equal((await second.join({ realm: "oak-hill" })).cottages, 1);
});

test("a kept file that names another realm is not loaded", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const { realmId } = await first.join({ realm: "oak-hill" });
  wall.ms += 10_000;
  await first.holds.intent(realmId, "guest_alice", { type: "cottage" });
  fs.copyFileSync(path.join(dir, "join-oak-hill.json"), path.join(dir, "join-elm-fen.json"));

  const second = boot(dir, wall);
  assert.equal((await second.join({ realm: "elm-fen" })).cottages, 0);
});

test("a solo load does not read the hold file", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const first = boot(dir, wall);
  const { realmId } = await first.join({ realm: "oak-hill" });
  wall.ms += 10_000;
  await first.holds.intent(realmId, "guest_alice", { type: "cottage" });

  const second = boot(dir, wall);
  for (const id of ["guest_alice", "discord_1", "player", "oak-hill", "join-oak-hill"]) {
    assert.equal(await second.holds.read(id), null, `${id} is not joined in this process`);
    assert.equal(await second.holds.intent(id, "guest_alice", { type: "train" }), null);
  }
  assert.deepEqual(second.store.calls.load, []);
  assert.deepEqual(second.store.calls.save, []);
  assert.equal(second.holds.size, 0);
});

test("settled ticks are written, throttled; an intent is written at once", async () => {
  const dir = tempDir();
  const wall = { ms: 100_000 };
  const { holds, join, store } = boot(dir, wall);
  const { realmId } = await join({ realm: "oak-hill" });
  const afterJoin = store.calls.save.length;
  wall.ms += 1000;
  await holds.read(realmId);
  assert.equal(store.calls.save.length, afterJoin, "under the throttle: not written");
  wall.ms += SETTLE_SAVE_MS;
  await holds.read(realmId);
  assert.equal(store.calls.save.length, afterJoin + 1);
  await holds.intent(realmId, "guest_alice", { type: "stamp" });
  assert.equal(store.calls.save.length, afterJoin + 2);
});

test("index keeps holds in the save folder and never marks a solo save shared", () => {
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /createHoldStore\(SAVES\)/);
  assert.match(src, /const SHARED_SAVES = new Set\(\);/);
  assert.doesNotMatch(src, /SHARED_SAVES\.add/);
  const keep = fs.readFileSync(path.join(here, "keep.mjs"), "utf8");
  assert.doesNotMatch(keep, /applyOfflineProgress|resolveBattle|tryBuild|tryTrain|workPlotCap|Decimal/);
});
