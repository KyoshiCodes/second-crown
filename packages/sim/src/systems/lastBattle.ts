import type { GameState } from "@second-crown/shared";
import type { BattleEvent } from "./resolver.js";
import type { BattlePhase } from "./combat.js";

export interface LastBattleStory {
  winnerId: string;
  loserId: string;
  events: BattleEvent[];
  phases: BattlePhase[];
}

export function lastBattleStory(state: GameState): LastBattleStory | null {
  const raw = state.flags.last_battle_json;
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw) as LastBattleStory;
    if (!parsed || !Array.isArray(parsed.events)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLastBattle(state: GameState, story: LastBattleStory): void {
  state.flags.last_battle_json = JSON.stringify({
    winnerId: story.winnerId,
    loserId: story.loserId,
    events: (story.events ?? []).slice(0, 10),
    phases: (story.phases ?? []).slice(0, 6),
  });
}
