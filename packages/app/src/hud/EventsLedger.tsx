import React from "react";
import "./events-living.css";

/**
 * Stacked status rows for the Events and Quests cards: name, progress, reward.
 * Display only. Every value comes from props the cards already receive; the
 * cards keep their own buttons (event choices, quest Claim) inside the rows.
 */

export type EventsLedgerKind = "name" | "progress" | "reward";
export type EventsLedgerTone = "calm" | "busy" | "ready" | "done" | "loss";

export interface EventsLedgerRow {
  kind: EventsLedgerKind;
  label: string;
  value: string;
  sub?: string;
  tone: EventsLedgerTone;
  /** 0..1 bar under the row, when the value has one. */
  fill?: number;
  /** Leading glyph (omen / scroll pip). */
  lead?: React.ReactNode;
  /** Trailing control (existing buttons only). */
  slot?: React.ReactNode;
}

/** Event reward tone from the existing event id (spoilage is the only loss). */
export function eventRewardTone(id: string): EventsLedgerTone {
  return id === "spoil" ? "loss" : "ready";
}

/** Rows for a world event: title, fired tick / choice state, effect text. */
export function eventLedgerRows(input: {
  id: string;
  title: string;
  body: string;
  tickLabel: string;
  latest?: boolean;
  choiceCount?: number;
}): EventsLedgerRow[] {
  const { id, title, body, tickLabel, latest, choiceCount = 0 } = input;
  const pending = choiceCount > 0;
  return [
    { kind: "name", label: "Event", value: title, tone: latest ? "busy" : "calm" },
    {
      kind: "progress",
      label: "Progress",
      value: pending ? `Awaiting choice · ${choiceCount}` : "Resolved",
      sub: `t${tickLabel}`,
      tone: pending ? "busy" : "done",
      fill: pending ? 0 : 1,
    },
    { kind: "reward", label: "Reward", value: body || "—", tone: body ? eventRewardTone(id) : "calm" },
  ];
}

/** Rows for a quest: name, done/1 progress, gold reward. */
export function questLedgerRows(input: {
  name: string;
  hint: string;
  gold: number;
  status: "open" | "ready" | "claimed";
  statusLabel: string;
}): EventsLedgerRow[] {
  const { name, hint, gold, status, statusLabel } = input;
  const done = status === "open" ? 0 : 1;
  const tone: EventsLedgerTone = status === "open" ? "busy" : status === "ready" ? "ready" : "done";
  return [
    { kind: "name", label: "Quest", value: name, sub: hint, tone },
    { kind: "progress", label: "Progress", value: `${done}/1`, sub: statusLabel, tone, fill: done },
    {
      kind: "reward",
      label: "Reward",
      value: status === "claimed" ? `+${gold} gold taken` : `${gold} gold`,
      tone,
    },
  ];
}

export function EventsLedger(props: { rows: EventsLedgerRow[]; className?: string }) {
  return (
    <dl className={`sc-events-ledger${props.className ? ` ${props.className}` : ""}`}>
      {props.rows.map((r) => (
        <div key={r.kind} className={`sc-events-ledger-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-events-ledger-label">{r.label}</dt>
          <dd className="sc-events-ledger-value">
            {r.lead}
            <span className="sc-events-ledger-main">{r.value}</span>
            {r.sub ? <span className="sc-events-ledger-sub">{r.sub}</span> : null}
            {r.slot}
          </dd>
          {r.fill !== undefined ? (
            <span
              className="sc-events-ledger-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={r.fill}
            >
              <span className="sc-events-ledger-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
