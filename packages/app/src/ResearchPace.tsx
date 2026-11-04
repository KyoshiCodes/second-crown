import React from "react";
import {
  RESEARCH,
  UNIT_TYPES,
  researchDone,
  researchDuration,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";
import "./research-pace.css";

type ResearchId = keyof typeof RESEARCH;

/** Sim ticks to whole seconds, same rounding as StudyLine (10 ticks per second). */
function secs(ticks: number): number {
  return Math.ceil(ticks / 10);
}

/** The study underway on the lectern, if any. */
export function activeStudy(state: GameState): { id: ResearchId; left: number } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const id = ids.find((k) => researchTicksLeft(state, k) > 0);
  return id ? { id, left: researchTicksLeft(state, id) } : null;
}

/** First study in table order that unlocks units and is not known yet. Read-only. */
export function nextUnlock(state: GameState): { id: ResearchId; units: string[] } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const id = ids.find((k) => RESEARCH[k].unlocks.length > 0 && !researchDone(state, k));
  if (!id) return null;
  const units = (RESEARCH[id].unlocks as readonly string[]).map((u) => UNIT_TYPES[u]?.name ?? u);
  return { id, units };
}

/** True when the sim's researchDuration runs shorter than the table ticks (Academy pace). */
export function fastPace(state: GameState): boolean {
  const id = Object.keys(RESEARCH)[0] as ResearchId;
  return researchDuration(state, id) < RESEARCH[id].ticks;
}

export interface ResearchPaceGlyphPipProps {
  fast?: boolean;
  active?: boolean;
  unlockId?: string;
  allUnlocked?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living research pace glyph:
 * - fast: radiant celestial armillary sphere with speed cardinal ticks, golden breathing aura, and twinkling study core
 * - base: calm brass / pewter study astrolabe with quiet meridian ring and central scholar pivot
 * - active: energized study beacon star in center
 * - allUnlocked: laurel triumph wreath with celestial diamond compass
 */
export function ResearchPaceGlyphPip({
  fast = false,
  active = false,
  unlockId,
  allUnlocked = false,
  size = 16,
  className = "",
  style,
}: ResearchPaceGlyphPipProps) {
  const paceClass = fast ? "is-fast" : "is-base";
  const activeClass = active ? " is-active" : " is-idle";
  const unlockedClass = allUnlocked ? " is-all-unlocked" : "";

  return (
    <span
      className={`sc-research-pace-glyph-wrap ${paceClass}${activeClass}${unlockedClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-pace={fast ? "academy" : "base"}
      data-active={active ? "true" : "false"}
      data-all-unlocked={allUnlocked ? "true" : "false"}
      data-unlock-id={unlockId}
    >
      {fast && <span className="sc-research-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-research-pace-glyph ${paceClass}`}
        style={{ pointerEvents: "none" }}
      >
        {allUnlocked ? (
          <>
            {/* Master Astrolabe Laurel & Triumph Star */}
            <circle
              cx="8"
              cy="8"
              r="6.2"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.9"
              strokeDasharray="2.5 1.2"
            />
            <path
              d="M3.2 8.5 C3.2 11.5 5.5 13.5 8 13.5 C10.5 13.5 12.8 11.5 12.8 8.5"
              fill="none"
              stroke="#fef08a"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* 8-point triumphant stellar compass */}
            <polygon
              points="8,2.8 9.1,6.5 12.8,7.2 9.8,9.2 10.8,12.8 8,10.8 5.2,12.8 6.2,9.2 3.2,7.2 6.9,6.5"
              fill="#fef08a"
              stroke="#b45309"
              strokeWidth="0.4"
              className="sc-research-pace-star"
            />
            <circle cx="8" cy="8" r="1.2" fill="#38bdf8" />
          </>
        ) : fast ? (
          <>
            {/* Academy Pace: Celestial Armillary / Astrolabe with Speed Accents */}
            {/* Outer golden astrolabe rim */}
            <circle
              cx="8"
              cy="8"
              r="6.2"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="0.85"
            />
            {/* Inclined celestial knowledge ring */}
            <ellipse
              cx="8"
              cy="8"
              rx="5.8"
              ry="2.6"
              transform="rotate(-25 8 8)"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeDasharray="1.5 1"
            />
            {/* Inner meridian arc */}
            <ellipse
              cx="8"
              cy="8"
              rx="2.6"
              ry="5.8"
              transform="rotate(-15 8 8)"
              fill="none"
              stroke="#fef08a"
              strokeWidth="0.6"
            />
            {/* 4 Speed Cardinal Ticks */}
            <line x1="8" y1="1" x2="8" y2="2.5" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="15" y1="8" x2="13.5" y2="8" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="8" y1="15" x2="8" y2="13.5" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="1" y1="8" x2="2.5" y2="8" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />

            {/* Study Hub / Core */}
            <circle
              cx="8"
              cy="8"
              r="2.4"
              fill="#78350f"
              stroke="#fbbf24"
              strokeWidth="0.7"
            />
            {active ? (
              <>
                {/* Active Study Beacon Star */}
                <polygon
                  points="8,4.2 9,7 11.8,8 9,9 8,11.8 7,9 4.2,8 7,7"
                  fill="#fef08a"
                  className="sc-research-pace-star"
                />
                <circle cx="8" cy="8" r="1.1" fill="#38bdf8" />
              </>
            ) : (
              <>
                {/* Idle Lectern Pivot */}
                <circle cx="8" cy="8" r="1.3" fill="#f59e0b" />
                <circle cx="8" cy="8" r="0.6" fill="#fef08a" />
              </>
            )}
          </>
        ) : (
          <>
            {/* Base Pace: Dignified Brass / Pewter Study Astrolabe */}
            {/* Outer pewter ring */}
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.85"
            />
            {/* Inner brass meridian ellipse */}
            <ellipse
              cx="8"
              cy="8"
              rx="5.2"
              ry="2.2"
              transform="rotate(-20 8 8)"
              fill="none"
              stroke="#d97706"
              strokeWidth="0.75"
            />
            {/* 4 Subtle coordinate pips */}
            <circle cx="8" cy="2" r="0.6" fill="#94a3b8" />
            <circle cx="14" cy="8" r="0.6" fill="#94a3b8" />
            <circle cx="8" cy="14" r="0.6" fill="#94a3b8" />
            <circle cx="2" cy="8" r="0.6" fill="#94a3b8" />

            {/* Core Study Hub */}
            <circle
              cx="8"
              cy="8"
              r="2.2"
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth="0.7"
            />
            {active ? (
              <>
                <polygon
                  points="8,5.2 8.8,7.2 10.8,8 8.8,8.8 8,10.8 7.2,8.8 5.2,8 7.2,7.2"
                  fill="#fbbf24"
                  className="sc-research-pace-star"
                />
                <circle cx="8" cy="8" r="0.9" fill="#fef08a" />
              </>
            ) : (
              <>
                <circle cx="8" cy="8" r="1.1" fill="#475569" />
                <circle cx="8" cy="8" r="0.5" fill="#94a3b8" />
              </>
            )}
          </>
        )}
      </svg>
    </span>
  );
}

export function ResearchPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const fast = fastPace(state);
  const active = activeStudy(state);
  const unlock = nextUnlock(state);
  return (
    <p className={`sc-research-pace${fast ? " is-fast" : ""}`} data-pace={fast ? "academy" : "base"}>
      <ResearchPaceGlyphPip
        fast={fast}
        active={Boolean(active)}
        unlockId={unlock?.id}
        allUnlocked={!unlock}
      />
      Research pace · <strong>{fast ? "Academy pace" : "base pace"}</strong>
      {active ? ` · ${RESEARCH[active.id].name} ${secs(active.left)}s left` : " · lectern idle"}
      {unlock ? (
        <>
          {" "}· next unlock <strong>{RESEARCH[unlock.id].name}</strong> → {unlock.units.join(", ")}
          {active?.id === unlock.id ? "" : ` (${secs(researchDuration(state, unlock.id))}s)`}
        </>
      ) : (
        " · every unit unlocked"
      )}
      .
    </p>
  );
}
