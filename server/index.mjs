/**
 * Tiny playtest cloud: guest codes + optional Discord OAuth + save blobs.
 * Also serves packages/app/dist when present so one public port is enough.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

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

fs.mkdirSync(SAVES, { recursive: true });
if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, "{}");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
function newCode() {
  return crypto.randomBytes(3).toString("hex");
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
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
    const html = fs.readFileSync(fallback);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return true;
  }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
  return true;
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

const API = new Set([
  "/health",
  "/guest",
  "/me",
  "/save",
  "/auth/discord",
  "/auth/discord/callback",
]);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") return json(res, 204, {});

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true, discord: Boolean(DISCORD_CLIENT_ID) });
  }

  if (req.method === "POST" && url.pathname === "/guest") {
    const users = readUsers();
    const id = `guest_${newCode()}`;
    const token = newToken();
    users[id] = {
      id,
      name: url.searchParams.get("name") || "Guest",
      token,
      kind: "guest",
    };
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
        id,
        name: me.global_name || me.username,
        token,
        kind: "discord",
        discordId: me.id,
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
    return json(res, 200, { id: u.id, name: u.name, kind: u.kind });
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
      const body = await readBody(req);
      JSON.parse(body);
      fs.writeFileSync(file, body);
      return json(res, 200, { ok: true });
    }
  }

  if (req.method === "GET" && !API.has(url.pathname)) {
    if (tryStatic(url.pathname, res)) return;
  }

  return json(res, 404, { error: "not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`second-crown cloud on :${PORT} discord=${Boolean(DISCORD_CLIENT_ID)} dist=${fs.existsSync(DIST)}`);
});
