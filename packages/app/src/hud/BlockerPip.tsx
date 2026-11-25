import React from "react";
import "./blocker-deficit.css";
import { LIVING_BLOCKER_META, type LivingBlockerKind } from "./blockerAccents";

/** Calm non-blocking indicator for warehouse cap, missing prerequisite, or lectern busy blockers. */
export function BlockerPip(props: { kind: LivingBlockerKind; compact?: boolean; label?: string }) {
  const meta = LIVING_BLOCKER_META[props.kind];
  return (
    <span
      className={`sc-blocker-pip is-${props.kind}${props.compact ? " is-compact" : ""}`}
      data-blocker-pip={props.kind}
      data-blocker-shape={meta.shape}
      aria-hidden="true"
    >
      <svg className="sc-blocker-pip-icon" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        {props.kind === "warehouse" ? (
          <path
            d="M1.5 2.5h7M2.5 4.5h5v4h-5z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : props.kind === "prereq" ? (
          <>
            <path d="M5 1.5L8.2 5 5 8.5 1.8 5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="5" cy="5" r="1.1" fill="currentColor" />
          </>
        ) : (
          <path
            d="M2.2 1.8h5.6L5 5l2.8 3.2H2.2L5 5z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {props.compact ? null : <span className="sc-blocker-pip-label">{props.label ?? meta.label}</span>}
    </span>
  );
}
