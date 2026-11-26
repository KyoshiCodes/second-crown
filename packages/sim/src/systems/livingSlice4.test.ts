import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { serializeState } from "../save/serialize.js";
import { ensureBoard } from "./board.js";
import { getWorldLog } from "./events.js";
import { listMarches } from "./march.js";
import { tryDeclareWar, tryWhitePeace } from "../actions/war.js";
import {
  LIVING_SWITCH_FLAGS,
  applyNpcWarLoss,
  livingCounts,
  livingSwitches,
  npcWarLossesFor,
  setLivingSwitch,
  settleNpcWars,
  warPhase,
} from "./livingRealm.js";
import { HOME_RAID_FIRST_TICK, getHomeRaid, homeRaidAllowed, homeRaidSnapshot, maybeNpcRaid } from "./raidMarch.js";
import { homeRaidGap } from "./raidPressure.js";
import {
  HOME_RAID_COOLDOWN_TICKS,
  HOME_RAID_IN_FLIGHT,
  NPC_RAID_PULSE_TICKS,
  NPC_WAR_LOSS_CAP,
  NPC_WAR_LOSS_SHARE,
  WAR_PHASE_START,
} from "../content/livingRealm.js";

const SEED = 20261126;

function fresh(): GameState {
  const s = createGameState({ seed: SEED, now: 1 });
  s.meta.tick = HOME_RAID_FIRST_TICK;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  return s;
}

function npcPair(s: GameState): [string, string] {
  const ids = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
  expect(ids.length).toBeGreaterThanOrEqual(2);
  return [ids[0], ids[1]];
}

function setUnits(s: GameState, realmId: string, stacks: Record<string, number>): void {
  s.units = s.units.filter((u) => u.realmId !== realmId);
  for (const [typeId, n] of Object.entries(stacks)) {
    s.units.push({ id: `u_${realmId}_${typeId}`, typeId, realmId, count: String(n), armyId: null });
  }
}

function unitsOf(s: GameState, realmId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const u of s.units) if (u.realmId === realmId) out[u.typeId] = Number(u.count);
  return out;
}

function npcWar(a: string, d: string, startedTick: number): WarInstance {
  return { id: `war_npc_${a}_${d}_${startedTick}`, attackerRealmId: a, defenderRealmId: d, startedTick, status: "active" };
}

const CLASH = WAR_PHASE_START.clash;

// ---------------------------------------------------------------- NPC war losses

describe("NPC war losses: switch and constants", () => {
  it("has living_npc_war_losses, on by default, with documented numbers", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.npcWarLosses).toBe("living_npc_war_losses");
    expect(livingSwitches(s).npcWarLosses).toBe(true);
    expect(NPC_WAR_LOSS_SHARE).toBe(0.12);
    expect(NPC_WAR_LOSS_CAP).toBe(20);
  });
});

describe("NPC war losses: share and cap", () => {
  it("takes a floored 12% of each stack", () => {
    const s = fresh();
    const [a] = npcPair(s);
    setUnits(s, a, { militia: 50, spearman: 25 });
    expect(applyNpcWarLoss(s, a)).toBe(6 + 3);
    expect(unitsOf(s, a)).toEqual({ militia: 44, spearman: 22 });
  });

  it("stops at the 20-unit cap however large the force", () => {
    const s = fresh();
    const [a] = npcPair(s);
    setUnits(s, a, { militia: 1000, spearman: 500 });
    expect(applyNpcWarLoss(s, a)).toBe(NPC_WAR_LOSS_CAP);
    // State order: militia takes the whole cap, spearmen are untouched.
    expect(unitsOf(s, a)).toEqual({ militia: 980, spearman: 500 });
  });

  it("never empties a realm, even over many wars", () => {
    const s = fresh();
    const [a] = npcPair(s);
    setUnits(s, a, { militia: 9 });
    for (let i = 0; i < 50; i++) applyNpcWarLoss(s, a);
    // floor(9 * 0.12) = 1 per war until floor(n * 0.12) hits 0 at n <= 8.
    expect(unitsOf(s, a)).toEqual({ militia: 8 });
  });

  it("refuses the player", () => {
    const s = fresh();
    setUnits(s, "player", { militia: 100 });
    expect(applyNpcWarLoss(s, "player")).toBe(0);
    expect(unitsOf(s, "player")).toEqual({ militia: 100 });
  });
});

describe("NPC war losses: at the settle", () => {
  it("only the loser loses on a clear win, and the aftermath line carries the count", () => {
    const s = fresh();
    const [a, d] = npcPair(s);
    setUnits(s, a, { militia: 200 });
    setUnits(s, d, { militia: 50 });
    const war = npcWar(a, d, 1000);
    s.wars.push(war);
    s.meta.tick = 1000 + CLASH;
    settleNpcWars(s, s.meta.tick);
    expect(war.status).toBe("attacker_won");
    expect(unitsOf(s, a)).toEqual({ militia: 200 });
    expect(unitsOf(s, d)).toEqual({ militia: 44 });
    expect(npcWarLossesFor(s, war.id)).toEqual({ warId: war.id, attacker: 0, defender: 6 });
    expect(livingCounts(s).npcWarLosses).toBe(6);
    const line = warPhase(s, war)!.line;
    expect(line).toMatch(/falls back, 6 lost\.$/);
    expect(getWorldLog(s).some((e) => e.text === line)).toBe(true);
  });

  it("both sides lose on white peace", () => {
    const s = fresh();
    const [a, d] = npcPair(s);
    setUnits(s, a, { militia: 100 });
    setUnits(s, d, { militia: 100 });
    const war = npcWar(a, d, 1000);
    s.wars.push(war);
    settleNpcWars(s, 1000 + CLASH);
    expect(war.status).toBe("white_peace");
    expect(unitsOf(s, a)).toEqual({ militia: 88 });
    expect(unitsOf(s, d)).toEqual({ militia: 88 });
    expect(npcWarLossesFor(s, war.id)).toMatchObject({ attacker: 12, defender: 12 });
    expect(livingCounts(s).npcWarLosses).toBe(24);
  });

  it("is deterministic: two identical runs end byte-identical", () => {
    const run = () => {
      const s = fresh();
      const [a, d] = npcPair(s);
      setUnits(s, a, { militia: 130, spearman: 40 });
      setUnits(s, d, { militia: 70 });
      s.wars.push(npcWar(a, d, 1000));
      settleNpcWars(s, 1000 + CLASH);
      return serializeState(s);
    };
    expect(run()).toBe(run());
  });

  it("living_npc_war_losses=false restores the old no-casualty settle", () => {
    const s = fresh();
    const [a, d] = npcPair(s);
    setLivingSwitch(s, "npcWarLosses", false);
    setUnits(s, a, { militia: 200 });
    setUnits(s, d, { militia: 50 });
    const war = npcWar(a, d, 1000);
    s.wars.push(war);
    s.meta.tick = 1000 + CLASH;
    settleNpcWars(s, s.meta.tick);
    expect(war.status).toBe("attacker_won");
    expect(unitsOf(s, d)).toEqual({ militia: 50 });
    expect(npcWarLossesFor(s, war.id)).toBeNull();
    expect(livingCounts(s).npcWarLosses).toBe(0);
    expect(warPhase(s, war)!.line).toMatch(/falls back\.$/);
  });
});

describe("NPC war losses: player wars untouched", () => {
  it("settleNpcWars ignores a player war past the clash and costs nobody units", () => {
    const s = fresh();
    const [a] = npcPair(s);
    setUnits(s, a, { militia: 300 });
    const before = JSON.stringify(s.units);
    const pw: WarInstance = { id: `war_${a}_1000`, attackerRealmId: a, defenderRealmId: "player", startedTick: 1000, status: "active" };
    s.wars.push(pw);
    settleNpcWars(s, 1000 + CLASH + 1000);
    expect(pw.status).toBe("active");
    expect(JSON.stringify(s.units)).toBe(before);
    expect(npcWarLossesFor(s, pw.id)).toBeNull();
  });

  it("a player white peace records no NPC loss", () => {
    const s = fresh();
    const [a] = npcPair(s);
    s.meta.tick = 1000;
    expect(tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: a })).toBe(true);
    const pw = s.wars.find((w) => w.status === "active")!;
    s.meta.tick += 50;
    tryWhitePeace(s);
    expect(pw.status).not.toBe("active");
    expect(npcWarLossesFor(s, pw.id)).toBeNull();
    expect(livingCounts(s).npcWarLosses).toBe(0);
  });
});

// ---------------------------------------------------------------- home-raid timing

function raider(s: GameState): string {
  return s.realms.find((r) => r.id === "rival")?.id ?? npcPair(s)[0];
}

/** Drop the inbound raid column, as march.ts does when it resolves on arrival. */
function landRaid(s: GameState): number {
  const rec = getHomeRaid(s)!;
  s.flags.marches_json = JSON.stringify(listMarches(s).filter((m) => m.id !== rec.marchId));
  return rec.untilTick;
}

describe("home raids: switch and constants", () => {
  it("has living_home_raid_cooldown, on by default, with documented numbers", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.homeRaidCooldown).toBe("living_home_raid_cooldown");
    expect(livingSwitches(s).homeRaidCooldown).toBe(true);
    expect(HOME_RAID_IN_FLIGHT).toBe(1);
    expect(HOME_RAID_COOLDOWN_TICKS).toBe(750);
  });
});

describe("home raids: one in flight", () => {
  it("no second raid while one is on the road, even past the launch gap", () => {
    const s = fresh();
    const r = raider(s);
    expect(maybeNpcRaid(s, r, HOME_RAID_FIRST_TICK)).toBe(true);
    const rec = getHomeRaid(s)!;
    expect(rec.realmId).toBe(r);
    expect(rec.cooldownUntil).toBe(rec.untilTick + HOME_RAID_COOLDOWN_TICKS);
    // Hold the column on the road far past the gap.
    const ms = listMarches(s).map((m) => (m.id === rec.marchId ? { ...m, arrivesTick: 1_000_000 } : m));
    s.flags.marches_json = JSON.stringify(ms);
    const later = HOME_RAID_FIRST_TICK + homeRaidGap(s) * 4;
    expect(homeRaidAllowed(s, later)).toBe(false);
    for (const other of s.realms.filter((x) => x.id !== "player")) {
      expect(maybeNpcRaid(s, other.id, later)).toBe(false);
    }
    expect(listMarches(s).filter((m) => m.toId === s.board.homeProvinceId)).toHaveLength(1);
    expect(livingCounts(s).homeRaids).toBe(1);
  });
});

describe("home raids: cooldown after it resolves", () => {
  it("waits HOME_RAID_COOLDOWN_TICKS after arrival, then opens", () => {
    const s = fresh();
    const r = raider(s);
    // Clear the old launch gap out of the way so only the cooldown is tested.
    expect(maybeNpcRaid(s, r, HOME_RAID_FIRST_TICK)).toBe(true);
    const until = landRaid(s);
    s.flags.home_raid_last = -1_000_000;
    expect(homeRaidAllowed(s, until)).toBe(false);
    expect(homeRaidAllowed(s, until + HOME_RAID_COOLDOWN_TICKS - 1)).toBe(false);
    expect(homeRaidAllowed(s, until + HOME_RAID_COOLDOWN_TICKS)).toBe(true);
  });

  it("living_home_raid_cooldown=false restores the old launch-gap-only rule", () => {
    const s = fresh();
    const r = raider(s);
    setLivingSwitch(s, "homeRaidCooldown", false);
    expect(maybeNpcRaid(s, r, HOME_RAID_FIRST_TICK)).toBe(true);
    expect(getHomeRaid(s)).toBeNull();
    s.flags.marches_json = "[]";
    const gapEnd = HOME_RAID_FIRST_TICK + homeRaidGap(s);
    expect(homeRaidAllowed(s, gapEnd)).toBe(true);
    expect(livingCounts(s).homeRaids).toBe(1);
  });

  it("does not change raid strength", () => {
    const on = fresh();
    const off = fresh();
    setLivingSwitch(off, "homeRaidCooldown", false);
    maybeNpcRaid(on, raider(on), HOME_RAID_FIRST_TICK);
    maybeNpcRaid(off, raider(off), HOME_RAID_FIRST_TICK);
    const strip = (s: GameState) => listMarches(s).map(({ force, levy, arrivesTick, toId }) => ({ force, levy, arrivesTick, toId }));
    expect(strip(on)).toEqual(strip(off));
  });
});

describe("home raids: snapshot", () => {
  it("reports an inbound raid with its arrival, and no next start while it is out", () => {
    const s = fresh();
    const r = raider(s);
    s.meta.tick = HOME_RAID_FIRST_TICK;
    expect(maybeNpcRaid(s, r, s.meta.tick)).toBe(true);
    const m = listMarches(s).find((x) => x.realmId === r)!;
    const snap = homeRaidSnapshot(s);
    expect(snap).toEqual({
      tick: HOME_RAID_FIRST_TICK,
      limited: true,
      inbound: { realmId: r, realmName: s.realms.find((x) => x.id === r)!.name, marchId: m.id, sinceTick: HOME_RAID_FIRST_TICK, arrivesTick: m.arrivesTick },
      cooldownUntil: m.arrivesTick + HOME_RAID_COOLDOWN_TICKS,
      nextStartTick: null,
    });
  });

  it("after it lands: no inbound, cooldown end, and the next raid pulse that clears every timing rule", () => {
    const s = fresh();
    const r = raider(s);
    expect(maybeNpcRaid(s, r, HOME_RAID_FIRST_TICK)).toBe(true);
    const until = landRaid(s);
    s.meta.tick = until;
    const snap = homeRaidSnapshot(s);
    expect(snap.inbound).toBeNull();
    expect(snap.cooldownUntil).toBe(until + HOME_RAID_COOLDOWN_TICKS);
    const earliest = Math.max(until + HOME_RAID_COOLDOWN_TICKS, HOME_RAID_FIRST_TICK + homeRaidGap(s));
    const expected = Math.ceil(earliest / NPC_RAID_PULSE_TICKS) * NPC_RAID_PULSE_TICKS;
    expect(snap.nextStartTick).toBe(expected);
    expect(homeRaidAllowed(s, expected)).toBe(true);
    // Once the cooldown is over the snapshot drops it.
    expect(homeRaidSnapshot(s, until + HOME_RAID_COOLDOWN_TICKS).cooldownUntil).toBeNull();
  });

  it("before any raid the next start is the first-raid tick", () => {
    const s = fresh();
    s.meta.tick = 100;
    expect(homeRaidSnapshot(s)).toEqual({ tick: 100, limited: true, inbound: null, cooldownUntil: null, nextStartTick: HOME_RAID_FIRST_TICK });
  });
});
