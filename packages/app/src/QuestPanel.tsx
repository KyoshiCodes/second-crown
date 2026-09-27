import React from "react";
import { listQuests, tryClaimQuest, type GameState } from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { QuestCard } from "./hud/QuestCard";

export function QuestPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const rows = state ? listQuests(state) : [];
  return (
    <div className="sc-realm-card" style={{ margin: "12px 0" }}>
      <h3 style={{ marginTop: 0 }}>Quests</h3>
      <div className="sc-quest-grid">
        {rows.map((row) => (
          <QuestCard
            key={row.def.id}
            id={row.def.id}
            name={row.def.name}
            hint={row.def.hint}
            gold={row.def.gold}
            complete={row.complete}
            claimed={row.claimed}
            onClaim={() => act((st) => (tryClaimQuest(st, row.def.id) ? `Claimed ${row.def.name} (+${row.def.gold} gold).` : "Not ready."))}
          />
        ))}
      </div>
    </div>
  );
}
