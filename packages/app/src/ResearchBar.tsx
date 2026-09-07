import React from "react";
import {
  countBuilding,
  researchDone,
  researchTicksLeft,
  tryStartResearch,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function ResearchBar(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const hasHall = countBuilding(state, "barracks") > 0;
  const done = researchDone(state, "horse");
  const left = researchTicksLeft(state, "horse");
  return (
    <div style={{ fontSize: 13, margin: "6px 0 10px" }}>
      {done ? (
        <span>Horse lore known. Cavalry and knights may train.</span>
      ) : left > 0 ? (
        <span>Studying horse lore · {Math.ceil(left / 10)}s left</span>
      ) : (
        <button
          type="button"
          disabled={!hasHall}
          onClick={() =>
            act((s) =>
              tryStartResearch(s, "horse")
                ? "Scribes begin horse lore (24s)."
                : "Need a finished barracks, 40 gold, and 24 wood."
            )
          }
        >
          Study horse lore (40 gold, 24 wood, barracks)
        </button>
      )}
    </div>
  );
}
