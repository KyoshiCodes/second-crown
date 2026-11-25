import React from "react";
import "./economy-pressure.css";

/** Calm non-blocking indicator shown when a study or building cost exceeds ~10m of income. */
export function SavingPip(props: { compact?: boolean; label?: string }) {
  return (
    <span
      className={`sc-saving-pip${props.compact ? " is-compact" : ""}`}
      data-saving-pip="true"
      aria-hidden="true"
    >
      <span className="sc-saving-pip-dot" />
      {props.compact ? null : <span className="sc-saving-pip-label">{props.label ?? "Saving"}</span>}
    </span>
  );
}
