import React from "react";
import {
  canAffordTrain,
  countBuilding,
  listUnitTypes,
  trainCostMultiplier,
  tryTrain,
  type GameState,
} from "@second-crown/sim";
import { ArmyVisual } from "../ArmyVisual";
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

  return (
    <>
      {[1, 5, 10].map((q) => (
        <button key={q} type="button" onClick={() => setTrainQty(q)}>
          x{q}
        </button>
      ))}
      <span style={{ fontSize: 12 }}>{barracksN ? ` Barracks discount ${Math.round((1 - trainMult) * 100)}%` : ""}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {unitTypes.map((u) => {
          const cost = Object.entries(u.cost).map(([k, v]) => `${v} ${k}`).join(", ");
          return (
            <button
              key={u.id}
              type="button"
              title={`${u.blurb ?? ""} Cost ${cost}`}
              disabled={!(state && canAffordTrain(state, u.id, trainQty))}
              onClick={() =>
                act((st) => {
                  const ok = tryTrain(st, { typeId: u.id, count: trainQty });
                  if (ok) sfx.train();
                  return ok ? `Trained ${trainQty} ${u.name}.` : "Cannot afford that levy.";
                })
              }
            >
              {u.name} pwr {u.power}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Hover a unit for cost and role. Specialist buildings cheapen matching lines.</p>
      <h3>Your Host</h3>
      <ArmyVisual state={state} realmId="player" />
    </>
  );
}
