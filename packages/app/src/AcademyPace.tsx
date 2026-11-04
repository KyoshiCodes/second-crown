import React from "react";
import {
  LECTERN_STUDY_MULT,
  RESEARCH,
  researchDone,
  researchDuration,
  researchKeepMin,
  researchKeepReady,
  type GameState,
} from "@second-crown/sim";
import "./academy-pace.css";

type ResearchId = keyof typeof RESEARCH;

/** Sim ticks to whole seconds, same rounding as StudyLine (10 ticks per second). */
function secs(ticks: number): number {
  return Math.ceil(ticks / 10);
}

/** True when the sim's researchDuration runs shorter than the table ticks (Academy rate active). */
export function academyRateOn(state: GameState): boolean {
  const id = Object.keys(RESEARCH)[0] as ResearchId;
  return researchDuration(state, id) < RESEARCH[id].ticks;
}

/** Academy rate label, same wording as the keep hall lectern bonus. */
export function academyRateText(): string {
  return `new studies ${Math.round((1 - LECTERN_STUDY_MULT) * 100)}% shorter`;
}

/** First study in table order that an Academy can open and is not known yet. Read-only. */
export function nextAcademyUnlock(state: GameState): { id: ResearchId; keepMin: number; keepReady: boolean } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const id = ids.find(
    (k) => (RESEARCH[k].needsAny as readonly string[]).includes("academy") && !researchDone(state, k),
  );
  if (!id) return null;
  return { id, keepMin: researchKeepMin(id), keepReady: researchKeepReady(state, id) };
}

export function AcademyPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const on = academyRateOn(state);
  const next = nextAcademyUnlock(state);
  return (
    <p className={`sc-academy-pace${on ? " is-on" : ""}`} data-academy={on ? "on" : "off"}>
      Academy · <strong>{on ? academyRateText() : "no Academy, base rate"}</strong>
      {next ? (
        <>
          {" "}· next academy study <strong>{RESEARCH[next.id].name}</strong> ({secs(researchDuration(state, next.id))}s)
          {next.keepReady ? "" : ` · needs Keep ${"I".repeat(next.keepMin)}`}
        </>
      ) : (
        " · every academy study known"
      )}
      .
    </p>
  );
}
