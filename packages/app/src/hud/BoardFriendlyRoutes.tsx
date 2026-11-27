import React from "react";
import {
  friendlyRoutesSnapshot,
  isProvinceSeen,
  type FriendlyRouteKind,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./friendly-routes.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardFriendlyRouteItem {
  id: string;
  fromRealmId: string;
  toRealmId: string;
  kind: FriendlyRouteKind;
  strength: 1 | 2 | 3;
  fromKit: LivingCultureKit;
  toKit: LivingCultureKit;
  pathD: string;
  midX: number;
  midY: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function findHold(state: GameState, realmId: string): Province | undefined {
  return state.board.provinces.find(
    (p) => p.node === "hold" && p.occupantRealmId === realmId,
  );
}

/**
 * Projects `friendlyRoutesSnapshot(state)` onto calm, fog-respecting quadratic arcs between
 * pairs of friendly NPC holds, trimming endpoints inward cleanly away from hold icons and pips.
 */
export function listBoardFriendlyRoutes(
  state: GameState | null | undefined,
): BoardFriendlyRouteItem[] {
  if (
    !state?.board?.provinces ||
    !state.flags ||
    !state.meta ||
    !Array.isArray(state.realms) ||
    !Array.isArray(state.wars)
  ) {
    return [];
  }

  const routes = friendlyRoutesSnapshot(state);
  if (routes.length === 0) return [];

  const out: BoardFriendlyRouteItem[] = [];
  routes.forEach((route, idx) => {
    const fromHold = findHold(state, route.fromRealmId);
    const toHold = findHold(state, route.toRealmId);
    if (!fromHold || !toHold) return;
    if (!isProvinceSeen(state, fromHold.id) || !isProvinceSeen(state, toHold.id)) return;

    const p1 = tileCenter(fromHold);
    const p2 = tileCenter(toHold);
    const dx = p2.wx - p1.wx;
    const dy = p2.wy - p1.wy;
    const dist = Math.hypot(dx, dy) || 1;
    const trim = Math.min(7, dist * 0.16);
    const ux = dx / dist;
    const uy = dy / dist;

    const sx = Number((p1.wx + ux * trim).toFixed(1));
    const sy = Number((p1.wy + uy * trim).toFixed(1));
    const ex = Number((p2.wx - ux * trim).toFixed(1));
    const ey = Number((p2.wy - uy * trim).toFixed(1));

    // Gentle outward bow away from center/hold marks, alternating slightly for parallel pairs
    const bend = idx % 2 === 0 ? 12 : -13;
    const nx = -uy;
    const ny = ux;
    const cx = Number(
      Math.max(18, Math.min(542, (sx + ex) * 0.5 + nx * bend)).toFixed(1),
    );
    const cy = Number(
      Math.max(16, Math.min(344, (sy + ey) * 0.5 + ny * bend - 4)).toFixed(1),
    );

    const midX = Number((0.25 * sx + 0.5 * cx + 0.25 * ex).toFixed(1));
    const midY = Number((0.25 * sy + 0.5 * cy + 0.25 * ey).toFixed(1));
    const safeId = `${route.fromRealmId}_${route.toRealmId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

    out.push({
      id: safeId,
      fromRealmId: route.fromRealmId,
      toRealmId: route.toRealmId,
      kind: route.kind,
      strength: route.strength,
      fromKit: resolveLivingCultureKit(state, route.fromRealmId),
      toKit: resolveLivingCultureKit(state, route.toRealmId),
      pathD: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
      midX,
      midY,
    });
  });

  return out;
}

/**
 * Calm, non-blocking SVG overlay rendering friendly-pair arcs (`friendlyRoutesSnapshot`)
 * in culture-kit gradients scaled by strength (1 / 2 / 3), sitting quietly beneath hold pips,
 * formations, and column standards. Zero blood/gore.
 */
export const BoardFriendlyRoutes: React.FC<{ state: GameState }> = ({ state }) => {
  const items = listBoardFriendlyRoutes(state);
  if (items.length === 0) return null;

  return (
    <g
      className="sc-froute-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        {items.map((item) => {
          const fromPal = LIVING_CULTURE_PALETTE[item.fromKit];
          const toPal = LIVING_CULTURE_PALETTE[item.toKit];
          return (
            <linearGradient key={`grad-${item.id}`} id={`sc-froute-grad-${item.id}`}>
              <stop offset="0%" stopColor={fromPal.accent} />
              <stop offset="100%" stopColor={toPal.accent} />
            </linearGradient>
          );
        })}
      </defs>

      {items.map((item) => {
        const fromPal = LIVING_CULTURE_PALETTE[item.fromKit];
        const gradUrl = `url(#sc-froute-grad-${item.id})`;
        const strokeWidth = item.strength === 3 ? 1.35 : item.strength === 2 ? 1.05 : 0.72;

        return (
          <g
            key={item.id}
            className={`sc-froute-entry is-kind-${item.kind} is-strength-${item.strength}`}
            data-friendly-route={`${item.fromRealmId}:${item.toRealmId}`}
            data-route-kind={item.kind}
            data-route-strength={item.strength}
          >
            {item.strength === 3 ? (
              <path className="sc-froute-glow" d={item.pathD} stroke={gradUrl} />
            ) : null}

            <path
              className={`sc-froute-path is-kind-${item.kind} is-strength-${item.strength}`}
              d={item.pathD}
              stroke={gradUrl}
              strokeWidth={strokeWidth}
            />

            {item.strength === 2 ? (
              <circle
                className="sc-froute-mote"
                cx={item.midX}
                cy={item.midY}
                r={1.1}
                fill={fromPal.trim}
              />
            ) : null}

            {item.strength === 3 ? (
              <rect
                className="sc-froute-mote is-strong"
                x={Number((item.midX - 1.5).toFixed(1))}
                y={Number((item.midY - 1.5).toFixed(1))}
                width={3}
                height={3}
                rx={0.5}
                transform={`rotate(45 ${item.midX} ${item.midY})`}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};
