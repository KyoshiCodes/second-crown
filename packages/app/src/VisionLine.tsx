import React from "react";
import { rimWatchtowers, scoutCost, visionRange, type GameState } from "@second-crown/sim";

export function VisionLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const range = visionRange(state);
  const towers = rimWatchtowers(state);
  const cost = scoutCost(state);
  return (
    <p style={{ fontSize: 12, opacity: 0.85 }}>
      Vision {range} · Watchtowers {towers} · Scout {cost} gold.
    </p>
  );
}
