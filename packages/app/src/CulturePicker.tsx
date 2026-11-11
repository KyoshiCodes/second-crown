import React from "react";
import { CULTURES, playerCultureId, setPlayerCulture, type GameState } from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { cultureLine } from "./cultureLines";
import { CultureCrestPip } from "./hud/CultureCrestPip";
import { CultureUnitChip } from "./hud/CultureUnitChip";
import "./hud/plain-buttons.css";
import "./hud/culture-picker.css";

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
        {CULTURES.map((c) => {
          const line = cultureLine(c.id);
          const isSelected = current === c.id;
          return (
          <button
            key={c.id}
            type="button"
            className={`sc-work-card sc-plain-pick ${isSelected ? "is-picked" : ""}`}
            style={{
              borderLeftColor: c.palette.tabard,
              outline: isSelected ? `2px solid ${c.palette.tabard}` : undefined,
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
            <span className="sc-work-head sc-culture-picker-head">
              <CultureCrestPip cultureId={c.id} isSelected={isSelected} />
              <span className="sc-work-name">{c.name}</span>
            </span>
            <span className="sc-culture-lines">
              <span className={`sc-culture-line ${line.unit ? "" : "is-plain"}`}>
                <span className="sc-culture-line-key">Unit:</span>
                <span className="sc-culture-line-val" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {line.unit ? (
                    <>
                      <CultureUnitChip cultureId={c.id} size={28} open={true} />
                      <span>{line.unit}</span>
                    </>
                  ) : (
                    <span>base roster</span>
                  )}
                </span>
              </span>
              <span className={`sc-culture-line ${line.difference ? "" : "is-plain"}`}>
                <span className="sc-culture-line-key">Edge:</span>
                <span className="sc-culture-line-val">{line.difference ?? "looks only"}</span>
              </span>
            </span>
            <span className="sc-work-status">{isSelected ? "Your style" : c.blurb}</span>
          </button>
          );
        })}
      </div>
    </div>
  );
}
