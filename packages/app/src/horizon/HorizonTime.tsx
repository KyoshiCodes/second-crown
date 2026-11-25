import React from "react";
import { RESEARCH, keepLevel, researchDone, type GameState } from "@second-crown/sim";
import {
  exactSeconds,
  formatHorizon,
  horizonBracket,
  isLongHorizon,
  paceStage,
  unitTierLabel,
  type PaceStage,
} from "./horizon";
import "./horizon.css";

/** A duration in long form ("3h 20m"). Tooltip carries the exact seconds. */
export function HorizonTime(props: { seconds: number; suffix?: string; className?: string }) {
  const { seconds, suffix, className } = props;
  const bracket = horizonBracket(seconds);
  return (
    <span
      className={`sc-horizon-time is-${bracket}${className ? ` ${className}` : ""}`}
      data-horizon={bracket}
      title={exactSeconds(seconds)}
    >
      {formatHorizon(seconds)}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}

/** Small "hours" / "days" pill, shown only when a wait is an hour or longer. */
export function HorizonBadge(props: { seconds: number }) {
  const { seconds } = props;
  if (!isLongHorizon(seconds)) return null;
  const bracket = horizonBracket(seconds);
  return (
    <span className={`sc-horizon-badge is-${bracket}`} data-horizon={bracket} title={exactSeconds(seconds)}>
      <span className="sc-horizon-badge-glass" aria-hidden="true" />
      {bracket}
    </span>
  );
}

/** Tier label plus an optional higher-bracket note, for unit cards. */
export function UnitTierNote(props: { tier?: number; note?: string | null }) {
  const { tier, note } = props;
  if (tier === undefined && !note) return null;
  return (
    <span className={`sc-horizon-unit${note ? " is-higher" : ""}`} data-unit-tier={tier ?? ""}>
      {tier !== undefined ? <span className="sc-horizon-tier">{unitTierLabel(tier)}</span> : null}
      {note ? <span className="sc-horizon-note">{note}</span> : null}
    </span>
  );
}

export interface PaceSummary {
  stage: PaceStage;
  keep: number;
  known: number;
  total: number;
}

/** Reads Keep level and known studies. Display only. */
export function summarizePace(state: GameState): PaceSummary {
  const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
  const known = ids.filter((id) => researchDone(state, id)).length;
  const keep = keepLevel(state);
  return { stage: paceStage({ keep, known, total: ids.length }), keep, known, total: ids.length };
}

const KEEP_ROMAN = ["none", "I", "II", "III", "IV", "V"];

/** "Current pace: early · Keep I · 2 of 16 studies known" */
export function PaceLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const p = summarizePace(state);
  const keepText = p.keep > 0 ? `Keep ${KEEP_ROMAN[p.keep] ?? p.keep}` : "No keep";
  return (
    <p
      className={`sc-horizon-pace is-${p.stage}`}
      data-pace={p.stage}
      title="Early: Keep I or lower and under a third of studies known. Late: Keep IV+ or two thirds of studies known. Mid: between."
    >
      <span className="sc-horizon-pace-pips" aria-hidden="true">
        <span className="sc-horizon-pace-pip is-on" />
        <span className={`sc-horizon-pace-pip${p.stage !== "early" ? " is-on" : ""}`} />
        <span className={`sc-horizon-pace-pip${p.stage === "late" ? " is-on" : ""}`} />
      </span>
      Current pace: <strong>{p.stage}</strong> · {keepText} · {p.known} of {p.total} studies known
    </p>
  );
}
