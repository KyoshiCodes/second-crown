import React from "react";
import {
  trainingProgressSnapshot,
  type GameState,
  type TrainingProgress,
} from "@second-crown/sim";
import "./training-progress.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `trainingProgressSnapshot(state)`.
 * Returns `null` with no finished Barracks, `living_training_progress` off, or partial state.
 */
export function resolveTrainingProgress(
  state: GameState | null | undefined,
): TrainingProgress | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  try {
    return trainingProgressSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Quiet Army tab training progress bar & queue count reading `trainingProgressSnapshot(state)`.
 * Hides cleanly when `null` or `living_training_progress` is off.
 */
export const TrainingProgressLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveTrainingProgress(state);
  if (!snap) return null;

  const pct =
    snap.active && snap.active.totalTicks > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.floor(
              ((snap.active.totalTicks - snap.active.ticksLeft) /
                snap.active.totalTicks) *
                100,
            ),
          ),
        )
      : 0;
  const secsLeft = snap.active
    ? Math.max(0, Math.ceil(snap.active.ticksLeft / 10))
    : 0;

  return (
    <div
      className="sc-train-progress-line"
      data-train-active={snap.active?.id ?? "idle"}
      data-train-queued={snap.queue.length}
    >
      <span
        className={`sc-train-progress-pip ${snap.active ? "is-active" : "is-idle"}`}
        aria-hidden="true"
      />
      {snap.active ? (
        <>
          <span className="sc-train-progress-name">{snap.active.name}</span>
          <span className="sc-train-progress-track" aria-hidden="true">
            <span
              className="sc-train-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="sc-train-progress-eta">
            ~{secsLeft}s ({snap.active.ticksLeft}t)
          </span>
          {snap.queue.length > 0 ? (
            <span className="sc-train-progress-queue">
              +{snap.queue.length} queued
            </span>
          ) : null}
        </>
      ) : null}
      {snap.note ? (
        <span className="sc-train-progress-note">{snap.note}</span>
      ) : null}
    </div>
  );
};
