import React from "react";
import { isTrainedUnit, type GameState } from "@second-crown/sim";
import { starvationNote, type StarvationNote, type StarvationState } from "../projection";
import "./starvation-accents.css";

/**
 * Resolves whether an Army tab unit card currently faces trained-troop
 * starvation risk. Pure view projection over sim's `isTrainedUnit` and home post count.
 */
export function resolveUnitStarveRisk(
  starveState: StarvationState | null,
  typeId: string,
  homeCount: number,
): StarvationState | null {
  if (!starveState) return null;
  if (!isTrainedUnit(typeId) || homeCount <= 0) return null;
  return starveState;
}

/**
 * Phrasing-only unit starvation pip safe inside `<button>` (`UnitCard`).
 * Shows a compact 9x9 emblem + "At risk" (imminent) or "Shedding" (active).
 */
export function UnitStarvePip(props: { state: StarvationState }) {
  const { state } = props;
  const label = state === "starving" ? "Shedding" : "At risk";
  return (
    <span
      className={`sc-unit-starve-pip is-${state}`}
      data-unit-starve-pip={state}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 12 12"
        width={9}
        height={9}
        className="sc-unit-starve-icon"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <path
          d="M6 1.5 L10.5 9.8 L1.5 9.8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <line x1="6" y1="4.4" x2="6" y2="7.2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="6" cy="8.6" r="0.65" fill="currentColor" />
      </svg>
      <span className="sc-unit-starve-label">{label}</span>
    </span>
  );
}

/**
 * Calm Army tab notice bar reading `starvationNote` without inventing sim facts.
 */
export function ArmyStarvationNotice(props: {
  state?: GameState;
  noteOverride?: StarvationNote | null;
}) {
  const note =
    props.noteOverride !== undefined
      ? props.noteOverride
      : props.state
        ? starvationNote(props.state)
        : null;
  if (!note) return null;

  const badge = note.state === "starving" ? "Starving" : "Hunger soon";
  return (
    <p
      className={`sc-army-starve-notice is-${note.state}`}
      data-army-starve={note.state}
      role="status"
    >
      <svg
        viewBox="0 0 14 14"
        width={13}
        height={13}
        className="sc-army-starve-emblem"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <path
          d="M7 1.5 L12.2 11.4 L1.8 11.4 Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <line x1="7" y1="5" x2="7" y2="8.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7" cy="9.9" r="0.75" fill="currentColor" />
      </svg>
      <span className="sc-army-starve-badge">{badge}</span>
      <span>{note.text}.</span>
    </p>
  );
}
