// The sim never reads the wall clock (Invariant 2). A caller that needs real time
// (offline catch-up, the daily court) passes it in. A missing clock is an error,
// never a silent wall-clock read.

/** Return `now` if it is a finite number of ms; otherwise throw. */
export function requireClock(now: unknown, where: string): number {
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new Error(`${where}: a clock (ms) must be passed in; the sim does not read the wall clock.`);
  }
  return now;
}
