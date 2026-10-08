import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError, FULL, HOLD_IDLE_MS } from "./hold.mjs";
import { createJoinableHolds, BAD_KEY } from "./join.mjs";
import { createHoldStore } from "./keep.mjs";
import { createAddressCap, GUEST_CAP, HOLD_CAP, MAX_GUESTS_PER_ADDRESS, MAX_NEW_HOLDS_PER_ADDRESS, DAY_MS } from "./cap.mjs";
import { NONCE_COOKIE, stateMatches } from "./nonce.mjs";
import { gateSave } from "./savegate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sim = await loadSimFromSource();

// Test-only: one finished cottage in the new game, so a farm has a free work plot.
const roomySim = {
  ...sim,
  createGameState(opts) {
    const state = sim.createGameState(opts);
    state.buildings.push({ id: "b_test_cottage", typeId: "cottage", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null });
    return state;
  },
};

function boot({ dir = null, wall = { ms: 100_000 }, maxJoins, holdCap = null } = {}) {
  let loads = 0;
  const clocks = createRealmClocks(() => wall.ms);
  const server = createJoinableHolds({
    clocks,
    loadSim: async () => { loads++; return roomySim; },
    store: dir ? createHoldStore(dir) : null,
    now: () => wall.ms,
    ...(maxJoins ? { maxJoins } : {}),
    holdCap,
  });
  return { ...server, clocks, wall, step: (ms) => { wall.ms += ms; }, loads: () => loads };
}

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "sc-cap-"));
const badKey = (e) => e instanceof HoldError && e.status === 403 && e.message === BAD_KEY;
const full = (e) => e instanceof HoldError && e.status === 503 && e.message === FULL;
const capped = (e) => e instanceof HoldError && e.status === 429 && e.message === HOLD_CAP;
const ALICE = "guest_alice";
const BOB = "guest_bob";
const EVE = "guest_eve";

test("a tick read for an unknown id creates no clock and does not block a later join", async () => {
  const s = boot();
  assert.equal(s.clocks.peek("join-oak-hill"), 0);
  for (let i = 0; i < 20_000; i++) assert.equal(s.clocks.peek("join-x" + i), 0);
  assert.equal(s.clocks.peek("../x"), null);
  assert.equal(s.clocks.size, 0, "reads start no clock");
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  assert.equal(s.clocks.size, 1, "the join starts the clock");
  s.step(1000);
  assert.equal(s.clocks.peek("join-oak-hill"), 10);
  assert.equal((await s.read(alice.realmId, alice.key, ALICE)).tick, 10);
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /realmClocks\.peek\(realmId\)/);
  assert.doesNotMatch(src, /realmClocks\.tick\(/, "no public route starts a clock");
});

test("the address cap counts per address and per day", () => {
  const wall = { ms: 0 };
  const cap = createAddressCap({ max: 2, now: () => wall.ms });
  assert.ok(cap.take("1.1.1.1"));
  assert.ok(cap.take("1.1.1.1"));
  assert.ok(!cap.take("1.1.1.1"));
  assert.ok(cap.take("2.2.2.2"), "another address has its own count");
  wall.ms += DAY_MS;
  assert.ok(cap.take("1.1.1.1"), "a new day");
  const tiny = createAddressCap({ max: 5, maxAddresses: 1, now: () => wall.ms });
  assert.ok(tiny.take("a"));
  assert.ok(!tiny.take("b"), "a full address table refuses, it does not let through");
});

test("after the hold cap a further create is refused and an existing keyed hold still opens", async () => {
  const s = boot({ holdCap: createAddressCap({ max: MAX_NEW_HOLDS_PER_ADDRESS, now: () => 0 }) });
  const made = [];
  for (let i = 0; i < MAX_NEW_HOLDS_PER_ADDRESS; i++) made.push(await s.join({ realm: `hold-${i}` }, undefined, `guest_${i}`, "6.6.6.6"));
  await assert.rejects(s.join({ realm: "one-more" }, undefined, EVE, "6.6.6.6"), capped);
  assert.equal(s.isJoined("join-one-more"), false);
  assert.equal(s.holds.size, MAX_NEW_HOLDS_PER_ADDRESS);
  // The same address can still open what it has, and another address can still make one.
  assert.equal((await s.join({ realm: "hold-0" }, made[0].key, BOB, "6.6.6.6")).realmId, "join-hold-0");
  assert.equal((await s.read(made[1].realmId, made[1].key, EVE)).realmId, "join-hold-1");
  assert.match((await s.join({ realm: "one-more" }, undefined, ALICE, "7.7.7.7")).key, /^[A-Za-z0-9_-]{16}$/);
});

test("a full table with no idle hold refuses a new hold and still opens a joined one", async () => {
  const s = boot({ dir: tempDir(), maxJoins: 2 });
  const a = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  await s.join({ realm: "elm-fen" }, undefined, BOB);
  await assert.rejects(s.join({ realm: "ash-moor" }, undefined, EVE), full);
  assert.equal((await s.read(a.realmId, a.key, ALICE)).realmId, a.realmId);
});

test("dropping an idle hold from memory keeps its save, and the same key opens it again", async () => {
  const dir = tempDir();
  const s = boot({ dir, maxJoins: 1 });
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  s.step(10_000);
  const built = await s.intent(alice.realmId, ALICE, { type: "cottage" }, alice.key, ALICE);
  const file = path.join(dir, "join-oak-hill.json");

  s.step(HOLD_IDLE_MS);
  const bob = await s.join({ realm: "elm-fen" }, undefined, BOB);
  assert.equal(s.holds.has("join-oak-hill"), false, "dropped from memory");
  assert.equal(s.isJoined("join-oak-hill"), false);
  assert.ok(fs.existsSync(file), "its save stays on disk");
  const kept = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.ok(JSON.parse(kept.state).meta.tick >= built.tick + HOLD_IDLE_MS / 100, "written up to its clock");

  // A different id cannot read it with its key, and a wrong key does not open or spend it.
  s.step(HOLD_IDLE_MS);
  await assert.rejects(s.read(bob.realmId, alice.key, EVE), badKey);
  await assert.rejects(s.intent(alice.realmId, EVE, { type: "train" }, "wrong-key-12345", EVE), badKey);
  await assert.rejects(s.join({ realm: "oak-hill" }, undefined, EVE), badKey, "no fresh hold over the kept one");

  const back = await s.read(alice.realmId, alice.key, ALICE);
  assert.equal(back.cottages, built.cottages);
  assert.equal(back.training, 0, "the wrong key spent nothing");
  assert.ok(back.tick >= built.tick + 2 * HOLD_IDLE_MS / 100, "its clock kept counting while dropped");
  assert.equal(s.holds.has("join-elm-fen"), false, "the idle one made room");
  assert.ok(fs.existsSync(path.join(dir, "join-elm-fen.json")));
});

test("without a store no hold is dropped: it would be lost", async () => {
  const s = boot({ maxJoins: 1 });
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  s.step(HOLD_IDLE_MS * 2);
  await assert.rejects(s.join({ realm: "elm-fen" }, undefined, BOB), full);
  assert.equal((await s.read(alice.realmId, alice.key, ALICE)).realmId, alice.realmId);
});

test("a foreign sign-in link is still ignored", () => {
  const mine = "AbCdEfGhIjKlMnOpQrStUvWx12";
  const theirs = "ZyXwVuTsRqPoNmLkJiHgFeDc98";
  assert.ok(!stateMatches(theirs, `${NONCE_COOKIE}=${mine}`));
  assert.ok(!stateMatches(theirs, ""));
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /stateMatches\(state, req\.headers\.cookie\)/);
});

test("a solo load does not join, and no save is marked shared", async () => {
  const s = boot({ holdCap: createAddressCap({ max: 1 }) });
  const solo = {
    meta: { version: 1, seed: 7, tick: 100, lastRealTime: 0, playTimeMs: 0 },
    resources: { gold: "50" }, buildings: [], units: [], citizens: [], realms: [], characters: [],
    opinions: [], wars: [], factions: [], inputLog: [], flags: {}, unlocks: [], board: {},
  };
  assert.ok(gateSave(JSON.stringify(solo), null, 0));
  for (const id of ["player", ALICE, "discord_1"]) assert.equal(await s.read(id), null);
  assert.equal(s.loads(), 0);
  assert.equal(s.clocks.size, 0);
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /const SHARED_SAVES = new Set\(\);/);
  assert.doesNotMatch(src, /SHARED_SAVES\.add/);
  for (const f of ["cap.mjs", "join.mjs", "hold.mjs"]) {
    const code = fs.readFileSync(path.join(here, f), "utf8");
    assert.doesNotMatch(code, /applyOfflineProgress|resolveBattle|realmPower|matchup/, f);
  }
});

test("live server: guest cap refuses more guests, tick reads start nothing, a keyed hold still opens", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-cap-http-"));
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL("./index.mjs", import.meta.url))], {
    env: { ...process.env, PORT: String(port), DATA_DIR: dir, APP_DIST: path.join(dir, "no-dist") },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  t.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, "exit"); }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
    child.stdout.once("data", () => { clearTimeout(timeout); resolve(); });
    child.once("exit", (code) => { clearTimeout(timeout); reject(new Error("Server exited: " + code)); });
  });
  const base = "http://127.0.0.1:" + port;
  const guest = () => fetch(base + "/guest?name=T", { method: "POST" });
  const join = (token, realm, key) => fetch(base + "/join", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(key ? { "X-Hold-Key": key } : {}) },
    body: JSON.stringify({ realm }),
  });

  const tick = await (await fetch(base + "/realm/join-oak-hill/tick")).json();
  assert.deepEqual(tick, { realmId: "join-oak-hill", tick: 0 });

  const first = await (await guest()).json();
  const made = await join(first.token, "oak-hill");
  assert.equal(made.status, 200);
  const { key } = await made.json();
  for (let i = 1; i < MAX_NEW_HOLDS_PER_ADDRESS; i++) assert.equal((await join(first.token, `more-${i}`)).status, 200);
  const overHolds = await join(first.token, "one-too-many");
  assert.equal(overHolds.status, 429);
  assert.equal((await overHolds.json()).error, HOLD_CAP);

  for (let i = 1; i < MAX_GUESTS_PER_ADDRESS; i++) assert.equal((await guest()).status, 200);
  const overGuests = await guest();
  assert.equal(overGuests.status, 429);
  assert.equal((await overGuests.json()).error, GUEST_CAP);
  const users = JSON.parse(fs.readFileSync(path.join(dir, "users.json"), "utf8"));
  assert.equal(Object.keys(users).length, MAX_GUESTS_PER_ADDRESS, "the refused guest was not written");

  const again = await join(first.token, "oak-hill", key);
  assert.equal(again.status, 200, "an existing keyed hold still opens");
  assert.equal((await again.json()).realmId, "join-oak-hill");
});
