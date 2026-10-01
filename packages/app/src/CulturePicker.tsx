import React from "react";
import { CULTURES, playerCultureId, setPlayerCulture, type GameState } from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import "./hud/plain-buttons.css";

export const CULTURE_KEY = "sc-culture";

export function rememberCulture(id: string): void {
  try {
    localStorage.setItem(CULTURE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function rememberedCulture(): string {
  try {
    return localStorage.getItem(CULTURE_KEY) || "western";
  } catch {
    return "western";
  }
}

export function CulturePicker(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const current = playerCultureId(state);
  return (
    <div style={{ margin: "8px 0", fontSize: 13 }}>
      <div style={{ opacity: 0.8, marginBottom: 6 }}>Crown style — New Game keeps this pick on this browser</div>
      <div className="sc-plain-grid">
        {CULTURES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`sc-work-card sc-plain-pick ${current === c.id ? "is-picked" : ""}`}
            style={{
              borderLeftColor: c.palette.tabard,
              outline: current === c.id ? `2px solid ${c.palette.tabard}` : undefined,
            }}
            title={c.blurb}
            onClick={() =>
              act((s) => {
                if (!setPlayerCulture(s, c.id)) return "Unknown culture.";
                rememberCulture(c.id);
                return `Your host walks as ${c.name}.`;
              })
            }
          >
            <span className="sc-work-head">
              <span className="sc-work-name">{c.name}</span>
            </span>
            <span className="sc-work-status">{current === c.id ? "Your style" : c.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
