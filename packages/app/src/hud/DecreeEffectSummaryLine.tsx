import React from "react";
import {
  decreeEffectSummarySnapshot,
  type DecreeEffectSummary,
  type GameState,
} from "@second-crown/sim";
import "./decree-effect-summary.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `decreeEffectSummarySnapshot(state)`.
 * Returns `null` with no player court, `living_decree_effects` off, or partial state.
 */
export function resolveDecreeEffectSummary(
  state: GameState | null | undefined,
): DecreeEffectSummary | null {
  if (
    !state?.flags ||
    !state.meta ||
    !state.resources ||
    !Array.isArray(state.characters)
  ) {
    return null;
  }
  try {
    return decreeEffectSummarySnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Quiet sub-line under `<CourtDetailLine>` listing running decrees' plain-word effects
 * and royal decree suggestion from `decreeEffectSummarySnapshot(state)`. Hides cleanly when null.
 */
export const DecreeEffectSummaryLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveDecreeEffectSummary(state);
  if (!snap || (snap.active.length === 0 && !snap.suggestion)) return null;

  return (
    <div
      className="sc-decree-effects-line"
      data-decree-effects-active={snap.active.length}
      data-decree-effects-open={snap.openSlots}
    >
      <span className="sc-decree-effects-pip" aria-hidden="true" />
      {snap.active.map((d) => (
        <span
          key={d.id}
          className="sc-decree-effect-item"
          data-effect-decree={d.id}
        >
          <span className="sc-decree-effect-name">{d.name}:</span>
          <span className="sc-decree-effect-text">{d.effect}</span>
        </span>
      ))}
      {snap.suggestion ? (
        <span className="sc-decree-suggestion">{snap.suggestion}</span>
      ) : null}
    </div>
  );
};
