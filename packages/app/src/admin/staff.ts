/**
 * Staff gate + moderation stubs for the Admin panel (app only).
 *
 * IMPORTANT: the staff flag is a LOCAL TESTING SWITCH, not security. Anyone can
 * set it in their own browser. Real moderation must be checked on the server
 * (server/index.mjs) against the logged-in account (Discord login) before any
 * action runs. Never trust this flag on the server.
 *
 * Turning it on/off:
 *   - visit the site with `?staff=1` (on) or `?staff=0` (off); the choice is saved
 *   - or in the browser console: localStorage.setItem("sc-staff", "1")
 *   - the panel itself has a "Turn off staff tools" button
 */
import React from "react";

export const STAFF_KEY = "sc-staff";
export const STAFF_EVENT = "sc-staff-change";

export function readStaffFlag(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(STAFF_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStaffFlag(on: boolean): void {
  try {
    if (typeof localStorage !== "undefined") {
      if (on) localStorage.setItem(STAFF_KEY, "1");
      else localStorage.removeItem(STAFF_KEY);
    }
  } catch {
    /* ignore (private mode etc.) */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(STAFF_EVENT, { detail: on }));
}

/** Reads `?staff=1` / `?staff=0` from a query string. Returns null when absent. Pure. */
export function parseStaffQuery(search: string): boolean | null {
  const v = new URLSearchParams(search).get("staff");
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
}

/** True when this browser has staff tools on. Applies `?staff=` once on mount. */
export function useStaffFlag(): boolean {
  const [on, setOn] = React.useState(readStaffFlag);
  React.useEffect(() => {
    const fromQuery = typeof window === "undefined" ? null : parseStaffQuery(window.location.search);
    if (fromQuery !== null && fromQuery !== readStaffFlag()) setStaffFlag(fromQuery);
    else if (fromQuery !== null) setOn(fromQuery);
    const onChange = (ev: Event) => setOn(Boolean((ev as CustomEvent).detail));
    window.addEventListener(STAFF_EVENT, onChange);
    return () => window.removeEventListener(STAFF_EVENT, onChange);
  }, []);
  return on;
}

export type ModAction = "mute" | "kick" | "ban";

export const MOD_ACTION_LABEL: Record<ModAction, string> = {
  mute: "Mute",
  kick: "Kick",
  ban: "Ban",
};

/**
 * FUTURE SERVER ENDPOINTS — moderation. All stubs today: they log and resolve `false`
 * ("not applied on the server"). Nothing leaves the browser.
 *
 * Intended shape once server/index.mjs has staff auth:
 *   POST /api/admin/mute  { player, minutes, reason? }
 *   POST /api/admin/kick  { player, reason? }
 *   POST /api/admin/ban   { player, reason? }
 * The server must reject these unless the session belongs to a staff account.
 *
 *   const res = await fetch(`/api/admin/${action}`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ player, reason }),
 *   });
 *   return res.ok;
 */
export async function moderatePlayer(action: ModAction, player: string, reason?: string): Promise<boolean> {
  console.info(`[admin stub] ${action} "${player}"${reason ? ` (${reason})` : ""} — no server endpoint yet`);
  return false;
}

export interface AdminPlayer {
  name: string;
  online: boolean;
}

/**
 * FUTURE SERVER ENDPOINT — player list. Stub: resolves null (no data).
 * Intended: GET /api/admin/players -> AdminPlayer[]
 */
export async function fetchPlayerList(): Promise<AdminPlayer[] | null> {
  console.info("[admin stub] fetch player list — no server endpoint yet");
  return null;
}

export interface ServerStatus {
  uptimeSec: number;
  playersOnline: number;
  version: string;
}

/**
 * FUTURE SERVER ENDPOINT — server status. Stub: resolves null (no data).
 * Intended: GET /api/admin/status -> ServerStatus
 */
export async function fetchServerStatus(): Promise<ServerStatus | null> {
  console.info("[admin stub] fetch server status — no server endpoint yet");
  return null;
}
