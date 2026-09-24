import React from "react";
import {
  citizensByRealm,
  getCitizenJob,
  jobForBuildingType,
  listCitizenJobs,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { JobCard } from "./hud/JobCard";

export function PeoplePanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const people = state ? citizensByRealm(state, "player") : [];
  const mine = state?.buildings.filter((b) => b.realmId === "player") ?? [];
  const posts = mine.filter((b) => b.completesAtTick === null && jobForBuildingType(b.typeId) !== "unassigned");
  if (people.length === 0) return null;
  // Idle first so spare hands are the first thing you see, then trades in roster order.
  const order = listCitizenJobs().map((j) => j.id as string);
  const groups = new Map<string, typeof people>();
  for (const c of people) {
    const k = c.job === "unassigned" || !c.tile ? "unassigned" : c.job;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return (
    <>
      <h3>People</h3>
      <div className="sc-job-grid">
        {keys.map((k) => (
          <JobCard
            key={k}
            name={k === "unassigned" ? "Idle" : getCitizenJob(k)?.name ?? k}
            idle={k === "unassigned"}
            workers={groups.get(k) ?? []}
            buildings={mine}
            posts={posts}
            act={act}
          />
        ))}
      </div>
    </>
  );
}
