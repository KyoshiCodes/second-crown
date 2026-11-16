import React from "react";
import { DECREES, decreeUntil, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { WaxSealPip } from "./WaxSealPip";
import "./decrees-status-line.css";

export interface DecreeStatusRow {
  /** The decree's id in the sim's DECREES table. */
  id: string;
  name: string;
  /** Ticks left, straight from the sim's `decreeUntil`. Always above 0 here. */
  ticksLeft: number;
  /** Seconds left, rounded up the same way the decree card on the Crown tab rounds. */
  secondsLeft: number;
  /** What the decree grants while it runs: the table's blurb without its "for ~40s" ending. */
  effect: string;
  /** This decree's part of the line, e.g. "Harvest Rite, 32s left: +3 production". */
  text: string;
}

export interface DecreesStatus {
  /** "none": no decree in force. "active": at least one. */
  kind: "none" | "active";
  active: number;
  /** Decrees in force, in table order. */
  rows: DecreeStatusRow[];
  headline: string;
  /** The whole line as plain text, for labels and tests. */
  text: string;
}

export const DECREES_NONE_TEXT = "No decree bonus in force. Swear one on the Crown tab.";

/**
 * The effect in words. The sim's blurb reads "Training 10% cheaper for ~40s"; the line shows the
 * real time left beside it, so the blurb's own length is dropped. Nothing else is rewritten.
 */
export function decreeEffectText(blurb: string): string {
  return blurb.replace(/\s+for\s+~?\d+\s*s$/i, "").trim() || "—";
}

/** Reads the sim's decree table and timers and builds the line's text. No rules and no decree math here. */
export function decreesStatus(state: GameState): DecreesStatus {
  const rows: DecreeStatusRow[] = [];
  for (const d of DECREES) {
    const ticksLeft = decreeUntil(state, d.id);
    if (ticksLeft <= 0) continue;
    const secondsLeft = Math.ceil(ticksLeft / TICKS_PER_SECOND);
    const effect = decreeEffectText(d.blurb);
    rows.push({ id: d.id, name: d.name, ticksLeft, secondsLeft, effect, text: `${d.name}, ${secondsLeft}s left: ${effect}` });
  }
  if (rows.length === 0) {
    const headline = "None active";
    return { kind: "none", active: 0, rows, headline, text: `Decrees · ${headline} · ${DECREES_NONE_TEXT}` };
  }
  const headline = `${rows.length} active`;
  return {
    kind: "active",
    active: rows.length,
    rows,
    headline,
    text: `Decrees · ${headline} · ${rows.map((r) => r.text).join(" · ")}`,
  };
}

/**
 * Read-only decrees status line for the Kingdom tab and the province inspect card: the decrees in
 * force, the time each has left, and what each grants. It has no button; decrees are still sworn
 * on the Crown tab.
 */
export function DecreesStatusLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const s = decreesStatus(state);
  return (
    <div
      className={`sc-decrees-status-line is-${s.kind}`}
      data-decrees-status={s.kind}
      data-decrees-active={s.active}
      aria-label={s.text}
    >
      <WaxSealPip active={s.active > 0} size={14} className="sc-decrees-status-icon" />
      <span className="sc-decrees-status-text">
        <span className="sc-decrees-status-label">Decrees</span> ·{" "}
        <span className="sc-decrees-status-headline">{s.headline}</span>
        {s.kind === "none" ? (
          <>
            {" "}
            · <span className="sc-decrees-status-note">{DECREES_NONE_TEXT}</span>
          </>
        ) : (
          s.rows.map((r) => (
            <span key={r.id} className="sc-decrees-status-decree" data-decree={r.id}>
              {" "}
              · <strong>{r.name}</strong>, <span className="sc-decrees-status-time">{r.secondsLeft}s left</span>:{" "}
              <span className="sc-decrees-status-effect">{r.effect}</span>
            </span>
          ))
        )}
      </span>
    </div>
  );
}
