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
