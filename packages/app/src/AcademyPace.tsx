import React from "react";
import {
  LECTERN_STUDY_MULT,
  RESEARCH,
  researchDone,
  researchDuration,
  researchKeepMin,
  researchKeepReady,
  type GameState,
} from "@second-crown/sim";
import "./academy-pace.css";

type ResearchId = keyof typeof RESEARCH;

/** Sim ticks to whole seconds, same rounding as StudyLine (10 ticks per second). */
function secs(ticks: number): number {
  return Math.ceil(ticks / 10);
}

/** True when the sim's researchDuration runs shorter than the table ticks (Academy rate active). */
export function academyRateOn(state: GameState): boolean {
  const id = Object.keys(RESEARCH)[0] as ResearchId;
  return researchDuration(state, id) < RESEARCH[id].ticks;
}

/** Academy rate label, same wording as the keep hall lectern bonus. */
export function academyRateText(): string {
  return `new studies ${Math.round((1 - LECTERN_STUDY_MULT) * 100)}% shorter`;
}

/** First study in table order that an Academy can open and is not known yet. Read-only. */
export function nextAcademyUnlock(state: GameState): { id: ResearchId; keepMin: number; keepReady: boolean } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const id = ids.find(
    (k) => (RESEARCH[k].needsAny as readonly string[]).includes("academy") && !researchDone(state, k),
  );
  if (!id) return null;
  return { id, keepMin: researchKeepMin(id), keepReady: researchKeepReady(state, id) };
}

export interface AcademyPaceGlyphPipProps {
  on?: boolean;
  nextId?: string;
  keepReady?: boolean;
  allKnown?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living academy pace glyph:
 * - on: illuminated amethyst academy colonnade & pediment, radiant apex beacon star, and breathing lavender aura
 * - off: quiet slate & pewter foundation with unlit scholastic framework awaiting academy construction
 * - allKnown: master academy laurel wreath with triumphant amethyst star
 */
export function AcademyPaceGlyphPip({
  on = false,
  nextId,
  keepReady = true,
  allKnown = false,
  size = 16,
  className = "",
  style,
}: AcademyPaceGlyphPipProps) {
  const onClass = on ? "is-on" : "is-off";
  const knownClass = allKnown ? " is-all-known" : "";

  return (
    <span
      className={`sc-academy-pace-glyph-wrap ${onClass}${knownClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-academy={on ? "on" : "off"}
      data-all-known={allKnown ? "true" : "false"}
      data-next-id={nextId}
      data-keep-ready={keepReady ? "true" : "false"}
    >
      {on && <span className="sc-academy-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-academy-pace-glyph ${onClass}`}
        style={{ pointerEvents: "none" }}
      >
        {allKnown ? (
          <>
            {/* Master Academy Laurel Wreath & Wisdom Crown */}
            <path
              d="M2.8 8.5 C2.8 11.8 5.2 13.5 8 13.5 C10.8 13.5 13.2 11.8 13.2 8.5"
              fill="none"
              stroke="#c4b5fd"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* Columns & Architrave */}
            <rect x="5.2" y="7" width="1.4" height="4.5" fill="#a78bfa" />
            <rect x="9.4" y="7" width="1.4" height="4.5" fill="#a78bfa" />
            <rect x="4.2" y="11.5" width="7.6" height="1" fill="#7c3aed" rx="0.3" />
            {/* Pediment roof */}
            <path d="M4.5 7 L8 4 L11.5 7 Z" fill="#8b5cf6" stroke="#c4b5fd" strokeWidth="0.6" />
            {/* Triumphant apex star */}
            <polygon
              points="8,1 8.8,2.2 10,2.5 8.9,3.4 9.2,4.6 8,3.9 6.8,4.6 7.1,3.4 6,2.5 7.2,2.2"
              fill="#ede9fe"
              className="sc-academy-pace-star"
            />
            <circle cx="8" cy="8.8" r="1" fill="#ede9fe" />
          </>
        ) : on ? (
          <>
            {/* Active Academy: Colonnade, Pediment & Illuminated Wisdom Beacon */}
            {/* Foundation steps */}
            <path d="M2.5 13.5 L13.5 13.5" stroke="#7c3aed" strokeWidth="1" strokeLinecap="round" />
            <path d="M3.5 12.2 L12.5 12.2" stroke="#a78bfa" strokeWidth="0.8" strokeLinecap="round" />

            {/* Classical twin wisdom columns */}
            <path d="M4.5 12.2 L4.5 6.5" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M11.5 12.2 L11.5 6.5" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" />

            {/* Inner sanctuary arch */}
            <path
              d="M6 12.2 L6 8.5 C6 7.4 10 7.4 10 8.5 L10 12.2"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="0.75"
            />

            {/* Architrave & triangular pediment */}
            <path d="M3.2 6.5 L12.8 6.5" stroke="#ddd6fe" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M3.8 6.5 L8 3.2 L12.2 6.5 Z" fill="#6d28d9" stroke="#c4b5fd" strokeWidth="0.7" />

            {/* Wisdom Beacon Spire & Diamond Star */}
            <line x1="8" y1="3.2" x2="8" y2="1.8" stroke="#ede9fe" strokeWidth="0.8" />
            <polygon
              points="8,0.8 8.7,2 9.9,2.4 8.8,3.2 9.1,4.4 8,3.7 6.9,4.4 7.2,3.2 6.1,2.4 7.3,2"
              fill="#ffffff"
              className="sc-academy-pace-star"
            />

            {/* Lateral speed / knowledge pips */}
            <circle cx="2.2" cy="4.5" r="0.6" fill="#c4b5fd" />
            <circle cx="13.8" cy="4.5" r="0.6" fill="#c4b5fd" />
          </>
        ) : (
          <>
            {/* Inactive Base Rate: Slate Foundation & Unbuilt Scaffolding */}
            {/* Foundation step */}
            <path d="M3 13.5 L13 13.5" stroke="#475569" strokeWidth="1" strokeLinecap="round" />

            {/* Pillar stubs */}
            <path d="M4.8 13.5 L4.8 8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M11.2 13.5 L11.2 8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />

            {/* Lintel */}
            <path d="M4 8 L12 8" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />

            {/* Roof framework */}
            <path d="M4.5 8 L8 5.2 L11.5 8" fill="none" stroke="#64748b" strokeWidth="0.8" />

            {/* Unlit core pivot & unraised spire tick */}
            <circle cx="8" cy="9.5" r="0.8" fill="#475569" />
            <line x1="8" y1="5.2" x2="8" y2="3.8" stroke="#475569" strokeWidth="0.7" strokeDasharray="1 1" />
          </>
        )}
      </svg>
    </span>
  );
}

export function AcademyPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const on = academyRateOn(state);
  const next = nextAcademyUnlock(state);
  return (
    <p className={`sc-academy-pace${on ? " is-on" : ""}`} data-academy={on ? "on" : "off"}>
      <AcademyPaceGlyphPip
        on={on}
        nextId={next?.id}
        keepReady={next?.keepReady}
        allKnown={!next}
      />
      Academy · <strong>{on ? academyRateText() : "no Academy, base rate"}</strong>
      {next ? (
        <>
          {" "}· next academy study <strong>{RESEARCH[next.id].name}</strong> ({secs(researchDuration(state, next.id))}s)
          {next.keepReady ? "" : ` · needs Keep ${"I".repeat(next.keepMin)}`}
        </>
      ) : (
        " · every academy study known"
      )}
      .
    </p>
  );
}
