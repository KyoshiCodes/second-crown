import type { GameState } from "@second-crown/shared";
import { createRngStreams } from "../core/rng.js";
import { takeForce, returnForce } from "./column.js";
import { resolveColumnClash } from "./engagement.js";
import { incomingOnHome } from "./raidMarch.js";
import { listMarches } from "./march.js";
import { recordCrown } from "./ledger.js";

const SALLY = 5;

export function canSally(state: GameState): boolean {
  if (incomingOnHome(state).length === 0) return false;
  const u = state.units.find((x) => x.realmId === "player" && x.typeId === "militia");
  return !!u && Number(u.count) >= SALLY;
}

export function trySally(state: GameState): boolean {
  const incoming = incomingOnHome(state)[0];
  if (!incoming) return false;
  const force = { militia: SALLY };
  if (!takeForce(state, force)) return false;
  const rng = createRngStreams(state.meta.seed + state.meta.tick + 17);
  const atk = { realmId: "player", levy: SALLY, force };
  const def = {
    realmId: incoming.realmId,
    levy: incoming.levy,
    force: incoming.force ?? { militia: Math.max(1, incoming.levy) },
  };
  const result = resolveColumnClash(state, atk, def, rng);
  if (result.attackerWins) {
    const left = listMarches(state).filter((m) => m.id !== incoming.id);
    state.flags.marches_json = JSON.stringify(left);
    if (atk.force) returnForce(state, atk.force, 1);
    recordCrown(state, "march", "Sally drove the column off.");
    state.inputLog.push({ tick: state.meta.tick, type: "sally", payload: { vs: incoming.realmId, won: true } });
    return true;
  }
  if (atk.force) returnForce(state, atk.force, 0.4);
  recordCrown(state, "march", "Sally broken. The column still comes.");
  state.inputLog.push({ tick: state.meta.tick, type: "sally", payload: { vs: incoming.realmId, won: false } });
  return true;
}
