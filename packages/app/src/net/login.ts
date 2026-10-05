// Login nonce. A sign-in result counts only if this browser started that sign-in.
// startLogin() makes a one-use nonce before the Discord redirect or the guest request.
// takeLogin() checks a returning nonce against it and discards the stored one, match or not.
// server/nonce.mjs holds the Discord side (cookie + OAuth state) and its pattern.

const NONCE_KEY = "sc-login-nonce";
export const NONCE_RE = /^[A-Za-z0-9_-]{22,64}$/;

function store(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function newNonce(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Make and remember a fresh nonce. A newer login replaces an older one. */
export function startLogin(): string {
  const nonce = newNonce();
  store()?.setItem(NONCE_KEY, nonce);
  return nonce;
}

/** True only for the nonce this browser stored. The stored nonce is discarded either way. */
export function takeLogin(nonce: string | null | undefined): boolean {
  const s = store();
  const stored = s?.getItem(NONCE_KEY) ?? "";
  s?.removeItem(NONCE_KEY);
  return Boolean(nonce) && NONCE_RE.test(stored) && nonce === stored;
}
