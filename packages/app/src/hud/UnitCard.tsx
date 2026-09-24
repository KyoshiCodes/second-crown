import React from "react";

export type UnitCardProps = {
  name: string;
  power: number;
  /** Base cost per unit, before Barracks/Stables/Range/Workshop discounts. */
  cost: Partial<Record<string, string | number>>;
  blurb?: string;
  ticks: number;
  open: boolean;
  lock: string;
  affordable: boolean;
  onTrain: () => void;
};

export function UnitCard(props: UnitCardProps) {
  const { name, power, cost, blurb, ticks, open, lock, affordable, onTrain } = props;
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
