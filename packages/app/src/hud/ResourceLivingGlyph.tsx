import React from "react";
import { formatLetterSuffix, resourceLedger, type GameState } from "@second-crown/sim";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";

export type ResourceKind = "food" | "wood" | "stone" | "gold";
export type ResourceMood = "empty" | "full" | "earning" | "idle";
export type ResourceGlyphTone = "danger" | "warn" | "emerald" | "calm" | "food" | "wood" | "stone" | "gold";

export interface ResourceGlyphDescriptor {
  resource: ResourceKind;
  mood: ResourceMood;
  tone: ResourceGlyphTone;
  label: string;
  flair: string;
  color: string;
  motion: "pulse" | "drift" | "calm";
}

const RESOURCE_LABELS: Record<ResourceKind, string> = {
  food: "Harvest sheaf",
  wood: "Timber cord",
  stone: "Ashlar cairn",
  gold: "Crown mint",
};

const BASE_COLORS: Record<ResourceKind, string> = {
  food: "#b9d27a",
  wood: "#c8955a",
  stone: "#a7b0bb",
  gold: "#e3b341",
};

function hasIncomeVal(raw: string | undefined): boolean {
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n > 0 : n === Infinity;
}

function fmt(n: string | number | undefined): string {
  if (n === undefined) return "0";
  return formatLetterSuffix(String(n));
}

/**
 * Resolves decorative living glyph descriptor directly from raw values.
 */
export function resolveResourceGlyphDescriptorByValues(
  resource: ResourceKind,
  haveRaw: string,
  incomeRaw?: string,
  emptyOverride?: boolean,
  fullOverride?: boolean
): ResourceGlyphDescriptor {
  const baseLabel = RESOURCE_LABELS[resource];
  const earning = hasIncomeVal(incomeRaw);
  const haveNum = Number(haveRaw ?? "0");
  const isEmpty = emptyOverride ?? (resource === "food" ? haveNum <= 0 : haveNum <= 0);
  const isFull = fullOverride ?? false;

  if (isEmpty) {
    let flair = `${baseLabel} bare · depleted stores`;
    if (resource === "food") flair = "Larder bare · host famished";
    else if (resource === "wood") flair = "Timber dry · cordwood bare";
    else if (resource === "stone") flair = "Quarry bare · unworked pits";
    else if (resource === "gold") flair = "Coffers empty · royal debt";

    return {
      resource,
      mood: "empty",
      tone: "danger",
      label: baseLabel,
      flair,
      color: "#f87171",
      motion: "pulse",
    };
  }

  if (isFull) {
    let flair = `${baseLabel} full · stores capped`;
    if (resource === "food") flair = "Granary full · stores capped";
    else if (resource === "wood") flair = "Yard piled · capacity capped";
    else if (resource === "stone") flair = "Crypt gorged · capacity capped";
    else if (resource === "gold") flair = "Treasury overflowing · capacity capped";

    return {
      resource,
      mood: "full",
      tone: "warn",
      label: baseLabel,
      flair,
      color: "#fbbf5a",
      motion: "pulse",
    };
  }

  if (earning) {
    let flair = `Intake active · +${fmt(incomeRaw)}/s`;
    if (resource === "food") flair = `Harvest flowing · +${fmt(incomeRaw)}/s`;
    else if (resource === "wood") flair = `Timber hauling · +${fmt(incomeRaw)}/s`;
    else if (resource === "stone") flair = `Quarry hewing · +${fmt(incomeRaw)}/s`;
    else if (resource === "gold") flair = `Tribute minted · +${fmt(incomeRaw)}/s`;

    return {
      resource,
      mood: "earning",
      tone: resource,
      label: baseLabel,
      flair,
      color: BASE_COLORS[resource],
      motion: "drift",
    };
  }

  // Idle store
  let flair = `${baseLabel} resting · idle intake`;
  if (resource === "food") flair = "Granary resting · idle intake";
  else if (resource === "wood") flair = "Timber stacked · idle hauling";
  else if (resource === "stone") flair = "Masonry steady · idle quarry";
  else if (resource === "gold") flair = "Coinage hoarded · idle treasury";

  return {
    resource,
    mood: "idle",
    tone: "calm",
    label: baseLabel,
    flair,
    color: resource === "food" ? "#8ba360" : resource === "wood" ? "#9e7442" : resource === "stone" ? "#78828f" : "#b38b2a",
    motion: "calm",
  };
}

/**
 * Resolves decorative living glyph descriptor using GameState if present.
 */
export function resolveResourceGlyphDescriptor(
  resource: ResourceKind,
  haveRaw: string,
  incomeRaw?: string,
  state?: GameState
): ResourceGlyphDescriptor {
  if (!state) {
    return resolveResourceGlyphDescriptorByValues(resource, haveRaw, incomeRaw);
  }

  const hungry = resource === "food" ? isFoodStoresEmptyOrLow(state) : false;
  const line = resourceLedger(state, resource);
  const empty = hungry || (line ? line.have <= 0 : Number(haveRaw) <= 0);
  const full = !empty && Boolean(line?.full);

  return resolveResourceGlyphDescriptorByValues(resource, haveRaw, incomeRaw, empty, full);
}

function ResourceGlyphSvgPaths(props: { resource: ResourceKind; color: string }) {
  const { resource, color } = props;

  switch (resource) {
    case "food":
      // Harvest sheaf: tied golden wheat stalk, splaying ears of barley, awn whiskers
      return (
        <>
          {/* Main stem & central ear */}
          <path d="M 7 13 L 7 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 7 6 L 7 2.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <circle cx="7" cy="2.5" r="0.75" fill={color} />
          {/* Left splaying wheat ear */}
          <path d="M 7 9.5 Q 4.5 7.5 4 4.5" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4" cy="4.5" r="0.7" fill={color} />
          <path d="M 3.2 4 L 4 4.5 L 4.8 4" fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          {/* Right splaying wheat ear */}
          <path d="M 7 9.5 Q 9.5 7.5 10 4.5" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <circle cx="10" cy="4.5" r="0.7" fill={color} />
          <path d="M 9.2 4 L 10 4.5 L 10.8 4" fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          {/* Central sheaf bow / tie */}
          <path d="M 5 9.5 Q 7 8.5 9 9.5 Q 7 10.5 5 9.5 Z" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.8" />
        </>
      );

    case "wood":
      // Timber cord: triangular stacked cut logs with growth rings and oak leaf sprig
      return (
        <>
          {/* Bottom left log */}
          <circle cx="4.5" cy="10" r="2.2" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.9" />
          <circle cx="4.5" cy="10" r="1.1" fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="1 0.8" />
          {/* Bottom right log */}
          <circle cx="9.5" cy="10" r="2.2" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.9" />
          <circle cx="9.5" cy="10" r="1.1" fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="1 0.8" />
          {/* Top apex log */}
          <circle cx="7" cy="6" r="2.2" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="0.9" />
          <circle cx="7" cy="6" r="1.1" fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="1 0.8" />
          {/* Oak leaf sprout */}
          <path d="M 7 3.8 Q 9 2.2 8 1 Q 6.5 2 7 3.8 Z" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.7" />
        </>
      );

    case "stone":
      // Ashlar cairn: dressed isometric stone blocks with keystone facets and mason's chisel mark
      return (
        <>
          {/* Base foundation line */}
          <line x1="2" y1="12" x2="12" y2="12" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeDasharray="1.5 1" />
          {/* Top isometric facet */}
          <polygon points="3.5,6 7,3.5 10.5,6 7,8.5" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="0.9" />
          {/* Left isometric face */}
          <polygon points="3.5,6 7,8.5 7,12 3.5,9.5" fill={color} fillOpacity="0.20" stroke={color} strokeWidth="0.9" />
          {/* Right isometric face */}
          <polygon points="7,8.5 10.5,6 10.5,9.5 7,12" fill={color} fillOpacity="0.50" stroke={color} strokeWidth="0.9" />
          {/* Dressed keystone star / glint */}
          <circle cx="7" cy="6" r="0.8" fill={color} />
        </>
      );

    case "gold":
      // Crown mint: minted imperial coin with beaded rim, royal crown charge, and shine glint
      return (
        <>
          {/* Coin outer rim */}
          <circle cx="7" cy="7" r="5.6" fill={color} fillOpacity="0.20" stroke={color} strokeWidth="1" />
          {/* Beaded coin border */}
          <circle cx="7" cy="7" r="4.4" fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="1.2 0.8" />
          {/* 3-point royal crown charge */}
          <path
            d="M 4.5 8.5 L 5 6 L 7 7.2 L 9 6 L 9.5 8.5 Z"
            fill={color}
            fillOpacity="0.65"
            stroke={color}
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          {/* Crown pearl jewels */}
          <circle cx="5" cy="5.4" r="0.5" fill={color} />
          <circle cx="7" cy="5" r="0.6" fill={color} />
          <circle cx="9" cy="5.4" r="0.5" fill={color} />
        </>
      );
  }
}

export interface ResourceLivingGlyphProps {
  resource: ResourceKind;
  have: string;
  income?: string;
  state?: GameState;
  className?: string;
}

/**
 * ResourceLivingGlyph: 14x14 living SVG resource emblem and status flair
 * mounted directly beneath the stacked rows of a resource card in the Resource strip.
 */
export function ResourceLivingGlyph({
  resource,
  have,
  income,
  state,
  className = "",
}: ResourceLivingGlyphProps) {
  const desc = resolveResourceGlyphDescriptor(resource, have, income, state);
  const motionClass =
    desc.motion === "pulse"
      ? "sc-resource-pulse-layer"
      : desc.motion === "drift"
      ? "sc-resource-drift-layer"
      : "";

  return (
    <div
      className={`sc-resource-living-glyph is-${resource} mood-${desc.mood} tone-${desc.tone} ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 14 14"
        className={`sc-resource-living-glyph-svg ${motionClass}`}
        style={{ pointerEvents: "none" }}
      >
        <g className="sc-resource-glow-layer">
          <ResourceGlyphSvgPaths resource={resource} color={desc.color} />
        </g>
        <ResourceGlyphSvgPaths resource={resource} color={desc.color} />
      </svg>
      <div className="sc-resource-living-glyph-text">
        <span className="sc-resource-living-glyph-label" style={{ color: desc.color }}>
          {desc.label}
        </span>
        <span className="sc-resource-living-glyph-flair">{desc.flair}</span>
      </div>
    </div>
  );
}

export interface ResourceLivingUnderlayProps {
  resource: ResourceKind;
  mood?: ResourceMood;
  className?: string;
}

/**
 * ResourceLivingUnderlay: 34x34px decorative watermark underlay in the bottom-right corner
 * of each resource card in the Resource strip.
 */
export function ResourceLivingUnderlay({
  resource,
  mood = "idle",
  className = "",
}: ResourceLivingUnderlayProps) {
  const color = BASE_COLORS[resource];
  const motionClass =
    mood === "empty" || mood === "full"
      ? "sc-resource-pulse-layer"
      : mood === "earning"
      ? "sc-resource-drift-layer"
      : "";

  return (
    <div
      className={`sc-resource-living-underlay is-${resource} is-${mood} ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 34 34"
        className={`sc-resource-living-underlay-svg ${motionClass}`}
        style={{ pointerEvents: "none" }}
      >
        {resource === "food" && (
          <g transform="translate(1, 1)">
            {/* Curved harvest sickle */}
            <path
              d="M 8 26 Q 4 18 10 12 Q 16 6 25 7 Q 19 12 16 19 Q 14 24 8 26 Z"
              fill={color}
              fillOpacity="0.22"
              stroke={color}
              strokeWidth="0.9"
            />
            {/* Wooden handle */}
            <path d="M 7 25 L 4 29" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
            {/* Tied grain bundle */}
            <path d="M 14 27 L 22 10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 17 28 L 26 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 11 26 L 19 8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="18" cy="18" rx="4" ry="1.8" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
            {/* Barley ears */}
            <circle cx="22" cy="9" r="1.5" fill={color} fillOpacity="0.6" />
            <circle cx="26" cy="11" r="1.5" fill={color} fillOpacity="0.6" />
            <circle cx="19" cy="7" r="1.5" fill={color} fillOpacity="0.6" />
          </g>
        )}

        {resource === "wood" && (
          <g transform="translate(1, 1)">
            {/* Felled bottom logs */}
            <rect x="5" y="19" width="22" height="7" rx="3.5" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.9" />
            <ellipse cx="23" cy="22.5" rx="2.5" ry="3.5" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
            <ellipse cx="23" cy="22.5" rx="1.2" ry="1.8" fill="none" stroke={color} strokeWidth="0.6" />
            {/* Top log */}
            <rect x="8" y="12" width="18" height="6.5" rx="3.2" fill={color} fillOpacity="0.32" stroke={color} strokeWidth="0.9" />
            <ellipse cx="22.5" cy="15.2" rx="2.2" ry="3.2" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.8" />
            {/* Crossed woodman's ax */}
            <path d="M 7 28 L 22 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 18 6 Q 23 4 25 7 Q 22 9 19 8 Z" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.8" />
            {/* Oak sprig */}
            <path d="M 12 11 Q 14 8 13 5 Q 10 7 12 11 Z" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="0.7" />
          </g>
        )}

        {resource === "stone" && (
          <g transform="translate(1, 1)">
            {/* Foundation stone block */}
            <polygon points="5,22 17,16 28,22 17,28" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.9" />
            <polygon points="5,22 17,28 17,31 5,25" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.9" />
            <polygon points="17,28 28,22 28,25 17,31" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.9" />
            {/* Upper stepped ashlar block */}
            <polygon points="8,14 17,9 25,14 17,19" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.9" />
            <polygon points="8,14 17,19 17,22 8,17" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.9" />
            <polygon points="17,19 25,14 25,17 17,22" fill={color} fillOpacity="0.55" stroke={color} strokeWidth="0.9" />
            {/* Mason's chisel angled across */}
            <line x1="7" y1="8" x2="16" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            <polygon points="5.5,7 7,5.5 8.5,7 7,8.5" fill={color} fillOpacity="0.7" />
          </g>
        )}

        {resource === "gold" && (
          <g transform="translate(1, 1)">
            {/* Gold bullion ingots in background */}
            <polygon points="7,23 15,19 25,21 17,25" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.8" />
            <polygon points="7,23 17,25 17,28 7,26" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="0.8" />
            {/* Imperial crown minted coin */}
            <circle cx="17" cy="14" r="10.5" fill={color} fillOpacity="0.28" stroke={color} strokeWidth="1.1" />
            <circle cx="17" cy="14" r="8.5" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="1.8 1.2" />
            {/* Royal coronet charge */}
            <path
              d="M 12 17 L 13 12 L 17 14.5 L 21 12 L 22 17 Z"
              fill={color}
              fillOpacity="0.65"
              stroke={color}
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <circle cx="13" cy="11" r="0.8" fill={color} />
            <circle cx="17" cy="10" r="1" fill={color} />
            <circle cx="21" cy="11" r="0.8" fill={color} />
            {/* Radiant glint rays */}
            <line x1="17" y1="2" x2="17" y2="0.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
            <line x1="28" y1="14" x2="29.5" y2="14" stroke={color} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}
