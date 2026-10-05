// Save gate: the browser is untrusted. The server does not run the sim (DECISIONS.md),
// so it checks each uploaded save for shape, for time moving no faster than real time,
// and for an append-only input log. It never edits a save.

// Mirrors of client constants. savegate.test.mjs fails if they drift.
export const SAVE_VERSION = 1; // packages/shared SAVE_VERSION
export const TICKS_PER_SECOND = 10; // packages/shared TICKS_PER_SECOND
export const MAX_SPEED = 3; // packages/app HudControls fastest speed button
export const CLOCK_SLACK_TICKS = 600; // one minute of tolerance for clocks and request lag
export const MAX_SAVE_BYTES = 8 * 1024 * 1024;

const ARRAYS = ["buildings", "units", "citizens", "realms", "characters", "opinions", "wars", "factions", "inputLog", "unlocks"];
const OBJECTS = ["meta", "resources", "flags", "board"];
const AMOUNT = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;

export class SaveGateError extends Error {
  constructor(status, message, conflict = false) { super(message); this.status = status; this.conflict = conflict; }
}
// The cloud already holds a newer copy of this hold. The handler returns the cloud save with it.
export const NEWER_HOLD = "Cloud has a newer hold.";
// REALTIME.md Phase 2: a shared realm's server copy is the source of truth. The browser cannot replace it.
export const SHARED_REALM = "Shared realm: the server copy wins.";
function conflictIf(condition) {
  if (condition) throw new SaveGateError(409, NEWER_HOLD, true);
}
function check(condition, status, message) {
  if (!condition) throw new SaveGateError(status, message);
}
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isTick = (v) => Number.isSafeInteger(v) && v >= 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Parse and shape-check a full save. Partial patches fail here. */
export function parseSave(raw) {
  check(typeof raw === "string" && raw.length > 0, 400, "Expected a save.");
  check(Buffer.byteLength(raw, "utf8") <= MAX_SAVE_BYTES, 413, "Save is too large.");
  let save;
  try { save = JSON.parse(raw); } catch { throw new SaveGateError(400, "Save is not valid JSON."); }
  check(isObject(save), 400, "Save must be an object.");
  for (const key of OBJECTS) check(isObject(save[key]), 400, `Save is missing ${key}.`);
  for (const key of ARRAYS) check(Array.isArray(save[key]), 400, `Save is missing ${key}.`);

  const m = save.meta;
  check(Number.isSafeInteger(m.version) && m.version >= 1 && m.version <= SAVE_VERSION, 400, "Unsupported save version.");
  check(isTick(m.tick), 400, "Save needs a valid tick.");
  check(Number.isFinite(m.seed) && Number.isFinite(m.lastRealTime) && Number.isFinite(m.playTimeMs), 400, "Save meta is invalid.");

  const res = Object.entries(save.resources);
  check(res.length <= 64, 400, "Too many resources.");
  check(res.every(([, v]) => typeof v === "string" && AMOUNT.test(v)), 400, "Resources must be number strings.");
  check(save.units.every((u) => isObject(u) && typeof u.count === "string" && AMOUNT.test(u.count)), 400, "Unit counts must be number strings.");
  check(save.inputLog.every((e) => isObject(e) && isTick(e.tick) && e.tick <= m.tick && typeof e.type === "string"), 400, "Input log is invalid.");
  return save;
}

/**
 * Check an upload against the last accepted save.
 * prev: parsed previous save or null. elapsedMs: server time since prev was accepted.
 * replace: the player explicitly chose to replace the cloud hold with a fresh game.
 * shared: the server marks this save as a shared realm. Every browser upload is refused,
 * replace or not, and the handler hands back the server copy. No realm is shared yet.
 * Returns the parsed next save.
 */
export function gateSave(raw, prev, elapsedMs, replace = false, shared = false) {
  const next = parseSave(raw);
  if (shared) throw new SaveGateError(409, SHARED_REALM, true);
  if (!prev || !isObject(prev.meta) || !isTick(prev.meta.tick)) return next;

  conflictIf(Number.isSafeInteger(prev.meta.version) && prev.meta.version > next.meta.version);

  const allowed = Math.floor((Math.max(0, elapsedMs) / 1000) * TICKS_PER_SECOND * MAX_SPEED) + CLOCK_SLACK_TICKS;
  const from = prev.meta.tick;
  const to = next.meta.tick;

  if (to < from) {
    // Never silently. A fresh game replaces the hold only when the player asks; an old copy never does.
    conflictIf(!replace || to > allowed);
    return next;
  }
  check(to - from <= allowed, 409, "Save advanced faster than real time.");

  const before = Array.isArray(prev.inputLog) ? prev.inputLog : [];
  conflictIf(next.inputLog.length < before.length);
  for (let i = 0; i < before.length; i++) {
    // A second tab that played on from an older copy: the cloud holds actions this upload lacks.
    conflictIf(!same(before[i], next.inputLog[i]));
  }
  for (let i = before.length; i < next.inputLog.length; i++) {
    check(next.inputLog[i].tick >= from, 409, "Input log has back-dated actions.");
  }

  if (to === from && next.inputLog.length === before.length) {
    for (const key of ["resources", "buildings", "units"]) {
      check(same(prev[key], next[key]), 409, "State changed without time passing or a recorded action.");
    }
  }
  return next;
}
