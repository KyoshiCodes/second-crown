import type { GameState } from "@second-crown/shared";
import { listMarches, type March } from "./march.js";

export function incomingOnProvince(state: GameState, provinceId: string): March | undefined {
  return listMarches(state).find((m) => m.toId === provinceId && m.realmId !== "player");
}

export function incomingOnPlayerFlags(state: GameState): March[] {
  return listMarches(state).filter(
    (m) =>
      m.realmId !== "player" &&
      state.board.provinces.some(
        (p) => p.id === m.toId && p.occupantRealmId === "player" && p.id !== state.board.homeProvinceId
      )
  );
}
