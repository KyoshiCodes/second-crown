import React from "react";
import {
  canAffordTrain,
  countBuilding,
  healTicksLeft,
  listHealing,
  listTroopPosts,
  listTraining,
  listUnitTypes,
  trainCostMultiplier,
  trainDurationTicks,
  trainingQueueCap,
  tryCancelTraining,
  troopWounded,
  tryTrain,
  tryTreatWounded,
  tryHireChampion,
  tryHireMercs,
  tryNameChampion,
  championName,
  tryFoodLevy,
  levyTicksLeft,
  unitUnlocked,
  vaultProtects,
  type GameState,
} from "@second-crown/sim";
import { ArmyVisual } from "../ArmyVisual";
import { MarshalCard } from "../MarshalCard";
import { UpkeepLine } from "../UpkeepLine";
import { UnitCard } from "../hud/UnitCard";
import type { ActFn } from "../game/useGameEngine";
import { sfx } from "../sfx";

function lockNote(id: string): string {
  if (id === "cavalry" || id === "knight") return "Study Horse lore on Crown (Keep II).";
  if (id === "siege") return "Study Siege craft on Crown (Keep III + workshop).";
  return "";
}

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
  const stablesN = state ? countBuilding(state, "stables") : 0;
  const rangeN = state ? countBuilding(state, "archery_range") : 0;
  const shopN = state ? countBuilding(state, "siege_workshop") : 0;
  const halls = state ? countBuilding(state, "infirmary") : 0;
  const hasChamp = state?.units.some((u) => u.realmId === "player" && u.typeId === "champion");
  const [cname, setCname] = React.useState(state ? championName(state) : "");
  const levyWait = state ? levyTicksLeft(state) : 0;
  const posts = state ? listTroopPosts(state) : [];
  const wounded = state ? troopWounded(state) : 0;
  const queue = state ? listTraining(state, "player") : [];
  const cap = state ? trainingQueueCap(state) : 2;
  const beds = halls * 10;
  const healing = state ? listHealing(state).length : 0;
  const healLeft = state ? healTicksLeft(state) : 0;

  return (
    <>
      {[1, 5, 10].map((q) => (
        <button key={q} type="button" onClick={() => setTrainQty(q)}>
          x{q}
        </button>
      ))}
      <span style={{ fontSize: 12 }}>
        {barracksN ? ` Barracks −5% each (now ${Math.round((1 - trainMult) * 100)}% off base)` : " Raise Barracks on Kingdom for cheaper levies."}
        {stablesN ? " · Stables −10% cavalry/knights" : ""}
        {rangeN ? " · Range −10% archers" : ""}
        {shopN ? " · Workshop −15% siege" : ""}
      </span>
      <div className="sc-unit-grid">
        {unitTypes.map((u) => {
          const ticks = state ? trainDurationTicks(state, u.id, trainQty) : u.trainTicks * trainQty;
          const open = !state || unitUnlocked(state, u.id);
          const lock = lockNote(u.id);
          return (
            <UnitCard
              key={u.id}
              typeId={u.id}
              name={u.name}
              power={u.power}
              cost={u.cost}
              blurb={u.blurb}
              ticks={ticks}
              open={open}
              lock={lock}
              affordable={!!state && canAffordTrain(state, u.id, trainQty)}
              onTrain={() =>
                act((st) => {
                  if (!unitUnlocked(st, u.id)) return lock;
                  const ok = tryTrain(st, { typeId: u.id, count: trainQty });
                  if (ok) sfx.train();
                  return ok ? `Queued ${trainQty} ${u.name}.` : queue.length >= cap ? "Barracks queue is full. Raise the Keep." : "Cannot afford that levy.";
                })
              }
            />
          );
        })}
      </div>
      <p style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
        Cavalry and knights need Horse lore. Siege needs Siege craft. Both start on the Crown lectern.
      </p>
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
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Hover a unit for its role. Costs shown are per unit, before discounts. Cancel refunds the unused fraction. Food levy and mercenaries still arrive at once.</p>
      <div style={{ fontSize: 13, margin: "10px 0" }}>
        <strong>Posts</strong>
        {posts.length === 0 ? <div>No companies raised.</div> : null}
        {posts.map((p) => (
          <div key={p.typeId}>
            {p.typeId}: home {p.home} · marching {p.marching} · gathering {p.gathering}
          </div>
        ))}
        <UpkeepLine state={state} />
        <div>
          Wounded {wounded}
          {halls > 0 ? ` · Infirmary ${halls} (${beds} beds)` : ""}
          {healing > 0 ? ` · treating ${healing} · next in ${Math.ceil(healLeft / 10)}s` : ""}
        </div>
        {wounded > 0 && halls < 1 ? (
          <div style={{ color: "#d29922", fontSize: 12 }}>Raise an Infirmary on Kingdom. Half of home losses go to beds instead of the grave.</div>
        ) : null}
        <button
          type="button"
          disabled={!state || wounded < 1}
          onClick={() =>
            act((st) =>
              tryTreatWounded(st)
                ? "One wounded taken to a cot. 4 food. Back as militia in 5s."
                : wounded < 1
                  ? "No wounded."
                  : "Need 4 food."
            )
          }
        >
          {wounded < 1 ? "Treat wounded (need wounded)" : "Treat 1 wounded (4 food → militia in 5s)"}
        </button>
        {state ? (
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            Vault floor · food {vaultProtects(state, "food")} · wood {vaultProtects(state, "wood")} · stone{" "}
            {vaultProtects(state, "stone")} · gold {vaultProtects(state, "gold")}
          </div>
        ) : null}
      </div>
      <button type="button" disabled={!state || levyWait > 0} onClick={() => act((st) => (tryFoodLevy(st) ? "Four militia raised from the stores." : "Need 20 food, or the levy is tired."))}>
        {levyWait > 0 ? `Food levy in ${Math.ceil(levyWait / 10)}s` : "Food levy (20 food, +4 militia)"}
      </button>
      <button type="button" disabled={!state || hasChamp} onClick={() => act((st) => (tryHireChampion(st) ? "A champion takes your coin." : "Need 80 gold and 40 food, or you already have one."))}>
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
      <MarshalCard state={state} act={act} />
      <h3>Your Host</h3>
      <ArmyVisual state={state} realmId="player" />
    </>
  );
}
