import React from "react";
import {
  formatLetterSuffix,
  resourceLedger,
  type GameState,
} from "@second-crown/sim";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";

const RES_LABEL: Record<string, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

/** True when an income string is a positive number (skips "0", "", "-3"). */
function hasIncome(raw: string | undefined): boolean {
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n > 0 : n === Infinity;
}

export function ResourceHud(props: {
  resources: Record<string, string>;
  income: Record<string, string>;
  state?: GameState;
}) {
  // Same check that slumps the militia: an empty larder reads red here too.
  const hungry = props.state ? isFoodStoresEmptyOrLow(props.state) : false;
  return (
    <div className="sc-resource-bar sc-ledger" role="list" aria-label="Stores">
      {(["food", "wood", "stone", "gold"] as const).map((r) => {
        const line = props.state ? resourceLedger(props.state, r) : null;
        const have = props.resources[r] ?? "0";
        const cap = line && Number.isFinite(line.cap) ? formatLetterSuffix(String(line.cap)) : null;
        const income = props.income[r];
        const empty = r === "food" && hungry;
        const full = !empty && Boolean(line?.full);
        const tone = empty ? "empty" : full ? "full" : "";
        const tip = [
          `${RES_LABEL[r]} ${formatLetterSuffix(have)}${cap ? ` of ${cap}` : ""}`,
          line ? `vault keeps ${formatLetterSuffix(String(line.vault))} safe` : "",
          full ? "stores full, excess is lost" : "",
          empty ? "larder bare, the host is tired" : "",
        ].filter(Boolean).join(" · ");
        return (
          <div key={r} role="listitem" className={`sc-ledger-cell ${tone ? `is-${tone}` : ""}`} title={tip}>
            <div className="sc-ledger-name">
              {RES_LABEL[r]}
              {full ? <span className="sc-ledger-tag">full</span> : null}
              {empty ? <span className="sc-ledger-tag">bare</span> : null}
            </div>
            <div className="sc-ledger-amount">
              {formatLetterSuffix(have)}
              {cap ? <span className="sc-ledger-cap"> / {cap}</span> : null}
            </div>
            {hasIncome(income) ? (
              <div className="sc-ledger-rate">+{formatLetterSuffix(income!)}/s</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
