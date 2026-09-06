import type { GameState } from "@second-crown/shared";

export function settlementName(state: GameState): string {
  const n = String(state.flags.settlement_name || "").trim();
  return n || "Your Hold";
}

export function tryRenameSettlement(state: GameState, name: string): boolean {
  const n = name.trim().slice(0, 32);
  if (!n) return false;
  state.flags.settlement_name = n;
  const realm = state.realms.find((r) => r.id === "player");
  if (realm) realm.name = n;
  return true;
}
