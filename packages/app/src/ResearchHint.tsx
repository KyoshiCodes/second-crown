import React from "react";
import {
  RESEARCH,
  countBuilding,
  researchDone,
  researchKeepMin,
  researchKeepReady,
  researchPrereqReady,
  researchRequires,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";
import "./research-hint.css";

type ResearchId = keyof typeof RESEARCH;

function halls(id: ResearchId): readonly string[] {
  const def = RESEARCH[id] as { needs?: string; needsAny?: readonly string[] };
  if (def.needsAny && def.needsAny.length) return def.needsAny;
  return def.needs ? [def.needs] : [];
}

function hallReady(state: GameState, id: ResearchId): boolean {
  return halls(id).some((b) => countBuilding(state, b) > 0);
}

/** Cost exactly as the sim table lists it, e.g. "20 food, 12 wood". */
export function researchCostText(id: ResearchId): string {
  return Object.entries(RESEARCH[id].cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

/**
 * Next study to point at: the first one in table order that is not known and not underway,
 * preferring one whose hall, Keep gate, and tier I prerequisite are already met. Read-only; no new rules.
 */
export function nextResearch(state: GameState): { id: ResearchId; ready: boolean } | null {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const open = ids.filter((id) => !researchDone(state, id) && researchTicksLeft(state, id) <= 0);
  const ready = open.find(
    (id) => hallReady(state, id) && researchKeepReady(state, id) && researchPrereqReady(state, id),
  );
  if (ready) return { id: ready, ready: true };
  return open.length ? { id: open[0], ready: false } : null;
}

export interface ResearchGlyphPipProps {
  id?: string;
  ready?: boolean;
  isDone?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living research codex glyph:
 * - ready: illuminated lectern codex with golden breathing aura and twinkling knowledge star
 * - locked: antique vellum codex with steady parchment ink styling
 * - done: master scholar laurel wreath and golden triumph star
 */
export function ResearchGlyphPip({
  id,
  ready = false,
  isDone = false,
  size = 16,
  className = "",
  style,
}: ResearchGlyphPipProps) {
  const statusClass = isDone ? "is-done" : ready ? "is-ready" : "is-locked";
  return (
    <span
      className={`sc-research-glyph-wrap ${statusClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-research-glyph={id ?? (isDone ? "done" : "hint")}
      data-ready={ready ? "true" : "false"}
    >
      {ready && <span className="sc-research-glyph-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-research-glyph ${statusClass}`}
        style={{ pointerEvents: "none" }}
      >
        {isDone ? (
          <>
            {/* Master Scholar Laurel Wreath */}
            <path
              d="M3 8 C3 11 5 13 8 13 C11 13 13 11 13 8"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            {/* Bound Grand Codex */}
            <rect
              x="5.5"
              y="4.5"
              width="5"
              height="7"
              rx="0.8"
              fill="#d97706"
              stroke="#fef08a"
              strokeWidth="0.6"
            />
            <line x1="6.8" y1="6.5" x2="9.2" y2="6.5" stroke="#fef08a" strokeWidth="0.6" />
            <line x1="6.8" y1="8" x2="9.2" y2="8" stroke="#fef08a" strokeWidth="0.6" />
            {/* Master Scholar Triumph Star */}
            <polygon
              points="8,1.4 8.8,3.2 10.6,3.4 9.2,4.6 9.6,6.4 8,5.4 6.4,6.4 6.8,4.6 5.4,3.4 7.2,3.2"
              fill="#fef08a"
              className="sc-research-glyph-star"
            />
          </>
        ) : ready ? (
          <>
            {/* Lectern wooden stand */}
            <path
              d="M7 12.5 L8 11.5 L9 12.5 L8.5 14.5 L7.5 14.5 Z"
              fill="#78350f"
              stroke="#451a03"
              strokeWidth="0.5"
            />
            {/* Illuminated open vellum pages */}
            <path
              d="M2.5 5.5 C4.5 4.3 6.5 4.8 8 5.6 C9.5 4.8 11.5 4.3 13.5 5.5 V11 C11.5 9.8 9.5 10.3 8 11.1 C6.5 10.3 4.5 9.8 2.5 11 Z"
              fill="#fffbeb"
              stroke="#b45309"
              strokeWidth="0.6"
            />
            {/* Book spine line */}
            <line x1="8" y1="5.6" x2="8" y2="11.1" stroke="#92400e" strokeWidth="0.6" />
            {/* Bookmark ribbon */}
            <path d="M8 11.1 L8.8 13.2 L8 12.4 L7.2 13.2 Z" fill="#dc2626" />
            {/* Rubric lines */}
            <line x1="4" y1="7" x2="6.5" y2="7" stroke="#b45309" strokeWidth="0.5" opacity="0.8" />
            <line x1="4" y1="8.5" x2="6.5" y2="8.5" stroke="#b45309" strokeWidth="0.5" opacity="0.8" />
            <line x1="9.5" y1="7" x2="12" y2="7" stroke="#b45309" strokeWidth="0.5" opacity="0.8" />
            <line x1="9.5" y1="8.5" x2="12" y2="8.5" stroke="#b45309" strokeWidth="0.5" opacity="0.8" />
            {/* Radiant knowledge star at apex */}
            <polygon
              points="8,1 8.8,3.2 11,4 8.8,4.8 8,7 7.2,4.8 5,4 7.2,3.2"
              fill="#fef08a"
              stroke="#d97706"
              strokeWidth="0.35"
              className="sc-research-glyph-star"
            />
            <circle cx="8" cy="4" r="0.9" fill="#ffffff" />
          </>
        ) : (
          <>
            {/* Lectern wooden stand */}
            <path
              d="M7 12.5 L8 11.5 L9 12.5 L8.5 14.5 L7.5 14.5 Z"
              fill="#475569"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
            {/* Locked / waiting vellum pages */}
            <path
              d="M2.5 5.5 C4.5 4.3 6.5 4.8 8 5.6 C9.5 4.8 11.5 4.3 13.5 5.5 V11 C11.5 9.8 9.5 10.3 8 11.1 C6.5 10.3 4.5 9.8 2.5 11 Z"
              fill="#f1f5f9"
              stroke="#64748b"
              strokeWidth="0.6"
            />
            {/* Book spine line */}
            <line x1="8" y1="5.6" x2="8" y2="11.1" stroke="#475569" strokeWidth="0.6" />
            {/* Bookmark ribbon */}
            <path d="M8 11.1 L8.8 12.8 L8 12.2 L7.2 12.8 Z" fill="#64748b" />
            {/* Script lines */}
            <line x1="4" y1="7" x2="6.5" y2="7" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="4" y1="8.5" x2="6.5" y2="8.5" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="9.5" y1="7" x2="12" y2="7" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="9.5" y1="8.5" x2="12" y2="8.5" stroke="#94a3b8" strokeWidth="0.5" />
            {/* Subtle beacon dot */}
            <circle cx="8" cy="3.5" r="1.1" fill="#94a3b8" />
          </>
        )}
      </svg>
    </span>
  );
}

export function ResearchHint(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const next = nextResearch(state);
  if (!next) {
    return (
      <p className="sc-research-hint is-done">
        <ResearchGlyphPip isDone={true} />
        <span>Next study · every study known.</span>
      </p>
    );
  }
  const name = RESEARCH[next.id].name;
  const cost = researchCostText(next.id);
  let need = "";
  if (!next.ready) {
    const parts: string[] = [];
    if (!hallReady(state, next.id)) parts.push(halls(next.id).join(" or "));
    if (!researchKeepReady(state, next.id)) parts.push(`Keep ${researchKeepMin(next.id)}`);
    const prereq = researchRequires(next.id);
    if (prereq && !researchPrereqReady(state, next.id)) parts.push(RESEARCH[prereq].name);
    need = parts.length ? ` · needs ${parts.join(", ")}` : "";
  }
  return (
    <p className={`sc-research-hint${next.ready ? " is-ready" : ""}`} data-research={next.id}>
      <ResearchGlyphPip ready={next.ready} id={next.id} />
      <span>
        Next study · <strong>{name}</strong> · {cost}
        {need}. Start it from the lectern.
      </span>
    </p>
  );
}
