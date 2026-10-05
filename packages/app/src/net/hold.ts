import { cloudToken, cloudUrl } from "./cloud";

/** What every reader of a shared hold sees (docs/REALTIME.md Phase 3). */
export type HoldView = { realmId: string; tick: number; stamps: { tick: number; by: string }[]; pending: number };

function parseHold(body: unknown): HoldView {
  const v = body as Partial<HoldView> | null;
  if (!v || typeof v.realmId !== "string" || typeof v.tick !== "number" || !Number.isInteger(v.tick) || v.tick < 0 || !Array.isArray(v.stamps)) {
    throw new Error("Hold sent a bad view");
  }
  return { realmId: v.realmId, tick: v.tick, stamps: v.stamps, pending: typeof v.pending === "number" ? v.pending : 0 };
}

/** Join (read) the shared hold for a realm. Only call this for a realm marked shared. */
export async function readHold(realmId: string): Promise<HoldView> {
  const response = await fetch(cloudUrl() + "/realm/" + encodeURIComponent(realmId) + "/hold", {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Hold request failed");
  return parseHold(await response.json());
}

/** Send one stamp intent. The server applies it on the next tick boundary. */
export async function sendStamp(realmId: string): Promise<HoldView> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = cloudToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(cloudUrl() + "/realm/" + encodeURIComponent(realmId) + "/intent", {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "stamp" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Stamp request failed");
  return parseHold(await response.json());
}

/** A typed realm id, trimmed and lowercased, or null when blank or bad. Matches server/join.mjs. */
export function cleanJoinCode(code: string): string | null {
  const clean = code.trim().toLowerCase();
  return /^[a-z0-9-]{1,24}$/.test(clean) ? clean : null;
}

/**
 * Opt-in: join the shared hold for a typed realm id. Everyone who types the same id reads one
 * hold. A blank id returns null and sends nothing. Sends only the id, never a save.
 */
export async function joinRealm(code: string): Promise<HoldView | null> {
  const realm = cleanJoinCode(code);
  if (realm === null) return null;
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = cloudToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(cloudUrl() + "/join", {
    method: "POST",
    headers,
    body: JSON.stringify({ realm }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Sign in first" : "Join failed");
  return parseHold(await response.json());
}
