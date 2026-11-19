import React from "react";
import {
  RESEARCH,
  researchDone,
  researchDuration,
  researchTicksLeft,
  type GameState,
  type ResearchId,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { ScrollPip } from "./ScrollPip";
import { studyProgressText } from "../ResearchAdvanced";
import "./research-status-line.css";

/**
 * A study in the sim is "active" while its `research_<id>_until` tick is still ahead. The lectern
 * takes one study at a time, but the line lists every study the sim reports as running so it stays
 * honest if that ever changes. Progress uses the same `studyProgressText` as the study cards, and the
 * bonus is the study's own `effect` text from RESEARCH (without its "Needs ..." gate sentence).
 */

export interface ResearchStatusRow {
  /** The study's id in the sim's RESEARCH table. */
  id: ResearchId;
  name: string;
  ticksLeft: number;
  /** Length of this study as started (the `research_<id>_total` flag), or its current duration. */
  ticksTotal: number;
  /** 0 to 99, never 100 while seconds remain (same as the study card). */
  percent: number;
  /** "42% · 104s left", as on the study card. */
  progress: string;
  /** What the study grants once known, e.g. "Farms and granaries yield more food." */
  bonus: string;
  /** This study's part of the line, e.g. "Husbandry, 42% · 104s left: Farms and granaries yield more food." */
  text: string;
}

export interface ResearchStatus {
  /** "none": lectern idle. "active": at least one study running. */
  kind: "none" | "active";
  active: number;
  /** Studies already known, out of `total`. */
  known: number;
  total: number;
  rows: ResearchStatusRow[];
  headline: string;
  /** The whole line as plain text, for labels and tests. */
  text: string;
}

/** Drops the "Needs Keep II." style gate sentences: they say how to start a study, not what it grants. */
export function researchBonusText(effect: string): string {
  return effect
    .split(/(?<=\.)\s+/)
    .filter((part) => !/^Needs\b/.test(part))
    .join(" ")
    .trim();
}

export function researchNoneText(known: number, total: number): string {
  return `Lectern idle. ${known} of ${total} studies known.`;
}

/** Reads the sim's study flags through its own helpers and builds the line's text. No research math here. */
export function researchStatus(state: GameState): ResearchStatus {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const rows: ResearchStatusRow[] = [];
  let known = 0;
  for (const id of ids) {
    const left = researchTicksLeft(state, id);
    if (left <= 0) {
      if (researchDone(state, id)) known += 1;
      continue;
    }
    const def = RESEARCH[id];
    const flagged = Number(state.flags[`research_${id}_total`] ?? 0);
    const ticksTotal = flagged > 0 ? flagged : researchDuration(state, id);
    const pt = studyProgressText({
      status: "studying",
      ticksLeft: left,
      ticksTotal,
      ticksBase: def.ticks,
      ticksPerSecond: TICKS_PER_SECOND,
    });
    const progress = pt ? pt.value : "";
    const percent = ticksTotal > 0 ? Math.min(99, Math.max(0, Math.round((1 - left / ticksTotal) * 100))) : 0;
    const bonus = researchBonusText(def.effect);
    rows.push({
      id,
      name: def.name,
      ticksLeft: left,
      ticksTotal,
      percent,
      progress,
      bonus,
      text: `${def.name}, ${progress}: ${bonus}`,
    });
  }
  const total = ids.length;
  if (rows.length === 0) {
    const headline = "None active";
    return { kind: "none", active: 0, known, total, rows, headline, text: `Research · ${headline} · ${researchNoneText(known, total)}` };
  }
  const headline = `${rows.length} active`;
  return {
    kind: "active",
    active: rows.length,
    known,
    total,
    rows,
    headline,
    text: `Research · ${headline} · ${rows.map((r) => r.text).join(" · ")}`,
  };
}

/**
 * Read-only research status line for the Kingdom tab and the province inspect card: the studies on
 * the lectern, how far along each is, and the bonus each grants. No button; studies are started and
 * cancelled on the lectern cards.
 */
export function ResearchStatusLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const s = researchStatus(state);
  const pip = s.kind === "active" ? "ready" : s.known === s.total ? "claimed" : "open";
  return (
    <div
      className={`sc-research-status-line is-${s.kind}`}
      data-research-status={s.kind}
      data-research-active={s.active}
      data-research-known={s.known}
      aria-label={s.text}
    >
      <ScrollPip status={pip} size={14} className="sc-research-status-icon" />
      <span className="sc-research-status-text">
        <span className="sc-research-status-label">Research</span> ·{" "}
        <span className="sc-research-status-headline">{s.headline}</span>
        {s.kind === "none" ? (
          <>
            {" "}
            · <span className="sc-research-status-note">{researchNoneText(s.known, s.total)}</span>
          </>
        ) : (
          s.rows.map((r) => (
            <span key={r.id} className="sc-research-status-study" data-study={r.id} data-progress={r.percent}>
              {" "}
              · <strong>{r.name}</strong>, <span className="sc-research-status-progress">{r.progress}</span>:{" "}
              <span className="sc-research-status-bonus">{r.bonus}</span>
            </span>
          ))
        )}
      </span>
    </div>
  );
}
