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

export function TutorialBanner(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const step = currentTutorial(state);
  if (!step) return null;
  const n = tutorialIndex(state) + 1;
  return (
    <div
      style={{
        margin: "8px 0",
        padding: "8px 10px",
        background: "rgba(18,12,8,0.92)",
        border: "1px solid #c8963e",
        borderRadius: 6,
        fontSize: 13,
      }}
    >
      <strong>
        Primer {n}/{TUTORIAL_STEPS.length}
      </strong>
      <div style={{ marginTop: 4 }}>{step.text}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" onClick={() => act((st) => (tryAdvanceTutorial(st) ? "Primer advanced." : "Not yet — finish this step."))}>
          Done with this step
        </button>
        <button type="button" onClick={() => act((st) => {
          skipTutorial(st);
          return "Primer skipped.";
        })}>
          Skip primer
        </button>
      </div>
    </div>
  );
}
