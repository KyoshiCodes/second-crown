import React from "react";
import {
  formatLetterSuffix,
  resourceLedger,
  type GameState,
} from "@second-crown/sim";

const RES_LABEL: Record<string, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

export function ResourceHud(props: {
  resources: Record<string, string>;
  income: Record<string, string>;
  state?: GameState;
}) {
  return (
    <div className="sc-resource-bar" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: 12, borderRadius: 8, margin: "12px 0", fontFamily: "ui-monospace, monospace" }}>
      {(["food", "wood", "stone", "gold"] as const).map((r) => {
        const line = props.state ? resourceLedger(props.state, r) : null;
        const have = props.resources[r] ?? "0";
        const capLabel = line && Number.isFinite(line.cap) ? ` / ${formatLetterSuffix(String(line.cap))}` : "";
        return (
          <div key={r}>
            <div style={{ opacity: 0.55, fontSize: 11 }}>{RES_LABEL[r]}{line?.full ? " · FULL" : ""}</div>
            <div>{formatLetterSuffix(have)}{capLabel}</div>
            <div style={{ opacity: 0.5, fontSize: 11 }}>+{formatLetterSuffix(props.income[r] ?? "0")}/s</div>
            {line ? (
              <div style={{ opacity: 0.45, fontSize: 10 }}>
                vault {formatLetterSuffix(String(line.vault))} safe
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
