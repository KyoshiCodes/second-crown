import React from "react";
import "./away-dispatch.css";

export type AwaySpanTier = "brief" | "hours" | "days";

/** Classifies formatted elapsed return span ("45m", "3h 15m", "2d 4h") into a calm visual cadence. */
export function resolveAwaySpanTier(elapsed: string): AwaySpanTier {
  if (/\d+d/.test(elapsed)) return "days";
  if (/\d+h/.test(elapsed)) return "hours";
  return "brief";
}

/** Quiet non-blocking wax-and-hourglass seal indicating time passed before return. */
export function AwayReturnSeal(props: { elapsed: string }) {
  const tier = resolveAwaySpanTier(props.elapsed);
  return (
    <span className={`sc-away-seal is-${tier}`} data-away-seal={tier} aria-hidden="true">
      <span className="sc-away-seal-ring" />
      <svg className="sc-away-seal-svg" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1" opacity="0.68" />
        <circle
          cx="9"
          cy="9"
          r="5.5"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeDasharray="1.6 1.4"
          opacity="0.48"
        />
        <path
          d="M6.2 5.4h5.6L9 9l2.8 3.6H6.2L9 9z"
          stroke="currentColor"
          strokeWidth="1.05"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="11.2" r="0.9" fill="currentColor" className="sc-away-seal-grain" />
      </svg>
    </span>
  );
}
