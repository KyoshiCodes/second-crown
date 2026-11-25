import {
  RESEARCH,
  getBuildingType,
  getWorldLog,
  incomingOnHome,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";
import { formatLetterSuffix, TICKS_PER_SECOND } from "@second-crown/shared";
import { formatHorizon } from "../horizon/horizon";
import { bottleneckPhrase, bottlenecks } from "../CostProjection";
import { nextResearch } from "../ResearchHint";
import { foodDeficitText, projectCost, realmRates, type RealmRates } from "../projection";

/**
 * "While you were away": a read-only diff of the realm before and after offline
 * settlement. Every line comes from state the sim already keeps (buildings, study
 * flags, stores, wars, the world log). Nothing here changes state or invents facts.
 */

/** Below this many settled ticks (one game minute) no summary is shown. */
export const AWAY_MIN_TICKS = 60 * TICKS_PER_SECOND;

/** Stores shown in the change line, in this order, then any others the realm holds. */
const STORE_ORDER = ["food", "wood", "stone", "gold"];

/** World-log kinds that concern the player's own realm. "keep" is left out: the works line covers it. */
const LOG_KINDS = new Set(["raid", "battle", "march", "loot", "declare", "levy"]);

export interface AwaySnapshot {
  tick: number;
  resources: Record<string, number>;
  /** Player buildings by id: level and whether finished. */
  buildings: Record<string, { level: number; done: boolean }>;
  /** Study ids already finished. */
  studies: string[];
  /** Player wars by id and their status. */
  wars: Record<string, string>;
  troops: number;
}

export interface AwaySummary {
  /** Settled game time in plain words, e.g. "3h 12m". */
  elapsed: string;
  /** "Farm built", "Keep to level 2". */
  works: string[];
  /** Study names finished while away. */
  studies: string[];
  /** Raids, battles, wars and troop losses involving the player. Newest first, at most three. */
  events: string[];
  /** Events beyond the three shown. */
  moreEvents: number;
  /** "+1.2K food", "−40 gold". */
  changes: string[];
  /** Stores at their warehouse cap now. */
  full: string[];
  /** One next decision or blocker, or null when nothing stands out. */
  next: string | null;
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Same rule as the sim's researchDone, read without writing the finished flag. */
function studyFinished(state: GameState, id: string): boolean {
  if (num(state.flags[`research_${id}`]) === 1) return true;
  const until = num(state.flags[`research_${id}_until`]);
  return until > 0 && state.meta.tick >= until;
}

function playerTroops(state: GameState): number {
  return state.units.filter((u) => u.realmId === "player").reduce((s, u) => s + num(u.count), 0);
}

function realmName(state: GameState, id: string): string {
  if (id === "player") return "Your Crown";
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

/** Pure read of the fields the summary compares. Take it before offline settlement. */
export function snapshotForAway(state: GameState): AwaySnapshot {
  const resources: Record<string, number> = {};
  for (const [res, v] of Object.entries(state.resources)) resources[res] = num(v);
  const buildings: AwaySnapshot["buildings"] = {};
  for (const b of state.buildings) {
    if (b.realmId === "player") buildings[b.id] = { level: b.level, done: b.completesAtTick === null };
  }
  const wars: Record<string, string> = {};
  for (const w of state.wars) {
    if (w.attackerRealmId === "player" || w.defenderRealmId === "player") wars[w.id] = w.status;
  }
  return {
    tick: state.meta.tick,
    resources,
    buildings,
    studies: Object.keys(RESEARCH).filter((id) => studyFinished(state, id)),
    wars,
    troops: playerTroops(state),
  };
}

function signed(n: number): string {
  const s = formatLetterSuffix(Math.abs(Math.round(n)));
  return `${n < 0 ? "−" : "+"}${s}`;
}

/**
 * The one next decision. Order: a column on the hold, a food deficit, an idle lectern
 * whose next study is already paid for, then the Limiter line's first entry.
 */
export function awayNextStep(state: GameState, rates: RealmRates = realmRates(state)): string | null {
  const inbound = incomingOnHome(state)[0];
  if (inbound) {
    const eta = Math.max(0, Math.ceil((inbound.arrivesTick - state.meta.tick) / TICKS_PER_SECOND));
    return `A column marches on your hold · arrives in ~${formatHorizon(eta)}.`;
  }
  const deficit = foodDeficitText(rates);
  if (deficit) return `${deficit}. Raise farms or trim the army.`;
  const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
  const running = ids.some((id) => !studyFinished(state, id) && researchTicksLeft(state, id) > 0);
  const next = nextResearch(state);
  if (!running && next?.ready) {
    const p = projectCost(RESEARCH[next.id].cost, rates);
    if (!p.limiter || p.limiter.short === 0) return `Lectern is idle. Stores cover ${RESEARCH[next.id].name}: start it.`;
  }
  const first = bottlenecks(state, rates)[0];
  return first ? `${bottleneckPhrase(first)}.` : null;
}

/** Diff of a snapshot taken before settlement against the settled state. */
export function buildAwaySummary(before: AwaySnapshot, after: GameState, settledTicks: number): AwaySummary {
  const works: string[] = [];
  for (const b of after.buildings) {
    if (b.realmId !== "player") continue;
    const was = before.buildings[b.id];
    if (!was) continue;
    const name = getBuildingType(b.typeId)?.name ?? b.typeId;
    const done = b.completesAtTick === null;
    if (!was.done && done) works.push(`${name} built`);
    else if (was.done && done && b.level > was.level) works.push(`${name} to level ${b.level}`);
  }

  const had = new Set(before.studies);
  const studies = Object.keys(RESEARCH)
    .filter((id) => !had.has(id) && studyFinished(after, id))
    .map((id) => RESEARCH[id as keyof typeof RESEARCH].name);

  const events: string[] = [];
  const lost = before.troops - playerTroops(after);
  if (lost >= 1) events.push(`Troops down ${formatLetterSuffix(Math.round(lost))} (net, after any training)`);
  for (const w of after.wars) {
    const ours = w.attackerRealmId === "player" || w.defenderRealmId === "player";
    if (!ours || w.status === "active" || before.wars[w.id] === w.status) continue;
    const foe = realmName(after, w.attackerRealmId === "player" ? w.defenderRealmId : w.attackerRealmId);
    const won =
      (w.status === "attacker_won" && w.attackerRealmId === "player") ||
      (w.status === "defender_won" && w.defenderRealmId === "player");
    const lostWar =
      (w.status === "attacker_won" && w.defenderRealmId === "player") ||
      (w.status === "defender_won" && w.attackerRealmId === "player");
    events.push(won ? `War with ${foe} won` : lostWar ? `War with ${foe} lost` : `War with ${foe} ended`);
  }
  const log = getWorldLog(after)
    .filter((e) => e.tick > before.tick && LOG_KINDS.has(e.id))
    .filter((e) => (e.id === "declare" || e.id === "levy" ? e.text.includes("Your Crown") : true))
    .sort((a, b) => b.tick - a.tick)
    .map((e) => e.text);
  events.push(...log);
  const shownEvents = events.slice(0, 3);

  const changes: string[] = [];
  const full: string[] = [];
  const keys = [...STORE_ORDER, ...Object.keys(after.resources).filter((r) => !STORE_ORDER.includes(r))];
  const rates = realmRates(after);
  for (const res of keys) {
    if (after.resources[res] === undefined && before.resources[res] === undefined) continue;
    const now = num(after.resources[res]);
    const delta = now - (before.resources[res] ?? 0);
    if (Math.abs(delta) >= 1) changes.push(`${signed(delta)} ${res}`);
    const cap = rates.cap[res];
    if (cap !== undefined && Number.isFinite(cap) && cap > 0 && now >= cap) full.push(res);
  }

  return {
    elapsed: formatHorizon(settledTicks / TICKS_PER_SECOND),
    works,
    studies,
    events: shownEvents,
    moreEvents: events.length - shownEvents.length,
    changes: changes.slice(0, 4),
    full,
    next: awayNextStep(after, rates),
  };
}
