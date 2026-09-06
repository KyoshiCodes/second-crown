import React from "react";
import {
  DECREES,
  decreeUntil,
  tryDecree,
  tryOpenRoute,
  routeGoldPerTick,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function DecreesPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const routes = state ? routeGoldPerTick(state) : 0;
  return (
    <div style={{ margin: "12px 0" }}>
      <h3>Royal decrees</h3>
      <p style={{ fontSize: 12, opacity: 0.7 }}>Spend stores for a short age bonus. One of each at a time.</p>
      {DECREES.map((d) => {
        const left = state ? decreeUntil(state, d.id) : 0;
        return (
          <button
            key={d.id}
            type="button"
            disabled={!state || left > 0}
            onClick={() => act((st) => (tryDecree(st, d.id) ? `${d.name} sworn.` : "Cannot afford, or already active."))}
          >
            {left > 0 ? `${d.name} (${Math.ceil(left / 10)}s left)` : `${d.name} - ${d.blurb}`}
          </button>
        );
      })}
      <h3>Trade routes</h3>
      <p style={{ fontSize: 12 }}>Routes {routes}/3 — each pays 1 gold per tick.</p>
      <button
        type="button"
        disabled={!state || routes >= 3}
        onClick={() => act((st) => (tryOpenRoute(st) ? "Caravan opened." : "Need 25 gold, or three routes already run."))}
      >
        Open route (25 gold)
      </button>
    </div>
  );
}
