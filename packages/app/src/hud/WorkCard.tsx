import React from "react";
import {
  adjacencyBonus,
  getBuildingType,
  jobForBuildingType,
  keepBonus,
  maxLevelFor,
  pairBonus,
  staffBonus,
  tryDemolish,
  tryRepair,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { HallChip } from "./HallChip";
import { WorkStatus, workStatusRows } from "./WorkStatus";

type Building = GameState["buildings"][number];

export function WorkCard(props: { state: GameState; b: Building; scarred: boolean; act: ActFn }) {
  const { state, b, scarred, act } = props;
  const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
  const pct = (n: number) => Math.round((n - 1) * 100);
  const staff = scarred ? 0 : pct(staffBonus(state, b));
  const cluster = scarred ? 0 : pct(adjacencyBonus(state, b));
  const pair = scarred ? 0 : pct(pairBonus(state, b));
  const keep = scarred ? 0 : pct(keepBonus(state, b));
  const rows = workStatusRows({
    level: b.level,
    maxLevel: maxLevelFor(state, b.typeId, b.realmId),
    scarred,
    crewed: jobForBuildingType(b.typeId) !== "unassigned",
    staffPct: staff,
    clusterPct: cluster,
    pairPct: pair,
    keepPct: keep,
  });
  const cls = ["sc-work-card", scarred ? "is-scarred" : staff > 0 ? "is-staffed" : "is-empty"].join(" ");

  return (
    <div className={cls} title={`${nm} at ${b.x},${b.y}`}>
      <div className="sc-work-head">
        <HallChip typeId={b.typeId} staffed={staff > 0} scarred={scarred} />
        <span className="sc-work-name">{nm}</span>
        <span className="sc-work-level">lv {b.level}</span>
      </div>
      <WorkStatus rows={rows} />
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
