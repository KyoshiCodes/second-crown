import React from "react";
import {
  formatLetterSuffix,
  resourceLedger,
  type GameState,
} from "@second-crown/sim";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";
import { ResourcePip, resolveResourcePipVariant } from "./ResourcePip";
import {
  ResourceLivingGlyph,
  ResourceLivingUnderlay,
  resolveResourceGlyphDescriptor,
} from "./ResourceLivingGlyph";
import "./resource-pip.css";
import "./resource-living.css";

const RES_LABEL: Record<string, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

function hasIncome(raw: string | undefined): boolean {
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n > 0 : n === Infinity;
}

/** Display-only fill for the stock meter: how much of the shown cap the shown amount covers. */
function meterPct(have: string, cap: number | undefined): number | null {
  if (cap === undefined || !Number.isFinite(cap) || cap <= 0) return null;
  const n = Number(have);
  if (!Number.isFinite(n)) return n === Infinity ? 100 : null;
  return Math.max(0, Math.min(100, (n / cap) * 100));
}

export function ResourceHud(props: {
  resources: Record<string, string>;
  income: Record<string, string>;
  state?: GameState;
}) {
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
        const variant = resolveResourcePipVariant(r, props.state, full, have);
        const desc = resolveResourceGlyphDescriptor(r, have, income, props.state);
        const tip = [
          `${RES_LABEL[r]} ${formatLetterSuffix(have)}${cap ? ` of ${cap}` : ""}`,
          line ? `vault keeps ${formatLetterSuffix(String(line.vault))} safe` : "",
          full ? "stores full, excess is lost" : "",
          empty ? "larder bare, the host is tired" : "",
        ].filter(Boolean).join(" · ");
        const pct = meterPct(have, line?.cap);
        const earning = hasIncome(income);
        return (
          <div
            key={r}
            role="listitem"
            className={`sc-ledger-cell sc-resource-living is-${r} ${tone ? `is-${tone}` : ""}`}
            title={tip}
          >
            <ResourceLivingUnderlay resource={r} mood={desc.mood} />
            <div className="sc-resource-living-rows">
              <div className="sc-resource-living-row is-name">
                <div className="sc-ledger-name">
                  <ResourcePip resource={r} variant={variant} />
                  {RES_LABEL[r]}
                  {full ? <span className="sc-ledger-tag">full</span> : null}
                  {empty ? <span className="sc-ledger-tag">bare</span> : null}
                </div>
              </div>
              <div className="sc-resource-living-row is-amount">
                <span className="sc-resource-living-label">Stock</span>
                <div className="sc-ledger-amount">
                  {formatLetterSuffix(have)}
                  {cap ? <span className="sc-ledger-cap"> / {cap}</span> : null}
                </div>
                {pct !== null ? (
                  <span className="sc-resource-living-meter" aria-hidden="true">
                    <span className="sc-resource-living-meter-fill" style={{ width: `${pct}%` }} />
                  </span>
                ) : null}
              </div>
              <div className={`sc-resource-living-row is-income ${earning ? "is-earning" : "is-idle"}`}>
                <span className="sc-resource-living-label">Income</span>
                {earning ? (
                  <div className="sc-ledger-rate">+{formatLetterSuffix(income!)}/s</div>
                ) : (
                  <div className="sc-ledger-rate is-idle">idle</div>
                )}
              </div>
            </div>
            <ResourceLivingGlyph resource={r} have={have} income={income} state={props.state} />
          </div>
        );
      })}
    </div>
  );
}
