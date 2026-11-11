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
};

export function UnitCard(props: UnitCardProps) {
  const { typeId, name, power, cost, blurb, ticks, open, lock, affordable, onTrain, status, wounded, healing } = props;
  const costText = Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(" · ");
  const cls = ["sc-unit-card", !open ? "is-locked" : affordable ? "is-ready" : "is-short"].join(" ");
  const readyRow = status?.find((r) => r.kind === "ready");
  const isDrilling = Boolean(readyRow?.live || (readyRow?.value && readyRow.value.startsWith("Drilling")));
  const living = status && status.length > 0 ? splitUnitRows(status) : undefined;

  return (
    <button
      type="button"
      className={cls}
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
            <CultureUnitChip typeId={typeId} size={28} open={open} />
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
          {costText} each · {Math.ceil(ticks / 10)}s
        </span>
      ) : (
        <span className="sc-unit-lock">{lock || "Locked"}</span>
      )}
    </button>
  );
}
