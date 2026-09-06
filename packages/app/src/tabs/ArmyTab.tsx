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
      <span style={{ marginLeft: 8, fontSize: 12 }}>
        {barracksN ? `Barracks discount ${Math.round((1 - trainMult) * 100)}%` : ""}
      </span>
      <div>
        {unitTypes.map((u) => (
          <button
            key={u.id}
            type="button"
            disabled={!(state && canAffordTrain(state, u.id, trainQty))}
            onClick={() =>
              act((st) =>
                tryTrain(st, { typeId: u.id, count: trainQty })
                  ? `Trained ${trainQty} ${u.name}.`
                  : "Cannot afford that levy."
              )
            }
          >
            {u.name} pwr {u.power}
          </button>
        ))}
      </div>
      <h3>Your Host</h3>
      <ArmyVisual state={state} realmId="player" />
    </>
  );
}
