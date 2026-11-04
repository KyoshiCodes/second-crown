import React from "react";
import { ascendThreshold, canAscend, formatLetterSuffix, type GameState } from "@second-crown/sim";
import { sharedRealmId } from "./game/settleOnLoad";
import "./age-line.css";

export interface AgeGlyphPipProps {
  dawn?: number;
  ready?: boolean;
  shared?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living age glyph:
 * - ready: radiant ascending sunburst with breathing gold aura, dynamic solar rays, and twinkling apex dawn star
 * - waiting: serene morning dawn on the horizon with warm amber rising sun disc and morning star
 * - shared: enduring celestial sapphire disc and stone monolith for eternal realm epochs
 */
export function AgeGlyphPip({
  dawn = 0,
  ready = false,
  shared = false,
  size = 16,
  className = "",
  style,
}: AgeGlyphPipProps) {
  const statusClass = shared ? "is-shared" : ready ? "is-ready" : "is-waiting";
  return (
    <span
      className={`sc-age-glyph-wrap ${statusClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-age-glyph={shared ? "shared" : `dawn-${dawn}`}
      data-ready={ready ? "true" : "false"}
      data-dawn={dawn}
    >
      {ready && <span className="sc-age-glyph-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-age-glyph ${statusClass}`}
        style={{ pointerEvents: "none" }}
      >
        {shared ? (
          <>
            {/* Shared Realm: Enduring Foundation Base */}
            <path
              d="M 2.5 12.5 L 13.5 12.5"
              stroke="#64748b"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            {/* Carved Stone Monolith */}
            <path
              d="M 5.5 12.5 L 6.5 8 L 9.5 8 L 10.5 12.5 Z"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.8"
            />
            {/* Celestial Sapphire Disc */}
            <circle cx="8" cy="6" r="2.4" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8" />
            {/* Silver Epoch Star Pip */}
            <circle cx="8" cy="6" r="0.8" fill="#ffffff" />
          </>
        ) : ready ? (
          <>
            {/* Ready for Second Dawn: Halo underlay */}
            <circle cx="8" cy="8" r="6.5" fill="#fef08a" fillOpacity="0.12" />
            {/* Dynamic Solar Beams */}
            <path
              d="M 8 2.2 L 8 4.2 M 3.5 4.5 L 5.2 6.2 M 12.5 4.5 L 10.8 6.2 M 2 8.5 L 4 8.5 M 14 8.5 L 12 8.5"
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="sc-age-glyph-rays"
            />
            {/* Rising Solar Orb Disc */}
            <path
              d="M 4.2 11.5 C 4.2 8.2 11.8 8.2 11.8 11.5 Z"
              fill="#fef08a"
              stroke="#d97706"
              strokeWidth="0.8"
            />
            {/* Inner Sun Disc Heart */}
            <path
              d="M 5.5 11.5 C 5.5 9.5 10.5 9.5 10.5 11.5 Z"
              fill="#f59e0b"
            />
            {/* Horizon Mountain Ridge Line */}
            <path
              d="M 1.5 12.5 C 4 11.2 7 11.8 8 11.8 C 9 11.8 12 11.2 14.5 12.5"
              fill="none"
              stroke="#b45309"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            {/* Apex Dawn Starburst (4-point solar diamond) */}
            <path
              d="M 8 1.5 L 8.7 3.2 L 10.4 3.9 L 8.7 4.6 L 8 6.3 L 7.3 4.6 L 5.6 3.9 L 7.3 3.2 Z"
              fill="#ffffff"
              stroke="#fef08a"
              strokeWidth="0.5"
              className="sc-age-glyph-star"
            />
          </>
        ) : (
          <>
            {/* Waiting for Next Age: Calm Morning Horizon */}
            <path
              d="M 2 12.5 C 5 11.5 11 11.5 14 12.5"
              fill="none"
              stroke="#475569"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Gentle Rising Sun Arc */}
            <path
              d="M 5 11.8 C 5 9.2 11 9.2 11 11.8 Z"
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="0.8"
            />
            {/* Serene Dawn Sunburst Rays */}
            <path
              d="M 8 4.8 L 8 6.6 M 4.8 6.8 L 6.2 8.2 M 11.2 6.8 L 9.8 8.2"
              stroke="#f59e0b"
              strokeWidth="1.1"
              strokeLinecap="round"
              className="sc-age-glyph-rays"
            />
            {/* Center Morning Core Pip */}
            <circle cx="8" cy="11.5" r="1.3" fill="#fef08a" />
          </>
        )}
      </svg>
    </span>
  );
}

/**
 * Small read-only Kingdom-tab line: the current age (Dawn count, flags.prestige_level, same as the
 * Crown tab's Second Dawn card) and what the next age needs (sim ascendThreshold / canAscend).
 * Includes living age glyph reflecting the realm's epoch and ascension readiness.
 * No new rules; ascending still happens only from the Crown tab.
 */
export function AgeLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const dawn = Number(state.flags["prestige_level"] ?? 0);
  const shared = sharedRealmId(state) !== null;
  if (shared) {
    return (
      <p className="sc-age-line is-shared" data-dawn={dawn}>
        <AgeGlyphPip dawn={dawn} shared ready={false} />
        Age · <strong>Dawn {dawn}</strong> · a shared hold has no Second Dawn.
      </p>
    );
  }
  const ready = canAscend(state);
  const need = formatLetterSuffix(ascendThreshold(state));
  return (
    <p className={`sc-age-line${ready ? " is-ready" : ""}`} data-dawn={dawn} data-ready={ready ? "true" : "false"}>
      <AgeGlyphPip dawn={dawn} ready={ready} />
      Age · <strong>Dawn {dawn}</strong> · next age at {need} total resources
      {ready ? " · ready, ascend from the Crown tab." : "."}
    </p>
  );
}
