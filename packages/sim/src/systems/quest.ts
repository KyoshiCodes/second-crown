import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";

export const QUESTS = [
  {
    id: "raise_chapel",
    name: "Raise a chapel",
    hint: "Place a Chapel on the map.",
    gold: 20,
    done: (s: GameState) => countBuilding(s, "chapel") > 0,
  },
  {
    id: "first_scout",
    name: "Ride scouts",
    hint: "Pay 10 gold to scout any other crown.",
    gold: 15,
    done: (s: GameState) => Object.keys(s.flags).some((k) => k.startsWith("scout_") && s.flags[k]),
  },
  {
    id: "first_victory",
    name: "Win a field",
    hint: "Win any war.",
    gold: 25,
    done: (s: GameState) => Number(s.flags.spoils_iron ?? 0) + Number(s.flags.spoils_banners ?? 0) > 0,
  },
] as const;

export function listQuests(state: GameState) {
  return QUESTS.map((q) => ({
    def: q,
    complete: q.done(state),
    claimed: Boolean(state.flags[`quest_${q.id}`]),
  }));
}

export function tryClaimQuest(state: GameState, id: string): boolean {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) return false;
  if (!q.done(state)) return false;
  if (state.flags[`quest_${id}`]) return false;
  state.flags[`quest_${id}`] = 1;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").add(q.gold));
  return true;
}
