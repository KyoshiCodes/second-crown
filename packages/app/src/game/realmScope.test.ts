import { describe, expect, it } from "vitest";
import { createGameState, tryDeclareWar, type GameState } from "@second-crown/sim";
import { playerStanceToward } from "../hud/RealmCard";
import { miraRemark } from "../content/mira";

/** Realm scope in the app: catch-up rules and war reads belong to the player's realm. */

function readSource(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function withNpcWar(): GameState {
  const state = createGameState({ seed: 1, now: 1 });
  state.wars.push({ id: "war_npc_k_ash_k_silk_400", attackerRealmId: "k_ash", defenderRealmId: "k_silk", startedTick: 0, status: "active" });
  return state;
}

describe("realm scope: offline catch-up", () => {
  it("Import save settles through settleOnLoad, so a shared realm is never fast-forwarded", () => {
    const src = readSource("./useGameEngine.ts");
    expect(src).not.toMatch(/applyOfflineProgress/);
    const importBody = src.slice(src.indexOf("const importSaveFile"), src.indexOf("const newGame"));
    expect(importBody).toMatch(/await settleOnLoad\(st\)/);
    expect(importBody).toMatch(/result\.mode === "solo" \? result\.settled : 0/);
  });
});

describe("realm scope: war reads", () => {
  it("two other realms at war do not show as at war with the player", () => {
    const state = withNpcWar();
    expect(playerStanceToward(state, "k_ash").stance).not.toBe("war");
    expect(playerStanceToward(state, "k_silk").stance).not.toBe("war");
  });

  it("the player's own war still shows", () => {
    const state = withNpcWar();
    expect(tryDeclareWar(state, { attackerRealmId: "player", defenderRealmId: "rival" })).toBe(true);
    expect(playerStanceToward(state, "rival").stance).toBe("war");
    expect(playerStanceToward(state, "k_ash").stance).not.toBe("war");
  });

  it("Mira does not sound the horns for a war the player is not in", () => {
    expect(miraRemark(withNpcWar(), "")).not.toMatch(/horns are up/);
  });

  it("war reads in the shell go through activeWarFor, not the first active war", () => {
    for (const f of ["../AppShell.tsx", "../WarRoom.tsx", "../WarLivingStrip.tsx", "../hud/RealmCard.tsx", "../SpectatorView.tsx", "../content/mira.ts"]) {
      expect(readSource(f), f).not.toMatch(/wars\.(find|some)\(\(w\) => w\.status === "active"\)/);
    }
  });
});
