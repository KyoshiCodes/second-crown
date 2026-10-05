import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NONCE_COOKIE, NONCE_RE, isNonce, nonceCookie, clearNonceCookie, readNonceCookie, stateMatches, callbackHash,
} from "./nonce.mjs";
import { createRealmClocks } from "./realmclock.mjs";
import { loadSimFromSource, HoldError } from "./hold.mjs";
import { createJoinableHolds, BAD_KEY } from "./join.mjs";
import { gateSave } from "./savegate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const MINE = "AbCdEfGhIjKlMnOpQrStUvWx12";
const THEIRS = "ZyXwVuTsRqPoNmLkJiHgFeDc98";
const jar = (nonce) => `other=1; ${NONCE_COOKIE}=${nonce}`;

test("the nonce pattern mirrors the client", () => {
  const client = fs.readFileSync(path.join(here, "../packages/app/src/net/login.ts"), "utf8");
  assert.equal(/NONCE_RE = (\/.+\/);/.exec(client)[1], String(NONCE_RE));
  assert.ok(isNonce(MINE));
  assert.ok(!isNonce(""));
  assert.ok(!isNonce("short"));
  assert.ok(!isNonce(`${MINE}; Path=/`));
});

test("a callback whose state matches the nonce this browser stored is accepted", () => {
  assert.equal(readNonceCookie(jar(MINE)), MINE);
  assert.ok(stateMatches(MINE, jar(MINE)));
});

test("a callback with someone else's state, or no stored nonce, is refused", () => {
  assert.ok(!stateMatches(THEIRS, jar(MINE)));
  assert.ok(!stateMatches(MINE, ""));
  assert.ok(!stateMatches(MINE, undefined));
  assert.ok(!stateMatches(null, jar(MINE)));
  assert.ok(!stateMatches("", `${NONCE_COOKIE}=`));
});

test("a nonce that was already used is refused: the callback clears it", () => {
  const cleared = clearNonceCookie();
  assert.match(cleared, /Max-Age=0/);
  const after = cleared.split(";")[0]; // what the browser sends back after the clear
  assert.ok(!stateMatches(MINE, after));
});

test("the cookie is HttpOnly, Lax, short-lived, and scoped to the Discord login", () => {
  const c = nonceCookie(MINE);
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Lax/);
  assert.match(c, /Path=\/auth\/discord/);
  assert.match(c, /Max-Age=600/);
});

test("the callback hash carries the nonce back for the browser to check", () => {
  const p = new URLSearchParams(callbackHash("tok", "Ann & Bo", MINE));
  assert.equal(p.get("cloud_token"), "tok");
  assert.equal(p.get("cloud_name"), "Ann & Bo");
  assert.equal(p.get("cloud_nonce"), MINE);
});

test("the server wires the nonce into both Discord routes", () => {
  const src = fs.readFileSync(path.join(here, "index.mjs"), "utf8");
  assert.match(src, /isNonce\(state\)/);
  assert.match(src, /stateMatches\(state, req\.headers\.cookie\)/);
  assert.match(src, /callbackHash\(token, users\[id\]\.name, state\)/);
  assert.doesNotMatch(src, /back\.hash = `cloud_token=/);
});

test("a hold join still needs the hold key", async () => {
  const sim = await loadSimFromSource();
  let ms = 100_000;
  const holds = createJoinableHolds({
    clocks: createRealmClocks(() => ms), loadSim: async () => sim, store: null, now: () => ms,
  });
  const first = await holds.join({ realm: "oak-hill" }, undefined, "guest_alice");
  ms += 1000;
  const badKey = (e) => e instanceof HoldError && e.status === 403 && e.message === BAD_KEY;
  await assert.rejects(holds.join({ realm: "oak-hill" }, undefined, "guest_eve"), badKey);
  assert.equal((await holds.join({ realm: "oak-hill" }, first.key, "guest_bob")).realmId, "join-oak-hill");
});

test("a solo load does not join", async () => {
  let joins = 0;
  const holds = createJoinableHolds({
    clocks: createRealmClocks(() => 0), loadSim: async () => { joins++; }, store: null, now: () => 0,
  });
  const solo = {
    meta: { version: 1, seed: 7, tick: 100, lastRealTime: 0, playTimeMs: 0 },
    resources: { gold: "50" }, buildings: [], units: [], citizens: [], realms: [], characters: [],
    opinions: [], wars: [], factions: [], inputLog: [], flags: {}, unlocks: [], board: {},
  };
  assert.ok(gateSave(JSON.stringify(solo), null, 0));
  assert.equal(joins, 0);
  assert.equal(await holds.read("player"), null, "no hold exists for a solo realm");
});
