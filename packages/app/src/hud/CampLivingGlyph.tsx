import React from "react";
import {
  GATHER_NODES,
  getProvince,
  incomingOnProvince,
  nodeStock,
  nodeStockMax,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";

export type CampMood = "threatened" | "flying" | "struck";
export type CampGlyphTone = "safe" | "warn" | "danger" | "calm";

export interface CampGlyphDescriptor {
  node: string;
  mood: CampMood;
  tone: CampGlyphTone;
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse";
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

const NODE_CAMP_LABELS: Record<string, { threatened: string; flying: string; struck: string }> = {
  woodcut: {
    threatened: "Timber redoubt",
    flying: "Timber camp",
    struck: "Timber claim",
  },
  quarry: {
    threatened: "Stone redoubt",
    flying: "Stone camp",
    struck: "Stone claim",
  },
  field: {
    threatened: "Forage redoubt",
    flying: "Forage camp",
    struck: "Forage claim",
  },
  ruins: {
    threatened: "Ruins redoubt",
    flying: "Ruins camp",
    struck: "Ruins claim",
  },
  camp: {
    threatened: "Hostile redoubt",
    flying: "Frontier redoubt",
    struck: "Contested camp",
  },
  none: {
    threatened: "Frontier redoubt",
    flying: "Garrison camp",
    struck: "Contested flag",
  },
};

/**
 * Resolves decorative living camp/flag descriptor from direct values.
 * Pure mapping; preserves sim determinism and does not mutate game state.
 */
export function resolveCampGlyphDescriptorByValues(
  node: string,
  mood: CampMood,
  stockLeft?: number,
  stockMax?: number,
  threat?: { realmName: string; etaSeconds: number }
): CampGlyphDescriptor {
  const labels = NODE_CAMP_LABELS[node] ?? NODE_CAMP_LABELS.none;
  const gather = GATHER_NODES[node as keyof typeof GATHER_NODES];
  const res = gather ? (RESOURCE_LABELS[gather.resource] ?? gather.resource) : "";

  if (mood === "threatened" && threat) {
    return {
      node,
      mood: "threatened",
      tone: "danger",
      label: labels.threatened,
      flair: `${threat.realmName} inbound (${threat.etaSeconds}s) · camp watch`,
      color: "#f85149",
      motion: "pulse",
      threatSeconds: threat.etaSeconds,
      threatRealm: threat.realmName,
      stockLeft,
      stockMax,
    };
  }

  if (mood === "flying") {
    let flair = "Banner flying · camp secure";
    if (gather && stockLeft !== undefined && stockMax !== undefined) {
      if (stockLeft <= 0) {
        flair = `Banner flying · ${res} depleted`;
      } else {
        flair = `Banner flying · ${Math.floor(stockLeft)} ${res} stockpiled`;
      }
    }
    return {
      node,
      mood: "flying",
      tone: "safe",
      label: labels.flying,
      flair,
      color: "#3fb950",
      motion: "drift",
      stockLeft,
      stockMax,
    };
  }

  return {
    node,
    mood: "struck",
    tone: "warn",
    label: labels.struck,
    flair: "Flag struck · post contested",
    color: "#d29922",
    motion: "drift",
    stockLeft,
    stockMax,
  };
}

/**
 * Resolves decorative living camp/flag descriptor for a garrisoned province.
 */
export function resolveCampGlyphDescriptor(
  state: GameState,
  provinceId: string,
  nameOf: (realmId: string) => string = (id) => state.realms.find((r) => r.id === id)?.name ?? id
): CampGlyphDescriptor {
  const p = getProvince(state, provinceId);
  const node = p?.node ?? "none";
  const hit = incomingOnProvince(state, provinceId);
  const eta = hit ? Math.max(0, Math.ceil((hit.arrivesTick - state.meta.tick) / TICKS_PER_SECOND)) : 0;
  const threat = hit ? { realmName: nameOf(hit.realmId), etaSeconds: eta } : undefined;

  const mood: CampMood = hit
    ? "threatened"
    : p?.occupantRealmId === "player"
      ? "flying"
      : "struck";

  const gather = GATHER_NODES[node as keyof typeof GATHER_NODES];
  const stockLeft = gather ? nodeStock(state, provinceId) : undefined;
  const max = gather ? nodeStockMax(node) : undefined;

  return resolveCampGlyphDescriptorByValues(node, mood, stockLeft, max, threat);
}

/**
 * Compact 14x14 living SVG badge depicting camp tent, flagstaff, and banner.
 */
function CampBadgeSvg({ mood, node }: { mood: CampMood; node: string }) {
  const isThreatened = mood === "threatened";
  const isStruck = mood === "struck";

  return (
    <svg className="sc-camp-glyph-svg" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
      {/* Ambient glow beneath the camp pavilion */}
      <ellipse
        className="sc-camp-glow-layer"
        cx="7"
        cy="10.8"
        rx="5.2"
        ry="2.4"
        fill="currentColor"
        fillOpacity="0.22"
      />

      {/* Swaying camp pavilion tent & palisade */}
      <g className="sc-camp-drift-layer">
        {/* Tent roof and entrance */}
        <path
          d="M3 11.2L7 4.2L11 11.2H3Z"
          stroke="currentColor"
          strokeWidth="1.1"
          fill="currentColor"
          fillOpacity="0.16"
          strokeLinejoin="round"
        />
        <path d="M7 4.2V11.2M5.4 11.2L7 8.2L8.6 11.2" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
        {/* Palisade stakes on the left & right */}
        <path d="M1.8 11.2V9.4M12.2 11.2V9.4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Flagstaff & flying swallowtail realm banner */}
      <g className={isThreatened ? "sc-camp-pulse-layer" : "sc-camp-drift-layer"}>
        {isStruck ? (
          // Broken/struck flag leaning to the side
          <path d="M7 4.2L9.2 1.8M9.2 1.8L11.4 3.2L9.2 4.2" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        ) : (
          <>
            {/* Upright flagstaff */}
            <path d="M7 4.2V1.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            {/* Flying swallowtail banner */}
            <path
              d="M7 1.4H11.2L9.8 2.8L11.2 4.2H7"
              stroke="currentColor"
              strokeWidth="0.9"
              fill="currentColor"
              fillOpacity={isThreatened ? "0.45" : "0.28"}
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Threat alert beacon glint */}
        {isThreatened ? (
          <circle cx="7" cy="1.2" r="1.1" fill="currentColor" />
        ) : null}
      </g>
    </svg>
  );
}

/**
 * 34x34 corner watermark tucked into the bottom-right of the camp card.
 */
export function CampLivingUnderlay(props: { mood: CampMood; node: string }) {
  const { mood, node } = props;
  const isThreatened = mood === "threatened";

  return (
    <span className={`sc-camp-living-underlay is-${mood} is-${node}`} aria-hidden="true">
      <svg
        className="sc-camp-living-watermark"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* Ground perimeter contour */}
        <path d="M4 29H30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Command pavilion marquee tent */}
        <path
          d="M7 29L17 11.5L27 29H7Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Tent roof creases & doorway flaps */}
        <path
          d="M17 11.5V29M13 29L17 21L21 29M10 29L17 16L24 29"
          stroke="currentColor"
          strokeWidth="1.0"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* Flagstaff & flying swallowtail pennant */}
        <path d="M17 11.5V3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path
          d="M17 4.2H27.5L24.5 7.8L27.5 11.4H17"
          stroke="currentColor"
          strokeWidth="1.15"
          fill="currentColor"
          fillOpacity={isThreatened ? "0.35" : "0.18"}
          strokeLinejoin="round"
        />

        {/* Flank defensive palisade stakes */}
        <path
          d="M4.5 29V23.5L5.8 21.5L7.1 23.5V29M27 29V24.5L28.2 22.8L29.5 24.5V29"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
          opacity="0.75"
        />

        {/* Node-specific emblem hint on the palisade */}
        {node === "woodcut" ? (
          <path d="M4.8 28.5L7.5 25M5.2 25L7.9 28.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        ) : node === "quarry" ? (
          <rect x="5" y="24" width="3.5" height="3" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.15" />
        ) : node === "field" ? (
          <path d="M5.5 28.5C5.5 25.5 7 24 7 24C7 24 8.5 25.5 8.5 28.5" stroke="currentColor" strokeWidth="0.9" />
        ) : null}

        {/* Alert flare atop flagstaff when under threat */}
        {isThreatened ? (
          <>
            <circle cx="17" cy="3.8" r="2.2" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.4" />
            <path d="M17 0.8V2.2M17 5.4V6.8M14 3.8H15.4M18.6 3.8H20" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

/**
 * Living camp/flag glyph strip rendered directly beneath the stacked rows of a camp card.
 */
export function CampLivingGlyph(props: {
  state: GameState;
  provinceId: string;
  nameOf?: (realmId: string) => string;
}) {
  const { state, provinceId, nameOf } = props;
  const desc = resolveCampGlyphDescriptor(state, provinceId, nameOf);

  return (
    <span
      className={`sc-camp-living-glyph is-${desc.mood} tone-${desc.tone} motion-${desc.motion}`}
      aria-hidden="true"
      data-camp-mood={desc.mood}
    >
      <span className="sc-camp-glyph-icon">
        <CampBadgeSvg mood={desc.mood} node={desc.node} />
      </span>
      <span className="sc-camp-glyph-label">{desc.label}</span>
      <span className="sc-camp-glyph-dot" aria-hidden="true">
        ·
      </span>
      <span className="sc-camp-glyph-flair">{desc.flair}</span>
    </span>
  );
}
