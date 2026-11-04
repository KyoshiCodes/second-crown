import React from "react";
import { CULTURES, getCulture, playerCultureId, setPlayerCulture, type GameState } from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { rememberCulture } from "./CulturePicker";
import { CultureCrestPip } from "./hud/CultureCrestPip";
import "./culture-line.css";

/** The culture after the current one in table order, wrapping. Read-only; no new rules. */
export function nextCultureId(state: GameState): string {
  const current = playerCultureId(state);
  const i = CULTURES.findIndex((c) => c.id === current);
  return CULTURES[(i + 1) % CULTURES.length].id;
}

/** Small Kingdom-tab line: current culture plus one button to switch to the next. Uses setPlayerCulture as-is. */
export function CultureLine(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const current = getCulture(playerCultureId(state));
  const next = getCulture(nextCultureId(state));
  if (!current || !next) return null;
  return (
    <p className="sc-culture-line-row" data-culture={current.id}>
      <CultureCrestPip cultureId={current.id} size={16} isSelected />
      <span>
        Culture · <strong>{current.name}</strong> · next {next.name}.
      </span>
      <button
        type="button"
        className="sc-culture-line-btn"
        data-next-culture={next.id}
        title={next.blurb}
        onClick={() =>
          act((s) => {
            if (!setPlayerCulture(s, next.id)) return "Unknown culture.";
            rememberCulture(next.id);
            return `Your host walks as ${next.name}.`;
          })
        }
      >
        Switch to {next.name}
      </button>
    </p>
  );
}
