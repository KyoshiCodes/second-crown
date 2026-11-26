import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { serializeState } from "../save/serialize.js";
import { tryDeclareWar, tryResolveWar, tryWhitePeace } from "../actions/war.js";
import { createRngStreams } from "../core/rng.js";
import { getWorldLog } from "./events.js";
import { listLedger } from "./ledger.js";
import {
  atWarWith,
  getCultureNews,
  isNpcWar,
  livingCounts,
  maybeNpcTrade,
  maybeWhisper,
  playerWarPhase,
  setLivingSwitch,
  warPhase,
  warPhaseTimeline,
} from "./livingRealm.js";
import { NPC_TRADE_PULSES, WAR_AFTERMATH_TICKS, WAR_PHASE_IDS, WAR_PHASE_START } from "../content/livingRealm.js";

const SEED = 20260930;

function fresh() {
  return createGameState({ seed: SEED, now: 1 });
}

type S = ReturnType<typeof fresh>;

function run(ticks: number, setup?: (s: S) => void): S {
  const s = fresh();
  setup?.(s);
  new TickEngine(s).settleTicks(ticks);
  return s;
}

function clone(s: S): S {
  return JSON.parse(JSON.stringify(s)) as S;
}

function addMarket(s: S) {
  s.buildings.push({ id: "b_market_test", typeId: "market", realmId: "player", x: 1, y: 1, level: 1, completesAtTick: null });
}

/** First pulse tick at which `realmId`'s caravan goes to the player (probing on copies). */
function playerCaravanTick(s: S, realmId: string): number {
  for (let pulse = 1; pulse < 500; pulse++) {
    const probe = clone(s);
    addMarket(probe);
    if (maybeNpcTrade(probe, realmId, pulse * 100) === "player") return pulse * 100;
  }
  throw new Error("no player caravan found");
}

describe("living realm: NPC caravans", () => {
  it("fire in real play: NPC realms trade with each other into the culture news", () => {
    const s = run(3000);
    expect(livingCounts(s).trades).toBeGreaterThan(0);
    expect(getCultureNews(s).some((n) => n.kind === "caravan")).toBe(true);
  });

  it("off switch: no caravans at all", () => {
    const s = run(3000, (st) => setLivingSwitch(st, "npcTrade", false));
    expect(livingCounts(s).trades).toBe(0);
    expect(getCultureNews(s).some((n) => n.kind === "caravan")).toBe(false);
  });

  it("each realm sends one caravan every few pulses", () => {
    const s = fresh();
    const tries: number[] = [];
    for (let pulse = 1; pulse <= 3 * NPC_TRADE_PULSES; pulse++) {
      // Count gate passes, whether or not the partner accepted.
      const probe = clone(s);
      addMarket(probe);
      const before = livingCounts(probe).trades;
      maybeNpcTrade(probe, "k_ash", pulse * 100);
      if (livingCounts(probe).trades > before) tries.push(pulse);
    }
    expect(tries.length).toBe(3);
    expect(tries[1] - tries[0]).toBe(NPC_TRADE_PULSES);
  });

  it("a caravan to the player needs a market and pays the existing +1 gold", () => {
    const base = fresh();
    const tick = playerCaravanTick(base, "rival");
    expect(maybeNpcTrade(clone(base), "rival", tick)).toBeNull();
    const withMarket = clone(base);
    addMarket(withMarket);
    const gold = Number(withMarket.resources.gold ?? 0);
    expect(maybeNpcTrade(withMarket, "rival", tick)).toBe("player");
    expect(Number(withMarket.resources.gold)).toBe(gold + 1);
    expect(livingCounts(withMarket).playerTrades).toBe(1);
  });

  it("no caravan to a realm it is at war with", () => {
    const base = fresh();
    const tick = playerCaravanTick(base, "rival");
    addMarket(base);
    base.wars.push({ id: "w_test", attackerRealmId: "rival", defenderRealmId: "player", startedTick: 0, status: "active" });
    expect(maybeNpcTrade(base, "rival", tick)).toBeNull();
  });
});

describe("living realm: whispers", () => {
  it("are short, deterministic lines from NPC realms", () => {
    const a = run(6000);
    const b = run(6000);
    const whispers = getCultureNews(a).filter((n) => n.kind === "whisper");
    expect(whispers.length).toBeGreaterThan(0);
    expect(getCultureNews(a)).toEqual(getCultureNews(b));
    for (const w of whispers) {
      expect(w.text.length).toBeLessThan(160);
      expect(w.fromRealmId).not.toBe("player");
    }
    expect(livingCounts(a).whispers).toBeGreaterThan(0);
  });

  it("never go to a realm the speaker is at war with", () => {
    const s = fresh();
    for (const r of s.realms.filter((x) => x.id !== "player")) {
      s.wars.push({ id: `w_${r.id}`, attackerRealmId: r.id, defenderRealmId: "player", startedTick: 0, status: "active" });
    }
    let sent = 0;
    for (let pulse = 3; pulse <= 90; pulse += 3) {
      const w = maybeWhisper(s, pulse * 100);
      if (!w) continue;
      sent++;
      expect(atWarWith(s, w.fromRealmId, w.toRealmId)).toBe(false);
      expect(w.toRealmId).not.toBe("player");
    }
    expect(sent).toBeGreaterThan(0);
  });

  it("off switch: no whispers", () => {
    const s = run(6000, (st) => setLivingSwitch(st, "whispers", false));
    expect(getCultureNews(s).some((n) => n.kind === "whisper")).toBe(false);
  });

  it("show in the ledger", () => {
    const s = run(6000);
    expect(listLedger(s).some((e) => e.kind === "whisper" || e.kind === "caravan")).toBe(true);
  });
});

describe("living realm: NPC wars end cleanly", () => {
  it("start in real play and every one settles at its main clash", () => {
    const s = run(12_000);
    const npc = s.wars.filter(isNpcWar);
    expect(npc.length).toBeGreaterThan(0);
    expect(npc.some((w) => w.status !== "active")).toBe(true);
    for (const w of npc) {
      if (w.status === "active") {
        expect(s.meta.tick - w.startedTick).toBeLessThan(WAR_PHASE_START.clash + 100);
      } else {
        expect(w.endedTick! - w.startedTick).toBe(WAR_PHASE_START.clash);
        expect(["attacker_won", "defender_won", "white_peace"]).toContain(w.status);
        expect(s.flags[`peace_${w.attackerRealmId}_${w.defenderRealmId}`]).toBeGreaterThan(w.endedTick!);
      }
    }
    for (const r of s.realms) {
      expect(npc.filter((w) => w.status === "active" && (w.attackerRealmId === r.id || w.defenderRealmId === r.id)).length).toBeLessThanOrEqual(1);
    }
    expect(s.inputLog.some((r) => r.type === "white_peace" || r.type === "resolve_war")).toBe(false);
  });

  it("off switch: no NPC wars", () => {
    const s = run(12_000, (st) => setLivingSwitch(st, "npcWars", false));
    expect(s.wars.filter(isNpcWar)).toHaveLength(0);
  });
});

describe("living realm: war phases", () => {
  it("walk columns → skirmish → clash by ticks, with stable ids and readable lines", () => {
    const s = fresh();
    s.meta.tick = 1000;
    expect(tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" })).toBe(true);
    const war = s.wars.at(-1)!;
    expect(warPhase(s, war)?.id).toBe("columns");
    expect(warPhase(s, war, 1099)?.id).toBe("columns");
    expect(warPhase(s, war, 1100)?.id).toBe("skirmish");
    expect(warPhase(s, war, 1100)?.line).toMatch(/Outriders skirmish/);
    expect(warPhase(s, war, 1299)?.id).toBe("skirmish");
    const clash = warPhase(s, war, 1300)!;
    expect(clash.id).toBe("clash");
    expect(clash.untilTick).toBeNull();
    expect(clash.line).toMatch(/Fight to commit/);
    expect(WAR_PHASE_IDS).toEqual(["columns", "skirmish", "clash", "aftermath"]);
  });

  it("the player's Fight ends the war into an aftermath that fades", () => {
    const s = fresh();
    s.meta.tick = 1000;
    tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });
    s.meta.tick = 1300;
    expect(playerWarPhase(s)?.id).toBe("clash");
    expect(tryResolveWar(s, createRngStreams(SEED)).ok).toBe(true);
    const after = playerWarPhase(s)!;
    expect(after.id).toBe("aftermath");
    expect(after.line).toMatch(/holds the field/);
    expect(playerWarPhase(s, 1300 + WAR_AFTERMATH_TICKS)).toBeNull();
    expect(warPhaseTimeline(s.wars.at(-1)!, 1300).map((p) => p.id)).toEqual(["columns", "skirmish", "clash", "aftermath"]);
  });

  it("white peace before the clash skips it", () => {
    const s = fresh();
    s.meta.tick = 1000;
    tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });
    s.meta.tick = 1150;
    expect(tryWhitePeace(s)).toBe(true);
    expect(warPhaseTimeline(s.wars.at(-1)!, 1150).map((p) => p.id)).toEqual(["columns", "skirmish", "aftermath"]);
    expect(playerWarPhase(s)?.line).toMatch(/white peace/);
  });

  it("each phase writes one ledger line on the world pulse", () => {
    const s = fresh();
    setLivingSwitch(s, "npcWars", false);
    // Board lines (claims, camp marches) would push phase lines out of the 24-line world log.
    setLivingSwitch(s, "npcClaim", false);
    setLivingSwitch(s, "npcCamp", false);
    const eng = new TickEngine(s);
    eng.settleTicks(1000);
    tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });
    eng.settleTicks(400);
    const lines = getWorldLog(s).filter((e) => e.id.startsWith("war_"));
    expect(lines.map((e) => e.id)).toEqual(["war_columns", "war_skirmish", "war_clash"]);
    expect(lines[0].text).toMatch(/^Columns forming: /);
  });

  it("is deterministic with the whole living layer on", () => {
    const a = run(9000);
    const b = run(9000);
    expect(serializeState(a)).toBe(serializeState(b));
  });
});
