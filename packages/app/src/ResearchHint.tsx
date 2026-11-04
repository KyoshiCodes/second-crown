import React from "react";
import {
  RESEARCH,
  countBuilding,
  researchDone,
  researchKeepMin,
  researchKeepReady,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";
import "./research-hint.css";

type ResearchId = keyof typeof RESEARCH;

function halls(id: ResearchId): readonly string[] {
  const def = RESEARCH[id] as { needs?: string; needsAny?: readonly string[] };
  if (def.needsAny && def.needsAny.length) return def.needsAny;
  return def.needs ? [def.needs] : [];
}

function hallReady(state: GameState, id: ResearchId): boolean {
  return halls(id).some((b) => countBuilding(state, b) > 0);
}

/** Cost exactly as the sim table lists it, e.g. "20 food, 12 wood". */
export function researchCostText(id: ResearchId): string {
  return Object.entries(RESEARCH[id].cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

/**
 * Next study to point at: the first one in table order that is not known and not underway,
 * preferring one whose hall and Keep gate are already met. Read-only; no new rules.
 */
export function nextResearch(state: GameState): { id: ResearchId; ready: boolean } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const open = ids.filter((id) => !researchDone(state, id) && researchTicksLeft(state, id) <= 0);
  const ready = open.find((id) => hallReady(state, id) && researchKeepReady(state, id));
  if (ready) return { id: ready, ready: true };
  return open.length ? { id: open[0], ready: false } : null;
}

export function ResearchHint(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const next = nextResearch(state);
  if (!next) {
    return <p className="sc-research-hint is-done">Next study · every study known.</p>;
  }
  const name = RESEARCH[next.id].name;
  const cost = researchCostText(next.id);
  let need = "";
  if (!next.ready) {
    const parts: string[] = [];
    if (!hallReady(state, next.id)) parts.push(halls(next.id).join(" or "));
    if (!researchKeepReady(state, next.id)) parts.push(`Keep ${researchKeepMin(next.id)}`);
    need = parts.length ? ` · needs ${parts.join(", ")}` : "";
  }
  return (
    <p className={`sc-research-hint${next.ready ? " is-ready" : ""}`} data-research={next.id}>
      Next study · <strong>{name}</strong> · {cost}
      {need}. Start it from the lectern.
    </p>
  );
}
