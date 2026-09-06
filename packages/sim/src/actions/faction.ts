import type { Faction, GameState, InputRecord } from "@second-crown/shared";
import { unlock } from "../systems/wave.js";

export function tryFoundGuild(state: GameState, name = "Your Banner"): boolean {
  if (!Array.isArray(state.factions)) state.factions = [];
  if (state.factions.some((f) => f.leaderRealmId === "player")) return false;
  const faction: Faction = {
    id: `guild_player_${state.meta.tick}`,
    name,
    kind: "guild",
    leaderRealmId: "player",
    memberRealmIds: ["player"],
    stance: 50,
  };
  state.factions.push(faction);
  unlock(state, "ach_guild");
  state.inputLog.push({
    tick: state.meta.tick,
    type: "found_guild",
    payload: { name },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}

export function tryJoinFaction(state: GameState, factionId: string): boolean {
  if (!Array.isArray(state.factions)) return false;
  const f = state.factions.find((x) => x.id === factionId);
  if (!f) return false;
  if (f.memberRealmIds.includes("player")) return false;
  if (f.stance < -10) return false;
  f.memberRealmIds.push("player");
  f.stance = Math.min(100, f.stance + 8);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "join_faction",
    payload: { factionId },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}

export function tryLeaveFaction(state: GameState, factionId: string): boolean {
  const f = state.factions?.find((x) => x.id === factionId);
  if (!f || !f.memberRealmIds.includes("player")) return false;
  f.memberRealmIds = f.memberRealmIds.filter((id) => id !== "player");
  if (f.leaderRealmId === "player") f.leaderRealmId = null;
  f.stance = Math.max(-100, f.stance - 15);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "leave_faction",
    payload: { factionId },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}
