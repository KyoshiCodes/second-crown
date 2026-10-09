import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { newGuestId, claimGuestId, GUEST_ID_BYTES, GUEST_ID_TRIES } from "./guestid.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

const save = (tick, gold) => JSON.stringify({
  meta: { version: 1, seed: 7, tick, lastRealTime: 0, playTimeMs: 0 },
  resources: { gold }, buildings: [], units: [], citizens: [], realms: [], characters: [],
  opinions: [], wars: [], factions: [], inputLog: [], flags: {}, unlocks: [], board: {},
});

test("many new guest ids are unique and keep the guest_ prefix", () => {
  const seen = new Set();
  for (let i = 0; i < 50_000; i++) {
    const id = newGuestId();
    assert.match(id, new RegExp(`^guest_[0-9a-f]{${GUEST_ID_BYTES * 2}}$`));
    seen.add(id);
  }
  assert.equal(seen.size, 50_000);
});

test("a repeated guest id is refused, never handed out twice", () => {
  const issued = new Set();
  const taken = (id) => issued.has(id);
  const first = claimGuestId(taken, () => "same");
  assert.equal(first, "guest_same");
  issued.add(first);

  let draws = 0;
  assert.equal(claimGuestId(taken, () => { draws++; return "same"; }), null, "a repeat is refused");
  assert.equal(draws, GUEST_ID_TRIES);

  const queue = ["same", "fresh"];
  assert.equal(claimGuestId(taken, () => queue.shift()), "guest_fresh", "a repeat draw is thrown away");
});

test("guest ids touch no combat rule and no shared save", () => {
  const code = fs.readFileSync(path.join(here, "guestid.mjs"), "utf8");
  assert.doesNotMatch(code, /applyOfflineProgress|resolveBattle|realmPower|matchup|SHARED_SAVES|SHARED_REALMS/);
});

test("live server: a new guest never lands on an old save, and an old token opens only its own save", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-guestid-"));
  // Two guests from before this wave, with the old short ids.
  const old = {
    guest_abc123: { id: "guest_abc123", name: "Ann", token: "a".repeat(32), kind: "guest" },
    guest_def456: { id: "guest_def456", name: "Ben", token: "b".repeat(32), kind: "guest" },
  };
  const annSave = save(100, "11");
  const benSave = save(200, "22");
  fs.mkdirSync(path.join(dir, "saves"), { recursive: true });
  fs.writeFileSync(path.join(dir, "users.json"), JSON.stringify(old));
  fs.writeFileSync(path.join(dir, "saves", "guest_abc123.json"), annSave);
  fs.writeFileSync(path.join(dir, "saves", "guest_def456.json"), benSave);

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
  const auth = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
  const getSave = (token) => fetch(base + "/save", { headers: auth(token) });

  const made = [];
  for (let i = 0; i < 5; i++) {
    const r = await fetch(base + "/guest?name=New", { method: "POST" });
    assert.equal(r.status, 200);
    made.push(await r.json());
  }
  assert.equal(new Set(made.map((g) => g.id)).size, made.length, "new guest ids are unique");
  for (const g of made) {
    assert.ok(!(g.id in old), "a new guest does not take an old id");
    assert.equal((await getSave(g.token)).status, 404, "a new guest starts with no cloud save");
  }

  const users = JSON.parse(fs.readFileSync(path.join(dir, "users.json"), "utf8"));
  assert.deepEqual(users.guest_abc123, old.guest_abc123, "old accounts are not written over");
  assert.deepEqual(users.guest_def456, old.guest_def456);

  const ann = await getSave(old.guest_abc123.token);
  assert.equal(ann.status, 200);
  assert.equal(await ann.text(), annSave, "an old guest token still opens its own save");
  assert.equal(await (await getSave(old.guest_def456.token)).text(), benSave, "and not another guest's");

  const mine = save(50, "5");
  assert.equal((await fetch(base + "/save", { method: "PUT", headers: auth(made[0].token), body: mine })).status, 200);
  assert.equal(await (await getSave(made[0].token)).text(), mine);
  assert.equal((await getSave(made[1].token)).status, 404, "one new guest's save is not another's");
  assert.equal(await (await getSave(old.guest_abc123.token)).text(), annSave);

  const me = await (await fetch(base + "/me", { headers: auth(old.guest_abc123.token) })).json();
  assert.equal(me.id, "guest_abc123");
});
