import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TICK_MS, ticksBetween, createClock } from "./clock.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("one tick is 100 ms", () => {
  assert.equal(TICK_MS, 100);
});

test("elapsed time becomes whole ticks", () => {
  assert.equal(ticksBetween(1000, 1000), 0);
  assert.equal(ticksBetween(1000, 1100), 1);
  assert.equal(ticksBetween(1000, 1250), 2);
});

test("going backward in time never gives a negative tick", () => {
  assert.equal(ticksBetween(5000, 4000), 0);
  assert.equal(ticksBetween(Number.NaN, 4000), 0);
});

test("a clock that is never started does not advance", () => {
  const clock = createClock(() => 0);
  assert.equal(clock.started, false);
  assert.equal(clock.tick(0), 0);
  assert.equal(clock.tick(60_000), 0);
});

test("a started clock counts ticks and never counts down", () => {
  let wall = 10_000;
  const clock = createClock(() => wall);
  clock.start();
  assert.equal(clock.tick(), 0);
  wall += 250;
  assert.equal(clock.tick(), 2);
  wall -= 5_000;
  assert.equal(clock.tick(), 2);
  wall = 10_000 + 1_000;
  assert.equal(clock.tick(), 10);
});

test("the clock does not touch the sim or saves", () => {
  const src = fs.readFileSync(path.join(here, "clock.mjs"), "utf8");
  assert.doesNotMatch(src, /packages\/sim|@second-crown\/sim|node:fs|from "fs"|saves/);
});
