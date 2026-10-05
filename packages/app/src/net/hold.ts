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
