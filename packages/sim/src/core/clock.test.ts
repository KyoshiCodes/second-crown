import { afterEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "./tickEngine.js";
import { serializeState } from "../save/serialize.js";
import { applyOfflineProgress } from "../offline.js";
import { tryBuild } from "../actions/build.js";
import { tryTrain } from "../actions/train.js";
import { tryStamp } from "../actions/stamp.js";
import { dailyClaimed, dailyMsLeft, tryClaimDaily, utcDay } from "../systems/daily.js";

afterEach(() => {
  vi.restoreAllMocks();
});

const CLOCK = 1_700_000_000_000;

/** Same seed, same actions, same ticks. Only the passed-in clock is used. */
function play(seed: number): string {
  const state = createGameState({ seed, now: CLOCK, withStarterBuildings: true });
  state.resources = { gold: "500", food: "500", wood: "500", stone: "500" };
  const engine = new TickEngine(state);
  engine.settleTicks(40);
  tryBuild(state, { typeId: "farm", x: 2, y: 0 });
  tryTrain(state, { typeId: "militia", count: 2 });
  tryStamp(state, "guest_a");
  tryClaimDaily(state, CLOCK + 5_000);
  engine.settleTicks(120);
  applyOfflineProgress(state, CLOCK + 60_000);
  for (let i = 0; i < 30; i++) engine.tick();
  return serializeState(state);
}

describe("sim clock (Invariant 2)", () => {
  it("same seed, actions, and tick count give the same serialized state twice, with no wall-clock call", () => {
    const now = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("the sim read Date.now()");
    });
    const a = play(11);
    const b = play(11);
    expect(a).toBe(b);
    expect(now).not.toHaveBeenCalled();
  });

  it("a missing clock throws instead of falling back to the wall clock", () => {
    const now = vi.spyOn(Date, "now");
    const state = createGameState({ seed: 1, now: CLOCK });
    const missing = undefined as unknown as number;
    expect(() => applyOfflineProgress(state, missing)).toThrow(/clock/);
    expect(() => tryClaimDaily(state, missing)).toThrow(/clock/);
    expect(() => dailyClaimed(state, missing)).toThrow(/clock/);
    expect(() => dailyMsLeft(state, missing)).toThrow(/clock/);
    expect(() => utcDay(Number.NaN)).toThrow(/clock/);
    expect(state.meta.tick).toBe(0);
    expect(state.meta.lastRealTime).toBe(CLOCK);
    expect(now).not.toHaveBeenCalled();
  });

  it("a new state without a clock stamps 0, not the wall clock", () => {
    const now = vi.spyOn(Date, "now");
    expect(createGameState({ seed: 1 }).meta.lastRealTime).toBe(0);
    expect(now).not.toHaveBeenCalled();
  });

  it("no sim source reads Date.now() or new Date()", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".ts") && !p.endsWith(".test.ts")) {
          const src = readFileSync(p, "utf8");
          if (/Date\.now\s*\(|new\s+Date\s*\(|performance\.now\s*\(/.test(src)) offenders.push(p);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
