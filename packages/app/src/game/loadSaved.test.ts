import { describe, expect, it, vi } from "vitest";
import { createGameState, deserializeState, serializeState, type GameState } from "@second-crown/sim";
import { loadSaved, type LoadDeps } from "./loadSaved";

/** A reload: the browser's copy round-trips through local storage as text. */
function reloadLocal(state: GameState): GameState {
  return deserializeState(serializeState(state));
}

function deps(realmId: string | null, serverRaw: string): LoadDeps {
  return {
    sharedRealmId: () => realmId,
    pullServerSave: vi.fn(async () => serverRaw),
    writeCache: vi.fn(async () => {}),
  };
}

function edited(server: GameState): GameState {
  const local = reloadLocal(server);
  local.meta.tick = server.meta.tick + 50_000;
  local.flags.cheated = true;
  return local;
}

describe("loadSaved", () => {
  it("a shared reload returns the server save after the local copy was edited", async () => {
    const server = createGameState();
    const serverRaw = serializeState(server);
    const local = edited(server);
    expect(serializeState(local)).not.toBe(serverRaw);

    const d = deps("realm-a", serverRaw);
    const loaded = await loadSaved(local, d);
    expect(loaded.source).toBe("server");
    expect(serializeState(loaded.state)).toBe(serverRaw);
    expect(loaded.state.flags.cheated).toBeUndefined();
    expect(d.pullServerSave).toHaveBeenCalledWith("realm-a");
    // The browser copy is only a cache: it is overwritten with the server save.
    expect(d.writeCache).toHaveBeenCalledWith(serverRaw);
  });

  it("a solo reload still returns the local save", async () => {
    const server = createGameState();
    const local = edited(server);
    const d = deps(null, serializeState(server));
    const loaded = await loadSaved(local, d);
    expect(loaded).toEqual({ state: local, source: "local" });
    expect(loaded.state).toBe(local);
    expect(d.pullServerSave).not.toHaveBeenCalled();
    expect(d.writeCache).not.toHaveBeenCalled();
  });

  it("the default deps keep every realm solo, with no server read", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    try {
      const local = createGameState();
      expect(await loadSaved(local)).toEqual({ state: local, source: "local" });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("a shared reload with the server down shows the cache and writes nothing", async () => {
    const local = createGameState();
    const d = deps("realm-a", "");
    d.pullServerSave = vi.fn(async () => { throw new Error("down"); });
    expect(await loadSaved(local, d)).toEqual({ state: local, source: "cache" });
    expect(d.writeCache).not.toHaveBeenCalled();
  });
});
