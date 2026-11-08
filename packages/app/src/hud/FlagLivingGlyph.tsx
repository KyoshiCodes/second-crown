import React from "react";
import {
  GATHER_NODES,
  garrisonAt,
  garrisonPower,
  incomingOnProvince,
  nodeStock,
  nodeStockMax,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import type { OutpostTile } from "./OutpostLivingCard";

export type FlagMood = "guarded" | "bare" | "threatened";
export type FlagGlyphTone = "safe" | "warn" | "danger" | "calm";

export interface FlagGlyphDescriptor {
  node: string;
  mood: FlagMood;
  tone: FlagGlyphTone;
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse";
  power: number;
  troops: number;
  stockLeft?: number;
  stockMax?: number;
  threatSeconds?: number;
  threatRealm?: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  wood: "wood",
  food: "food",
  stone: "stone",
};

const NODE_FLAG_LABELS: Record<string, { threatened: string; guarded: string; bare: string }> = {
  woodcut: {
    threatened: "Timber redoubt",
    guarded: "Timber garrison",
    bare: "Timber claim",
  },
  quarry: {
    threatened: "Stone redoubt",
    guarded: "Stone garrison",
    bare: "Stone claim",
  },
  field: {
    threatened: "Forage redoubt",
    guarded: "Forage garrison",
    bare: "Forage claim",
  },
  ruins: {
    threatened: "Ruins redoubt",
    guarded: "Ruins garrison",
    bare: "Ruins claim",
  },
  camp: {
    threatened: "Hostile redoubt",
    guarded: "Frontier redoubt",
    bare: "Frontier flag",
  },
  none: {
    threatened: "Frontier redoubt",
    guarded: "Garrison camp",
    bare: "Frontier flag",
  },
};

/**
 * Resolves decorative living flag/camp descriptor from direct values.
 * Read-only mapping; preserves game state and determinism.
 */
export function resolveFlagGlyphDescriptorByValues(
  node: string,
  posted: boolean,
  power: number,
  troops: number,
  stockLeft?: number,
  stockMax?: number,
  threat?: { realmName: string; etaSeconds: number }
): FlagGlyphDescriptor {
  const labels = NODE_FLAG_LABELS[node] ?? NODE_FLAG_LABELS.none;
  const gather = GATHER_NODES[node as keyof typeof GATHER_NODES];
  const res = gather ? (RESOURCE_LABELS[gather.resource] ?? gather.resource) : "";

  if (threat) {
    return {
      node,
      mood: "threatened",
      tone: "danger",
      label: labels.threatened,
      flair: `${threat.realmName} inbound (${threat.etaSeconds}s) · muster watch`,
      color: "#f85149",
      motion: "pulse",
      power,
      troops,
      stockLeft,
      stockMax,
      threatSeconds: threat.etaSeconds,
      threatRealm: threat.realmName,
    };
  }

  if (posted) {
    let flair = `Banner flying · ${power} power (${troops} ${troops === 1 ? "soldier" : "soldiers"})`;
    if (gather && stockLeft !== undefined && stockMax !== undefined) {
      if (stockLeft <= 0) {
        flair = `Banner flying · ${power} power · ${res} dry`;
      } else {
        flair = `Banner flying · ${power} power (${troops} ${troops === 1 ? "soldier" : "soldiers"}) · ${Math.floor(stockLeft)} ${res}`;
      }
    }
    return {
      node,
      mood: "guarded",
      tone: "safe",
      label: labels.guarded,
      flair,
      color: "#3fb950",
      motion: "drift",
      power,
      troops,
      stockLeft,
      stockMax,
    };
  }

  let flair = "Banner claimed · post unattended";
  if (gather && stockLeft !== undefined && stockMax !== undefined) {
    if (stockLeft <= 0) {
      flair = `Banner claimed · ${res} dry · unpatrolled`;
    } else {
      flair = `Banner claimed · ${Math.floor(stockLeft)} ${res} unharvested`;
    }
  }

  return {
    node,
    mood: "bare",
    tone: "warn",
    label: labels.bare,
    flair,
    color: "#d29922",
    motion: "drift",
    power: 0,
    troops: 0,
    stockLeft,
    stockMax,
  };
}

/**
 * Resolves decorative living flag/camp descriptor for an outpost tile.
 */
export function resolveFlagGlyphDescriptor(
  state: GameState,
  p: OutpostTile,
  nameOf: (realmId: string) => string = (id) => state.realms.find((r) => r.id === id)?.name ?? id
): FlagGlyphDescriptor {
  const posted = garrisonAt(state, p.id);
  const power = posted ? garrisonPower(state, p.id) : 0;
  const troops = posted ? Object.values(posted.force).reduce((a, n) => a + (n > 0 ? n : 0), 0) : 0;
  const hit = incomingOnProvince(state, p.id);
  const eta = hit ? Math.max(0, Math.ceil((hit.arrivesTick - state.meta.tick) / TICKS_PER_SECOND)) : 0;
  const threat = hit ? { realmName: nameOf(hit.realmId), etaSeconds: eta } : undefined;

  const gather = GATHER_NODES[p.node as keyof typeof GATHER_NODES];
  const stockLeft = gather ? nodeStock(state, p.id) : undefined;
  const max = gather ? nodeStockMax(p.node) : undefined;

  return resolveFlagGlyphDescriptorByValues(p.node, Boolean(posted), power, troops, stockLeft, max, threat);
}

/**
 * Compact 14x14 living SVG badge depicting raised flagstaff, swallowtail banner, and camp tent.
 */
function FlagBadgeSvg({ mood, node }: { mood: FlagMood; node: string }) {
  const isThreatened = mood === "threatened";
  const isGuarded = mood === "guarded";

  return (
    <svg
      className="sc-flag-glyph-svg sc-outpost-living-svg"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ambient glow beneath the flagstaff and pavilion */}
      <ellipse
        className="sc-flag-glow-layer sc-outpost-glow-layer"
        cx="7"
        cy="11.2"
        rx="5.2"
        ry="2.2"
        fill="currentColor"
        fillOpacity="0.22"
      />

      {/* Swaying camp pavilion and palisade stakes */}
      <g className="sc-flag-drift-layer sc-outpost-drift-layer">
        <path
          d="M3 11.5L7 5.8L11 11.5H3Z"
          stroke="currentColor"
          strokeWidth="1.0"
          fill="currentColor"
          fillOpacity="0.14"
          strokeLinejoin="round"
        />
        <path d="M7 5.8V11.5M5.2 11.5L7 8.5L8.8 11.5" stroke="currentColor" strokeWidth="0.85" strokeLinejoin="round" />
        <path d="M1.8 11.5V9.6M12.2 11.5V9.6" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" />
      </g>

      {/* Flagstaff & flying swallowtail pennant */}
      <g className={isThreatened ? "sc-flag-pulse-layer sc-outpost-pulse-layer" : "sc-flag-drift-layer sc-outpost-drift-layer"}>
        {/* Upright wooden flagstaff */}
        <path d="M7 5.8V1.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        {/* Flying swallowtail banner */}
        <path
          d="M7 1.4H11.5L10 2.8L11.5 4.2H7"
          stroke="currentColor"
          strokeWidth="0.9"
          fill="currentColor"
          fillOpacity={isThreatened ? "0.45" : isGuarded ? "0.32" : "0.22"}
          strokeLinejoin="round"
        />

        {/* Alert beacon flare or apex star */}
        {isThreatened ? (
          <circle cx="7" cy="1.2" r="1.1" fill="currentColor" />
        ) : isGuarded ? (
          <circle cx="7" cy="1.2" r="0.75" fill="currentColor" opacity="0.8" />
        ) : null}
      </g>
    </svg>
  );
}

/**
 * 34x34 corner watermark tucked into the bottom-right of the Flags card.
 */
export function FlagLivingUnderlay(props: { mood: FlagMood; node?: string }) {
  const { mood, node = "none" } = props;
  const isThreatened = mood === "threatened";

  return (
    <span
      className={`sc-outpost-living-underlay sc-flag-living-underlay is-${mood} is-${node}`}
      aria-hidden="true"
    >
      <svg
        className="sc-outpost-living-watermark sc-flag-living-watermark"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* Perimeter groundline */}
        <path d="M4 29H30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Command pavilion marquee tent */}
        <path
          d="M6 29L17 11.8L28 29H6Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Tent roof creases & entrance flap */}
        <path
          d="M17 11.8V29M12.8 29L17 21.2L21.2 29M9.5 29L17 16.5L24.5 29"
          stroke="currentColor"
          strokeWidth="0.95"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* High wooden flagstaff with halyard rigging */}
        <path d="M17 11.8V3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path
          d="M17 3.6H28.5L25 7.6L28.5 11.6H17"
          stroke="currentColor"
          strokeWidth="1.15"
          fill="currentColor"
          fillOpacity={isThreatened ? "0.36" : "0.20"}
          strokeLinejoin="round"
        />

        {/* Flank defensive palisade stakes */}
        <path
          d="M3.8 29V23.5L5.1 21.5L6.4 23.5V29M27.6 29V24.5L28.9 22.8L30.2 24.5V29"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
          opacity="0.75"
        />

        {/* Node-specific emblem carving */}
        {node === "woodcut" ? (
          <path d="M4.5 28.5L7.2 25M4.8 25L7.5 28.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        ) : node === "quarry" ? (
          <rect x="4.5" y="24" width="3.5" height="3" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.15" />
        ) : node === "field" ? (
          <path d="M5 28.5C5 25.5 6.5 24 6.5 24C6.5 24 8 25.5 8 28.5" stroke="currentColor" strokeWidth="0.9" />
        ) : null}

        {/* Threat alert beacon flare */}
        {isThreatened ? (
          <>
            <circle cx="17" cy="3.2" r="2.2" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.4" />
            <path d="M17 0.4V1.8M17 4.6V6.0M14.2 3.2H15.6M18.4 3.2H19.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

/**
 * Living flag/camp glyph strip rendered directly beneath the stacked rows of a flag card.
 */
export function FlagLivingGlyph(props: {
  state: GameState;
  province: OutpostTile;
  nameOf?: (realmId: string) => string;
}) {
  const { state, province, nameOf } = props;
  const desc = resolveFlagGlyphDescriptor(state, province, nameOf);

  return (
    <span
      className={`sc-outpost-living-glyph sc-flag-living-glyph is-${desc.mood} tone-${desc.tone} motion-${desc.motion}`}
      aria-hidden="true"
      data-flag-mood={desc.mood}
    >
      <span className="sc-outpost-glyph-icon sc-flag-glyph-icon">
        <FlagBadgeSvg mood={desc.mood} node={desc.node} />
      </span>
      <span className="sc-outpost-living-label sc-flag-living-label">{desc.label}</span>
      <span className="sc-outpost-living-dot sc-flag-living-dot" aria-hidden="true">
        ·
      </span>
      <span className="sc-outpost-living-flair sc-flag-living-flair">{desc.flair}</span>
    </span>
  );
}
