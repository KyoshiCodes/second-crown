const TOKEN_KEY = "sc-cloud-token";
const NAME_KEY = "sc-cloud-name";
const URL_KEY = "sc-cloud-url";
const ORACLE = "http://129.153.17.72:8787";

export function defaultCloudUrl(): string {
  try {
    const { protocol, hostname, port } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      const p = port ? `:${port}` : "";
      return `${protocol}//${hostname}${p}`;
    }
  } catch {
    /* ignore */
  }
  return ORACLE;
}

export function cloudUrl(): string {
  try {
    return localStorage.getItem(URL_KEY) || defaultCloudUrl();
  } catch {
    return defaultCloudUrl();
  }
}

export function setCloudUrl(url: string): void {
  localStorage.setItem(URL_KEY, url.replace(/\/$/, ""));
}

export function cloudToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function cloudName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}

export function setSession(token: string, name: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(NAME_KEY, name);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
}

export function absorbHashSession(): boolean {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.includes("cloud_token=")) return false;
  const p = new URLSearchParams(hash);
  const token = p.get("cloud_token");
  const name = p.get("cloud_name") || "Discord";
  if (token) setSession(token, name);
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return Boolean(token);
}

async function req(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = cloudToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${cloudUrl()}${path}`, { ...init, headers });
}

export async function health(): Promise<{ ok: boolean; discord: boolean }> {
  const res = await fetch(`${cloudUrl()}/health`);
  if (!res.ok) throw new Error("cloud down");
  return res.json();
}

export async function createGuest(name: string) {
  const res = await req(`/guest?name=${encodeURIComponent(name || "Guest")}`, { method: "POST" });
  if (!res.ok) throw new Error("guest failed");
  const body = await res.json();
  setSession(body.token, body.name);
  return body;
}

export async function restoreToken(token: string) {
  const clean = token.trim();
  if (!clean) throw new Error("empty");
  localStorage.setItem(TOKEN_KEY, clean);
  const res = await fetch(`${cloudUrl()}/me`, { headers: { Authorization: `Bearer ${clean}` } });
  if (!res.ok) {
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("bad code");
  }
  const me = await res.json();
  setSession(clean, me.name);
  return me;
}

export function discordLoginUrl(): string {
  return `${cloudUrl()}/auth/discord`;
}

/** The cloud holds a newer copy of this hold. `save` is that cloud save, ready to load. */
export class CloudConflictError extends Error {
  constructor(message: string, readonly save: string | null) {
    super(message);
  }
}

/** replace: the player chose to overwrite the cloud hold with a fresh game. */
export async function pushSave(json: string, replace = false): Promise<void> {
  const res = await req(replace ? "/save?replace=1" : "/save", { method: "PUT", body: json });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = typeof body?.error === "string" ? body.error : "push failed";
    if (res.status === 409 && body?.conflict) {
      throw new CloudConflictError(message, typeof body.save === "string" ? body.save : null);
    }
    throw new Error(message);
  }
}

export async function pullSave(): Promise<string> {
  const res = await req("/save");
  if (!res.ok) throw new Error("no cloud save");
  return res.text();
}

export async function openWatch(): Promise<{ code: string; url: string }> {
  const res = await req("/watch", { method: "POST" });
  if (!res.ok) throw new Error("watch failed");
  return res.json();
}

export async function fetchBoard(): Promise<{ board: BoardRow[] }> {
  const res = await fetch(`${cloudUrl()}/board`);
  if (!res.ok) throw new Error("board failed");
  return res.json();
}

export async function fetchProfile(id: string): Promise<BoardRow> {
  const res = await fetch(`${cloudUrl()}/profile/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("no profile");
  return res.json();
}

export async function saveProfile(patch: { motto?: string; crest?: string }): Promise<void> {
  const res = await req("/profile", { method: "PUT", body: JSON.stringify(patch) });
  if (!res.ok) throw new Error("profile failed");
}

export type BoardRow = {
  id: string;
  name: string;
  kind: string;
  motto: string;
  crest: string;
  prestige: number;
  wins: number;
  tick: number;
  buildings: number;
};
