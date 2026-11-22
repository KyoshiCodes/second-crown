import React from "react";
import { formatLetterSuffix, type GameState } from "@second-crown/sim";
import { AgeGlyphPip } from "../AgeLine";
import { prestigeStatus } from "../PrestigeLine";
import { YIELD_PCT_PER_PRODUCTION, prestigeRank } from "./PrestigeRankLine";
import "./age-status-line.css";

/**
 * The realm's age is its Dawn count (`flags.prestige_level`). This line adds no age math: progress
 * comes from `prestigeStatus` (the sim's `ascendThreshold` and `canAscend`), and the bonuses come
 * from `prestigeRank` (one production point per dawn, the sworn doctrine). Same figures as the
 * Age line with the Ascend button and the Prestige line; this one puts all three in one place.
 */

export interface AgeStatus {
  /** "waiting": building toward the next dawn. "ready": the sim's canAscend. "shared": no Second Dawn. */
  kind: "waiting" | "ready" | "shared";
  dawn: number;
  /** "Dawn 2". */
  ageText: string;
  /** 0..100, from prestigeStatus. Reads 100 only when the sim says ready. */
  percent: number;
  /** "42% · 12.6K of 30K total resources toward Dawn 1". */
  progressText: string;
  /** Each bonus the current age grants, e.g. "+2 production on every finished building (+8% yield)". */
  bonuses: string[];
  /** The bonuses joined, or "No age bonus yet" at Dawn 0. */
  bonusText: string;
  /** The whole line as plain text, for labels and tests. */
  text: string;
}

export function ageStatus(state: GameState): AgeStatus {
  const s = prestigeStatus(state);
  const r = prestigeRank(state);
  const dawn = r.dawn;
  const kind: AgeStatus["kind"] = s.shared ? "shared" : s.ready ? "ready" : "waiting";

  const progressText =
    kind === "shared"
      ? "A shared hold has no Second Dawn"
      : kind === "ready"
        ? `Ready for Dawn ${dawn + 1}: ascend from the Age line or the Crown tab`
        : `${s.percent}% · ${formatLetterSuffix(s.have)} of ${formatLetterSuffix(s.need)} total resources toward Dawn ${dawn + 1}`;

  const bonuses: string[] = [];
  if (r.production > 0) {
    bonuses.push(`+${r.production} production on every finished building (+${r.production * YIELD_PCT_PER_PRODUCTION}% yield)`);
  }
  if (dawn >= 1) {
    bonuses.push(r.doctrine ? `${r.doctrine.name}: ${r.doctrine.blurb}` : "a doctrine to swear (Crown tab)");
  }
  const bonusText = bonuses.length > 0 ? bonuses.join(" · ") : "No age bonus yet";
  const ageText = `Dawn ${dawn}`;

  return {
    kind,
    dawn,
    ageText,
    percent: kind === "shared" ? 0 : s.percent,
    progressText,
    bonuses,
    bonusText,
    text: `Age · ${ageText} · ${progressText} · Grants: ${bonusText}`,
  };
}

/**
 * Read-only age status line for the Kingdom tab and the province inspect card: the current age,
 * progress to the next, and what the current age grants. No button; ascending stays on the Age
 * line and the Crown tab.
 */
export function AgeStatusLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const a = ageStatus(state);
  return (
    <div
      className={`sc-age-status-line is-${a.kind}`}
      data-age-status={a.kind}
      data-dawn={a.dawn}
      data-age-progress={a.percent}
      aria-label={a.text}
    >
      <AgeGlyphPip
        dawn={a.dawn}
        ready={a.kind === "ready"}
        shared={a.kind === "shared"}
        size={14}
        className="sc-age-status-icon"
      />
      <span className="sc-age-status-text">
        <span className="sc-age-status-label">Age</span> · <strong>{a.ageText}</strong> ·{" "}
        <span className="sc-age-status-progress">{a.progressText}</span>
        {a.kind === "waiting" ? (
          <span className="sc-age-status-bar" aria-hidden="true">
            <span className="sc-age-status-fill" style={{ width: `${a.percent}%` }} />
          </span>
        ) : null}{" "}
        · <span className="sc-age-status-label">Grants:</span>{" "}
        <span className={`sc-age-status-bonus${a.bonuses.length > 0 ? " is-active" : ""}`}>{a.bonusText}</span>
      </span>
    </div>
  );
}
