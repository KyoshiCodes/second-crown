import React from "react";
import {
  lastWhisperSummary,
  type GameState,
  type LastWhisperSummary,
} from "@second-crown/sim";
import { formatWhisperSenderTag } from "./NextWhisperHintLine";
import "./last-whisper-summary.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `lastWhisperSummary(state)`.
 * Returns `null` when no whisper has been sent to the player yet or state is partial.
 */
export function resolveLastWhisperSummary(
  state: GameState | null | undefined,
): LastWhisperSummary | null {
  if (!state?.flags || !Array.isArray(state.realms)) return null;
  return lastWhisperSummary(state);
}

/**
 * Quiet World tab summary line sitting directly under `NextWhisperHintLine`:
 * `"Last whisper from <realm> (<culture>)"` (realm + culture only, single line),
 * hiding cleanly when `lastWhisperSummary(state)` is `null`.
 */
export const LastWhisperSummaryLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const summary = resolveLastWhisperSummary(state);
  if (!summary) return null;

  const sender = formatWhisperSenderTag(summary.fromName, summary.fromCulture);

  return (
    <p
      className="sc-last-whisper-summary"
      data-last-whisper-tick={summary.tick}
      data-last-whisper-realm={sender.realmName ?? summary.fromRealmId}
      data-last-whisper-culture={summary.fromCulture}
    >
      <span className="sc-last-whisper-pip" aria-hidden="true" />
      <span className="sc-last-whisper-lead">Last whisper from</span>
      {sender.realmName && sender.cultureLabel ? (
        <>
          {" "}
          <span className="sc-last-whisper-realm">{sender.realmName}</span>{" "}
          <span className="sc-last-whisper-paren">
            (<span className="sc-last-whisper-culture">{sender.cultureLabel}</span>)
          </span>
        </>
      ) : sender.realmName ? (
        <>
          {" "}
          <span className="sc-last-whisper-realm">{sender.realmName}</span>
        </>
      ) : (
        <>
          {" "}
          <span className="sc-last-whisper-culture">
            {sender.cultureLabel ?? summary.fromRealmId}
          </span>
        </>
      )}
    </p>
  );
};
