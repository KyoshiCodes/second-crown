import React from "react";
import { armyMouths, listHealing, listTraining, upkeepPerTick, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./upkeep-pace.css";

/** The next queued event that adds mouths to the army. Read-only. */
export interface UpkeepChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** Mouths it adds. */
  mouths: number;
  /** Unit type that arrives. */
  typeId: string;
  /** Where it comes from. */
  source: "training" | "healing";
}

/**
 * Earliest of the player's next training job and next healed wounded.
 * Uses only the sim's own queues (`listTraining`, `listHealing`). Training wins a tie.
 */
export function nextUpkeepChange(state: GameState): UpkeepChange | null {
  const now = state.meta.tick;
  const jobs = listTraining(state, "player").filter((j) => j.typeId !== "champion");
  const train = jobs.length ? jobs.reduce((a, b) => (b.doneTick < a.doneTick ? b : a)) : null;
  const heals = listHealing(state);
  const healTick = heals.length ? Math.min(...heals.map((h) => h.doneTick)) : null;
  if (train && (healTick === null || train.doneTick <= healTick)) {
    return { ticks: Math.max(0, train.doneTick - now), mouths: train.count, typeId: train.typeId, source: "training" };
  }
  if (healTick !== null) {
    return { ticks: Math.max(0, healTick - now), mouths: 1, typeId: "militia", source: "healing" };
  }
  return null;
}

/** Sim ticks to whole seconds, same rounding as the barracks queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export function UpkeepPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const mouths = armyMouths(state);
  const perTick = upkeepPerTick(state);
  const perSec = perTick * TICKS_PER_SECOND;
  const next = nextUpkeepChange(state);
  return (
    <p className={`sc-upkeep-pace${next ? " is-rising" : ""}`} data-upkeep={next ? "rising" : "steady"}>
      Upkeep · <strong>{perTick.toFixed(2)} food/tick</strong> ({perSec.toFixed(1)}/s, {mouths} mouths)
      {next ? (
        <>
          {" "}· next change in <strong>{secs(next.ticks)}s</strong>: +{next.mouths} {next.typeId}
          {next.source === "healing" ? " from the infirmary" : " from the barracks"}
        </>
      ) : (
        " · no change queued"
      )}
      .
    </p>
  );
}
