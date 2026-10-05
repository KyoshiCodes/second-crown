import { afterEach, describe, expect, it, vi } from "vitest";
import { absorbHashSession, cloudToken, createGuest, startDiscordLogin } from "./cloud";
import { startLogin, takeLogin } from "./login";
import { joinRealm } from "./hold";

afterEach(() => {
  vi.unstubAllGlobals();
});

function memStorage(init: Record<string, string> = {}) {
  const m: Record<string, string> = { ...init };
  return {
    getItem: (k: string) => (k in m ? m[k] : null),
    setItem: (k: string, v: string) => { m[k] = String(v); },
    removeItem: (k: string) => { delete m[k]; },
    data: m,
  };
}

/** A browser on the game page with `hash`, signed in as "mine" unless told otherwise. */
function browser(hash = "", local: Record<string, string> = { "sc-cloud-token": "mine", "sc-cloud-name": "Me" }) {
  const localStorage = memStorage(local);
  const sessionStorage = memStorage();
  const location = { hash, pathname: "/", search: "" };
  const replaceState = vi.fn(() => { location.hash = ""; });
  const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) =>
    new Response(JSON.stringify({ id: "guest_new", token: "fresh", name: "New" }), { status: 200 }));
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", { location, sessionStorage });
  vi.stubGlobal("history", { replaceState });
  vi.stubGlobal("fetch", fetchSpy);
  return { localStorage, sessionStorage, location, replaceState, fetchSpy };
}

const stateOf = (url: string) => new URL(url).searchParams.get("state") ?? "";

describe("login nonce", () => {
  it("a foreign token in the URL does not replace the session and does not upload", () => {
    const b = browser("#cloud_token=theirs&cloud_name=Eve");
    expect(absorbHashSession()).toBe("refused");
    expect(cloudToken()).toBe("mine");
    expect(b.fetchSpy).not.toHaveBeenCalled();
    expect(b.replaceState).toHaveBeenCalled();
  });

  it("a foreign token with a made-up nonce is refused even mid-login", () => {
    const b = browser();
    startDiscordLogin();
    b.location.hash = `#cloud_token=theirs&cloud_name=Eve&cloud_nonce=${"x".repeat(32)}`;
    expect(absorbHashSession()).toBe("refused");
    expect(cloudToken()).toBe("mine");
    expect(b.fetchSpy).not.toHaveBeenCalled();
  });

  it("a nonce that was already used is refused", () => {
    const b = browser();
    const nonce = stateOf(startDiscordLogin());
    b.location.hash = `#cloud_token=t1&cloud_name=Me&cloud_nonce=${nonce}`;
    expect(absorbHashSession()).toBe("signed-in");
    b.location.hash = `#cloud_token=theirs&cloud_name=Eve&cloud_nonce=${nonce}`;
    expect(absorbHashSession()).toBe("refused");
    expect(cloudToken()).toBe("t1");
    expect(takeLogin(nonce)).toBe(false);
  });

  it("a Discord login this browser started still signs in", () => {
    const b = browser("", {});
    const url = startDiscordLogin();
    expect(url).toMatch(/\/auth\/discord\?state=[A-Za-z0-9_-]{22,64}$/);
    b.location.hash = `#cloud_token=t1&cloud_name=Me&cloud_nonce=${stateOf(url)}`;
    expect(absorbHashSession()).toBe("signed-in");
    expect(cloudToken()).toBe("t1");
    expect(b.sessionStorage.getItem("sc-login-nonce")).toBeNull();
  });

  it("a guest sign-in this browser started still signs in", async () => {
    browser("", {});
    expect((await createGuest("New")).token).toBe("fresh");
    expect(cloudToken()).toBe("fresh");
  });

  it("each login gets a fresh nonce; only the newest counts", () => {
    browser();
    const a = startLogin();
    const b = startLogin();
    expect(a).not.toBe(b);
    expect(takeLogin(a)).toBe(false);
    expect(takeLogin(b)).toBe(false);
  });

  it("a solo load does not join, and a hold join still sends the hold key", async () => {
    const b = browser();
    absorbHashSession();
    b.location.hash = "#cloud_token=theirs";
    absorbHashSession();
    expect(b.fetchSpy).not.toHaveBeenCalled();
    await joinRealm("oak-hill", "k".repeat(16)).catch(() => undefined);
    const [url, init] = b.fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/join$/);
    expect(new Headers(init?.headers).get("X-Hold-Key")).toBe("k".repeat(16));
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer mine");
  });
});
