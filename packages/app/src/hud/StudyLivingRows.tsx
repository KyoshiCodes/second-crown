import React from "react";
import type { StudyLedgerRow, StudyStatus } from "./StudyLedger";
import { getResearchDiscipline } from "./AcademyLivingGlyph";
import "./study-living-rows.css";

/**
 * Living status column on an Academy / lectern study card: the status pip sits
 * beside a stacked Name / Progress / Bonus column. Display only. Every value is
 * taken from the rows ResearchBar already builds with studyLedgerRows(); the
 * discipline tag is the existing getResearchDiscipline() art grouping.
 * No new numbers here. Existing controls (Cancel) ride in the row `slot`.
 */

export const STUDY_LIVING_KINDS: ReadonlyArray<StudyLedgerRow["kind"]> = ["name", "progress", "bonus"];

/** Rows in Name / Progress / Bonus order; anything missing is skipped. */
export function orderStudyRows(rows: StudyLedgerRow[]): StudyLedgerRow[] {
  return STUDY_LIVING_KINDS.map((k) => rows.find((r) => r.kind === k)).filter(
    (r): r is StudyLedgerRow => Boolean(r),
  );
}

const STATUS_WORD: Record<StudyStatus, string> = {
  known: "known",
  studying: "studying",
  open: "open",
  locked: "sealed",
};

export function StudyLivingRows(props: { topicId: string; status: StudyStatus; rows: StudyLedgerRow[] }) {
  const { topicId, status } = props;
  const rows = orderStudyRows(props.rows);
  const discipline = getResearchDiscipline(topicId);
  const nameRow = rows.find((r) => r.kind === "name");
  return (
    <div className={`sc-study-living-head is-${status} discipline-${discipline}`}>
      <span className="sc-study-living-chip" aria-hidden="true">
        {nameRow?.lead}
      </span>
      <dl className="sc-study-living-rows">
        {rows.map((r) => (
          <div
            key={r.kind}
            className={`sc-study-living-row is-${r.kind} tone-${r.tone}`}
            data-kind={r.kind}
          >
            <dt className="sc-study-living-label">{r.label}</dt>
            <dd className="sc-study-living-value">
              <span className="sc-study-living-main">{r.value}</span>
              {r.kind === "name" ? (
                <span className="sc-study-living-tag">
                  {discipline} · {STATUS_WORD[status]}
                </span>
              ) : null}
              {r.sub ? <span className="sc-study-living-sub">{r.sub}</span> : null}
              {r.slot ? <span className="sc-study-living-slot">{r.slot}</span> : null}
            </dd>
            {r.fill === "run" ? (
              <span className="sc-study-living-meter is-run" aria-hidden="true">
                <span className="sc-study-living-meter-fill" />
              </span>
            ) : r.fill !== undefined ? (
              <span
                className="sc-study-living-meter"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={r.fill}
              >
                <span className="sc-study-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
              </span>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
