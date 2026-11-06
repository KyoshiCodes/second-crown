import React from "react";
import { buildTicksLeft, listWorksInProgress, wallHp, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./wall-pace.css";

/** The next queued event that changes hold wall strength. Read-only. */
export interface WallChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** What lands. */
  source: "walls" | "gate";
}

/**
 * Earliest queued event that feeds `wallHp`: a player wall section or gate under construction.
 * Reads only sim helpers. Ties go walls, then gate.
 */
export function nextWallChange(state: GameState): WallChange | null {
  const found: WallChange[] = [];
  for (const b of listWorksInProgress(state, "player")) {
    if (b.typeId === "walls" || b.typeId === "gate") {
      found.push({ ticks: buildTicksLeft(state, b.id), source: b.typeId });
    }
  }
  if (!found.length) return null;
  return found.reduce((a, b) => (b.ticks < a.ticks || (b.ticks === a.ticks && b.source === "walls" && a.source === "gate") ? b : a));
}

const LABEL: Record<WallChange["source"], string> = {
  walls: "a wall section finishes",
  gate: "the gate finishes",
};

/** Sim ticks to whole seconds, same rounding as the build queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export function WallPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const hp = wallHp(state, "player");
  const next = nextWallChange(state);
  return (
    <p className={`sc-wall-pace${next ? " is-rising" : ""}`} data-wall={next ? next.source : "steady"}>
      Wall pace · <strong>wall HP {hp}</strong>
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
