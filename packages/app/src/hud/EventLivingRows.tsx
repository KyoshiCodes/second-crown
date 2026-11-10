import React from "react";
import type { EventsLedgerRow } from "./EventsLedger";
import type { OmenVariant } from "./OmenPip";
import type { OmenLivingState } from "./EventsLivingGlyph";
import "./event-living-rows.css";

/**
 * Living status column on a world event card: the omen pip sits in an
 * omen-tinted chip beside a stacked Name / Omen / Duration column.
 * Display only. Every value is taken from the rows EventCard already builds
 * with eventLedgerRows(); the omen tag is the existing resolveOmenVariant() /
 * resolveOmenLiving() grouping. No new numbers here. Choice buttons stay on the card.
 */

export type EventLivingKind = "name" | "omen" | "duration";

const KIND_OF: Record<EventsLedgerRow["kind"], EventLivingKind> = {
  name: "name",
  reward: "omen",
  progress: "duration",
};

const LABEL: Record<EventLivingKind, string> = {
  name: "Event",
  omen: "Omen",
  duration: "Duration",
};

export const EVENT_LIVING_KINDS: readonly EventLivingKind[] = ["name", "omen", "duration"];

/** Rows in Name / Omen / Duration order; anything missing is skipped. */
export function orderEventRows(rows: EventsLedgerRow[]): EventsLedgerRow[] {
  return EVENT_LIVING_KINDS.map((k) => rows.find((r) => KIND_OF[r.kind] === k)).filter(
    (r): r is EventsLedgerRow => Boolean(r),
  );
}

const STATE_WORD: Record<OmenLivingState, string> = {
  latest: "latest",
  pending: "awaiting",
  loss: "blighted",
  settled: "settled",
};

export function EventLivingRows(props: {
  eventId: string;
  omen: OmenVariant;
  state: OmenLivingState;
  rows: EventsLedgerRow[];
}) {
  const { eventId, omen, state } = props;
  const rows = orderEventRows(props.rows);
  const nameRow = rows.find((r) => r.kind === "name");
  return (
    <div className={`sc-event-living-head is-${state} omen-${omen}`} data-event-living={eventId}>
      <span className="sc-event-living-chip" aria-hidden="true">
        {nameRow?.lead}
      </span>
      <dl className="sc-event-living-rows">
        {rows.map((r) => {
          const kind = KIND_OF[r.kind];
          return (
            <div key={kind} className={`sc-event-living-row is-${kind} tone-${r.tone}`} data-kind={kind}>
              <dt className="sc-event-living-label">{LABEL[kind]}</dt>
              <dd className="sc-event-living-value">
                <span className="sc-event-living-main">{r.value}</span>
                {kind === "name" ? (
                  <span className="sc-event-living-tag">
                    {omen} · {STATE_WORD[state]}
                  </span>
                ) : r.sub ? (
                  <span className="sc-event-living-sub">{r.sub}</span>
                ) : null}
              </dd>
              {r.fill !== undefined ? (
                <span
                  className="sc-event-living-meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={r.fill}
                >
                  <span className="sc-event-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
                </span>
              ) : null}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
