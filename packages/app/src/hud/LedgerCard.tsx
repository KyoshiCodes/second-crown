import React from "react";
import type { LedgerEntry } from "@second-crown/sim";
import { QuillPip, type QuillPipVariant } from "./QuillPip";
import "./ledger-card.css";
import "./ledger-living.css";

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

export type LedgerRowKind = "time" | "text";

export interface LedgerRow {
  kind: LedgerRowKind;
  label: string;
  value: string;
  sub?: string;
}

/** "save_written" -> "save written". Words only; no lookup tables, no new data. */
export function ledgerKindLabel(kind?: string): string {
  return (kind ?? "").replace(/[_-]+/g, " ").trim();
}

/**
 * Builds the stacked status rows for one ledger line. Display only: every value is the entry's
 * own tick, kind, and text. No new game math.
 */
export function ledgerRows(tick: number, text: string, kind?: string): LedgerRow[] {
  const kindLabel = ledgerKindLabel(kind);
  return [
    { kind: "time", label: "Time", value: `t${tick}`, sub: kindLabel || undefined },
    { kind: "text", label: "Entry", value: text },
  ];
}

/**
 * Living LedgerCard for each Chronicle / Ledger of Crowns line:
 * - 16–20px quill/ink pip (pointer-events: none)
 * - Stacked status rows: Time (tick + kind) and Entry (text)
 * - Keeps .sc-ledger-card-time / .sc-ledger-card-text hooks on the row values
 * - Styled via ledger-card.css + ledger-living.css; theme.css remains untouched.
 */
export function LedgerCard(props: LedgerCardProps) {
  const tick = props.entry ? props.entry.tick : (props.tick ?? 0);
  const text = props.entry ? props.entry.text : (props.text ?? "");
  const kind = props.entry ? props.entry.kind : props.kind;
  const pipSize = props.pipSize ?? 18;
  const rows = ledgerRows(tick, text, kind);

  return (
    <li
      className={`sc-ledger-card is-living ${props.className ?? ""}`}
      style={props.style}
      data-kind={kind}
    >
      <QuillPip size={pipSize} kind={kind} variant={props.variant} />
      <dl className="sc-ledger-card-rows">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-ledger-card-row is-${r.kind}`}>
            <dt className="sc-ledger-card-label">{r.label}</dt>
            <dd className="sc-ledger-card-value">
              <span className={r.kind === "time" ? "sc-ledger-card-time" : "sc-ledger-card-text"}>
                {r.value}
              </span>
              {r.sub ? <span className="sc-ledger-card-sub">{r.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
