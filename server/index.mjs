import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createLedgerHandler } from "./ledger.mjs";
import { gateSave, SaveGateError, MAX_SAVE_BYTES } from "./savegate.mjs";
import { createRealmClocks } from "./realmclock.mjs";
import { HoldError } from "./hold.mjs";
import { createJoinableHolds } from "./join.mjs";
import { createHoldStore } from "./keep.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const DATA = process.env.DATA_DIR || path.join(__dirname, "data");
const ORIGIN = process.env.CORS_ORIGIN || "*";
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT = process.env.DISCORD_REDIRECT || `http://localhost:${PORT}/auth/discord/callback`;
const PUBLIC_APP = process.env.PUBLIC_APP_URL || `http://localhost:${PORT}`;
const DIST = process.env.APP_DIST || path.join(__dirname, "../packages/app/dist");

const USERS = path.join(DATA, "users.json");
const SAVES = path.join(DATA, "saves");
const WATCH = path.join(DATA, "watch");

fs.mkdirSync(SAVES, { recursive: true });
fs.mkdirSync(WATCH, { recursive: true });
if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, "{}");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS, "utf8"));
}
function writeUsers(u) {
  fs.writeFileSync(USERS, JSON.stringify(u, null, 2));
}
function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hold-Key",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  });
  res.end(data);
}
function text(res, code, body, type = "text/plain") {
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": ORIGIN,
  });
  res.end(body);
}
function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
function userFromToken(token) {
  if (!token) return null;
  const users = readUsers();
  return Object.values(users).find((u) => u.token === token) || null;
}
function newToken() {
  return crypto.randomBytes(16).toString("hex");
}
function holdKey(req) {
  const k = req.headers["x-hold-key"];
  return typeof k === "string" ? k.trim() : "";
}
function newCode() {
  return crypto.randomBytes(3).toString("hex");
}
function readBody(req, limit = MAX_SAVE_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new SaveGateError(413, "Request is too large."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function tryStatic(urlPath, res) {
  if (!fs.existsSync(DIST)) return false;
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(path.normalize(DIST))) return false;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const fallback = path.join(DIST, "index.html");
    if (!fs.existsSync(fallback)) return false;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(fallback));
    return true;
  }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
  return true;
}
function mirrorWatch(u, body) {
  if (u.watchCode) fs.writeFileSync(path.join(WATCH, `${u.watchCode}.json`), body);
}
function statsFromSave(raw) {
  try {
    const s = typeof raw === "string" ? JSON.parse(raw) : raw;
    const flags = s.flags || {};
    return {
      prestige: Number(flags.prestige_level || 0),
      wins: Number(flags.wars_won || 0),
      tick: Number(s.meta?.tick || 0),
      buildings: Array.isArray(s.buildings) ? s.buildings.length : 0,
    };
  } catch {
    return { prestige: 0, wins: 0, tick: 0, buildings: 0 };
  }
}
function boardRow(u, stats) {
  return {
    id: u.id,
    name: u.name,
    kind: u.kind || "guest",
    motto: u.motto || "",
    crest: u.crest || "sun",
    prestige: stats.prestige || 0,
    wins: stats.wins || 0,
    tick: stats.tick || 0,
    buildings: stats.buildings || 0,
  };
}
function buildBoard() {
  const users = readUsers();
  const rows = [];
  for (const u of Object.values(users)) {
    const file = path.join(SAVES, `${u.id}.json`);
    let stats = u.stats || { prestige: 0, wins: 0, tick: 0, buildings: 0 };
    if (fs.existsSync(file)) stats = statsFromSave(fs.readFileSync(file, "utf8"));
    else if (!u.stats) continue;
    rows.push(boardRow(u, stats));
  }
  rows.sort((a, b) => b.prestige - a.prestige || b.wins - a.wins || b.tick - a.tick);
  return rows.slice(0, 50);
}

async function discordToken(code) {
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: DISCORD_REDIRECT,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("discord token failed");
  return res.json();
}
async function discordMe(access) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!res.ok) throw new Error("discord me failed");
  return res.json();
}

const handleLedger = createLedgerHandler(DATA, {
  findUser: (id) => Object.values(readUsers()).find((u) => u.id === id),
  readSave: (id) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
    const file = path.join(SAVES, id + ".json");
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  },
});
const realmClocks = createRealmClocks();
// REALTIME.md Phase 2: account ids whose save is a shared realm. The browser cannot replace
// a shared save; GET /save still serves it. Empty: no realm is shared. Owner decision to add one.
const SHARED_SAVES = new Set();
// REALTIME.md Phase 3 (ADR-011): realm ids that get a shared hold, the only place the server runs
// packages/sim. Empty: no realm is shared, so the sim is never loaded. Owner decision to add one.
const SHARED_REALMS = new Set();
// Opt-in joins: a player types a realm id and gets a hold under "join-<id>". The hold is kept in
// SAVES as "<realmId>.json" (never an account id), so it survives a restart.
// The first join hands back a hold key once; later joins, reads, and intents send it as X-Hold-Key.
// A join never touches SHARED_SAVES, a solo save, or applyOfflineProgress.
const joinable = createJoinableHolds({
  clocks: realmClocks,
  isShared: (id) => SHARED_REALMS.has(id),
  store: createHoldStore(SAVES),
});
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") return json(res, 204, {});

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true, discord: Boolean(DISCORD_CLIENT_ID) });
  }

  if (req.method === "GET" && url.pathname === "/board") {
    return json(res, 200, { board: buildBoard() });
  }

  if (url.pathname === "/auction" || url.pathname === "/pvp") {
    return handleLedger(req, res, url.pathname.slice(1), userFromToken(bearer(req)), json);
  }
  if (req.method === "GET" && url.pathname.startsWith("/profile/")) {
    const id = decodeURIComponent(url.pathname.slice("/profile/".length));
    const users = readUsers();
    const u = users[id];
    if (!u) return json(res, 404, { error: "no profile" });
    const file = path.join(SAVES, `${u.id}.json`);
    const stats = fs.existsSync(file) ? statsFromSave(fs.readFileSync(file, "utf8")) : u.stats || {};
    return json(res, 200, boardRow(u, stats));
  }

  if (req.method === "PUT" && url.pathname === "/profile") {
    const u = userFromToken(bearer(req));
    if (!u) return json(res, 401, { error: "unauthorized" });
    const users = readUsers();
    const rec = users[u.id];
    if (!rec) return json(res, 401, { error: "unauthorized" });
    try {
      const body = JSON.parse(await readBody(req));
      if (typeof body.motto === "string") rec.motto = String(body.motto).slice(0, 80);
      if (typeof body.crest === "string") rec.crest = String(body.crest).slice(0, 16);
      writeUsers(users);
      return json(res, 200, { ok: true });
    } catch {
      return json(res, 400, { error: "bad profile" });
    }
  }

  if (req.method === "POST" && url.pathname === "/guest") {
    const users = readUsers();
    const id = `guest_${newCode()}`;
    const token = newToken();
    users[id] = { id, name: url.searchParams.get("name") || "Guest", token, kind: "guest" };
    writeUsers(users);
    return json(res, 200, { id, token, name: users[id].name });
  }

  if (req.method === "GET" && url.pathname === "/auth/discord") {
    if (!DISCORD_CLIENT_ID) return text(res, 501, "Discord is not configured on this server.");
    const qs = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT,
      response_type: "code",
      scope: "identify",
    });
    res.writeHead(302, { Location: `https://discord.com/oauth2/authorize?${qs}` });
    return res.end();
  }

  if (req.method === "GET" && url.pathname === "/auth/discord/callback") {
    try {
      const code = url.searchParams.get("code");
      if (!code) return text(res, 400, "missing code");
      const tok = await discordToken(code);
      const me = await discordMe(tok.access_token);
      const users = readUsers();
      const id = `discord_${me.id}`;
      const token = users[id]?.token || newToken();
      users[id] = {
        ...users[id],
        id,
        name: me.global_name || me.username,
        token,
        kind: "discord",
        discordId: me.id,
        watchCode: users[id]?.watchCode,
      };
      writeUsers(users);
      const back = new URL(PUBLIC_APP);
      back.hash = `cloud_token=${token}&cloud_name=${encodeURIComponent(users[id].name)}`;
      res.writeHead(302, { Location: back.toString() });
      return res.end();
    } catch (e) {
      return text(res, 500, String(e));
    }
  }

  if (req.method === "GET" && url.pathname === "/me") {
    const u = userFromToken(bearer(req));
    if (!u) return json(res, 401, { error: "unauthorized" });
    return json(res, 200, { id: u.id, name: u.name, kind: u.kind, watchCode: u.watchCode || null, motto: u.motto || "", crest: u.crest || "sun" });
  }

  if (req.method === "POST" && url.pathname === "/watch") {
    const u = userFromToken(bearer(req));
    if (!u) return json(res, 401, { error: "unauthorized" });
    const users = readUsers();
    const rec = users[u.id];
    if (!rec) return json(res, 401, { error: "unauthorized" });
    rec.watchCode = rec.watchCode || newCode();
    writeUsers(users);
    const saveFile = path.join(SAVES, `${u.id}.json`);
    if (fs.existsSync(saveFile)) {
      fs.copyFileSync(saveFile, path.join(WATCH, `${rec.watchCode}.json`));
    }
    return json(res, 200, {
      code: rec.watchCode,
      url: `${PUBLIC_APP}/#watch=${rec.watchCode}`,
    });
  }

  // REALTIME.md Phase 1: memory-only tick count per realm. Never touches a save.
  const realmTick = /^\/realm\/([^/]+)\/tick$/.exec(url.pathname);
  if (req.method === "GET" && realmTick) {
    const realmId = realmTick[1];
    const tick = realmClocks.tick(realmId);
    if (tick === null) return json(res, 400, { error: "bad realm" });
    return json(res, 200, { realmId, tick });
  }

  // Opt-in join: body is exactly { realm: "<typed id>" }, key in X-Hold-Key. Answers with the shared
  // hold view, plus { key } the one time a first join makes the hold.
  if (url.pathname === "/join") {
    if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
    const u = userFromToken(bearer(req));
    if (!u) return json(res, 401, { error: "unauthorized" });
    try {
      let body;
      try { body = JSON.parse(await readBody(req, 1024)); } catch { return json(res, 400, { error: "Send a realm id to join, not a state." }); }
      return json(res, 200, await joinable.join(body, holdKey(req), u.id));
    } catch (e) {
      if (e instanceof HoldError) return json(res, e.status, { error: e.message });
      return json(res, 500, { error: "join failed" });
    }
  }

  // REALTIME.md Phase 3: a shared hold. Readers see one tick; intents land on a tick boundary.
  const realmHold = /^\/realm\/([^/]+)\/(hold|intent)$/.exec(url.pathname);
  if (realmHold) {
    const realmId = realmHold[1];
    try {
      if (req.method === "GET" && realmHold[2] === "hold") {
        const u = userFromToken(bearer(req));
        const view = await joinable.read(realmId, holdKey(req), u?.id);
        return view ? json(res, 200, view) : json(res, 404, { error: "not a shared realm" });
      }
      if (req.method === "POST" && realmHold[2] === "intent") {
        const u = userFromToken(bearer(req));
        if (!u) return json(res, 401, { error: "unauthorized" });
        let body;
        try { body = JSON.parse(await readBody(req, 1024)); } catch { return json(res, 400, { error: "Send one intent, not a state." }); }
        const view = await joinable.intent(realmId, u.id, body, holdKey(req), u.id);
        return view ? json(res, 200, view) : json(res, 404, { error: "not a shared realm" });
      }
      return json(res, 405, { error: "method not allowed" });
    } catch (e) {
      if (e instanceof HoldError) return json(res, e.status, { error: e.message });
      return json(res, 500, { error: "hold failed" });
    }
  }

  if (req.method === "GET" && url.pathname.startsWith("/watch/")) {
    const code = url.pathname.slice("/watch/".length).replace(/[^a-z0-9]/gi, "");
    const file = path.join(WATCH, `${code}.json`);
    if (!fs.existsSync(file)) return json(res, 404, { error: "no watch" });
    return text(res, 200, fs.readFileSync(file, "utf8"), "application/json");
  }

  if (url.pathname === "/save") {
    const u = userFromToken(bearer(req));
    if (!u) return json(res, 401, { error: "unauthorized" });
    const file = path.join(SAVES, `${u.id}.json`);
    if (req.method === "GET") {
      if (!fs.existsSync(file)) return json(res, 404, { error: "no save" });
      return text(res, 200, fs.readFileSync(file, "utf8"), "application/json");
    }
    if (req.method === "PUT") {
      const users = readUsers();
      const rec = users[u.id] || u;
      const now = Date.now();
      let body;
      try {
        body = await readBody(req);
        let prev = null;
        let prevAt = now;
        if (fs.existsSync(file)) {
          try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch { prev = null; }
          prevAt = Number.isFinite(rec.saveAt) ? rec.saveAt : fs.statSync(file).mtimeMs;
        }
        gateSave(body, prev, now - prevAt, url.searchParams.get("replace") === "1", SHARED_SAVES.has(u.id));
      } catch (e) {
        if (e instanceof SaveGateError && e.conflict) {
          // Hand back the cloud hold so the client can load it instead of overwriting it.
          const cloud = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
          return json(res, 409, { error: e.message, conflict: true, save: cloud });
        }
        if (e instanceof SaveGateError) return json(res, e.status, { error: e.message });
        return json(res, 400, { error: "bad save" });
      }
      fs.writeFileSync(file, body);
      rec.stats = statsFromSave(body);
      rec.saveAt = now;
      users[u.id] = rec;
      writeUsers(users);
      mirrorWatch(rec, body);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: "Saves are replaced whole with PUT." });
  }

  if (req.method === "GET") {
    if (tryStatic(url.pathname, res)) return;
  }

  return json(res, 404, { error: "not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`second-crown cloud on :${PORT} discord=${Boolean(DISCORD_CLIENT_ID)} dist=${fs.existsSync(DIST)}`);
});
