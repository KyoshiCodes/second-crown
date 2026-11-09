import React from "react";
import type { DecreeLedgerRow, DecreeStatus } from "./DecreeLedger";
import { getDecreeSealKind } from "./DecreeLivingGlyph";
import "./decree-living-rows.css";

/**
 * Living status column on a royal decree card: the wax-seal pip sits in a
 * seal-tinted chip beside a stacked Name / Duration / Effect column.
 * Display only. Every value is taken from the rows DecreeCard already builds
 * with decreeLedgerRows(); the seal tag is the existing getDecreeSealKind()
 * art grouping. No new numbers here. Cost line and Issue button stay on the card.
 */

export type DecreeLivingKind = "name" | "duration" | "effect";

const KIND_OF: Record<DecreeLedgerRow["kind"], DecreeLivingKind> = {
  name: "name",
  time: "duration",
  effect: "effect",
};

const LABEL: Record<DecreeLivingKind, string> = {
  name: "Decree",
  duration: "Duration",
  effect: "Effect",
};

export const DECREE_LIVING_KINDS: readonly DecreeLivingKind[] = ["name", "duration", "effect"];

/** Rows in Name / Duration / Effect order; anything missing is skipped. */
export function orderDecreeRows(rows: DecreeLedgerRow[]): DecreeLedgerRow[] {
  return DECREE_LIVING_KINDS.map((k) => rows.find((r) => KIND_OF[r.kind] === k)).filter(
    (r): r is DecreeLedgerRow => Boolean(r),
  );
}

const STATUS_WORD: Record<DecreeStatus, string> = {
  active: "in force",
  ready: "ready",
  short: "short",
  idle: "waiting",
};

export function DecreeLivingRows(props: { decreeId: string; status: DecreeStatus; rows: DecreeLedgerRow[] }) {
  const { decreeId, status } = props;
  const rows = orderDecreeRows(props.rows);
  const seal = getDecreeSealKind(decreeId);
  const nameRow = rows.find((r) => r.kind === "name");
  return (
    <div className={`sc-decree-living-head is-${status} seal-${seal}`}>
      <span className="sc-decree-living-chip" aria-hidden="true">
        {nameRow?.lead}
      </span>
      <dl className="sc-decree-living-rows">
        {rows.map((r) => {
          const kind = KIND_OF[r.kind];
          return (
            <div key={kind} className={`sc-decree-living-row is-${kind} tone-${r.tone}`} data-kind={kind}>
              <dt className="sc-decree-living-label">{LABEL[kind]}</dt>
              <dd className="sc-decree-living-value">
                <span className="sc-decree-living-main">{r.value}</span>
                {kind === "name" ? (
                  <span className="sc-decree-living-tag">
                    {seal} · {STATUS_WORD[status]}
                  </span>
                ) : r.sub ? (
                  <span className="sc-decree-living-sub">{r.sub}</span>
                ) : null}
              </dd>
              {r.fill !== undefined ? (
                <span
                  className="sc-decree-living-meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={r.fill}
                >
                  <span className="sc-decree-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
                </span>
              ) : null}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
