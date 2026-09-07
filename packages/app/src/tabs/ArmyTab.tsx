import React from "react";
import {
  canAffordTrain,
  countBuilding,
  listUnitTypes,
  trainCostMultiplier,
  tryTrain,
  tryHireChampion,
  tryHireMercs,
  tryNameChampion,
  championName,
  tryFoodLevy,
  levyTicksLeft,
  woundedCount,
  infirmaryBeds,
  tryTreatWounded,
  type GameState,
} from "@second-crown/sim";
import { ArmyVisual } from "../ArmyVisual";
import { UnitIcon } from "../UnitIcon";
import type { ActFn } from "../game/useGameEngine";
import { sfx } from "../sfx";

export function ArmyTab(props: {
  state: GameState | undefined;
  act: ActFn;
  trainQty: number;
  setTrainQty: (n: number) => void;
}) {
  const { state, act, trainQty, setTrainQty } = props;
  const unitTypes = listUnitTypes();
  const trainMult = state ? trainCostMultiplier(state) : 1;
  const barracksN = state ? countBuilding(state, "barracks") : 0;
  const hasChamp = state?.units.some((u) => u.realmId === "player" && u.typeId === "champion");
  const [cname, setCname] = React.useState(state ? championName(state) : "");
  const levyWait = state ? levyTicksLeft(state) : 0;
  const wounded = state ? woundedCount(state) : 0;
  const beds = state ? infirmaryBeds(state) : 0;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Train Quantity:</span>
        {[1, 5, 10].map((q) => (
          <button
            key={q}
            type="button"
            style={{
              fontWeight: trainQty === q ? 700 : 400,
              background: trainQty === q ? "#5c3d1e" : undefined,
              borderColor: trainQty === q ? "#f59e0b" : undefined,
            }}
            onClick={() => setTrainQty(q)}
          >
            ×{q}
          </button>
        ))}
        <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 8 }}>
          {barracksN ? `Barracks discount: ${Math.round((1 - trainMult) * 100)}%` : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
        {unitTypes.map((u) => {
          const cost = Object.entries(u.cost).map(([k, v]) => `${v} ${k}`).join(", ");
          const canTrain = Boolean(state && canAffordTrain(state, u.id, trainQty));
          return (
            <div
              key={u.id}
              style={{
                background: "#19120c",
                border: "1px solid #4a3424",
                borderRadius: 8,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: 170,
                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    background: "#110a07",
                    border: "1px solid #5c3e24",
                    borderRadius: 6,
                    padding: 2,
                    lineHeight: 0,
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)",
                  }}
                >
                  <UnitIcon typeId={u.id} size={38} animated />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#fef08a" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#a3e635" }}>pwr {u.power}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, opacity: 0.75, margin: "6px 0 4px", minHeight: 28 }}>
                {u.blurb}
              </div>

              <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 6 }}>
                Cost: {cost}
              </div>

              <button
                type="button"
                title={`${u.blurb ?? ""} Cost ${cost}`}
                disabled={!canTrain}
                onClick={() =>
                  act((st) => {
                    const ok = tryTrain(st, { typeId: u.id, count: trainQty });
                    if (ok) sfx.train();
                    return ok ? `Trained ${trainQty} ${u.name}.` : "Cannot afford that levy.";
                  })
                }
                style={{ width: "100%", padding: "4px 8px", fontSize: 12 }}
              >
                Train ×{trainQty}
              </button>
            </div>
          );
        })}
      </div>

      {/* Champion Recruitment Card */}
      <div
        style={{
          background: "#1c121e",
          border: "1px solid #6b21a8",
          borderRadius: 8,
          padding: 10,
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            background: "#140b17",
            border: "1px solid #8b5cf6",
            borderRadius: 6,
            padding: 3,
            lineHeight: 0,
          }}
        >
          <UnitIcon typeId="champion" size={44} animated />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#fde047", fontSize: 14 }}>
            {hasChamp ? (state ? championName(state) : "Champion") : "The Realm Champion"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, color: "#e2e8f0" }}>
            {hasChamp
              ? "Your legendary blade champions your host on the battlefield."
              : "One named blade. Power 18 (80 gold, 40 food)."}
          </div>
          {hasChamp ? (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input
                value={cname}
                maxLength={24}
                onChange={(e) => setCname(e.target.value)}
                style={{ fontSize: 12, padding: "3px 6px" }}
              />
              <button
                type="button"
                onClick={() =>
                  act((st) => (tryNameChampion(st, cname) ? `The host knows ${cname.trim()}.` : "Name the champion."))
                }
              >
                Name champion
              </button>
            </div>
          ) : (
            <button
              type="button"
              style={{ marginTop: 6 }}
              disabled={!state || hasChamp}
              onClick={() =>
                act((st) =>
                  tryHireChampion(st)
                    ? "A champion takes your coin."
                    : "Need 80 gold and 40 food, or you already have one."
                )
              }
            >
              Hire champion (80 gold, 40 food, pwr 18)
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          disabled={!state || wounded <= 0}
          onClick={() => act((st) => (tryTreatWounded(st) ? "One soldier returns to the line." : "Need 4 food, or no wounded."))}
        >
          Treat wounded (4 food)
        </button>
        <span style={{ fontSize: 12, opacity: 0.85 }}>
          Wounded: {wounded} / {beds} beds
        </span>
        <button
          type="button"
          disabled={!state || levyWait > 0}
          onClick={() => act((st) => (tryFoodLevy(st) ? "Four militia raised from the stores." : "Need 20 food, or the levy is tired."))}
        >
          {levyWait > 0 ? `Food levy in ${Math.ceil(levyWait / 10)}s` : "Food levy (20 food, +4 militia)"}
        </button>
        <button type="button" onClick={() => act((st) => (tryHireMercs(st) ? "Eight mercenaries join the line." : "Need 30 gold."))}>
          Hire mercenaries (30 gold, +8 militia)
        </button>
      </div>

      <h3 style={{ marginTop: 16 }}>Your Host</h3>
      <ArmyVisual state={state} realmId="player" />
    </>
  );
}

