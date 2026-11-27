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
/** Culture-news list length (whispers, replies and NPC-to-NPC caravans). */
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
 * Whisper lines by culture, with culture voice (slice 10, `living_culture_voice`, on by default).
 * Same table sizes as WHISPERS_PLAIN (4 per culture), so line cycling is unchanged. `{to}` is the
 * listener's realm name. Voice: western formal and oath-bound; woodland slow, kin-speak, forest
 * images; desert host's courtesy and proverbs; steppe clipped, no greeting; tide sailor's cant.
 */
export const WHISPERS: Record<string, readonly string[]> = {
  western: [
    "By seal and steward's hand: {to} has the keep's good faith.",
    "The levy drills at dawn, by law and custom. Pray yours never needs to.",
    "Our masons stand idle and honest. Say the word, {to}, and they march with trowels.",
    "The heralds report the king's roads quiet. We intend to keep them so.",
  ],
  woodland: [
    "Kin of {to}: the cedars grow slow, and so does our anger. Walk easy.",
    "We carved your sign on the trail post. The moss has not covered it.",
    "The elders smoked on it. Hide and bead for {to}'s salt, when the snow goes.",
    "Longhouse fire, low and steady. The forest hears no war drum.",
  ],
  desert: [
    "Peace upon {to}. Our wells are full, and a guest never drinks second.",
    "The lancers sleep in the shade. The wise do not wake a calm noon.",
    "Pale stone, fine glass, honest weight. Our caravans swear by all three.",
    "Under the courtyard lamps we spoke your name, {to}. Kindly, as is proper.",
  ],
  steppe: [
    "Grass long. Horses fat. Ride through, {to}.",
    "Saw your banners. Did not turn. Remember that.",
    "Wide sky, short grudges. The old quarrel sleeps.",
    "One fire free in the felt hall. Yours, {to}. Bring meat.",
  ],
  tide: [
    "Fair tide, {to}. A hold of salt fish rides it your way.",
    "Stilt halls dry, nets heavy. The sea owes us nothing this month.",
    "Green sails off your coast are ours. Dip a flag; we'll dip back.",
    "New shoal charted, two cables off the point. Mind your keels, {to}.",
  ],
};

/** The slice 1-9 whisper lines (plain voice). Used when `living_culture_voice` is false. */
export const WHISPERS_PLAIN: Record<string, readonly string[]> = {
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

/**
 * Fallback for player-only cultures (mist, glen, salt, fen, peak build as western).
 * `voiced` false gives the plain (pre-slice-10) table.
 */
export function whisperLinesFor(culture: string, voiced = true): readonly string[] {
  const t = voiced ? WHISPERS : WHISPERS_PLAIN;
  return t[culture] ?? t.western;
}

// ---------------------------------------------------------------- culture correspondence (slice 6)

/**
 * A realm that received a whisper answers it once, this many ticks later (10 ticks = 1 s).
 * 300 = 30 seconds. Whispers go out on world pulses (multiples of 100), so the reply lands
 * exactly on the pulse 300 ticks after its whisper.
 */
export const WHISPER_REPLY_DELAY_TICKS = 300;
/** Pending replies kept at once; older ones drop (whispers come one per 300 ticks, so this never binds in play). */
export const WHISPER_REPLY_QUEUE_CAP = 8;

/**
 * Reply lines by culture, with culture voice (slice 10), matching WHISPERS. `{to}` is the realm
 * being answered (the original whisperer). Same sizes as WHISPER_REPLIES_PLAIN.
 */
export const WHISPER_REPLIES: Record<string, readonly string[]> = {
  western: [
    "The keep acknowledges {to}'s word, sealed and entered in the rolls.",
    "Courteously received. Our gate stands open to your heralds.",
    "It shall be read aloud at the next feast, {to}, with a toast.",
    "Agreed, upon our oath. The roads stay quiet.",
  ],
  woodland: [
    "We heard you under the cedars, kin. Your words may stay a while.",
    "A post for {to} too, facing back. The trail runs both ways.",
    "The elders nod. Salt for hide, in any season.",
    "Our smoke rises straight to answer yours. No drums.",
  ],
  desert: [
    "Your words came with the caravan, {to}, sweet as dates. A cup returns.",
    "The courtyard heard you and was glad. Trade is the better war.",
    "Shade and water for {to}'s riders, as a host has promised.",
    "Well spoken. Tonight the lamps burn for friends.",
  ],
  steppe: [
    "Heard, {to}. We ride easy.",
    "Horses know your banners now. No shying.",
    "Short memory. Long grass. Agreed.",
    "Fire is set for {to}. Come hungry.",
  ],
  tide: [
    "Your word came in on the flood, {to}. One goes out on the ebb.",
    "Stilt halls heard you. Fair winds and a following sea.",
    "Saw your flag dip. We dipped back. Did {to} see?",
    "Logged and charted. The shoal is yours to mind too.",
  ],
};

/** The slice 6-9 reply lines (plain voice). Used when `living_culture_voice` is false. */
export const WHISPER_REPLIES_PLAIN: Record<string, readonly string[]> = {
  western: [
    "Word received. Our gate stays open to {to}'s heralds.",
    "Kindly said. The keep sends its regards.",
    "We will remember it at the next feast, {to}.",
    "Agreed. Let the roads stay quiet.",
  ],
  woodland: [
    "We heard you under the cedars. Your words are welcome, {to}.",
    "A post for you too, facing back. Friend to friend.",
    "The longhouse thanks {to}. Salt for hide, any season.",
    "Our fires answer yours. Still no smoke of war.",
  ],
  desert: [
    "Your words came with the caravan. A cup back to {to}.",
    "The courtyard heard you. We drink to trade.",
    "Shade and water for {to}'s riders, as promised.",
    "Well said. The lamps burn for friends tonight.",
  ],
  steppe: [
    "Heard on the wind, {to}. We ride easy.",
    "The horses know your banners now. They do not shy.",
    "Short memory, long grass. We agree.",
    "A fire is set for {to} in the felt hall.",
  ],
  tide: [
    "Your word came in on the tide. We send one back to {to}.",
    "The stilt halls heard you. Fair winds.",
    "We waved at your sails. Did {to} see?",
    "Noted and charted. The shoal is yours to mind too.",
  ],
};

/** Fallback for player-only cultures, as whisperLinesFor. `voiced` false gives the plain table. */
export function whisperReplyLinesFor(culture: string, voiced = true): readonly string[] {
  const t = voiced ? WHISPER_REPLIES : WHISPER_REPLIES_PLAIN;
  return t[culture] ?? t.western;
}

/** Board label per rank count (slice 10). Presentation only. */
export const RANKS_LABEL: Record<1 | 2 | 3, string> = {
  1: "one rank",
  2: "two ranks",
  3: "three ranks",
};

/** One-word board companion per war phase (slice 11). Presentation only; derived from the phase. */
export const RANKS_NOTE: Record<WarPhaseId, string> = {
  columns: "column",
  skirmish: "skirmish",
  clash: "clash",
  aftermath: "falling-back",
};

/** Board standard strength per war phase (slice 13): same mapping as ranks. Presentation only. */
export const STANDARD_STRENGTH: Record<WarPhaseId, 1 | 2 | 3> = {
  columns: 1,
  skirmish: 2,
  clash: 3,
  aftermath: 1,
};

/** Most friendly realms the board shows at once (slice 13). */
export const FRIENDLY_PRESENCE_CAP = 6;

/** A caravan with the player counts as "recent" trade for this many ticks (slice 13). */
export const FRIENDLY_TRADE_WINDOW_TICKS = 600;

/** Most realms the World tab relationship summary lists (slice 14). */
export const RELATIONSHIP_SUMMARY_CAP = 8;

/** Most quiet routes between friendly realms the board shows at once (slice 15). */
export const FRIENDLY_ROUTES_CAP = 8;

// ---------------------------------------------------------------- system status (slice 16)

/** Below this share of its cap, with net income at or under zero, a store is under "high" pressure. */
export const ECONOMY_PRESSURE_HIGH_FILL = 0.25;
/** At or above this share of its cap, with net income at or over zero, a store is under "low" pressure. */
export const ECONOMY_PRESSURE_LOW_FILL = 0.75;

// ---------------------------------------------------------------- history and yields (slice 17)

/** Most past interactions relationshipHistorySnapshot returns for one realm (slice 17). */
export const RELATIONSHIP_HISTORY_CAP = 4;

/** Slice 18: most sources listed per resource in economyYieldBreakdownSnapshot (highest first). */
export const YIELD_BREAKDOWN_CAP = 4;

// ---------------------------------------------------------------- system detail (slice 19)

/** Slice 19: most studies researchDetailSnapshot lists in nextUnlocks. */
export const RESEARCH_NEXT_UNLOCKS_CAP = 3;

/** Slice 19: court guidance when no decree is in force. */
export const COURT_GUIDANCE_IDLE = "No decree in force. One can be sworn.";
/** Slice 19: court guidance when every decree is in force. */
export const COURT_GUIDANCE_FULL = "Every decree is in force.";

/** Slice 19: "near" the selected province = within this many steps (Manhattan) on the board. */
export const BOARD_NEARBY_RADIUS = 2;
/** Slice 19: most realm ids boardInteractionDetailSnapshot lists in nearbyFriendly. */
export const BOARD_NEARBY_FRIENDLY_CAP = 3;

// ---------------------------------------------------------------- research progress, previews, academy (slice 20)

/** Slice 20: most effect lines studyEffectPreviewSnapshot returns per study. */
export const STUDY_EFFECT_CAP = 3;

/**
 * Slice 20: what each study does once known, in plain words. Every line mirrors live code in
 * systems/research.ts (researchYield, masonryWallBonus, storage.ts logistics/supply bonuses,
 * labor.ts maxMarches, surveyingVisionBonus, cartographyScoutDiscount, quartermasteryTrainMult,
 * unitUnlocked). Tests pin the numbers to those helpers. At most STUDY_EFFECT_CAP lines each.
 */
export const STUDY_EFFECTS: Record<string, readonly string[]> = {
  husbandry: ["+12% food from buildings"],
  forestry: ["+12% wood from buildings"],
  masonry: ["+12% stone from buildings", "+16 defense"],
  logistics: ["+15% gold from buildings", "+1 march column (Keep limit applies)", "+50 storage"],
  surveying: ["+1 vision range"],
  fieldcraft: ["Unlocks Ranger"],
  drill: ["Unlocks Banner"],
  screening: ["Unlocks Warden"],
  horse: ["Unlocks Cavalry, Knight, Outrider, Lancer"],
  siege: ["Unlocks Siege Engine"],
  crop_rotation: ["+25% food from buildings"],
  timber_framing: ["+25% wood from buildings"],
  fortification: ["+25% stone from buildings", "+24 defense", "Unlocks Ironclad"],
  supply_trains: ["+1 march column (Keep limit applies)", "+100 storage"],
  cartography: ["+1 vision range", "Scouting costs 4 gold less"],
  quartermastery: ["Training costs 8% less"],
};

/** Slice 20: academy note while it is still being built. */
export const ACADEMY_NOTE_BUILDING = "The Academy is still being built.";
/** Slice 20: academy note when it stands and the lectern is free. */
export const ACADEMY_NOTE_IDLE = "The lectern is free. New studies run 20% shorter.";
/** Slice 20: academy note when the open study was started at full length (before the bonus). */
export const ACADEMY_NOTE_EARLY = "This study began before the Academy. The next one runs shorter.";

// ---------------------------------------------------------------- decree effects, inspect detail (slice 21)

/**
 * Slice 21: what each decree does while in force, in plain words. Mirrors live code:
 * muster = trainCostMultiplier x0.9 (actions/train.ts), rite = productionBonus +3
 * (systems/economy.ts), envoys = giftBonusOpinion +6 (actions/diplomacy.ts). Tests pin them.
 */
export const DECREE_EFFECTS: Record<string, string> = {
  muster: "Training costs 10% less",
  rite: "+3 production",
  envoys: "Gifts earn +6 opinion",
};

/** Slice 21: suggestion when a decree slot is open and that decree is affordable (first in DECREES order). */
export const DECREE_SUGGESTIONS: Record<string, string> = {
  muster: "Muster the Host is ready to swear before training.",
  rite: "Harvest Rite is ready to swear for more production.",
  envoys: "Send Envoys is ready to swear before a gift.",
};
/** Slice 21: suggestion when a slot is open but no open decree is affordable. */
export const DECREE_SUGGEST_SAVE = "Save gold or food to swear the next decree.";

/** Slice 21: inspect card name per node (the home hold uses settlementName instead). */
export const INSPECT_NODE_NAMES: Record<string, string> = {
  none: "Open ground",
  hold: "Hold",
  camp: "Hostile camp",
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
  ruins: "Ruins",
};

/** Slice 21: most outposts inspectDetailSnapshot lists (within BOARD_NEARBY_RADIUS of the tile). */
export const INSPECT_OUTPOST_CAP = 3;
/** Slice 21: most marches inspectDetailSnapshot lists (heading to the tile, soonest first). */
export const INSPECT_MARCH_CAP = 3;
/** Slice 21: most notes inspectDetailSnapshot lists. */
export const INSPECT_NOTE_CAP = 3;

export const INSPECT_NOTE_HOME = "Your hold.";
export const INSPECT_NOTE_OUTPOST = "Your outpost. It pays a small tithe.";
export const INSPECT_NOTE_RIVAL = "Held by another realm.";
export const INSPECT_NOTE_CAMP = "A hostile camp. Clear it with a march.";
export const INSPECT_NOTE_THREAT = "A foreign column is heading here.";
export const INSPECT_NOTE_WORKED = "A crew is gathering here.";
export const INSPECT_NOTE_DEPLETED = "Picked clean. It regrows slowly.";

// ---------------------------------------------------------------- job summary, staffing pressure (slice 22)

/** Slice 22: most buildings jobSummarySnapshot lists per job (finished player works that take it, board order). */
export const JOB_SUMMARY_BUILDING_CAP = 3;

/** Slice 22: empty works and idle villagers both present. */
export const STAFFING_NOTE_ASSIGN = "Idle villagers could staff your empty works.";
/** Slice 22: empty works, no idle villagers. */
export const STAFFING_NOTE_SHORT = "Works stand empty and no one is idle.";
/** Slice 22: idle villagers, no empty works. */
export const STAFFING_NOTE_SPARE = "Villagers are idle with no empty works.";

// ---------------------------------------------------------------- player reply (slice 7)

/**
 * Fixed lines the player may send back to a whisper they received, by the player's culture.
 * Four per culture; the player picks one by index. `{to}` is the realm being answered.
 * No free-form text.
 *
 * Player reply voice (slice 11, `living_player_reply_voice`, on by default): the five NPC
 * cultures speak in the same voice as WHISPERS (western formal, woodland kin, desert host,
 * steppe clipped, tide sailor). Player-only cultures (mist, glen, salt, fen, peak) are voiced in
 * slice 12 (PLAYER_REPLIES_PLAYER_ONLY_VOICE, `living_player_only_voice`). Same sizes as PLAYER_REPLIES_PLAIN (4 per culture). Built below from
 * PLAYER_REPLIES_PLAIN with the voiced cultures replaced.
 */
const PLAYER_REPLIES_NPC_VOICE: Record<string, readonly string[]> = {
  western: [
    "By the steward's seal: your herald was fed, housed, and sent home warm, {to}.",
    "Your word is entered in the rolls. Our banners stay furled, by oath.",
    "The keep returns its courtesy, with good harvests to {to}'s fields.",
    "So sworn, so kept. The king's roads stay quiet between us.",
  ],
  woodland: [
    "Kin of {to}: the cedars carried your words to us, slow and whole.",
    "We cut your mark on the trail post. Let the moss find it late.",
    "The elders have said it. Our hunters will not cross your streams.",
    "Longhouse smoke rises for {to}, kin. No drum beneath it.",
  ],
  desert: [
    "Peace upon {to}. A lamp burns at our gate for your riders.",
    "Your words were cool water. Dates go back, as a host must send.",
    "The well is open to honest riders. No guest is turned from shade.",
    "Heard in the courtyard, and kindly. May {to}'s caravans ride heavy.",
  ],
  steppe: [
    "Heard, {to}. Herd calm.",
    "Our grass. Your road. Ride through.",
    "Good word for good word. Our way.",
    "Ribbon on the post for {to}. Done.",
  ],
  tide: [
    "Your word washed in clean, {to}. One floats back on the ebb.",
    "Lantern's lit on the jetty. Steer by it.",
    "Calm water between our hulls. Let it lie so.",
    "Nets heavy here. Fair catch to {to}'s boats.",
  ],
};

/** The slice 7-10 player reply lines (plain voice). Used when `living_player_reply_voice` is false. */
export const PLAYER_REPLIES_PLAIN: Record<string, readonly string[]> = {
  western: [
    "Your herald was fed and sent home warm, {to}.",
    "We hear you. The banners stay furled.",
    "Our steward has noted it. Good harvests to you.",
    "Kind words travel well. So do ours, {to}.",
  ],
  woodland: [
    "The trees carried your words to us, {to}.",
    "We leave a mark on the trail for you. Peace on it.",
    "Our hunters will not cross your streams.",
    "Words heard. The longhouse sends smoke of welcome.",
  ],
  desert: [
    "A lamp is lit for {to} at our gate.",
    "Your words were cool water. We send dates back.",
    "The well is open to honest riders.",
    "Heard in the courtyard. May your caravans be heavy.",
  ],
  steppe: [
    "The herd heard you, {to}. It stays calm.",
    "Ride past our grass in peace.",
    "A good word for a good word. That is our way.",
    "We tie a ribbon on the post for {to}.",
  ],
  tide: [
    "Your message washed in clean, {to}. One floats back.",
    "We will keep a lantern on the jetty for you.",
    "Calm water between us. Let it stay so.",
    "Our nets are full. We wish yours the same.",
  ],
  mist: [
    "Your words came through the fog, {to}. We answer softly.",
    "The terraces are quiet. So are our spears.",
    "We heard you at dawn. A good sign.",
    "Rain for your fields, {to}.",
  ],
  glen: [
    "The glen echoes your words back, {to}.",
    "Our cairn has a new stone for you.",
    "Stone holds a promise. So do we.",
    "Heard. The pipes play a friendly tune tonight.",
  ],
  salt: [
    "Salt and timber for honest friends, {to}.",
    "We heard you over the surf. All is well here.",
    "Our boats will wave if they pass yours.",
    "A plank from our yard bears your name now.",
  ],
  fen: [
    "Your words found us among the reeds, {to}.",
    "The cottages are warm. Our answer is too.",
    "We pole our boats your way only to trade.",
    "Heard. The frogs sing your name tonight.",
  ],
  peak: [
    "We saw your words from the high keep, {to}.",
    "The passes stay open to your heralds.",
    "Snow on our peaks, peace in our hearts.",
    "Heard. Our watchfires burn for friends.",
  ],
};

/**
 * Player-only culture reply voice (slice 12, `living_player_only_voice`, on by default). Same
 * 4 lines per culture as the plain table. Voice: mist hushed and omen-reading (fog, dawn, rain);
 * glen cairn-sworn, stone and echo; salt a trader's fair weights and yard book; fen homely and
 * wry, reeds and kettles; peak a lookout's report (sighted, the watch, beacons).
 */
const PLAYER_REPLIES_PLAYER_ONLY_VOICE: Record<string, readonly string[]> = {
  mist: [
    "Out of the fog, {to}: your words reached the terraces, soft and whole.",
    "Grey morning, still water. Our spears sleep under the eaves.",
    "The dawn mist lifted as we read you. The old folk call that a good sign.",
    "May the rain find {to}'s fields gently, and leave before harvest.",
  ],
  glen: [
    "Your words rang down the glen, {to}, and the stones gave them back.",
    "A stone for {to} on the cairn. It will stand when we are dust.",
    "Sworn on the cairn, kept like stone. No blade comes down the glen.",
    "The pipes play {to}'s name tonight. A walking tune, not a war tune.",
  ],
  salt: [
    "Fair weight and true measure, {to}. Salt and timber for honest friends.",
    "Heard over the surf and logged in the yard book. All sound here.",
    "Our hulls dip a plank's width to yours in passing. Count on it.",
    "A new plank in the yard bears {to}'s mark, cut clean and tarred.",
  ],
  fen: [
    "Your words came slow through the reeds, {to}, as all good things do.",
    "Peat on the fire, kettle on the hook. Our answer's as warm.",
    "Our punts pole your way for trade, {to}. Nothing heavier aboard.",
    "The frogs had your name by dusk. Fen gossip, all of it kind.",
  ],
  peak: [
    "From the high keep: your words sighted, {to}. Clear sky between us.",
    "The passes stand open to your heralds. The watch has its orders.",
    "Snow on the crags, still air in the passes. Peace holds above the line.",
    "Watchfires lit on the ridge for {to}. A friend's beacon, not a war beacon.",
  ],
};

/**
 * Slice 11 player reply lines: plain table with only the five NPC cultures voiced. Used when
 * `living_player_reply_voice` is on and `living_player_only_voice` is false.
 */
export const PLAYER_REPLIES_NPC_ONLY: Record<string, readonly string[]> = {
  ...PLAYER_REPLIES_PLAIN,
  ...PLAYER_REPLIES_NPC_VOICE,
};

/** Voiced player reply lines (slices 11-12): every culture voiced. */
export const PLAYER_REPLIES: Record<string, readonly string[]> = {
  ...PLAYER_REPLIES_NPC_ONLY,
  ...PLAYER_REPLIES_PLAYER_ONLY_VOICE,
};

/**
 * The player's reply lines for a culture; unknown cultures use western. `voiced` false gives the
 * plain table. `playerOnlyVoiced` false (with `voiced` on) gives the slice 11 table, where mist,
 * glen, salt, fen and peak keep their plain lines.
 */
export function playerReplyLinesFor(culture: string, voiced = true, playerOnlyVoiced = true): readonly string[] {
  const t = !voiced ? PLAYER_REPLIES_PLAIN : playerOnlyVoiced ? PLAYER_REPLIES : PLAYER_REPLIES_NPC_ONLY;
  return t[culture] ?? t.western;
}

/** Joined-war formation ids, in order. Presentation only; derived from the war phase. */
export const FORMATION_IDS = ["muster", "skirmish", "clash", "fall-back"] as const;
export type FormationId = (typeof FORMATION_IDS)[number];

/** Joined-war column-mark ids, in order (slice 8). Presentation only; derived from the war phase. */
export const COLUMN_MARK_IDS = ["column", "skirmish-line", "clash-line", "falling-back"] as const;
export type ColumnMarkId = (typeof COLUMN_MARK_IDS)[number];

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
