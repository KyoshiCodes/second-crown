import React from "react";

export type QuillPipVariant = "quill_ink" | "quill" | "ink";

export interface QuillPipProps {
  /** Visual variant: "quill_ink" (default, quill + inkpot), "quill" (quill pen), or "ink" (inkpot) */
  variant?: QuillPipVariant;
  /** Size in pixels (default: 18, recommended: 16–20) */
  size?: number;
  /** Optional ledger kind (e.g. "marshal", "war", "victory", "defeat") to tint ink */
  kind?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Resolves ink coloration and theme based on ledger event kind:
 * - War / Defeat: Scribe's crimson rubrication ink
 * - Victory / Truce: Royal golden illumination ink
 * - Marshal / Court: Imperial sapphire court ink
 * - Default: Traditional iron-gall chronicler ink
 */
export function resolveInkColors(kind?: string): {
  ink: string;
  inkGlint: string;
  accent: string;
} {
  const k = (kind ?? "").toLowerCase();
  if (k.includes("war") || k.includes("defeat") || k.includes("battle") || k.includes("loss")) {
    return {
      ink: "#dc2626",
      inkGlint: "#fca5a5",
      accent: "#991b1b",
    };
  }
  if (k.includes("victory") || k.includes("truce") || k.includes("peace") || k.includes("gold")) {
    return {
      ink: "#d97706",
      inkGlint: "#fef08a",
      accent: "#b45309",
    };
  }
  if (k.includes("marshal") || k.includes("crown") || k.includes("decree")) {
    return {
      ink: "#6366f1",
      inkGlint: "#c7d2fe",
      accent: "#4338ca",
    };
  }
  // Traditional iron-gall / azure chronicler ink
  return {
    ink: "#0284c7",
    inkGlint: "#7dd3fc",
    accent: "#0369a1",
  };
}

/**
 * 16–20px Quill / Ink Pip:
 * - Medieval chronicler's goose quill pen and faceted stone inkpot.
 * - Angled quill with textured vane, rachis spine, cut barb notches, and sharp writing nib.
 * - Faceted inkpot with liquid ink pool, glossy meniscus sheen, and fresh ink droplet.
 * - STRICT INVARIANT: pointer-events: none on wrapper and SVG so card clicks are never intercepted.
 */
export function QuillPip({
  variant = "quill_ink",
  size = 18,
  kind,
  className = "",
  style,
  title,
}: QuillPipProps) {
  const { ink, inkGlint, accent } = resolveInkColors(kind);
  const showQuill = variant !== "ink";
  const showInkpot = variant !== "quill";

  return (
    <span
      className={`sc-quill-pip-wrapper sc-quill-${variant} ${kind ? `sc-quill-kind-${kind}` : ""} ${className}`}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        userSelect: "none",
        ...style,
      }}
      aria-hidden="true"
      title={title}
      data-kind={kind}
      data-variant={variant}
    >
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        className="sc-quill-pip"
        style={{ pointerEvents: "none", display: "block" }}
        data-variant={variant}
      >
        <defs>
          <linearGradient id="sc-quill-vane-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id="sc-quill-pot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* 1. Faceted Stone/Glass Inkpot (bottom-right) */}
        {showInkpot && (
          <g className="sc-quill-inkpot">
            {/* Inkpot vessel body */}
            <path
              d="M 12.8 13.5 L 11.2 15.6 L 11.6 18 C 11.6 18.7 12.3 19 13.2 19 H 16.8 C 17.7 19 18.4 18.7 18.4 18 L 18.8 15.6 L 17.2 13.5 Z"
              fill="url(#sc-quill-pot-grad)"
              stroke="#475569"
              strokeWidth="0.65"
              strokeLinejoin="round"
            />
            {/* Inkpot front facet highlight */}
            <path
              d="M 13.5 15.6 L 13.8 18.5 H 16.2 L 16.5 15.6 Z"
              fill="#334155"
              opacity="0.5"
            />
            {/* Neck collar */}
            <ellipse
              cx="15"
              cy="13.5"
              rx="2.6"
              ry="1.0"
              fill="#475569"
              stroke="#64748b"
              strokeWidth="0.5"
            />
            {/* Liquid ink well */}
            <ellipse
              cx="15"
              cy="13.5"
              rx="1.9"
              ry="0.7"
              fill={ink}
            />
            {/* Surface ink gloss glint */}
            <ellipse
              cx="14.5"
              cy="13.4"
              rx="0.9"
              ry="0.3"
              fill={inkGlint}
              opacity="0.85"
            />
          </g>
        )}

        {/* 2. Scribe's Goose Quill Feather Pen */}
        {showQuill && (
          <g className="sc-quill-pen">
            {/* Left/outer feather vane with barb notches */}
            <path
              d="M 17 2.2 C 13.5 2.8 10 5.2 7.8 8.6 C 8.6 9.1 9.4 8.7 9.1 9.6 C 7.5 11.2 6.8 12.8 5.8 14.5 C 7.5 13.5 11.2 8.5 17 2.2 Z"
              fill="url(#sc-quill-vane-grad)"
              stroke="#d97706"
              strokeWidth="0.45"
              strokeLinejoin="round"
            />
            {/* Right/inner feather vane with barb notch */}
            <path
              d="M 17 2.2 C 15.6 4.5 14.2 6.8 12.4 8.8 C 13 9.4 13.5 9.1 13.1 9.9 C 11.6 11.6 9.8 13.2 7.8 14.5 C 10.2 12.5 13.8 7.8 17 2.2 Z"
              fill="#fde68a"
              stroke="#b45309"
              strokeWidth="0.45"
              strokeLinejoin="round"
            />
            {/* Central rachis (feather spine) */}
            <path
              d="M 17 2.2 C 13 6 9.5 10 5.2 15.5"
              stroke="#92400e"
              strokeWidth="0.75"
              strokeLinecap="round"
              fill="none"
            />
            {/* Rachis sunlight gleam */}
            <path
              d="M 16.2 3.2 C 13 6.5 10.2 9.8 7.5 13.5"
              stroke="#ffffff"
              strokeWidth="0.35"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            {/* Quill calamus (shaft barrel leading to nib) */}
            <path
              d="M 5.8 14.5 L 3.5 17.5 L 4.8 17.8 L 7.2 14.8 Z"
              fill="#fbbf24"
              stroke="#92400e"
              strokeWidth="0.45"
              strokeLinejoin="round"
            />
            {/* Scribe writing nib (sharp steel/gold point) */}
            <polygon
              points="3.5,17.5 2.5,18.8 4.2,18.2"
              fill={accent}
              stroke="#78350f"
              strokeWidth="0.35"
            />
            {/* Nib split/slit line */}
            <line
              x1="3.8"
              y1="17.2"
              x2="2.5"
              y2="18.8"
              stroke="#1e293b"
              strokeWidth="0.45"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 3. Fresh Wet Ink Droplet at Nib Tip */}
        <g className="sc-quill-droplet">
          {/* Poised ink bead */}
          <circle
            cx="2.2"
            cy="18.9"
            r="1.0"
            fill={ink}
            stroke={accent}
            strokeWidth="0.3"
          />
          {/* Specular gloss glint on droplet */}
          <circle
            cx="1.9"
            cy="18.6"
            r="0.35"
            fill="#ffffff"
          />
        </g>
      </svg>
    </span>
  );
}

/** Convenience aliases for interoperability */
export const QuillInkPip = QuillPip;
export const InkPip = QuillPip;
export const LedgerPip = QuillPip;
