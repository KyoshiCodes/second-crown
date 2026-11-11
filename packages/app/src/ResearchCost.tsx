import React from "react";
import "./research-tree.css";

/**
 * Cost row on a lectern study card: one chip per resource, with the amount still
 * missing when stores are short, plus one plain line saying why Study would fail.
 * Display only. Costs come straight from the sim RESEARCH table and stores from
 * state.resources; tryStartResearch stays the only thing that decides and spends.
 */

export interface StudyCostPart {
  res: string;
  need: number;
  /** Whole units still missing (0 when the stores cover it). */
  short: number;
}

/** One entry per resource in the study's cost, in table order. */
export function studyCostParts(
  cost: Readonly<Record<string, string>>,
  resources: Readonly<Record<string, string | undefined>>,
): StudyCostPart[] {
  return Object.entries(cost).map(([res, raw]) => {
    const need = Number(raw);
    const have = Number(resources[res] ?? 0);
    return { res, need, short: have >= need ? 0 : Math.ceil(need - have) };
  });
}

export type StudyCostState = "known" | "studying" | "open" | "locked";

/**
 * The one-line reason under the chips. Gates the name row already explains
 * (hall, Keep, prerequisite) are not repeated here.
 */
export function studyCostNote(input: {
  status: StudyCostState;
  parts: StudyCostPart[];
  /** Name of the study on the lectern right now, when it is a different one. */
  busyWith?: string;
}): { text: string; tone: "ok" | "short" | "wait" | "calm" } {
  const { status, parts, busyWith } = input;
  if (status === "known" || status === "studying") return { text: "Paid.", tone: "calm" };
  const short = parts.filter((p) => p.short > 0);
  if (short.length > 0) {
    return { text: `Short ${short.map((p) => `${p.short} ${p.res}`).join(", ")}.`, tone: "short" };
  }
  if (busyWith) return { text: `Stores cover it. Lectern is busy with ${busyWith}.`, tone: "wait" };
  if (status === "locked") return { text: "Stores cover it.", tone: "calm" };
  return { text: "Stores cover it. Ready to study.", tone: "ok" };
}

export function ResearchCostRow(props: { status: StudyCostState; parts: StudyCostPart[]; busyWith?: string }) {
  const { status, parts, busyWith } = props;
  const paid = status === "known" || status === "studying";
  const note = studyCostNote({ status, parts, busyWith });
  return (
    <div className={`sc-research-tree-cost is-${status}`} data-study-cost={paid ? "paid" : "due"}>
      <span className="sc-research-tree-cost-label">Cost</span>
      <span className="sc-research-tree-cost-chips">
        {parts.map((p) => (
          <span
            key={p.res}
            className={`sc-research-tree-cost-chip${!paid && p.short > 0 ? " is-short" : ""}`}
            data-res={p.res}
          >
            {p.need} {p.res}
          </span>
        ))}
      </span>
      <span className={`sc-research-tree-cost-note tone-${note.tone}`}>{note.text}</span>
    </div>
  );
}
