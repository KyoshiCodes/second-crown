import React from "react";
import {
  academyFeedbackSnapshot,
  type AcademyFeedback,
  type GameState,
} from "@second-crown/sim";
import "./academy-feedback.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `academyFeedbackSnapshot(state)`.
 * Returns `null` when the player has no Academy, `living_academy_feedback` is off, or state is partial.
 */
export function resolveAcademyFeedback(
  state: GameState | null | undefined,
): AcademyFeedback | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  try {
    return academyFeedbackSnapshot(state);
  } catch {
    return null;
  }
}

function academyBadge(snap: AcademyFeedback): { label: string; tone: string } {
  if (!snap.built) return { label: "building", tone: "is-building" };
  if (snap.bonusActive && snap.staffed) {
    return { label: "staffed · bonus active", tone: "is-bonus" };
  }
  if (snap.bonusActive) return { label: "bonus active", tone: "is-bonus" };
  if (snap.staffed) return { label: "staffed", tone: "is-staffed" };
  return { label: "idle", tone: "is-idle" };
}

/**
 * Quiet sub-line under `<ResearchProgressLine>` showing staffed / bonus / idle Academy state
 * and contextual note from `academyFeedbackSnapshot(state)`. Hides cleanly when null.
 */
export const AcademyFeedbackLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveAcademyFeedback(state);
  if (!snap) return null;

  const badge = academyBadge(snap);

  return (
    <div
      className="sc-academy-feedback"
      data-academy-built={snap.built ? "true" : "false"}
      data-academy-staffed={snap.staffed ? "true" : "false"}
      data-academy-bonus={snap.bonusActive ? "true" : "false"}
    >
      <span className={`sc-academy-pip ${badge.tone}`} aria-hidden="true" />
      <span className="sc-academy-label">Academy:</span>
      <span className="sc-academy-status">{badge.label}</span>
      {snap.note ? (
        <span className="sc-academy-note">· {snap.note}</span>
      ) : null}
    </div>
  );
};
