import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";

export function forcePower(force: Record<string, number>): number {
  let p = 0;
  for (const [id, n] of Object.entries(force)) {
    if (n <= 0) continue;
    p += (getUnitType(id)?.power ?? 1) * n;
  }
  return p;
}

export function takeForce(state: GameState, force: Record<string, number>): boolean {
  for (const [id, n] of Object.entries(force)) {
    if (n <= 0) continue;
    const u = state.units.find((x) => x.realmId === "player" && x.typeId === id);
    if (!u || D(u.count).lt(n)) return false;
  }
  for (const [id, n] of Object.entries(force)) {
    if (n <= 0) continue;
    const u = state.units.find((x) => x.realmId === "player" && x.typeId === id)!;
    u.count = toDecimalString(D(u.count).sub(n));
    if (D(u.count).lte(0)) state.units = state.units.filter((x) => x !== u);
  }
  return Object.values(force).some((n) => n > 0);
}

export function returnForce(state: GameState, force: Record<string, number>, keepFrac = 1): void {
  for (const [id, n] of Object.entries(force)) {
    const back = Math.floor(n * keepFrac);
    if (back <= 0) continue;
    const u = state.units.find((x) => x.realmId === "player" && x.typeId === id);
    if (u) u.count = toDecimalString(D(u.count).add(back));
    else {
      state.units.push({
        id: `u_${id}_${state.meta.tick}`,
        typeId: id,
        realmId: "player",
        count: toDecimalString(back),
        armyId: null,
      });
    }
  }
}
