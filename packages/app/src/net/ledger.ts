import { cloudToken, cloudUrl } from "./cloud";

export type Listing = { id: string; sellerId: string; sellerName: string; item: "iron" | "banners" | "relics"; quantity: string; price: string; status: "open" | "sold" | "cancelled" };
export type Snapshot = { power: string; tick: number; saveHash: string; verified: false };
export type Challenge = { id: string; challengerId: string; challengerName: string; opponentId: string; opponentName: string; challenger: Snapshot; opponent: Snapshot | null; status: "open" | "locked" | "cancelled" };
export type AuctionView = { userId: string; account: Record<"gold" | "iron" | "banners" | "relics", string> | null; listings: Listing[] };
export type PvpView = { userId: string; challenges: Challenge[] };
export type LedgerRequest = { route: "auction" | "pvp"; body: Record<string, string> };
export class LedgerRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function ledgerRequest<T>(route: "auction" | "pvp", body?: Record<string, string>): Promise<T> {
  const url = cloudUrl(), token = cloudToken();
  const response = await fetch(url + "/" + route, {
    method: body ? "POST" : "GET",
    headers: { Authorization: "Bearer " + token, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (url !== cloudUrl() || token !== cloudToken()) throw new Error("Session changed");
  if (!response.ok) throw new LedgerRequestError(response.status, "Ledger request failed");
  return response.json();
}
