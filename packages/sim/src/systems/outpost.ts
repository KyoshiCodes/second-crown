import type { GameState, Province } from "@second-crown/shared";

export function listOutposts(state: GameState, realmId = "player"): Province[] {
  return state.board.provinces.filter(
    (p) => p.occupantRealmId === realmId && p.id !== state.board.homeProvinceId && p.node !== "hold"
  );
}

export function plantOutpost(state: GameState, dest: Province, realmId = "player"): boolean {
  if (dest.id === state.board.homeProvinceId) return false;
  if (dest.node === "hold" && dest.occupantRealmId && dest.occupantRealmId !== realmId) return false;
  dest.occupantRealmId = realmId;
  if (dest.node === "none" || dest.node === "camp") dest.node = "field";
  return true;
}
