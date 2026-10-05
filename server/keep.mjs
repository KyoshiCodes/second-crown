// Kept shared hold (wave/realtime-keep). Writes a shared hold to the server's save folder, one file
// per realm id, so a joined hold survives a process restart. Only hold.mjs calls this, and only for a
// shared realm id: a solo save is never read, written, or marked shared here.
// No game rule lives in this file. The state is the sim's own serializeState text, stored as-is.
// keyHash is the SHA-256 of the hold key (join.mjs); the key itself is never written.

import fs from "node:fs";
import path from "node:path";
import { REALM_ID_RE } from "./realmclock.mjs";
import { ticksBetween } from "./clock.mjs";

// Mirror of packages/shared MAX_OFFLINE_MS, the cap on solo offline catch-up. keep.test.mjs fails if it drifts.
export const MAX_OFFLINE_MS = 30 * 24 * 60 * 60 * 1000;
export const KEEP_KIND = "shared-hold";

/** Ticks a kept hold catches up for the time the process was down: real time, capped like solo offline. */
export function downTicks(savedAtMs, nowMs) {
  if (!Number.isFinite(savedAtMs) || !Number.isFinite(nowMs)) return 0;
  return ticksBetween(savedAtMs, Math.min(nowMs, savedAtMs + MAX_OFFLINE_MS));
}

/**
 * dir: the server's save folder. A hold is `<dir>/<realmId>.json`. Joined ids start with "join-",
 * and account ids start with "guest_" or "discord_", so a hold file never lands on a solo save.
 */
export function createHoldStore(dir) {
  function fileFor(realmId) {
    if (typeof realmId !== "string" || !REALM_ID_RE.test(realmId)) throw new Error("bad realm id");
    return path.join(dir, `${realmId}.json`);
  }
  return {
    /** The kept record for this id, or null. A file that names another realm is not this hold. */
    load(realmId) {
      const file = fileFor(realmId);
      if (!fs.existsSync(file)) return null;
      const rec = JSON.parse(fs.readFileSync(file, "utf8"));
      if (rec?.kind !== KEEP_KIND || rec.realmId !== realmId || typeof rec.state !== "string") return null;
      return rec;
    },
    /** Write whole, through a temp file, so a crash mid-write leaves the last good copy. */
    save(realmId, { savedAt, state, pending, keyHash = null }) {
      const file = fileFor(realmId);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ kind: KEEP_KIND, realmId, savedAt, keyHash, pending, state }));
      fs.renameSync(tmp, file);
    },
  };
}
