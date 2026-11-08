import React from "react";
import "./decree-living.css";

/**
 * Stacked status rows for each royal decree card: name, time left, effect.
 * Display only. Every value comes from what DecreeCard already reads:
 * the DECREES table (name, blurb, ticks) and decreeUntil(state, id).
 * The card keeps its own cost line and Issue button.
 */

export type DecreeLedgerKind = "name" | "time" | "effect";
export type DecreeLedgerTone = "calm" | "busy" | "ready" | "off";
export type DecreeStatus = "active" | "ready" | "short" | "idle";

export interface DecreeLedgerRow {
  kind: DecreeLedgerKind;
  label: string;
  value: string;
  sub?: string;
  tone: DecreeLedgerTone;
  /** 0..1 bar under the row (share of the decree's length still remaining). */
  fill?: number;
  /** Leading glyph (wax seal pip). */
  lead?: React.ReactNode;
}

/** Card status from the values DecreeCard already computes. */
export function decreeStatus(input: { hasState: boolean; left: number; affordable: boolean }): DecreeStatus {
  if (!input.hasState) return "idle";
  if (input.left > 0) return "active";
  return input.affordable ? "ready" : "short";
}

/** Rows for one decree. Seconds use the same rounding the card already shows (10 ticks per second). */
export function decreeLedgerRows(input: {
  name: string;
  blurb: string;
  status: DecreeStatus;
  /** Ticks left from decreeUntil. */
  left: number;
  /** The decree's table length (DECREES[n].ticks). */
  ticks: number;
}): DecreeLedgerRow[] {
  const { name, blurb, status, left, ticks } = input;
  const nameSub =
    status === "active" ? "in force" : status === "ready" ? "ready to issue" : status === "short" ? "short of stores" : undefined;
  const nameTone: DecreeLedgerTone =
    status === "active" ? "busy" : status === "ready" ? "ready" : status === "short" ? "off" : "calm";

  const time: DecreeLedgerRow =
    status === "active"
      ? {
          kind: "time",
          label: "Time left",
          value: `${Math.ceil(left / 10)}s left`,
          sub: `of ${Math.ceil(ticks / 10)}s`,
          tone: "busy",
          fill: ticks > 0 ? Math.min(1, Math.max(0, left / ticks)) : 0,
        }
      : {
          kind: "time",
          label: "Time left",
          value: "Not sworn",
          sub: `lasts ${Math.ceil(ticks / 10)}s`,
          tone: "calm",
          fill: 0,
        };

  return [
    { kind: "name", label: "Decree", value: name, sub: nameSub, tone: nameTone },
    time,
    {
      kind: "effect",
      label: "Effect",
      value: blurb || "—",
      sub: status === "active" ? "active" : undefined,
      tone: status === "active" ? "ready" : "calm",
    },
  ];
}

export function DecreeLedger(props: { rows: DecreeLedgerRow[]; className?: string }) {
  return (
    <dl className={`sc-decree-ledger${props.className ? ` ${props.className}` : ""}`}>
      {props.rows.map((r) => (
        <div key={r.kind} className={`sc-decree-ledger-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-decree-ledger-label">{r.label}</dt>
          <dd className="sc-decree-ledger-value">
            {r.lead}
            <span className="sc-decree-ledger-main">{r.value}</span>
            {r.sub ? <span className="sc-decree-ledger-sub">{r.sub}</span> : null}
          </dd>
          {r.fill !== undefined ? (
            <span
              className="sc-decree-ledger-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={r.fill}
            >
              <span className="sc-decree-ledger-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
