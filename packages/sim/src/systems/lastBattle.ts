import type { GameState } from "@second-crown/shared";
import type { BattleEvent } from "./resolver.js";
import type { BattlePhase } from "./combat.js";

/** Slice 25: one side of the clash as it stood at muster, with its losses. Record only; no math reads it. */
export interface ClashForceRecord {
  side: "attacker" | "defender";
  realmId: string;
  /** Power at muster (the same figure the battle used). */
  strength: number;
  /** Men lost in this clash. */
  casualties: number;
}

export interface LastBattleStory {
  winnerId: string;
  loserId: string;
  events: BattleEvent[];
  phases: BattlePhase[];
  /** Slice 25: optional; absent on battles stored before slice 25. */
  forces?: ClashForceRecord[];
  /** Slice 27: optional tile the battle was fought on. Record only; no math reads it. Absent on older battles and realm-level fights. */
  provinceId?: string;
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
    ...(story.forces ? { forces: story.forces.slice(0, 4) } : {}),
    ...(story.provinceId ? { provinceId: story.provinceId } : {}),
  });
}
