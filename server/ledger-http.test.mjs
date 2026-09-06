import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

test("real routes: Discord auth, concurrent purchases, request validation, unchanged saves", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-ledger-http-"));
  fs.writeFileSync(path.join(dir, "users.json"), JSON.stringify({
    discord_a: { id: "discord_a", token: "alice", kind: "discord", name: "Alice" },
    discord_b: { id: "discord_b", token: "bob", kind: "discord", name: "Bob" },
    discord_c: { id: "discord_c", token: "cara", kind: "discord", name: "Cara" },
  }));
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
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep + "sc-ledger-http-"));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
    child.stdout.once("data", () => { clearTimeout(timeout); resolve(); });
    child.once("error", (e) => { clearTimeout(timeout); reject(e); });
    child.once("exit", (code) => { clearTimeout(timeout); reject(new Error("Server exited: " + code)); });
  });
  const base = "http://127.0.0.1:" + port;
  const request = (route, token, body, method) => fetch(base + route, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: { Authorization: "Bearer " + (token || ""), "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify({ requestId: crypto.randomUUID(), ...body }),
  });
  assert.equal((await request("/health")).status, 200);
  assert.equal((await request("/auction")).status, 401);
  assert.equal((await request("/pvp", "wrong")).status, 401);
  const guest = await (await request("/guest?name=Guest", "", {}, "POST")).json();
  assert.equal((await request("/auction", guest.token)).status, 403);
  const rawSave = JSON.stringify({ meta: { tick: 42 }, resources: { gold: "1000" } });
  for (const token of ["alice", "bob", guest.token]) {
    assert.equal((await request("/save", token, rawSave, "PUT")).status, 200);
    assert.equal(await (await request("/save", token)).text(), rawSave);
  }
  assert.equal((await request("/board")).status, 200);
  for (const token of ["alice", "bob", "cara"]) assert.equal((await request("/auction", token, { action: "enroll" })).status, 200);
  const listing = (await (await request("/auction", "alice", { action: "list", item: "iron", quantity: "2", price: "20" })).json()).record;
  const buys = await Promise.all(["bob", "cara"].map((token) => request("/auction", token, { action: "buy", listingId: listing.id })));
  assert.deepEqual(buys.map((r) => r.status).sort(), [200, 409]);
  const a = await (await request("/auction", "alice")).json();
  assert.equal(a.account.gold, "120");
  assert.equal(a.account.iron, "3");
  assert.equal(await (await request("/save", "alice")).text(), rawSave);
  assert.equal((await request("/auction", "alice", "{")).status, 400);
  assert.equal((await request("/auction", "alice", "null")).status, 400);
  assert.equal((await request("/auction", "alice", {}, "PUT")).status, 405);
  assert.equal((await request("/auction", "alice", JSON.stringify({ padding: "x".repeat(1000000) }))).status, 413);
  const challenge = (await (await request("/pvp", "alice", { action: "challenge", opponentId: "discord_b", power: "10" })).json()).record;
  assert.equal((await request("/pvp", "bob", { action: "accept", challengeId: challenge.id, power: "20" })).status, 200);
  const privateView = await (await request("/pvp", "cara")).json();
  assert.deepEqual(privateView.challenges, []);
  assert.equal((await request("/health")).status, 200);
});
