import React from "react";
import { CULTURES, playerCultureId, setPlayerCulture, type GameState } from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function CulturePicker(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const current = playerCultureId(state);
  return (
    <div style={{ margin: "8px 0", fontSize: 13 }}>
      <div style={{ opacity: 0.8, marginBottom: 6 }}>Crown style (New Game keeps this pick)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CULTURES.map((c) => (
          <button
            key={c.id}
            type="button"
            style={{
              borderColor: current === c.id ? c.palette.tabard : undefined,
              outline: current === c.id ? `2px solid ${c.palette.tabard}` : undefined,
            }}
            title={c.blurb}
            onClick={() => act((s) => (setPlayerCulture(s, c.id) ? `Your host walks as ${c.name}.` : "Unknown culture."))}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
