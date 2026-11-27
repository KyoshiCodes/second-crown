import React from "react";
import {
  CLASH_OUTCOME_LOST,
  CLASH_OUTCOME_WON,
  clashResultSnapshot,
  type ClashResult,
  type GameState,
  type LastBattleStory,
} from "@second-crown/sim";
import { ClashPip } from "./ClashPip";
import "./clash-result.css";

/**
 * Pure wrapper around `clashResultSnapshot(state)` with safe state guards so
 * partial test fixtures never throw and callers can hide completely on `null`.
 */
export function resolveClashResult(
  state: GameState | null | undefined,
): ClashResult | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.realms)) return null;
  return clashResultSnapshot(state);
}

/**
 * Calm clash result panel for `WarRoom` displaying forces, muster strengths,
 * casualties, outcome, and note from `clashResultSnapshot`. Hides completely when `null`.
 */
export const ClashResultPanel: React.FC<{
  state: GameState | null | undefined;
  story?: LastBattleStory | null;
  report?: string;
}> = ({ state, story, report }) => {
  const snap = resolveClashResult(state);
  if (!snap) return null;

  const tone =
    snap.outcome === CLASH_OUTCOME_WON
      ? "won"
      : snap.outcome === CLASH_OUTCOME_LOST
        ? "lost"
        : "other";
  const pipVariant = tone === "lost" ? "broken_shield" : "crossed_blades";

  return (
    <section
      className={`sc-realm-card sc-clash-result is-${tone}`}
      data-clash-outcome={snap.outcome}
      role="status"
    >
      <div className="sc-clash-result-head">
        <span className="sc-clash-result-title-group">
          <ClashPip variant={pipVariant} size={24} />
          <strong className="sc-clash-result-title">Last clash</strong>
        </span>
        <span className="sc-clash-result-outcome">
          <span className="sc-clash-result-pip" aria-hidden="true" />
          {snap.outcome}
        </span>
      </div>

      {snap.forces.length > 0 ? (
        <div className="sc-clash-result-forces">
          {snap.forces.map((f, idx) => (
            <div
              key={`${f.side}-${f.name}-${idx}`}
              className={`sc-clash-result-force is-${f.side}`}
              data-clash-side={f.side}
              data-clash-strength={f.strength}
              data-clash-casualties={f.casualties}
            >
              <span className="sc-clash-result-force-who">
                <span className="sc-clash-result-side">
                  {f.side === "attacker" ? "Attacker" : "Defender"}
                </span>
                <span className="sc-clash-result-realm">{f.name}</span>
              </span>
              <span className="sc-clash-result-stats">
                <span className="sc-clash-result-strength">pwr {f.strength}</span>
                <span className="sc-clash-result-losses">
                  {f.casualties} {f.casualties === 1 ? "loss" : "losses"}
                </span>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {snap.note ? (
        <div className="sc-clash-result-note">{snap.note}</div>
      ) : null}

      {report ? (
        <div className="sc-clash-result-report">{report}</div>
      ) : null}

      {story && story.events.length > 0 ? (
        <details className="sc-clash-result-log">
          <summary>Blow by blow ({Math.min(story.events.length, 8)})</summary>
          <ul>
            {story.events.slice(0, 8).map((ev, i) => (
              <li key={`${ev.round}-${i}`}>{ev.text}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
};
