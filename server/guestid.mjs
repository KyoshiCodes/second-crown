// wave/guest-id: a new guest id never lands on an account or a cloud save that already exists.
// The old id was 3 random bytes (16.7 million ids), and /guest wrote over any user record that
// matched. Now the id is 16 random bytes, and an id already in users.json or saves/ is refused.

import crypto from "node:crypto";

// Random bytes in a new guest id. 128 bits: a repeat is not expected, but it is still refused.
export const GUEST_ID_BYTES = 16;
// Fresh draws before /guest gives up. Each draw that repeats an issued id is thrown away.
export const GUEST_ID_TRIES = 3;
export const GUEST_ID_TAKEN = "Could not make a new guest id. Try again.";

/** A fresh guest id. Keeps the "guest_" prefix so a hold file ("join-...") never shares its name. */
export function newGuestId(draw = () => crypto.randomBytes(GUEST_ID_BYTES).toString("hex")) {
  return `guest_${draw()}`;
}

/**
 * Pick a guest id that isTaken(id) says is free. Returns null when every try repeats an issued id;
 * the caller refuses the guest then, and never writes over the existing account.
 */
export function claimGuestId(isTaken, draw) {
  for (let i = 0; i < GUEST_ID_TRIES; i++) {
    const id = newGuestId(draw);
    if (!isTaken(id)) return id;
  }
  return null;
}
