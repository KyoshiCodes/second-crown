import React from "react";
import type { LedgerEntry } from "@second-crown/sim";
import { QuillPip, type QuillPipVariant } from "./QuillPip";
import "./ledger-card.css";

export interface LedgerCardProps {
  /** Optional full LedgerEntry object from listLedger */
  entry?: LedgerEntry;
  /** Tick index (e.g. 100 for t100) */
  tick?: number;
  /** Chronicle event or transaction description text */
  text?: string;
  /** Ledger event category/kind (e.g. "marshal", "war", "victory", "events") */
  kind?: string;
  /** Pip style variant: "quill_ink" (default), "quill", or "ink" */
  variant?: QuillPipVariant;
  /** Pip dimension in pixels (default: 18, 16–20px) */
  pipSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * LedgerCard component for each Chronicle / Ledger of Crowns line:
 * - 16–20px quill/ink pip (pointer-events: none)
 * - Tabular timestamp tag (.sc-ledger-card-time)
 * - Description body (.sc-ledger-card-text)
 * - Purely styled via ledger-card.css; theme.css remains untouched.
 */
export function LedgerCard(props: LedgerCardProps) {
  const tick = props.entry ? props.entry.tick : (props.tick ?? 0);
  const text = props.entry ? props.entry.text : (props.text ?? "");
  const kind = props.entry ? props.entry.kind : props.kind;
  const pipSize = props.pipSize ?? 18;

  return (
    <li
      className={`sc-ledger-card ${props.className ?? ""}`}
      style={props.style}
      data-kind={kind}
    >
      <QuillPip size={pipSize} kind={kind} variant={props.variant} />
      <span className="sc-ledger-card-time">t{tick}</span>
      <span className="sc-ledger-card-text">{text}</span>
    </li>
  );
}
