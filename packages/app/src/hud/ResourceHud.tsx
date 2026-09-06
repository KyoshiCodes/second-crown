import React from "react";
import { formatLetterSuffix } from "@second-crown/sim";

const RES_LABEL: Record<string, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

export function ResourceHud(props: {
  resources: Record<string, string>;
  income: Record<string, string>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        background: "#16100c",
        padding: 12,
        borderRadius: 8,
        margin: "12px 0",
        fontFamily: "ui-monospace, monospace",
      }}
    >
      {(["food", "wood", "stone", "gold"] as const).map((r) => (
        <div key={r}>
          <div style={{ opacity: 0.55, fontSize: 11 }}>{RES_LABEL[r]}</div>
          <div>{formatLetterSuffix(props.resources[r] ?? "0")}</div>
          <div style={{ opacity: 0.5, fontSize: 11 }}>+{formatLetterSuffix(props.income[r] ?? "0")}/s</div>
        </div>
      ))}
    </div>
  );
}
