import React from "react";
import type { DecreeStatus } from "./DecreeLedger";
import "./decree-glyph-living.css";

export type DecreeSealKind = "muster" | "rite" | "envoys" | "crown";

export interface DecreeLivingDescriptor {
  decreeId: string;
  sealKind: DecreeSealKind;
  status: DecreeStatus;
  left: number;
  ticks: number;
  flair: string;
}

const DECREE_SEAL_TITLE: Record<string, string> = {
  muster: "Host Muster Seal",
  rite: "Harvest Rite Seal",
  envoys: "Chancellery Envoy Seal",
};

/** Maps a decree id to its specialized seal sigil type. */
export function getDecreeSealKind(decreeId: string): DecreeSealKind {
  switch (decreeId) {
    case "muster":
      return "muster";
    case "rite":
      return "rite";
    case "envoys":
      return "envoys";
    default:
      return "crown";
  }
}

/**
 * Pure descriptor for one royal decree's living seal glyph.
 * Reads the decree id, status ("active" | "ready" | "short" | "idle"),
 * ticks left, and total duration ticks.
 */
export function resolveDecreeLiving(input: {
  decreeId: string;
  status: DecreeStatus;
  left: number;
  ticks: number;
}): DecreeLivingDescriptor {
  const { decreeId, status, left, ticks } = input;
  const sealKind = getDecreeSealKind(decreeId);
  const sealTitle = DECREE_SEAL_TITLE[decreeId] ?? "Royal Crown Seal";
  const secLeft = Math.ceil(left / 10);
  const secTotal = Math.ceil(ticks / 10);

  let flair: string;
  if (status === "active") {
    if (decreeId === "muster") {
      flair = `Host mustered · 10% cheaper training · ${secLeft}s left`;
    } else if (decreeId === "rite") {
      flair = `Rite in force · +3 production yield · ${secLeft}s left`;
    } else if (decreeId === "envoys") {
      flair = `Envoys riding · +6 gift opinion · ${secLeft}s left`;
    } else {
      flair = `${sealTitle} in force · ${secLeft}s left`;
    }
  } else if (status === "ready") {
    flair = `${sealTitle} prepared · stores ready to issue`;
  } else if (status === "short") {
    flair = `${sealTitle} held · short of royal stores`;
  } else {
    flair = `${sealTitle} · unsworn (lasts ${secTotal}s)`;
  }

  return {
    decreeId,
    sealKind,
    status,
    left,
    ticks,
    flair,
  };
}

function DecreeSealEmblemSvg({
  sealKind,
  status,
}: {
  sealKind: DecreeSealKind;
  status: DecreeStatus;
}) {
  const isActive = status === "active";

  if (sealKind === "muster") {
    /* Muster the Host: Crossed blades, war coronet, and rally standards */
    return (
      <>
        <circle className="sc-decree-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
        <g className="sc-decree-drift-layer">
          {/* Crossed arming swords */}
          <path
            d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Spiked war coronet band */}
          <path
            d="M8.5 14.5 L15.5 14.5 L15 15.5 L9 15.5 Z"
            fill="currentColor"
            fillOpacity="0.32"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          {/* Spiked crown battlements */}
          <path
            d="M8.5 14.3 L8.2 11.2 L10.2 12.6 L12 9.8 L13.8 12.6 L15.8 11.2 L15.5 14.3 Z"
            fill="currentColor"
            fillOpacity="0.45"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
        <g className="sc-decree-pulse-layer">
          {isActive ? (
            /* Fiery martial gleam */
            <>
              <circle cx="12" cy="9.8" r="1.1" fill="currentColor" />
              <path d="M12 7.8 V11.8 M10 9.8 H14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            </>
          ) : (
            <circle cx="12" cy="9.8" r="0.8" fill="currentColor" />
          )}
        </g>
      </>
    );
  }

  if (sealKind === "rite") {
    /* Harvest Rite: Wheat ears, crescent sickle, and sunburst */
    return (
      <>
        <circle className="sc-decree-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
        <g className="sc-decree-drift-layer">
          {/* Upright wheat stalk with seed ears */}
          <path
            d="M12 18 V6.5 M9.6 9.8 L12 12.2 L14.4 9.8 M10.2 7.8 L12 9.8 L13.8 7.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          {/* Crescent harvest sickle arc */}
          <path
            d="M7.4 15.5 C5.8 12.8 6.4 9.2 9.2 7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
        <g className="sc-decree-pulse-layer">
          {isActive ? (
            /* Radiant solar grain pip */
            <>
              <circle cx="12" cy="5.8" r="1.15" fill="currentColor" />
              <circle cx="9.2" cy="7.2" r="0.75" fill="currentColor" />
              <circle cx="14.8" cy="7.2" r="0.75" fill="currentColor" />
            </>
          ) : (
            <circle cx="12" cy="5.8" r="0.8" fill="currentColor" />
          )}
        </g>
      </>
    );
  }

  if (sealKind === "envoys") {
    /* Send Envoys: Diplomat signet wings, treaty parchment, royal crown */
    return (
      <>
        <circle className="sc-decree-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
        <g className="sc-decree-drift-layer">
          {/* Twin courier messenger wings */}
          <path
            d="M4.8 11.5 C7.2 9.2 10.4 9.8 12 11.5 C13.6 9.8 16.8 9.2 19.2 11.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Treaty parchment scroll */}
          <rect
            x="8.5"
            y="11.8"
            width="7"
            height="5"
            rx="0.8"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <path d="M10.2 13.5 H13.8 M10.2 15 H12.8" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
        </g>
        <g className="sc-decree-pulse-layer">
          {isActive ? (
            /* Shimmering envoy seal star */
            <>
              <circle cx="12" cy="8.2" r="1.1" fill="currentColor" />
              <path d="M12 6.4 V10 M10.2 8.2 H13.8" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
            </>
          ) : (
            <circle cx="12" cy="8.2" r="0.8" fill="currentColor" />
          )}
        </g>
      </>
    );
  }

  /* Default / Crown: Stamped signet matrix and imperial crown */
  return (
    <>
      <circle className="sc-decree-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
      <g className="sc-decree-drift-layer">
        <path
          d="M8 14.5 L16 14.5 L15.4 16 L8.6 16 Z"
          fill="currentColor"
          fillOpacity="0.32"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <path
          d="M8 14.2 L7.6 10.8 L9.8 12.4 L12 9.2 L14.2 12.4 L16.4 10.8 L16 14.2 Z"
          fill="currentColor"
          fillOpacity="0.4"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </g>
      <g className="sc-decree-pulse-layer">
        {isActive ? (
          <>
            <circle cx="12" cy="8.8" r="1.1" fill="currentColor" />
            <circle cx="7.6" cy="10.4" r="0.75" fill="currentColor" />
            <circle cx="16.4" cy="10.4" r="0.75" fill="currentColor" />
          </>
        ) : (
          <circle cx="12" cy="8.8" r="0.8" fill="currentColor" />
        )}
      </g>
    </>
  );
}

/**
 * Corner-confined 34x34 ambient seal watermark inside `.sc-decree-card`.
 * Strictly pointer-events: none so clicks and taps on the Issue button are never blocked.
 */
export function DecreeLivingUnderlay(props: {
  decreeId: string;
  status: DecreeStatus;
  left: number;
  ticks: number;
}) {
  const { decreeId, sealKind, status } = resolveDecreeLiving(props);
  return (
    <span
      className={`sc-decree-living-underlay sc-decree-seal-underlay decree-${decreeId} seal-${sealKind} status-${status} is-${status}`}
      aria-hidden="true"
      data-decree-watermark={decreeId}
      data-decree-seal={sealKind}
      data-decree-status={status}
    >
      <svg viewBox="0 0 24 24" className="sc-decree-underlay-svg" focusable="false">
        <DecreeSealEmblemSvg sealKind={sealKind} status={status} />
      </svg>
    </span>
  );
}

/**
 * Living 14x14 decree seal emblem & flair status strip rendered directly beneath
 * `DecreeLedger` on each royal decree card.
 */
export function DecreeLivingGlyph(props: {
  decreeId: string;
  status: DecreeStatus;
  left: number;
  ticks: number;
}) {
  const { decreeId, sealKind, status, flair } = resolveDecreeLiving(props);
  return (
    <span
      className={`sc-decree-seal-glyph sc-decree-living-glyph sc-decree-status-glyph decree-${decreeId} seal-${sealKind} status-${status}`}
      aria-hidden="true"
      data-decree-glyph={decreeId}
      data-decree-seal={sealKind}
      data-decree-status={status}
    >
      <svg viewBox="0 0 24 24" className="sc-decree-seal-icon sc-decree-glyph-icon" focusable="false">
        <DecreeSealEmblemSvg sealKind={sealKind} status={status} />
      </svg>
      <span className="sc-decree-seal-flair sc-decree-glyph-flair">{flair}</span>
    </span>
  );
}

export const DecreeSealLivingGlyph = DecreeLivingGlyph;
export const DecreeLivingSealGlyph = DecreeLivingGlyph;
export const DecreeSealLivingUnderlay = DecreeLivingUnderlay;
