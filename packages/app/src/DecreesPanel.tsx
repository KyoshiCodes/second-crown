import React from "react";
import {
  DECREES,
  tryOpenRoute,
  routeGoldPerTick,
  tryCollectTithe,
  titheTicksLeft,
  countBuilding,
  tryBanquet,
  banquetTicksLeft,
  tryFortify,
  fortifyTicksLeft,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { DecreeCard } from "./hud/DecreeCard";

export function DecreesPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const routes = state ? routeGoldPerTick(state) : 0;
  const chapels = state ? countBuilding(state, "chapel") : 0;
  const titheWait = state ? titheTicksLeft(state) : 0;
  const banquetWait = state ? banquetTicksLeft(state) : 0;
  const fortWait = state ? fortifyTicksLeft(state) : 0;
  return (
    <div style={{ margin: "12px 0" }}>
      <h3>Royal decrees</h3>
      <p style={{ fontSize: 12, opacity: 0.7 }}>Spend stores for a short age bonus. One of each at a time.</p>
      <div className="sc-decree-grid">
        {DECREES.map((d) => (
          <DecreeCard key={d.id} state={state} decree={d} act={act} />
        ))}
      </div>
      <h3>Court</h3>
      <button
        type="button"
        disabled={!state || banquetWait > 0}
        onClick={() => act((st) => (tryBanquet(st) ? "The hall drinks. Opinions ease." : "Need 25 food and 10 gold, or the hall is spent."))}
      >
        {banquetWait > 0 ? `Banquet in ${Math.ceil(banquetWait / 10)}s` : "Hold banquet (25 food, 10 gold, +5 opinion)"}
      </button>
      <button
        type="button"
        disabled={!state || fortWait > 0}
        onClick={() => act((st) => (tryFortify(st) ? "Palisades up. +6 power." : "Need 20 stone, or walls already stand."))}
      >
        {fortWait > 0 ? `Fortify ${Math.ceil(fortWait / 10)}s left` : "Fortify (20 stone, +6 power ~40s)"}
      </button>
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
