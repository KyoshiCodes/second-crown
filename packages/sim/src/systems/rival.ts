import type { GameState } from "@second-crown/shared";
import { realmPower } from "./combat.js";
import { getOpinion } from "../actions/diplomacy.js";
import { archetypeForRealm, driftOpinions, growRealm } from "../content/world.js";
import { pushWorldLog } from "./events.js";
import { isShielded, noteWar } from "./wave.js";
import { tickWorldClash } from "./worldClash.js";
import { maybeNpcRaid } from "./raidMarch.js";

export const RivalSystem = {
  nextEventTick(_state: GameState): number | null {
    return null;
  },

  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    const start = Math.floor(fromTick / 100) + 1;
    const end = Math.floor(toTick / 100);
    for (let step = start; step <= end; step++) {
      tickAi(state, step * 100);
    }
  },

  processEventsAt(_state: GameState, _tick: number): void {},

  tick(state: GameState): void {
    if (state.meta.tick > 0 && state.meta.tick % 100 === 0) {
      tickAi(state, state.meta.tick);
    }
  },
};

function tickAi(state: GameState, atTick: number): void {
  driftOpinions(state);
  for (const realm of state.realms) {
    if (realm.id === "player") continue;
    growRealm(state, realm.id);
    maybeDeclare(state, realm.id, atTick);
    if (atTick % 200 === 0 && realm.id === "rival") maybeNpcRaid(state, realm.id, atTick);
  }
  tickWorldClash(state, atTick);
}

function peaceLocked(state: GameState, a: string, b: string): boolean {
  const k1 = state.flags[`peace_${a}_${b}`];
  const k2 = state.flags[`peace_${b}_${a}`];
  const t1 = typeof k1 === "number" ? k1 : 0;
  const t2 = typeof k2 === "number" ? k2 : 0;
  return state.meta.tick < Math.max(t1, t2);
}

function maybeDeclare(state: GameState, realmId: string, atTick: number): void {
  if (isShielded(state)) return;
  if (peaceLocked(state, realmId, "player")) return;
  if (state.wars.some((w) => w.status === "active")) return;

  const ruler = state.characters.find((c) => c.realmId === realmId && c.role === "ruler");
  const opinion = ruler ? getOpinion(state, ruler.id, "char_player") : 0;
  if (opinion >= 20) return;

  const arch = archetypeForRealm(realmId);
  const needEdge = opinion <= -40 ? Math.max(0, (arch?.declareEdge ?? 5) - 5) : arch?.declareEdge ?? 5;

  const theirP = realmPower(state, realmId);
  const playerP = realmPower(state, "player");
  if (theirP < playerP + needEdge) return;

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
