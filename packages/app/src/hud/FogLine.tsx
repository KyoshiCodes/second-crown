import React from "react";
import { getProvince, isProvinceSeen, neighbors, scoutCost, visionRange, type GameState } from "@second-crown/sim";
import "./fog-line.css";

/**
 * Fog status for the selected province on the inspect card.
 * Display only: every answer comes from the sim's own helpers (`isProvinceSeen`,
 * `visionRange`, `neighbors`, `scoutCost`). No fog rule is decided here and nothing is written.
 */

export type FogStatus = {
  /** True when the sim says the tile is in sight. */
  seen: boolean;
  /** "Clear" or "Hidden". */
  label: string;
  /** Hold vision range, straight from the sim. */
  range: number;
  /** Grid steps from the home hold to this tile (0 on the hold itself). */
  steps: number;
  /** Tiles the player can see now, and the board total. */
  seenTiles: number;
  totalTiles: number;
  /** Neighbouring tiles still under fog. Always 0 for an unseen tile. */
  fogSides: number;
  /** One short line on why the tile is clear or hidden. */
  reason: string;
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Fog facts for one province. Null when the id is unknown. */
export function fogStatus(state: GameState, provinceId: string): FogStatus | null {
  const p = getProvince(state, provinceId);
  if (!p) return null;
  const home = getProvince(state, state.board.homeProvinceId);
  const seen = isProvinceSeen(state, provinceId);
  const range = visionRange(state);
  const steps = home ? Math.abs(p.x - home.x) + Math.abs(p.y - home.y) : 0;
  const totalTiles = state.board.provinces.length;
  const seenTiles = state.board.provinces.filter((t) => isProvinceSeen(state, t.id)).length;
  const fogSides = seen ? neighbors(state, provinceId).filter((n) => !isProvinceSeen(state, n.id)).length : 0;
  let reason: string;
  if (provinceId === state.board.homeProvinceId) reason = "Your hold is always in sight";
  else if (seen && steps <= range) reason = "Inside your hold's vision";
  else if (seen) reason = "Past your hold's vision: scouted, or watched from a flag";
  else if (steps <= range) reason = "Inside your range, but the weather thickens the fog";
  else reason = `${plural(steps - range, "step", "steps")} past your hold's vision`;
  return { seen, label: seen ? "Clear" : "Hidden", range, steps, seenTiles, totalTiles, fogSides, reason };
}

/** Inspect-card block: a one-line fog status that opens to the vision details. */
export function FogLine(props: { state: GameState | undefined; provinceId: string | null }) {
  const { state, provinceId } = props;
  if (!state || !provinceId) return null;
  const status = fogStatus(state, provinceId);
  if (!status) return null;
  const home = provinceId === state.board.homeProvinceId;
  return (
    <details
      className={`sc-fog-line ${status.seen ? "is-clear" : "is-hidden"}`}
      data-fog={status.seen ? "off" : "on"}
      data-vision-range={status.range}
      open
    >
      <summary className="sc-fog-head" title="Show or hide the vision details">
        <span className="sc-fog-pip" aria-hidden="true" />
        <span className="sc-fog-label">Fog</span>
        <span className="sc-fog-summary">
          {status.label} · Vision {status.range}
        </span>
      </summary>
      <ul className="sc-fog-list">
        <li className="sc-fog-item is-reason">{status.reason}</li>
        {home ? null : (
          <li className="sc-fog-item is-steps">
            {plural(status.steps, "step", "steps")} from your hold · hold sees {plural(status.range, "step", "steps")}
          </li>
        )}
        {status.fogSides > 0 ? (
          <li className="sc-fog-item is-edge">Fog on {plural(status.fogSides, "side", "sides")} of this tile</li>
        ) : null}
        {status.seen ? null : (
          <li className="sc-fog-item is-scout">A scout column lifts it ({scoutCost(state)} gold)</li>
        )}
        <li className="sc-fog-item is-board">
          Board: {status.seenTiles} of {status.totalTiles} tiles in sight
        </li>
      </ul>
    </details>
  );
}
