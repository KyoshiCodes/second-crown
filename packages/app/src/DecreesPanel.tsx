import React from "react";
import {
  DECREES,
  decreeUntil,
  tryDecree,
  tryOpenRoute,
  routeGoldPerTick,
  tryCollectTithe,
  titheTicksLeft,
  countBuilding,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function DecreesPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const routes = state ? routeGoldPerTick(state) : 0;
  const chapels = state ? countBuilding(state, "chapel") : 0;
  const titheWait = state ? titheTicksLeft(state) : 0;
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
      <p style={{ fontSize: 12 }}>Routes {routes}/3 - each pays 1 gold per tick.</p>
      <button
        type="button"
        disabled={!state || routes >= 3}
        onClick={() => act((st) => (tryOpenRoute(st) ? "Caravan opened." : "Need 25 gold, or three routes already run."))}
      >
        Open route (25 gold)
      </button>
      <h3>Chapel tithe</h3>
      <p style={{ fontSize: 12 }}>{chapels < 1 ? "Build a Chapel on the map." : `Chapels x${chapels}. Tithe is ${chapels * 8} gold.`}</p>
      <button
        type="button"
        disabled={!state || chapels < 1 || titheWait > 0}
        onClick={() => act((st) => (tryCollectTithe(st) ? "Tithe collected." : "No chapel, or the plate was just passed."))}
      >
        {titheWait > 0 ? `Tithe in ${Math.ceil(titheWait / 10)}s` : "Collect tithe"}
      </button>
    </div>
  );
}
