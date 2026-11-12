import React from "react";
import { RESEARCH, researchRequires } from "@second-crown/sim";
import "./research-advanced.css";

/**
 * Clearer requirements, progress wording, and tree links for the lectern study cards.
 * Display only. Every value is read from what ResearchBar already takes from the sim
 * (researchRequires, researchKeepMin, keepLevel, countBuilding, researchDuration,
 * researchTicksLeft). Nothing here decides whether a study may start; tryStartResearch
 * stays the only judge.
 */

const ROMAN = ["", "I", "II", "III", "IV", "V"];

/** Keep level as the numeral the rest of the UI uses. */
export function keepNumeral(level: number): string {
  return ROMAN[level] ?? String(level);
}

export type StudyNeedKind = "study" | "hall" | "keep";

export interface StudyNeed {
  kind: StudyNeedKind;
  /** What is needed, e.g. "Husbandry", "Granary or Academy", "Keep II". */
  label: string;
  met: boolean;
  /** Short state beside it, e.g. "known", "study it first", "yours is Keep I". */
  detail: string;
}

/** The gates on one study, in the order the sim checks them: Keep, first study, hall. */
export function studyNeeds(input: {
  /** Display name of the first study this one builds on (tier II only). */
  prereq?: string;
  prereqOk: boolean;
  /** Display names of every building that counts as a hall for this study. */
  halls: string[];
  /** Display name of one such building the player already has, if any. */
  hallBuilt?: string;
  keepNeed: number;
  keepNow: number;
}): StudyNeed[] {
  const { prereq, prereqOk, halls, hallBuilt, keepNeed, keepNow } = input;
  const out: StudyNeed[] = [];
  if (keepNeed > 0) {
    const met = keepNow >= keepNeed;
    out.push({
      kind: "keep",
      label: `Keep ${keepNumeral(keepNeed)}`,
      met,
      detail: met ? "reached" : keepNow > 0 ? `yours is Keep ${keepNumeral(keepNow)}` : "no Keep yet",
    });
  }
  if (prereq) {
    out.push({ kind: "study", label: prereq, met: prereqOk, detail: prereqOk ? "known" : "study it first" });
  }
  if (halls.length > 0) {
    out.push(
      hallBuilt
        ? { kind: "hall", label: hallBuilt, met: true, detail: "built" }
        : { kind: "hall", label: halls.join(" or "), met: false, detail: halls.length > 1 ? "build one" : "build it" },
    );
  }
  return out;
}

/** Ids of the deeper studies that build on this one (empty for most studies). */
export function studyLeadsTo(id: string): (keyof typeof RESEARCH)[] {
  return (Object.keys(RESEARCH) as (keyof typeof RESEARCH)[]).filter((other) => researchRequires(other) === id);
}

/**
 * Wording for the Progress row. Ticks are sim ticks; `ticksPerSecond` is the shared constant.
 * Returns null for a known study (the row already says "Known").
 */
export function studyProgressText(input: {
  status: "known" | "studying" | "open" | "locked";
  ticksLeft: number;
  /** Length of the active study, or of a new one when none is active. */
  ticksTotal: number;
  /** Length a new study would have with no Academy (the table value). */
  ticksBase: number;
  ticksPerSecond: number;
}): { value: string; sub: string } | null {
  const { status, ticksLeft, ticksTotal, ticksBase, ticksPerSecond } = input;
  if (status === "known") return null;
  const totalS = Math.round(ticksTotal / ticksPerSecond);
  if (status === "studying") {
    const frac = ticksTotal > 0 ? 1 - ticksLeft / ticksTotal : 0;
    // Never show 100% while seconds remain.
    const pct = Math.min(99, Math.max(0, Math.round(frac * 100)));
    return { value: `${pct}% · ${Math.ceil(ticksLeft / ticksPerSecond)}s left`, sub: `of ${totalS}s` };
  }
  const saved = Math.round(ticksBase / ticksPerSecond) - totalS;
  return {
    value: "Not started",
    sub: saved > 0 ? `${totalS}s to study · Academy saves ${saved}s` : `${totalS}s to study`,
  };
}

/** "Needs" checklist: one line per gate with a tick or a cross. */
export function StudyNeedsRow(props: { needs: StudyNeed[] }) {
  const { needs } = props;
  if (needs.length === 0) return null;
  const allMet = needs.every((n) => n.met);
  return (
    <div className={`sc-research-adv-needs${allMet ? " is-met" : ""}`} data-study-needs={allMet ? "met" : "unmet"}>
      <span className="sc-research-adv-label">Needs</span>
      <ul className="sc-research-adv-need-list">
        {needs.map((n) => (
          <li
            key={n.kind}
            className={`sc-research-adv-need ${n.met ? "is-met" : "is-unmet"}`}
            data-need={n.kind}
            data-met={n.met ? "yes" : "no"}
          >
            <span className="sc-research-adv-mark" aria-hidden="true">
              {n.met ? "✓" : "✗"}
            </span>
            <strong>{n.label}</strong>
            <span className="sc-research-adv-detail">{n.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Footer on a first study that a deeper study builds on. */
export function StudyLeadsLine(props: { leads: { name: string; known: boolean }[] }) {
  const { leads } = props;
  if (leads.length === 0) return null;
  return (
    <p className="sc-research-adv-leads">
      <span className="sc-research-adv-leads-mark" aria-hidden="true" />
      Leads to{" "}
      {leads.map((l, i) => (
        <React.Fragment key={l.name}>
          {i > 0 ? ", " : ""}
          <strong>{l.name}</strong>
          {l.known ? " (known)" : ""}
        </React.Fragment>
      ))}
    </p>
  );
}

/** Thin bar in a tier heading: how many of the tier's studies are known. */
export function TierMeter(props: { known: number; total: number }) {
  const { known, total } = props;
  const pct = total > 0 ? Math.round((known / total) * 100) : 0;
  return (
    <span
      className="sc-research-adv-tiermeter"
      role="progressbar"
      aria-label="Studies known in this tier"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={known}
    >
      <span className="sc-research-adv-tiermeter-fill" style={{ width: `${pct}%` }} />
    </span>
  );
}
