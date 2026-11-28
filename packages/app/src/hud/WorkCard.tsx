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
  upgradeCost,
  upgradeJobFor,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { projectCost, realmRates, type RealmRates } from "../projection";
import { isSavingCost } from "./economyPressure";
import { SavingPip } from "./SavingPip";
import { hasWarehouseBlocker } from "./blockerAccents";
import { BlockerPip } from "./BlockerPip";
import { HallChip } from "./HallChip";
import { WorkStatus, workStatusRows } from "./WorkStatus";
import {
  WorkLivingGlyph,
  WorkLivingUnderlay,
  BuildingLivingGlyph,
  BuildingLivingUnderlay,
} from "./WorkLivingGlyph";
import { WorkLivingRows, splitWorkRows } from "./WorkLivingRows";
import { BuildingDetailStrip, resolveBuildingDetail } from "./BuildingDetailBadge";
import { BuildingLifeRow } from "./BuildingLifeOverlay";
import { WorkStationStagingBadge } from "./WorkStationStagingMark";
import { BuildingVarietyRow, resolveBuildingVariety } from "./BuildingVarietyBadge";
import { WorkStationBenefitBadge } from "./WorkStationBenefitMark";
import { WorkStationDepthBadge } from "./WorkStationDepthMark";
import { WorkStationPairBadge } from "./WorkStationPairMark";
import { WorkStationRestBadge } from "./WorkStationRestMark";
import { WorkStationRhythmBadge } from "./WorkStationRhythmMark";
import { ExtraBuildingRow, resolveExtraBuilding } from "./ExtraBuildingBadge";

type Building = GameState["buildings"][number];

export function WorkCard(props: { state: GameState; b: Building; scarred: boolean; act: ActFn; rates?: RealmRates }) {
  const { state, b, scarred, act } = props;
  const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
  const pct = (n: number) => Math.round((n - 1) * 100);
  const staff = scarred ? 0 : pct(staffBonus(state, b));
  const cluster = scarred ? 0 : pct(adjacencyBonus(state, b));
  const pair = scarred ? 0 : pct(pairBonus(state, b));
  const keep = scarred ? 0 : pct(keepBonus(state, b));
  const crewed = jobForBuildingType(b.typeId) !== "unassigned";
  const lifted = cluster + pair + keep > 0;
  const rows = workStatusRows({
    level: b.level,
    maxLevel: maxLevelFor(state, b.typeId, b.realmId),
    scarred,
    crewed,
    staffPct: staff,
    clusterPct: cluster,
    pairPct: pair,
    keepPct: keep,
  });
  const nextUpgrade = !scarred && !upgradeJobFor(state, b.id) ? upgradeCost(state, b.id) : null;
  const upgradeProj = nextUpgrade ? projectCost(nextUpgrade, props.rates ?? realmRates(state)) : null;
  const warehouseBlocked = Boolean(upgradeProj && hasWarehouseBlocker(upgradeProj));
  const savingUpgrade = Boolean(upgradeProj && !warehouseBlocked && isSavingCost(upgradeProj));
  const living = splitWorkRows(rows);
  const bdet = resolveBuildingDetail(state, b.id);
  const bvar = resolveBuildingVariety(state, b.id);
  const bxtra = resolveExtraBuilding(state, b.id);
  const cls = [
    "sc-work-card",
    "sc-building-card",
    scarred ? "is-scarred" : staff > 0 ? "is-staffed" : "is-empty",
    ...(savingUpgrade ? ["is-saving-cost"] : []),
    ...(warehouseBlocked ? ["is-blocker-warehouse"] : []),
    ...(bdet ? [`sc-bdet-depth-t${bdet.tierRank}`] : []),
    ...(bvar ? [`sc-bvar-family-${bvar.styleFamily}`] : []),
    ...(bxtra ? [`sc-xtra-has-${bxtra.extraKind}`] : []),
  ].join(" ");

  return (
    <div
      className={cls}
      data-saving={savingUpgrade ? "true" : undefined}
      data-blocker-accent={warehouseBlocked ? "warehouse" : undefined}
      data-building-tier={bdet ? `tier-${bdet.tierRank}` : undefined}
      title={`${nm} at ${b.x},${b.y}`}
    >
      <WorkLivingUnderlay
        typeId={b.typeId}
        scarred={scarred}
        crewed={crewed}
        staffed={staff > 0}
        lifted={lifted}
      />
      <div className="sc-work-head sc-work-living-head">
        <HallChip typeId={b.typeId} staffed={staff > 0} scarred={scarred} />
        <WorkLivingRows typeId={b.typeId} name={nm} scarred={scarred} rows={living.head} />
      </div>
      <WorkStatus rows={living.rest} />
      <BuildingDetailStrip state={state} buildingId={b.id} />
      <BuildingLifeRow state={state} buildingId={b.id} />
      <WorkStationStagingBadge state={state} buildingId={b.id} />
      <BuildingVarietyRow state={state} buildingId={b.id} />
      <WorkStationBenefitBadge state={state} buildingId={b.id} />
      <WorkStationDepthBadge state={state} buildingId={b.id} />
      <WorkStationPairBadge state={state} buildingId={b.id} />
      <WorkStationRestBadge state={state} buildingId={b.id} />
      <WorkStationRhythmBadge state={state} buildingId={b.id} />
      <ExtraBuildingRow state={state} buildingId={b.id} />
      <WorkLivingGlyph
        typeId={b.typeId}
        scarred={scarred}
        crewed={crewed}
        staffed={staff > 0}
        lifted={lifted}
      />
      <div className="sc-work-foot">
        <span className="sc-work-where">{b.x},{b.y}</span>
        {warehouseBlocked ? <BlockerPip kind="warehouse" /> : savingUpgrade ? <SavingPip /> : null}
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

export const BuildingCard = WorkCard;
export const BuildingLivingCard = WorkCard;
