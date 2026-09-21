import React from "react";
import {
  canAffordTrain,
  countBuilding,
  listTroopPosts,
  listTraining,
  listUnitTypes,
  trainCostMultiplier,
  trainDurationTicks,
  trainingQueueCap,
  tryCancelTraining,
  troopWounded,
  tryTrain,
  tryHireChampion,
  tryHireMercs,
  tryNameChampion,
  championName,
  tryFoodLevy,
  levyTicksLeft,
  vaultProtects,
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
  const posts = state ? listTroopPosts(state) : [];
  const wounded = state ? troopWounded(state) : 0;
  const queue = state ? listTraining(state, "player") : [];
  const cap = state ? trainingQueueCap(state) : 2;

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
          const ticks = state ? trainDurationTicks(state, u.id, trainQty) : u.trainTicks * trainQty;
          return (
            <button
              key={u.id}
              type="button"
              title={`${u.blurb ?? ""} Cost ${cost}. ${ticks} ticks to drill.`}
              disabled={!(state && canAffordTrain(state, u.id, trainQty))}
              onClick={() =>
                act((st) => {
                  const ok = tryTrain(st, { typeId: u.id, count: trainQty });
                  if (ok) sfx.train();
                  return ok ? `Queued ${trainQty} ${u.name}.` : queue.length >= cap ? "Barracks queue is full. Raise the Keep." : "Cannot afford that levy.";
                })
              }
            >
              {u.name} pwr {u.power}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12, marginTop: 8 }}>
        <strong>Barracks queue {queue.length}/{cap}</strong>
        {queue.length === 0 ? <div>No companies drilling. Keep I holds two slots; Keep II opens a third.</div> : null}
        {queue.map((job) => {
          const left = state ? Math.max(0, job.doneTick - state.meta.tick) : 0;
          const waiting = state ? job.startedTick > state.meta.tick : false;
          return (
            <div key={job.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>
                {job.count} {job.typeId} · {waiting ? "waiting" : `${Math.ceil(left / 10)}s left`}
              </span>
              <button
                type="button"
                onClick={() =>
                  act((st) => (tryCancelTraining(st, job.id) ? "Levy dismissed. Unused stores returned." : "That order already left the yard."))
                }
              >
                Cancel
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Hover a unit for cost, role, and drill time. Cancel refunds the unused fraction. Food levy and mercenaries still arrive at once.</p>
      <div style={{ fontSize: 13, margin: "10px 0" }}>
        <strong>Posts</strong>
        {posts.length === 0 ? <div>No companies raised.</div> : null}
        {posts.map((p) => (
          <div key={p.typeId}>
            {p.typeId}: home {p.home} · marching {p.marching} · gathering {p.gathering}
          </div>
        ))}
        <div>Wounded {wounded}</div>
        {state ? (
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            Vault floor · food {vaultProtects(state, "food")} · wood {vaultProtects(state, "wood")} · stone{" "}
            {vaultProtects(state, "stone")} · gold {vaultProtects(state, "gold")}
          </div>
        ) : null}
      </div>
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
