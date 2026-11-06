import React from "react";
import { armyMouths, listHealing, listTraining, upkeepPerTick, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./upkeep-pace.css";

/** The next queued event that adds mouths to the army. Read-only. */
export interface UpkeepChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** Mouths it adds. */
  mouths: number;
  /** Unit type that arrives. */
  typeId: string;
  /** Where it comes from. */
  source: "training" | "healing";
}

/**
 * Earliest of the player's next training job and next healed wounded.
 * Uses only the sim's own queues (`listTraining`, `listHealing`). Training wins a tie.
 */
export function nextUpkeepChange(state: GameState): UpkeepChange | null {
  const now = state.meta.tick;
  const jobs = listTraining(state, "player").filter((j) => j.typeId !== "champion");
  const train = jobs.length ? jobs.reduce((a, b) => (b.doneTick < a.doneTick ? b : a)) : null;
  const heals = listHealing(state);
  const healTick = heals.length ? Math.min(...heals.map((h) => h.doneTick)) : null;
  if (train && (healTick === null || train.doneTick <= healTick)) {
    return { ticks: Math.max(0, train.doneTick - now), mouths: train.count, typeId: train.typeId, source: "training" };
  }
  if (healTick !== null) {
    return { ticks: Math.max(0, healTick - now), mouths: 1, typeId: "militia", source: "healing" };
  }
  return null;
}

/** Sim ticks to whole seconds, same rounding as the barracks queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export interface UpkeepPaceGlyphPipProps {
  rising?: boolean;
  source?: "training" | "healing";
  mouths?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living upkeep pace glyph:
 * - rising: golden sustenance harvest sheaf with tied ribbon (martial amber for barracks training, emerald/white knot for infirmary healing), radiant apex harvest star, lateral grain pips, and breathing amber-gold aura
 * - steady: calm granary sickle and slate grain ear with bronze tie and center grain pivot
 */
export function UpkeepPaceGlyphPip({
  rising = false,
  source,
  mouths,
  size = 16,
  className = "",
  style,
}: UpkeepPaceGlyphPipProps) {
  const paceClass = rising ? "is-rising" : "is-steady";
  const sourceClass = source ? ` is-source-${source}` : "";

  return (
    <span
      className={`sc-upkeep-pace-glyph-wrap ${paceClass}${sourceClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-upkeep={rising ? "rising" : "steady"}
      data-source={source}
      data-mouths={mouths}
    >
      {rising && <span className="sc-upkeep-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-upkeep-pace-glyph ${paceClass}`}
        style={{ pointerEvents: "none" }}
      >
        {rising ? (
          <>
            {/* Rising Upkeep: Golden Sustenance Harvest Sheaf */}
            {/* Left & right curved sheaf stalks */}
            <path
              d="M4.5 14.2 C5.2 11.2 5 7.6 3.8 4.6"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M11.5 14.2 C10.8 11.2 11 7.6 12.2 4.6"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Center upright grain stalk */}
            <line x1="8" y1="14.5" x2="8" y2="3.8" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round" />

            {/* Gilded grain heads / ears */}
            <ellipse cx="8" cy="3.8" rx="1.1" ry="1.7" fill="#fef08a" stroke="#d97706" strokeWidth="0.5" />
            <ellipse
              cx="5.4"
              cy="5.2"
              rx="1"
              ry="1.5"
              transform="rotate(-24 5.4 5.2)"
              fill="#fef08a"
              stroke="#d97706"
              strokeWidth="0.5"
            />
            <ellipse
              cx="10.6"
              cy="5.2"
              rx="1"
              ry="1.5"
              transform="rotate(24 10.6 5.2)"
              fill="#fef08a"
              stroke="#d97706"
              strokeWidth="0.5"
            />
            <ellipse
              cx="6.2"
              cy="7.6"
              rx="0.95"
              ry="1.4"
              transform="rotate(-18 6.2 7.6)"
              fill="#fde047"
              stroke="#d97706"
              strokeWidth="0.5"
            />
            <ellipse
              cx="9.8"
              cy="7.6"
              rx="0.95"
              ry="1.4"
              transform="rotate(18 9.8 7.6)"
              fill="#fde047"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Sheaf waist ribbon / tie */}
            <rect
              x="5.8"
              y="9.8"
              width="4.4"
              height="1.8"
              rx="0.6"
              fill={source === "healing" ? "#34d399" : "#f59e0b"}
              stroke={source === "healing" ? "#065f46" : "#b45309"}
              strokeWidth="0.5"
            />
            {/* Ribbon tie tails */}
            <path
              d="M6.8 11.6 L5.2 14"
              stroke={source === "healing" ? "#34d399" : "#f59e0b"}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M9.2 11.6 L10.8 14"
              stroke={source === "healing" ? "#34d399" : "#f59e0b"}
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Center ribbon knot pip */}
            <circle
              cx="8"
              cy="10.7"
              r="0.9"
              fill={source === "healing" ? "#ecfdf5" : "#fef3c7"}
              stroke={source === "healing" ? "#065f46" : "#92400e"}
              strokeWidth="0.5"
            />

            {/* Radiant apex harvest diamond star */}
            <polygon
              points="8,1 8.7,2.3 10,2.6 8.9,3.6 9.2,4.8 8,4 6.8,4.8 7.1,3.6 6,2.6 7.3,2.3"
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="0.4"
              className="sc-upkeep-pace-star"
            />
          </>
        ) : (
          <>
            {/* Steady Upkeep: Granary Sickle & Slate Grain Ear */}
            {/* Slate granary sickle arc */}
            <path
              d="M4.5 13.5 C3.2 11 3.5 7.5 6 5.5 C7.8 4 10.2 4.2 11.8 5.6"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Sickle handle in bronze */}
            <line x1="4.5" y1="13.5" x2="3.2" y2="15" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />

            {/* Central steady grain ear */}
            <line x1="9" y1="14" x2="9" y2="5" stroke="#64748b" strokeWidth="0.9" strokeLinecap="round" />
            <ellipse cx="9" cy="5" rx="0.9" ry="1.3" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
            <ellipse
              cx="7.6"
              cy="7.2"
              rx="0.8"
              ry="1.2"
              transform="rotate(-20 7.6 7.2)"
              fill="#94a3b8"
              stroke="#475569"
              strokeWidth="0.5"
            />
            <ellipse
              cx="10.4"
              cy="7.2"
              rx="0.8"
              ry="1.2"
              transform="rotate(20 10.4 7.2)"
              fill="#94a3b8"
              stroke="#475569"
              strokeWidth="0.5"
            />
            <ellipse
              cx="7.8"
              cy="9.5"
              rx="0.75"
              ry="1.1"
              transform="rotate(-15 7.8 9.5)"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="0.5"
            />
            <ellipse
              cx="10.2"
              cy="9.5"
              rx="0.75"
              ry="1.1"
              transform="rotate(15 10.2 9.5)"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="0.5"
            />

            {/* Granary pivot boss */}
            <circle cx="8" cy="12" r="1.1" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
          </>
        )}
      </svg>
    </span>
  );
}

export function UpkeepPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const mouths = armyMouths(state);
  const perTick = upkeepPerTick(state);
  const perSec = perTick * TICKS_PER_SECOND;
  const next = nextUpkeepChange(state);
  return (
    <p className={`sc-upkeep-pace${next ? " is-rising" : ""}`} data-upkeep={next ? "rising" : "steady"}>
      <UpkeepPaceGlyphPip
        rising={Boolean(next)}
        source={next?.source}
        mouths={next?.mouths}
      />
      Upkeep · <strong>{perTick.toFixed(2)} food/tick</strong> ({perSec.toFixed(1)}/s, {mouths} mouths)
      {next ? (
        <>
          {" "}· next change in <strong>{secs(next.ticks)}s</strong>: +{next.mouths} {next.typeId}
          {next.source === "healing" ? " from the infirmary" : " from the barracks"}
        </>
      ) : (
        " · no change queued"
      )}
      .
    </p>
  );
}
