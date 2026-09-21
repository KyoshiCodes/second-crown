import type { CharacterInstance, GameState, MarshalTree } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { keepLevel } from "../actions/upgrade.js";
import type { Stack } from "./resolver.js";

export const MARSHAL_TREES: readonly MarshalTree[] = ["line", "shock", "ranged"];
export const MARSHAL_PROMOTE_GOLD = 80;
export const MARSHAL_MAX_RANK = 2;
export const MARSHAL_PROMOTE_KEEP = 2;

export function playerMarshal(state: GameState): CharacterInstance | undefined {
  return state.characters.find(
    (c) => c.realmId === "player" && c.marshalTree && MARSHAL_TREES.includes(c.marshalTree)
  );
}

export function canPromoteMarshal(state: GameState): boolean {
  const who = playerMarshal(state);
  if (!who) return false;
  const rank = Math.max(1, who.marshalRank ?? 1);
  if (rank >= MARSHAL_MAX_RANK) return false;
  if (keepLevel(state) < MARSHAL_PROMOTE_KEEP) return false;
  if (D(state.resources.gold ?? "0").lt(MARSHAL_PROMOTE_GOLD)) return false;
  return true;
}

export function tryAppointMarshal(
  state: GameState,
  characterId: string,
  tree: MarshalTree
): boolean {
  if (!MARSHAL_TREES.includes(tree)) return false;
  const who = state.characters.find((c) => c.id === characterId && c.realmId === "player");
  if (!who) return false;
  for (const c of state.characters) {
    if (c.realmId === "player") {
      c.marshalTree = null;
      c.marshalRank = 0;
    }
  }
  who.marshalTree = tree;
  who.marshalRank = Math.max(1, who.marshalRank ?? 1);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "appoint_marshal",
    issuerId: "player",
    payload: { characterId, tree },
  });
  return true;
}

export function tryPromoteMarshal(state: GameState): boolean {
  if (!canPromoteMarshal(state)) return false;
  const who = playerMarshal(state)!;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(MARSHAL_PROMOTE_GOLD));
  who.marshalRank = Math.max(1, who.marshalRank ?? 1) + 1;
  state.inputLog.push({
    tick: state.meta.tick,
    type: "promote_marshal",
    issuerId: "player",
    payload: { rank: who.marshalRank, tree: who.marshalTree },
  });
  return true;
}

/** Rank 1: Line Hold, Shock Charge, Ranged Volley. Rank 2 scales those and adds a small extra. */
export function applyMarshalBonuses(
  stacks: Stack[],
  marshal: CharacterInstance | undefined
): Stack[] {
  if (!marshal?.marshalTree) return stacks;
  const rank = Math.max(1, marshal.marshalRank ?? 1);
  const tree = marshal.marshalTree;
  for (const s of stacks) {
    if (tree === "line" && s.role === "line") {
      s.defense = s.defense * (1 + 0.1 * rank);
      s.morale = Math.min(110 + 10 * (rank - 1), s.morale + 5 * rank);
      if (rank >= 2) s.hpEach += 1;
    }
    if (tree === "shock" && s.role === "shock") {
      s.attack = s.attack * (1 + 0.1 * rank);
      if (rank >= 2) s.morale = Math.min(120, s.morale + 8);
    }
    if (tree === "ranged" && s.role === "ranged") {
      s.attack = s.attack * (1 + 0.1 * rank);
      if (rank >= 2) s.attack += 1;
    }
  }
  return stacks;
}
