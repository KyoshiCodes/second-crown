import React from "react";
import {
  ENVIRONMENT_AMBIENT,
  ENVIRONMENT_FEATURES,
  environmentSnapshot,
  type Environment,
  type GameState,
} from "@second-crown/sim";
import "./board-environment.css";

export type BoardEnvironmentTerrain =
  | "plain"
  | "wood"
  | "hill"
  | "shore"
  | "waste"
  | "peak";

export type BoardEnvironmentAmbient = "clear" | "rain" | "storm" | "snow";

export interface BoardEnvironmentView extends Environment {
  terrainKind: BoardEnvironmentTerrain;
  ambientKind: BoardEnvironmentAmbient;
}

function classifyTerrain(features: string): BoardEnvironmentTerrain {
  for (const [k, label] of Object.entries(ENVIRONMENT_FEATURES)) {
    if (label === features) return k as BoardEnvironmentTerrain;
  }
  return "plain";
}

function classifyAmbient(ambient: string): BoardEnvironmentAmbient {
  for (const [k, label] of Object.entries(ENVIRONMENT_AMBIENT)) {
    if (label === ambient) return k as BoardEnvironmentAmbient;
  }
  return "clear";
}

/**
 * Pure wrapper around `environmentSnapshot(state)` with safe guards
 * so `BoardLiving` shows calm perimeter terrain silhouettes and ambient weather marks.
 */
export function resolveBoardEnvironment(
  state: GameState | null | undefined,
): BoardEnvironmentView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = environmentSnapshot(state);
  if (!snap) return null;
  return {
    ...snap,
    terrainKind: classifyTerrain(snap.features),
    ambientKind: classifyAmbient(snap.ambient),
  };
}

function renderTerrainSilhouettes(kind: BoardEnvironmentTerrain): React.ReactNode {
  switch (kind) {
    case "wood":
      return (
        <>
          <path className="sc-benv-terrain" d="M 18 308 L 25 292 L 32 308 M 34 312 L 42 294 L 50 312" />
          <path className="sc-benv-terrain" d="M 512 310 L 520 293 L 528 310 M 528 306 L 535 291 L 542 306" />
        </>
      );
    case "hill":
      return (
        <>
          <path className="sc-benv-terrain" d="M 14 314 Q 38 294 64 314 Q 82 302 98 314" />
          <path className="sc-benv-terrain" d="M 464 314 Q 492 296 518 314 Q 534 304 548 314" />
        </>
      );
    case "shore":
      return (
        <>
          <path className="sc-benv-terrain" d="M 16 308 Q 34 303 52 308 T 88 308" />
          <path className="sc-benv-terrain" d="M 472 308 Q 490 303 508 308 T 544 308" />
        </>
      );
    case "waste":
      return (
        <>
          <path className="sc-benv-terrain" d="M 20 312 L 28 303 L 38 306 L 46 312 M 54 311 H 68" />
          <path className="sc-benv-terrain" d="M 498 312 L 506 304 L 516 307 L 524 312 M 530 311 H 542" />
        </>
      );
    case "peak":
      return (
        <>
          <path className="sc-benv-terrain" d="M 16 312 L 30 286 L 44 312 L 56 294 L 68 312" />
          <path className="sc-benv-terrain" d="M 494 312 L 508 292 L 520 312 L 534 286 L 546 312" />
        </>
      );
    case "plain":
    default:
      return (
        <>
          <path className="sc-benv-terrain" d="M 18 310 Q 48 304 82 310 M 28 316 Q 56 312 88 316" />
          <path className="sc-benv-terrain" d="M 478 310 Q 512 304 542 310 M 472 316 Q 504 312 534 316" />
        </>
      );
  }
}

function renderAmbientMarks(kind: BoardEnvironmentAmbient): React.ReactNode {
  switch (kind) {
    case "rain":
      return (
        <>
          <line className="sc-benv-ambient-mark" x1={26} y1={72} x2={22} y2={84} />
          <line className="sc-benv-ambient-mark" x1={48} y1={96} x2={44} y2={108} />
          <line className="sc-benv-ambient-mark" x1={518} y1={86} x2={514} y2={98} />
          <line className="sc-benv-ambient-mark" x1={538} y1={112} x2={534} y2={124} />
        </>
      );
    case "storm":
      return (
        <>
          <path className="sc-benv-ambient-mark" d="M 24 88 Q 38 78 52 86" />
          <path className="sc-benv-ambient-mark" d="M 508 92 Q 522 82 538 90" />
          <polyline className="sc-benv-ambient-mark" points="42,92 38,100 44,100 40,108" />
        </>
      );
    case "snow":
      return (
        <>
          <circle className="sc-benv-ambient-mote" cx={26} cy={82} r={1.3} />
          <circle className="sc-benv-ambient-mote" cx={44} cy={112} r={1.1} />
          <circle className="sc-benv-ambient-mote" cx={518} cy={88} r={1.2} />
          <circle className="sc-benv-ambient-mote" cx={536} cy={118} r={1.4} />
        </>
      );
    case "clear":
    default:
      return (
        <>
          <path className="sc-benv-ambient-mark" d="M 20 88 Q 36 83 52 88" />
          <circle className="sc-benv-ambient-mote" cx={526} cy={92} r={1.2} />
          <path className="sc-benv-ambient-mark" d="M 508 104 Q 524 99 540 104" />
        </>
      );
  }
}

/**
 * Quiet perimeter terrain silhouettes & ambient weather marks framing the 16x10 board
 * inside `BoardLiving`. Purely visual, strictly non-blocking, fog-safe.
 */
export const BoardEnvironmentLayer: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironment(state);
  if (!v) return null;

  return (
    <g
      className={`sc-benv-layer is-terrain-${v.terrainKind} is-ambient-${v.ambientKind}`}
      data-benv-terrain={v.terrainKind}
      data-benv-ambient={v.ambientKind}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {renderTerrainSilhouettes(v.terrainKind)}
      {renderAmbientMarks(v.ambientKind)}
    </g>
  );
};

/**
 * Calm top-right environment mood pill reading `environmentSnapshot(state)`.
 * Hides cleanly when `null` or `living_environment` is switched off.
 */
export const BoardEnvironmentNote: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironment(state);
  if (!v) return null;

  return (
    <div
      className={`sc-benv-note is-terrain-${v.terrainKind} is-ambient-${v.ambientKind}`}
      data-benv-features={v.features}
      data-benv-ambient-label={v.ambient}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-benv-pip" aria-hidden="true" />
      <span className="sc-benv-features">{v.features}</span>
      <span className="sc-benv-sep" aria-hidden="true">·</span>
      <span className="sc-benv-ambient">{v.ambient}</span>
      <span className="sc-benv-sep" aria-hidden="true">·</span>
      <span className="sc-benv-season">{v.note}</span>
    </div>
  );
};
