import type { GameState } from "@second-crown/shared";
import { gateHp } from "./gate.js";

export type HallRoom = "yard" | "lectern" | "gate";

/** Room → the finished player building that opens it. Same map as the app's KeepHall. */
export const HALL_ROOM_NEEDS: Record<HallRoom, string> = {
  yard: "barracks",
  lectern: "academy",
  gate: "gate",
};

/** Base heal is HEAL_TICKS (50). A finished Barracks (Yard room) trims it to this. */
export const YARD_HEAL_TICKS = 40;

/** Academy already shortens new studies by 20% (see researchDuration). Shown, not retuned. */
export const LECTERN_STUDY_MULT = 0.8;

export interface HallBonus {
  room: HallRoom;
  on: boolean;
  text: string;
}

export function hallRoomBuilt(state: GameState, room: HallRoom, realmId = "player"): boolean {
  const typeId = HALL_ROOM_NEEDS[room];
  return state.buildings.some((b) => b.realmId === realmId && b.typeId === typeId && b.completesAtTick === null);
}

/**
 * One small bonus per finished keep room. Missing room → no bonus.
 * Yard: faster treat-wounded. Lectern: existing Academy study speed. Gate: existing gate HP in the wall soak.
 */
export function hallBonuses(state: GameState): HallBonus[] {
  const yard = hallRoomBuilt(state, "yard");
  const lectern = hallRoomBuilt(state, "lectern");
  const gate = hallRoomBuilt(state, "gate");
  const gHp = gateHp(state, "player");
  return [
    { room: "yard", on: yard, text: `Treated wounded return in ${YARD_HEAL_TICKS / 10}s (was 5s)` },
    { room: "lectern", on: lectern, text: `New studies ${Math.round((1 - LECTERN_STUDY_MULT) * 100)}% shorter` },
    { room: "gate", on: gate, text: gHp > 0 ? `Gate adds ${gHp} HP to the wall soak` : "Gate adds HP to the wall soak once it sits on the rim" },
  ];
}
