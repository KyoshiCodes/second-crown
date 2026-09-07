import type { GameState } from "@second-crown/shared";
import { realmPower } from "./combat.js";
import { getOpinion } from "../actions/diplomacy.js";
import { archetypeForRealm, driftOpinions, growRealm } from "../content/world.js";
import { pushWorldLog } from "./events.js";
import { isShielded, noteWar } from "./wave.js";
import { tickWorldClash } from "./worldClash.js";
import { getProvince } from "./board.js";
import { tryNpcMarch } from "./march.js";
import { D, toDecimalString } from "../core/decimal.js";

export const RivalSystem = {
  nextEventTick(_state: GameState): number | null {
    return null;
  },
  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    const start = Math.floor(fromTick / 100) + 1;
    const end = Math.floor(toTick / 100);
    for (let step = start; step <= end; step++) tickAi(state, step * 100);
  },
  processEventsAt(_state: GameState, _tick: number): void {},
  tick(state: GameState): void {
    if (state.meta.tick > 0 && state.meta.tick % 100 === 0) tickAi(state, state.meta.tick);
  },
};

export function tickWorldPulse(state: GameState, atTick: number): void {
  tickAi(state, atTick);
}

function tickAi(state: GameState, atTick: number): void {
  driftOpinions(state);
  for (const realm of state.realms) {
    if (realm.id === "player") continue;
    growRealm(state, realm.id);
    maybeClaim(state, realm.id, atTick);
    maybeTrade(state, realm.id, atTick);
    maybeNpcWar(state, realm.id, atTick);
    maybeDeclare(state, realm.id, atTick);
  }
  tickWorldClash(state, atTick);
}

function peaceLocked(state: GameState, a: string, b: string): boolean {
  const t1 = typeof state.flags[`peace_${a}_${b}`] === "number" ? (state.flags[`peace_${a}_${b}`] as number) : 0;
  const t2 = typeof state.flags[`peace_${b}_${a}`] === "number" ? (state.flags[`peace_${b}_${a}`] as number) : 0;
  return state.meta.tick < Math.max(t1, t2);
}

function maybeClaim(state: GameState, realmId: string, atTick: number): void {
  const home = state.board.provinces.find((p) => p.occupantRealmId === realmId && p.node === "hold");
  const open = state.board.provinces.find(
    (p) => !p.occupantRealmId && p.node !== "hold" && p.id !== state.board.homeProvinceId
  );
  if (!open) return;
  open.occupantRealmId = realmId;
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "claim", `${name} plants a marker on ${open.x},${open.y}`);
  if (home) tryNpcMarch(state, realmId, open.id);
  void atTick;
}

function maybeTrade(state: GameState, realmId: string, atTick: number): void {
  if (atTick % 300 !== 0) return;
  const others = state.realms.filter((r) => r.id !== realmId);
  const partner = others[atTick % others.length];
  if (!partner) return;
  if (realmId === "player" || partner.id === "player") {
    state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").add(1));
  }
  const a = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "trade", `${a} trades caravans with ${partner.name}`);
}

function maybeNpcWar(state: GameState, realmId: string, atTick: number): void {
  if (state.wars.some((w) => w.status === "active" && (w.attackerRealmId === realmId || w.defenderRealmId === realmId))) return;
  if (atTick % 400 !== 0) return;
  const foe = state.realms.find((r) => r.id !== realmId && r.id !== "player");
  if (!foe) return;
  if (peaceLocked(state, realmId, foe.id)) return;
  state.wars.push({
    id: `war_npc_${realmId}_${foe.id}_${atTick}`,
    attackerRealmId: realmId,
    defenderRealmId: foe.id,
    startedTick: atTick,
    status: "active",
  });
  const a = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "declare", `${a} makes war on ${foe.name}`);
}

function maybeDeclare(state: GameState, realmId: string, atTick: number): void {
  if (isShielded(state)) return;
  if (peaceLocked(state, realmId, "player")) return;
  if (state.wars.some((w) => w.status === "active" && w.defenderRealmId === "player")) return;
  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  const opinion = ruler ? getOpinion(state, ruler.id, "char_player") : 0;
  if (opinion >= 20) return;
  const arch = archetypeForRealm(realmId);
  const needEdge = opinion <= -40 ? Math.max(0, (arch?.declareEdge ?? 5) - 5) : arch?.declareEdge ?? 5;
  if (realmPower(state, realmId) < realmPower(state, "player") + needEdge) return;
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  state.wars.push({
    id: `war_${realmId}_${atTick}`,
    attackerRealmId: realmId,
    defenderRealmId: "player",
    startedTick: atTick,
    status: "active",
  });
  state.inputLog.push({
    tick: atTick,
    type: "declare_war",
    payload: { attackerRealmId: realmId, defenderRealmId: "player" },
    issuerId: realmId,
  });
  pushWorldLog(state, "declare", `${name} declares war on Your Crown`);
  noteWar(state);
  getProvince(state, state.board.homeProvinceId);
}
