import React from "react";
import {
  formationSnapshot,
  getProvince,
  type FormationId,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./player-reply-formation.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

const FORMATION_CAP = 3;

export const FORMATION_LABEL: Record<FormationId, string> = {
  muster: "Muster",
  skirmish: "Skirmish",
  clash: "Clash",
  "fall-back": "Fall-back",
};

export interface BoardJoinedFormationPoint {
  warId: string;
  joinedWarId: string;
  formation: FormationId;
  active: boolean;
  label: string;
  playerKit: LivingCultureKit;
  allyKit: LivingCultureKit | null;
  foeKit: LivingCultureKit;
  mx: number;
  my: number;
  pillW: number;
  delaySeconds: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function findHold(state: GameState, realmId: string): Province | undefined {
  if (realmId === "player") return getProvince(state, state.board.homeProvinceId);
  return state.board.provinces.find(
    (p) => p.node === "hold" && p.occupantRealmId === realmId,
  );
}

/**
 * Projects `formationSnapshot(state)` entries onto calm board staging points between
 * the joined sides, pairing opposing standards with a short formation phase mark.
 */
export function listBoardJoinedFormations(
  state: GameState | null | undefined,
): BoardJoinedFormationPoint[] {
  if (!state?.board?.provinces || !state.flags || !state.meta || !Array.isArray(state.wars)) {
    return [];
  }

  const snap = formationSnapshot(state);
  if (snap.length === 0) return [];

  const out: BoardJoinedFormationPoint[] = [];
  for (let i = 0; i < snap.length && out.length < FORMATION_CAP; i++) {
    const entry = snap[i];
    const foeId = entry.theirs.realmIds[0];
    if (!foeId) continue;

    const ourHold = findHold(state, "player");
    const foeHold = findHold(state, foeId);
    if (!ourHold || !foeHold) continue;

    const p1 = tileCenter(ourHold);
    const p2 = tileCenter(foeHold);
    const mx = Number(Math.max(62, Math.min(498, (p1.wx + p2.wx) * 0.5)).toFixed(1));
    const my = Number(Math.max(24, Math.min(336, (p1.wy + p2.wy) * 0.5 + 14)).toFixed(1));

    const allyId = entry.ours.realmIds.find((id) => id !== "player") ?? null;
    const label = FORMATION_LABEL[entry.formation];
    const pillW = Number(Math.max(34, label.length * 3.4 + 10).toFixed(1));

    out.push({
      warId: entry.warId,
      joinedWarId: entry.joinedWarId,
      formation: entry.formation,
      active: entry.active,
      label,
      playerKit: resolveLivingCultureKit(state, "player"),
      allyKit: allyId ? resolveLivingCultureKit(state, allyId) : null,
      foeKit: resolveLivingCultureKit(state, foeId),
      mx,
      my,
      pillW,
      delaySeconds: Number(((out.length * 0.45) % 2.4).toFixed(2)),
    });
  }

  return out;
}

function renderPhaseEmblem(formation: FormationId, colorA: string, colorB: string) {
  switch (formation) {
    case "muster":
      return (
        <g className="sc-formation-emblem" transform="translate(0, -4)">
          <rect x={-3.5} y={-2} width={2} height={4} rx={0.6} fill={colorA} />
          <rect x={1.5} y={-2} width={2} height={4} rx={0.6} fill={colorB} />
        </g>
      );
    case "skirmish":
      return (
        <g className="sc-formation-emblem" transform="translate(0, -4)">
          <polygon points="-4,-2 -1.2,0 -4,2" fill={colorA} />
          <polygon points="4,-2 1.2,0 4,2" fill={colorB} />
        </g>
      );
    case "clash":
      return (
        <g className="sc-formation-emblem" transform="translate(0, -4)">
          <polygon
            points="0,-3 3,0 0,3 -3,0"
            fill="#facc15"
            stroke={colorB}
            strokeWidth={0.6}
          />
        </g>
      );
    case "fall-back":
      return (
        <g className="sc-formation-emblem" transform="translate(0, -4)">
          <line x1={-3.5} y1={-1.5} x2={-1.2} y2={1.5} stroke={colorA} strokeWidth={0.9} strokeLinecap="round" />
          <line x1={3.5} y1={-1.5} x2={1.2} y2={1.5} stroke={colorB} strokeWidth={0.9} strokeLinecap="round" />
        </g>
      );
  }
}

/**
 * Calm, non-blocking SVG overlay showing opposing standards and formation phase mark
 * (`muster`, `skirmish`, `clash`, `fall-back`) for active joined wars. Zero blood/gore.
 */
export const BoardJoinedFormations: React.FC<{ state: GameState }> = ({ state }) => {
  const items = listBoardJoinedFormations(state);
  if (items.length === 0) return null;

  return (
    <g
      className="sc-joined-formation-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {items.map((pt) => {
        const pPal = LIVING_CULTURE_PALETTE[pt.playerKit];
        const aPal = pt.allyKit ? LIVING_CULTURE_PALETTE[pt.allyKit] : null;
        const fPal = LIVING_CULTURE_PALETTE[pt.foeKit];
        const tilt = pt.formation === "fall-back" ? -20 : 0;

        return (
          <g
            key={`form-${pt.warId}`}
            className={`sc-formation-entry is-formation-${pt.formation}`}
            data-joined-formation={pt.warId}
            data-formation={pt.formation}
            data-formation-active={pt.active ? "true" : "false"}
            transform={`translate(${pt.mx}, ${pt.my})`}
          >
            {/* Opposing standards: player + ally on the left, foe on the right */}
            <g
              className="sc-formation-standards is-ours"
              transform={`translate(-10, 0) rotate(${tilt})`}
              style={{ animationDelay: `${pt.delaySeconds}s` }}
            >
              <line x1={0} y1={2} x2={0} y2={-8} stroke={pPal.trim} strokeWidth={0.9} />
              <polygon
                points="0,-7.8 5.2,-6.1 0,-4.4"
                fill={pPal.tunic}
                stroke={pPal.trim}
                strokeWidth={0.5}
              />
              {aPal ? (
                <g transform="translate(-3.6, 0.8)">
                  <line x1={0} y1={1.2} x2={0} y2={-6} stroke={aPal.trim} strokeWidth={0.75} />
                  <polygon
                    points="0,-5.8 3.8,-4.4 0,-3"
                    fill={aPal.tunic}
                    stroke={aPal.trim}
                    strokeWidth={0.45}
                  />
                </g>
              ) : null}
            </g>

            <g
              className="sc-formation-standards is-theirs"
              transform={`translate(10, 0) rotate(${-tilt})`}
              style={{ animationDelay: `${pt.delaySeconds + 0.25}s` }}
            >
              <line x1={0} y1={2} x2={0} y2={-8} stroke={fPal.trim} strokeWidth={0.9} />
              <polygon
                points="0,-7.8 -5.2,-6.1 0,-4.4"
                fill={fPal.tunic}
                stroke={fPal.trim}
                strokeWidth={0.5}
              />
            </g>

            {renderPhaseEmblem(pt.formation, pPal.tunic, fPal.tunic)}

            <g className="sc-formation-pill" transform="translate(0, 6)">
              <rect
                className="sc-formation-pill-bg"
                x={-pt.pillW / 2}
                y={-4.5}
                width={pt.pillW}
                height={8.5}
                rx={4}
              />
              <text
                className="sc-formation-pill-text"
                x={0}
                y={1.2}
                textAnchor="middle"
              >
                {pt.label}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
