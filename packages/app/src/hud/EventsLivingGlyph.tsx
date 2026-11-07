import React from "react";
import type { OmenVariant } from "./OmenPip";
import type { QuestStatus } from "./QuestCard";
import "./events-glyph-living.css";

export type OmenLivingState = "latest" | "pending" | "loss" | "settled";
export type ScrollSealMotif = "sanctum" | "scout" | "valor" | "caravan" | "royal";

export interface OmenLivingDescriptor {
  omen: OmenVariant;
  state: OmenLivingState;
  flair: string;
}

export interface ScrollLivingDescriptor {
  status: QuestStatus;
  motif: ScrollSealMotif;
  flair: string;
}

/**
 * Pure descriptor for an event card's living omen glyph.
 * Reads only the omen variant and existing EventCard props.
 */
export function resolveOmenLiving(input: {
  omen: OmenVariant;
  eventId: string;
  latest?: boolean;
  choiceCount?: number;
}): OmenLivingDescriptor {
  const { omen, eventId, latest, choiceCount = 0 } = input;
  const pending = choiceCount > 0;

  if (eventId === "spoil") {
    return {
      omen,
      state: pending ? "pending" : "loss",
      flair: pending ? "Raven omen · choice awaits" : "Raven portent · stores blighted",
    };
  }

  if (omen === "harvest") {
    if (pending) {
      return { omen, state: "pending", flair: "Harvest omen · choice awaits" };
    }
    if (eventId === "timber") {
      return {
        omen,
        state: latest ? "latest" : "settled",
        flair: latest ? "Timber omen · windfall" : "Timber omen · stacked",
      };
    }
    return {
      omen,
      state: latest ? "latest" : "settled",
      flair: latest ? "Harvest omen · golden sheaf" : "Harvest omen · gathered",
    };
  }

  if (omen === "raven") {
    if (pending) {
      return { omen, state: "pending", flair: "Raven omen · choice awaits" };
    }
    return {
      omen,
      state: latest ? "latest" : "settled",
      flair: latest ? "Raven omen · wings aloft" : "Raven omen · perched watch",
    };
  }

  if (pending) {
    return { omen: "comet", state: "pending", flair: "Comet omen · choice awaits" };
  }
  return {
    omen: "comet",
    state: latest ? "latest" : "settled",
    flair: latest ? "Comet omen · blazing sky" : "Comet omen · foretold",
  };
}

/** Maps a quest id to a subtle wax-seal charge motif on the living scroll. */
export function getQuestSealMotif(questId: string): ScrollSealMotif {
  if (/chapel|shrine|faith|academy/i.test(questId)) return "sanctum";
  if (/scout|watch|vision/i.test(questId)) return "scout";
  if (/victory|war|champion|field/i.test(questId)) return "valor";
  if (/route|caravan|trade|market/i.test(questId)) return "caravan";
  return "royal";
}

/**
 * Pure descriptor for a quest card's living scroll glyph.
 * Reads only the quest id and existing QuestCard status.
 */
export function resolveScrollLiving(input: {
  questId: string;
  status: QuestStatus;
}): ScrollLivingDescriptor {
  const motif = getQuestSealMotif(input.questId);
  if (input.status === "ready") {
    return { status: "ready", motif, flair: "Royal scroll · seal lit" };
  }
  if (input.status === "claimed") {
    return { status: "claimed", motif, flair: "Archived scroll · sealed" };
  }
  return { status: "open", motif, flair: "Mandate scroll · unsealed" };
}

function OmenEmblemSvg({ omen }: { omen: OmenVariant }) {
  if (omen === "comet") {
    return (
      <>
        {/* Astral wake aura */}
        <path
          className="sc-events-glow-layer"
          d="M4.5 18.5 C7.5 14.5 12.5 9.5 20.5 4.5 C16.5 9.5 12 14.5 7.5 19.5 Z"
          fill="currentColor"
          opacity="0.24"
        />
        {/* Streaking comet tail & drifting dust motes */}
        <g className="sc-events-drift-layer">
          <path
            d="M6.2 17.4 C9.5 13.8 14.2 9.2 20.8 4.6 C16.2 9.4 11.6 14.2 7.8 18.4 Z"
            fill="currentColor"
            fillOpacity="0.34"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="15.6" cy="8.2" r="0.85" fill="currentColor" opacity="0.78" />
          <circle cx="18.6" cy="5.8" r="0.7" fill="currentColor" opacity="0.65" />
          <circle cx="12.8" cy="11.6" r="0.75" fill="currentColor" opacity="0.7" />
        </g>
        {/* Pulsing star nucleus & cross-glint */}
        <g className="sc-events-pulse-layer">
          <circle cx="6.8" cy="17.2" r="2.4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M6.8 13.4 V21 M3 17.2 H10.6"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </g>
      </>
    );
  }

  if (omen === "raven") {
    return (
      <>
        {/* Twilight portent crescent halo */}
        <circle
          className="sc-events-glow-layer"
          cx="12.5"
          cy="11.5"
          r="7.5"
          fill="currentColor"
          opacity="0.18"
        />
        {/* Perched prophetic raven & wing plume */}
        <g className="sc-events-drift-layer">
          <path
            d="M3.5 19.5 C8.5 18.8 14.5 19.2 20.5 20.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M8.4 17.6 C7.4 14.8 8.2 11.6 10.4 9.6 C11.1 7.6 12.8 6.3 14.8 6 C16.3 5.8 17.6 6.6 18.2 7.8 L21.2 8.8 L17.8 10 C16.2 11.4 15.4 13.8 14.8 17.4 Z"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M8.4 17.2 L5.2 20.8 L9.6 18.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Pulsing seer eye & portent spark */}
        <g className="sc-events-pulse-layer">
          <circle cx="15.8" cy="7.9" r="1.15" fill="currentColor" />
          <path
            d="M13.6 4.2 L14.2 5.4 M16.4 3.8 L16 5.1"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>
      </>
    );
  }

  return (
    <>
      {/* Harvest sun-halo */}
      <circle
        className="sc-events-glow-layer"
        cx="12"
        cy="11.5"
        r="7.4"
        fill="currentColor"
        opacity="0.18"
      />
      {/* Swaying wheat sheaf & fanning grain ears */}
      <g className="sc-events-drift-layer">
        <path
          d="M12 19.5 V5 M12 14.8 C10.4 12.2 8.2 10.2 5.8 8.4 M12 14.8 C13.6 12.2 15.8 10.2 18.2 8.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <ellipse cx="10.4" cy="9.2" rx="1.2" ry="1.9" transform="rotate(-18 10.4 9.2)" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="13.6" cy="9.2" rx="1.2" ry="1.9" transform="rotate(18 13.6 9.2)" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="12" cy="5.4" rx="1.1" ry="1.8" fill="currentColor" fillOpacity="0.36" stroke="currentColor" strokeWidth="1" />
        <path d="M9.8 20.6 L11.4 16.2 M14.2 20.6 L12.6 16.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* Pulsing sheaf tie-knot & harvest motes */}
      <g className="sc-events-pulse-layer">
        <rect x="9.6" y="14.8" width="4.8" height="2" rx="0.7" fill="currentColor" />
        <circle cx="6.2" cy="6.6" r="0.85" fill="currentColor" />
        <circle cx="17.8" cy="6.6" r="0.85" fill="currentColor" />
      </g>
    </>
  );
}

function ScrollEmblemSvg({ status, motif }: { status: QuestStatus; motif: ScrollSealMotif }) {
  if (status === "claimed") {
    return (
      <>
        {/* Calm archival aura */}
        <ellipse
          className="sc-events-glow-layer"
          cx="12"
          cy="12"
          rx="8"
          ry="5.5"
          fill="currentColor"
          opacity="0.16"
        />
        {/* Rolled & bound chronicle scroll */}
        <g className="sc-events-drift-layer">
          <path
            d="M5.5 9.5 H18.5 C19.6 9.5 20.2 10.6 20.2 12 C20.2 13.4 19.6 14.5 18.5 14.5 H5.5 C4.4 14.5 3.8 13.4 3.8 12 C3.8 10.6 4.4 9.5 5.5 9.5 Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <ellipse cx="5.6" cy="12" rx="1.3" ry="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.1" />
          <path d="M12 9.2 V14.8" stroke="currentColor" strokeWidth="1.3" />
        </g>
        {/* Stamped archival wax seal */}
        <g className="sc-events-pulse-layer">
          <circle cx="12" cy="15.6" r="2.1" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.1" />
          <path d="M11.1 17.4 L10.4 19.8 M12.9 17.4 L13.6 19.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
        </g>
      </>
    );
  }

  return (
    <>
      {/* Illumination halo behind the parchment */}
      <circle
        className="sc-events-glow-layer"
        cx="12"
        cy="12"
        r="8"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Unfurled parchment mandate, rollers & script lines */}
      <g className="sc-events-drift-layer">
        <path
          d="M6.6 5.2 H17.4 V18.4 H6.6 Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <rect x="5" y="3.8" width="14" height="2.4" rx="1.1" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.15" />
        <rect x="5" y="17.6" width="14" height="2.4" rx="1.1" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.15" />
        <path
          d="M9 8.8 H15 M9 11.4 H13.8"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity="0.82"
        />
        {status === "open" ? (
          /* Feather quill poised over open mandate */
          <path
            d="M15.2 13.8 C16.8 11.6 18.8 9.8 20.6 8.8 C19.8 11 18.2 13 15.8 14.4 Z"
            fill="currentColor"
            fillOpacity="0.42"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
        ) : null}
      </g>
      {/* Pulsing signet wax seal & motif charge (plus crown star when ready) */}
      <g className="sc-events-pulse-layer">
        <circle
          cx="12"
          cy="16.2"
          r={status === "ready" ? "2.4" : "2"}
          fill="currentColor"
          fillOpacity={status === "ready" ? "0.52" : "0.34"}
          stroke="currentColor"
          strokeWidth="1.15"
        />
        {motif === "sanctum" ? (
          <path d="M12 14.9 V17.5 M10.9 16.2 H13.1" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
        ) : motif === "valor" ? (
          <path d="M11.1 17.1 L12.9 15.3 M11.1 15.3 L12.9 17.1" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
        ) : (
          <circle cx="12" cy="16.2" r="0.75" fill="currentColor" />
        )}
        {status === "ready" ? (
          <path
            d="M18.4 2.4 V6.4 M16.4 4.4 H20.4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        ) : null}
      </g>
    </>
  );
}

/**
 * Corner-confined 32x32 ambient omen watermark inside `.sc-event-card`.
 * Strictly pointer-events: none so event choice buttons are never blocked.
 */
export function EventOmenUnderlay(props: {
  omen: OmenVariant;
  eventId: string;
  latest?: boolean;
  choiceCount?: number;
}) {
  const { omen, state } = resolveOmenLiving(props);
  return (
    <span
      className={`sc-events-living-underlay kind-omen omen-${omen} state-${state}`}
      aria-hidden="true"
      data-omen-watermark={omen}
    >
      <svg viewBox="0 0 24 24" className="sc-events-underlay-svg" focusable="false">
        <OmenEmblemSvg omen={omen} />
      </svg>
    </span>
  );
}

/**
 * Living 14x14 omen emblem & flair strip rendered directly under `EventsLedger` on `EventCard`.
 */
export function EventOmenLivingGlyph(props: {
  omen: OmenVariant;
  eventId: string;
  latest?: boolean;
  choiceCount?: number;
}) {
  const { omen, state, flair } = resolveOmenLiving(props);
  return (
    <span
      className={`sc-events-status-glyph kind-omen omen-${omen} state-${state}`}
      aria-hidden="true"
      data-omen-glyph={omen}
      data-omen-state={state}
    >
      <svg viewBox="0 0 24 24" className="sc-events-glyph-icon" focusable="false">
        <OmenEmblemSvg omen={omen} />
      </svg>
      <span className="sc-events-glyph-flair">{flair}</span>
    </span>
  );
}

/**
 * Corner-confined 32x32 ambient scroll watermark inside `.sc-quest-card`.
 * Strictly pointer-events: none so the quest Claim button is never blocked.
 */
export function QuestScrollUnderlay(props: { questId: string; status: QuestStatus }) {
  const { status, motif } = resolveScrollLiving(props);
  return (
    <span
      className={`sc-events-living-underlay kind-scroll scroll-${status} state-${status}`}
      aria-hidden="true"
      data-scroll-watermark={status}
    >
      <svg viewBox="0 0 24 24" className="sc-events-underlay-svg" focusable="false">
        <ScrollEmblemSvg status={status} motif={motif} />
      </svg>
    </span>
  );
}

/**
 * Living 14x14 scroll emblem & flair strip rendered directly under `EventsLedger` on `QuestCard`.
 */
export function QuestScrollLivingGlyph(props: { questId: string; status: QuestStatus }) {
  const { status, motif, flair } = resolveScrollLiving(props);
  return (
    <span
      className={`sc-events-status-glyph kind-scroll scroll-${status} state-${status}`}
      aria-hidden="true"
      data-scroll-glyph={status}
      data-scroll-motif={motif}
    >
      <svg viewBox="0 0 24 24" className="sc-events-glyph-icon" focusable="false">
        <ScrollEmblemSvg status={status} motif={motif} />
      </svg>
      <span className="sc-events-glyph-flair">{flair}</span>
    </span>
  );
}
