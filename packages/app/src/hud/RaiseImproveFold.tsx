import React from "react";
import {
  buildTicksLeft,
  canAfford,
  countBuilding,
  getBuildingType,
  isScarred,
  listBuildableTypes,
  listUpgrades,
  listWorksInProgress,
  tryCancelBuild,
  tryCancelUpgrade,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { Fold } from "./Fold";
import { HorizonBadge, HorizonTime } from "../horizon/HorizonTime";
import "../kingdom-flow.css";

/** One row in the works-in-progress strip: a raise or an improvement, already read from the sim. */
export interface WorkInProgress {
  key: string;
  kind: "raise" | "improve";
  name: string;
  /** "→ lv N" for improvements, empty for raises. */
  level: string;
  secondsLeft: number;
  /** Building id the cancel call takes. */
  targetId: string;
}

/** Reads the sim's work queues. Display only, no rules. */
export function worksInProgress(state: GameState | undefined): WorkInProgress[] {
  if (!state) return [];
  const raises: WorkInProgress[] = listWorksInProgress(state)
    .filter((b) => !isScarred(state, b))
    .map((b) => ({
      key: `r-${b.id}`,
      kind: "raise",
      name: getBuildingType(b.typeId)?.name ?? b.typeId,
      level: "",
      secondsLeft: Math.ceil(buildTicksLeft(state, b.id) / 10),
      targetId: b.id,
    }));
  const improves: WorkInProgress[] = listUpgrades(state).map((job) => {
    const b = state.buildings.find((x) => x.id === job.buildingId);
    return {
      key: `u-${job.id}`,
      kind: "improve",
      name: getBuildingType(b?.typeId ?? "")?.name ?? job.buildingId,
      level: `→ lv ${job.fromLevel + 1}`,
      secondsLeft: Math.ceil(Math.max(0, job.doneTick - state.meta.tick) / 10),
      targetId: job.buildingId,
    };
  });
  return [...raises, ...improves];
}

/** Title-bar summary: what is picked, then how much is underway. */
export function raiseImproveSummary(
  pickedName: string | undefined,
  works: WorkInProgress[],
  affordable: number,
): string {
  const raising = works.filter((w) => w.kind === "raise").length;
  const improving = works.length - raising;
  const parts: string[] = [pickedName ? `Picked: ${pickedName}` : `${affordable} affordable`];
  if (raising) parts.push(`${raising} raising`);
  if (improving) parts.push(`${improving} improving`);
  return parts.join(" · ");
}

/**
 * Kingdom tab "Raise / Improve" fold: the build picker plus every raise and improvement underway,
 * in one section. Cancel buttons call the same sim functions the old Raising / Improving grids did.
 */
export function RaiseImproveFold(props: {
  state: GameState | undefined;
  act: ActFn;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
}) {
  const { state, act, selectedBuild, setSelectedBuild } = props;
  const types = listBuildableTypes();
  const selected = selectedBuild ? getBuildingType(selectedBuild) : undefined;
  const works = worksInProgress(state);
  const affordable = state ? types.filter((t) => canAfford(state, t.id)).length : 0;

  const cancel = (w: WorkInProgress) =>
    act((st) =>
      w.kind === "raise"
        ? tryCancelBuild(st, w.targetId)
          ? `Struck the ${w.name} scaffolding.`
          : "That work already stands."
        : tryCancelUpgrade(st, w.targetId)
          ? `Stopped improving the ${w.name}.`
          : "That work already finished.",
    );

  return (
    <Fold
      id="kingdom-raise"
      title="Raise / Improve"
      summary={raiseImproveSummary(selected?.name, works, affordable)}
      className="sc-raise-fold"
    >
      {works.length > 0 ? (
        <div className="sc-raise-works" aria-label="Works underway">
          {works.map((w) => (
            <div key={w.key} className={`sc-raise-work is-${w.kind}`} data-kind={w.kind}>
              <span className="sc-raise-work-tag">{w.kind === "raise" ? "Raising" : "Improving"}</span>
              <span className="sc-raise-work-name">
                {w.name}
                {w.level ? <span className="sc-raise-work-level"> {w.level}</span> : null}
              </span>
              <span className="sc-raise-work-time">
                <HorizonTime seconds={w.secondsLeft} />
                <HorizonBadge seconds={w.secondsLeft} />
              </span>
              <button type="button" className="sc-work-btn sc-raise-work-cancel" onClick={() => cancel(w)}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {selected ? <p className="sc-raise-blurb">{selected.name}: {selected.blurb}</p> : null}
      <div className="sc-plain-grid sc-raise-grid">
        {types.map((t) => {
          const n = state ? countBuilding(state, t.id) : 0;
          const afford = state ? canAfford(state, t.id) : false;
          const picked = selectedBuild === t.id;
          return (
            <button
              key={t.id}
              type="button"
              title={t.blurb}
              onClick={() => setSelectedBuild(t.id)}
              className={`sc-work-card sc-plain-pick ${picked ? "is-picked" : afford ? "is-afford" : "is-short"}`}
            >
              <span className="sc-work-head">
                <span className="sc-work-name">{t.name}</span>
                {n ? <span className="sc-work-level">x{n}</span> : null}
              </span>
              <span className="sc-work-status">{picked ? "Picked — tap a plot" : afford ? "Can afford" : "Short on stores"}</span>
            </button>
          );
        })}
      </div>
    </Fold>
  );
}
