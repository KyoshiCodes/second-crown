import React from "react";
import { UnitIcon } from "../UnitIcon";
import { RangerChip } from "./RangerChip";
import { BannerChip } from "./BannerChip";
import { OutriderChip } from "./OutriderChip";

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
};

export function UnitCard(props: UnitCardProps) {
  const { typeId, name, power, cost, blurb, ticks, open, lock, affordable, onTrain } = props;
  const costText = Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(" · ");
  const cls = ["sc-unit-card", !open ? "is-locked" : affordable ? "is-ready" : "is-short"].join(" ");
  return (
    <button
      type="button"
      className={cls}
      title={open ? `${blurb ?? ""} Cost ${costText} each. ${ticks} ticks to drill.`.trim() : lock}
      disabled={!open || !affordable}
      onClick={onTrain}
    >
      <span className="sc-unit-head">
        <span className="sc-unit-art sc-unit-art-wrapper" style={{ pointerEvents: "none", display: "inline-flex" }}>
          {typeId === "ranger" ? (
            <RangerChip size={28} open={open} />
          ) : typeId === "banner" ? (
            <BannerChip size={28} open={open} />
          ) : typeId === "outrider" ? (
            <OutriderChip size={28} open={open} />
          ) : (
            <UnitIcon typeId={typeId} size={28} animated={open} />
          )}
        </span>
        <span className="sc-unit-name">{name}</span>
        <span className="sc-unit-power">pwr {power}</span>
      </span>
      {open ? (
        <span className="sc-unit-cost">
          {costText} each · {Math.ceil(ticks / 10)}s
        </span>
      ) : (
        <span className="sc-unit-lock">{lock || "Locked"}</span>
      )}
    </button>
  );
}
