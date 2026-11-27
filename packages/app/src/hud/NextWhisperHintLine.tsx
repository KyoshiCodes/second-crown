import React from "react";
import {
  getCulture,
  nextWhisperHint,
  type GameState,
  type NextWhisperHint,
} from "@second-crown/sim";
import "./column-ranks-whisper-hint.css";
import "./voice-rank-accents.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `nextWhisperHint(state)`.
 * Returns `null` when whispers are off, no NPC realm exists, or state is partial.
 */
export function resolveNextWhisperHint(
  state: GameState | null | undefined,
): NextWhisperHint | null {
  if (!state?.meta || !state.flags || !Array.isArray(state.realms)) return null;
  return nextWhisperHint(state);
}

/** Formats `fromCulture` using `@second-crown/sim` culture display names, or `null` when absent. */
export function formatWhisperCultureTag(
  fromCulture: string | null | undefined,
): string | null {
  if (!fromCulture) return null;
  const label = getCulture(fromCulture)?.name;
  return label || fromCulture;
}

/**
 * Quiet World tab timing hint reading `nextWhisperHint(state)`:
 * `"Next whisper in ~Ns · from <culture>"` when `fromCulture` is present,
 * omitting the `from` tag when `fromCulture` is null and hiding when the hint is null.
 */
export const NextWhisperHintLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const hint = resolveNextWhisperHint(state);
  if (!hint) return null;

  const cultureLabel = formatWhisperCultureTag(hint.fromCulture);

  return (
    <p
      className="sc-next-whisper-hint"
      data-next-whisper-seconds={hint.secondsApprox}
      data-next-whisper-tick={hint.nextPulseTick}
      data-from-culture={hint.fromCulture ?? undefined}
    >
      <span className="sc-next-whisper-pip" aria-hidden="true" />
      <span>Next whisper in ~{hint.secondsApprox}s</span>
      {cultureLabel ? (
        <span className="sc-next-whisper-from" data-from-tag="true">
          <span className="sc-next-whisper-sep" aria-hidden="true"> · </span>
          from <span className="sc-next-whisper-culture">{cultureLabel}</span>
        </span>
      ) : null}
    </p>
  );
};
