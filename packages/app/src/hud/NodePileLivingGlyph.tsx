import React from "react";
import {
  GATHER_NODES,
  getProvince,
  isProvinceSeen,
  nodeStock,
  nodeStockMax,
  storedNodeStock,
  type GameState,
} from "@second-crown/sim";

export type GatherNodeKind = "woodcut" | "quarry" | "field";
export type NodePileStatus = "full" | "draining" | "dry" | "untouched";
export type NodePileTone = "safe" | "warn" | "danger";

export interface NodePileDescriptor {
  node: GatherNodeKind;
  status: NodePileStatus;
  tone: NodePileTone;
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse";
  have: number;
  max: number;
  stored: number | null;
}

const PILE_NAMES: Record<GatherNodeKind, string> = {
  woodcut: "Timber cord",
  quarry: "Stone cairn",
  field: "Forage bushel",
};

/**
 * Resolves decorative living pile descriptor from direct numbers.
 * Read-only mapping; preserves game state.
 */
export function resolveNodePileDescriptorByValues(
  node: GatherNodeKind,
  have: number,
  max: number,
  stored: number | null
): NodePileDescriptor {
  const baseLabel = PILE_NAMES[node];

  if (have <= 0) {
    let flair = "Depleted stand · waiting on new growth";
    if (node === "quarry") flair = "Exhausted pit · awaiting seam regeneration";
    if (node === "field") flair = "Picked meadow · awaiting seasonal wild sprout";

    return {
      node,
      status: "dry",
      tone: "danger",
      label: baseLabel,
      flair,
      color: "#f85149",
      motion: "pulse",
      have,
      max,
      stored,
    };
  }

  if (have < max) {
    let unit = "logs";
    let action = "active timber harvest";
    if (node === "quarry") {
      unit = "ashlar";
      action = "quarried seam active";
    } else if (node === "field") {
      unit = "bushels";
      action = "gathering foraged yield";
    }

    return {
      node,
      status: "draining",
      tone: "warn",
      label: baseLabel,
      flair: `${have}/${max} ${unit} · ${action}`,
      color: "#d29922",
      motion: "pulse",
      have,
      max,
      stored,
    };
  }

  // Full or Untouched
  const isUntouched = stored === null;
  let flair = isUntouched ? "Untouched cord · deep old growth" : "Bountiful stand · cordwood stacked";
  if (node === "quarry") {
    flair = isUntouched ? "Untouched seam · unworked granite" : "Bountiful cairn · dressed blocks stacked";
  } else if (node === "field") {
    flair = isUntouched ? "Wild thicket · ripe seasonal yield" : "Bountiful forage · grain bushels tied";
  }

  return {
    node,
    status: isUntouched ? "untouched" : "full",
    tone: "safe",
    label: baseLabel,
    flair,
    color: "#3fb950",
    motion: "drift",
    have,
    max,
    stored,
  };
}

/**
 * Resolves decorative living pile descriptor for a province.
 * Returns null if province is unseen or not a gather node.
 */
export function resolveNodePileDescriptor(
  state: GameState,
  provinceId: string
): NodePileDescriptor | null {
  const p = getProvince(state, provinceId);
  if (!p || !isProvinceSeen(state, provinceId)) return null;
  if (!(p.node in GATHER_NODES)) return null;

  const node = p.node as GatherNodeKind;
  const have = nodeStock(state, provinceId);
  const max = nodeStockMax(node);
  const stored = storedNodeStock(state, provinceId);

  return resolveNodePileDescriptorByValues(node, have, max, stored);
}

function NodePileSvgPaths(props: { node: GatherNodeKind; color: string }) {
  const { node, color } = props;

  switch (node) {
    case "woodcut":
      // Stacked timber cordwood logs: bottom 2 logs with bark ends, 1 top log, sawdust spark
      return (
        <>
          <rect x="1.5" y="7.5" width="6.5" height="4" rx="1" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.8" />
          <ellipse cx="8" cy="9.5" rx="0.9" ry="1.4" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.6" />
          <circle cx="8" cy="9.5" r="0.3" fill={color} />
          <rect x="5.5" y="8" width="6.5" height="4" rx="1" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.8" />
          <ellipse cx="12" cy="10" rx="0.9" ry="1.4" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.6" />
          <circle cx="12" cy="10" r="0.3" fill={color} />
          <rect x="3.5" y="3.8" width="6.5" height="4" rx="1" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.9" />
          <ellipse cx="10" cy="5.8" rx="0.9" ry="1.4" fill={color} stroke={color} strokeWidth="0.6" />
          <circle cx="10" cy="5.8" r="0.35" fill={color} />
          <circle cx="6.5" cy="2" r="0.65" fill={color} />
        </>
      );

    case "quarry":
      // Isometric ashlar stone blocks and quarry cairn
      return (
        <>
          <polygon points="1.5,8 4.5,6.5 7.5,8 4.5,9.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.7" />
          <polygon points="1.5,8 4.5,9.5 4.5,12 1.5,10.5" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.7" />
          <polygon points="4.5,9.5 7.5,8 7.5,10.5 4.5,12" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.7" />
          <polygon points="6.5,8 9.5,6.5 12.5,8 9.5,9.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.7" />
          <polygon points="6.5,8 9.5,9.5 9.5,12 6.5,10.5" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.7" />
          <polygon points="9.5,9.5 12.5,8 12.5,10.5 9.5,12" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.7" />
          <polygon points="4,4.2 7,2.8 10,4.2 7,5.6" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="0.8" />
          <polygon points="4,4.2 7,5.6 7,8 4,6.6" fill={color} fillOpacity="0.65" stroke={color} strokeWidth="0.8" />
          <polygon points="7,5.6 10,4.2 10,6.6 7,8" fill={color} fillOpacity="0.8" stroke={color} strokeWidth="0.8" />
          <circle cx="8.5" cy="1.6" r="0.6" fill={color} />
        </>
      );

    case "field":
    default:
      // Harvest forage bushels and grain sacks
      return (
        <>
          <ellipse cx="4.2" cy="9.2" rx="3.2" ry="2.6" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="0.8" />
          <rect x="3.4" y="6.4" width="1.6" height="1.1" rx="0.3" fill={color} stroke={color} strokeWidth="0.6" />
          <circle cx="4.2" cy="6.2" r="0.6" fill={color} />
          <ellipse cx="9.8" cy="9.2" rx="3.2" ry="2.6" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="0.8" />
          <rect x="9" y="6.4" width="1.6" height="1.1" rx="0.3" fill={color} stroke={color} strokeWidth="0.6" />
          <circle cx="9.8" cy="6.2" r="0.6" fill={color} />
          <ellipse cx="7" cy="5.8" rx="2.8" ry="2.4" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="0.9" />
          <rect x="6.3" y="3.2" width="1.4" height="1.1" rx="0.3" fill={color} stroke={color} strokeWidth="0.6" />
          <circle cx="7" cy="3" r="0.6" fill={color} />
          <circle cx="9" cy="2.2" r="0.65" fill={color} />
        </>
      );
  }
}

/**
 * Left-aligned 14x14 living node pile glyph and flair label strip
 * rendered beneath the card rows inside .sc-node-card.
 */
export function NodePileLivingGlyph(props: {
  state: GameState;
  provinceId: string;
  node?: GatherNodeKind;
}) {
  const desc = resolveNodePileDescriptor(props.state, props.provinceId);
  if (!desc) return null;

  return (
    <div
      className={`sc-node-pile-glyph motion-${desc.motion} tone-${desc.tone} node-${desc.node}`}
      aria-hidden="true"
    >
      <svg
        className="sc-node-pile-svg"
        viewBox="0 0 14 14"
        width="14"
        height="14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow Layer */}
        <g className="sc-node-glow-layer" stroke={desc.color}>
          <NodePileSvgPaths node={desc.node} color={desc.color} />
        </g>
        {/* Pulse Layer */}
        <g className="sc-node-pulse-layer" stroke={desc.color}>
          <NodePileSvgPaths node={desc.node} color={desc.color} />
        </g>
        {/* Drift Layer */}
        <g className="sc-node-drift-layer" stroke={desc.color}>
          <NodePileSvgPaths node={desc.node} color={desc.color} />
        </g>
      </svg>
      <span className="sc-node-pile-label">{desc.label}</span>
      <span className="sc-node-pile-sep">·</span>
      <span className="sc-node-pile-flair">{desc.flair}</span>
    </div>
  );
}

function NodePileUnderlaySvgPaths(props: { node: GatherNodeKind }) {
  switch (props.node) {
    case "woodcut":
      // Broad cordwood timber pile with split logs, crosscut rings, axe notch
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <ellipse cx="17" cy="27" rx="14" ry="4" strokeWidth="1" strokeDasharray="3 2" />
          {/* Bottom tier logs */}
          <rect x="4" y="20" width="13" height="6" rx="1.5" fill="currentColor" fillOpacity="0.16" strokeWidth="1.2" />
          <ellipse cx="17" cy="23" rx="1.8" ry="2.7" strokeWidth="1" />
          <circle cx="17" cy="23" r="0.7" fill="currentColor" />
          <rect x="14" y="21" width="15" height="6" rx="1.5" fill="currentColor" fillOpacity="0.16" strokeWidth="1.2" />
          <ellipse cx="29" cy="24" rx="1.8" ry="2.7" strokeWidth="1" />
          <circle cx="29" cy="24" r="0.7" fill="currentColor" />
          {/* Middle tier logs */}
          <rect x="8" y="14" width="15" height="6" rx="1.5" fill="currentColor" fillOpacity="0.22" strokeWidth="1.3" />
          <ellipse cx="23" cy="17" rx="1.8" ry="2.7" strokeWidth="1.1" />
          <circle cx="23" cy="17" r="0.7" fill="currentColor" />
          {/* Top peak log */}
          <rect x="11" y="8" width="13" height="6" rx="1.5" fill="currentColor" fillOpacity="0.28" strokeWidth="1.4" />
          <ellipse cx="24" cy="11" rx="1.8" ry="2.7" strokeWidth="1.2" />
          <circle cx="24" cy="11" r="0.8" fill="currentColor" />
          {/* Wood chip and axe glint */}
          <path d="M 6 12 L 10 9 L 8 13 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="0.8" />
          <circle cx="18" cy="5" r="1.1" fill="currentColor" />
        </svg>
      );

    case "quarry":
      // Hewn stone ashlar masonry pyramid with dressed limestone blocks
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 4 28 L 17 25 L 30 28" strokeWidth="1" strokeDasharray="3 2" />
          {/* Bottom left block */}
          <polygon points="4,21 11,18 18,21 11,24" fill="currentColor" fillOpacity="0.16" strokeWidth="1.1" />
          <polygon points="4,21 11,24 11,29 4,26" fill="currentColor" fillOpacity="0.22" strokeWidth="1.1" />
          <polygon points="11,24 18,21 18,26 11,29" fill="currentColor" fillOpacity="0.28" strokeWidth="1.1" />
          {/* Bottom right block */}
          <polygon points="16,21 23,18 30,21 23,24" fill="currentColor" fillOpacity="0.16" strokeWidth="1.1" />
          <polygon points="16,21 23,24 23,29 16,26" fill="currentColor" fillOpacity="0.22" strokeWidth="1.1" />
          <polygon points="23,24 30,21 30,26 23,29" fill="currentColor" fillOpacity="0.28" strokeWidth="1.1" />
          {/* Top keystone block */}
          <polygon points="10,13 17,10 24,13 17,16" fill="currentColor" fillOpacity="0.25" strokeWidth="1.3" />
          <polygon points="10,13 17,16 17,22 10,19" fill="currentColor" fillOpacity="0.32" strokeWidth="1.3" />
          <polygon points="17,16 24,13 24,19 17,22" fill="currentColor" fillOpacity="0.4" strokeWidth="1.3" />
          {/* Masonry chisel glints */}
          <circle cx="20" cy="6" r="1.1" fill="currentColor" />
          <circle cx="26" cy="11" r="0.8" fill="currentColor" />
        </svg>
      );

    case "field":
    default:
      // Harvest forage sacks and grain bushel sheaves, tied sack ears
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <ellipse cx="17" cy="27" rx="14" ry="4" strokeWidth="1" strokeDasharray="3 2" />
          {/* Bottom left sack */}
          <ellipse cx="11" cy="21" rx="7" ry="5.5" fill="currentColor" fillOpacity="0.18" strokeWidth="1.2" />
          <rect x="9.5" y="14.5" width="3" height="2.2" rx="0.6" fill="currentColor" strokeWidth="1" />
          <circle cx="11" cy="14" r="1.2" fill="currentColor" />
          {/* Bottom right sack */}
          <ellipse cx="23" cy="21" rx="7" ry="5.5" fill="currentColor" fillOpacity="0.18" strokeWidth="1.2" />
          <rect x="21.5" y="14.5" width="3" height="2.2" rx="0.6" fill="currentColor" strokeWidth="1" />
          <circle cx="23" cy="14" r="1.2" fill="currentColor" />
          {/* Top center bushel */}
          <ellipse cx="17" cy="13" rx="6" ry="5" fill="currentColor" fillOpacity="0.26" strokeWidth="1.3" />
          <rect x="15.5" y="7" width="3" height="2.2" rx="0.6" fill="currentColor" strokeWidth="1.1" />
          <circle cx="17" cy="6.5" r="1.3" fill="currentColor" />
          {/* Wheat ear side fronds */}
          <path d="M 5 15 Q 8 11 12 12" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M 29 15 Q 26 11 22 12" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="21" cy="4" r="1.1" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * 34x34 watermark underlay mounted in the bottom-right corner of .sc-node-card.
 * Features low opacity ceiling, radial vignette mask, and strict pointer-events: none.
 */
export function NodePileUnderlay(props: {
  node: GatherNodeKind;
  have: number;
  max: number;
}) {
  const status: NodePileStatus =
    props.have <= 0 ? "dry" : props.have < props.max ? "draining" : "full";

  return (
    <div
      className={`sc-node-pile-underlay sc-node-living-underlay is-${props.node} is-${status}`}
      aria-hidden="true"
    >
      <NodePileUnderlaySvgPaths node={props.node} />
    </div>
  );
}
