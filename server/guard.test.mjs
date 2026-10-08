import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { safeDecode, guardRoute, BAD_ADDRESS, ROUTE_FAILED } from "./guard.mjs";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError } from "./hold.mjs";
import { createJoinableHolds, BAD_KEY } from "./join.mjs";
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

function boot() {
  let loads = 0;
  const wall = { ms: 100_000 };
  const clocks = createRealmClocks(() => wall.ms);
  const server = createJoinableHolds({ clocks, loadSim: async () => { loads++; return roomySim; }, now: () => wall.ms });
  return { ...server, clocks, step: (ms) => { wall.ms += ms; }, loads: () => loads };
}

const badKey = (e) => e instanceof HoldError && e.status === 403 && e.message === BAD_KEY;
const ALICE = "guest_alice";
const EVE = "guest_eve";

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

/** A raw GET, so a malformed path reaches the server exactly as written. */
function rawGet(port, pathText) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: pathText, method: "GET" }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { body += c; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
      res.on("aborted", () => reject(new Error("answer cut")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

test("safeDecode returns null for a bad percent-escape and decodes a good one", () => {
  for (const bad of ["%", "%E0%A4%A", "%zz", "abc%"]) assert.equal(safeDecode(bad), null, bad);
  assert.equal(safeDecode("guest_ab%20c"), "guest_ab c");
  assert.equal(safeDecode("/index.html"), "/index.html");
});

test("a route that rejects or throws is answered 500 and is not an unhandled rejection", async (t) => {
  const unhandled = [];
  const onUnhandled = (e) => unhandled.push(e);
  process.on("unhandledRejection", onUnhandled);
  const logged = [];
  const server = http.createServer(guardRoute(async (req, res) => {
    if (req.url === "/reject") throw new Error("boom");
    if (req.url === "/late") { res.writeHead(200); res.write("half"); throw new Error("late boom"); }
    res.writeHead(200);
    res.end("fine");
  }, (e) => logged.push(e.message)));
  const syncServer = http.createServer(guardRoute(() => { throw new Error("sync boom"); }, (e) => logged.push(e.message)));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => syncServer.listen(0, "127.0.0.1", resolve));
  t.after(() => { process.off("unhandledRejection", onUnhandled); server.closeAllConnections(); syncServer.closeAllConnections(); server.close(); syncServer.close(); });

  const port = server.address().port;
  const failed = await rawGet(port, "/reject");
  assert.equal(failed.status, 500);
  assert.deepEqual(JSON.parse(failed.body), { error: ROUTE_FAILED });
  await assert.rejects(rawGet(port, "/late"), "a half-sent answer is cut, not left hanging");
  const sync = await rawGet(syncServer.address().port, "/");
  assert.equal(sync.status, 500);
  const after = await rawGet(port, "/ok");
  assert.deepEqual([after.status, after.body], [200, "fine"], "the server still answers");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(unhandled, []);
  assert.deepEqual(logged, ["boom", "late boom", "sync boom"]);
});

test("a tick read still creates no clock", () => {
  const s = boot();
  assert.equal(s.clocks.peek("join-oak-hill"), 0);
  assert.equal(s.clocks.peek("../x"), null);
  assert.equal(s.clocks.size, 0);
});

test("a wrong hold key still does not spend", async () => {
  const s = boot();
  const alice = await s.join({ realm: "oak-hill" }, undefined, ALICE);
  s.step(10_000);
  const before = await s.read(alice.realmId, alice.key, ALICE);
  await assert.rejects(s.intent(alice.realmId, EVE, { type: "train" }, "not-the-key-at-all", EVE), badKey);
  await assert.rejects(s.intent(alice.realmId, EVE, { type: "cottage" }, undefined, EVE), badKey);
  const after = await s.read(alice.realmId, alice.key, ALICE);
  assert.deepEqual(after.stores, before.stores);
  assert.equal(after.training, before.training);
  assert.equal(after.cottages, before.cottages);
});

test("a foreign sign-in link is still ignored", () => {
  const mine = "AbCdEfGhIjKlMnOpQrStUvWx12";
  const theirs = "ZyXwVuTsRqPoNmLkJiHgFeDc98";
  assert.ok(!stateMatches(theirs, `${NONCE_COOKIE}=${mine}`));
  assert.ok(!stateMatches(theirs, ""));
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /stateMatches\(state, req\.headers\.cookie\)/);
});

test("a solo load does not join, and the guard marks no save shared", async () => {
  const s = boot();
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
  assert.match(src, /http\.createServer\(guardRoute\(/);
  assert.doesNotMatch(src, /decodeURIComponent/, "every decode goes through safeDecode");
  const guard = fs.readFileSync(path.join(here, "guard.mjs"), "utf8");
  assert.doesNotMatch(guard, /node:fs|applyOfflineProgress|resolveBattle|realmPower|matchup|SHARED|packages\/sim/);
});

test("live server: a bad percent-escape answers 400 and the server keeps serving pages, holds, and saves", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-guard-http-"));
  const dist = path.join(dir, "dist");
  fs.mkdirSync(dist);
  fs.writeFileSync(path.join(dist, "index.html"), "<!doctype html><title>Second Crown</title>");
  const port = await freePort();
  const child = spawn(process.execPath, [fileURLToPath(new URL("./index.mjs", import.meta.url))], {
    env: { ...process.env, PORT: String(port), DATA_DIR: path.join(dir, "data"), APP_DIST: dist },
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

  for (const bad of ["/profile/%E0%A4%A", "/profile/%", "/%zz", "/assets/%E0%A4%A.js"]) {
    const r = await rawGet(port, bad);
    assert.equal(r.status, 400, bad);
    assert.deepEqual(JSON.parse(r.body), { error: BAD_ADDRESS });
  }
  assert.equal(child.exitCode, null, "the process is still up");

  const health = await fetch(base + "/health");
  assert.equal(health.status, 200);
  const page = await fetch(base + "/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Second Crown/);

  const tick = await (await fetch(base + "/realm/join-oak-hill/tick")).json();
  assert.deepEqual(tick, { realmId: "join-oak-hill", tick: 0 }, "a tick read starts nothing");

  const guest = await (await fetch(base + "/guest?name=T", { method: "POST" })).json();
  const auth = { Authorization: `Bearer ${guest.token}`, "Content-Type": "application/json" };
  const profile = await fetch(base + "/profile/" + encodeURIComponent(guest.id));
  assert.equal(profile.status, 200, "a good escape still finds the profile");

  const join = (key) => fetch(base + "/join", {
    method: "POST", headers: { ...auth, ...(key ? { "X-Hold-Key": key } : {}) }, body: JSON.stringify({ realm: "oak-hill" }),
  });
  const made = await join();
  assert.equal(made.status, 200);
  const { key } = await made.json();
  assert.equal((await join("not-the-key-at-all")).status, 403);
  const again = await join(key);
  assert.equal(again.status, 200, "a keyed hold join still works");
  assert.equal((await again.json()).realmId, "join-oak-hill");

  const solo = JSON.stringify({
    meta: { version: 1, seed: 7, tick: 100, lastRealTime: 0, playTimeMs: 0 },
    resources: { gold: "50" }, buildings: [], units: [], citizens: [], realms: [], characters: [],
    opinions: [], wars: [], factions: [], inputLog: [], flags: {}, unlocks: [], board: {},
  });
  const put = await fetch(base + "/save", { method: "PUT", headers: auth, body: solo });
  assert.equal(put.status, 200, "a solo save still works");
  const got = await fetch(base + "/save", { headers: auth });
  assert.equal(got.status, 200);
  assert.equal(await got.text(), solo);
  const shown = await fetch(base + "/profile/" + encodeURIComponent(guest.id));
  assert.equal(shown.status, 200);
  assert.equal((await shown.json()).tick, 100);
});
