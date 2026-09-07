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
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Hover a unit for cost and role.</p>
      <p style={{ fontSize: 13 }}>
        Wounded {wounded} / {beds} beds. Build an Infirmary so home losses fill beds instead of vanishing.
      </p>
      <button
        type="button"
        disabled={!state || wounded <= 0}
        onClick={() => act((st) => (tryTreatWounded(st) ? "One soldier returns to the line." : "Need 4 food, or no wounded."))}
      >
        Treat wounded (4 food)
      </button>
      <button
        type="button"
        disabled={!state || levyWait > 0}
        onClick={() => act((st) => (tryFoodLevy(st) ? "Four militia raised from the stores." : "Need 20 food, or the levy is tired."))}
      >
        {levyWait > 0 ? `Food levy in ${Math.ceil(levyWait / 10)}s` : "Food levy (20 food, +4 militia)"}
      </button>
      <button
        type="button"
        disabled={!state || hasChamp}
        onClick={() => act((st) => (tryHireChampion(st) ? "A champion takes your coin." : "Need 80 gold and 40 food, or you already have one."))}
      >
        {hasChamp ? `Champion: ${state ? championName(state) : ""}` : "Hire champion (80 gold, 40 food, pwr 18)"}
      </button>
      {hasChamp ? (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input value={cname} maxLength={24} onChange={(e) => setCname(e.target.value)} />
          <button type="button" onClick={() => act((st) => (tryNameChampion(st, cname) ? `The host knows ${cname.trim()}.` : "Name the champion."))}>
            Name champion
          </button>
        </div>
      ) : null}
      <button type="button" onClick={() => act((st) => (tryHireMercs(st) ? "Eight mercenaries join the line." : "Need 30 gold."))}>
        Hire mercenaries (30 gold, +8 militia)
      </button>
      <h3>Your Host</h3>
      <ArmyVisual state={state} realmId="player" />
    </>
  );
}
