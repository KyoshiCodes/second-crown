import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gateSave, parseSave, SaveGateError, SAVE_VERSION, TICKS_PER_SECOND, MAX_SPEED } from "./savegate.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function save(tick = 100, over = {}) {
  return {
    meta: { version: 1, seed: 7, tick, lastRealTime: 0, playTimeMs: 0 },
    resources: { gold: "50", food: "1.5e+3" },
    buildings: [], units: [{ id: "u", typeId: "militia", realmId: "player", count: "3", armyId: null }],
    citizens: [], realms: [], characters: [], opinions: [], wars: [], factions: [],
    inputLog: [{ tick: 10, type: "build" }], flags: {}, unlocks: [], board: {},
    ...over,
  };
}
const raw = (s) => JSON.stringify(s);
function rejects(fn, status) {
  assert.throws(fn, (e) => e instanceof SaveGateError && e.status === status);
}

test("mirrored constants match the client source", () => {
  const shared = fs.readFileSync(path.join(root, "packages/shared/src/index.ts"), "utf8");
  assert.equal(Number(/SAVE_VERSION = (\d+)/.exec(shared)[1]), SAVE_VERSION);
  assert.equal(Number(/TICKS_PER_SECOND = (\d+)/.exec(shared)[1]), TICKS_PER_SECOND);
  const hud = fs.readFileSync(path.join(root, "packages/app/src/HudControls.tsx"), "utf8");
  const speeds = /\{\[([\d,\s]+)\]\.map/.exec(hud)[1].split(",").map(Number);
  assert.equal(Math.max(...speeds), MAX_SPEED);
});

test("accepts a full save with no previous save", () => {
  assert.equal(gateSave(raw(save()), null, 0).meta.tick, 100);
});

test("rejects partial patches and malformed saves", () => {
  rejects(() => parseSave(raw({ gold: "999999" })), 400);
  rejects(() => parseSave(raw({ resources: { gold: "999999", food: "999999" } })), 400);
  rejects(() => parseSave(raw({ meta: save().meta, resources: { gold: "1" } })), 400);
  rejects(() => parseSave("not json"), 400);
  rejects(() => parseSave(raw([save()])), 400);
  rejects(() => parseSave(raw(save(100, { resources: { gold: 5 } }))), 400);
  rejects(() => parseSave(raw(save(100, { resources: { gold: "Infinity" } }))), 400);
  rejects(() => parseSave(raw(save(100, { meta: { ...save().meta, version: 99 } }))), 400);
  rejects(() => parseSave(raw(save(100, { inputLog: [{ tick: 500, type: "x" }] }))), 400);
});

test("time cannot run faster than real time", () => {
  const prev = save(100);
  const oneMinute = 60_000;
  const ok = 100 + 60 * TICKS_PER_SECOND * MAX_SPEED;
  assert.ok(gateSave(raw(save(ok)), prev, oneMinute));
  rejects(() => gateSave(raw(save(ok + 10_000)), prev, oneMinute), 409);
});

test("state cannot change without time or a recorded action", () => {
  const prev = save(100);
  rejects(() => gateSave(raw(save(100, { resources: { gold: "999999", food: "1.5e+3" } })), prev, 1000), 409);
  rejects(() => gateSave(raw(save(100, { units: [] })), prev, 1000), 409);
  assert.ok(gateSave(raw(save(100)), prev, 1000));
  const logged = save(100, { inputLog: [...prev.inputLog, { tick: 100, type: "trade" }], resources: { gold: "10", food: "1.5e+3" } });
  assert.ok(gateSave(raw(logged), prev, 1000));
});

test("input log is append-only and not back-dated", () => {
  const prev = save(100);
  rejects(() => gateSave(raw(save(150, { inputLog: [] })), prev, 60_000), 409);
  rejects(() => gateSave(raw(save(150, { inputLog: [{ tick: 11, type: "build" }] })), prev, 60_000), 409);
  rejects(() => gateSave(raw(save(150, { inputLog: [...prev.inputLog, { tick: 50, type: "trade" }] })), prev, 60_000), 409);
  assert.ok(gateSave(raw(save(150, { inputLog: [...prev.inputLog, { tick: 120, type: "trade" }] })), prev, 60_000));
});

function conflicts(fn) {
  assert.throws(fn, (e) => e instanceof SaveGateError && e.status === 409 && e.conflict === true);
}

test("older copies are refused but a fresh game is allowed when asked", () => {
  const prev = save(500_000);
  conflicts(() => gateSave(raw(save(400_000)), prev, 60_000));
  conflicts(() => gateSave(raw(save(400_000)), prev, 60_000, true));
  conflicts(() => gateSave(raw(save(5, { inputLog: [] })), prev, 60_000));
  assert.ok(gateSave(raw(save(5, { inputLog: [] })), prev, 60_000, true));
});

test("a stale tab cannot overwrite a newer cloud hold", () => {
  const prev = save(1_000, { inputLog: [{ tick: 10, type: "build" }, { tick: 900, type: "trade" }] });
  // Same game, fewer ticks, well inside the real-time window: still refused.
  conflicts(() => gateSave(raw(save(900)), prev, 30_000));
  // Played on from an older copy: more ticks but missing the cloud's actions.
  conflicts(() => gateSave(raw(save(1_050, { inputLog: [{ tick: 10, type: "build" }, { tick: 1_020, type: "raid" }] })), prev, 30_000));
  conflicts(() => gateSave(raw(save(1_050)), prev, 30_000));
  // A newer save version in the cloud is never downgraded.
  conflicts(() => gateSave(raw(save(1_050)), { ...prev, meta: { ...prev.meta, version: 2 } }, 30_000));
});

test("cheat checks are not reported as a newer hold", () => {
  const prev = save(100);
  assert.throws(() => gateSave(raw(save(100_000)), prev, 1_000), (e) => e.status === 409 && !e.conflict);
});
