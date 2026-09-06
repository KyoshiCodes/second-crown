import React from "react";
import type { GameState } from "@second-crown/sim";
import { formatLetterSuffix } from "@second-crown/sim";
import { unitVis } from "./crests";

export function ArmyVisual(props: { state: GameState | undefined; realmId?: string }) {
  const realmId = props.realmId ?? "player";
  const units = (props.state?.units ?? []).filter((u) => u.realmId === realmId);
  if (units.length === 0) {
    return <p style={{ opacity: 0.65 }}>No companies raised yet.</p>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0" }}>
      {units.map((u) => {
        const v = unitVis(u.typeId);
        const n = Math.min(12, Math.max(1, Math.ceil(Number(u.count) / 20) || 1));
        return (
          <div
            key={u.id}
            style={{
              background: "#1a1410",
              border: `1px solid ${v.color}`,
              borderRadius: 8,
              padding: 10,
              minWidth: 120,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {v.glyph} {v.name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>×{formatLetterSuffix(u.count)}</div>
            <div style={{ marginTop: 6, letterSpacing: 2, color: v.color }}>
              {Array.from({ length: n }, () => v.glyph).join(" ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
