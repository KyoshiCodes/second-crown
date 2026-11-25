import React from "react";
import { RESEARCH, keepLevel, researchDone, type GameState } from "@second-crown/sim";
import {
  exactSeconds,
  formatHorizon,
  horizonBracket,
  isLongHorizon,
  isPaceBreathing,
  paceStage,
  unitTierLabel,
  unitTierRank,
  unitTierShape,
  type PaceStage,
} from "./horizon";
import "./horizon.css";
import "./horizon-living.css";

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

/** Miniature living tier crest whose shape and tint shift across unit Tiers I–V. */
export function UnitTierPip(props: { tier?: number }) {
  const rank = unitTierRank(props.tier);
  const shape = unitTierShape(props.tier);
  return (
    <span
      className={`sc-horizon-tier-pip tier-${rank} shape-${shape}`}
      data-tier-rank={rank}
      data-tier-shape={shape}
      aria-hidden="true"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" focusable="false">
        {rank === 1 ? (
          <circle cx="6" cy="6" r="3.4" fill="currentColor" />
        ) : rank === 2 ? (
          <polygon points="6,1.5 10.5,8.5 8.2,8.5 6,5.1 3.8,8.5 1.5,8.5" fill="currentColor" />
        ) : rank === 3 ? (
          <polygon points="6,1 11,6 6,11 1,6" fill="currentColor" />
        ) : rank === 4 ? (
          <polygon points="6,0.8 7.5,4.5 11.2,6 7.5,7.5 6,11.2 4.5,7.5 0.8,6 4.5,4.5" fill="currentColor" />
        ) : (
          <path d="M1.5 9.5L2.4 3.8L4.8 6.2L6 2.2L7.2 6.2L9.6 3.8L10.5 9.5H1.5Z" fill="currentColor" />
        )}
      </svg>
    </span>
  );
}

/** Tier label plus an optional higher-bracket note, for unit cards. */
export function UnitTierNote(props: { tier?: number; note?: string | null }) {
  const { tier, note } = props;
  if (tier === undefined && !note) return null;
  const rank = unitTierRank(tier);
  return (
    <span className={`sc-horizon-unit${note ? " is-higher" : ""}`} data-unit-tier={tier ?? ""}>
      {tier !== undefined ? (
        <span className={`sc-horizon-tier tier-${rank}`}>
          <UnitTierPip tier={tier} />
          {unitTierLabel(tier)}
        </span>
      ) : null}
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
  const breathing = isPaceBreathing(p.stage);
  return (
    <p
      className={`sc-horizon-pace is-${p.stage}${breathing ? " is-pace-breathing" : ""}`}
      data-pace={p.stage}
      data-pace-breathing={breathing ? "true" : undefined}
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
