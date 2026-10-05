import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanJoinCode, joinRealm, readHold, sendStamp } from "./hold";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubServer(view: unknown) {
  const store: Record<string, string> = { "sc-cloud-token": "tok" };
  vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null });
  const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(view), { status: 200 }));
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

const view = { realmId: "realm-a", tick: 6, stamps: [{ tick: 6, by: "guest_a" }], pending: 0 };

describe("shared hold client", () => {
  it("readHold reads the hold for that realm id", async () => {
    const fetchSpy = stubServer(view);
    expect(await readHold("realm-a")).toEqual(view);
    expect(String(fetchSpy.mock.calls[0][0])).toMatch(/\/realm\/realm-a\/hold$/);
  });

  it("sendStamp sends one intent, never a state", async () => {
    const fetchSpy = stubServer(view);
    await sendStamp("realm-a");
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/realm\/realm-a\/intent$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ type: "stamp" });
  });

  it("a bad view is refused", async () => {
    stubServer({ realmId: "realm-a", tick: -1, stamps: [] });
    await expect(readHold("realm-a")).rejects.toThrow();
  });

  it("joinRealm sends only the typed id and returns the shared view", async () => {
    const joined = { ...view, realmId: "join-oak-hill" };
    const fetchSpy = stubServer(joined);
    expect(await joinRealm("  Oak-Hill ")).toEqual(joined);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/join$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ realm: "oak-hill" });
  });

  it("a blank id does not join", async () => {
    const fetchSpy = stubServer(view);
    expect(await joinRealm("")).toBeNull();
    expect(await joinRealm("   ")).toBeNull();
    expect(cleanJoinCode("a b")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
