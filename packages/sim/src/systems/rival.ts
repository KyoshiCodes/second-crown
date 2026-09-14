import type { GameState } from "@second-crown/shared";
import { realmPower } from "./combat.js";
import { getOpinion } from "../actions/diplomacy.js";
import { archetypeForRealm, driftOpinions, growRealm } from "../content/world.js";
import { pushWorldLog } from "./events.js";
import { isShielded, noteWar } from "./wave.js";
import { tickWorldClash } from "./worldClash.js";
import { ensureBoard } from "./board.js";
import { tryNpcMarch } from "./march.js";
import { maybeNpcRaid } from "./raidMarch.js";
import { tryNpcGather } from "./gather.js";
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

function npcs(state: GameState) {
  return state.realms.filter((r) => r.id !== "player");
}

function salt(realmId: string): number {
  let n = 0;
  for (let i = 0; i < realmId.length; i++) n = (n + realmId.charCodeAt(i) * (i + 3)) % 997;
  return n;
}

function tickAi(state: GameState, atTick: number): void {
  ensureBoard(state);
  driftOpinions(state);
  for (const realm of npcs(state)) {
    growRealm(state, realm.id);
    maybeClaim(state, realm.id, atTick);
    maybeCampMarch(state, realm.id, atTick);
    maybeContestFlag(state, realm.id, atTick);
    maybeGather(state, realm.id, atTick);
    maybeTrade(state, realm.id, atTick);
    maybeNpcWar(state, realm.id, atTick);
    if (atTick % 500 === 0) maybeNpcRaid(state, realm.id, atTick);
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
  if ((atTick + salt(realmId)) % 200 !== 0) return;
  const open = state.board.provinces.find(
    (p) => !p.occupantRealmId && p.node !== "hold" && p.id !== state.board.homeProvinceId
  );
  if (!open) return;
  open.occupantRealmId = realmId;
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "claim", `${name} plants a marker on ${open.x},${open.y}`);
}

function maybeCampMarch(state: GameState, realmId: string, atTick: number): void {
  if ((atTick + salt(realmId)) % 300 !== 0) return;
  const camp = state.board.provinces.find((p) => p.node === "camp" && p.occupantRealmId !== realmId && p.id !== state.board.homeProvinceId);
  if (!camp) return;
  if (tryNpcMarch(state, realmId, camp.id)) {
    const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
    pushWorldLog(state, "raid", `${name} rides on a camp at ${camp.x},${camp.y}`);
  }
}

function maybeGather(state: GameState, realmId: string, atTick: number): void {
  if ((atTick + salt(realmId)) % 200 !== 0) return;
  if (!tryNpcGather(state, realmId)) return;
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "gather", `${name} sends foragers onto the board`);
}

export function maybeContestFlag(state: GameState, realmId: string, atTick: number): boolean {
  if (realmId === "player") return false;
  if (peaceLocked(state, realmId, "player")) return false;
  if (isShielded(state)) return false;
  const flag = state.board.provinces.find(
    (p) => p.occupantRealmId === "player" && p.id !== state.board.homeProvinceId && p.node !== "hold"
  );
  if (!flag) return false;
  if (!tryNpcMarch(state, realmId, flag.id)) return false;
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "raid", `${name} contests your flag at ${flag.x},${flag.y}`);
  return true;
}

function maybeTrade(state: GameState, realmId: string, atTick: number): void {
  if ((atTick + salt(realmId)) % 300 !== 0) return;
  const others = state.realms.filter((r) => r.id !== realmId);
  if (!others.length) return;
  const partner = others[(atTick + salt(realmId)) % others.length];
  if (partner.id === "player") {
    state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").add(1));
  }
  const a = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "trade", `${a} trades caravans with ${partner.name}`);
}

function maybeNpcWar(state: GameState, realmId: string, atTick: number): void {
  if ((atTick + salt(realmId)) % 400 !== 0) return;
  if (state.wars.some((w) => w.status === "active" && (w.attackerRealmId === realmId || w.defenderRealmId === realmId))) return;
  const foes = npcs(state).filter((r) => r.id !== realmId && !peaceLocked(state, realmId, r.id));
  if (!foes.length) return;
  const foe = foes[(atTick + salt(realmId)) % foes.length];
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
}
