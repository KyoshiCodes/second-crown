import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createLedger, LedgerError } from "./ledger.mjs";

const alice = { id: "discord_a", name: "Alice", kind: "discord" };
const bob = { id: "discord_b", name: "Bob", kind: "discord" };
const eve = { id: "discord_e", name: "Eve", kind: "discord" };
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-ledger-"));
  t.after(() => {
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep + "sc-ledger-"));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const saves = Object.fromEntries([alice, bob, eve].map((u) => [u.id, JSON.stringify({ meta: { tick: 12 }, resources: { gold: "999" } })]));
  const deps = { readSave: (id) => saves[id] ?? null, findUser: (id) => [alice, bob, eve].find((u) => u.id === id) };
  const ledger = createLedger(dir);
  const send = (kind, user, body) => ledger.transact(kind, user, { requestId: crypto.randomUUID(), ...body }, deps);
  const enroll = (user) => send("auction", user, { action: "enroll" });
  return { dir, ledger, saves, deps, send, enroll };
}
const fails = (fn, status) => assert.throws(fn, (e) => e instanceof LedgerError && e.status === status);

test("escrow conserves assets, purchase survives restart, retry returns original receipt", (t) => {
  const f = fixture(t); f.enroll(alice); f.enroll(bob);
  const body = { action: "list", item: "iron", quantity: "3", price: "25", requestId: crypto.randomUUID() };
  const original = f.send("auction", alice, body);
  assert.equal(f.ledger.view("auction", alice).account.iron, "2");
  assert.deepEqual(f.send("auction", alice, body), original);
  const buy = { action: "buy", listingId: original.record.id, requestId: crypto.randomUUID() };
  const receipt = f.send("auction", bob, buy);
  const restarted = createLedger(f.dir);
  assert.deepEqual(restarted.transact("auction", bob, buy, f.deps), receipt);
  assert.deepEqual(restarted.transact("auction", alice, body, f.deps), original);
  assert.deepEqual(restarted.view("auction", alice).account, { gold: "125", iron: "2", banners: "0", relics: "0" });
  assert.deepEqual(restarted.view("auction", bob).account, { gold: "75", iron: "8", banners: "0", relics: "0" });
  fails(() => f.send("auction", bob, { ...buy, requestId: crypto.randomUUID() }), 409);
  fails(() => f.send("auction", bob, { ...buy, action: "cancel" }), 409);
  assert.equal(JSON.parse(f.saves[alice.id]).resources.gold, "999");
});

test("cancel returns escrow once, non-owners and self-buy are rejected", (t) => {
  const f = fixture(t); f.enroll(alice); f.enroll(bob);
  const listing = f.send("auction", alice, { action: "list", item: "iron", quantity: "5", price: "50" }).record;
  fails(() => f.send("auction", bob, { action: "cancel", listingId: listing.id }), 403);
  fails(() => f.send("auction", alice, { action: "buy", listingId: listing.id }), 409);
  f.send("auction", alice, { action: "cancel", listingId: listing.id });
  fails(() => f.send("auction", alice, { action: "cancel", listingId: listing.id }), 409);
  assert.equal(f.ledger.view("auction", alice).account.iron, "5");
});

test("failed purchases and invalid quantities leave ledger byte-identical", (t) => {
  const f = fixture(t); f.enroll(alice); f.enroll(bob);
  const listing = f.send("auction", alice, { action: "list", item: "iron", quantity: "1", price: "101" }).record;
  const filename = path.join(f.dir, "ledger.json");
  const before = fs.readFileSync(filename, "utf8");
  fails(() => f.send("auction", bob, { action: "buy", listingId: listing.id }), 409);
  for (const quantity of ["0", "-1", "1.5", "NaN", "Infinity", "1e2", "1000000001", 1, null, {}, "01"]) {
    fails(() => f.send("auction", alice, { action: "list", item: "iron", quantity, price: "1" }), 400);
  }
  fails(() => f.send("auction", alice, { action: "list", item: "__proto__", quantity: "1", price: "1" }), 400);
  fails(() => f.send("auction", alice, { action: "list", item: "iron", quantity: "99", price: "1" }), 409);
  fails(() => f.send("auction", alice, { action: "enroll", balance: "9999" }), 400);
  assert.equal(fs.readFileSync(filename, "utf8"), before);
});

test("enrollment cannot reset a purse and unknown operations cannot mint", (t) => {
  const f = fixture(t); f.enroll(alice);
  fails(() => f.enroll(alice), 409);
  for (const action of ["deposit", "withdraw", "reward", "reset"]) fails(() => f.send("auction", alice, { action }), 400);
  fails(() => f.send("auction", alice, { action: "enroll", requestId: "tiny" }), 400);
});

test("challenge locks unverified snapshots and restricts participation", (t) => {
  const f = fixture(t);
  const c = f.send("pvp", alice, { action: "challenge", opponentId: bob.id, power: "30" }).record;
  const original = structuredClone(c.challenger);
  fails(() => f.send("pvp", bob, { action: "challenge", opponentId: alice.id, power: "1" }), 409);
  fails(() => f.send("pvp", alice, { action: "accept", challengeId: c.id, power: "1" }), 403);
  fails(() => f.send("pvp", eve, { action: "cancel", challengeId: c.id }), 403);
  f.saves[alice.id] = JSON.stringify({ meta: { tick: 100 } });
  f.saves[bob.id] = JSON.stringify({ meta: { tick: 55 } });
  const locked = f.send("pvp", bob, { action: "accept", challengeId: c.id, power: "40" }).record;
  assert.deepEqual(locked.challenger, original);
  assert.equal(locked.opponent.tick, 55);
  assert.equal(locked.opponent.verified, false);
  assert.equal(locked.status, "locked");
  fails(() => f.send("pvp", bob, { action: "accept", challengeId: c.id, power: "999" }), 409);
  fails(() => f.send("pvp", alice, { action: "resolve", challengeId: c.id }), 400);
  assert.deepEqual(f.ledger.view("pvp", eve).challenges, []);
  f.send("pvp", bob, { action: "cancel", challengeId: c.id });
  fails(() => f.send("pvp", alice, { action: "cancel", challengeId: c.id }), 409);
});

test("challenge validates saves, identity and fields", (t) => {
  const f = fixture(t);
  fails(() => f.send("pvp", alice, { action: "challenge", opponentId: alice.id, power: "1" }), 400);
  fails(() => f.send("pvp", alice, { action: "challenge", opponentId: "missing", power: "1" }), 400);
  delete f.saves[bob.id];
  fails(() => f.send("pvp", alice, { action: "challenge", opponentId: bob.id, power: "1" }), 409);
  f.saves[bob.id] = "{}";
  fails(() => f.send("pvp", alice, { action: "challenge", opponentId: bob.id, power: "1" }), 409);
  f.saves[bob.id] = JSON.stringify({ meta: { tick: 1 } });
  fails(() => f.send("pvp", alice, { action: "challenge", opponentId: bob.id, power: "1", winnerId: alice.id }), 400);
});

test("capacity preserves receipts and corrupt storage fails closed", (t) => {
  const f = fixture(t); f.enroll(alice);
  const filename = path.join(f.dir, "ledger.json");
  const db = JSON.parse(fs.readFileSync(filename, "utf8"));
  for (let i = 0; i < 10000; i++) db.receipts["test:" + i] = {};
  fs.writeFileSync(filename, JSON.stringify(db));
  fails(() => f.enroll(bob), 503);
  fs.writeFileSync(filename, '{"version":99}');
  fails(() => f.ledger.view("auction", alice), 503);
  fs.writeFileSync(filename, "{broken");
  assert.throws(() => f.ledger.view("auction", alice));
});


test("own escrow remains visible beyond recent history", (t) => {
  const f = fixture(t); f.enroll(alice); f.enroll(bob);
  const old = f.send("auction", alice, { action: "list", item: "iron", quantity: "1", price: "1" }).record;
  for (let i = 0; i < 101; i++) {
    const newer = f.send("auction", bob, { action: "list", item: "iron", quantity: "1", price: "1" }).record;
    f.send("auction", bob, { action: "cancel", listingId: newer.id });
  }
  assert.ok(f.ledger.view("auction", alice).listings.some((l) => l.id === old.id));
  assert.ok(f.ledger.view("auction", alice).listings.length <= 110);
  f.send("auction", alice, { action: "cancel", listingId: old.id });
  assert.equal(f.ledger.view("auction", alice).account.iron, "5");
});

test("invalid stored balances cannot be spent or overwritten", (t) => {
  const f = fixture(t); f.enroll(alice);
  const filename = path.join(f.dir, "ledger.json");
  const db = JSON.parse(fs.readFileSync(filename, "utf8"));
  db.accounts[alice.id].gold = "NaN";
  const raw = JSON.stringify(db);
  fs.writeFileSync(filename, raw);
  fails(() => f.send("auction", alice, { action: "list", item: "iron", quantity: "1", price: "1" }), 503);
  assert.equal(fs.readFileSync(filename, "utf8"), raw);
});
