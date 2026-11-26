import { describe, it, expect, vi } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import type { GameState } from "@second-crown/shared";
import { returnForce } from "./column.js";

// Live numbers make an ordinary camp lose only to a 2-unit column, which hides the double count
// (40% of <= 2 rounds to 0, and levy - 2 = 0). Pin a lost raid with survivors so the march code
// path is checked directly. The stand-in keeps resolveCampRaid's loss contract: march.force becomes
// the clash survivors and 40% of them are sent home by type.
const pinned = { survivors: { spearman: 3, militia: 2 } as Record<string, number> };
vi.mock("./engagement.js", async (orig) => {
  const real = await orig<typeof import("./engagement.js")>();
  return {
    ...real,
    resolveCampRaid: (state: GameState, attacker: { realmId: string; levy?: number; force?: Record<string, number> }) => {
      attacker.force = { ...pinned.survivors };
      attacker.levy = Object.values(attacker.force).reduce((a, b) => a + b, 0);
      if (attacker.realmId === "player") returnForce(state, attacker.force, 0.4);
      return "lose" as const;
    },
  };
});

const { resolveMarchArrival } = await import("./march.js");
const { campTierId } = await import("./camp.js");

const count = (s: GameState, type: string) =>
  s.units.filter((u) => u.realmId === "player" && u.typeId === type).reduce((n, u) => n + Number(u.count), 0);
const wounded = (s: GameState) => Number(s.flags?.["wounded_player"] ?? 0);

describe("ordinary camp: lost raid survivors are counted once", () => {
  it("returns only 40% of the survivors by type, with no extra levy-2 militia or wounded", () => {
    const s = createGameState({ seed: 1 });
    const fair = s.board.provinces.find((p) => campTierId(s, p) === "camp")!;
    const sent = { spearman: 4, militia: 3 };
    const before = { spearman: count(s, "spearman"), militia: count(s, "militia"), wounded: wounded(s) };
    const msg = resolveMarchArrival(
      s,
      { id: "m", realmId: "player", fromId: s.board.homeProvinceId, toId: fair.id, arrivesTick: 10, kind: "camp", levy: 7, force: { ...sent } },
      createRngStreams(1)
    );
    expect(msg).toBe("The camp holds. Survivors limp home.");
    // floor(3 * 0.4) = 1 spearman, floor(2 * 0.4) = 0 militia. The old code also added 7 - 2 = 5 militia
    // and 1 wounded, so 6 came home from 5 survivors.
    expect(count(s, "spearman") - before.spearman).toBe(1);
    expect(count(s, "militia") - before.militia).toBe(0);
    expect(wounded(s) - before.wounded).toBe(0);
  });

  it("a rival's lost raid returns nothing to the player", () => {
    const s = createGameState({ seed: 1 });
    const fair = s.board.provinces.find((p) => campTierId(s, p) === "camp")!;
    const before = count(s, "militia") + count(s, "spearman");
    resolveMarchArrival(
      s,
      { id: "m", realmId: "rival", fromId: s.board.homeProvinceId, toId: fair.id, arrivesTick: 10, kind: "camp", levy: 7, force: { spearman: 4, militia: 3 } },
      createRngStreams(1)
    );
    expect(count(s, "militia") + count(s, "spearman")).toBe(before);
  });
});
