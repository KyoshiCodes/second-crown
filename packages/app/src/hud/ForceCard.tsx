import React from "react";
import { WarChip } from "./WarChip";
import "./force-card.css";

export type ForceTone = "hostile" | "scout" | "gather" | "garrison";

export function ForceCard(props: {
  tone: ForceTone;
  name: string;
  dest: string;
  seconds?: number;
  detail?: string;
  captain?: string;
  action?: { label: string; disabled?: boolean; onClick: () => void };
  loaded?: boolean;
  empty?: boolean;
}) {
  const { tone, name, dest, seconds, detail, captain, action, loaded, empty } = props;
  return (
    <div className={`sc-force-card is-${tone}`}>
      <span className="sc-force-head">
        <span className="sc-force-title-group">
          <WarChip kind={tone} size={24} loaded={loaded} empty={empty} />
          <span className="sc-force-name">{name}</span>
        </span>
        <span className="sc-force-eta">{seconds === undefined ? "posted" : `${seconds}s`}</span>
      </span>
      {captain ? <span className="sc-force-captain">Capt. {captain}</span> : null}
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
