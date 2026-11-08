import React from "react";
import { garrisonAt, garrisonPower, incomingOnProvince, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import type { OutpostTile } from "./OutpostLivingCard";

export type OutpostMood = "guarded" | "bare" | "threatened";
export type OutpostGlyphTone = "safe" | "warn" | "danger";

export interface OutpostGlyphDescriptor {
  node: string;
  mood: OutpostMood;
  tone: OutpostGlyphTone;
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse";
  power: number;
  troops: number;
  threatSeconds?: number;
  threatRealm?: string;
}

const NODE_OUTPOST_LABELS: Record<string, string> = {
  woodcut: "Timber redoubt",
  quarry: "Stone redoubt",
  field: "Forage redoubt",
  ruins: "Ruins redoubt",
  none: "Frontier redoubt",
  camp: "Camp redoubt",
};

/**
 * Resolves decorative living camp/flag descriptor from direct values.
 * Read-only mapping; preserves game state.
 */
export function resolveOutpostGlyphDescriptorByValues(
  node: string,
  posted: boolean,
  power: number,
  troops: number,
  threat?: { realmName: string; etaSeconds: number }
): OutpostGlyphDescriptor {
  const baseLabel = NODE_OUTPOST_LABELS[node] ?? "Frontier flag";

  if (threat) {
    return {
      node,
      mood: "threatened",
      tone: "danger",
      label: baseLabel,
      flair: `${threat.realmName} inbound (${threat.etaSeconds}s) · muster watch`,
      color: "#f85149",
      motion: "pulse",
      power,
      troops,
      threatSeconds: threat.etaSeconds,
      threatRealm: threat.realmName,
    };
  }

  if (posted) {
    return {
      node,
      mood: "guarded",
      tone: "safe",
      label: "Garrison camp",
      flair: `Banner flying · ${power} power (${troops} ${troops === 1 ? "soldier" : "soldiers"})`,
      color: "#3fb950",
      motion: "drift",
      power,
      troops,
    };
  }

  return {
    node,
    mood: "bare",
    tone: "warn",
    label: "Frontier flag",
    flair: "Banner claimed · post unattended",
    color: "#d29922",
    motion: "drift",
    power: 0,
    troops: 0,
  };
}

/**
 * Resolves decorative living camp/flag descriptor for a province.
 */
export function resolveOutpostGlyphDescriptor(
  state: GameState,
  p: OutpostTile,
  nameOf: (realmId: string) => string = (id) => state.realms.find((r) => r.id === id)?.name ?? id
): OutpostGlyphDescriptor {
  const posted = garrisonAt(state, p.id);
  const power = posted ? garrisonPower(state, p.id) : 0;
  const troops = posted ? Object.values(posted.force).reduce((a, n) => a + (n > 0 ? n : 0), 0) : 0;
  const hit = incomingOnProvince(state, p.id);
  const eta = hit ? Math.max(0, Math.ceil((hit.arrivesTick - state.meta.tick) / TICKS_PER_SECOND)) : 0;

  const threat = hit ? { realmName: nameOf(hit.realmId), etaSeconds: eta } : undefined;

  return resolveOutpostGlyphDescriptorByValues(p.node, Boolean(posted), power, troops, threat);
}

function OutpostLivingSvgPaths(props: { mood: OutpostMood; color: string }) {
  const { mood, color } = props;

  return (
    <>
      {/* Camp Pavilion Tent */}
      <path
        d="M 1.5 12 L 6 5.5 L 10.5 12 Z"
        fill={color}
        fillOpacity="0.25"
        stroke={color}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Tent entrance flap */}
      <path
        d="M 6 8.5 L 6 12"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Guyline stake pegs */}
      <line x1="1.5" y1="12" x2="0.6" y2="12.8" stroke={color} strokeWidth="0.6" strokeLinecap="round" />
      <line x1="10.5" y1="12" x2="11.4" y2="12.8" stroke={color} strokeWidth="0.6" strokeLinecap="round" />
      {/* Wooden Flagstaff */}
      <line x1="6" y1="5.5" x2="6" y2="1.4" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      {/* Waving Swallowtail Pennant */}
      <path
        d="M 6 1.8 L 12.5 3.3 L 10.2 4.4 L 12.5 5.5 L 6 4.8 Z"
        fill={color}
        fillOpacity={mood === "threatened" ? "0.6" : "0.4"}
        stroke={color}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {/* Apex flagstaff finial pip */}
      <circle cx="6" cy="1.4" r="0.5" fill={color} />
      {/* Mood-specific flourishes */}
      {mood === "threatened" ? (
        <>
          <circle cx="2" cy="4" r="0.55" fill={color} />
          <circle cx="12.5" cy="8.5" r="0.55" fill={color} />
        </>
      ) : mood === "guarded" ? (
        <circle cx="6" cy="9.2" r="0.75" fill={color} />
      ) : null}
    </>
  );
}

/**
 * Left-aligned 14x14 living camp/flag glyph and flair label strip
 * rendered beneath the card rows inside .sc-outpost-card.
 */
export function OutpostLivingGlyph(props: {
  state: GameState;
  province: OutpostTile;
  nameOf?: (realmId: string) => string;
}) {
  const desc = resolveOutpostGlyphDescriptor(props.state, props.province, props.nameOf);

  return (
    <div
      className={`sc-outpost-living-glyph motion-${desc.motion} tone-${desc.tone} mood-${desc.mood}`}
      aria-hidden="true"
    >
      <svg
        className="sc-outpost-living-svg"
        viewBox="0 0 14 14"
        width="14"
        height="14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow Layer */}
        <g className="sc-outpost-glow-layer" stroke={desc.color}>
          <OutpostLivingSvgPaths mood={desc.mood} color={desc.color} />
        </g>
        {/* Pulse Layer */}
        <g className="sc-outpost-pulse-layer" stroke={desc.color}>
          <OutpostLivingSvgPaths mood={desc.mood} color={desc.color} />
        </g>
        {/* Drift Layer */}
        <g className="sc-outpost-drift-layer" stroke={desc.color}>
          <OutpostLivingSvgPaths mood={desc.mood} color={desc.color} />
        </g>
      </svg>
      <span className="sc-outpost-living-label">{desc.label}</span>
      <span className="sc-outpost-living-sep">·</span>
      <span className="sc-outpost-living-flair">{desc.flair}</span>
    </div>
  );
}

function OutpostUnderlaySvgPaths(props: { mood: OutpostMood }) {
  const { mood } = props;

  return (
    <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
      {/* Ground plinth */}
      <ellipse cx="17" cy="27" rx="13.5" ry="4" strokeWidth="1" strokeDasharray="3 2" />
      {/* Palisades flank stakes */}
      <path d="M 5 26 L 8 21 L 8 27" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 26 21 L 29 26 L 26 27" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pitched Command Pavilion Tent */}
      <path
        d="M 7 26 L 16 11 L 25 26 Z"
        fill="currentColor"
        fillOpacity="0.18"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Tent entrance opening flaps */}
      <path
        d="M 13 26 L 16 18 L 19 26"
        fill="currentColor"
        fillOpacity="0.25"
        strokeWidth="1.1"
      />
      {/* High Outpost Flagstaff */}
      <line x1="16" y1="26" x2="16" y2="3.5" strokeWidth="1.5" strokeLinecap="round" />
      {/* Flying Swallowtail Realm Banner */}
      <path
        d="M 16 4.5 L 30 7.8 L 25.5 11.2 L 30 14.5 L 16 13.5 Z"
        fill="currentColor"
        fillOpacity={mood === "threatened" ? "0.35" : "0.22"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Banner center crest emblem */}
      <circle cx="21" cy="9" r="1.5" strokeWidth="1" />
      {/* Flagstaff finial star */}
      <circle cx="16" cy="3.5" r="1.1" fill="currentColor" />
      {/* Threat alert sparks */}
      {mood === "threatened" ? (
        <>
          <circle cx="6" cy="10" r="1.2" fill="currentColor" />
          <circle cx="28" cy="19" r="1" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}

/**
 * 34x34 watermark underlay mounted in the bottom-right corner of .sc-outpost-card.
 * Features low opacity ceiling, radial vignette mask, and strict pointer-events: none.
 */
export function OutpostLivingUnderlay(props: {
  mood: OutpostMood;
}) {
  return (
    <div
      className={`sc-outpost-living-underlay is-${props.mood}`}
      aria-hidden="true"
    >
      <OutpostUnderlaySvgPaths mood={props.mood} />
    </div>
  );
}
