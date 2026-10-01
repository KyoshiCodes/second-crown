import React from "react";
import {
  canAffordTrain,
  canSally,
  getBuildingType,
  hallBonuses,
  healTicks,
  healTicksLeft,
  incomingOnHome,
  infirmaryBeds,
  listHealing,
  listTraining,
  listUnitTypes,
  trainingQueueCap,
  trySally,
  tryTrain,
  tryTreatWounded,
  unitUnlocked,
  watchtowerWarning,
  woundedCount,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { ResearchBar } from "./ResearchBar";
import { WallLine } from "./WallLine";
import { sfx } from "./sfx";
import "./keep-hall.css";

type Room = "yard" | "lectern" | "gate";

/** Each room opens only when its building stands finished in the hold. No new rules: the room is a shortcut. */
const ROOMS: { id: Room; label: string; needs: string }[] = [
  { id: "yard", label: "Yard", needs: "barracks" },
  { id: "lectern", label: "Lectern", needs: "academy" },
  { id: "gate", label: "Gate", needs: "gate" },
];

function hasBuilt(state: GameState, typeId: string): boolean {
  return state.buildings.some((b) => b.realmId === "player" && b.typeId === typeId && b.completesAtTick === null);
}

/**
 * The keep's Hall: three rooms that call the same sim actions as the Army, Kingdom and War tabs.
 * Room choice is local view state only.
 */
export function KeepHall(props: { state: GameState; act: ActFn }) {
  const { state, act } = props;
  const [room, setRoom] = React.useState<Room>("yard");
  const cur = ROOMS.find((r) => r.id === room) ?? ROOMS[0];
  const built = hasBuilt(state, cur.needs);
  const needName = getBuildingType(cur.needs)?.name ?? cur.needs;
  const bonus = hallBonuses(state).find((b) => b.room === room);

  return (
    <div className="sc-keephall" aria-label="Hall">
      <div className="sc-keephall-head">Hall</div>
      <div className="sc-keephall-rooms" role="tablist" aria-label="Hall rooms">
        {ROOMS.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={room === r.id}
            className={`sc-keephall-room${room === r.id ? " is-on" : ""}${hasBuilt(state, r.needs) ? "" : " is-unbuilt"}`}
            onClick={() => setRoom(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={cur.label} className="sc-keephall-body">
        {bonus?.on ? <p className="sc-keephall-note">Room bonus: {bonus.text}.</p> : null}
        {!built ? (
          <p className="sc-keephall-empty">Not built. Raise a {needName} in the hold.</p>
        ) : room === "yard" ? (
          <YardRoom state={state} act={act} />
        ) : room === "lectern" ? (
          <ResearchBar state={state} act={act} />
        ) : (
          <GateRoom state={state} act={act} />
        )}
      </div>
    </div>
  );
}

/** Train and treat, same calls and messages as the Army tab. */
function YardRoom(props: { state: GameState; act: ActFn }) {
  const { state, act } = props;
  const [qty, setQty] = React.useState(1);
  const units = listUnitTypes().filter((u) => unitUnlocked(state, u.id));
  const queue = listTraining(state, "player");
  const cap = trainingQueueCap(state);
  const wounded = woundedCount(state);
  const beds = infirmaryBeds(state);
  const healing = listHealing(state).length;
  const healLeft = healTicksLeft(state);

  return (
    <>
      <div className="sc-keephall-row">
        {[1, 5, 10].map((q) => (
          <button key={q} type="button" className={qty === q ? "is-on" : ""} onClick={() => setQty(q)}>
            x{q}
          </button>
        ))}
        <span className="sc-keephall-note">
          Barracks queue {queue.length}/{cap}
        </span>
      </div>
      <div className="sc-keephall-row">
        {units.map((u) => (
          <button
            key={u.id}
            type="button"
            title={u.blurb}
            disabled={!canAffordTrain(state, u.id, qty)}
            onClick={() =>
              act((st) => {
                const ok = tryTrain(st, { typeId: u.id, count: qty });
                if (ok) sfx.train();
                return ok
                  ? `Queued ${qty} ${u.name}.`
                  : listTraining(st, "player").length >= trainingQueueCap(st)
                    ? "Barracks queue is full. Raise the Keep."
                    : "Cannot afford that levy.";
              })
            }
          >
            Train {qty} {u.name}
          </button>
        ))}
      </div>
      <div className="sc-keephall-row">
        <span className="sc-keephall-note">
          Wounded {wounded} / {beds} beds
          {healing > 0 ? ` · treating ${healing} (${Math.ceil(healLeft / 10)}s)` : ""}
        </span>
        <button
          type="button"
          disabled={wounded < 1}
          onClick={() =>
            act((st) =>
              tryTreatWounded(st)
                ? `One wounded taken to a cot. 4 food. Back as militia in ${healTicks(st) / 10}s.`
                : woundedCount(st) < 1
                  ? "No wounded."
                  : "Need 4 food."
            )
          }
        >
          {wounded < 1 ? "Treat wounded (need wounded)" : `Treat 1 wounded (4 food → militia in ${healTicks(state) / 10}s)`}
        </button>
      </div>
    </>
  );
}

/** Wall line and sally, same calls and messages as the Kingdom and War tabs. */
function GateRoom(props: { state: GameState; act: ActFn }) {
  const { state, act } = props;
  const incoming = incomingOnHome(state);
  const ready = canSally(state);
  const tick = state.meta.tick;
  const first = incoming[0];
  const foe = !first ? "" : watchtowerWarning(state) ? state.realms.find((r) => r.id === first.realmId)?.name ?? first.realmId : "Unknown host";
  return (
    <>
      <WallLine state={state} />
      <div className="sc-keephall-row">
        <span className="sc-keephall-note">
          {first
            ? `${foe} column at the gate in ${Math.max(0, Math.ceil((first.arrivesTick - tick) / 10))}s.`
            : "No column on your gates."}
        </span>
        <button
          type="button"
          disabled={!ready}
          onClick={() =>
            act((st) => {
              if (!trySally(st)) return "Need 5 militia and a column on the road.";
              return "Sally at the gate.";
            })
          }
        >
          Sally (5 militia)
        </button>
      </div>
    </>
  );
}
