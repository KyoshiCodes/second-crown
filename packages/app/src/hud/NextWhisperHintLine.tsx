import React from "react";
import {
  nextWhisperHint,
  type GameState,
  type NextWhisperHint,
} from "@second-crown/sim";
import "./column-ranks-whisper-hint.css";

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

/**
 * Quiet World tab timing hint reading `nextWhisperHint(state)` ("Next whisper in ~Ns").
 * Renders nothing when the hint is `null`.
 */
export const NextWhisperHintLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const hint = resolveNextWhisperHint(state);
  if (!hint) return null;

  return (
    <p
      className="sc-next-whisper-hint"
      data-next-whisper-seconds={hint.secondsApprox}
      data-next-whisper-tick={hint.nextPulseTick}
    >
      <span className="sc-next-whisper-pip" aria-hidden="true" />
      <span>Next whisper in ~{hint.secondsApprox}s</span>
    </p>
  );
};
