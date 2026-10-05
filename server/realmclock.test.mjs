import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRealmClocks, MAX_REALM_CLOCKS } from "./realmclock.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("first ask is 0, a later ask at +250 ms is 2", () => {
  let wall = 50_000;
  const clocks = createRealmClocks(() => wall);
  assert.equal(clocks.tick("realm-a"), 0);
  wall += 250;
  assert.equal(clocks.tick("realm-a"), 2);
});

test("a second ask for the same id does not restart the clock", () => {
  let wall = 0;
  const clocks = createRealmClocks(() => wall);
  clocks.tick("realm-a");
  wall = 1_000;
  assert.equal(clocks.tick("realm-a"), 10);
  wall = 1_250;
  assert.equal(clocks.tick("realm-a"), 12);
  assert.equal(clocks.size, 1);
});

test("a different realm id has its own clock", () => {
  let wall = 0;
  const clocks = createRealmClocks(() => wall);
  clocks.tick("realm-a");
  wall = 500;
  assert.equal(clocks.tick("realm-b"), 0);
  wall = 750;
  assert.equal(clocks.tick("realm-a"), 7);
  assert.equal(clocks.tick("realm-b"), 2);
});

test("bad ids and a full table get null and start nothing", () => {
  const clocks = createRealmClocks(() => 0);
  assert.equal(clocks.tick(""), null);
  assert.equal(clocks.tick("../saves/x"), null);
  assert.equal(clocks.tick(42), null);
  assert.equal(clocks.size, 0);
  for (let i = 0; i < MAX_REALM_CLOCKS; i++) clocks.tick("r" + i);
  assert.equal(clocks.tick("one-more"), null);
  assert.equal(clocks.tick("r0"), 0);
});

test("realm clocks do not touch the sim or saves", () => {
  const src = fs.readFileSync(path.join(here, "realmclock.mjs"), "utf8");
  assert.doesNotMatch(src, /packages\/sim|@second-crown\/sim|node:fs|from "fs"|saves/);
});
