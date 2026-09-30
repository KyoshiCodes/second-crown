import { buildCostMultiplier, canPlaceType, getBuildingType, isHoldRim, scoutCost, type GameState } from "@second-crown/sim";

/** Hold grid size. Mirrors HOLD_W / HOLD_H in packages/sim/src/actions/build.ts. */
const HOLD_W = 16;
const HOLD_H = 10;

function needOf(state: GameState, typeId: string, res: string): number {
  const cost = getBuildingType(typeId)?.cost as Record<string, string | undefined> | undefined;
  const raw = cost?.[res];
  if (!raw) return 0;
  return Math.ceil(Number(raw) * buildCostMultiplier(state, "player"));
}

function costText(state: GameState, typeId: string): string {
  const def = getBuildingType(typeId);
  if (!def) return "";
  return Object.keys(def.cost)
    .map((res) => `${needOf(state, typeId, res)} ${res}`)
    .join(", ");
}

/** One line when Walls are short on stone. Costs come from building data. */
export function wallsStoneHint(state: GameState | undefined): string | null {
  if (!state) return null;
  const need = needOf(state, "walls", "stone");
  if (need <= 0 || Number(state.resources.stone ?? "0") >= need) return null;
  const quarry = getBuildingType("quarry");
  if (!quarry) return null;
  return `Walls need ${need} stone. Build a ${quarry.name} (${costText(state, "quarry")}) for stone.`;
}

/**
 * One empty plot a Quarry could go on, while the Walls stone hint shows.
 * Inner plots first so the rim stays free for walls. Read-only: uses the sim's own placement check.
 */
export function quarryHintPlot(state: GameState | undefined): { x: number; y: number } | null {
  if (!state || !wallsStoneHint(state)) return null;
  let rim: { x: number; y: number } | null = null;
  for (let y = 0; y < HOLD_H; y++) {
    for (let x = 0; x < HOLD_W; x++) {
      if (!canPlaceType(state, "quarry", x, y)) continue;
      if (!isHoldRim(x, y)) return { x, y };
      rim ??= { x, y };
    }
  }
  return rim;
}

/** One line when the scout column is short on gold. */
export function scoutGoldHint(state: GameState | undefined): string | null {
  if (!state) return null;
  const cost = scoutCost(state);
  if (Number(state.resources.gold ?? "0") >= cost) return null;
  const tower = getBuildingType("watchtower");
  if (!tower || !tower.productionPerTick.gold) return null;
  return `Scout needs ${cost} gold. A ${tower.name} produces gold (${costText(state, "watchtower")}).`;
}
