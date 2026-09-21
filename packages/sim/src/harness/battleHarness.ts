import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveBattle, realmPower } from "../systems/combat.js";
import { getUnitType } from "../content/units.js";
import type { GameState, War } from "@second-crown/shared";

export type Force = Record<string, number>;

export interface HarnessRow {
  seed: number;
  label: string;
  winnerId: string;
  attackerPower: number;
  defenderPower: number;
  atkSwing: number;
  defSwing: number;
  playerWon: boolean;
}

const COMPOSITIONS: { label: string; atk: Force; def: Force }[] = [
  { label: "militia20_vs_militia20", atk: { militia: 20 }, def: { militia: 20 } },
  { label: "militia40_vs_militia20", atk: { militia: 40 }, def: { militia: 20 } },
  { label: "spear20_vs_militia20", atk: { spearman: 20 }, def: { militia: 20 } },
  { label: "archer20_vs_militia20", atk: { archer: 20 }, def: { militia: 20 } },
  { label: "cav10_vs_archer20", atk: { cavalry: 10 }, def: { archer: 20 } },
  { label: "knight8_vs_spear20", atk: { knight: 8 }, def: { spearman: 20 } },
  { label: "mixed_vs_mixed", atk: { militia: 10, spearman: 8, archer: 6 }, def: { militia: 10, spearman: 8, archer: 6 } },
  { label: "line_vs_shock", atk: { spearman: 24 }, def: { cavalry: 10 } },
  { label: "shock_vs_ranged", atk: { cavalry: 12 }, def: { archer: 20 } },
  { label: "ranged_vs_line", atk: { archer: 20 }, def: { spearman: 16 } },
];

function setForce(state: GameState, realmId: string, force: Force): void {
  state.units = state.units.filter((u) => u.realmId !== realmId);
  let i = 0;
  for (const [typeId, count] of Object.entries(force)) {
    if (!getUnitType(typeId) || count <= 0) continue;
    state.units.push({
      id: `h_${realmId}_${typeId}_${i++}`,
      realmId,
      typeId,
      count: String(count),
      armyId: null,
    });
  }
}

export function runOneFight(seed: number, label: string, atk: Force, def: Force): HarnessRow {
  const state = createGameState({ seed, now: 1 });
  setForce(state, "player", atk);
  setForce(state, "rival", def);
  const war: War = {
    id: `harness_${seed}_${label}`,
    attackerRealmId: "player",
    defenderRealmId: "rival",
    startedTick: 0,
    status: "active",
  };
  const rng = createRngStreams(seed);
  const result = resolveBattle(state, war, rng);
  return {
    seed,
    label,
    winnerId: result.winnerId,
    attackerPower: result.attackerPower,
    defenderPower: result.defenderPower,
    atkSwing: result.atkSwing,
    defSwing: result.defSwing,
    playerWon: result.winnerId === "player",
  };
}

export function runHarness(count = 1000): HarnessRow[] {
  const rows: HarnessRow[] = [];
  for (let i = 0; i < count; i++) {
    const comp = COMPOSITIONS[i % COMPOSITIONS.length];
    rows.push(runOneFight(i + 1, comp.label, comp.atk, comp.def));
  }
  return rows;
}

export function harnessCsv(rows: HarnessRow[]): string {
  const head = "seed,label,winnerId,attackerPower,defenderPower,atkSwing,defSwing,playerWon";
  const body = rows.map((r) =>
    [r.seed, r.label, r.winnerId, r.attackerPower, r.defenderPower, r.atkSwing, r.defSwing, r.playerWon].join(",")
  );
  return [head, ...body].join("\n");
}

export function harnessSummary(rows: HarnessRow[]): {
  n: number;
  playerWins: number;
  twoXNeverLoses: boolean;
} {
  const twoX = rows.filter((r) => r.label === "militia40_vs_militia20");
  return {
    n: rows.length,
    playerWins: rows.filter((r) => r.playerWon).length,
    twoXNeverLoses: twoX.every((r) => r.playerWon),
  };
}

export function forcePowerOf(force: Force): number {
  let n = 0;
  for (const [id, c] of Object.entries(force)) {
    n += (getUnitType(id)?.power ?? 0) * c;
  }
  return n;
}

export { realmPower };
