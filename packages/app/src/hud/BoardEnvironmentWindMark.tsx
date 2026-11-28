import React from "react";
import {
  ENVIRONMENT_WIND_MARK,
  environmentSnapshot,
  type GameState,
} from "@second-crown/sim";
import "./board-environment-wind-mark.css";

export type BoardEnvironmentWindKind = "still" | "soft" | "steady" | "gusting";

export interface BoardEnvironmentWindMarkView {
  windMark: string;
  windKind: BoardEnvironmentWindKind;
}

function classifyWindKind(windMark: string): BoardEnvironmentWindKind {
  for (const [k, label] of Object.entries(ENVIRONMENT_WIND_MARK)) {
    if (label === windMark) return k as BoardEnvironmentWindKind;
  }
  return "still";
}

/**
 * Pure wrapper reading `environmentSnapshot(state)?.windMark` with safe guards
 * so `BoardLiving` shows a quiet sixth wind mark beneath `BoardEnvironmentLightMarkPill`.
 * Returns `null` when the snapshot or `windMark` (`living_environment_wind`) is null.
 */
export function resolveBoardEnvironmentWindMark(
  state: GameState | null | undefined,
): BoardEnvironmentWindMarkView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = environmentSnapshot(state);
  if (!snap || !snap.windMark) return null;
  return {
    windMark: snap.windMark,
    windKind: classifyWindKind(snap.windMark),
  };
}

function renderWindMark(kind: BoardEnvironmentWindKind): React.ReactNode {
  switch (kind) {
    case "soft":
      return <path d="M1.8 5 Q4.2 3.8 6.4 5 T8.6 4.4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />;
    case "steady":
      return (
        <>
          <line x1="1.6" y1="3.8" x2="7.8" y2="3.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="2.4" y1="6.4" x2="8.6" y2="6.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case "gusting":
      return (
        <>
          <path d="M1.6 4 H7.2 Q8.4 4 8.2 2.9 Q8 2 7 2.4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M2.2 6.8 H7.8 Q8.8 6.8 8.4 8" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case "still":
    default:
      return <line x1="2.2" y1="5" x2="7.8" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />;
  }
}

/**
 * Calm top-right sixth environment pill stacked beneath `BoardEnvironmentLightMarkPill`,
 * reading `environmentSnapshot(state).windMark`. Hides cleanly when `null` or switched off.
 */
export const BoardEnvironmentWindMarkPill: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironmentWindMark(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bwind-pill is-${v.windKind}`}
      data-bwind-mark={v.windMark}
      data-bwind-kind={v.windKind}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <svg
        className="sc-bwind-mark"
        viewBox="0 0 10 10"
        width={10}
        height={10}
        aria-hidden="true"
      >
        {renderWindMark(v.windKind)}
      </svg>
      <span className="sc-bwind-label">{v.windMark}</span>
    </div>
  );
};
