import React from "react";
import type { EventsLedgerRow } from "./EventsLedger";
import type { QuestStatus } from "./QuestCard";
import type { ScrollSealMotif } from "./EventsLivingGlyph";
import "./quest-living-rows.css";

/**
 * Living status column on a quest card: the scroll pip sits in a status-tinted
 * chip beside a stacked Name / Progress / Reward column.
 * Display only. Every value is taken from the rows QuestCard already builds with
 * questLedgerRows(); the tag is the existing getQuestSealMotif() / quest status.
 * No new numbers here. The Claim button stays in the Reward row (row `slot`).
 */

export type QuestLivingKind = "name" | "progress" | "reward";

const LABEL: Record<QuestLivingKind, string> = {
  name: "Quest",
  progress: "Progress",
  reward: "Reward",
};

export const QUEST_LIVING_KINDS: readonly QuestLivingKind[] = ["name", "progress", "reward"];

/** Rows in Name / Progress / Reward order; anything missing is skipped. */
export function orderQuestRows(rows: EventsLedgerRow[]): EventsLedgerRow[] {
  return QUEST_LIVING_KINDS.map((k) => rows.find((r) => r.kind === k)).filter(
    (r): r is EventsLedgerRow => Boolean(r),
  );
}

const STATUS_WORD: Record<QuestStatus, string> = {
  open: "unsealed",
  ready: "seal lit",
  claimed: "sealed",
};

export function QuestLivingRows(props: {
  questId: string;
  status: QuestStatus;
  motif: ScrollSealMotif;
  rows: EventsLedgerRow[];
}) {
  const { questId, status, motif } = props;
  const rows = orderQuestRows(props.rows);
  const nameRow = rows.find((r) => r.kind === "name");
  return (
    <div className={`sc-quest-living-head is-${status} seal-${motif}`} data-quest-living={questId}>
      <span className="sc-quest-living-chip" aria-hidden="true">
        {nameRow?.lead}
      </span>
      <dl className="sc-quest-living-rows">
        {rows.map((r) => {
          const kind = r.kind as QuestLivingKind;
          return (
            <div key={kind} className={`sc-quest-living-row is-${kind} tone-${r.tone}`} data-kind={kind}>
              <dt className="sc-quest-living-label">{LABEL[kind]}</dt>
              <dd className="sc-quest-living-value">
                <span className="sc-quest-living-main">{r.value}</span>
                {kind === "name" ? (
                  <span className="sc-quest-living-tag">
                    {motif} · {STATUS_WORD[status]}
                  </span>
                ) : null}
                {r.sub ? <span className="sc-quest-living-sub">{r.sub}</span> : null}
                {r.slot}
              </dd>
              {r.fill !== undefined ? (
                <span
                  className="sc-quest-living-meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={r.fill}
                >
                  <span className="sc-quest-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
                </span>
              ) : null}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
