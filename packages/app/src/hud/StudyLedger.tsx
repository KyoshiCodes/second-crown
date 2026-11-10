import React from "react";
import "./academy-living.css";

/**
 * Stacked status rows for each Academy / lectern study card: name, progress, bonus.
 * Display only. Every value comes from what ResearchBar already reads from the sim
 * (researchDone, researchTicksLeft, researchDuration, hall / Keep checks, the
 * table's effect text). The card keeps its own Study / Cancel buttons.
 */

export type StudyLedgerKind = "name" | "progress" | "bonus";
export type StudyLedgerTone = "calm" | "busy" | "ready" | "done" | "locked";
export type StudyStatus = "known" | "studying" | "open" | "locked";

export interface StudyLedgerRow {
  kind: StudyLedgerKind;
  label: string;
  value: string;
  sub?: string;
  tone: StudyLedgerTone;
  /** 0..1 bar under the row. "run" draws a moving bar with no fraction (time left only). */
  fill?: number | "run";
  /** Leading glyph (scroll pip). */
  lead?: React.ReactNode;
  /** Trailing control (existing buttons only). */
  slot?: React.ReactNode;
}

/** Card status from the values ResearchBar already computes. */
export function studyStatus(input: {
  done: boolean;
  ticksLeft: number;
  hallOk: boolean;
  keepOk: boolean;
  /** Tier II only: false while the tier I study it builds on is not known. Defaults to true. */
  prereqOk?: boolean;
}): StudyStatus {
  if (input.done) return "known";
  if (input.ticksLeft > 0) return "studying";
  return input.hallOk && input.keepOk && input.prereqOk !== false ? "open" : "locked";
}

/** Rows for one study. Seconds use the same rounding the lectern already shows. */
export function studyLedgerRows(input: {
  name: string;
  status: StudyStatus;
  /** Sim ticks left on an active study (10 per second, as elsewhere on the lectern). */
  ticksLeft: number;
  /** The study's stored length (flags.research_<id>_total), when the save has it. */
  ticksTotal?: number;
  /** Whole seconds a new study would take now (researchDuration / TICKS_PER_SECOND). */
  seconds: number;
  effect: string;
  halls: string[];
  keepNeed: number;
  hallOk: boolean;
  keepOk: boolean;
  /** Tier II only: display name of the tier I study it builds on (sim researchRequires). */
  prereq?: string;
  prereqOk?: boolean;
}): StudyLedgerRow[] {
  const { name, status, ticksLeft, ticksTotal = 0, seconds, effect, halls, keepNeed, hallOk, keepOk, prereq, prereqOk } = input;
  const needs: string[] = [];
  if (prereq && prereqOk === false) needs.push(`needs ${prereq}`);
  if (!hallOk) needs.push(`needs ${halls.join(" or ")}`);
  if (!keepOk && keepNeed > 0) needs.push(`needs Keep ${"I".repeat(keepNeed)}`);

  const nameTone: StudyLedgerTone =
    status === "known" ? "done" : status === "studying" ? "busy" : status === "open" ? "ready" : "locked";

  const progress: StudyLedgerRow =
    status === "known"
      ? { kind: "progress", label: "Progress", value: "Known", tone: "done", fill: 1 }
      : status === "studying"
        ? { kind: "progress", label: "Progress", value: `${Math.ceil(ticksLeft / 10)}s left`, sub: "studying", tone: "busy", fill: ticksTotal > 0 ? Math.min(1, Math.max(0, 1 - ticksLeft / ticksTotal)) : "run" }
        : {
            kind: "progress",
            label: "Progress",
            value: "Not started",
            sub: `${seconds}s to study`,
            tone: status === "open" ? "ready" : "locked",
            fill: 0,
          };

  return [
    {
      kind: "name",
      label: "Study",
      value: name,
      sub: status === "locked" ? needs.join(" · ") : undefined,
      tone: nameTone,
    },
    progress,
    {
      kind: "bonus",
      label: "Bonus",
      value: effect || "—",
      sub: status === "known" ? "active" : undefined,
      tone: status === "known" ? "ready" : "calm",
    },
  ];
}

export function StudyLedger(props: { rows: StudyLedgerRow[]; className?: string }) {
  return (
    <dl className={`sc-study-ledger${props.className ? ` ${props.className}` : ""}`}>
      {props.rows.map((r) => (
        <div key={r.kind} className={`sc-study-ledger-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-study-ledger-label">{r.label}</dt>
          <dd className="sc-study-ledger-value">
            {r.lead}
            <span className="sc-study-ledger-main">{r.value}</span>
            {r.sub ? <span className="sc-study-ledger-sub">{r.sub}</span> : null}
            {r.slot}
          </dd>
          {r.fill === "run" ? (
            <span className="sc-study-ledger-bar is-run" aria-hidden="true">
              <span className="sc-study-ledger-fill" />
            </span>
          ) : r.fill !== undefined ? (
            <span
              className="sc-study-ledger-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={r.fill}
            >
              <span className="sc-study-ledger-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
