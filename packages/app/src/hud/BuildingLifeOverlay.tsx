import React from "react";
import {
  BUILDING_LIFE_MOTION_HAMMERS,
  BUILDING_LIFE_MOTION_SCAFFOLD,
  BUILDING_LIFE_MOTION_WORK,
  buildingLifeSnapshot,
  type BuildingLife,
  type GameState,
} from "@second-crown/sim";
import "./building-life.css";

export type BuildingLifeMotionKind = "scaffold" | "hammers" | "work" | "still";

export interface BuildingLifeView extends BuildingLife {
  motionKind: BuildingLifeMotionKind;
  hasBanner: boolean;
  hasLamps: boolean;
  hasStoneTrim: boolean;
  hasCrest: boolean;
}

function classifyMotion(motion: string | null): BuildingLifeMotionKind {
  if (motion === BUILDING_LIFE_MOTION_SCAFFOLD) return "scaffold";
  if (motion === BUILDING_LIFE_MOTION_HAMMERS) return "hammers";
  if (motion === BUILDING_LIFE_MOTION_WORK) return "work";
  return "still";
}

/**
 * Pure wrapper around `buildingLifeSnapshot(state, buildingId)` with safe
 * guards so callers hide cleanly when `null` or `living_building_life` is off.
 */
export function resolveBuildingLife(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): BuildingLifeView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = buildingLifeSnapshot(state, buildingId);
  if (!snap) return null;
  const el = (snap.tierElements ?? "").toLowerCase();
  return {
    ...snap,
    motionKind: classifyMotion(snap.motion),
    hasBanner: el.includes("banner"),
    hasLamps: el.includes("lamps"),
    hasStoneTrim: el.includes("stone trim"),
    hasCrest: el.includes("crest"),
  };
}

/**
 * Calm visual-only tier ornaments, motion cue, and note for `WorkCard` from
 * `buildingLifeSnapshot`. Hides cleanly when `null`.
 */
export const BuildingLifeRow: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveBuildingLife(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-blife-row is-motion-${v.motionKind}`}
      data-blife-motion={v.motionKind}
      data-blife-elements={v.tierElements ?? ""}
    >
      {v.tierElements ? (
        <>
          <svg
            className="sc-blife-ornaments"
            viewBox="0 0 28 12"
            width={28}
            height={12}
            aria-hidden="true"
          >
            {v.hasBanner ? (
              <path className="sc-blife-banner" d="M2 2 V10 M2 2.5 L6.5 4 L2 6 Z" strokeWidth="0.9" />
            ) : null}
            {v.hasLamps ? (
              <>
                <circle className="sc-blife-lamp" cx="10.5" cy="4.5" r="1.4" />
                <circle className="sc-blife-lamp" cx="10.5" cy="8.5" r="1.1" />
              </>
            ) : null}
            {v.hasStoneTrim ? (
              <path className="sc-blife-trim" d="M14 9 H20 M14 6.5 H20" strokeWidth="1" />
            ) : null}
            {v.hasCrest ? (
              <polygon className="sc-blife-crest" points="24,2 26.5,5.5 24,9.5 21.5,5.5" strokeWidth="0.85" />
            ) : null}
          </svg>
          <span className="sc-blife-elements">{v.tierElements}</span>
        </>
      ) : null}

      {v.motion ? (
        <span className={`sc-blife-motion is-${v.motionKind}`}>
          <span className="sc-blife-motion-pip" aria-hidden="true" />
          <span>{v.motion}</span>
        </span>
      ) : null}

      <span className="sc-blife-note">{v.note}</span>
    </div>
  );
};
