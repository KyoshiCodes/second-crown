import type { GameState, War, WarStatus } from "@second-crown/shared";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { D, toDecimalString } from "../core/decimal.js";
import {
  CULTURE_NEWS_CAP,
  NPC_WAR_LOSS_CAP,
  NPC_WAR_LOSS_SHARE,
  NPC_TRADE_PULSES,
  NPC_WAR_PEACE_TICKS,
  NPC_WAR_PULSES,
  NPC_WAR_WIN_EDGE,
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  WAR_PHASE_TITLE,
  WHISPER_PULSES,
  WHISPER_REPLY_DELAY_TICKS,
  WHISPER_REPLY_QUEUE_CAP,
  whisperLinesFor,
  WHISPERS,
  whisperReplyLinesFor,
  playerReplyLinesFor,
  type FormationId,
  type ColumnMarkId,
  type WarPhaseId,
} from "../content/livingRealm.js";
import { realmPower } from "./combat.js";
import { activeWarFor } from "../actions/war.js";
import { noteWar } from "./wave.js";
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
  /** One contesting column per player flag, then FLAG_CONTEST_COOLDOWN_TICKS of quiet (flagContest.ts). */
  flagCooldown: boolean;
  /** NPC-vs-NPC wars cost the loser (both on white peace) a capped share of its units. */
  npcWarLosses: boolean;
  /** One home raid in flight, then HOME_RAID_COOLDOWN_TICKS of quiet after it resolves (raidMarch.ts). */
  homeRaidCooldown: boolean;
  /** The player may join one side of an NPC-vs-NPC war (joinSide). False hides the action. */
  joinNpcWar: boolean;
  /** A realm answers a whisper it received once, WHISPER_REPLY_DELAY_TICKS later. False: one-way whispers only. */
  correspondence: boolean;
  /** The player may answer a whisper they received with one fixed line (replyToWhisper). False hides the action. */
  playerReply: boolean;
  /**
   * Fair whisper listener rotation: each sender walks its listener list one step per turn, so
   * every listener (the player included) hears from every sender in turn. False: the old picker,
   * which can lock a sender onto one listener forever.
   */
  whisperFair: boolean;
  /**
   * Whisper line variety (slice 9): each sender cycles through its culture's lines over its own
   * successive turns, so no line repeats until all have been said. False: the old line picker
   * (round + salt), which can repeat one line per sender.
   */
  whisperVariety: boolean;
}

/** Flag name per switch. A flag set to `false` turns that behaviour off. */
export const LIVING_SWITCH_FLAGS: Record<keyof LivingSwitches, string> = {
  npcTrade: "living_npc_trade",
  whispers: "living_whispers",
  npcWars: "living_npc_wars",
  npcClaim: "living_npc_claim",
  npcCamp: "living_npc_camp",
  npcGather: "living_npc_gather",
  flagCooldown: "living_flag_cooldown",
  npcWarLosses: "living_npc_war_losses",
  homeRaidCooldown: "living_home_raid_cooldown",
  joinNpcWar: "living_join_npc_war",
  correspondence: "living_correspondence",
  playerReply: "living_player_reply",
  whisperFair: "living_whisper_fair",
  whisperVariety: "living_whisper_variety",
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
  kind: "whisper" | "caravan" | "reply";
  fromRealmId: string;
  toRealmId: string;
  text: string;
  /** Whispers only, while `living_correspondence` is on: stable id a reply points back to (`wh_<tick>`). */
  id?: string;
  /** Replies only: the id of the whisper being answered. */
  replyTo?: string;
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
  flagContests: number;
  npcWarLosses: number;
  homeRaids: number;
  replies: number;
  playerReplies: number;
  playerWhispers: number;
  distinctWhisperLines: number;
} {
  return {
    trades: count(state, "living_trades"),
    playerTrades: count(state, "living_player_trades"),
    whispers: count(state, "living_whispers_sent"),
    npcWars: count(state, "living_npc_wars_started"),
    npcClaims: count(state, "living_npc_claims"),
    npcCampMarches: count(state, "living_npc_camp_marches"),
    npcGathers: count(state, "living_npc_gathers"),
    flagContests: count(state, "living_flag_contests"),
    npcWarLosses: count(state, "living_npc_war_losses_units"),
    homeRaids: count(state, "living_home_raids"),
    replies: count(state, "living_replies_sent"),
    playerReplies: count(state, "living_player_replies"),
    playerWhispers: count(state, "living_whispers_to_player"),
    distinctWhisperLines: distinctWhisperLines(state),
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
 *
 * Sender: NPCs take turns by round + seed (unchanged). Listener, with `living_whisper_fair` on:
 * `turn` counts how many times this sender has had the floor, and the listener index steps by
 * one per turn, so over L turns (L = listeners) a sender reaches every listener once. With no
 * war or peace lock in the way, every NPC whispers to the player once every npcs × L rounds.
 * Off: the old index (round + salt), which with L = npcs always lands on the same listener.
 *
 * Line, with `living_whisper_variety` on: whisperLineIndex(turn, salt, lines), so a sender cycles
 * through its culture's lines over its own turns. Off: lines[(round + salt) % lines].
 */
export function maybeWhisper(state: GameState, atTick: number): CultureNews | null {
  if (!livingSwitches(state).whispers) return null;
  const pulse = Math.floor(atTick / 100);
  if (pulse <= 0 || pulse % WHISPER_PULSES !== 0) return null;
  const npcs = state.realms.filter((r) => r.id !== "player");
  if (!npcs.length) return null;
  const round = pulse / WHISPER_PULSES;
  const from = npcs[(round + state.meta.seed) % npcs.length];
  const corr = livingSwitches(state).correspondence;
  // With correspondence on, a peace-locked pair does not exchange words either. Off: the old filter.
  const listeners = state.realms.filter(
    (r) => r.id !== from.id && !atWarWith(state, from.id, r.id) && !(corr && peaceLockedAt(state, from.id, r.id, atTick))
  );
  if (!listeners.length) return null;
  const salt = realmSalt(from.id);
  const turn = Math.floor((round + state.meta.seed) / npcs.length);
  const pick = livingSwitches(state).whisperFair ? turn + salt : round + salt;
  const to = listeners[pick % listeners.length];
  const lines = whisperLinesFor(cultureOfRealm(state, from.id));
  const lineIdx = livingSwitches(state).whisperVariety ? whisperLineIndex(turn, salt, lines.length) : (round + salt) % lines.length;
  const line = lines[lineIdx].replace(/\{to\}/g, to.name);
  const item: CultureNews = {
    tick: atTick,
    kind: "whisper",
    fromRealmId: from.id,
    toRealmId: to.id,
    text: `${from.name} to ${to.name}: "${line}"`,
  };
  if (corr) {
    item.id = `wh_${atTick}`;
    // NPC listeners answer on their own. The player's realm is never made to speak for them.
    if (to.id !== "player") {
      queueReply(state, { whisperId: item.id, fromRealmId: to.id, toRealmId: from.id, dueTick: atTick + WHISPER_REPLY_DELAY_TICKS });
    }
  }
  pushCultureNews(state, item);
  bumpCount(state, "living_whispers_sent");
  if (to.id === "player") bumpCount(state, "living_whispers_to_player");
  markWhisperLine(state, cultureOfRealm(state, from.id), lineIdx);
  return item;
}

/** Bit offset per whisper table (culture), in WHISPERS order. 5 tables × 4 lines = 20 bits. */
const WHISPER_LINE_BASE: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let at = 0;
  for (const [k, lines] of Object.entries(WHISPERS)) {
    out[k] = at;
    at += lines.length;
  }
  return out;
})();

/** Note a (table, line) pair as said. Bitmask in `living_whisper_lines_seen`; measure only. */
function markWhisperLine(state: GameState, culture: string, lineIdx: number): void {
  const table = culture in WHISPERS ? culture : "western";
  const bit = WHISPER_LINE_BASE[table] + lineIdx;
  if (bit >= 30) return;
  const seen = count(state, "living_whisper_lines_seen");
  state.flags.living_whisper_lines_seen = seen | (1 << bit);
}

/** How many distinct whisper lines (culture table + line) have been sent. */
export function distinctWhisperLines(state: GameState): number {
  let m = count(state, "living_whisper_lines_seen");
  let n = 0;
  while (m) {
    n += m & 1;
    m >>>= 1;
  }
  return n;
}

/**
 * Line index for a sender's `turn`-th whisper (slice 9, `living_whisper_variety`). Turns come in
 * blocks of `n` (n = lines); inside a block every line is said once, in order, from
 * `(salt + block) % n`. Each new block starts one line later, so a sender whose listener count
 * equals `n` does not tell each listener the same line every cycle. With n >= 3 two successive
 * whispers from one sender never share a line. Pure function of turn, salt and n.
 */
export function whisperLineIndex(turn: number, salt: number, n: number): number {
  if (n <= 0) return 0;
  return (turn + Math.floor(turn / n) + salt) % n;
}

/** What the app needs for "next whisper in ~Ns". Read-only. */
export interface NextWhisperHint {
  /** The state's current tick. */
  tick: number;
  /** The next world pulse (strictly after `tick`) on which maybeWhisper runs its sender pick. */
  nextPulseTick: number;
  /** (nextPulseTick - tick) in seconds, rounded up (10 ticks = 1 s). */
  secondsApprox: number;
}

/**
 * The next whisper pulse after the current tick, or null when `living_whispers` is off or there
 * is no NPC realm to send one. A pulse is a chance, not a promise: a sender at war with or
 * peace-locked against every realm stays silent that pulse. Pure read.
 */
export function nextWhisperHint(state: GameState): NextWhisperHint | null {
  if (!livingSwitches(state).whispers) return null;
  if (!state.realms.some((r) => r.id !== "player")) return null;
  const tick = state.meta.tick;
  const every = WHISPER_PULSES * 100;
  const nextPulseTick = (Math.floor(tick / every) + 1) * every;
  return { tick, nextPulseTick, secondsApprox: Math.ceil((nextPulseTick - tick) / TICKS_PER_SECOND) };
}

// ---------------------------------------------------------------- correspondence (slice 6)

/** A reply owed: `fromRealmId` (who got the whisper) answers `toRealmId` at `dueTick`. */
export interface PendingReply {
  whisperId: string;
  fromRealmId: string;
  toRealmId: string;
  dueTick: number;
}

const REPLY_QUEUE_KEY = "culture_pending_replies";

export function getPendingReplies(state: GameState): PendingReply[] {
  const raw = state.flags[REPLY_QUEUE_KEY];
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingReply[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setPendingReplies(state: GameState, list: PendingReply[]): void {
  if (list.length) state.flags[REPLY_QUEUE_KEY] = JSON.stringify(list.slice(-WHISPER_REPLY_QUEUE_CAP));
  else delete state.flags[REPLY_QUEUE_KEY];
}

function queueReply(state: GameState, p: PendingReply): void {
  const list = getPendingReplies(state);
  // One reply per whisper: a whisper id is queued at most once.
  if (list.some((q) => q.whisperId === p.whisperId)) return;
  setPendingReplies(state, [...list, p]);
}

/**
 * On each world pulse: send every reply whose delay has run out, oldest first. Each pending
 * reply leaves the queue when its time comes, sent or not, so a whisper gets at most one answer.
 * It is dropped (never sent, never retried) when the two realms are at war or peace-locked at
 * that tick, or either realm is gone. Off switch: nothing sends and the queue waits.
 * Returns the replies sent.
 */
export function tickCorrespondence(state: GameState, atTick: number): CultureNews[] {
  if (!livingSwitches(state).correspondence) return [];
  const list = getPendingReplies(state);
  if (!list.length) return [];
  const sent: CultureNews[] = [];
  const keep: PendingReply[] = [];
  for (const p of list) {
    if (p.dueTick > atTick) {
      keep.push(p);
      continue;
    }
    const from = state.realms.find((r) => r.id === p.fromRealmId);
    const to = state.realms.find((r) => r.id === p.toRealmId);
    if (!from || !to || atWarWith(state, from.id, to.id) || peaceLockedAt(state, from.id, to.id, atTick)) continue;
    const salt = realmSalt(from.id);
    const lines = whisperReplyLinesFor(cultureOfRealm(state, from.id));
    const line = lines[(Math.floor(p.dueTick / 100) + salt) % lines.length].replace(/\{to\}/g, to.name);
    const item: CultureNews = {
      tick: atTick,
      kind: "reply",
      fromRealmId: from.id,
      toRealmId: to.id,
      text: `${from.name} answers ${to.name}: "${line}"`,
      replyTo: p.whisperId,
    };
    pushCultureNews(state, item);
    bumpCount(state, "living_replies_sent");
    sent.push(item);
  }
  setPendingReplies(state, keep);
  return sent;
}

// ---------------------------------------------------------------- player reply (slice 7)

/** A whisper the player received and may still answer. */
export interface ReplyableWhisper {
  whisper: CultureNews & { id: string };
  /** The player's reply lines (their culture), already filled with the whisperer's name. Index = lineIndex. */
  lines: string[];
}

function answered(news: CultureNews[], whisperId: string): boolean {
  return news.some((n) => n.kind === "reply" && n.replyTo === whisperId);
}

function playerLines(state: GameState, toRealmId: string): string[] {
  const to = nameOf(state, toRealmId);
  return playerReplyLinesFor(cultureOfRealm(state, "player")).map((l) => l.replace(/\{to\}/g, to));
}

/**
 * Whispers sent to the player that they may answer now, newest first. A whisper qualifies when
 * it carries an id (correspondence on when it was sent), is still in the culture news list, has
 * no reply yet, and the player is neither at war nor peace-locked with the sender.
 * Empty when `living_player_reply` is off. Pure read.
 */
export function replyableWhispers(state: GameState, atTick = state.meta.tick): ReplyableWhisper[] {
  if (!livingSwitches(state).playerReply) return [];
  const news = getCultureNews(state);
  const out: ReplyableWhisper[] = [];
  for (let i = news.length - 1; i >= 0; i--) {
    const n = news[i];
    if (n.kind !== "whisper" || n.toRealmId !== "player" || !n.id) continue;
    if (answered(news, n.id)) continue;
    if (!state.realms.some((r) => r.id === n.fromRealmId)) continue;
    if (atWarWith(state, "player", n.fromRealmId) || peaceLockedAt(state, "player", n.fromRealmId, atTick)) continue;
    out.push({ whisper: n as CultureNews & { id: string }, lines: playerLines(state, n.fromRealmId) });
  }
  return out;
}

/**
 * The player answers whisper `whisperId` with fixed line `lineIndex` from their culture's
 * PLAYER_REPLIES table. One reply per whisper. The reply is a culture-news item with the same
 * shape as an NPC reply (kind "reply", replyTo), sent at the current tick. Never automatic.
 * Refuses (null) when the switch is off, the whisper is unknown or not to the player, already
 * answered, the line index is out of range, or the player is at war or peace-locked with the sender.
 */
export function replyToWhisper(state: GameState, whisperId: string, lineIndex: number): CultureNews | null {
  const open = replyableWhispers(state).find((r) => r.whisper.id === whisperId);
  if (!open) return null;
  if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= open.lines.length) return null;
  const w = open.whisper;
  const you = nameOf(state, "player");
  const to = nameOf(state, w.fromRealmId);
  const item: CultureNews = {
    tick: state.meta.tick,
    kind: "reply",
    fromRealmId: "player",
    toRealmId: w.fromRealmId,
    text: `${you} answers ${to}: "${open.lines[lineIndex]}"`,
    replyTo: w.id,
  };
  pushCultureNews(state, item);
  bumpCount(state, "living_player_replies");
  state.inputLog.push({ tick: state.meta.tick, type: "reply_whisper", payload: { whisperId, lineIndex }, issuerId: "player" });
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

/** Units lost by each side of a settled NPC war (slice 4). Absent on player wars and when losses are off. */
export interface NpcWarLosses {
  warId: string;
  attacker: number;
  defender: number;
}

/**
 * Take NPC_WAR_LOSS_SHARE of each of `realmId`'s unit stacks (floored per stack, in state
 * order), stopping at NPC_WAR_LOSS_CAP units in all. The committed force is the realm's whole
 * standing force: NPC wars have no columns. A floored share below 100% never empties a stack.
 * Refuses the player outright. Returns units lost.
 */
export function applyNpcWarLoss(state: GameState, realmId: string): number {
  if (realmId === "player") return 0;
  let left = NPC_WAR_LOSS_CAP;
  let lost = 0;
  for (const u of state.units) {
    if (left <= 0) break;
    if (u.realmId !== realmId) continue;
    const have = Math.floor(D(u.count).toNumber());
    const n = Math.min(left, Math.floor(have * NPC_WAR_LOSS_SHARE));
    if (n <= 0) continue;
    u.count = toDecimalString(D(u.count).sub(n));
    left -= n;
    lost += n;
  }
  return lost;
}

const LOSS_KEY = "npc_war_losses_json";
/** Loss records kept for the aftermath line; older ones drop off. */
const LOSS_LOG_CAP = 8;

export function getNpcWarLosses(state: GameState): NpcWarLosses[] {
  const raw = state.flags[LOSS_KEY];
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as NpcWarLosses[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function npcWarLossesFor(state: GameState, warId: string): NpcWarLosses | null {
  return getNpcWarLosses(state).find((l) => l.warId === warId) ?? null;
}

function recordNpcWarLosses(state: GameState, rec: NpcWarLosses): void {
  const list = getNpcWarLosses(state);
  list.push(rec);
  state.flags[LOSS_KEY] = JSON.stringify(list.slice(-LOSS_LOG_CAP));
  state.flags.living_npc_war_losses_units = count(state, "living_npc_war_losses_units") + rec.attacker + rec.defender;
}

/**
 * Timed settle: when an NPC war reaches its main clash it ends by comparing realm power
 * (existing realmPower, no loot). A clear edge is a win; otherwise white peace. Power is read
 * before any loss. With `living_npc_war_losses` on (default) the loser, or both sides on white
 * peace, then loses a capped share (applyNpcWarLoss). Either way the pair is peace-locked for
 * NPC_WAR_PEACE_TICKS. Only wars between two NPC realms settle here.
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
    if (livingSwitches(state).npcWarLosses) {
      const hitA = war.status !== "attacker_won";
      const hitD = war.status !== "defender_won";
      recordNpcWarLosses(state, {
        warId: war.id,
        attacker: hitA ? applyNpcWarLoss(state, war.attackerRealmId) : 0,
        defender: hitD ? applyNpcWarLoss(state, war.defenderRealmId) : 0,
      });
    }
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
  const loss = isNpcWar(war) ? npcWarLossesFor(state, war.id) : null;
  if (war.status === "attacker_won") return `${a} holds the field. ${d} falls back${loss ? `, ${loss.defender} lost` : ""}.`;
  if (war.status === "defender_won") return `${d} holds the field. ${a} falls back${loss ? `, ${loss.attacker} lost` : ""}.`;
  if (war.status === "white_peace") return `${a} and ${d} part in white peace${loss ? ` (${a} ${loss.attacker} lost, ${d} ${loss.defender} lost)` : ""}.`;
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
  return war ? warFightOpen(state, war, atTick) : false;
}

/** True when `war` (active) may be fought now: a siege war, or one that reached the main clash. */
export function warFightOpen(state: GameState, war: War, atTick = state.meta.tick): boolean {
  if (war.status !== "active") return false;
  if (isInstantWar(war)) return true;
  return warPhase(state, war, atTick)?.id === "clash";
}

// ---------------------------------------------------------------- join an NPC war (slice 5)

export type WarSide = "attacker" | "defender";

/** One NPC-vs-NPC war the player could join now, and which sides are open to them. */
export interface JoinableWar {
  warId: string;
  attackerRealmId: string;
  attackerName: string;
  defenderRealmId: string;
  defenderName: string;
  phase: WarPhaseId;
  startedTick: number;
  /** A side is closed when the player is peace-locked with the realm they would fight. */
  sides: Record<WarSide, boolean>;
}

function foeOf(war: War, side: WarSide): string {
  return side === "attacker" ? war.defenderRealmId : war.attackerRealmId;
}

function allyOf(war: War, side: WarSide): string {
  return side === "attacker" ? war.attackerRealmId : war.defenderRealmId;
}

/**
 * Active NPC-vs-NPC wars the player may join at `atTick` (default: now), in state order.
 * Empty when `living_join_npc_war` is off or the player is already at war. Pure read.
 */
export function joinableWars(state: GameState, atTick = state.meta.tick): JoinableWar[] {
  if (!livingSwitches(state).joinNpcWar) return [];
  if (atWar(state, "player")) return [];
  const out: JoinableWar[] = [];
  for (const war of state.wars) {
    if (war.status !== "active" || !isNpcWar(war) || isInstantWar(war)) continue;
    const sides: Record<WarSide, boolean> = {
      attacker: !peaceLockedAt(state, "player", foeOf(war, "attacker"), atTick),
      defender: !peaceLockedAt(state, "player", foeOf(war, "defender"), atTick),
    };
    if (!sides.attacker && !sides.defender) continue;
    out.push({
      warId: war.id,
      attackerRealmId: war.attackerRealmId,
      attackerName: nameOf(state, war.attackerRealmId),
      defenderRealmId: war.defenderRealmId,
      defenderName: nameOf(state, war.defenderRealmId),
      phase: warPhase(state, war, atTick)?.id ?? "columns",
      startedTick: war.startedTick,
      sides,
    });
  }
  return out;
}

/**
 * The player joins `side` of the NPC war `warId`. This opens a player war against the other
 * side, started on the NPC war's start tick so it shares its phase clock. From there the usual
 * rules apply: phases, the Fight lock until the main clash, White Peace any time. The NPC war
 * itself stays NPC-vs-NPC and still settles (and takes its losses) between the two NPC realms;
 * the player's war is not an NPC war, so it never takes the NPC loss share.
 * Refuses (null) when the switch is off, the player is at war, the war is missing, ended or not
 * NPC-vs-NPC, the side is unknown, or the player is peace-locked with the realm they would fight.
 */
export function joinSide(state: GameState, warId: string, side: WarSide): War | null {
  if (side !== "attacker" && side !== "defender") return null;
  const open = joinableWars(state).find((j) => j.warId === warId);
  if (!open || !open.sides[side]) return null;
  const npc = state.wars.find((w) => w.id === warId)!;
  const ally = allyOf(npc, side);
  const foe = foeOf(npc, side);
  const war: War = {
    id: `war_join_${state.meta.tick}_${state.wars.length}`,
    attackerRealmId: "player",
    defenderRealmId: foe,
    startedTick: npc.startedTick,
    status: "active",
    joinedWarId: npc.id,
    allyRealmId: ally,
  };
  state.wars.push(war);
  noteWar(state);
  state.inputLog.push({ tick: state.meta.tick, type: "join_npc_war", payload: { warId, side }, issuerId: "player" });
  bumpCount(state, "living_npc_wars_joined");
  pushWorldLog(state, "declare", `${nameOf(state, "player")} rides beside ${nameOf(state, ally)} against ${nameOf(state, foe)}`);
  return war;
}

// ---------------------------------------------------------------- joined-war outcome (slice 6)

/**
 * How a war the player joined (joinSide) ended. Read-only: built from the finished player war
 * and the NPC war it joined; nothing here changes how either settles.
 */
export interface JoinedWarOutcome {
  /** The player's war (war_join_…). */
  warId: string;
  /** The NPC-vs-NPC war the player joined. */
  joinedWarId: string;
  allyRealmId: string;
  allyName: string;
  foeRealmId: string;
  foeName: string;
  endedTick: number;
  /** The player war's final status. */
  status: Exclude<WarStatus, "active">;
  /** Who held the field in the player's war: the player, the foe, or nobody (white peace / plain end). */
  heldField: "player" | "foe" | null;
  heldFieldRealmId: string | null;
  heldFieldName: string | null;
  whitePeace: boolean;
  /** The joined NPC war's own result; null while it is still active. */
  npcWar: { status: Exclude<WarStatus, "active">; heldFieldRealmId: string | null; whitePeace: boolean } | null;
  /** Always false: the player's side never takes the NPC war loss share (applyNpcWarLoss refuses the player). */
  playerTookNpcLossShare: false;
  /** One calm line for the app. */
  line: string;
}

function heldFieldOf(war: War): string | null {
  if (war.status === "attacker_won") return war.attackerRealmId;
  if (war.status === "defender_won") return war.defenderRealmId;
  return null;
}

/** Outcome of the finished joined war `warId`; null when unknown, not a joined war, or still active. Pure read. */
export function joinedWarOutcome(state: GameState, warId: string): JoinedWarOutcome | null {
  const war = state.wars.find((w) => w.id === warId);
  if (!war || !war.joinedWarId || war.status === "active") return null;
  const status = war.status;
  const foe = war.attackerRealmId === "player" ? war.defenderRealmId : war.attackerRealmId;
  const ally = war.allyRealmId ?? "";
  const heldId = heldFieldOf(war);
  const heldField = heldId === null ? null : heldId === "player" ? "player" : "foe";
  const whitePeace = status === "white_peace";
  const npc = state.wars.find((w) => w.id === war.joinedWarId);
  const npcStatus = npc?.status;
  const npcWar =
    npc && npcStatus && npcStatus !== "active"
      ? { status: npcStatus, heldFieldRealmId: heldFieldOf(npc), whitePeace: npcStatus === "white_peace" }
      : null;
  const you = nameOf(state, "player");
  const foeName = nameOf(state, foe);
  const allyName = nameOf(state, ally);
  const head =
    heldField === "player"
      ? `${you} and ${allyName} hold the field against ${foeName}.`
      : heldField === "foe"
        ? `${foeName} holds the field against ${you} and ${allyName}.`
        : whitePeace
          ? `${you} and ${foeName} part in white peace.`
          : `The war beside ${allyName} against ${foeName} is over.`;
  return {
    warId: war.id,
    joinedWarId: war.joinedWarId,
    allyRealmId: ally,
    allyName,
    foeRealmId: foe,
    foeName,
    endedTick: war.endedTick ?? war.startedTick,
    status,
    heldField,
    heldFieldRealmId: heldId,
    heldFieldName: heldId ? nameOf(state, heldId) : null,
    whitePeace,
    npcWar,
    playerTookNpcLossShare: false,
    line: `${head} Your side took no NPC war losses.`,
  };
}

/** The most recently finished joined war's outcome, or null. Pure read. */
export function latestJoinedWarOutcome(state: GameState): JoinedWarOutcome | null {
  for (let i = state.wars.length - 1; i >= 0; i--) {
    const w = state.wars[i];
    if (w.joinedWarId && w.status !== "active") return joinedWarOutcome(state, w.id);
  }
  return null;
}

// ---------------------------------------------------------------- joined-war formation (slice 7)

/** One side of a joined war, for the formation view. */
export interface FormationSide {
  realmIds: string[];
  names: string[];
}

/** A joined war's formation at a glance. Read-only; no combat formula or phase timing here. */
export interface JoinedWarFormation {
  /** The player's war (war_join_…). */
  warId: string;
  /** The NPC-vs-NPC war the player joined. */
  joinedWarId: string;
  /** The player and the ally they ride beside. */
  ours: FormationSide;
  /** The realm they fight. */
  theirs: FormationSide;
  phase: WarPhaseId;
  /** columns → muster, skirmish → skirmish, clash → clash, aftermath → fall-back. */
  formation: FormationId;
  /** False while a finished joined war shows its aftermath (fall-back). */
  active: boolean;
}

const FORMATION_OF: Record<WarPhaseId, FormationId> = {
  columns: "muster",
  skirmish: "skirmish",
  clash: "clash",
  aftermath: "fall-back",
};

/**
 * Formation snapshot for joined wars (joinSide), in state order: every active one, plus a
 * finished one while its aftermath shows (formation "fall-back"). Phase comes from warPhase,
 * unchanged. Pure read.
 */
export function formationSnapshot(state: GameState, atTick = state.meta.tick): JoinedWarFormation[] {
  const out: JoinedWarFormation[] = [];
  for (const war of state.wars) {
    if (!war.joinedWarId) continue;
    const phase = warPhase(state, war, atTick);
    if (!phase) continue;
    const foe = war.attackerRealmId === "player" ? war.defenderRealmId : war.attackerRealmId;
    const oursIds = war.allyRealmId ? ["player", war.allyRealmId] : ["player"];
    out.push({
      warId: war.id,
      joinedWarId: war.joinedWarId,
      ours: { realmIds: oursIds, names: oursIds.map((id) => nameOf(state, id)) },
      theirs: { realmIds: [foe], names: [nameOf(state, foe)] },
      phase: phase.id,
      formation: FORMATION_OF[phase.id],
      active: war.status === "active",
    });
  }
  return out;
}

// ---------------------------------------------------------------- column marks (slice 8)

/** Column marks for the player's joined war, by phase. Read-only; no combat formula or phase timing. */
export interface ColumnMark {
  /** The player's war (war_join_…). */
  warId: string;
  /** The NPC-vs-NPC war the player joined. */
  joinedWarId: string;
  /** The player and the ally they ride beside. */
  ours: FormationSide;
  /** The realm they fight. */
  theirs: FormationSide;
  phase: WarPhaseId;
  /** columns → column, skirmish → skirmish-line, clash → clash-line, aftermath → falling-back. */
  column: ColumnMarkId;
  /** Ranks the board draws (slice 9): column 1, skirmish-line 2, clash-line 3, falling-back 1. */
  ranks: ColumnRanks;
  /** False only while a finished joined war shows its aftermath (falling-back). */
  active: boolean;
}

const COLUMN_OF: Record<WarPhaseId, ColumnMarkId> = {
  columns: "column",
  skirmish: "skirmish-line",
  clash: "clash-line",
  aftermath: "falling-back",
};

/** Rank count per column mark (slice 9). Presentation only; derived from the phase. */
export type ColumnRanks = 1 | 2 | 3;
export const COLUMN_RANKS: Record<ColumnMarkId, ColumnRanks> = {
  column: 1,
  "skirmish-line": 2,
  "clash-line": 3,
  "falling-back": 1,
};

/** Ranks for a war phase: columns 1, skirmish 2, clash 3, aftermath 1. Pure. */
export function columnRanks(phase: WarPhaseId): ColumnRanks {
  return COLUMN_RANKS[COLUMN_OF[phase]];
}

/**
 * Column marks for the player's joined war: the newest active joined war, else the newest
 * finished one still showing its aftermath ("falling-back"), else null. Phase comes from
 * warPhase, unchanged. Pure read.
 */
export function columnMarkSnapshot(state: GameState, atTick = state.meta.tick): ColumnMark | null {
  const rows = formationSnapshot(state, atTick);
  const pick = [...rows].reverse().find((r) => r.active) ?? [...rows].reverse()[0];
  if (!pick) return null;
  return {
    warId: pick.warId,
    joinedWarId: pick.joinedWarId,
    ours: pick.ours,
    theirs: pick.theirs,
    phase: pick.phase,
    column: COLUMN_OF[pick.phase],
    ranks: columnRanks(pick.phase),
    active: pick.active,
  };
}

// ---------------------------------------------------------------- war imagery (slice 5)

/** One active war for the board's war imagery. Read-only. */
export interface WarImageryEntry {
  warId: string;
  attackerRealmId: string;
  attackerName: string;
  defenderRealmId: string;
  defenderName: string;
  phase: WarPhaseId;
  /** True when the player is one of the two sides. */
  player: boolean;
  /** The NPC realm the player fights beside, when this war came from joinSide. */
  allyRealmId: string | null;
  /** False while a finished war shows its aftermath. */
  active: boolean;
  /** Short banner: who is mustering, skirmishing, clashing, or falling back. */
  banner: string;
}

function bannerLine(war: War, a: string, d: string, phase: WarPhaseId, ally: string | null): string {
  const side = ally ? `${a} and ${ally}` : a;
  const s = ally ? "" : "s";
  if (phase === "columns") return `${side} muster${s} against ${d}`;
  if (phase === "skirmish") return `${side} skirmish${ally ? "" : "es"} with ${d}`;
  if (phase === "clash") return `${side} clash${ally ? "" : "es"} with ${d}`;
  if (war.status === "attacker_won") return `${d} falls back from ${side}`;
  if (war.status === "defender_won") return `${side} fall${s} back from ${d}`;
  return `${side} and ${d} fall back`;
}

/**
 * Every war on the board (sieges excluded, they have no lead-up) with its two sides, current
 * phase and a banner line, in state order: active wars, plus finished ones while their
 * aftermath shows (the "falling back" banner). Pure read; no combat formula or phase timing here.
 */
export function warImagerySnapshot(state: GameState, atTick = state.meta.tick): WarImageryEntry[] {
  const out: WarImageryEntry[] = [];
  for (const war of state.wars) {
    if (isInstantWar(war)) continue;
    const phase = warPhase(state, war, atTick);
    if (!phase) continue;
    const a = nameOf(state, war.attackerRealmId);
    const d = nameOf(state, war.defenderRealmId);
    const ally = war.allyRealmId ?? null;
    out.push({
      warId: war.id,
      attackerRealmId: war.attackerRealmId,
      attackerName: a,
      defenderRealmId: war.defenderRealmId,
      defenderName: d,
      phase: phase.id,
      active: war.status === "active",
      player: !isNpcWar(war),
      allyRealmId: ally,
      banner: bannerLine(war, a, d, phase.id, ally ? nameOf(state, ally) : null),
    });
  }
  return out;
}
