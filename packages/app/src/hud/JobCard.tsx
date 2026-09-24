import React from "react";
import {
  getBuildingType,
  tryAssignCitizen,
  tryIdleCitizen,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { WalkerPip } from "./WalkerPip";
import "./walker-pip.css";

type Citizen = GameState["citizens"][number];
type Building = GameState["buildings"][number];

export function JobCard(props: {
  name: string;
  idle: boolean;
  workers: Citizen[];
  buildings: Building[];
  posts: Building[];
  act: ActFn;
}) {
  const { name, idle, workers, buildings, posts, act } = props;
  const label = (x: number, y: number) => {
    const b = buildings.find((q) => q.x === x && q.y === y);
    return `${b ? getBuildingType(b.typeId)?.name ?? b.typeId : "Tile"} ${x},${y}`;
  };
  const sites = new Map<string, number>();
  for (const c of workers) {
    if (!c.tile) continue;
    const k = label(c.tile.x, c.tile.y);
    sites.set(k, (sites.get(k) ?? 0) + 1);
  }
  const siteText = [...sites].map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(" · ");
  const cls = ["sc-job-card", idle ? "is-idle" : "is-assigned"].join(" ");
  const effectiveRole = idle ? "idle" : (workers[0]?.job ?? name.toLowerCase());
  return (
    <div className={cls}>
      <span className="sc-job-head">
        <span className="sc-job-title-group">
          <WalkerPip role={effectiveRole} assigned={!idle} />
          <span className="sc-job-name">{name}</span>
        </span>
        <span className="sc-job-count">×{workers.length}</span>
      </span>
      <span className="sc-job-where">{idle ? "No post · waiting for work" : `Walks to ${siteText || "—"}`}</span>
      {workers.map((c, i) => (
        <span key={c.id} className="sc-job-row">
          <span className="sc-job-who">
            #{i + 1} {c.tile ? label(c.tile.x, c.tile.y) : "idle"}
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
          <button
            type="button"
            className="sc-job-btn"
            disabled={idle}
            onClick={() => act((st) => (tryIdleCitizen(st, c.id) ? "Worker idle." : "Already idle."))}
          >
            Idle
          </button>
        </span>
      ))}
    </div>
  );
}
