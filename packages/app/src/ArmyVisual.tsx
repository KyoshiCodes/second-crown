import React from "react";
import type { GameState } from "@second-crown/sim";
import { formatLetterSuffix, getUnitType, championName } from "@second-crown/sim";
import { UnitIcon } from "./UnitIcon";

export function ArmyVisual(props: { state: GameState | undefined; realmId?: string }) {
  const realmId = props.realmId ?? "player";
  const units = (props.state?.units ?? []).filter((u) => u.realmId === realmId);
  if (units.length === 0) {
    return <p style={{ opacity: 0.65 }}>No companies raised yet.</p>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0" }}>
      {units.map((u) => {
        const defName = getUnitType(u.typeId)?.name ?? u.typeId;
        const name =
          u.typeId === "champion" && realmId === "player" && props.state
            ? championName(props.state)
            : defName;
        const n = Math.min(8, Math.max(1, Math.ceil(Number(u.count) / 40) || 1));
        return (
          <div
            key={u.id}
            style={{
              background: "#1a1410",
              border: "1px solid #3a3228",
              borderRadius: 8,
              padding: 10,
              minWidth: 140,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sc-march"><UnitIcon typeId={u.typeId} /></span>
              <div>
                <div style={{ fontWeight: 700 }}>{name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>x{formatLetterSuffix(u.count)}</div>
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Array.from({ length: n }, (_, i) => (
                <span key={i} className="sc-march" style={{ animationDelay: `${i * 0.12}s` }}>
                  <UnitIcon typeId={u.typeId} size={22} />
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
