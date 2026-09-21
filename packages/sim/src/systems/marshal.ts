import type { CharacterInstance, GameState, MarshalTree } from "@second-crown/shared";
import type { Stack } from "./resolver.js";

export const MARSHAL_TREES: readonly MarshalTree[] = ["line", "shock", "ranged"];

export function playerMarshal(state: GameState): CharacterInstance | undefined {
  return state.characters.find(
    (c) => c.realmId === "player" && c.marshalTree && MARSHAL_TREES.includes(c.marshalTree)
  );
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

/** Rank 1: Line Hold, Shock Charge, Ranged Volley. */
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
      s.morale = Math.min(110, s.morale + 5 * rank);
    }
    if (tree === "shock" && s.role === "shock") {
      s.attack = s.attack * (1 + 0.1 * rank);
    }
    if (tree === "ranged" && s.role === "ranged") {
      s.attack = s.attack * (1 + 0.1 * rank);
    }
  }
  return stacks;
}
