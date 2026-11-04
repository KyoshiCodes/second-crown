import React from "react";
import {
  RESEARCH,
  UNIT_TYPES,
  researchDone,
  researchDuration,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";
import "./research-pace.css";

type ResearchId = keyof typeof RESEARCH;

/** Sim ticks to whole seconds, same rounding as StudyLine (10 ticks per second). */
function secs(ticks: number): number {
  return Math.ceil(ticks / 10);
}

/** The study underway on the lectern, if any. */
export function activeStudy(state: GameState): { id: ResearchId; left: number } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const id = ids.find((k) => researchTicksLeft(state, k) > 0);
  return id ? { id, left: researchTicksLeft(state, id) } : null;
}

/** First study in table order that unlocks units and is not known yet. Read-only. */
export function nextUnlock(state: GameState): { id: ResearchId; units: string[] } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const id = ids.find((k) => RESEARCH[k].unlocks.length > 0 && !researchDone(state, k));
  if (!id) return null;
  const units = (RESEARCH[id].unlocks as readonly string[]).map((u) => UNIT_TYPES[u]?.name ?? u);
  return { id, units };
}

/** True when the sim's researchDuration runs shorter than the table ticks (Academy pace). */
export function fastPace(state: GameState): boolean {
  const id = Object.keys(RESEARCH)[0] as ResearchId;
  return researchDuration(state, id) < RESEARCH[id].ticks;
}

export function ResearchPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const fast = fastPace(state);
  const active = activeStudy(state);
  const unlock = nextUnlock(state);
  return (
    <p className={`sc-research-pace${fast ? " is-fast" : ""}`} data-pace={fast ? "academy" : "base"}>
      Research pace · <strong>{fast ? "Academy pace" : "base pace"}</strong>
      {active ? ` · ${RESEARCH[active.id].name} ${secs(active.left)}s left` : " · lectern idle"}
      {unlock ? (
        <>
          {" "}· next unlock <strong>{RESEARCH[unlock.id].name}</strong> → {unlock.units.join(", ")}
          {active?.id === unlock.id ? "" : ` (${secs(researchDuration(state, unlock.id))}s)`}
        </>
      ) : (
        " · every unit unlocked"
      )}
      .
    </p>
  );
}
