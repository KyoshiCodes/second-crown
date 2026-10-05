import { cloudToken, cloudUrl } from "./cloud";

export type HoldStores = { food: string; wood: string; stone: string; gold: string };

/**
 * What every reader of a shared hold sees (docs/REALTIME.md Phase 3). Stores are the sim's own
 * decimal strings; militia counts trained militia, training counts militia still in the queue,
 * farms, cottages, and lumberCamps count the hold's farms, cottages, and lumber camps, finished or
 * still building.
 */
export type HoldView = {
  realmId: string;
  tick: number;
  stores: HoldStores;
  militia: number;
  training: number;
  farms: number;
  cottages: number;
  lumberCamps: number;
  stamps: { tick: number; by: string }[];
  pending: number;
};

const STORE_KEYS = ["food", "wood", "stone", "gold"] as const;

function count(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseHold(body: unknown): HoldView {
  const v = body as Partial<HoldView> | null;
  if (!v || typeof v.realmId !== "string" || typeof v.tick !== "number" || !Number.isInteger(v.tick) || v.tick < 0 || !Array.isArray(v.stamps)) {
    throw new Error("Hold sent a bad view");
  }
  const raw = (v.stores ?? {}) as Partial<Record<string, unknown>>;
  const stores = {} as HoldStores;
  for (const key of STORE_KEYS) stores[key] = typeof raw[key] === "string" ? (raw[key] as string) : "0";
  return {
    realmId: v.realmId,
    tick: v.tick,
    stores,
    militia: count(v.militia),
    training: count(v.training),
    farms: count(v.farms),
    cottages: count(v.cottages),
    lumberCamps: count(v.lumberCamps),
    stamps: v.stamps,
    pending: count(v.pending),
  };
}

/** Join (read) the shared hold for a realm. Only call this for a realm marked shared. */
export async function readHold(realmId: string): Promise<HoldView> {
  const response = await fetch(cloudUrl() + "/realm/" + encodeURIComponent(realmId) + "/hold", {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Hold request failed");
  return parseHold(await response.json());
}

async function sendIntent(realmId: string, type: "stamp" | "train" | "build" | "cottage" | "lumber"): Promise<HoldView> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = cloudToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(cloudUrl() + "/realm/" + encodeURIComponent(realmId) + "/intent", {
    method: "POST",
    headers,
    body: JSON.stringify({ type }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    throw new Error(typeof body?.error === "string" ? body.error : "Intent request failed");
  }
  return parseHold(await response.json());
}

/** Send one stamp intent. The server applies it on the next tick boundary. */
export function sendStamp(realmId: string): Promise<HoldView> {
  return sendIntent(realmId, "stamp");
}

/** Ask the hold to train one militia. The server's sim pays for it or refuses with a reason. */
export function sendTrain(realmId: string): Promise<HoldView> {
  return sendIntent(realmId, "train");
}

/** Ask the hold to build one farm. The server's sim picks the first free tile and pays, or refuses with a reason. */
export function sendBuild(realmId: string): Promise<HoldView> {
  return sendIntent(realmId, "build");
}

/** Ask the hold to build one cottage. The server's sim picks the first open tile and pays, or refuses with a reason. */
export function sendCottage(realmId: string): Promise<HoldView> {
  return sendIntent(realmId, "cottage");
}

/** Ask the hold to build one lumber camp. The server's sim picks the first free tile and pays, or refuses with a reason. */
export function sendLumber(realmId: string): Promise<HoldView> {
  return sendIntent(realmId, "lumber");
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
