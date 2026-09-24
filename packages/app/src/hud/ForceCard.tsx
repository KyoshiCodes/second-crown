import React from "react";
import "./force-card.css";

export type ForceTone = "hostile" | "scout" | "gather" | "garrison";

/** One small card per moving or posted force: what it is, where it goes, how long. */
export function ForceCard(props: {
  tone: ForceTone;
  name: string;
  dest: string;
  /** Seconds to arrival. Omit for forces that are not on the road. */
  seconds?: number;
  detail?: string;
  action?: { label: string; disabled?: boolean; onClick: () => void };
}) {
  const { tone, name, dest, seconds, detail, action } = props;
  return (
    <div className={`sc-force-card is-${tone}`}>
      <span className="sc-force-head">
        <span className="sc-force-name">{name}</span>
        <span className="sc-force-eta">{seconds === undefined ? "posted" : `${seconds}s`}</span>
      </span>
      <span className="sc-force-dest">→ {dest}</span>
      {detail ? <span className="sc-force-detail">{detail}</span> : null}
      {action ? (
        <button type="button" className="sc-force-btn" disabled={action.disabled} onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
