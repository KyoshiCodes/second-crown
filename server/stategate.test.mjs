// wave/save-gate: a client cannot send a full game state and have the server take it as the realm.
// A shared hold takes only an intent; a body shaped like a save, or like the kept hold itself, is
// refused and the stored hold stays byte for byte. Solo cloud saves still go through gateSave as before.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { INTENT_ONLY } from "./hold.mjs";
import { JOIN_ONLY } from "./join.mjs";

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function startServer(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-state-gate-"));
  const data = path.join(dir, "data");
  const port = await freePort();
  const child = spawn(process.execPath, [fileURLToPath(new URL("./index.mjs", import.meta.url))], {
    env: { ...process.env, PORT: String(port), DATA_DIR: data, APP_DIST: path.join(dir, "no-dist") },
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
  return { base: "http://127.0.0.1:" + port, saves: path.join(data, "saves") };
}

function soloSave(tick, over = {}) {
  return {
    meta: { version: 1, seed: 7, tick, lastRealTime: 0, playTimeMs: 0 },
    resources: { gold: "50", food: "10", wood: "10", stone: "0" }, buildings: [],
    units: [{ id: "u", typeId: "militia", realmId: "player", count: "3", armyId: null }],
    citizens: [], realms: [], characters: [], opinions: [], wars: [], factions: [],
    inputLog: [], flags: {}, unlocks: [], board: {},
    ...over,
  };
}

test("live server: a full state never replaces a shared hold or joins one; an intent still lands", async (t) => {
  const { base, saves } = await startServer(t);
  const guest = await (await fetch(base + "/guest?name=Gate", { method: "POST" })).json();
  const auth = { Authorization: `Bearer ${guest.token}`, "Content-Type": "application/json" };
  const post = (route, body, key) => fetch(base + route, {
    method: "POST", headers: { ...auth, ...(key ? { "X-Hold-Key": key } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

  // A solo crown in the cloud, pushed the usual way.
  const solo = JSON.stringify(soloSave(100));
  assert.equal((await fetch(base + "/save", { method: "PUT", headers: auth, body: solo })).status, 200);
  const soloFile = path.join(saves, `${guest.id}.json`);

  // A shared hold, made by the server, with one allowed intent on it.
  const made = await post("/join", { realm: "oak-hill" });
  assert.equal(made.status, 200);
  const { key } = await made.json();
  const stamp = await post("/realm/join-oak-hill/intent", { type: "stamp" }, key);
  assert.equal(stamp.status, 200, "an allowed intent still works");
  const holdFile = path.join(saves, "join-oak-hill.json");
  const keptHold = fs.readFileSync(holdFile, "utf8");
  const before = await (await fetch(base + "/realm/join-oak-hill/hold", { headers: { ...auth, "X-Hold-Key": key } })).json();

  // Bodies that look like a whole realm: a solo save (small and padded past the intent size),
  // the server's own kept hold record with richer stores, and an intent with a state glued on.
  const forged = JSON.parse(keptHold);
  const richer = JSON.parse(forged.state);
  richer.resources = Object.fromEntries(Object.keys(richer.resources).map((r) => [r, "1e300"]));
  const states = [
    soloSave(5_000, { resources: { gold: "1e300", food: "1e300", wood: "1e300", stone: "1e300" } }),
    { ...forged, state: JSON.stringify(richer) },
    { type: "train", ...soloSave(5_000) },
    { realm: "oak-hill", state: JSON.stringify(richer) },
    soloSave(5_000, { flags: { pad: "x".repeat(4096) } }),
  ];
  // Intent and join bodies are capped at 1 KB. A bigger state is cut off before it is read: the
  // connection closes with no answer. A smaller one is read and refused with 400.
  const refused = async (res, error) => {
    const r = await res.catch(() => null);
    if (r === null) return "closed";
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, error);
    return 400;
  };
  for (const state of states) {
    const small = Buffer.byteLength(JSON.stringify(state)) <= 1024;
    const want = small ? 400 : "closed";
    assert.equal(await refused(post("/realm/join-oak-hill/intent", state, key), INTENT_ONLY), want, "intent refuses a state");
    for (const k of [undefined, key]) {
      assert.equal(await refused(post("/join", state, k), JOIN_ONLY), want, "join refuses a state");
    }
    if (small) {
      const owner = await post(`/realm/${guest.id}/intent`, state);
      assert.equal(owner.status, 404, "a solo account id is never a shared realm");
    }
  }
  assert.equal(fs.readFileSync(holdFile, "utf8"), keptHold, "the stored hold is unchanged");
  const after = await (await fetch(base + "/realm/join-oak-hill/hold", { headers: { ...auth, "X-Hold-Key": key } })).json();
  const marks = (v) => v.stamps.length + v.pending; // a stamp is pending until the next tick boundary
  assert.equal(marks(after), marks(before));
  assert.equal(after.militia, before.militia);
  assert.equal(after.training, before.training);
  assert.equal(after.farms, before.farms);

  // A kept hold record is not a save either: PUT /save refuses it and the solo crown stays.
  const put = await fetch(base + "/save", { method: "PUT", headers: auth, body: keptHold });
  assert.equal(put.status, 400);
  assert.equal(fs.readFileSync(soloFile, "utf8"), solo, "the stored solo save is unchanged");

  // The allowed intent still lands after all the refusals.
  const again = await post("/realm/join-oak-hill/intent", { type: "stamp" }, key);
  assert.equal(again.status, 200);
  assert.equal(marks(await again.json()), marks(before) + 1);
});

test("live server: a solo load does not join, and solo push is unchanged", async (t) => {
  const { base, saves } = await startServer(t);
  const guest = await (await fetch(base + "/guest?name=Solo", { method: "POST" })).json();
  const auth = { Authorization: `Bearer ${guest.token}`, "Content-Type": "application/json" };

  const first = JSON.stringify(soloSave(100));
  assert.equal((await fetch(base + "/save", { method: "PUT", headers: auth, body: first })).status, 200);
  const next = JSON.stringify(soloSave(150, { inputLog: [{ tick: 120, type: "build" }] }));
  assert.equal((await fetch(base + "/save", { method: "PUT", headers: auth, body: next })).status, 200, "a solo push still goes through the save gate");
  const got = await fetch(base + "/save", { headers: auth });
  assert.equal(got.status, 200);
  assert.equal(await got.text(), next);

  assert.deepEqual(fs.readdirSync(saves), [`${guest.id}.json`], "no hold file was made");
  const hold = await fetch(base + `/realm/${guest.id}/hold`, { headers: auth });
  assert.equal(hold.status, 404, "the solo crown is not a shared realm");
  const tick = await (await fetch(base + `/realm/${guest.id}/tick`)).json();
  assert.equal(tick.tick, 0, "no realm clock started");
  assert.deepEqual(fs.readdirSync(saves), [`${guest.id}.json`]);
});
