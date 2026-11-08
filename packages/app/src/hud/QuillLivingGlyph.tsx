import React from "react";

export type QuillDescriptorTone = "war" | "victory" | "crown" | "save" | "calm";

export interface QuillDescriptor {
  kind?: string;
  tone: QuillDescriptorTone;
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse" | "calm";
}

/**
 * Resolves decorative living quill descriptor for a given ledger kind.
 * Maps event categories to medieval chronicler rubrication styles.
 */
export function resolveQuillDescriptor(kind?: string): QuillDescriptor {
  const k = (kind ?? "").toLowerCase();

  if (k.includes("war") || k.includes("defeat") || k.includes("battle") || k.includes("loss")) {
    return {
      kind,
      tone: "war",
      label: "Martial rubric",
      flair: "Martial record · rubricated in crimson",
      color: "#ef4444",
      motion: "pulse",
    };
  }

  if (k.includes("victory") || k.includes("truce") || k.includes("peace")) {
    return {
      kind,
      tone: "victory",
      label: "Triumph entry",
      flair: "Triumph entry · gilded illumination",
      color: "#facc15",
      motion: "drift",
    };
  }

  if (k.includes("marshal") || k.includes("crown") || k.includes("decree")) {
    return {
      kind,
      tone: "crown",
      label: "Royal script",
      flair: "Crown mandate · royal court script",
      color: "#818cf8",
      motion: "drift",
    };
  }

  if (k.includes("save")) {
    return {
      kind,
      tone: "save",
      label: "Chronicle seal",
      flair: "Ledger archived · chronicle recorded",
      color: "#38bdf8",
      motion: "pulse",
    };
  }

  return {
    kind,
    tone: "calm",
    label: "Scribe quill",
    flair: "Chronicle entry · iron-gall script",
    color: "#e3b341",
    motion: "drift",
  };
}

function QuillSvgPaths(props: { color: string }) {
  const { color } = props;

  return (
    <>
      {/* Swept feather vane */}
      <path
        d="M 12 1.6 C 9.5 2.2 6.8 4.5 5.2 7.6 C 5.8 8.1 6.5 7.8 6.2 8.6 C 4.8 10.2 4.2 11.4 3.5 12.8 C 5.2 11.6 8.5 7.2 12 1.6 Z"
        fill={color}
        fillOpacity="0.28"
        stroke={color}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Central rachis (feather spine) */}
      <path
        d="M 12 1.6 C 8.8 5.2 6 8.6 3 13"
        stroke={color}
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Calamus and sharpened writing nib */}
      <polygon
        points="2.2,13.2 1.2,14.2 2.8,13.8"
        fill={color}
      />
      {/* Ink bead droplet at nib tip */}
      <circle
        cx="1.2"
        cy="14.2"
        r="0.7"
        fill={color}
      />
    </>
  );
}

/**
 * Left-aligned 14x14 living quill glyph and rubrication flair strip
 * rendered beneath the card rows inside .sc-ledger-card.is-living.
 */
export function QuillLivingGlyph(props: { kind?: string; tick?: number }) {
  const desc = resolveQuillDescriptor(props.kind);

  return (
    <div
      className={`sc-quill-living-glyph motion-${desc.motion} tone-${desc.tone}`}
      aria-hidden="true"
    >
      <svg
        className="sc-quill-living-svg"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow Layer */}
        <g className="sc-ledger-glow-layer" stroke={desc.color}>
          <QuillSvgPaths color={desc.color} />
        </g>
        {/* Pulse Layer */}
        <g className="sc-ledger-pulse-layer" stroke={desc.color}>
          <QuillSvgPaths color={desc.color} />
        </g>
        {/* Drift / Base Layer */}
        <g className="sc-ledger-drift-layer" stroke={desc.color}>
          <QuillSvgPaths color={desc.color} />
        </g>
      </svg>
      <span className="sc-quill-living-label">{desc.label}</span>
      <span className="sc-quill-living-sep">·</span>
      <span className="sc-quill-living-flair">{desc.flair}</span>
    </div>
  );
}

function QuillUnderlaySvgPaths(props: { tone: QuillDescriptorTone }) {
  switch (props.tone) {
    case "war":
      // Martial rubric: crossed quill & arming blade with droplet arcs
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 27 4 C 21 6 15 11 11 18 C 12.5 19 14 18 13.5 20 C 10.5 23.5 9 26 7.5 29 C 11.5 26.5 19 16.5 27 4 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          <path d="M 27 4 C 20 12 14 19.5 7.5 29" strokeWidth="1.4" strokeLinecap="round" />
          {/* Crossed short dagger blade */}
          <line x1="7" y1="7" x2="27" y2="27" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="5.5" y1="8.5" x2="8.5" y2="5.5" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="7.5" cy="29" r="1.5" fill="currentColor" />
        </svg>
      );

    case "victory":
      // Gilded triumph: plumed feather with laurel garland arc and star
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 26 4 C 20 6 15 11 11 18 C 12.5 19 14 18 13.5 20 C 10.5 23.5 9 26 7.5 29 C 11.5 26.5 19 16.5 26 4 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          <path d="M 26 4 C 19 12 14 19.5 7.5 29" strokeWidth="1.4" strokeLinecap="round" />
          {/* Laurel arc */}
          <path d="M 12 28 C 18 29 25 25 28 18" strokeWidth="1.1" strokeDasharray="2.5 1.5" strokeLinecap="round" />
          {/* Triumph star */}
          <path d="M 28 8 L 29.5 11 L 32.5 11 L 30 13 L 31 16 L 28 14 L 25 16 L 26 13 L 23.5 11 L 26.5 11 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="0.8" />
        </svg>
      );

    case "crown":
      // Royal court script: stately quill feather with imperial coronet
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 26 4 C 20 6 15 11 11 18 C 12.5 19 14 18 13.5 20 C 10.5 23.5 9 26 7.5 29 C 11.5 26.5 19 16.5 26 4 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          <path d="M 26 4 C 19 12 14 19.5 7.5 29" strokeWidth="1.4" strokeLinecap="round" />
          {/* Coronet crest */}
          <path d="M 18 20 L 21 27 H 31 L 34 20 L 29 23 L 26 18 L 23 23 Z" fill="currentColor" fillOpacity="0.18" strokeWidth="1.1" strokeLinejoin="round" />
          <circle cx="26" cy="18" r="0.9" fill="currentColor" />
        </svg>
      );

    case "save":
    case "calm":
    default:
      // Goose quill dipping into stone inkpot with scroll ribbon
      return (
        <svg viewBox="0 0 34 34" width="34" height="34" fill="none" stroke="currentColor">
          <path d="M 26 4 C 20 6 15 11 11 18 C 12.5 19 14 18 13.5 20 C 10.5 23.5 9 26 7.5 29 C 11.5 26.5 19 16.5 26 4 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          <path d="M 26 4 C 19 12 14 19.5 7.5 29" strokeWidth="1.4" strokeLinecap="round" />
          {/* Inkpot vessel (bottom-right) */}
          <path d="M 22 23 L 20 26 L 21 30 H 29 L 30 26 L 28 23 Z" fill="currentColor" fillOpacity="0.2" strokeWidth="1.1" strokeLinejoin="round" />
          <ellipse cx="25" cy="23" rx="3.5" ry="1.2" strokeWidth="0.9" />
          <ellipse cx="25" cy="23" rx="2.2" ry="0.7" fill="currentColor" />
          <circle cx="7.5" cy="29" r="1.3" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * 34x34 watermark underlay mounted in the bottom-right corner of .sc-ledger-card.is-living.
 * Features low opacity ceiling, radial vignette mask, and strict pointer-events: none.
 */
export function QuillLivingUnderlay(props: { kind?: string }) {
  const desc = resolveQuillDescriptor(props.kind);

  return (
    <div
      className={`sc-quill-living-underlay tone-${desc.tone} ${desc.kind ? `kind-${desc.kind}` : ""}`}
      aria-hidden="true"
    >
      <QuillUnderlaySvgPaths tone={desc.tone} />
    </div>
  );
}
