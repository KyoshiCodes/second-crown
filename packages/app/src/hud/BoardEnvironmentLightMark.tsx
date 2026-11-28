import React from "react";
import {
  ENVIRONMENT_LIGHT_MARK,
  environmentSnapshot,
  type GameState,
} from "@second-crown/sim";
import "./board-environment-light-mark.css";

export type BoardEnvironmentLightKind = "dawn" | "day" | "dusk" | "night";

export interface BoardEnvironmentLightMarkView {
  lightMark: string;
  lightKind: BoardEnvironmentLightKind;
}

function classifyLightKind(lightMark: string): BoardEnvironmentLightKind {
  for (const [k, label] of Object.entries(ENVIRONMENT_LIGHT_MARK)) {
    if (label === lightMark) return k as BoardEnvironmentLightKind;
  }
  return "day";
}

/**
 * Pure wrapper reading `environmentSnapshot(state)?.lightMark` with safe guards
 * so `BoardLiving` shows a quiet fifth daylight mark beneath `BoardEnvironmentWeatherMarkPill`.
 * Returns `null` when the snapshot or `lightMark` (`living_environment_light`) is null.
 */
export function resolveBoardEnvironmentLightMark(
  state: GameState | null | undefined,
): BoardEnvironmentLightMarkView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = environmentSnapshot(state);
  if (!snap || !snap.lightMark) return null;
  return {
    lightMark: snap.lightMark,
    lightKind: classifyLightKind(snap.lightMark),
  };
}

function renderLightMark(kind: BoardEnvironmentLightKind): React.ReactNode {
  switch (kind) {
    case "dawn":
      return (
        <>
          <path d="M2 6.8 A3 3 0 0 1 8 6.8" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          <line x1="1.6" y1="7.8" x2="8.4" y2="7.8" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
        </>
      );
    case "dusk":
      return (
        <>
          <path d="M2.2 6.2 H7.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          <line x1="3.4" y1="8" x2="8.2" y2="8" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" opacity="0.65" />
        </>
      );
    case "night":
      return <path d="M6.4 2 A3.2 3.2 0 1 0 8.5 7.2 A2.6 2.6 0 1 1 6.4 2 Z" fill="currentColor" opacity="0.88" />;
    case "day":
    default:
      return (
        <>
          <circle cx="5" cy="5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.05" />
          <circle cx="5" cy="5" r="0.8" fill="currentColor" />
        </>
      );
  }
}

/**
 * Calm top-right fifth environment pill stacked beneath `BoardEnvironmentWeatherMarkPill`,
 * reading `environmentSnapshot(state).lightMark`. Hides cleanly when `null` or switched off.
 */
export const BoardEnvironmentLightMarkPill: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironmentLightMark(state);
  if (!v) return null;

  return (
    <div
      className={`sc-blight-pill is-${v.lightKind}`}
      data-blight-mark={v.lightMark}
      data-blight-kind={v.lightKind}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <svg
        className="sc-blight-mark"
        viewBox="0 0 10 10"
        width={10}
        height={10}
        aria-hidden="true"
      >
        {renderLightMark(v.lightKind)}
      </svg>
      <span className="sc-blight-label">{v.lightMark}</span>
    </div>
  );
};
