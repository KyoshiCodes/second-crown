import type { CSSProperties } from "react";
import { getCulture, getProvince, playerCultureId, type GameState } from "@second-crown/sim";
import "./living-culture-banner.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

function boardGridToWorld(bx: number, by: number): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (bx - by) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (bx + by) * BOARD_HALF_H,
  };
}

export type CultureBannerPattern =
  | "chevron"
  | "pine"
  | "diamond"
  | "stripe"
  | "wave"
  | "band"
  | "check"
  | "saltire"
  | "reed"
  | "peak";

export interface CultureBannerDescriptor {
  cultureId: string;
  name: string;
  primary: string;
  accent: string;
  trim: string;
  auraColor: string;
  pattern: CultureBannerPattern;
}

const BANNER_META: Record<
  string,
  Omit<CultureBannerDescriptor, "cultureId" | "name" | "primary">
> = {
  western: {
    accent: "#fef08a",
    trim: "#fbbf24",
    auraColor: "#3b82f6",
    pattern: "chevron",
  },
  woodland: {
    accent: "#bbf7d0",
    trim: "#a16207",
    auraColor: "#22c55e",
    pattern: "pine",
  },
  desert: {
    accent: "#fef3c7",
    trim: "#f59e0b",
    auraColor: "#fbbf24",
    pattern: "diamond",
  },
  steppe: {
    accent: "#fecdd3",
    trim: "#fb7185",
    auraColor: "#e11d48",
    pattern: "stripe",
  },
  tide: {
    accent: "#a5f3fc",
    trim: "#22d3ee",
    auraColor: "#06b6d4",
    pattern: "wave",
  },
  mist: {
    accent: "#cbd5e1",
    trim: "#94a3b8",
    auraColor: "#64748b",
    pattern: "band",
  },
  glen: {
    accent: "#d9f99d",
    trim: "#84cc16",
    auraColor: "#65a30d",
    pattern: "check",
  },
  salt: {
    accent: "#f5f5f4",
    trim: "#d6d3d1",
    auraColor: "#e7e5e4",
    pattern: "saltire",
  },
  fen: {
    accent: "#bef264",
    trim: "#65a30d",
    auraColor: "#4d7c0f",
    pattern: "reed",
  },
  peak: {
    accent: "#e2e8f0",
    trim: "#f8fafc",
    auraColor: "#cbd5e1",
    pattern: "peak",
  },
};

export function resolveCultureBannerDescriptor(cultureId?: string): CultureBannerDescriptor {
  const def = getCulture(cultureId);
  const meta = BANNER_META[def.id] ?? BANNER_META.western;
  return {
    cultureId: def.id,
    name: def.name,
    primary: def.palette.tabard,
    accent: meta.accent,
    trim: meta.trim,
    auraColor: meta.auraColor,
    pattern: meta.pattern,
  };
}

export function readCultureBannerState(state?: GameState | null): CultureBannerDescriptor {
  const id = state && state.flags ? playerCultureId(state) : "western";
  return resolveCultureBannerDescriptor(id);
}

function BannerPatternArt({
  pattern,
  accent,
  ox = 0,
  oy = 0,
  scale = 1,
}: {
  pattern: CultureBannerPattern;
  accent: string;
  ox?: number;
  oy?: number;
  scale?: number;
}) {
  const tx = (x: number) => ox + x * scale;
  const ty = (y: number) => oy + y * scale;

  switch (pattern) {
    case "chevron":
      return (
        <path
          d={`M ${tx(4.6)} ${ty(5.4)} L ${tx(7.2)} ${ty(7.3)} L ${tx(4.6)} ${ty(9.2)}`}
          fill="none"
          stroke={accent}
          strokeWidth={1.05 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "pine":
      return (
        <polygon
          points={`${tx(7.4)},${ty(4.7)} ${tx(9.2)},${ty(8.8)} ${tx(5.6)},${ty(8.8)}`}
          fill={accent}
        />
      );
    case "diamond":
      return (
        <polygon
          points={`${tx(7.4)},${ty(5.0)} ${tx(9.2)},${ty(7.0)} ${tx(7.4)},${ty(9.0)} ${tx(5.6)},${ty(7.0)}`}
          fill={accent}
        />
      );
    case "stripe":
      return (
        <>
          <line
            x1={tx(4.2)}
            y1={ty(5.8)}
            x2={tx(10.6)}
            y2={ty(5.8)}
            stroke={accent}
            strokeWidth={0.95 * scale}
            strokeLinecap="round"
          />
          <line
            x1={tx(4.2)}
            y1={ty(8.2)}
            x2={tx(10.6)}
            y2={ty(8.2)}
            stroke={accent}
            strokeWidth={0.95 * scale}
            strokeLinecap="round"
          />
        </>
      );
    case "wave":
      return (
        <path
          d={`M ${tx(4.3)} ${ty(7.2)} Q ${tx(6.0)} ${ty(5.4)} ${tx(7.6)} ${ty(7.2)} T ${tx(10.8)} ${ty(7.2)}`}
          fill="none"
          stroke={accent}
          strokeWidth={1.0 * scale}
          strokeLinecap="round"
        />
      );
    case "band":
      return (
        <line
          x1={tx(4.4)}
          y1={ty(8.8)}
          x2={tx(10.2)}
          y2={ty(5.2)}
          stroke={accent}
          strokeWidth={1.15 * scale}
          strokeLinecap="round"
        />
      );
    case "check":
      return (
        <>
          <rect x={tx(5.1)} y={ty(5.2)} width={1.9 * scale} height={1.7 * scale} fill={accent} />
          <rect x={tx(7.2)} y={ty(7.1)} width={1.9 * scale} height={1.7 * scale} fill={accent} />
        </>
      );
    case "saltire":
      return (
        <>
          <line
            x1={tx(5.0)}
            y1={ty(5.2)}
            x2={tx(9.6)}
            y2={ty(8.8)}
            stroke={accent}
            strokeWidth={0.95 * scale}
            strokeLinecap="round"
          />
          <line
            x1={tx(9.6)}
            y1={ty(5.2)}
            x2={tx(5.0)}
            y2={ty(8.8)}
            stroke={accent}
            strokeWidth={0.95 * scale}
            strokeLinecap="round"
          />
        </>
      );
    case "reed":
      return (
        <>
          <line
            x1={tx(5.8)}
            y1={ty(9.2)}
            x2={tx(5.8)}
            y2={ty(5.2)}
            stroke={accent}
            strokeWidth={0.85 * scale}
            strokeLinecap="round"
          />
          <line
            x1={tx(8.2)}
            y1={ty(9.2)}
            x2={tx(8.2)}
            y2={ty(4.9)}
            stroke={accent}
            strokeWidth={0.85 * scale}
            strokeLinecap="round"
          />
        </>
      );
    case "peak":
      return (
        <polyline
          points={`${tx(4.6)},${ty(9.0)} ${tx(6.6)},${ty(5.4)} ${tx(8.0)},${ty(7.5)} ${tx(9.4)},${ty(5.8)} ${tx(10.8)},${ty(9.0)}`}
          fill="none"
          stroke={accent}
          strokeWidth={0.95 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

export interface LivingCultureBannerProps {
  cultureId?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingCultureBanner({
  cultureId,
  size = 16,
  className = "",
  style,
}: LivingCultureBannerProps) {
  const desc = resolveCultureBannerDescriptor(cultureId);
  const gradId = `sc-culture-banner-grad-${desc.cultureId}`;

  return (
    <span
      className={`sc-living-culture-banner culture-${desc.cultureId} pattern-${desc.pattern} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-culture-banner="true"
      data-banner-culture={desc.cultureId}
      data-banner-pattern={desc.pattern}
      data-banner-color={desc.primary}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-culture-banner-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={desc.auraColor} stopOpacity="0.72" />
            <stop offset="65%" stopColor={desc.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={desc.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="8"
          cy="8"
          r="7.2"
          fill={`url(#${gradId})`}
          className="sc-living-culture-banner-aura"
          style={{ pointerEvents: "none" }}
        />

        {/* Mast and gilded finial */}
        <line
          x1="3.2"
          y1="2.4"
          x2="3.2"
          y2="14.2"
          stroke="#cbd5e1"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        <circle cx="3.2" cy="2.1" r="0.95" fill={desc.trim} />

        {/* Fluttering swallowtail cloth with active culture colors & heraldic pattern */}
        <g className="sc-living-culture-banner-cloth" style={{ pointerEvents: "none" }}>
          <polygon
            points="3.7,3.4 13.6,4.2 11.4,7.0 13.6,9.8 3.7,10.6"
            fill={desc.primary}
            stroke={desc.trim}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
          <g className="sc-living-culture-banner-pattern" style={{ pointerEvents: "none" }}>
            <BannerPatternArt pattern={desc.pattern} accent={desc.accent} />
          </g>
        </g>
      </svg>
    </span>
  );
}

export interface HomeKeepCultureBannerProps {
  state: GameState;
}

export function HomeKeepCultureBanner({ state }: HomeKeepCultureBannerProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const desc = readCultureBannerState(state);
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx;
  const cy = wy - 29;
  const gradId = `sc-keep-culture-banner-grad-${desc.cultureId}`;

  return (
    <g
      className={`sc-keep-culture-banner culture-${desc.cultureId} pattern-${desc.pattern}`}
      data-home-keep-culture-banner="true"
      data-province-id={homeId}
      data-banner-culture={desc.cultureId}
      data-banner-pattern={desc.pattern}
      data-banner-color={desc.primary}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={desc.auraColor} stopOpacity="0.72" />
          <stop offset="65%" stopColor={desc.primary} stopOpacity="0.28" />
          <stop offset="100%" stopColor={desc.primary} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx={cx + 2.5}
        cy={cy - 1.5}
        r={6.4}
        fill={`url(#${gradId})`}
        className="sc-keep-culture-banner-aura"
        style={{ pointerEvents: "none" }}
      />

      <line
        x1={cx - 3.6}
        y1={cy - 5.2}
        x2={cx - 3.6}
        y2={cy + 3.8}
        stroke="#e2e8f0"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <circle cx={cx - 3.6} cy={cy - 5.5} r="0.8" fill={desc.trim} />

      <g className="sc-keep-culture-banner-cloth" style={{ pointerEvents: "none" }}>
        <polygon
          points={`${cx - 3.1},${cy - 4.4} ${cx + 5.6},${cy - 3.6} ${cx + 3.6},${cy - 1.4} ${cx + 5.6},${cy + 0.8} ${cx - 3.1},${cy + 1.5}`}
          fill={desc.primary}
          stroke={desc.trim}
          strokeWidth="0.65"
          strokeLinejoin="round"
        />
        <g className="sc-keep-culture-banner-pattern" style={{ pointerEvents: "none" }}>
          <BannerPatternArt
            pattern={desc.pattern}
            accent={desc.accent}
            ox={cx - 5.2}
            oy={cy - 6.7}
            scale={0.75}
          />
        </g>
      </g>
    </g>
  );
}
