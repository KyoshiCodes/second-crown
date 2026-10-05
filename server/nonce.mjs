// Login nonce: a Discord callback is accepted only by the browser that started that login.
// /auth/discord?state=<nonce> stores the nonce in a short-lived HttpOnly cookie and hands it
// to Discord as `state`. The callback must bring the same state back, in the same browser,
// or it is refused. The cookie is cleared either way, so a nonce works once.
// The browser keeps its own copy too (packages/app/src/net/login.ts) and checks the
// cloud_nonce the callback puts in the hash before it trusts cloud_token.

import crypto from "node:crypto";

export const NONCE_COOKIE = "sc_login";
export const NONCE_RE = /^[A-Za-z0-9_-]{22,64}$/;
export const NONCE_MAX_AGE_S = 600;
export const BAD_STATE = "Login refused: this browser did not start it.";

export function isNonce(value) {
  return typeof value === "string" && NONCE_RE.test(value);
}

/** Set-Cookie for the start of a Discord login. Scoped to /auth/discord only. */
export function nonceCookie(nonce) {
  return `${NONCE_COOKIE}=${nonce}; HttpOnly; SameSite=Lax; Path=/auth/discord; Max-Age=${NONCE_MAX_AGE_S}`;
}

/** Set-Cookie that drops the nonce. Sent on every callback, good or bad. */
export function clearNonceCookie() {
  return `${NONCE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/auth/discord; Max-Age=0`;
}

export function readNonceCookie(cookieHeader) {
  for (const part of String(cookieHeader || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === NONCE_COOKIE) return v.join("=");
  }
  return "";
}

/** True only if the callback state is a nonce and equals the one this browser stored. */
export function stateMatches(state, cookieHeader) {
  const stored = readNonceCookie(cookieHeader);
  if (!isNonce(state) || !isNonce(stored)) return false;
  const a = Buffer.from(state);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Hash the app reads on the way back. The nonce rides along so the browser can check it. */
export function callbackHash(token, name, nonce) {
  return `cloud_token=${token}&cloud_name=${encodeURIComponent(name)}&cloud_nonce=${nonce}`;
}
