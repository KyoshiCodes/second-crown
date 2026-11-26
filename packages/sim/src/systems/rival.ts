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
import { NPC_RAID_PULSE_TICKS } from "../content/livingRealm.js";
import { maybeNpcCampMarch, maybeNpcClaim, maybeNpcGatherCrew } from "./npcBoard.js";
import { flagContestOpen, noteFlagContest, pruneFlagContests } from "./flagContest.js";
import { atWar, maybeNpcTrade, maybeNpcWar, maybeWhisper, settleNpcWars, tickCorrespondence, tickWarPhases } from "./livingRealm.js";

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

function tickAi(state: GameState, atTick: number): void {
  ensureBoard(state);
  driftOpinions(state);
  pruneFlagContests(state, atTick);
  for (const realm of npcs(state)) {
    growRealm(state, realm.id);
    maybeNpcClaim(state, realm.id, atTick);
    maybeNpcCampMarch(state, realm.id, atTick);
    maybeContestFlag(state, realm.id, atTick);
    maybeNpcGatherCrew(state, realm.id, atTick);
    maybeNpcTrade(state, realm.id, atTick);
    maybeNpcWar(state, realm.id, atTick);
    if (atTick % NPC_RAID_PULSE_TICKS === 0) maybeNpcRaid(state, realm.id, atTick);
    maybeDeclare(state, realm.id, atTick);
  }
  tickCorrespondence(state, atTick);
  maybeWhisper(state, atTick);
  settleNpcWars(state, atTick);
  tickWarPhases(state, atTick);
  tickWorldClash(state, atTick);
}

function peaceLocked(state: GameState, a: string, b: string): boolean {
  const t1 = typeof state.flags[`peace_${a}_${b}`] === "number" ? (state.flags[`peace_${a}_${b}`] as number) : 0;
  const t2 = typeof state.flags[`peace_${b}_${a}`] === "number" ? (state.flags[`peace_${b}_${a}`] as number) : 0;
  return state.meta.tick < Math.max(t1, t2);
}

export function maybeContestFlag(state: GameState, realmId: string, atTick: number): boolean {
  if (realmId === "player") return false;
  if (peaceLocked(state, realmId, "player")) return false;
  if (isShielded(state)) return false;
  // First player flag that is open to a contest (flagContest.ts: one column per flag, then a
  // cooldown). With living_flag_cooldown off every flag is open, so this is the first flag, as before.
  const flag = state.board.provinces.find(
    (p) =>
      p.occupantRealmId === "player" &&
      p.id !== state.board.homeProvinceId &&
      p.node !== "hold" &&
      flagContestOpen(state, p.id, atTick)
  );
  if (!flag) return false;
  if (!tryNpcMarch(state, realmId, flag.id)) return false;
  noteFlagContest(state, flag.id, realmId, atTick);
  const name = state.realms.find((r) => r.id === realmId)?.name ?? realmId;
  pushWorldLog(state, "raid", `${name} contests your flag at ${flag.x},${flag.y}`);
  return true;
}

function maybeDeclare(state: GameState, realmId: string, atTick: number): void {
  if (isShielded(state)) return;
  if (peaceLocked(state, realmId, "player")) return;
  if (state.wars.some((w) => w.status === "active" && w.defenderRealmId === "player")) return;
  // A realm already fighting another realm does not open a second front on the player.
  if (atWar(state, realmId)) return;
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
