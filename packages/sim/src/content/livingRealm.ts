/**
 * Living Realm, first slice: cadences and lines for NPC caravans, realm whispers,
 * NPC wars and war phases. Content only; systems/livingRealm.ts reads it.
 * Not a balance table: no costs, yields or combat numbers live here.
 */

/** NPC caravans: a realm sends one every N world pulses (a pulse is 100 ticks). */
export const NPC_TRADE_PULSES = 3;
/** One realm whisper somewhere in the realm every N world pulses. */
export const WHISPER_PULSES = 3;
/** An NPC realm that is at peace looks for a war every N world pulses. */
export const NPC_WAR_PULSES = 30;
/** Peace lock after an NPC war settles, in ticks. */
export const NPC_WAR_PEACE_TICKS = 900;
/** An NPC war settles as a win only when one side is this much stronger (fraction of the larger power). */
export const NPC_WAR_WIN_EDGE = 0.1;
/** Culture-news list length (whispers and NPC-to-NPC caravans). */
export const CULTURE_NEWS_CAP = 8;

/** War phases, in order. Stable ids the app styles by. */
export type WarPhaseId = "columns" | "skirmish" | "clash" | "aftermath";
export const WAR_PHASE_IDS: readonly WarPhaseId[] = ["columns", "skirmish", "clash", "aftermath"];

/** Ticks after a war starts that each phase begins. Multiples of 100 so world pulses land on them. */
export const WAR_PHASE_START: Record<"columns" | "skirmish" | "clash", number> = {
  columns: 0,
  skirmish: 100,
  clash: 300,
};
/** How long a finished war shows its aftermath. */
export const WAR_AFTERMATH_TICKS = 300;

export const WAR_PHASE_TITLE: Record<WarPhaseId, string> = {
  columns: "Columns forming",
  skirmish: "Skirmish",
  clash: "Main clash",
  aftermath: "Aftermath",
};

/**
 * Whisper lines by culture. `{to}` is the listener's realm name. One or two short sentences.
 * Picked by tick and realm salt, never by RNG.
 */
export const WHISPERS: Record<string, readonly string[]> = {
  western: [
    "Our levy drills at dawn. May yours never need to.",
    "The keep bell rang twice today. Only for a wedding.",
    "Send word if {to} needs masons. We have spare hands.",
    "Our heralds say the roads are quiet. Let them stay so.",
  ],
  woodland: [
    "The cedars are tall this year. {to} is welcome under them.",
    "We carved a post for a friend. It faces your road.",
    "Hide and bead for salt, if {to} will trade.",
    "The longhouse fires are lit. No smoke of war.",
  ],
  desert: [
    "The wells are full. A cup for {to}'s riders.",
    "Our lancers rest in the shade. Tell yours to do the same.",
    "Pale stone travels well. Ask our caravans.",
    "The courtyard lamps burn late. We talk of trade, not war.",
  ],
  steppe: [
    "The grass is long and the horses fat. Ride in peace, {to}.",
    "We saw your banners far off. We did not turn.",
    "Wide sky, short memory. Old quarrels can rest.",
    "A felt hall has room for one more fire. Yours, {to}.",
  ],
  tide: [
    "The tide brought salt fish. Some sail for {to}.",
    "Our stilt halls stand dry. The sea is kind this month.",
    "Green sails on the horizon are ours. Wave back.",
    "We charted a new shoal. {to}'s boats should mind it.",
  ],
};

/** Fallback for player-only cultures (mist, glen, salt, fen, peak build as western). */
export function whisperLinesFor(culture: string): readonly string[] {
  return WHISPERS[culture] ?? WHISPERS.western;
}

// ---------------------------------------------------------------- NPC board activity (slice 2)

/** An NPC realm tries to plant a claim marker every N world pulses (staggered by realm salt). */
export const NPC_CLAIM_PULSES = 4;
/** An NPC realm rides on a free camp every N world pulses. */
export const NPC_CAMP_PULSES = 6;
/** An NPC realm sends a foraging crew to a node every N world pulses. */
export const NPC_GATHER_PULSES = 3;
/** Most claim markers one NPC realm keeps on open tiles. */
export const NPC_CLAIM_CAP = 3;
/** Player ring: tiles within this Manhattan distance of the player's hold. */
export const NPC_PLAYER_RING = 2;
/** Grace window from tick 0: no NPC claim, camp march or gather inside the player ring. 3000 ticks = 5 minutes. */
export const NPC_BOARD_GRACE_TICKS = 3000;
/** NPC home raids may launch only on ticks that are multiples of this (rival.ts). Camp marches yield to them. */
export const NPC_RAID_PULSE_TICKS = 500;
/** How long a fresh claim marker shows in the board snapshot. */
export const NPC_CLAIM_SHOW_TICKS = 300;
/** Recent-claims list length. */
export const NPC_CLAIM_LOG_CAP = 8;

/** War tab line while the player's Fight waits on the main clash. */
export const FIGHT_LOCKED_LINE = "The lines have not closed";

// ---------------------------------------------------------------- flag contests (slice 3)

/** Most NPC columns contesting one player flag at the same time. */
export const FLAG_CONTEST_COLUMNS_PER_FLAG = 1;
/**
 * Quiet time on a flag after a contest ends, in ticks (10 ticks = 1 s). 500 = 50 seconds.
 * A contest ends on its column's arrival tick. NPCs only act on the 100-tick world pulse,
 * so the next contest starts on the first pulse at or after `arrival + cooldown`.
 */
export const FLAG_CONTEST_COOLDOWN_TICKS = 500;

// ---------------------------------------------------------------- NPC war losses and home-raid timing (slice 4)

/**
 * NPC-vs-NPC war losses at the settle. The losing side (both sides on white peace) loses
 * this share of each unit stack it fields, floored per stack. Player wars never use this.
 */
export const NPC_WAR_LOSS_SHARE = 0.12;
/** Hard cap on units one side can lose in one NPC war, so a realm is never emptied by a single war. */
export const NPC_WAR_LOSS_CAP = 20;

/** Most rival columns marching on the player's hold at the same time. */
export const HOME_RAID_IN_FLIGHT = 1;
/**
 * Quiet time after a home raid resolves (its column's arrival tick), in ticks (10 ticks = 1 s).
 * 750 = 75 seconds. Home raids only launch on NPC_RAID_PULSE_TICKS (500) pulses, and the
 * existing launch-to-launch gap (raidPressure.ts homeRaidGap) still applies, so the next raid
 * starts on the first raid pulse that clears all three.
 */
export const HOME_RAID_COOLDOWN_TICKS = 750;
