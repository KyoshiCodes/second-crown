import React from "react";
import { formatLetterSuffix, resourceLedger, type GameState } from "@second-crown/sim";
import type { VaultResource } from "./VaultLivingCard";

export type VaultSealStatus = "safe" | "exposed" | "full";

export interface VaultSealDescriptor {
  res: VaultResource;
  status: VaultSealStatus;
  tone: "safe" | "warn" | "danger";
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse" | "calm";
  have: number;
  vault: number;
  exposed: number;
  cap: number;
}

const SEAL_NAMES: Record<VaultResource, string> = {
  food: "Cellar seal",
  wood: "Timber seal",
  stone: "Crypt seal",
  gold: "Treasury seal",
};

function fmt(n: number): string {
  return formatLetterSuffix(String(Math.floor(n)));
}

/**
 * Resolves decorative living seal descriptor for a given resource and state.
 * Read-only mapping from sim's resourceLedger.
 */
export function resolveVaultSealDescriptor(state: GameState, res: VaultResource): VaultSealDescriptor {
  const l = resourceLedger(state, res);
  const baseLabel = SEAL_NAMES[res];

  if (l.full) {
    return {
      res,
      status: "full",
      tone: "danger",
      label: baseLabel,
      flair: "Stores gorged · capacity reached",
      color: "#f85149",
      motion: "pulse",
      have: l.have,
      vault: l.vault,
      exposed: l.exposed,
      cap: l.cap,
    };
  }

  if (l.exposed > 0) {
    return {
      res,
      status: "exposed",
      tone: "warn",
      label: baseLabel,
      flair: `${fmt(l.exposed)} exposed · above floor`,
      color: "#d29922",
      motion: "pulse",
      have: l.have,
      vault: l.vault,
      exposed: l.exposed,
      cap: l.cap,
    };
  }

  return {
    res,
    status: "safe",
    tone: "safe",
    label: baseLabel,
    flair: `Warded floor · all hidden`,
    color: "#3fb950",
    motion: "drift",
    have: l.have,
    vault: l.vault,
    exposed: 0,
    cap: l.cap,
  };
}

function VaultSealSvgPaths(props: { res: VaultResource; color: string }) {
  const { res, color } = props;

  switch (res) {
    case "food":
      // Granary cellar seal: arched cellar hatch, shackle, padlock body, grain ear pips
      return (
        <>
          <circle cx="7" cy="7" r="5.6" fill="none" stroke={color} strokeWidth="1" strokeDasharray="1.6 1" />
          <path d="M 5 6 V 4.4 C 5 3.3 9 3.3 9 4.4 V 6" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
          <rect x="4.2" y="6" width="5.6" height="4.6" rx="1" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1" />
          <circle cx="7" cy="8" r="0.8" fill={color} />
          <line x1="7" y1="8.6" x2="7" y2="9.6" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="3.2" cy="7" r="0.6" fill={color} fillOpacity="0.7" />
          <circle cx="10.8" cy="7" r="0.6" fill={color} fillOpacity="0.7" />
        </>
      );

    case "wood":
      // Timber storehouse seal: mortise timber frame, crossbrace bolts, bronze deadbolt
      return (
        <>
          <rect x="1.8" y="1.8" width="10.4" height="10.4" rx="1.5" fill="none" stroke={color} strokeWidth="1" />
          <line x1="2.2" y1="7" x2="11.8" y2="7" stroke={color} strokeWidth="0.8" strokeDasharray="2 1.2" />
          <line x1="7" y1="2.2" x2="7" y2="11.8" stroke={color} strokeWidth="0.8" strokeDasharray="2 1.2" />
          <circle cx="3.8" cy="3.8" r="0.6" fill={color} />
          <circle cx="10.2" cy="3.8" r="0.6" fill={color} />
          <circle cx="3.8" cy="10.2" r="0.6" fill={color} />
          <circle cx="10.2" cy="10.2" r="0.6" fill={color} />
          <rect x="5.2" y="5.2" width="3.6" height="3.6" rx="0.8" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.9" />
          <circle cx="7" cy="7" r="0.7" fill={color} />
        </>
      );

    case "stone":
      // Masonry crypt seal: ashlar keystone arch, dual deadbolts, interlocking mortise
      return (
        <>
          <path d="M 2.4 12 V 6.6 C 2.4 3.8 11.6 3.8 11.6 6.6 V 12" fill="none" stroke={color} strokeWidth="1" />
          <path d="M 5.8 2.2 H 8.2 L 7.8 4.8 H 6.2 Z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
          <line x1="3" y1="8" x2="11" y2="8" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
          <line x1="3" y1="10.2" x2="11" y2="10.2" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
          <rect x="5.5" y="6.8" width="3" height="4.6" rx="0.6" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.8" />
          <circle cx="7" cy="9.1" r="0.6" fill={color} />
        </>
      );

    case "gold":
    default:
      // Royal treasury seal: octagonal coin vault plate, 4 dial tick marks, solar diamond tumbler
      return (
        <>
          <path d="M 4.6 1.8 H 9.4 L 12.2 4.6 V 9.4 L 9.4 12.2 H 4.6 L 1.8 9.4 V 4.6 Z" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="7" cy="7" r="3.4" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="1.8 1" />
          <circle cx="7" cy="3.6" r="0.5" fill={color} />
          <circle cx="10.4" cy="7" r="0.5" fill={color} />
          <circle cx="7" cy="10.4" r="0.5" fill={color} />
          <circle cx="3.6" cy="7" r="0.5" fill={color} />
          <path d="M 7 5.4 L 8.1 7 L 7 8.6 L 5.9 7 Z" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="0.8" />
          <circle cx="7" cy="7" r="0.6" fill={color} />
        </>
      );
  }
}

/**
 * Left-aligned 14x14 living vault seal glyph and flair label strip
 * rendered beneath the card rows inside .sc-vault-card.
 */
export function VaultSealLivingGlyph(props: { state: GameState; res: VaultResource }) {
  const desc = resolveVaultSealDescriptor(props.state, props.res);

  return (
    <div
      className={`sc-vault-seal-glyph motion-${desc.motion} tone-${desc.tone} res-${desc.res}`}
      aria-hidden="true"
    >
      <svg
        className="sc-vault-seal-svg"
        viewBox="0 0 14 14"
        width="14"
        height="14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow Layer */}
        <g className="sc-vault-glow-layer" stroke={desc.color}>
          <VaultSealSvgPaths res={desc.res} color={desc.color} />
        </g>
        {/* Pulse Layer */}
        <g className="sc-vault-pulse-layer" stroke={desc.color}>
          <VaultSealSvgPaths res={desc.res} color={desc.color} />
        </g>
        {/* Drift / Base Layer */}
        <g className="sc-vault-drift-layer" stroke={desc.color}>
          <VaultSealSvgPaths res={desc.res} color={desc.color} />
        </g>
      </svg>
      <span className="sc-vault-seal-label">{desc.label}</span>
      <span className="sc-vault-seal-sep">·</span>
      <span className="sc-vault-seal-flair">{desc.flair}</span>
    </div>
  );
}

function VaultUnderlaySvgPaths(props: { res: VaultResource }) {
  switch (props.res) {
    case "food":
      // Granary cellar hatch watermark with heavy arched door, strap hinges, large padlock, wheat ears
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <circle cx="17" cy="17" r="14" strokeWidth="1.2" strokeDasharray="3 2" />
          <path d="M 12 15 V 10 C 12 7 22 7 22 10 V 15" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="9" y="15" width="16" height="13" rx="2.5" fill="currentColor" fillOpacity="0.15" strokeWidth="1.4" />
          <circle cx="17" cy="20" r="2" strokeWidth="1.2" />
          <path d="M 17 22 V 25" strokeWidth="1.4" strokeLinecap="round" />
          {/* Wheat ear side fronds */}
          <path d="M 6 12 Q 9 10 11 12" strokeWidth="1" strokeLinecap="round" />
          <path d="M 5 16 Q 8 15 10 17" strokeWidth="1" strokeLinecap="round" />
          <path d="M 28 12 Q 25 10 23 12" strokeWidth="1" strokeLinecap="round" />
          <path d="M 29 16 Q 26 15 24 17" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    case "wood":
      // Timber loggia vault door: heavy timber crossbars, stud rivets, heavy locking bar
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <rect x="4" y="4" width="26" height="26" rx="3" strokeWidth="1.4" />
          <line x1="5" y1="17" x2="29" y2="17" strokeWidth="1.2" strokeDasharray="4 2.5" />
          <line x1="17" y1="5" x2="17" y2="29" strokeWidth="1.2" strokeDasharray="4 2.5" />
          <circle cx="9" cy="9" r="1.3" fill="currentColor" />
          <circle cx="25" cy="9" r="1.3" fill="currentColor" />
          <circle cx="9" cy="25" r="1.3" fill="currentColor" />
          <circle cx="25" cy="25" r="1.3" fill="currentColor" />
          <rect x="12" y="12" width="10" height="10" rx="1.8" fill="currentColor" fillOpacity="0.18" strokeWidth="1.3" />
          <circle cx="17" cy="17" r="1.6" strokeWidth="1.2" />
          <line x1="17" y1="18.6" x2="17" y2="20.4" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );

    case "stone":
      // Masonry crypt keystone arch, dual deadbolts, ashlar brick courses
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 5 30 V 16 C 5 8 29 8 29 16 V 30" strokeWidth="1.4" />
          <path d="M 14 4 H 20 L 19 11 H 15 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="1.2" />
          <line x1="7" y1="20" x2="27" y2="20" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7" y1="25" x2="27" y2="25" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="13.5" y="17" width="7" height="11" rx="1.5" fill="currentColor" fillOpacity="0.15" strokeWidth="1.2" />
          <circle cx="17" cy="22.5" r="1.4" strokeWidth="1.1" />
        </svg>
      );

    case "gold":
    default:
      // Royal treasury coin vault: octagonal strongbox plate, dial rivets, solar star tumbler
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 11 4 H 23 L 30 11 V 23 L 23 30 H 11 L 4 23 V 11 Z" strokeWidth="1.4" />
          <circle cx="17" cy="17" r="8.5" strokeWidth="1.1" strokeDasharray="3 2" />
          <circle cx="17" cy="8.5" r="1.2" fill="currentColor" />
          <circle cx="25.5" cy="17" r="1.2" fill="currentColor" />
          <circle cx="17" cy="25.5" r="1.2" fill="currentColor" />
          <circle cx="8.5" cy="17" r="1.2" fill="currentColor" />
          <path d="M 17 12 L 20 17 L 17 22 L 14 17 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="1.2" />
          <circle cx="17" cy="17" r="1.5" strokeWidth="1.1" />
        </svg>
      );
  }
}

/**
 * 34x34 watermark underlay mounted in the bottom-right corner of .sc-vault-card.
 * Features low opacity ceiling, radial vignette mask, and strict pointer-events: none.
 */
export function VaultSealUnderlay(props: { state: GameState; res: VaultResource }) {
  const desc = resolveVaultSealDescriptor(props.state, props.res);

  return (
    <div
      className={`sc-vault-seal-underlay is-${desc.res} is-${desc.status}`}
      aria-hidden="true"
    >
      <VaultUnderlaySvgPaths res={desc.res} />
    </div>
  );
}
