import React from "react";
import {
  citizensByRealm,
  getBuildingType,
  getCitizenJob,
  jobForBuildingType,
  tryAssignCitizen,
  tryIdleCitizen,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function PeoplePanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const people = state ? citizensByRealm(state, "player") : [];
  const posts =
    state?.buildings.filter(
      (b) =>
        b.realmId === "player" &&
        b.completesAtTick === null &&
        jobForBuildingType(b.typeId) !== "unassigned"
    ) ?? [];
  if (people.length === 0) return null;
  return (
    <>
      <h3>People</h3>
      {people.map((c) => {
        const job = getCitizenJob(c.job)?.name ?? c.job;
        const where = c.tile ? `${c.tile.x},${c.tile.y}` : "idle";
        return (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, flexWrap: "wrap" }}>
            <span>
              {job} · {where}
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                e.target.value = "";
                if (!id) return;
                act((st) => (tryAssignCitizen(st, c.id, id) ? "Worker posted." : "Cannot post there."));
              }}
            >
              <option value="">Post at…</option>
              {posts.map((b) => {
                const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
                return (
                  <option key={b.id} value={b.id}>
                    {nm} {b.x},{b.y}
                  </option>
                );
              })}
            </select>
            <button type="button" onClick={() => act((st) => (tryIdleCitizen(st, c.id) ? "Worker idle." : "Already idle."))}>
              Idle
            </button>
          </div>
        );
      })}
    </>
  );
}
