import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanJoinCode, joinRealm, readHold, sendBuild, sendStamp, sendTrain } from "./hold";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubServer(view: unknown, status = 200) {
  const store: Record<string, string> = { "sc-cloud-token": "tok" };
  vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null });
  const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(view), { status }));
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

const view = {
  realmId: "realm-a",
  tick: 6,
  stores: { food: "12.5", wood: "3", stone: "0", gold: "1" },
  militia: 2,
  training: 1,
  farms: 2,
  stamps: [{ tick: 6, by: "guest_a" }],
  pending: 0,
};

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

  it("sendTrain sends only { type: train }, never a unit, count, or state", async () => {
    const fetchSpy = stubServer(view);
    expect(await sendTrain("join-oak-hill")).toEqual(view);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/realm\/join-oak-hill\/intent$/);
    expect(JSON.parse(String(init?.body))).toEqual({ type: "train" });
  });

  it("a refused train shows the server's reason", async () => {
    stubServer({ error: "The hold cannot afford a militia, or its training queue is full." }, 409);
    await expect(sendTrain("join-oak-hill")).rejects.toThrow(/cannot afford a militia/);
  });

  it("sendBuild sends only { type: build }, never a building, tile, or state", async () => {
    const fetchSpy = stubServer(view);
    expect(await sendBuild("join-oak-hill")).toEqual(view);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/realm\/join-oak-hill\/intent$/);
    expect(JSON.parse(String(init?.body))).toEqual({ type: "build" });
  });

  it("a refused build shows the server's reason", async () => {
    stubServer({ error: "The hold cannot afford a farm." }, 409);
    await expect(sendBuild("join-oak-hill")).rejects.toThrow(/cannot afford a farm/);
  });

  it("an older view without stores reads as zeros", async () => {
    stubServer({ realmId: "realm-a", tick: 1, stamps: [], pending: 0 });
    const read = await readHold("realm-a");
    expect(read.stores).toEqual({ food: "0", wood: "0", stone: "0", gold: "0" });
    expect(read.militia).toBe(0);
    expect(read.farms).toBe(0);
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
