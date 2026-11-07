import React from "react";
import type { ForceStatusRow } from "./ForceStatus";
import "./force-ledger.css";

/**
 * Stacked ledger rows for a War Room force card: name, destination, ETA, action.
 * Display only. Every value comes from props the War Room already passes to
 * ForceCard; the action row hosts the same Recall / Sally button as before.
 */

export type ForceLedgerKind = "name" | "dest" | "eta" | "action";

export interface ForceLedgerAction {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export interface ForceLedgerProps {
  name: string;
  captain?: string;
  dest: string;
  detail?: string;
  seconds?: number;
  /** The ETA row from ForceStatus, when the card has one (adds note + trip bar). */
  etaRow?: ForceStatusRow;
  action?: ForceLedgerAction;
  /** Leading glyph for the name row (the WarChip). */
  lead?: React.ReactNode;
}

/** ETA text: prefer the status row (it carries notes like "gathering"), else seconds. */
export function ledgerEta(seconds: number | undefined, etaRow?: ForceStatusRow): string {
  if (etaRow) return etaRow.value;
  return seconds === undefined ? "Posted" : `${seconds}s`;
}

/** Action state word shown beside the button. */
export function ledgerActionState(action?: ForceLedgerAction): "ready" | "locked" | "none" {
  if (!action) return "none";
  return action.disabled ? "locked" : "ready";
}

export function ForceLedger(props: ForceLedgerProps) {
  const { name, captain, dest, detail, seconds, etaRow, action, lead } = props;
  const moving = seconds !== undefined;
  const actionState = ledgerActionState(action);
  const fill = etaRow?.fill;

  return (
    <dl className="sc-force-ledger">
      <div className="sc-force-ledger-row is-name">
        <dt className="sc-force-ledger-label">Name</dt>
        <dd className="sc-force-ledger-value">
          {lead}
          <span className="sc-force-ledger-main sc-force-name">{name}</span>
          {captain ? <span className="sc-force-ledger-sub">Capt. {captain}</span> : null}
        </dd>
      </div>
      <div className="sc-force-ledger-row is-dest">
        <dt className="sc-force-ledger-label">Destination</dt>
        <dd className="sc-force-ledger-value">
          <span className="sc-force-ledger-main">→ {dest}</span>
          {detail ? <span className="sc-force-ledger-sub">{detail}</span> : null}
        </dd>
      </div>
      <div className={`sc-force-ledger-row is-eta ${moving ? "is-moving" : "is-posted"}`}>
        <dt className="sc-force-ledger-label">ETA</dt>
        <dd className="sc-force-ledger-value">
          <span className="sc-force-ledger-main">{ledgerEta(seconds, etaRow)}</span>
        </dd>
        {fill !== undefined ? (
          <span className="sc-force-ledger-bar" aria-hidden="true">
            <span className="sc-force-ledger-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
          </span>
        ) : null}
      </div>
      <div className={`sc-force-ledger-row is-action state-${actionState}`}>
        <dt className="sc-force-ledger-label">Action</dt>
        <dd className="sc-force-ledger-value">
          {action ? (
            <button
              type="button"
              className="sc-force-btn"
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ) : (
            <span className="sc-force-ledger-main">None</span>
          )}
        </dd>
      </div>
    </dl>
  );
}
