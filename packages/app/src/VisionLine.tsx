import React from "react";
import { rimWatchtowers, scoutCost, visionRange, type GameState } from "@second-crown/sim";
import { VisionPip } from "./hud/VisionPip";

export function VisionLine(props: { state: GameState | undefined; showPip?: boolean }) {
  const { state, showPip = true } = props;
  if (!state) return null;
  const range = visionRange(state);
  const towers = rimWatchtowers(state);
  const cost = scoutCost(state);
  return (
    <p style={{ fontSize: 12, opacity: 0.85, display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
      {showPip ? <VisionPip range={range} towers={towers} cost={cost} size={20} /> : null}
      <span>
        Vision {range} · Watchtowers {towers} · Scout {cost} gold.
      </span>
    </p>
  );
}
