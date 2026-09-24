import React from "react";
import {
  currentTutorial,
  skipTutorial,
  tryAdvanceTutorial,
  tutorialIndex,
  TUTORIAL_STEPS,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { ResearchBar } from "./ResearchBar";

const TAB_HINT: Record<string, string> = {
  kingdom: "Open Kingdom.",
  army: "Open Army.",
  war: "Open War.",
  crown: "Open Crown.",
  board: "Use the map / Board.",
};

export function TutorialBanner(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const step = state ? currentTutorial(state) : null;
  const n = state ? tutorialIndex(state) + 1 : 0;
  return (
    <>
      {state && step ? (
        <div className="sc-primer-banner">
          {/* Royal Wax Seal */}
          <div className="sc-wax-seal" title="Royal Charter Seal" aria-hidden="true">
            <div className="sc-wax-seal-inner">👑</div>
          </div>

          <strong style={{ color: "#fef3c7", fontSize: 13.5, letterSpacing: 0.3 }}>
            Primer {n}/{TUTORIAL_STEPS.length}
          </strong>
          <div style={{ opacity: 0.85, marginTop: 2, color: "#fde047", fontSize: 12 }}>{TAB_HINT[step.tab] ?? ""}</div>
          <div style={{ marginTop: 5, color: "#e2e8f0", lineHeight: 1.45 }}>{step.text}</div>
          <div className="sc-primer-actions">
            <button
              type="button"
              className="sc-primer-btn-done"
              onClick={() => act((st) => (tryAdvanceTutorial(st) ? "Primer advanced." : "Not yet — finish this step."))}
            >
              Done with this step
            </button>
            <button
              type="button"
              className="sc-primer-btn-skip"
              onClick={() =>
                act((st) => {
                  skipTutorial(st);
                  return "Primer skipped.";
                })
              }
            >
              Skip primer
            </button>
          </div>
        </div>
      ) : null}
      <ResearchBar state={state} act={act} />
    </>
  );
}
