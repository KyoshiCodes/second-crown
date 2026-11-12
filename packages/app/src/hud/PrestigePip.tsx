import React from "react";
import { ascendThreshold, canAscend, formatLetterSuffix, type GameState } from "@second-crown/sim";
import { sharedRealmId } from "../game/settleOnLoad";
import "./prestige-pip.css";

export type PrestigeTier = 0 | 1 | 2 | 3 | 4;

export type PrestigeEpoch =
  | "mortal"
  | "second-dawn"
  | "ascendant"
  | "imperial"
  | "celestial"
  | "shared";

export interface PrestigePipProps {
  /** Prestige level (Dawn count, flags.prestige_level in save). Defaults to 0. */
  dawn?: number;
  /** Whether ascension threshold is reached and the realm is ready to ascend. */
  ready?: boolean;
  /** Whether the realm is a shared hold (no ascension). */
  shared?: boolean;
  /** Size in pixels (default: 18). */
  size?: number;
  /** Optional custom CSS class name. */
  className?: string;
  /** Optional inline styles. */
  style?: React.CSSProperties;
  /** Optional title override. */
  title?: string;
}

/**
 * Maps prestige / dawn count to an epoch classification.
 */
export function resolvePrestigeEpoch(dawn = 0, shared = false): PrestigeEpoch {
  if (shared) return "shared";
  const d = Number.isFinite(dawn) ? dawn : 0;
  if (d <= 0) return "mortal";
  if (d === 1) return "second-dawn";
  if (d === 2) return "ascendant";
  if (d === 3) return "imperial";
  return "celestial";
}

/**
 * Maps prestige count to a tier index (0 to 4).
 */
export function resolvePrestigeTier(dawn = 0): PrestigeTier {
  const d = Number.isFinite(dawn) ? dawn : 0;
  if (d <= 0) return 0;
  if (d === 1) return 1;
  if (d === 2) return 2;
  if (d === 3) return 3;
  return 4;
}

/**
 * Human-readable prestige title and status descriptor.
 */
export function resolvePrestigeTitle(dawn = 0, ready = false, shared = false): string {
  if (shared) return "Shared Realm · Enduring Epoch";
  const epoch = resolvePrestigeEpoch(dawn, shared);
  const epochName =
    epoch === "mortal"
      ? "Mortal Dawn"
      : epoch === "second-dawn"
        ? "First Second Dawn"
        : epoch === "ascendant"
          ? "Age of Crowns"
          : epoch === "imperial"
            ? "Imperial Epoch"
            : "Celestial Era";

  const readyStr = ready ? " · Ready to Ascend" : "";
  return `Prestige ${dawn} · ${epochName}${readyStr}`;
}

/**
 * Living prestige crest & age seal vector artwork (viewBox 0 0 24 24).
 * Changes dynamically across:
 * - Dawn 0 (Mortal Age): rustic ashlar foundation, quiet crescent dawn horizon, single dawn pip.
 * - Dawn 1 (First Second Dawn): gilded solar disc, arching laurel wreath, single apex star.
 * - Dawn 2 (Age of Crowns): twin-peaked heraldic coronet, dual laurels, 2 radiant stars.
 * - Dawn 3 (Imperial Epoch): imperial diadem crown with central jewel, 3 constellation stars, sunburst mantle.
 * - Dawn 4+ (Celestial Era): celestial platinum crown, diamond heart, quad constellation stars, solar corona halo.
 * - Shared: enduring sapphire monolith, celestial disc, foundation star.
 * - Ready: expanding radial ripple ring and solar starburst.
 */
export function PrestigePip({
  dawn = 0,
  ready = false,
  shared = false,
  size = 18,
  className = "",
  style,
  title,
}: PrestigePipProps) {
  const tier = resolvePrestigeTier(dawn);
  const epoch = resolvePrestigeEpoch(dawn, shared);
  const statusClass = shared ? "is-shared" : ready ? "is-ready" : "is-waiting";
  const label = title ?? resolvePrestigeTitle(dawn, ready, shared);

  return (
    <span
      className={`sc-prestige-pip-wrapper ${statusClass} tier-${tier} epoch-${epoch} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
      aria-hidden="true"
      title={label}
      data-prestige-pip="true"
      data-prestige-tier={tier}
      data-dawn={dawn}
      data-epoch={epoch}
      data-ready={ready ? "true" : "false"}
    >
      {/* Ready state: expanding radiant ripple shockwave */}
      {ready && <span className="sc-prestige-ready-ring" aria-hidden="true" />}

      {/* Breathing atmospheric aura halo */}
      <span className="sc-prestige-aura" aria-hidden="true" />

      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-prestige-svg ${statusClass} tier-${tier}`}
        focusable="false"
      >
        {shared ? (
          /* Shared Hold: Eternal Sapphire Monolith */
          <g className="sc-prestige-shared-group">
            <circle cx="12" cy="12" r="10.5" className="sc-prestige-glow-layer" opacity="0.18" fill="#3b82f6" />
            <path d="M4 19 H20" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" />
            <path
              d="M8.5 19 L9.5 9 L14.5 9 L15.5 19 Z"
              fill="#1e293b"
              stroke="#64748b"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="7.5" r="3.2" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.1" />
            <circle cx="12" cy="7.5" r="1.1" fill="#ffffff" />
          </g>
        ) : (
          /* Solo Realm: Age Crest & Prestige Seal changing with tier */
          <g className="sc-prestige-crest-group">
            {/* Layer 1: Ambient aura glow */}
            <circle
              cx="12"
              cy="12"
              r="10.5"
              className="sc-prestige-glow-layer"
              opacity={ready ? "0.32" : tier > 0 ? "0.22" : "0.12"}
            />

            {/* Layer 2: Horizon or Seal foundation */}
            <path
              d="M3 18.5 C7 17.2 17 17.2 21 18.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="sc-prestige-horizon"
            />

            {/* Layer 3: Rising Sun / Crest Body */}
            {tier === 0 ? (
              /* Dawn 0 (Mortal Age): Rustic ashlar arch & quiet morning crescent */
              <>
                <path
                  d="M7 18 C7 13.8 17 13.8 17 18 Z"
                  fill="#78716c"
                  fillOpacity="0.45"
                  stroke="#a8a29e"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="14" r="1.6" fill="#fef08a" opacity="0.85" />
                <path d="M12 9.5 V11.5 M8.5 11.5 L10 12.8 M15.5 11.5 L14 12.8" stroke="#d6d3d1" strokeWidth="1" strokeLinecap="round" />
              </>
            ) : tier === 1 ? (
              /* Dawn 1 (Golden Age): Solar disc, arching laurel, 1 apex star */
              <>
                <circle cx="12" cy="14" r="5" fill="#f59e0b" fillOpacity="0.35" stroke="#f59e0b" strokeWidth="1.2" />
                <path
                  d="M6 18 C5.2 12.5 8 8 12 6.5 C16 8 18.8 12.5 18 18"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  className="sc-prestige-laurel"
                />
                {/* 1 Apex Star */}
                <path
                  d="M12 2.5 L12.8 4.6 L15 5.4 L12.8 6.2 L12 8.3 L11.2 6.2 L9 5.4 L11.2 4.6 Z"
                  fill="#fef08a"
                  stroke="#d97706"
                  strokeWidth="0.5"
                  className="sc-prestige-star-1"
                />
                <circle cx="12" cy="14" r="1.8" fill="#fef08a" />
              </>
            ) : tier === 2 ? (
              /* Dawn 2 (Age of Crowns): Dual coronet, twin heraldic stars */
              <>
                <path
                  d="M6.5 18 L7.5 12 L12 14.5 L16.5 12 L17.5 18 Z"
                  fill="#ca8a04"
                  fillOpacity="0.4"
                  stroke="#eab308"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Dual Stars */}
                <path
                  d="M8 6 L8.6 7.5 L10.2 8 L8.6 8.5 L8 10 L7.4 8.5 L5.8 8 L7.4 7.5 Z"
                  fill="#fef08a"
                  stroke="#ca8a04"
                  strokeWidth="0.5"
                  className="sc-prestige-star-1"
                />
                <path
                  d="M16 6 L16.6 7.5 L18.2 8 L16.6 8.5 L16 10 L15.4 8.5 L13.8 8 L15.4 7.5 Z"
                  fill="#fef08a"
                  stroke="#ca8a04"
                  strokeWidth="0.5"
                  className="sc-prestige-star-2"
                />
                <circle cx="12" cy="11.5" r="1.5" fill="#fef08a" />
              </>
            ) : tier === 3 ? (
              /* Dawn 3 (Imperial Age): Imperial crown, 3 constellation stars */
              <>
                <path
                  d="M5.5 18 L6.5 11 L9.5 14 L12 9.5 L14.5 14 L17.5 11 L18.5 18 Z"
                  fill="#c2410c"
                  fillOpacity="0.4"
                  stroke="#f97316"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Triple Stars: Left, Apex, Right */}
                <circle cx="6.5" cy="8" r="1.4" fill="#fef08a" className="sc-prestige-star-1" />
                <path
                  d="M12 2.5 L12.8 4.6 L15 5.4 L12.8 6.2 L12 8.3 L11.2 6.2 L9 5.4 L11.2 4.6 Z"
                  fill="#ffffff"
                  stroke="#f97316"
                  strokeWidth="0.5"
                  className="sc-prestige-star-2"
                />
                <circle cx="17.5" cy="8" r="1.4" fill="#fef08a" className="sc-prestige-star-3" />
                <polygon points="12,13 13.5,15.5 10.5,15.5" fill="#fbbf24" />
              </>
            ) : (
              /* Dawn 4+ (Celestial Era): Celestial crown, diamond core, quad constellation */
              <>
                <path
                  d="M5 18 L6 10 L9.5 13.5 L12 8 L14.5 13.5 L18 10 L19 18 Z"
                  fill="#0369a1"
                  fillOpacity="0.45"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Quad Constellation Stars */}
                <circle cx="6" cy="7" r="1.3" fill="#93c5fd" className="sc-prestige-star-1" />
                <circle cx="18" cy="7" r="1.3" fill="#93c5fd" className="sc-prestige-star-2" />
                <path
                  d="M12 1.8 L12.9 4.2 L15.5 5.1 L12.9 6 L12 8.4 L11.1 6 L8.5 5.1 L11.1 4.2 Z"
                  fill="#ffffff"
                  stroke="#38bdf8"
                  strokeWidth="0.6"
                  className="sc-prestige-star-3"
                />
                <circle cx="12" cy="14" r="1.8" fill="#38bdf8" className="sc-prestige-star-4" />
                <polygon points="12,10.8 13.8,13.5 12,16.2 10.2,13.5" fill="#ffffff" />
              </>
            )}

            {/* Layer 4: Solar rays & flares */}
            <g className="sc-prestige-rays-group">
              <path d="M4.5 6 L6.2 7.8 M19.5 6 L17.8 7.8 M2 12 H4 M22 12 H20" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
    </span>
  );
}

/**
 * Enhanced Prestige Status Line component:
 * Renders the living prestige crest / age seal alongside current age progress,
 * resource threshold to the next age, and ascension readiness.
 */
export function PrestigeStatusLine(props: { state: GameState | undefined; className?: string }) {
  const { state, className = "" } = props;
  if (!state) return null;
  const dawn = Number(state.flags["prestige_level"] ?? 0);
  const tier = resolvePrestigeTier(dawn);
  const shared = sharedRealmId(state) !== null;

  if (shared) {
    return (
      <p
        className={`sc-prestige-line sc-age-line is-shared ${className}`.trim()}
        data-prestige-line="true"
        data-prestige-tier={tier}
        data-dawn={dawn}
        data-prestige={dawn}
      >
        <PrestigePip dawn={dawn} shared ready={false} size={18} />
        Age · <strong>Dawn {dawn}</strong> · a shared hold has no Second Dawn.
      </p>
    );
  }

  const ready = canAscend(state);
  const need = formatLetterSuffix(ascendThreshold(state));

  return (
    <p
      className={`sc-prestige-line sc-age-line${ready ? " is-ready" : ""} ${className}`.trim()}
      data-prestige-line="true"
      data-prestige-tier={tier}
      data-dawn={dawn}
      data-prestige={dawn}
      data-ready={ready ? "true" : "false"}
    >
      <PrestigePip dawn={dawn} ready={ready} size={18} />
      Age · <strong>Dawn {dawn}</strong> · next age at {need} total resources
      {ready ? " · ready, ascend from the Crown tab." : "."}
    </p>
  );
}

export const PrestigeCrestPip = PrestigePip;
export const AgeSealPip = PrestigePip;
export const LivingPrestigePip = PrestigePip;
export const PrestigeGlyphPip = PrestigePip;
export const PrestigeLine = PrestigeStatusLine;
