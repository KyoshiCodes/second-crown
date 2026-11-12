import React from "react";
import {
  isProvinceSeen,
  type GameState,
  type Province,
} from "@second-crown/sim";
import {
  BOARD_HALF_W,
  BOARD_HALF_H,
  boardGridToWorld,
} from "../BoardLiving";
import "./board-fog.css";

export interface UnseenFogProvince {
  id: string;
  x: number;
  y: number;
  terrain: string;
  wx: number;
  wy: number;
  /** True when adjacent to at least one explored/seen province (frontier edge). */
  isFrontier: boolean;
  /** Seed delay style for stagger. */
  staggerDelay: string;
}

/**
 * Checks if an unseen province is adjacent to at least one seen province on the 4-way grid.
 */
export function isFogFrontier(
  state: GameState,
  p: Province,
  seenSet: Set<string>
): boolean {
  if (!state?.board?.provinces) return false;
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  return state.board.provinces.some((other) => {
    if (!seenSet.has(other.id)) return false;
    return dirs.some((d) => other.x === p.x + d.dx && other.y === p.y + d.dy);
  });
}

/**
 * Lists all unseen provinces on the board with their isometric world coordinates,
 * frontier status, and animation delay metadata.
 */
export function listUnseenFogProvinces(
  state?: GameState | null
): UnseenFogProvince[] {
  if (!state?.board?.provinces) return [];
  const homeId = state.board.homeProvinceId;
  const seenSet = new Set<string>();

  for (const p of state.board.provinces) {
    if (p.id === homeId || isProvinceSeen(state, p.id)) {
      seenSet.add(p.id);
    }
  }

  const unseen: UnseenFogProvince[] = [];
  for (const p of state.board.provinces) {
    if (seenSet.has(p.id)) continue;
    const { wx, wy } = boardGridToWorld(p.x, p.y);
    const frontier = isFogFrontier(state, p, seenSet);
    const delaySec = (((p.x * 7 + p.y * 13) % 29) / 10).toFixed(2);
    unseen.push({
      id: p.id,
      x: p.x,
      y: p.y,
      terrain: p.terrain,
      wx,
      wy,
      isFrontier: frontier,
      staggerDelay: `-${delaySec}s`,
    });
  }

  // Sort back-to-front depth order for isometric layering (y * 20 + x)
  return unseen.sort((a, b) => (a.y * 20 + a.x) - (b.y * 20 + b.x));
}

export interface BoardFogVeilProps {
  state?: GameState | null;
  className?: string;
}

/**
 * Living volumetric fog veil and mist glyphs on unseen provinces across the isometric board.
 * Renders layered SVG cumulus cloud masses, vapor wisps, aerial shadow, and central
 * cartographer brass compass star glyphs.
 * All layers are strictly pointer-events: none.
 */
export function BoardFogVeil({
  state,
  className = "",
}: BoardFogVeilProps): React.JSX.Element | null {
  if (!state) return null;
  const unseen = listUnseenFogProvinces(state);
  if (unseen.length === 0) return null;

  const hw = BOARD_HALF_W;
  const hh = BOARD_HALF_H;

  return (
    <g
      className={`sc-board-living-fog-veil ${className}`.trim()}
      data-testid="sc-board-living-fog-veil"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        {/* Soft volumetric fog puff gradient */}
        <radialGradient id="sc-board-fog-puff-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.88" />
          <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
        </radialGradient>

        {/* Ethereal celestial mist undertone */}
        <radialGradient id="sc-board-fog-mist-stratum" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#94a3b8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0" />
        </radialGradient>

        {/* Front-edge frontier mist flare */}
        <radialGradient id="sc-board-fog-frontier-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.55" />
          <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {unseen.map((fog) => {
        const cx = fog.wx;
        const cy = fog.wy - 8;
        const delayStyle = { animationDelay: fog.staggerDelay };
        const isAlt = (fog.x + fog.y) % 2 === 1;

        return (
          <g
            key={`fog-veil-${fog.id}`}
            className={`sc-board-fog-province${fog.isFrontier ? " is-frontier" : ""}`}
            data-fog-province-id={fog.id}
            data-fog-terrain={fog.terrain}
            style={{ pointerEvents: "none" }}
          >
            {/* 1. Aerial ground contact shadow on diorama base */}
            <ellipse
              cx={fog.wx}
              cy={fog.wy + 4}
              rx={hw * 0.94}
              ry={hh * 0.86}
              fill="#090d16"
              className="sc-board-fog-ground-shadow"
            />
            <ellipse
              cx={fog.wx}
              cy={fog.wy + 2.5}
              rx={hw * 0.72}
              ry={hh * 0.64}
              fill="#0f172a"
              className="sc-board-fog-ground-shadow"
            />

            {/* 2. Ethereal atmospheric sky-mist aura & base stratum */}
            <ellipse
              cx={cx}
              cy={cy + 4.5}
              rx={hw * 0.96}
              ry={hh * 0.88}
              fill="url(#sc-board-fog-mist-stratum)"
              className="sc-board-fog-base-mist"
              style={delayStyle}
            />

            {/* 3. Deep underside cloud shadow */}
            <ellipse
              cx={cx}
              cy={cy + 3.5}
              rx={hw * 0.9}
              ry={hh * 0.78}
              fill="#475569"
              className="sc-board-fog-underside-shadow"
            />

            {/* 4. Multi-tiered billowing cumulus cloud lobes */}
            {/* Flank and perimeter lobes */}
            <circle
              cx={cx - 13}
              cy={cy - 1}
              r={6.8}
              fill="#dbeafe"
              className={`sc-board-fog-cumulus-lobe${isAlt ? " is-alt" : ""}`}
              style={delayStyle}
            />
            <circle
              cx={cx + 13}
              cy={cy - 1}
              r={6.8}
              fill="#dbeafe"
              className={`sc-board-fog-cumulus-lobe${isAlt ? "" : " is-alt"}`}
              style={delayStyle}
            />
            <circle
              cx={cx - 16}
              cy={cy + 1}
              r={5.0}
              fill="#e2e8f0"
              className="sc-board-fog-cumulus-lobe"
              style={delayStyle}
            />
            <circle
              cx={cx + 16}
              cy={cy + 1}
              r={5.0}
              fill="#e2e8f0"
              className="sc-board-fog-cumulus-lobe is-alt"
              style={delayStyle}
            />
            <circle
              cx={cx}
              cy={cy - 6}
              r={8.2}
              fill="#e0f2fe"
              className="sc-board-fog-cumulus-lobe"
              style={delayStyle}
            />
            <circle
              cx={cx}
              cy={cy + 3.2}
              r={7.8}
              fill="#cbd5e1"
              className="sc-board-fog-cumulus-lobe is-alt"
              style={delayStyle}
            />

            {/* 5. Main volumetric cumulus mounds (pearl & soft white) */}
            <circle
              cx={cx - 8}
              cy={cy - 2}
              r={8.2}
              fill="#f1f5f9"
              className="sc-board-fog-core-bank"
              style={delayStyle}
            />
            <circle
              cx={cx + 8}
              cy={cy - 2}
              r={8.2}
              fill="#f1f5f9"
              className="sc-board-fog-core-bank"
              style={delayStyle}
            />
            <circle
              cx={cx - 1}
              cy={cy - 5}
              r={9.0}
              fill="#f8fafc"
              className="sc-board-fog-core-bank"
              style={delayStyle}
            />
            <circle
              cx={cx + 1}
              cy={cy + 1}
              r={8.6}
              fill="#ffffff"
              className="sc-board-fog-core-bank"
              style={delayStyle}
            />
            <circle
              cx={cx - 6}
              cy={cy + 2.5}
              r={6.8}
              fill="#f8fafc"
              className="sc-board-fog-core-bank is-alt"
              style={delayStyle}
            />
            <circle
              cx={cx + 7}
              cy={cy + 2.5}
              r={6.8}
              fill="#f8fafc"
              className="sc-board-fog-core-bank is-alt"
              style={delayStyle}
            />

            {/* 6. Sunlit crest highlights */}
            <ellipse
              cx={cx - 2}
              cy={cy - 8}
              rx={6.2}
              ry={3.2}
              fill="#ffffff"
              className="sc-board-fog-crest-highlight"
            />
            <circle
              cx={cx - 7}
              cy={cy - 4.5}
              r={4.4}
              fill="#ffffff"
              className="sc-board-fog-crest-highlight"
            />
            <circle
              cx={cx + 7}
              cy={cy - 4.5}
              r={4.4}
              fill="#ffffff"
              className="sc-board-fog-crest-highlight"
            />
            <ellipse
              cx={cx + 1}
              cy={cy - 0.5}
              rx={5.8}
              ry={3.2}
              fill="#ffffff"
              className="sc-board-fog-crest-highlight"
            />

            {/* 7. Windblown vapor wisps & tendrils */}
            <path
              d={`M ${cx - 15} ${cy - 4} Q ${cx - 19} ${cy - 6.5} ${cx - 22} ${cy - 4.5}`}
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="0.9"
              strokeLinecap="round"
              className="sc-board-fog-wisp"
              style={delayStyle}
            />
            <path
              d={`M ${cx + 14} ${cy + 2.5} Q ${cx + 18} ${cy + 5} ${cx + 22} ${cy + 3}`}
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="0.9"
              strokeLinecap="round"
              className="sc-board-fog-wisp is-alt"
              style={delayStyle}
            />
            <path
              d={`M ${cx - 6} ${cy - 9.5} Q ${cx} ${cy - 11.5} ${cx + 6} ${cy - 9.5}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.0"
              strokeLinecap="round"
              className="sc-board-fog-wisp"
              style={delayStyle}
            />

            {/* 8. Drifting ambient mist motes */}
            <circle
              cx={cx - 4}
              cy={cy - 6}
              r={0.8}
              fill="#f1f5f9"
              className="sc-board-fog-mist-mote"
              style={delayStyle}
            />
            <circle
              cx={cx + 5}
              cy={cy - 5}
              r={0.7}
              fill="#e2e8f0"
              className="sc-board-fog-mist-mote"
              style={delayStyle}
            />

            {/* 9. Antique Cartographer Brass Compass Star */}
            <g
              className="sc-board-fog-compass-star"
              style={delayStyle}
            >
              <polygon
                points={`${cx},${cy - 6} ${cx + 1.4},${cy - 1.6} ${cx + 5.5},${cy} ${cx + 1.4},${cy + 1.6} ${cx},${cy + 6} ${cx - 1.4},${cy + 1.6} ${cx - 5.5},${cy} ${cx - 1.4},${cy - 1.6}`}
                fill="#d4a359"
              />
              <polygon
                points={`${cx},${cy - 3.8} ${cx + 0.9},${cy - 1} ${cx + 3.6},${cy} ${cx + 0.9},${cy + 1} ${cx},${cy + 3.8} ${cx - 0.9},${cy + 1} ${cx - 3.6},${cy} ${cx - 0.9},${cy - 1}`}
                fill="#fde047"
              />
              <circle
                cx={cx}
                cy={cy}
                r={1.2}
                fill="#fffbeb"
                className="sc-board-fog-star-shimmer"
              />
            </g>

            {/* 10. Shroud frontier indicator on provinces adjacent to vision */}
            {fog.isFrontier && (
              <ellipse
                cx={cx}
                cy={cy + 2}
                rx={hw * 0.8}
                ry={hh * 0.7}
                fill="url(#sc-board-fog-frontier-grad)"
                className="sc-board-fog-frontier-glow"
                style={delayStyle}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Drop-in alias for BoardFogVeil */
export const BoardFog = BoardFogVeil;
export const BoardFogLiving = BoardFogVeil;
export const BoardMistGlyphs = BoardFogVeil;
