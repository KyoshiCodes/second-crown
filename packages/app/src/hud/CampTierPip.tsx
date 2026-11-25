import React from "react";
import { campTierId } from "@second-crown/sim";
import "./camp-tier-accents.css";

export type CampTierId = NonNullable<ReturnType<typeof campTierId>>;

export interface CampTierVisual {
  tierId: CampTierId;
  tone: "safe" | "fair" | "hard";
  label: string;
  shape: "leaf" | "tent" | "palisade";
}

export const CAMP_TIER_VISUAL: Record<CampTierId, CampTierVisual> = {
  lean_to: { tierId: "lean_to", tone: "safe", label: "Safe", shape: "leaf" },
  camp: { tierId: "camp", tone: "fair", label: "Fair", shape: "tent" },
  stockade: { tierId: "stockade", tone: "hard", label: "Hard", shape: "palisade" },
};

/** Calm non-blocking badge distinguishing safe starter lean-tos, fair camps, and hard stockades. */
export function CampTierPip(props: { tierId: CampTierId; compact?: boolean }) {
  const vis = CAMP_TIER_VISUAL[props.tierId];
  return (
    <span
      className={`sc-camp-tier-pip is-${props.tierId} tone-${vis.tone}${props.compact ? " is-compact" : ""}`}
      data-camp-pip={props.tierId}
      data-camp-shape={vis.shape}
      aria-hidden="true"
    >
      <svg className="sc-camp-tier-pip-icon" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        {props.tierId === "lean_to" ? (
          <path
            d="M2.2 7.2C2.2 4.3 4.4 2.2 7.6 2.2c0 3.2-2.1 5.4-5 5.4z"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinejoin="round"
          />
        ) : props.tierId === "camp" ? (
          <path
            d="M5 1.8L8.4 8H1.6L5 1.8z"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M1.8 8.2V3.6l1.3-1.6v1.6h1.3V1.8L5.6 3.6v-.4h1.3V2l1.3 1.6v4.6H1.8z"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {props.compact ? null : <span className="sc-camp-tier-pip-label">{vis.label}</span>}
    </span>
  );
}
