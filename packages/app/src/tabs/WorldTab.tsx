import React from "react";
import { tryFoundGuild, tryGiftGold, tryJoinFaction, tryLeaveFaction, type GameState, type WorldEvent } from "@second-crown/sim";
import { WorldPanel } from "../WorldPanel";
import type { ActFn } from "../game/useGameEngine";

export function WorldTab(props: {
  state: GameState | undefined;
  act: ActFn;
  worldLog: WorldEvent[];
}) {
  const { state, act, worldLog } = props;
  const worldEntries = [...worldLog].reverse();

  return (
    <>
      <h3>World Status</h3>
      <p style={{ fontSize: 13, opacity: 0.7 }}>Chronicle of other crowns, wars, and musters.</p>
      <ul style={{ fontSize: 13 }}>
        {worldEntries.length === 0 && <li>The world is quiet — for now.</li>}
        {worldEntries.map((e, i) => (
          <li key={`${e.tick}-${e.id}-${i}`}>Tick {e.tick}: {e.text}</li>
        ))}
      </ul>
      <WorldPanel
        state={state}
        onFoundGuild={() => act((st) => (tryFoundGuild(st) ? "Guild founded." : "You already lead a guild."))}
        onJoin={(id) => act((st) => (tryJoinFaction(st, id) ? "Joined the faction." : "Cannot join."))}
        onLeave={(id) => act((st) => (tryLeaveFaction(st, id) ? "Left the faction." : "Not a member."))}
        onGift={(id) => act((st) => (tryGiftGold(st, 15, id) ? "Gift sent." : "Need 15 gold."))}
      />
    </>
  );
}
