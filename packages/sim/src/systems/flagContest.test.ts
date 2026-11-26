import { describe, it, expect } from "vitest";
import type { Province } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { TickEngine } from "../core/tickEngine.js";
import { serializeState } from "../save/serialize.js";
import { tryDeclareWar, tryResolveWar, tryWhitePeace } from "../actions/war.js";
import { ensureBoard } from "./board.js";
import { listMarches } from "./march.js";
import { maybeContestFlag } from "./rival.js";
import { LIVING_SWITCH_FLAGS, livingCounts, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { flagContestOpen, flagContestSnapshot, getFlagContests } from "./flagContest.js";
import { FLAG_CONTEST_COLUMNS_PER_FLAG, FLAG_CONTEST_COOLDOWN_TICKS, WAR_PHASE_START } from "../content/livingRealm.js";

const SEED = 20260930;
const T = 5000;

function fresh() {
  const s = createGameState({ seed: SEED, now: 1 });
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.meta.tick = T;
  return s;
}
type S = ReturnType<typeof fresh>;

/** Hand the player `n` flags on plain tiles away from every hold. */
function plantFlags(s: S, n: number): Province[] {
  const picks = s.board.provinces
    .filter((p) => !p.occupantRealmId && p.node !== "hold" && p.id !== s.board.homeProvinceId)
    .slice(0, n);
  for (const p of picks) {
    p.occupantRealmId = "player";
    p.node = "none";
  }
  expect(picks).toHaveLength(n);
  return picks;
}

function npcIds(s: S): string[] {
  return s.realms
    .filter((r) => r.id !== "player" && s.board.provinces.some((p) => p.occupantRealmId === r.id && p.node === "hold"))
    .map((r) => r.id);
}

function contestAll(s: S, atTick: number): string[] {
  return npcIds(s).filter((id) => maybeContestFlag(s, id, atTick));
}

function dropMarch(s: S, marchId: string) {
  s.flags.marches_json = JSON.stringify(listMarches(s).filter((m) => m.id !== marchId));
}

describe("flag contests: switch and constants", () => {
  it("has a living_flag_cooldown flag, on by default, and documented numbers", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.flagCooldown).toBe("living_flag_cooldown");
    expect(livingSwitches(s).flagCooldown).toBe(true);
    expect(FLAG_CONTEST_COLUMNS_PER_FLAG).toBe(1);
    expect(FLAG_CONTEST_COOLDOWN_TICKS).toBe(500);
  });
});

describe("flag contests: one column per flag", () => {
  it("only one realm contests a lone flag on a pulse", () => {
    const s = fresh();
    const [flag] = plantFlags(s, 1);
    expect(npcIds(s).length).toBeGreaterThan(1);
    const fired = contestAll(s, T);
    expect(fired).toHaveLength(1);
    const toFlag = listMarches(s).filter((m) => m.toId === flag.id);
    expect(toFlag).toHaveLength(1);
    expect(toFlag[0].realmId).toBe(fired[0]);
    expect(livingCounts(s).flagContests).toBe(1);
  });

  it("a second realm takes the next open flag instead of piling on", () => {
    const s = fresh();
    const flags = plantFlags(s, 2);
    const fired = contestAll(s, T);
    expect(fired).toHaveLength(2);
    const targets = listMarches(s).filter((m) => m.realmId !== "player").map((m) => m.toId).sort();
    expect(targets).toEqual(flags.map((f) => f.id).sort());
  });

  it("stays closed while the column is on the road", () => {
    const s = fresh();
    const [flag] = plantFlags(s, 1);
    contestAll(s, T);
    const rec = getFlagContests(s)[0];
    expect(rec.untilTick).toBeGreaterThan(T);
    s.meta.tick = rec.untilTick - 1;
    expect(flagContestOpen(s, flag.id, s.meta.tick)).toBe(false);
  });
});

describe("flag contests: cooldown", () => {
  it("rests the flag for FLAG_CONTEST_COOLDOWN_TICKS after the column arrives, then reopens", () => {
    const s = fresh();
    const [flag] = plantFlags(s, 1);
    const [first] = contestAll(s, T);
    const rec = getFlagContests(s)[0];
    expect(rec.cooldownUntil).toBe(rec.untilTick + FLAG_CONTEST_COOLDOWN_TICKS);
    // The column lands (removed as march.ts does on arrival).
    dropMarch(s, rec.marchId);
    s.meta.tick = rec.untilTick;
    expect(flagContestOpen(s, flag.id, rec.untilTick)).toBe(false);
    expect(contestAll(s, rec.untilTick)).toHaveLength(0);
    s.meta.tick = rec.cooldownUntil - 1;
    expect(contestAll(s, s.meta.tick)).toHaveLength(0);
    s.meta.tick = rec.cooldownUntil;
    const next = contestAll(s, s.meta.tick);
    expect(next).toHaveLength(1);
    expect(first).toBeTruthy();
  });

  it("old records are pruned on the world pulse once their cooldown ends", () => {
    const s = fresh();
    plantFlags(s, 1);
    contestAll(s, T);
    const rec = getFlagContests(s)[0];
    dropMarch(s, rec.marchId);
    s.meta.tick = rec.cooldownUntil + 1;
    new TickEngine(s).settleTicks(200);
    expect(getFlagContests(s).every((r) => r.sinceTick > rec.sinceTick)).toBe(true);
  });

  it("off switch restores the old unlimited contests (every realm, same flag)", () => {
    const s = fresh();
    const [flag] = plantFlags(s, 1);
    setLivingSwitch(s, "flagCooldown", false);
    expect(s.flags.living_flag_cooldown).toBe(false);
    const fired = contestAll(s, T);
    expect(fired.length).toBe(npcIds(s).length);
    expect(listMarches(s).filter((m) => m.toId === flag.id)).toHaveLength(fired.length);
    expect(getFlagContests(s)).toHaveLength(0);
    expect(livingCounts(s).flagContests).toBe(fired.length);
    expect(flagContestSnapshot(s).limited).toBe(false);
  });

  it("is deterministic over a long run", () => {
    const go = () => {
      const s = createGameState({ seed: SEED, now: 1 });
      new TickEngine(s).settleTicks(20_000);
      return { save: serializeState(s), n: livingCounts(s).flagContests };
    };
    const a = go();
    const b = go();
    expect(a).toEqual(b);
  });
});

describe("flag contests: snapshot", () => {
  it("lists flags under contest with who, then the resting flag", () => {
    const s = fresh();
    const [flag] = plantFlags(s, 1);
    expect(flagContestSnapshot(s)).toEqual({ tick: T, limited: true, contests: [], cooldowns: [] });
    const [realmId] = contestAll(s, T);
    const rec = getFlagContests(s)[0];
    const snap = flagContestSnapshot(s);
    expect(snap.contests).toEqual([
      {
        provinceId: flag.id,
        x: flag.x,
        y: flag.y,
        realmId,
        realmName: s.realms.find((r) => r.id === realmId)!.name,
        marchId: rec.marchId,
        sinceTick: T,
        untilTick: rec.untilTick,
      },
    ]);
    expect(snap.cooldowns).toEqual([]);
    dropMarch(s, rec.marchId);
    const later = flagContestSnapshot(s, rec.untilTick);
    expect(later.contests).toEqual([]);
    expect(later.cooldowns).toEqual([{ provinceId: flag.id, x: flag.x, y: flag.y, untilTick: rec.cooldownUntil }]);
    expect(flagContestSnapshot(s, rec.cooldownUntil).cooldowns).toEqual([]);
  });
});

describe("clash lock in tryResolveWar", () => {
  function playerWar() {
    const s = fresh();
    s.meta.tick = 1000;
    expect(tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" })).toBe(true);
    return s;
  }

  it("refuses a Fight in columns and skirmish, with no battle and no log entry", () => {
    const s = playerWar();
    const war = s.wars.at(-1)!;
    const rng = createRngStreams(SEED);
    for (const t of [1000, 1000 + WAR_PHASE_START.skirmish, 1000 + WAR_PHASE_START.clash - 1]) {
      s.meta.tick = t;
      expect(tryResolveWar(s, rng).ok).toBe(false);
      expect(tryResolveWar(s, rng, war.id).ok).toBe(false);
    }
    expect(war.status).toBe("active");
    expect(s.inputLog.some((r) => r.type === "resolve_war")).toBe(false);
  });

  it("allows the Fight from the main clash", () => {
    const s = playerWar();
    s.meta.tick = 1000 + WAR_PHASE_START.clash;
    const r = tryResolveWar(s, createRngStreams(SEED));
    expect(r.ok).toBe(true);
    expect(s.wars.at(-1)!.status).not.toBe("active");
  });

  it("white peace stays open in every phase", () => {
    for (const t of [1000, 1000 + WAR_PHASE_START.skirmish, 1000 + WAR_PHASE_START.clash]) {
      const s = playerWar();
      s.meta.tick = t;
      expect(tryWhitePeace(s)).toBe(true);
    }
  });
});
