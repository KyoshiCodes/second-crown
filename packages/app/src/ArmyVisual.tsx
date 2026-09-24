import React from "react";
import type { GameState } from "@second-crown/sim";
import { formatLetterSuffix, getUnitType, championName, playerCultureId, cultureOfRealm } from "@second-crown/sim";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";
import { UnitIcon } from "./UnitIcon";

export function ArmyVisual(props: { state: GameState | undefined; realmId?: string }) {
  const realmId = props.realmId ?? "player";
  const isTired = props.state && realmId === "player" ? isFoodStoresEmptyOrLow(props.state) : false;
  const culture = props.state
    ? (realmId === "player" ? playerCultureId(props.state) : cultureOfRealm(props.state, realmId))
    : undefined;
  const units = (props.state?.units ?? []).filter((u) => u.realmId === realmId);
  if (units.length === 0) {
    return <p style={{ opacity: 0.65 }}>No companies raised yet.</p>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0" }}>
      {units.map((u) => {
        const def = getUnitType(u.typeId);
        const defName = def?.name ?? u.typeId;
        const name =
          u.typeId === "champion" && realmId === "player" && props.state
            ? championName(props.state)
            : defName;
        const countNum = Number(u.count) || 0;
        const totalPower = Math.round(countNum * (def?.power ?? 1));
        const n = Math.min(8, Math.max(1, Math.ceil(countNum / 40) || 1));
        return (
          <div
            key={u.id}
            style={{
              background: "#1a1410",
              border: "1px solid #4a3828",
              borderRadius: 8,
              padding: 10,
              minWidth: 160,
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  background: "#110b08",
                  border: "1px solid #5c4430",
                  borderRadius: 6,
                  padding: 3,
                  lineHeight: 0,
                  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                <UnitIcon typeId={u.typeId} size={44} animated culture={culture} tired={isTired && u.typeId === "militia"} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#fef08a", fontSize: 13.5 }}>{name}</div>
                <div style={{ fontSize: 12, opacity: 0.85, color: "#e2e8f0" }}>
                  ×{formatLetterSuffix(u.count)}
                </div>
                <div style={{ fontSize: 11, color: "#a3e635", marginTop: 2 }}>
                  pwr {formatLetterSuffix(totalPower)}
                </div>
              </div>
            </div>

            {/* Marching squad line in authentic 2-3 frame stride */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 6,
                borderTop: "1px dashed #3a2a1e",
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {Array.from({ length: n }, (_, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    lineHeight: 0,
                  }}
                >
                  <UnitIcon typeId={u.typeId} size={24} animated culture={culture} tired={isTired && u.typeId === "militia"} />
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

