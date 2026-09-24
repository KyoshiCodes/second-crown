import React from "react";
import {
  adjacencyBonus,
  getBuildingType,
  keepBonus,
  pairBonus,
  staffBonus,
  tryDemolish,
  tryRepair,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";

type Building = GameState["buildings"][number];

/** One finished (or scarred) player work on the Kingdom tab. Reads sim, never writes outside `act`. */
export function WorkCard(props: { state: GameState; b: Building; scarred: boolean; act: ActFn }) {
  const { state, b, scarred, act } = props;
  const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
  const pct = (n: number) => Math.round((n - 1) * 100);
  const staff = scarred ? 0 : pct(staffBonus(state, b));
  const cluster = scarred ? 0 : pct(adjacencyBonus(state, b));
  const pair = scarred ? 0 : pct(pairBonus(state, b));
  const keep = scarred ? 0 : pct(keepBonus(state, b));
  const perks = [
    cluster > 0 ? `cluster +${cluster}%` : "",
    pair > 0 ? `pair +${pair}%` : "",
    keep > 0 ? `keep +${keep}%` : "",
  ].filter(Boolean);
  const cls = ["sc-work-card", scarred ? "is-scarred" : staff > 0 ? "is-staffed" : "is-empty"].join(" ");

  return (
    <div className={cls} title={`${nm} at ${b.x},${b.y}`}>
      <div className="sc-work-head">
        <span className="sc-work-name">{nm}</span>
        <span className="sc-work-level">lv {b.level}</span>
      </div>
      <div className="sc-work-status">
        {scarred ? "Scarred · idle" : staff > 0 ? `Staffed +${staff}%` : "Empty"}
      </div>
      {perks.length > 0 ? <div className="sc-work-perks">{perks.join(" · ")}</div> : null}
      <div className="sc-work-foot">
        <span className="sc-work-where">{b.x},{b.y}</span>
        {scarred ? (
          <button
            type="button"
            className="sc-work-btn is-repair"
            onClick={() => act((st) => (tryRepair(st, b.id) ? `Repaired the ${nm}.` : "Need 8 stone."))}
          >
            Repair (8 stone)
          </button>
        ) : (
          <button
            type="button"
            className="sc-work-btn"
            onClick={() => act((st) => (tryDemolish(st, b.id) ? `Pulled down the ${nm}. Salvage returned.` : "Cannot demolish."))}
          >
            Demolish
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sim marks both fresh scaffolding and siege scars as `completesAtTick !== null`.
 * A fresh build has id `b_<tick>_<n>` and finishes exactly buildTicks after that tick; a scar is +40 from the blow.
 * Presentation-only guess. Unparseable ids count as scarred (the old list's behaviour).
 */
export function isScarred(b: Building): boolean {
  if (b.completesAtTick === null || b.level < 1) return false;
  const m = /^b_(\d+)_\d+$/.exec(b.id);
  const def = getBuildingType(b.typeId);
  if (!m || !def) return true;
  return b.completesAtTick !== Number(m[1]) + def.buildTicks;
}
