import React from "react";
import {
  countBuilding,
  researchDone,
  researchTicksLeft,
  tryStartResearch,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

function Row(props: {
  state: GameState;
  act: ActFn;
  id: "horse" | "siege";
  label: string;
  need: string;
  needCount: number;
  hint: string;
}) {
  const { state, act, id, label, need, needCount, hint } = props;
  const done = researchDone(state, id);
  const left = researchTicksLeft(state, id);
  if (done) return <div>{label} known.</div>;
  if (left > 0) return <div>Studying {label.toLowerCase()} · {Math.ceil(left / 10)}s left</div>;
  return (
    <button
      type="button"
      disabled={needCount < 1}
      onClick={() =>
        act((s) => (tryStartResearch(s, id) ? `Scribes begin ${label.toLowerCase()}.` : hint))
      }
    >
      Study {label.toLowerCase()} ({need})
    </button>
  );
}

export function ResearchBar(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  return (
    <div style={{ fontSize: 13, margin: "6px 0 10px", display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Row
        state={state}
        act={act}
        id="horse"
        label="Horse lore"
        need="40g 24w, barracks"
        needCount={countBuilding(state, "barracks")}
        hint="Need a barracks, 40 gold, 24 wood, and a free study slot."
      />
      <Row
        state={state}
        act={act}
        id="siege"
        label="Siege craft"
        need="70g 40w 30s, workshop"
        needCount={countBuilding(state, "siege_workshop")}
        hint="Need a siege workshop, 70 gold, 40 wood, 30 stone, and a free study slot."
      />
    </div>
  );
}
