import React from "react";
import {
  getProvince,
  isProvinceSeen,
  listMarches,
  type GameState,
  type Province,
  type March,
} from "@second-crown/sim";
import {
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  BOARD_HALF_W,
  BOARD_HALF_H,
  boardGridToWorld,
} from "../BoardLiving";
import "./board-roads.css";

export type BoardRoadKind = "road" | "path";

export interface BoardConnectedRoad {
  id: string;
  fromId: string;
  toId: string;
  from: Province;
  to: Province;
  kind: BoardRoadKind;
  intoFog: boolean;
  points: number[];
  svgPath: string;
  midX: number;
  midY: number;
  travelerX: number;
  travelerY: number;
  dustX: number;
  dustY: number;
  isConnectedRoute: boolean;
  hasMarch: boolean;
}

export interface BoardRoadJunction {
  id: string;
  provinceId: string;
  x: number;
  y: number;
  roadCount: number;
}

/**
 * Height elevation in pixels for terrain tile tops on the isometric diamond board.
 * Matches packages/render/src/tiles.ts terrainElevation.
 */
export function boardTerrainElevation(terrain?: string): number {
  switch (terrain) {
    case "peak":
      return 14;
    case "hill":
      return 9;
    case "waste":
      return 7;
    case "wood":
      return 5;
    case "plain":
      return 4;
    case "shore":
      return 1;
    default:
      return 4;
  }
}

/**
 * Returns the isometric tile top coordinates (wx, wy - elevation) for a grid cell.
 */
export function boardTileTop(bx: number, by: number, terrain?: string): { x: number; y: number } {
  const { wx, wy } = boardGridToWorld(bx, by);
  return { x: wx, y: wy - boardTerrainElevation(terrain) };
}

/**
 * Converts a flat coordinate array [x0, y0, x1, y1, ...] into an SVG path d string.
 */
export function pointsToSvgPath(pts: number[]): string {
  if (pts.length < 4) return "";
  let d = `M ${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) {
    d += ` L ${pts[i]} ${pts[i + 1]}`;
  }
  return d;
}

/**
 * Lists all visible roads, mountain paths, and connected route avenues on the isometric board.
 * - Road: connecting two seen provinces (both non-peak).
 * - Mountain path: route involving at least one peak tile (dashed trail).
 * - Fog trail: route from a seen province into an unseen neighbor, terminating at the shared edge.
 * - Connected route: when selectedId matches fromId or toId, marks active connected routes with radiant sheen.
 */
export function listBoardConnectedRoads(
  state: GameState | null | undefined,
  selectedId?: string | null
): BoardConnectedRoad[] {
  const provinces = state?.board?.provinces;
  if (!provinces || !state) return [];

  const at = new Map<string, Province>();
  const seenMap = new Map<string, boolean>();

  for (const p of provinces) {
    at.set(`${p.x},${p.y}`, p);
    seenMap.set(p.id, isProvinceSeen(state, p.id));
  }

  // Active marches on the board to highlight active troop routes
  const marches = state ? listMarches(state) : [];

  const roads: BoardConnectedRoad[] = [];

  // Sort provinces in depth order for deterministic stacking
  const sorted = [...provinces].sort((a, b) => a.x + a.y - (b.x + b.y));

  for (const p of sorted) {
    // Only check east (+x) and south (+y) so each neighbor pair is evaluated once
    for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
      const n = at.get(`${p.x + dx},${p.y + dy}`);
      if (!n) continue;

      const pSeen = seenMap.get(p.id) === true;
      const nSeen = seenMap.get(n.id) === true;
      if (!pSeen && !nSeen) continue; // Unseen-unseen pair gets nothing

      const from = pSeen ? p : n;
      const to = pSeen ? n : p;

      const fromTop = boardTileTop(from.x, from.y, from.terrain);
      const fromWorld = boardGridToWorld(from.x, from.y);
      const toWorld = boardGridToWorld(to.x, to.y);

      // Half the world step between the two tile centers is the shared edge midpoint
      const hx = (toWorld.wx - fromWorld.wx) / 2;
      const hy = (toWorld.wy - fromWorld.wy) / 2;
      const edgeA = { x: fromTop.x + hx, y: fromTop.y + hy };

      let points: number[];
      let kind: BoardRoadKind = "road";
      const intoFog = !(pSeen && nSeen);

      if (intoFog) {
        // Trail stops at the shared edge so nothing is drawn into fog
        points = [fromTop.x, fromTop.y, edgeA.x, edgeA.y];
        kind = "path";
      } else {
        const toTop = boardTileTop(to.x, to.y, to.terrain);
        const edgeZ = { x: toTop.x - hx, y: toTop.y - hy };

        points =
          edgeA.y === edgeZ.y
            ? [fromTop.x, fromTop.y, edgeA.x, edgeA.y, toTop.x, toTop.y]
            : [fromTop.x, fromTop.y, edgeA.x, edgeA.y, edgeZ.x, edgeZ.y, toTop.x, toTop.y];

        kind = from.terrain === "peak" || to.terrain === "peak" ? "path" : "road";
      }

      const p0x = points[0]!;
      const p0y = points[1]!;
      const pLastX = points[points.length - 2]!;
      const pLastY = points[points.length - 1]!;

      const midX = (p0x + pLastX) / 2;
      const midY = (p0y + pLastY) / 2;

      // Traveler and dust positions along the route
      const travelerX = p0x * 0.42 + pLastX * 0.58;
      const travelerY = p0y * 0.42 + pLastY * 0.58;
      const dustX = p0x * 0.58 + pLastX * 0.42;
      const dustY = p0y * 0.58 + pLastY * 0.42;

      const isConnectedRoute =
        Boolean(selectedId) &&
        (from.id === selectedId || to.id === selectedId) &&
        !intoFog;

      const hasMarch = marches.some(
        (m: March) =>
          (m.fromId === from.id && m.toId === to.id) ||
          (m.fromId === to.id && m.toId === from.id)
      );

      roads.push({
        id: `road-${from.id}-${to.id}`,
        fromId: from.id,
        toId: to.id,
        from,
        to,
        kind,
        intoFog,
        points,
        svgPath: pointsToSvgPath(points),
        midX,
        midY,
        travelerX,
        travelerY,
        dustX,
        dustY,
        isConnectedRoute,
        hasMarch,
      });
    }
  }

  return roads;
}

/**
 * Identifies road junctions where 2 or more seen roads intersect.
 */
export function listBoardRoadJunctions(
  state: GameState | null | undefined,
  roads: BoardConnectedRoad[]
): BoardRoadJunction[] {
  if (!state?.board?.provinces || roads.length === 0) return [];

  const counts = new Map<string, number>();
  for (const r of roads) {
    if (r.intoFog) continue;
    counts.set(r.fromId, (counts.get(r.fromId) ?? 0) + 1);
    counts.set(r.toId, (counts.get(r.toId) ?? 0) + 1);
  }

  const junctions: BoardRoadJunction[] = [];
  for (const [provId, count] of counts.entries()) {
    if (count >= 2) {
      const p = getProvince(state, provId);
      if (p) {
        const top = boardTileTop(p.x, p.y, p.terrain);
        junctions.push({
          id: `junction-${provId}`,
          provinceId: provId,
          x: top.x,
          y: top.y,
          roadCount: count,
        });
      }
    }
  }

  return junctions;
}

export interface BoardRoadsProps {
  state: GameState | undefined | null;
  selectedId?: string | null;
  className?: string;
  showJunctions?: boolean;
}

/**
 * Living road/trail glyphs and animated path marks on the isometric board:
 * 1. Steady ink underlay + packed-earth roadbed + crown highlight for highways between seen provinces.
 * 2. Living mountain trail glyphs with dashed path marks and stepping stones through peaks.
 * 3. Connected route highlighting: when a province is selected, connected routes pulse with an active route sheen and flow marks.
 * 4. Animated traveler dots and trailing dust puffs traversing active roads.
 * 5. Edge path dashes with gentle breathing fog wisps at fog boundaries.
 * 6. Milestone junction stones at crossroad intersections.
 */
export function BoardRoads({
  state,
  selectedId = null,
  className = "",
  showJunctions = true,
}: BoardRoadsProps) {
  if (!state?.board?.provinces) return null;

  const roads = listBoardConnectedRoads(state, selectedId);
  if (roads.length === 0) return null;

  const junctions = showJunctions ? listBoardRoadJunctions(state, roads) : [];

  return (
    <g
      className={`sc-board-living-roads ${className}`.trim()}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
      data-testid="sc-board-living-roads"
    >
      {/* 1. Roads and Paths */}
      {roads.map((r, index) => {
        const delaySec = (((index * 3) % 7) * 0.38).toFixed(2);
        const delayStyle: React.CSSProperties = {
          pointerEvents: "none",
          animationDelay: `${delaySec}s`,
        };

        return (
          <g
            key={r.id}
            className={`sc-board-road sc-board-road-${r.kind}${r.intoFog ? " is-into-fog" : ""}${r.isConnectedRoute ? " is-connected-route" : ""}${r.hasMarch ? " has-march" : ""}`}
            data-road-id={r.id}
            data-from={r.fromId}
            data-to={r.toId}
            data-kind={r.kind}
            data-connected={r.isConnectedRoute ? "true" : "false"}
            style={{ pointerEvents: "none" }}
          >
            {/* Layer 1: Steady dark ink underlay for contrast across terrain */}
            <path
              d={r.svgPath}
              className="sc-board-road-ink"
              stroke="#0f172a"
              strokeWidth={r.kind === "road" ? 3.6 : 2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.68}
              style={{ pointerEvents: "none" }}
            />

            {/* Layer 2: Packed-earth bed / mountain dashed path */}
            <path
              d={r.svgPath}
              className={`sc-board-road-bed ${r.kind === "path" ? "sc-board-path-dash" : ""}`}
              stroke={r.kind === "road" ? "#d6b98a" : "#cbd5e1"}
              strokeWidth={r.kind === "road" ? 2.0 : 1.4}
              strokeDasharray={r.kind === "path" ? "3 2.5" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.92}
              style={{ pointerEvents: "none" }}
            />

            {/* Layer 3: Thin pale crown on main roads */}
            {r.kind === "road" && !r.intoFog && (
              <path
                d={r.svgPath}
                className="sc-board-road-crown"
                stroke="#fef3c7"
                strokeWidth={0.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.52}
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Layer 4: Connected Route Aura & Animated Pulse when selected */}
            {r.isConnectedRoute && (
              <>
                {/* Resonant amber pulse aura */}
                <path
                  d={r.svgPath}
                  className="sc-board-route-glow"
                  stroke="#fbbf24"
                  strokeWidth={4.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={delayStyle}
                />
                {/* Animated dash flow showing route direction */}
                <path
                  d={r.svgPath}
                  className="sc-board-route-flow"
                  stroke="#fef08a"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={delayStyle}
                />
                {/* Midpoint waymarker beacon */}
                <circle
                  cx={r.midX}
                  cy={r.midY}
                  r={2.2}
                  className="sc-board-route-waymarker"
                  fill="#fbbf24"
                  style={delayStyle}
                />
                <circle
                  cx={r.midX}
                  cy={r.midY}
                  r={1.0}
                  className="sc-board-route-waymarker-core"
                  fill="#ffffff"
                  style={delayStyle}
                />
              </>
            )}

            {/* Layer 5: Active march troops traversing route */}
            {r.hasMarch && (
              <path
                d={r.svgPath}
                className="sc-board-route-march-pulse"
                stroke="#60a5fa"
                strokeWidth={2.4}
                strokeDasharray="3 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={delayStyle}
              />
            )}

            {/* Layer 6: Animated Living Traffic / Travelers & Trail Dust */}
            {!r.intoFog ? (
              <g className="sc-board-road-traffic-group" style={{ pointerEvents: "none" }}>
                {/* Trailing road dust */}
                <circle
                  cx={r.dustX}
                  cy={r.dustY}
                  r={0.9}
                  className="sc-board-road-dust"
                  fill="#fef3c7"
                  style={delayStyle}
                />
                {/* Moving traveler caravan dot */}
                <circle
                  cx={r.travelerX}
                  cy={r.travelerY}
                  r={1.25}
                  className="sc-board-road-traveler"
                  fill={r.kind === "road" ? "#f59e0b" : "#94a3b8"}
                  style={delayStyle}
                />
              </g>
            ) : (
              /* Edge fog trail: breathing dust wisp entering the fog veil */
              <g className="sc-board-fog-trail-group" style={{ pointerEvents: "none" }}>
                <circle
                  cx={r.points[r.points.length - 2]}
                  cy={r.points[r.points.length - 1]}
                  r={1.15}
                  className="sc-board-trail-fog-wisp"
                  fill="#e2e8f0"
                  style={delayStyle}
                />
              </g>
            )}
          </g>
        );
      })}

      {/* 2. Route Junction Milestones (intersections where 2+ roads meet) */}
      {junctions.length > 0 && (
        <g className="sc-board-road-junctions" style={{ pointerEvents: "none" }}>
          {junctions.map((j) => (
            <g
              key={j.id}
              className="sc-board-road-junction"
              data-junction-id={j.id}
              data-province-id={j.provinceId}
              style={{ pointerEvents: "none" }}
            >
              <ellipse
                cx={j.x}
                cy={j.y + 0.8}
                rx={2.2}
                ry={1.2}
                fill="#0f172a"
                opacity={0.45}
                className="sc-board-junction-shadow"
              />
              <circle
                cx={j.x}
                cy={j.y}
                r={1.2}
                fill="#d6b98a"
                stroke="#78350f"
                strokeWidth={0.5}
                className="sc-board-junction-stone"
              />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

export const BoardRoadLiving = BoardRoads;
export const BoardRoutes = BoardRoads;
