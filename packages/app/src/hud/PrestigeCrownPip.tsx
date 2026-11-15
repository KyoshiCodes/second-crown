import type { CSSProperties } from "react";
import { getProvince, type GameState } from "@second-crown/sim";
import "./prestige-crown-pip.css";

export type PrestigeTier = 0 | 1 | 2 | 3 | 4;

export interface PrestigeCrownDescriptor {
  prestige: number;
  tier: PrestigeTier;
  glowOpacity: number;
  pulseDurationSec: number;
  crownFill: string;
  crownStroke: string;
  gemFill: string;
  auraColor: string;
}

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

const CROWN_TIERS: Record<PrestigeTier, Omit<PrestigeCrownDescriptor, "prestige">> = {
  0: {
    tier: 0,
    glowOpacity: 0.18,
    pulseDurationSec: 5.5,
    crownFill: "#b45309",
    crownStroke: "#78350f",
    gemFill: "#fde68a",
    auraColor: "#f59e0b",
  },
  1: {
    tier: 1,
    glowOpacity: 0.36,
    pulseDurationSec: 4.4,
    crownFill: "#d97706",
    crownStroke: "#92400e",
    gemFill: "#fef08a",
    auraColor: "#fbbf24",
  },
  2: {
    tier: 2,
    glowOpacity: 0.55,
    pulseDurationSec: 3.4,
    crownFill: "#f59e0b",
    crownStroke: "#b45309",
    gemFill: "#fef9c3",
    auraColor: "#fde047",
  },
  3: {
    tier: 3,
    glowOpacity: 0.76,
    pulseDurationSec: 2.6,
    crownFill: "#fbbf24",
    crownStroke: "#b45309",
    gemFill: "#ffffff",
    auraColor: "#fef08a",
  },
  4: {
    tier: 4,
    glowOpacity: 0.95,
    pulseDurationSec: 2.0,
    crownFill: "#fde047",
    crownStroke: "#d97706",
    gemFill: "#93c5fd",
    auraColor: "#fef9c3",
  },
};

export function resolvePrestigeCrownDescriptor(prestige: number): PrestigeCrownDescriptor {
  const safePrestige = Number.isFinite(prestige) && prestige > 0 ? Math.floor(prestige) : 0;
  const tier = Math.min(4, safePrestige) as PrestigeTier;
  return {
    prestige: safePrestige,
    ...CROWN_TIERS[tier],
  };
}

export interface PrestigeCrownPipProps {
  prestige?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function PrestigeCrownPip({
  prestige = 0,
  size = 16,
  className = "",
  style,
}: PrestigeCrownPipProps) {
  const desc = resolvePrestigeCrownDescriptor(prestige);
  const auraId = `sc-crown-aura-${desc.tier}`;
  const wrapStyle: CSSProperties = {
    width: size,
    height: size,
    pointerEvents: "none",
    ...style,
  };

  return (
    <span
      className={`sc-prestige-crown-pip tier-${desc.tier} ${className}`.trim()}
      style={wrapStyle}
      aria-hidden="true"
      data-prestige-crown="true"
      data-prestige={desc.prestige}
      data-prestige-tier={desc.tier}
      data-glow-opacity={desc.glowOpacity.toFixed(2)}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-prestige-crown-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={desc.auraColor} stopOpacity={desc.glowOpacity} />
            <stop offset="65%" stopColor={desc.auraColor} stopOpacity={desc.glowOpacity * 0.45} />
            <stop offset="100%" stopColor={desc.auraColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="8"
          cy="8"
          r={5.4 + desc.tier * 0.45}
          fill={`url(#${auraId})`}
          className="sc-prestige-crown-aura"
          style={{ pointerEvents: "none" }}
        />

        <g className="sc-prestige-crown-body" style={{ pointerEvents: "none" }}>
          <path
            d="M 3 11.8 L 2.2 6.2 L 5.4 8.4 L 8 4.2 L 10.6 8.4 L 13.8 6.2 L 13 11.8 Z"
            fill={desc.crownFill}
            stroke={desc.crownStroke}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          <rect
            x="3"
            y="11.6"
            width="10"
            height="1.6"
            rx="0.6"
            fill={desc.crownFill}
            stroke={desc.crownStroke}
            strokeWidth="0.7"
          />
        </g>

        <circle
          cx="8"
          cy="4.2"
          r={0.85 + desc.tier * 0.08}
          fill={desc.gemFill}
          className="sc-prestige-crown-gem"
          style={{ pointerEvents: "none" }}
        />
        {desc.tier >= 2 && (
          <>
            <circle cx="2.3" cy="6.1" r="0.65" fill={desc.gemFill} className="sc-prestige-crown-gem" />
            <circle cx="13.7" cy="6.1" r="0.65" fill={desc.gemFill} className="sc-prestige-crown-gem" />
          </>
        )}
      </svg>
    </span>
  );
}

export interface HomeKeepCrownPipProps {
  state: GameState;
}

export function HomeKeepCrownPip({ state }: HomeKeepCrownPipProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const prestige = Number(state.flags?.["prestige_level"] ?? 0);
  const desc = resolvePrestigeCrownDescriptor(prestige);
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx;
  const cy = wy - 21;
  const auraId = `sc-keep-crown-aura-${desc.tier}`;

  return (
    <g
      className={`sc-keep-prestige-crown tier-${desc.tier}`}
      data-home-keep-crown="true"
      data-province-id={homeId}
      data-prestige={desc.prestige}
      data-prestige-tier={desc.tier}
      data-glow-opacity={desc.glowOpacity.toFixed(2)}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={desc.auraColor} stopOpacity={desc.glowOpacity} />
          <stop offset="65%" stopColor={desc.auraColor} stopOpacity={desc.glowOpacity * 0.4} />
          <stop offset="100%" stopColor={desc.auraColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={5.8 + desc.tier * 0.7}
        fill={`url(#${auraId})`}
        className="sc-keep-prestige-crown-aura"
        style={{ pointerEvents: "none" }}
      />

      <g className="sc-keep-prestige-crown-body" style={{ pointerEvents: "none" }}>
        <path
          d={`M ${cx - 4.2} ${cy + 2.2} L ${cx - 4.8} ${cy - 2.0} L ${cx - 2.0} ${cy + 0.1} L ${cx} ${cy - 3.4} L ${cx + 2.0} ${cy + 0.1} L ${cx + 4.8} ${cy - 2.0} L ${cx + 4.2} ${cy + 2.2} Z`}
          fill={desc.crownFill}
          stroke={desc.crownStroke}
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
      </g>

      <circle
        cx={cx}
        cy={cy - 3.4}
        r={0.8 + desc.tier * 0.08}
        fill={desc.gemFill}
        className="sc-keep-prestige-crown-gem"
        style={{ pointerEvents: "none" }}
      />
      {desc.tier >= 2 && (
        <>
          <circle cx={cx - 4.7} cy={cy - 2.0} r="0.6" fill={desc.gemFill} className="sc-keep-prestige-crown-gem" />
          <circle cx={cx + 4.7} cy={cy - 2.0} r="0.6" fill={desc.gemFill} className="sc-keep-prestige-crown-gem" />
        </>
      )}
    </g>
  );
}
