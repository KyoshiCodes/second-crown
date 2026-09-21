import React from "react";
import {
  RESEARCH,
  countBuilding,
  researchDone,
  researchKeepMin,
  researchKeepReady,
  researchTicksLeft,
  tryCancelResearch,
  tryStartResearch,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

function needList(def: { needs?: string; needsAny?: readonly string[] }): string[] {
  if (def.needsAny && def.needsAny.length) return [...def.needsAny];
  if (def.needs) return [def.needs];
  return [];
}

function Row(props: { state: GameState; act: ActFn; id: keyof typeof RESEARCH }) {
  const { state, act, id } = props;
  const def = RESEARCH[id];
  const done = researchDone(state, id);
  const left = researchTicksLeft(state, id);
  const buildings = needList(def);
  const hasHall = buildings.some((b) => countBuilding(state, b) > 0);
  const keepOk = researchKeepReady(state, id);
  const keepNeed = researchKeepMin(id);
  const label = def.name;
  const effect = "effect" in def ? String(def.effect) : "";
  if (done) return <div title={effect}>{label} known.{effect ? ` ${effect}` : ""}</div>;
  if (left > 0) {
    return (
      <div>
        Studying {label.toLowerCase()} · {Math.ceil(left / 10)}s left{" "}
        <button
          type="button"
          onClick={() =>
            act((s) => (tryCancelResearch(s, id) ? `Called off ${label.toLowerCase()}.` : "Nothing to cancel."))
          }
        >
          Cancel
        </button>
      </div>
    );
  }
  const cost = Object.entries(def.cost).map(([k, v]) => `${v} ${k}`).join(", ");
  const gate = keepNeed > 0 ? `; Keep ${keepNeed}` : "";
  return (
    <button
      type="button"
      disabled={!hasHall || !keepOk}
      title={effect}
      onClick={() =>
        act((s) =>
          tryStartResearch(s, id)
            ? `Scribes begin ${label.toLowerCase()}.`
            : `Need ${buildings.join(" or ")}${keepNeed ? `, Keep ${keepNeed}` : ""}, ${cost}, and a free study slot.`
        )
      }
    >
      Study {label.toLowerCase()} ({cost}; {buildings.join(" or ")}{gate})
    </button>
  );
}

export function ResearchBar(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
  const open = ids.find((id) => researchTicksLeft(state, id) > 0);
  const known = ids.filter((id) => researchDone(state, id)).map((id) => RESEARCH[id].name);
  return (
    <div className="sc-realm-card sc-research-lectern" style={{ fontSize: 13, margin: "6px 0 10px" }}>
      <p style={{ margin: "0 0 8px", opacity: 0.85 }}>
        Lectern {open ? `· studying ${RESEARCH[open].name} (${Math.ceil(researchTicksLeft(state, open) / 10)}s)` : "· idle (one study at a time)"}.
        {known.length > 0 ? ` Known: ${known.join(", ")}.` : " Nothing known yet."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ids.map((id) => (
          <Row key={id} state={state} act={act} id={id} />
        ))}
      </div>
    </div>
  );
}
