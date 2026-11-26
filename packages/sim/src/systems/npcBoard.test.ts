import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { serializeState } from "../save/serialize.js";
import { tryDeclareWar, tryWhitePeace } from "../actions/war.js";
import { listGathers } from "./gather.js";
import { listMarches, tryMarchWith } from "./march.js";
import { livingCounts, playerFightOpen, setLivingSwitch, LIVING_SWITCH_FLAGS, livingSwitches } from "./livingRealm.js";
import {
  campMarchBlocksRaid,
  claimMarkers,
  getNpcClaims,
  inPlayerRing,
  maybeNpcCampMarch,
  maybeNpcClaim,
  maybeNpcGatherCrew,
  npcBoardSnapshot,
  pickNpcTarget,
} from "./npcBoard.js";
import {
  NPC_BOARD_GRACE_TICKS,
  NPC_CLAIM_CAP,
  NPC_CLAIM_SHOW_TICKS,
  NPC_PLAYER_RING,
  WAR_PHASE_START,
} from "../content/livingRealm.js";

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

function npcIds(s: S): string[] {
  return s.realms.filter((r) => r.id !== "player").map((r) => r.id);
}

/** First pulse tick ≥ `from` at which `fn` acts for `realmId`, probing on copies. */
function firstActingTick(s: S, realmId: string, fn: (st: S, id: string, t: number) => unknown, from = 100): number {
  for (let t = from; t < from + 10_000; t += 100) {
    const probe = JSON.parse(JSON.stringify(s)) as S;
    probe.meta.tick = t;
    if (fn(probe, realmId, t)) return t;
  }
  throw new Error("never acted");
}

describe("npc board: switches", () => {
  it("has a flag per behaviour, on by default", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.npcClaim).toBe("living_npc_claim");
    expect(LIVING_SWITCH_FLAGS.npcCamp).toBe("living_npc_camp");
    expect(LIVING_SWITCH_FLAGS.npcGather).toBe("living_npc_gather");
    expect(livingSwitches(s)).toMatchObject({ npcClaim: true, npcCamp: true, npcGather: true });
    setLivingSwitch(s, "npcClaim", false);
    expect(s.flags.living_npc_claim).toBe(false);
    setLivingSwitch(s, "npcClaim", true);
    expect(s.flags.living_npc_claim).toBeUndefined();
  });
});

describe("npc board: claims", () => {
  it("fire in real play, only on open tiles, at most NPC_CLAIM_CAP per realm", () => {
    const s = run(6000);
    expect(livingCounts(s).npcClaims).toBeGreaterThan(0);
    for (const id of npcIds(s)) expect(claimMarkers(s, id)).toBeLessThanOrEqual(NPC_CLAIM_CAP);
    for (const c of getNpcClaims(s)) {
      const p = s.board.provinces.find((x) => x.id === c.provinceId)!;
      expect(p.node).toBe("none");
    }
  });

  it("stop at the cap", () => {
    const s = fresh();
    const t = firstActingTick(s, "rival", maybeNpcClaim);
    let made = 0;
    for (let k = 0; k < 40; k++) if (maybeNpcClaim(s, "rival", t + k * 400 * 100)) made++;
    expect(made).toBe(NPC_CLAIM_CAP);
    expect(claimMarkers(s, "rival")).toBe(NPC_CLAIM_CAP);
  });

  it("turn off with living_npc_claim", () => {
    const s = run(6000, (st) => setLivingSwitch(st, "npcClaim", false));
    expect(livingCounts(s).npcClaims).toBe(0);
    expect(getNpcClaims(s)).toEqual([]);
  });
});

describe("npc board: camp marches", () => {
  it("fire in real play and use the NPC column", () => {
    const s = fresh();
    const eng = new TickEngine(s);
    let seen = false;
    for (let i = 0; i < 90 && !seen; i++) {
      eng.settleTicks(100);
      seen = npcBoardSnapshot(s).counts.camp > 0;
    }
    expect(livingCounts(s).npcCampMarches).toBeGreaterThan(0);
    expect(seen).toBe(true);
  });

  it("never take the slot a home raid needs", () => {
    const s = fresh();
    expect(campMarchBlocksRaid(s, 1, 3000)).toBe(true);
    expect(campMarchBlocksRaid(s, 1, 3100)).toBe(false);
    expect(campMarchBlocksRaid(s, 40, 3400)).toBe(true);
    // Every camp march in a long run arrives before the next raid pulse.
    const eng = new TickEngine(s);
    for (let i = 0; i < 60; i++) {
      eng.settleTicks(100);
      for (const a of npcBoardSnapshot(s).activities) {
        if (a.kind !== "camp") continue;
        expect(Math.floor(a.sinceTick / 500)).toBe(Math.floor((a.untilTick! - 1) / 500));
        expect(a.sinceTick % 500).not.toBe(0);
      }
    }
  });

  it("turn off with living_npc_camp", () => {
    const s = run(9000, (st) => setLivingSwitch(st, "npcCamp", false));
    expect(livingCounts(s).npcCampMarches).toBe(0);
  });
});

describe("npc board: gathering", () => {
  it("fire in real play as NPC crews on resource nodes", () => {
    const s = fresh();
    const eng = new TickEngine(s);
    let crew = false;
    for (let i = 0; i < 30 && !crew; i++) {
      eng.settleTicks(100);
      crew = listGathers(s).some((g) => g.realmId !== "player");
    }
    expect(crew).toBe(true);
    expect(livingCounts(s).npcGathers).toBeGreaterThan(0);
  });

  it("one crew per realm and never two crews on one node", () => {
    const s = fresh();
    const t = firstActingTick(s, "rival", maybeNpcGatherCrew);
    s.meta.tick = t;
    expect(maybeNpcGatherCrew(s, "rival", t)).not.toBeNull();
    expect(maybeNpcGatherCrew(s, "rival", t)).toBeNull();
    const busy = listGathers(s).filter((g) => g.phase !== "returning").map((g) => g.toId);
    expect(new Set(busy).size).toBe(busy.length);
  });

  it("turn off with living_npc_gather", () => {
    const s = run(6000, (st) => setLivingSwitch(st, "npcGather", false));
    expect(livingCounts(s).npcGathers).toBe(0);
    expect(listGathers(s).filter((g) => g.realmId !== "player")).toEqual([]);
  });

  it("NPC crews never use up the player's march slots", () => {
    const s = fresh();
    s.units.push({ id: "u_test", typeId: "militia", realmId: "player", count: "10", armyId: null });
    const t = firstActingTick(s, "rival", maybeNpcGatherCrew);
    s.meta.tick = t;
    for (const id of npcIds(s)) maybeNpcGatherCrew(s, id, t + 0);
    expect(listGathers(s).some((g) => g.realmId !== "player")).toBe(true);
    const target = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId && p.node === "none" && !p.occupantRealmId)!;
    expect(tryMarchWith(s, target.id, { militia: 3 })).toBe(true);
  });
});

describe("npc board: player ring and grace", () => {
  it("ring is Manhattan distance NPC_PLAYER_RING from the player's hold", () => {
    const s = fresh();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    expect(inPlayerRing(s, { x: home.x + NPC_PLAYER_RING, y: home.y })).toBe(true);
    expect(inPlayerRing(s, { x: home.x + 1, y: home.y + 1 })).toBe(true);
    expect(inPlayerRing(s, { x: home.x + NPC_PLAYER_RING, y: home.y + 1 })).toBe(false);
  });

  it("inside the ring: refused before the grace window, allowed after only when nothing outside is left", () => {
    const s = fresh();
    const ring = s.board.provinces.filter((p) => inPlayerRing(s, p) && p.id !== s.board.homeProvinceId && !p.occupantRealmId);
    const outside = s.board.provinces.find((p) => !inPlayerRing(s, p) && !p.occupantRealmId)!;
    expect(pickNpcTarget(s, "rival", ring, NPC_BOARD_GRACE_TICKS - 100)).toBeNull();
    expect(pickNpcTarget(s, "rival", ring, NPC_BOARD_GRACE_TICKS)).not.toBeNull();
    expect(pickNpcTarget(s, "rival", [...ring, outside], NPC_BOARD_GRACE_TICKS)).toBe(outside);
    expect(pickNpcTarget(s, "rival", [...ring, outside], 0)).toBe(outside);
  });

  it("never targets a tile the player holds", () => {
    const s = fresh();
    const tile = s.board.provinces.find((p) => !inPlayerRing(s, p) && !p.occupantRealmId)!;
    tile.occupantRealmId = "player";
    expect(pickNpcTarget(s, "rival", [tile], 99_999)).toBeNull();
  });

  it("no claim, camp march or crew lands inside the ring in the first five minutes of real play", () => {
    const s = fresh();
    const eng = new TickEngine(s);
    while (s.meta.tick < NPC_BOARD_GRACE_TICKS - 1) {
      eng.settleTicks(Math.min(100, NPC_BOARD_GRACE_TICKS - 1 - s.meta.tick));
      for (const a of npcBoardSnapshot(s).activities) expect(inPlayerRing(s, a)).toBe(false);
      for (const p of s.board.provinces) {
        if (p.occupantRealmId && p.occupantRealmId !== "player" && p.node !== "hold") expect(inPlayerRing(s, p)).toBe(false);
      }
    }
    expect(livingCounts(s).npcClaims + livingCounts(s).npcGathers).toBeGreaterThan(0);
  });
});

describe("npc board: snapshot", () => {
  it("lists claims, camp marches and crews with a stable shape and does not touch state", () => {
    const s = fresh();
    const eng = new TickEngine(s);
    const kinds = new Set<string>();
    for (let i = 0; i < 90; i++) {
      eng.settleTicks(100);
      const before = serializeState(s);
      const snap = npcBoardSnapshot(s);
      expect(serializeState(s)).toBe(before);
      expect(snap.tick).toBe(s.meta.tick);
      expect(snap.counts.claim + snap.counts.camp + snap.counts.gather).toBe(snap.activities.length);
      for (const a of snap.activities) {
        kinds.add(a.kind);
        expect(a.realmId).not.toBe("player");
        expect(typeof a.realmName).toBe("string");
        const p = s.board.provinces.find((x) => x.id === a.provinceId)!;
        expect([a.x, a.y]).toEqual([p.x, p.y]);
        if (a.kind === "claim") expect(a.phase).toBe("planted");
        if (a.kind === "camp") expect(a.phase).toBe("marching");
        if (a.kind === "gather") expect(["outbound", "gathering", "returning"]).toContain(a.phase);
      }
    }
    expect([...kinds].sort()).toEqual(["camp", "claim", "gather"]);
  });

  it("shows a claim for NPC_CLAIM_SHOW_TICKS, then drops it", () => {
    const s = fresh();
    const t = firstActingTick(s, "rival", maybeNpcClaim);
    s.meta.tick = t;
    const tile = maybeNpcClaim(s, "rival", t)!;
    expect(npcBoardSnapshot(s).activities).toContainEqual(
      expect.objectContaining({ kind: "claim", realmId: "rival", provinceId: tile.id, sinceTick: t, untilTick: t + NPC_CLAIM_SHOW_TICKS })
    );
    s.meta.tick = t + NPC_CLAIM_SHOW_TICKS;
    expect(npcBoardSnapshot(s).activities.filter((a) => a.kind === "claim")).toEqual([]);
  });

  it("a camp march entry matches its column", () => {
    const s = fresh();
    const t = firstActingTick(s, "rival", maybeNpcCampMarch);
    s.meta.tick = t;
    const camp = maybeNpcCampMarch(s, "rival", t)!;
    const m = listMarches(s).find((x) => x.realmId === "rival")!;
    const a = npcBoardSnapshot(s).activities.find((x) => x.kind === "camp")!;
    expect(a).toMatchObject({ id: m.id, provinceId: camp.id, fromId: m.fromId, untilTick: m.arrivesTick, sinceTick: t });
  });

  it("is deterministic with the board layer on", () => {
    const a = run(6000);
    const b = run(6000);
    expect(serializeState(a)).toBe(serializeState(b));
    expect(npcBoardSnapshot(a)).toEqual(npcBoardSnapshot(b));
  });
});

describe("clash lock", () => {
  function playerWar() {
    const s = fresh();
    s.wars = [];
    s.meta.tick = 1000;
    expect(tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" })).toBe(true);
    return s;
  }

  it("Fight is closed with no war", () => {
    const s = fresh();
    s.wars = [];
    expect(playerFightOpen(s)).toBe(false);
  });

  it("Fight is locked in columns and skirmish and opens at the main clash", () => {
    const s = playerWar();
    expect(playerFightOpen(s)).toBe(false);
    s.meta.tick = 1000 + WAR_PHASE_START.skirmish;
    expect(playerFightOpen(s)).toBe(false);
    s.meta.tick = 1000 + WAR_PHASE_START.clash - 1;
    expect(playerFightOpen(s)).toBe(false);
    s.meta.tick = 1000 + WAR_PHASE_START.clash;
    expect(playerFightOpen(s)).toBe(true);
  });

  it("white peace stays available while Fight is locked", () => {
    const s = playerWar();
    s.meta.tick = 1010;
    expect(playerFightOpen(s)).toBe(false);
    expect(tryWhitePeace(s)).toBe(true);
  });
});
