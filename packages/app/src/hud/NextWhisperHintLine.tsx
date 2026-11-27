import React from "react";
import {
  getCulture,
  nextWhisperHint,
  type GameState,
  type NextWhisperHint,
} from "@second-crown/sim";
import "./column-ranks-whisper-hint.css";
import "./voice-rank-accents.css";
import "./realm-tag-ranks-note.css";

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

export interface WhisperSenderTag {
  realmName: string | null;
  cultureLabel: string | null;
  text: string | null;
}

/**
 * Formats `"<realm> (<culture>)"` when both `fromName` and `fromCulture` are present,
 * falling back cleanly to whichever part is non-null, or `null` when both are absent.
 */
export function formatWhisperSenderTag(
  fromName: string | null | undefined,
  fromCulture: string | null | undefined,
): WhisperSenderTag {
  const realmName = fromName?.trim() || null;
  const cultureLabel = formatWhisperCultureTag(fromCulture);

  let text: string | null = null;
  if (realmName && cultureLabel) {
    text = `${realmName} (${cultureLabel})`;
  } else if (realmName) {
    text = realmName;
  } else if (cultureLabel) {
    text = cultureLabel;
  }

  return { realmName, cultureLabel, text };
}

/**
 * Quiet World tab timing hint reading `nextWhisperHint(state)`:
 * `"Next whisper in ~Ns · from <realm> (<culture>)"` when both `fromName` and `fromCulture`
 * are present, falling back cleanly when either is null and hiding when the hint is null.
 */
export const NextWhisperHintLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const hint = resolveNextWhisperHint(state);
  if (!hint) return null;

  const sender = formatWhisperSenderTag(hint.fromName, hint.fromCulture);

  return (
    <p
      className="sc-next-whisper-hint"
      data-next-whisper-seconds={hint.secondsApprox}
      data-next-whisper-tick={hint.nextPulseTick}
      data-from-realm={sender.realmName ?? undefined}
      data-from-culture={hint.fromCulture ?? undefined}
    >
      <span className="sc-next-whisper-pip" aria-hidden="true" />
      <span>Next whisper in ~{hint.secondsApprox}s</span>
      {sender.text ? (
        <span className="sc-next-whisper-from" data-from-tag="true">
          <span className="sc-next-whisper-sep" aria-hidden="true"> · </span>
          from{" "}
          {sender.realmName && sender.cultureLabel ? (
            <>
              <span className="sc-next-whisper-realm">{sender.realmName}</span>{" "}
              <span className="sc-next-whisper-paren">
                (<span className="sc-next-whisper-culture">{sender.cultureLabel}</span>)
              </span>
            </>
          ) : sender.realmName ? (
            <span className="sc-next-whisper-realm">{sender.realmName}</span>
          ) : (
            <span className="sc-next-whisper-culture">{sender.cultureLabel}</span>
          )}
        </span>
      ) : null}
    </p>
  );
};
