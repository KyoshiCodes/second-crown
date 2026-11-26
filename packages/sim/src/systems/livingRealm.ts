import type { GameState, War } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import {
  CULTURE_NEWS_CAP,
  NPC_TRADE_PULSES,
  NPC_WAR_PEACE_TICKS,
  NPC_WAR_PULSES,
  NPC_WAR_WIN_EDGE,
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  WAR_PHASE_TITLE,
  WHISPER_PULSES,
  whisperLinesFor,
  type WarPhaseId,
} from "../content/livingRealm.js";
import { realmPower } from "./combat.js";
import { activeWarFor } from "../actions/war.js";
import { cultureOfRealm } from "./culture.js";
import { pushWorldLog } from "./events.js";
import { addCapped } from "./storage.js";

/**
 * Living Realm, first slice. NPC caravans, realm whispers, NPC wars with a timed
 * settle, and war phases. Everything runs on the 100-tick world pulse (rival.ts)
 * and is picked by tick + realm-id salt, never by RNG, so replays match.
 */

// ---------------------------------------------------------------- switches

export interface LivingSwitches {
  npcTrade: boolean;
  whispers: boolean;
  npcWars: boolean;
  npcClaim: boolean;
  npcCamp: boolean;
  npcGather: boolean;
}

/** Flag name per switch. A flag set to `false` turns that behaviour off. */
export const LIVING_SWITCH_FLAGS: Record<keyof LivingSwitches, string> = {
  npcTrade: "living_npc_trade",
  whispers: "living_whispers",
  npcWars: "living_npc_wars",
  npcClaim: "living_npc_claim",
  npcCamp: "living_npc_camp",
  npcGather: "living_npc_gather",
};

/** All on by default. A flag set to `false` turns one off (tests, harness, a future setting). */
export function livingSwitches(state: GameState): LivingSwitches {
  const out = {} as LivingSwitches;
  for (const key of Object.keys(LIVING_SWITCH_FLAGS) as (keyof LivingSwitches)[]) {
    out[key] = state.flags[LIVING_SWITCH_FLAGS[key]] !== false;
  }
  return out;
}

export function setLivingSwitch(state: GameState, key: keyof LivingSwitches, on: boolean): void {
  const flag = LIVING_SWITCH_FLAGS[key];
  if (on) delete state.flags[flag];
  else state.flags[flag] = false;
}

// ---------------------------------------------------------------- helpers

export function realmSalt(realmId: string): number {
  let n = 0;
  for (let i = 0; i < realmId.length; i++) n = (n + realmId.charCodeAt(i) * (i + 3)) % 997;
  return n;
}

export function nameOf(state: GameState, realmId: string): string {
  return state.realms.find((r) => r.id === realmId)?.name ?? realmId;
}

export function count(state: GameState, key: string): number {
  const v = state.flags[key];
  return typeof v === "number" ? v : 0;
}

export function bumpCount(state: GameState, key: string): void {
  state.flags[key] = count(state, key) + 1;
}

/** True while a peace lock between a and b runs at `atTick`. */
export function peaceLockedAt(state: GameState, a: string, b: string, atTick: number): boolean {
  return atTick < Math.max(count(state, `peace_${a}_${b}`), count(state, `peace_${b}_${a}`));
}

export function atWarWith(state: GameState, a: string, b: string): boolean {
  return state.wars.some(
    (w) =>
      w.status === "active" &&
      ((w.attackerRealmId === a && w.defenderRealmId === b) || (w.attackerRealmId === b && w.defenderRealmId === a))
  );
}

export function atWar(state: GameState, realmId: string): boolean {
  return state.wars.some((w) => w.status === "active" && (w.attackerRealmId === realmId || w.defenderRealmId === realmId));
}

// ---------------------------------------------------------------- culture news

export interface CultureNews {
  tick: number;
  kind: "whisper" | "caravan";
  fromRealmId: string;
  toRealmId: string;
  text: string;
}

export function getCultureNews(state: GameState): CultureNews[] {
  const raw = state.flags.culture_news;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as CultureNews[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushCultureNews(state: GameState, item: CultureNews): void {
  const list = getCultureNews(state);
  list.push(item);
  state.flags.culture_news = JSON.stringify(list.slice(-CULTURE_NEWS_CAP));
}

/** Counters for the playtest harness. */
export function livingCounts(state: GameState): {
  trades: number;
  playerTrades: number;
  whispers: number;
  npcWars: number;
  npcClaims: number;
  npcCampMarches: number;
  npcGathers: number;
} {
  return {
    trades: count(state, "living_trades"),
    playerTrades: count(state, "living_player_trades"),
    whispers: count(state, "living_whispers_sent"),
    npcWars: count(state, "living_npc_wars_started"),
    npcClaims: count(state, "living_npc_claims"),
    npcCampMarches: count(state, "living_npc_camp_marches"),
    npcGathers: count(state, "living_npc_gathers"),
  };
}

// ---------------------------------------------------------------- caravans

/**
 * NPC caravans. A realm trades every NPC_TRADE_PULSES pulses (staggered by salt) with a
 * partner it is not at war or peace-locked with. A caravan to the player needs a market
 * (the same gate as the player's own trades) and pays the existing +1 gold, capped.
 * Returns the partner id, or null when no caravan went out.
 */
export function maybeNpcTrade(state: GameState, realmId: string, atTick: number): string | null {
  if (!livingSwitches(state).npcTrade) return null;
  const pulse = Math.floor(atTick / 100);
  const salt = realmSalt(realmId);
  if ((pulse + salt) % NPC_TRADE_PULSES !== 0) return null;
  const others = state.realms.filter((r) => r.id !== realmId);
  if (!others.length) return null;
  const partner = others[(pulse + salt) % others.length];
  if (atWarWith(state, realmId, partner.id) || peaceLockedAt(state, realmId, partner.id, atTick)) return null;
  const a = nameOf(state, realmId);
  if (partner.id === "player") {
    if (countBuilding(state, "market") < 1) return null;
    addCapped(state, "gold", 1);
    bumpCount(state, "living_player_trades");
    bumpCount(state, "living_trades");
    pushWorldLog(state, "trade", `${a} trades caravans with ${partner.name}`);
    return partner.id;
  }
  bumpCount(state, "living_trades");
  pushCultureNews(state, {
    tick: atTick,
    kind: "caravan",
    fromRealmId: realmId,
    toRealmId: partner.id,
    text: `${a} trades caravans with ${partner.name}`,
  });
  return partner.id;
}

// ---------------------------------------------------------------- whispers

/**
 * One realm whisper every WHISPER_PULSES pulses: an NPC realm sends a short line from its
 * culture's table to a realm it is not at war with (the player included). Pure text.
 */
export function maybeWhisper(state: GameState, atTick: number): CultureNews | null {
  if (!livingSwitches(state).whispers) return null;
  const pulse = Math.floor(atTick / 100);
  if (pulse <= 0 || pulse % WHISPER_PULSES !== 0) return null;
  const npcs = state.realms.filter((r) => r.id !== "player");
  if (!npcs.length) return null;
  const round = pulse / WHISPER_PULSES;
  const from = npcs[(round + state.meta.seed) % npcs.length];
  const listeners = state.realms.filter((r) => r.id !== from.id && !atWarWith(state, from.id, r.id));
  if (!listeners.length) return null;
  const salt = realmSalt(from.id);
  const to = listeners[(round + salt) % listeners.length];
  const lines = whisperLinesFor(cultureOfRealm(state, from.id));
  const line = lines[(round + salt) % lines.length].replace(/\{to\}/g, to.name);
  const item: CultureNews = {
    tick: atTick,
    kind: "whisper",
    fromRealmId: from.id,
    toRealmId: to.id,
    text: `${from.name} to ${to.name}: "${line}"`,
  };
  pushCultureNews(state, item);
  bumpCount(state, "living_whispers_sent");
  return item;
}

// ---------------------------------------------------------------- NPC wars

/**
 * An NPC realm at peace may declare on another NPC realm at peace (never the player:
 * that is rival.ts maybeDeclare). Every NPC_WAR_PULSES pulses, staggered by salt.
 */
export function maybeNpcWar(state: GameState, realmId: string, atTick: number): War | null {
  if (!livingSwitches(state).npcWars) return null;
  const pulse = Math.floor(atTick / 100);
  if (pulse <= 0 || (pulse + realmSalt(realmId)) % NPC_WAR_PULSES !== 0) return null;
  if (atWar(state, realmId)) return null;
  const foes = state.realms.filter(
    (r) => r.id !== "player" && r.id !== realmId && !atWar(state, r.id) && !peaceLockedAt(state, realmId, r.id, atTick)
  );
  if (!foes.length) return null;
  const foe = foes[(pulse + realmSalt(realmId)) % foes.length];
  const war: War = {
    id: `war_npc_${realmId}_${foe.id}_${atTick}`,
    attackerRealmId: realmId,
    defenderRealmId: foe.id,
    startedTick: atTick,
    status: "active",
  };
  state.wars.push(war);
  bumpCount(state, "living_npc_wars_started");
  pushWorldLog(state, "declare", `${nameOf(state, realmId)} makes war on ${foe.name}`);
  return war;
}

/** True for a war between two NPC realms. */
export function isNpcWar(war: War): boolean {
  return war.attackerRealmId !== "player" && war.defenderRealmId !== "player";
}

/**
 * Timed settle: when an NPC war reaches its main clash it ends by comparing realm power
 * (existing realmPower, no casualties, no loot). A clear edge is a win; otherwise white peace.
 * Either way the pair is peace-locked for NPC_WAR_PEACE_TICKS.
 */
export function settleNpcWars(state: GameState, atTick: number): War[] {
  const settled: War[] = [];
  for (const war of state.wars) {
    if (war.status !== "active" || !isNpcWar(war)) continue;
    if (atTick - war.startedTick < WAR_PHASE_START.clash) continue;
    const pa = realmPower(state, war.attackerRealmId);
    const pd = realmPower(state, war.defenderRealmId);
    const edge = Math.max(pa, pd) * NPC_WAR_WIN_EDGE;
    war.status = pa - pd > edge ? "attacker_won" : pd - pa > edge ? "defender_won" : "white_peace";
    war.endedTick = atTick;
    state.flags[`peace_${war.attackerRealmId}_${war.defenderRealmId}`] = atTick + NPC_WAR_PEACE_TICKS;
    pushWorldLog(state, "battle", aftermathLine(state, war));
    settled.push(war);
  }
  return settled;
}

// ---------------------------------------------------------------- war phases

export interface WarPhase {
  id: WarPhaseId;
  /** 1–4, for a step meter. */
  step: number;
  title: string;
  line: string;
  warId: string;
  sinceTick: number;
  /** When the next phase begins; null when it waits on the player (clash) or is the last. */
  untilTick: number | null;
}

function aftermathLine(state: GameState, war: War): string {
  const a = nameOf(state, war.attackerRealmId);
  const d = nameOf(state, war.defenderRealmId);
  if (war.status === "attacker_won") return `${a} holds the field. ${d} falls back.`;
  if (war.status === "defender_won") return `${d} holds the field. ${a} falls back.`;
  if (war.status === "white_peace") return `${a} and ${d} part in white peace.`;
  return `The war between ${a} and ${d} is over.`;
}

/** Siege wars are created and fought in the same tick by a raid arriving; they have no lead-up. */
function isInstantWar(war: War): boolean {
  return war.id.startsWith("w_siege_");
}

/**
 * The phase a war is in at `atTick` (default: now). Pure read. Active wars walk
 * columns → skirmish → clash by ticks since declared; a finished war shows its
 * aftermath for WAR_AFTERMATH_TICKS, then null. The player's Fight is the main clash
 * and may be pressed in any phase; NPC wars settle themselves at the clash.
 */
export function warPhase(state: GameState, war: War, atTick = state.meta.tick): WarPhase | null {
  const a = nameOf(state, war.attackerRealmId);
  const d = nameOf(state, war.defenderRealmId);
  const base = { warId: war.id };
  if (war.status !== "active") {
    const ended = war.endedTick ?? war.startedTick;
    if (atTick - ended >= WAR_AFTERMATH_TICKS) return null;
    return { ...base, id: "aftermath", step: 4, title: WAR_PHASE_TITLE.aftermath, line: aftermathLine(state, war), sinceTick: ended, untilTick: ended + WAR_AFTERMATH_TICKS };
  }
  const t = atTick - war.startedTick;
  const s = war.startedTick;
  if (t < WAR_PHASE_START.skirmish) {
    return { ...base, id: "columns", step: 1, title: WAR_PHASE_TITLE.columns, line: `Columns form: ${a} musters against ${d}.`, sinceTick: s, untilTick: s + WAR_PHASE_START.skirmish };
  }
  if (t < WAR_PHASE_START.clash) {
    const pa = realmPower(state, war.attackerRealmId);
    const pd = realmPower(state, war.defenderRealmId);
    return { ...base, id: "skirmish", step: 2, title: WAR_PHASE_TITLE.skirmish, line: `Outriders skirmish on the road: ${a} ${pa} power to ${d} ${pd}.`, sinceTick: s + WAR_PHASE_START.skirmish, untilTick: s + WAR_PHASE_START.clash };
  }
  const line = isNpcWar(war) ? `${a} and ${d} meet in the main clash.` : "The main lines face each other. Fight to commit.";
  return { ...base, id: "clash", step: 3, title: WAR_PHASE_TITLE.clash, line, sinceTick: s + WAR_PHASE_START.clash, untilTick: null };
}

/** The player's current war phase: their active war, else the aftermath of their latest war. Sieges excluded. */
export function playerWarPhase(state: GameState, atTick = state.meta.tick): WarPhase | null {
  for (let i = state.wars.length - 1; i >= 0; i--) {
    const w = state.wars[i];
    if (isInstantWar(w) || isNpcWar(w)) continue;
    const p = warPhase(state, w, atTick);
    if (p && (w.status === "active" || p.id === "aftermath")) return p;
  }
  return null;
}

/**
 * On each world pulse: write one ledger line when a player war enters a new phase.
 * NPC wars log only their declare and settle (above), to keep the ledger readable.
 * The last logged phase sits in `war_phase_<warId>` and is cleared after the aftermath.
 */
export function tickWarPhases(state: GameState, atTick: number): void {
  for (const war of state.wars) {
    const key = `war_phase_${war.id}`;
    if (isInstantWar(war) || isNpcWar(war)) continue;
    const had = state.flags[key];
    if (war.status !== "active" && had === undefined) continue;
    const p = warPhase(state, war, atTick);
    if (!p) {
      delete state.flags[key];
      continue;
    }
    if (had === p.id) continue;
    state.flags[key] = p.id;
    pushWorldLog(state, `war_${p.id}`, `${p.title}: ${p.line}`);
  }
}

/**
 * Every phase a war reached by `atTick`, with the tick it began. Pure; used by the harness.
 * A battle fought before the clash timer (the player's Fight) counts as the clash at that tick;
 * a white peace before it skips the clash.
 */
export function warPhaseTimeline(war: War, atTick: number): { id: WarPhaseId; tick: number }[] {
  const s = war.startedTick;
  const end = war.status === "active" ? Number.POSITIVE_INFINITY : war.endedTick ?? s;
  const upTo = Math.min(end, atTick);
  const out: { id: WarPhaseId; tick: number }[] = [];
  if (s <= atTick) out.push({ id: "columns", tick: s });
  if (s + WAR_PHASE_START.skirmish < end && s + WAR_PHASE_START.skirmish <= atTick) out.push({ id: "skirmish", tick: s + WAR_PHASE_START.skirmish });
  if (s + WAR_PHASE_START.clash <= upTo) out.push({ id: "clash", tick: s + WAR_PHASE_START.clash });
  else if ((war.status === "attacker_won" || war.status === "defender_won") && end <= atTick) out.push({ id: "clash", tick: end });
  if (end <= atTick) out.push({ id: "aftermath", tick: end });
  return out;
}

// ---------------------------------------------------------------- clash lock

/**
 * True when the player may press Fight: they have an active war and it has reached the
 * main clash. A siege war (fought the tick it starts) never locks. White peace is not
 * gated by this; it stays open in every phase. Pure read for the War tab.
 */
export function playerFightOpen(state: GameState, atTick = state.meta.tick): boolean {
  const war = activeWarFor(state);
  if (!war) return false;
  if (isInstantWar(war)) return true;
  return warPhase(state, war, atTick)?.id === "clash";
}
