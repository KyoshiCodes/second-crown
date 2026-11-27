import React from "react";
import {
  researchDetailSnapshot,
  studyEffectPreviewSnapshot,
  type GameState,
  type ResearchDetail,
  type StudyEffectPreview,
} from "@second-crown/sim";
import "./research-detail.css";
import "./study-effect-preview.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `researchDetailSnapshot(state)`.
 * Returns `null` when `living_research_detail` is off or state is partial.
 */
export function resolveResearchDetail(
  state: GameState | null | undefined,
): ResearchDetail | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  try {
    return researchDetailSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Defensive pure reader over `@second-crown/sim`'s `studyEffectPreviewSnapshot(state, studyId)`.
 * Returns `null` for unknown ids, partial state, or when `living_study_preview` is off.
 */
export function resolveStudyEffectPreview(
  state: GameState | null | undefined,
  studyId: string,
): StudyEffectPreview | null {
  if (!state?.flags) {
    return null;
  }
  try {
    return studyEffectPreviewSnapshot(state, studyId);
  } catch {
    return null;
  }
}

/**
 * Calm collapsed-by-default next-unlocks expander under `<ResearchProgressLine>`.
 * Includes optional quiet effect previews from `studyEffectPreviewSnapshot`.
 * Hides cleanly when `nextUnlocks` is empty or `living_research_detail` is off.
 */
export const ResearchDetailExpander: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveResearchDetail(state);
  if (!snap || snap.nextUnlocks.length === 0) return null;

  return (
    <details
      className="sc-research-detail"
      data-research-unlocks={snap.nextUnlocks.length}
      data-research-known-detail={snap.completed.length}
    >
      <summary className="sc-research-detail-toggle">
        <span className="sc-research-detail-pip" aria-hidden="true" />
        <span>Next unlocks ({snap.nextUnlocks.length})</span>
      </summary>
      <div className="sc-research-detail-list">
        {snap.nextUnlocks.map((u) => {
          const ready = u.requires.length === 0;
          const preview = resolveStudyEffectPreview(state, u.id);
          const previewText =
            preview && preview.effects.length > 0
              ? preview.effects.join(" · ")
              : null;
          return (
            <div
              key={u.id}
              className="sc-research-detail-item"
              data-unlock-id={u.id}
              data-unlock-ready={ready ? "true" : "false"}
              title={previewText ?? undefined}
            >
              <span className="sc-research-detail-name">{u.name}</span>
              <span
                className={`sc-research-detail-gate${ready ? " is-ready" : ""}`}
              >
                {ready ? "ready" : `needs ${u.requires.join(", ")}`}
              </span>
              {previewText ? (
                <span className="sc-study-preview" data-preview-id={u.id}>
                  <span className="sc-study-preview-pip" aria-hidden="true" />
                  <span>{previewText}</span>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
};
