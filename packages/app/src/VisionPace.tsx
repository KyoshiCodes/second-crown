import React from "react";
import {
  buildTicksLeft,
  keepLevel,
  keepVisionCultureBonus,
  listWorksInProgress,
  researchTicksLeft,
  visionRange,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./vision-pace.css";

/** The next queued event that changes hold vision. Read-only. */
export interface VisionChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** What lands. */
  source: "watchtower" | "surveying" | "keep";
}

/**
 * Earliest queued event that feeds `visionRange`: a player watchtower under construction,
 * the Surveying study on the lectern, or a first keep finishing when the culture grants keep vision.
 * Reads only sim helpers. Ties go in that order.
 */
export function nextVisionChange(state: GameState): VisionChange | null {
  const found: VisionChange[] = [];
  for (const b of listWorksInProgress(state, "player")) {
    if (b.typeId === "watchtower") found.push({ ticks: buildTicksLeft(state, b.id), source: "watchtower" });
  }
  const survey = researchTicksLeft(state, "surveying");
  if (survey > 0) found.push({ ticks: survey, source: "surveying" });
  if (keepLevel(state) === 0 && keepVisionCultureBonus(state, "player") > 0) {
    for (const b of listWorksInProgress(state, "player")) {
      if (b.typeId === "keep") found.push({ ticks: buildTicksLeft(state, b.id), source: "keep" });
    }
  }
  if (!found.length) return null;
  return found.reduce((a, b) => (b.ticks < a.ticks ? b : a));
}

const LABEL: Record<VisionChange["source"], string> = {
  watchtower: "a watchtower finishes",
  surveying: "Surveying study finishes",
  keep: "the keep finishes (culture keep vision)",
};

/** Sim ticks to whole seconds, same rounding as the build queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export function VisionPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const range = visionRange(state);
  const next = nextVisionChange(state);
  return (
    <p className={`sc-vision-pace${next ? " is-rising" : ""}`} data-vision={next ? next.source : "steady"}>
      Vision pace · <strong>range {range}</strong>
      {next ? (
        <>
          {" "}· next change in <strong>{secs(next.ticks)}s</strong>: {LABEL[next.source]}
        </>
      ) : (
        " · no change queued"
      )}
      .
    </p>
  );
}
