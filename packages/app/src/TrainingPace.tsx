import React from "react";
import { listUnitTypes, trainDurationTicks, unitUnlocked, type GameState } from "@second-crown/sim";
import "./training-pace.css";

/** Batch the pace line reports: ten militia, same as the x10 levy button. */
export const PACE_UNIT = "militia";
export const PACE_COUNT = 10;

/** Where each locked unit is opened. Shared with the Army tab unit cards. */
export function lockNote(id: string): string {
  if (id === "cavalry" || id === "knight") return "Study Horse lore on Crown (Keep II).";
  if (id === "siege") return "Study Siege craft on Crown (Keep III + workshop).";
  if (id === "ranger") return "Study Fieldcraft on Crown (Archery Range or Academy).";
  if (id === "banner") return "Study Drill on Crown (Barracks or Academy).";
  if (id === "outrider") return "Study Horse lore on Crown (Keep II).";
  if (id === "warden") return "Study Screening on Crown (Barracks or Academy).";
  if (id === "lancer") return "Study Horse lore on Crown (Keep II).";
  return "";
}

/** Sim ticks to whole seconds (10 ticks per second), same rounding as the unit cards. */
function secs(ticks: number): number {
  return Math.ceil(ticks / 10);
}

/** Current and base drill time for the pace batch, both straight from the sim. Read-only. */
export function trainingPace(state: GameState): { now: number; base: number } {
  const def = listUnitTypes().find((u) => u.id === PACE_UNIT);
  const now = trainDurationTicks(state, PACE_UNIT, PACE_COUNT);
  return { now, base: def ? def.trainTicks * PACE_COUNT : now };
}

/** First unit in roster order that the sim still keeps locked. Read-only. */
export function nextUnitUnlock(state: GameState): { id: string; name: string; note: string } | null {
  const u = listUnitTypes().find((t) => !unitUnlocked(state, t.id));
  return u ? { id: u.id, name: u.name, note: lockNote(u.id) } : null;
}

export function TrainingPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const { now, base } = trainingPace(state);
  const fast = now < base;
  const next = nextUnitUnlock(state);
  return (
    <p className={`sc-training-pace${fast ? " is-fast" : ""}`} data-training={fast ? "fast" : "base"}>
      Training · <strong>{PACE_COUNT} militia in {secs(now)}s</strong>
      {fast ? ` (base ${secs(base)}s)` : " (base rate)"}
      {next ? (
        <>
          {" "}· next unit <strong>{next.name}</strong>
          {next.note ? ` · ${next.note.replace(/\.$/, "")}` : ""}
        </>
      ) : (
        " · every unit unlocked"
      )}
      .
    </p>
  );
}
