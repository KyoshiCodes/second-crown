import type { CSSProperties } from "react";
import { canAscend, getProvince, type GameState } from "@second-crown/sim";
import { sharedRealmId } from "../game/settleOnLoad";
import "./living-age-seal.css";

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

export type AgeSealTier = 0 | 1 | 2 | 3 | 4;

export interface AgeSealDescriptor {
  dawn: number;
  tier: AgeSealTier;
  ready: boolean;
  shared: boolean;
  glowOpacity: number;
  shiftDurationSec: number;
  sealFill: string;
  rimStroke: string;
  innerFill: string;
  emblemFill: string;
  auraInner: string;
  auraOuter: string;
}

const AGE_TIER_PALETTES: Record<
  AgeSealTier,
  Omit<AgeSealDescriptor, "dawn" | "tier" | "ready" | "shared">
> = {
  0: {
    glowOpacity: 0.22,
    shiftDurationSec: 5.2,
    sealFill: "#92400e",
    rimStroke: "#d97706",
    innerFill: "#451a03",
    emblemFill: "#fde68a",
    auraInner: "#f59e0b",
    auraOuter: "#b45309",
  },
  1: {
    glowOpacity: 0.42,
    shiftDurationSec: 4.3,
    sealFill: "#b45309",
    rimStroke: "#f59e0b",
    innerFill: "#78350f",
    emblemFill: "#fef08a",
    auraInner: "#fbbf24",
    auraOuter: "#d97706",
  },
  2: {
    glowOpacity: 0.62,
    shiftDurationSec: 3.5,
    sealFill: "#d97706",
    rimStroke: "#fbbf24",
    innerFill: "#92400e",
    emblemFill: "#fef9c3",
    auraInner: "#fde047",
    auraOuter: "#f59e0b",
  },
  3: {
    glowOpacity: 0.8,
    shiftDurationSec: 2.8,
    sealFill: "#7c3aed",
    rimStroke: "#fde047",
    innerFill: "#4c1d95",
    emblemFill: "#ffffff",
    auraInner: "#fef08a",
    auraOuter: "#8b5cf6",
  },
  4: {
    glowOpacity: 0.96,
    shiftDurationSec: 2.2,
    sealFill: "#1d4ed8",
    rimStroke: "#fef08a",
    innerFill: "#1e3a8a",
    emblemFill: "#ffffff",
    auraInner: "#fef9c3",
    auraOuter: "#38bdf8",
  },
};

export function resolveAgeSealDescriptor({
  dawn,
  ready = false,
  shared = false,
}: {
  dawn: number;
  ready?: boolean;
  shared?: boolean;
}): AgeSealDescriptor {
  const safeDawn = Number.isFinite(dawn) && dawn > 0 ? Math.floor(dawn) : 0;
  const tier = Math.min(4, safeDawn) as AgeSealTier;

  if (shared) {
    return {
      dawn: safeDawn,
      tier,
      ready: false,
      shared: true,
      glowOpacity: 0.32,
      shiftDurationSec: 5.8,
      sealFill: "#334155",
      rimStroke: "#93c5fd",
      innerFill: "#1e293b",
      emblemFill: "#e0f2fe",
      auraInner: "#60a5fa",
      auraOuter: "#3b82f6",
    };
  }

  const base = AGE_TIER_PALETTES[tier];
  return {
    dawn: safeDawn,
    tier,
    ready,
    shared: false,
    glowOpacity: ready ? Math.max(0.88, base.glowOpacity) : base.glowOpacity,
    shiftDurationSec: ready ? 2.0 : base.shiftDurationSec,
    sealFill: base.sealFill,
    rimStroke: base.rimStroke,
    innerFill: base.innerFill,
    emblemFill: base.emblemFill,
    auraInner: base.auraInner,
    auraOuter: base.auraOuter,
  };
}

export function readAgeSealState(state?: GameState | null): AgeSealDescriptor {
  if (!state || !state.flags) {
    return resolveAgeSealDescriptor({ dawn: 0, ready: false, shared: false });
  }
  const dawn = Number(state.flags["prestige_level"] ?? 0);
  const shared = sharedRealmId(state) !== null;
  const ready = !shared && Boolean(state.resources) && canAscend(state);
  return resolveAgeSealDescriptor({ dawn, ready, shared });
}

export interface LivingAgeSealProps {
  dawn?: number;
  ready?: boolean;
  shared?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingAgeSeal({
  dawn = 0,
  ready = false,
  shared = false,
  size = 15,
  className = "",
  style,
}: LivingAgeSealProps) {
  const desc = resolveAgeSealDescriptor({ dawn, ready, shared });
  const statusClass = desc.shared ? "is-shared" : desc.ready ? "is-ready" : "is-waiting";
  const gradId = `sc-age-seal-grad-${desc.shared ? "shared" : desc.tier}`;

  return (
    <span
      className={`sc-living-age-seal age-tier-${desc.tier} ${statusClass} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-age-seal="true"
      data-age-dawn={desc.dawn}
      data-age-tier={desc.tier}
      data-age-ready={desc.ready ? "true" : "false"}
      data-age-shared={desc.shared ? "true" : "false"}
      data-glow-opacity={desc.glowOpacity.toFixed(2)}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-age-seal-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={desc.auraInner} stopOpacity={desc.glowOpacity} />
            <stop offset="65%" stopColor={desc.auraOuter} stopOpacity={desc.glowOpacity * 0.45} />
            <stop offset="100%" stopColor={desc.auraOuter} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="8"
          cy="8"
          r={5.8 + desc.tier * 0.4}
          fill={`url(#${gradId})`}
          className="sc-living-age-seal-aura"
          style={{ pointerEvents: "none" }}
        />

        <g className="sc-living-age-seal-body" style={{ pointerEvents: "none" }}>
          {/* Octagonal epoch seal */}
          <polygon
            points="5.8,2.6 10.2,2.6 13.4,5.8 13.4,10.2 10.2,13.4 5.8,13.4 2.6,10.2 2.6,5.8"
            fill={desc.sealFill}
            stroke={desc.rimStroke}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          <circle
            cx="8"
            cy="8"
            r="3.7"
            fill={desc.innerFill}
            stroke={desc.rimStroke}
            strokeWidth="0.55"
          />
          {/* Rising horizon arc & solar diamond */}
          <path
            d="M 5.4 9.5 C 6.2 7.5 9.8 7.5 10.6 9.5 Z"
            fill={desc.emblemFill}
          />
          <line
            x1="4.9"
            y1="9.9"
            x2="11.1"
            y2="9.9"
            stroke={desc.rimStroke}
            strokeWidth="0.65"
            strokeLinecap="round"
          />
          {desc.tier >= 1 && (
            <circle cx="5.2" cy="5.2" r="0.65" fill={desc.emblemFill} />
          )}
          {desc.tier >= 2 && (
            <circle cx="10.8" cy="5.2" r="0.65" fill={desc.emblemFill} />
          )}
          {desc.tier >= 3 && (
            <circle cx="8" cy="4.2" r="0.7" fill={desc.emblemFill} />
          )}
        </g>

        {(desc.tier >= 1 || desc.ready) && (
          <polygon
            points="8,1.5 8.55,2.75 9.8,3.3 8.55,3.85 8,5.1 7.45,3.85 6.2,3.3 7.45,2.75"
            fill={desc.emblemFill}
            className="sc-living-age-seal-glint"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </span>
  );
}

export interface HomeKeepAgeSealProps {
  state: GameState;
}

export function HomeKeepAgeSeal({ state }: HomeKeepAgeSealProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const desc = readAgeSealState(state);
  const statusClass = desc.shared ? "is-shared" : desc.ready ? "is-ready" : "is-waiting";
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx + 11;
  const cy = wy - 6;
  const gradId = `sc-keep-age-grad-${desc.shared ? "shared" : desc.tier}`;

  return (
    <g
      className={`sc-keep-age-seal age-tier-${desc.tier} ${statusClass}`}
      data-home-keep-age-seal="true"
      data-province-id={homeId}
      data-age-dawn={desc.dawn}
      data-age-tier={desc.tier}
      data-age-ready={desc.ready ? "true" : "false"}
      data-glow-opacity={desc.glowOpacity.toFixed(2)}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={desc.auraInner} stopOpacity={desc.glowOpacity} />
          <stop offset="65%" stopColor={desc.auraOuter} stopOpacity={desc.glowOpacity * 0.42} />
          <stop offset="100%" stopColor={desc.auraOuter} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={5.8 + desc.tier * 0.5}
        fill={`url(#${gradId})`}
        className="sc-keep-age-seal-aura"
        style={{ pointerEvents: "none" }}
      />

      <g className="sc-keep-age-seal-body" style={{ pointerEvents: "none" }}>
        <polygon
          points={`${cx - 1.5},${cy - 3.6} ${cx + 1.5},${cy - 3.6} ${cx + 3.6},${cy - 1.5} ${cx + 3.6},${cy + 1.5} ${cx + 1.5},${cy + 3.6} ${cx - 1.5},${cy + 3.6} ${cx - 3.6},${cy + 1.5} ${cx - 3.6},${cy - 1.5}`}
          fill={desc.sealFill}
          stroke={desc.rimStroke}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={2.15}
          fill={desc.innerFill}
          stroke={desc.rimStroke}
          strokeWidth="0.45"
        />
        <circle cx={cx} cy={cy} r={0.95} fill={desc.emblemFill} />
      </g>

      {(desc.tier >= 1 || desc.ready) && (
        <circle
          cx={cx}
          cy={cy - 3.9}
          r={0.85}
          fill={desc.emblemFill}
          className="sc-keep-age-seal-glint"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}
