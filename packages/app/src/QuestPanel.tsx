import React from "react";
import { listQuests, tryClaimQuest, type GameState } from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function QuestPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const rows = state ? listQuests(state) : [];
  return (
    <div className="sc-realm-card" style={{ margin: "12px 0" }}>
      <h3 style={{ marginTop: 0 }}>Quests</h3>
      {rows.map((row) => (
        <div key={row.def.id} style={{ marginBottom: 8, fontSize: 13 }}>
          <div>
            {row.claimed ? "[x]" : row.complete ? "[!]" : "[ ]"} {row.def.name} — {row.def.hint}
          </div>
          <button
            type="button"
            disabled={!row.complete || row.claimed}
            onClick={() => act((st) => (tryClaimQuest(st, row.def.id) ? `Claimed ${row.def.name} (+${row.def.gold} gold).` : "Not ready."))}
          >
            {row.claimed ? "Claimed" : `Claim ${row.def.gold} gold`}
          </button>
        </div>
      ))}
    </div>
  );
}
