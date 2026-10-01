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
import "./hud/plain-buttons.css";

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
      <div className="sc-plain-grid">
        <div className={`sc-work-card sc-plain-card ${banquetWait > 0 ? "" : "is-ready"}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Banquet</span>
          </div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!state || banquetWait > 0}
              onClick={() => act((st) => (tryBanquet(st) ? "The hall drinks. Opinions ease." : "Need 25 food and 10 gold, or the hall is spent."))}
            >
              {banquetWait > 0 ? `Banquet in ${Math.ceil(banquetWait / 10)}s` : "Hold banquet (25 food, 10 gold, +5 opinion)"}
            </button>
          </div>
        </div>
        <div className={`sc-work-card sc-plain-card ${fortWait > 0 ? "is-done" : "is-ready"}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Fortify</span>
          </div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!state || fortWait > 0}
              onClick={() => act((st) => (tryFortify(st) ? "Palisades up. +6 power." : "Need 20 stone, or walls already stand."))}
            >
              {fortWait > 0 ? `Fortify ${Math.ceil(fortWait / 10)}s left` : "Fortify (20 stone, +6 power ~40s)"}
            </button>
          </div>
        </div>
        <div className={`sc-work-card sc-plain-card ${routes >= 3 ? "is-done" : "is-ready"}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Trade routes</span>
            <span className="sc-work-level">{routes}/3</span>
          </div>
          <div className="sc-work-status">Routes {routes}/3 - each pays 1 gold per tick.</div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!state || routes >= 3}
              onClick={() => act((st) => (tryOpenRoute(st) ? "Caravan opened." : "Need 25 gold, or three routes already run."))}
            >
              Open route (25 gold)
            </button>
          </div>
        </div>
        <div className={`sc-work-card sc-plain-card ${chapels > 0 && titheWait <= 0 ? "is-ready" : ""}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Chapel tithe</span>
          </div>
          <div className="sc-work-status">{chapels < 1 ? "Build a Chapel on the map." : `Chapels x${chapels}. Tithe is ${chapels * 8} gold.`}</div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!state || chapels < 1 || titheWait > 0}
              onClick={() => act((st) => (tryCollectTithe(st) ? "Tithe collected." : "No chapel, or the plate was just passed."))}
            >
              {titheWait > 0 ? `Tithe in ${Math.ceil(titheWait / 10)}s` : "Collect tithe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
