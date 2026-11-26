import React from "react";
import { getUnitType, unitPayoffNote } from "@second-crown/sim";
import "./raid-payoff-accents.css";

export type ElitePayoffKind = "shock" | "heavy" | "wall-ignore" | "vanguard";
export type ElitePayoffShape = "lance" | "shield" | "ram" | "star";

export interface ElitePayoffBadge {
  kind: ElitePayoffKind;
  label: string;
  shape: ElitePayoffShape;
}

/** Classifies units that have a sim payoff note (`unitPayoffNote`) into a quiet non-blocking role crest. */
export function resolveElitePayoffBadge(typeId: string): ElitePayoffBadge | null {
  if (!unitPayoffNote(typeId)) return null;
  const def = getUnitType(typeId);
  if (typeId === "siege" || def?.role === "siege") {
    return { kind: "wall-ignore", label: "Wall-breaker", shape: "ram" };
  }
  if (typeId === "knight") {
    return { kind: "heavy", label: "Heavy", shape: "shield" };
  }
  if (typeId === "cavalry" || def?.role === "shock") {
    return { kind: "shock", label: "Shock", shape: "lance" };
  }
  return { kind: "vanguard", label: "Elite", shape: "star" };
}

/** Phrasing-only payoff role pip mounted beside the sim unit payoff note inside `<button>` UnitCard. */
export function ElitePayoffPip(props: { badge: ElitePayoffBadge; locked?: boolean }) {
  const { badge, locked } = props;
  return (
    <span
      className={`sc-payoff-pip is-${badge.kind}${locked ? " is-locked" : ""}`}
      data-payoff-pip={badge.kind}
      data-payoff-shape={badge.shape}
      aria-hidden="true"
    >
      <svg className="sc-payoff-pip-icon" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        {badge.shape === "ram" ? (
          <path
            d="M1.5 6.8h4.8l1.7-1.8-1.7-1.8H1.5v3.6zm6.7-4.5v5.4"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : badge.shape === "shield" ? (
          <path
            d="M2.2 2h5.6v3.2c0 1.6-1.2 2.8-2.8 3.3C3.4 8 2.2 6.8 2.2 5.2V2z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        ) : badge.shape === "lance" ? (
          <path
            d="M2 7.8L7.8 2M5 2h2.8v2.8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M5 1.5l1.1 2.3 2.4.3-1.7 1.7.4 2.4L5 7l-2.2 1.2.4-2.4-1.7-1.7 2.4-.3z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <span className="sc-payoff-pip-label">{badge.label}</span>
    </span>
  );
}
