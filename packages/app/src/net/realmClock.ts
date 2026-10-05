import { cloudUrl } from "./cloud";

/** Ask the server clock (docs/REALTIME.md Phase 1) how many ticks a shared realm has run. */
export async function fetchRealmTick(realmId: string): Promise<number> {
  const response = await fetch(cloudUrl() + "/realm/" + encodeURIComponent(realmId) + "/tick", {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Realm clock request failed");
  const body = (await response.json()) as { tick?: unknown };
  if (typeof body.tick !== "number" || !Number.isInteger(body.tick) || body.tick < 0) {
    throw new Error("Realm clock sent a bad tick");
  }
  return body.tick;
}
