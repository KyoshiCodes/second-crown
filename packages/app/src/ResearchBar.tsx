import React from "react";
import {
  RESEARCH,
  countBuilding,
  researchDone,
  researchDuration,
  researchKeepMin,
  researchKeepReady,
  researchTicksLeft,
  tryCancelResearch,
  tryStartResearch,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import type { ActFn } from "./game/useGameEngine";
import { InhabitedOverlay } from "./hud/InhabitedOverlay";
import { ScrollPip } from "./hud/ScrollPip";
import "./hud/button-pips.css";

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
  if (done) {
    return (
      <div title={effect} className="sc-study-row">
        <ScrollPip size={16} status="claimed" />
        <span>{label} known.{effect ? ` ${effect}` : ""}</span>
      </div>
    );
  }
  if (left > 0) {
    return (
      <div className="sc-study-row">
        <ScrollPip size={16} status="ready" />
        <span>Studying {label.toLowerCase()} · {Math.ceil(left / 10)}s left{" "}</span>
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
  const seconds = Math.round(researchDuration(state, id) / TICKS_PER_SECOND);
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
      className="sc-btn-with-pip sc-study-btn"
    >
      <ScrollPip size={16} status="open" />
      <span>Study {label.toLowerCase()} ({cost}; {buildings.join(" or ")}{gate}; {seconds}s)</span>
    </button>
  );
}

export function ResearchBar(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
  const open = ids.find((id) => researchTicksLeft(state, id) > 0);
  const known = ids.filter((id) => researchDone(state, id)).map((id) => RESEARCH[id].name);
  const academy = countBuilding(state, "academy");
  return (
    <div
      className="sc-realm-card sc-research-lectern"
      style={{ fontSize: 13, margin: "6px 0 10px", position: "relative", overflow: "hidden" }}
    >
      <InhabitedOverlay motesCount={18} candleAnchor="top-right" />
      <p style={{ margin: "0 0 8px", opacity: 0.85, position: "relative", zIndex: 1 }}>
        Lectern {open ? `· studying ${RESEARCH[open].name} (${Math.ceil(researchTicksLeft(state, open) / 10)}s)` : "· idle (one study at a time)"}.
        {known.length > 0 ? ` Known: ${known.join(", ")}.` : " Nothing known yet."}
        {academy < 1
          ? " Raise an Academy on Kingdom — it counts as a hall for every study (farm/camp still work for early ones)."
          : ` Academy x${academy} covers every lectern hall.`}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, position: "relative", zIndex: 1 }}>
        {ids.map((id) => (
          <Row key={id} state={state} act={act} id={id} />
        ))}
      </div>
    </div>
  );
}
