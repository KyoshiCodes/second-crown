import React from "react";
import { UnitIcon } from "../UnitIcon";
import { RangerChip } from "./RangerChip";
import { BannerChip } from "./BannerChip";
import { OutriderChip } from "./OutriderChip";
import { WardenChip } from "./WardenChip";
import { LancerChip } from "./LancerChip";
import { UnitStatus, type UnitStatusRow } from "./UnitStatus";
import { UnitLivingGlyph, UnitLivingUnderlay } from "./UnitLivingGlyph";
import { UnitLivingRows, splitUnitRows } from "./UnitLivingRows";
import { BandagePip } from "./BandagePip";
import { CultureUnitChip, hasCultureUnitChip } from "./CultureUnitChip";
import { UnitTierNote } from "../horizon/HorizonTime";
import { batchCostTotal, formatHorizon, isEliteUnitTier, unitBracketNote, unitTierRank } from "../horizon/horizon";
import "../horizon/horizon-elite-tier.css";
import { unitPayoffNote } from "@second-crown/sim";
import "./unit-payoff.css";
import { ElitePayoffPip, resolveElitePayoffBadge } from "./ElitePayoffPip";
import type { StarvationState } from "../projection";
import { UnitStarvePip } from "./StarvationCue";

export type UnitCardProps = {
  typeId: string;
  name: string;
  power: number;
  cost: Partial<Record<string, string | number>>;
  blurb?: string;
  ticks: number;
  open: boolean;
  lock: string;
  affordable: boolean;
  onTrain: () => void;
  /** Optional stacked power / cost / readiness rows. When given, Power and Cost move into a living
   *  Name / Power / Cost column beside the art (UnitLivingRows) and Readiness stays below. */
  status?: UnitStatusRow[];
  /** Optional wounded count for this unit type (e.g. wounded returning as militia or wounded troops) */
  wounded?: number;
  /** Whether the Infirmary is actively healing */
  healing?: boolean;
  /** Unit tier from the sim's unit table (1–5). Shown as "Tier II". */
  tier?: number;
  /** Batch size the cost is multiplied by (x1 / x5 / x10). `ticks` is already for the batch. */
  qty?: number;
  /** Optional trained-troop starvation risk ("imminent" | "starving") passed by ArmyTab. */
  starveRisk?: StarvationState | null;
};

export function UnitCard(props: UnitCardProps) {
  const { typeId, name, power, cost, blurb, ticks, open, lock, affordable, onTrain, status, wounded, healing, tier, qty = 1, starveRisk } = props;
  const bracketNote = open ? unitBracketNote({ costTotal: batchCostTotal(cost, qty), seconds: ticks / 10 }) : null;
  const costText = Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(" · ");
  const elite = isEliteUnitTier(tier);
  const tierRank = tier !== undefined ? unitTierRank(tier) : undefined;
  const cls = [
    "sc-unit-card",
    !open ? "is-locked" : affordable ? "is-ready" : "is-short",
    ...(elite && tierRank ? ["is-elite-tier", `is-tier-${tierRank}`] : []),
    ...(starveRisk ? ["is-starve-risk", `is-starve-${starveRisk}`] : []),
  ].join(" ");
  const readyRow = status?.find((r) => r.kind === "ready");
  const isDrilling = Boolean(readyRow?.live || (readyRow?.value && readyRow.value.startsWith("Drilling")));
  const living = status && status.length > 0 ? splitUnitRows(status) : undefined;
  const payoff = unitPayoffNote(typeId);
  const payoffBadge = payoff ? resolveElitePayoffBadge(typeId) : null;

  return (
    <button
      type="button"
      className={cls}
      data-elite-tier={elite && tierRank ? `tier-${tierRank}` : undefined}
      data-starve-risk={starveRisk ?? undefined}
      title={open ? `${blurb ?? ""} Cost ${costText} each. ${ticks} ticks to drill.`.trim() : lock}
      disabled={!open || !affordable}
      onClick={onTrain}
    >
      <UnitLivingUnderlay
        typeId={typeId}
        open={open}
        affordable={affordable}
        drilling={isDrilling}
      />
      {elite ? <span className="sc-unit-elite-rim" aria-hidden="true" /> : null}
      {starveRisk ? <span className={`sc-unit-starve-rim is-${starveRisk}`} aria-hidden="true" /> : null}
      <span className={living ? "sc-unit-head sc-unit-living-head" : "sc-unit-head"}>
        <span
          className={`sc-unit-art sc-unit-art-wrapper${wounded && wounded > 0 ? " has-wounded" : ""}${healing ? " is-healing" : ""}`}
          style={{ pointerEvents: "none", display: "inline-flex" }}
        >
          {typeId === "ranger" ? (
            <RangerChip size={28} open={open} />
          ) : typeId === "banner" ? (
            <BannerChip size={28} open={open} />
          ) : typeId === "outrider" ? (
            <OutriderChip size={28} open={open} />
          ) : typeId === "warden" ? (
            <WardenChip size={28} open={open} />
          ) : typeId === "lancer" ? (
            <LancerChip size={28} open={open} />
          ) : hasCultureUnitChip(typeId) ? (
            <CultureUnitChip unitId={typeId} size={28} open={open} />
          ) : (
            <UnitIcon typeId={typeId} size={28} animated={open} />
          )}
          {wounded && wounded > 0 ? (
            <span className="sc-unit-chip-bandage-badge" aria-hidden="true">
              <BandagePip size={12} active={healing} wounded={true} />
            </span>
          ) : null}
        </span>
        {living ? (
          <UnitLivingRows typeId={typeId} name={name} open={open} rows={living.head} />
        ) : (
          <>
            <span className="sc-unit-name">{name}</span>
            <span className="sc-unit-power">pwr {power}</span>
          </>
        )}
      </span>
      <UnitTierNote tier={tier} note={bracketNote} />
      {starveRisk ? <UnitStarvePip state={starveRisk} /> : null}
      {payoff ? (
        <span
          className={`sc-unit-payoff${payoffBadge ? ` is-payoff-${payoffBadge.kind}` : ""}`}
          data-unit-payoff={typeId}
          data-payoff-role={payoffBadge?.kind}
        >
          {payoffBadge ? <ElitePayoffPip badge={payoffBadge} locked={!open} /> : null}
          {payoff}
        </span>
      ) : null}
      {living ? (
        <>
          <UnitStatus rows={living.rest} />
          <UnitLivingGlyph
            typeId={typeId}
            open={open}
            affordable={affordable}
            drilling={isDrilling}
          />
        </>
      ) : open ? (
        <span className="sc-unit-cost">
          {costText} each · {formatHorizon(ticks / 10)}
        </span>
      ) : (
        <span className="sc-unit-lock">{lock || "Locked"}</span>
      )}
    </button>
  );
}
