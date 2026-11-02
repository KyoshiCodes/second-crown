import React from "react";
import "./hold-log-pip.css";

export type HoldLogIntent = "train" | "farm" | "cottage" | "lumber" | "stamp" | "default";

export interface HoldLogPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Optional intent text or type to specialize the log glyph (e.g. "train militia", "build farm", "stamp") */
  intent?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Classifies an intent string (e.g. "train militia", "build farm", "stamp")
 * into a specific hold log iconography type.
 */
export function resolveLogIntent(intent?: string): HoldLogIntent {
  if (!intent) return "default";
  const lower = intent.toLowerCase();
  if (lower.includes("train") || lower.includes("militia")) return "train";
  if (lower.includes("farm")) return "farm";
  if (lower.includes("cottage")) return "cottage";
  if (lower.includes("lumber")) return "lumber";
  if (lower.includes("stamp")) return "stamp";
  return "default";
}

/**
 * 16px living log pip inside each hold log card.
 * Depicts an illuminated chronicle parchment folio with calligraphic ink lines
 * and an embossed heraldic emblem tailored to the logged intent.
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldLogPip({
  size = 16,
  intent,
  className = "",
  style,
  title,
}: HoldLogPipProps) {
  const type = resolveLogIntent(intent);
  const wrapperClass = ["sc-hold-log-pip-wrapper", `sc-hold-log-pip-${type}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={wrapperClass}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      title={title}
      data-hold-log-pip={type}
    >
      <span
        className="sc-hold-log-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-log-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Base chronicle parchment folio with folded corner */}
          <path
            d="M 2.4 1.8 C 2.4 1.4, 2.8 1.0, 3.4 1.0 L 10.8 1.0 L 13.6 3.8 L 13.6 14.2 C 13.6 14.6, 13.2 15.0, 12.6 15.0 L 3.4 15.0 C 2.8 15.0, 2.4 14.6, 2.4 14.2 Z"
            fill="#e8dcc6"
            stroke="#4a3b2c"
            strokeWidth="0.75"
            strokeLinejoin="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Folded dog-eared upper-right corner */}
          <path
            d="M 10.8 1.0 L 10.8 3.8 L 13.6 3.8 Z"
            fill="#c9b79b"
            stroke="#4a3b2c"
            strokeWidth="0.6"
            strokeLinejoin="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Ruled chronicle calligraphic lines */}
          <path
            d="M 4.2 3.6 L 9.4 3.6"
            stroke="#786450"
            strokeWidth="0.6"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />
          <path
            d="M 4.2 5.6 L 11.8 5.6"
            stroke="#786450"
            strokeWidth="0.6"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Emblem per intent */}
          {type === "train" && (
            <g style={{ pointerEvents: "none" }}>
              {/* Crossed warrior training swords */}
              <path
                d="M 4.6 7.6 L 11.4 13.6"
                stroke="#94a3b8"
                strokeWidth="1.1"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              <path
                d="M 11.4 7.6 L 4.6 13.6"
                stroke="#94a3b8"
                strokeWidth="1.1"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              {/* Golden crossguards */}
              <circle cx="5.2" cy="8.2" r="0.75" fill="#f59e0b" style={{ pointerEvents: "none" }} />
              <circle cx="10.8" cy="8.2" r="0.75" fill="#f59e0b" style={{ pointerEvents: "none" }} />
              <circle cx="8" cy="10.6" r="0.6" fill="#fcd34d" style={{ pointerEvents: "none" }} />
            </g>
          )}

          {type === "farm" && (
            <g style={{ pointerEvents: "none" }}>
              {/* Curved reaping sickle */}
              <path
                d="M 6.4 13.2 C 6.4 10.0 8.6 8.0 11.4 8.6 C 9.6 9.4 8.2 10.8 8.2 13.2"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="0.5"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
              {/* Wooden grip */}
              <path
                d="M 6.4 13.2 L 5.2 14.2"
                stroke="#78350f"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              {/* Golden wheat grains */}
              <ellipse cx="9.8" cy="10.5" rx="0.7" ry="1.0" fill="#f59e0b" style={{ pointerEvents: "none" }} />
              <ellipse cx="11.2" cy="9.2" rx="0.6" ry="0.9" fill="#fcd34d" style={{ pointerEvents: "none" }} />
            </g>
          )}

          {type === "cottage" && (
            <g style={{ pointerEvents: "none" }}>
              {/* Thatched cottage roof */}
              <path
                d="M 5.0 11.0 L 8.0 8.2 L 11.0 11.0 Z"
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="0.5"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
              {/* Timber wall */}
              <rect
                x="5.8"
                y="10.8"
                width="4.4"
                height="3.0"
                rx="0.3"
                fill="#a16207"
                stroke="#451a03"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
              {/* Glowing hearth doorway */}
              <rect
                x="7.3"
                y="11.8"
                width="1.4"
                height="2.0"
                fill="#fbbf24"
                style={{ pointerEvents: "none" }}
              />
              {/* Smoke curl */}
              <path
                d="M 9.8 8.4 Q 10.4 7.4 9.8 6.6"
                stroke="#a8a29e"
                strokeWidth="0.5"
                fill="none"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
            </g>
          )}

          {type === "lumber" && (
            <g style={{ pointerEvents: "none" }}>
              {/* Timber stump */}
              <rect
                x="4.8"
                y="11.4"
                width="6.4"
                height="2.8"
                rx="0.6"
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
              {/* Woodman felling axe haft */}
              <path
                d="M 6.4 7.2 L 8.8 12.0"
                stroke="#b45309"
                strokeWidth="1.0"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              {/* Steel axe head */}
              <path
                d="M 8.2 8.6 L 11.0 7.8 L 10.6 10.2 Z"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="0.5"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            </g>
          )}

          {type === "stamp" && (
            <g style={{ pointerEvents: "none" }}>
              {/* Stamped royal wax seal droplet */}
              <circle
                cx="8"
                cy="10.5"
                r="3.0"
                fill="#991b1b"
                stroke="#450a0a"
                strokeWidth="0.6"
                style={{ pointerEvents: "none" }}
              />
              {/* Stamped gold crown signet */}
              <path
                d="M 6.4 11.5 L 6.4 10.0 L 7.2 10.7 L 8 9.5 L 8.8 10.7 L 9.6 10.0 L 9.6 11.5 Z"
                fill="#fcd34d"
                stroke="#92400e"
                strokeWidth="0.35"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            </g>
          )}

          {type === "default" && (
            <g style={{ pointerEvents: "none" }}>
              {/* General chronicle wax droplet with quill nib */}
              <circle
                cx="9.8"
                cy="11.0"
                r="2.2"
                fill="#b91c1c"
                stroke="#450a0a"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx="9.8"
                cy="11.0"
                r="0.8"
                fill="#fbbf24"
                style={{ pointerEvents: "none" }}
              />
              {/* Slanted scribe quill */}
              <path
                d="M 4.2 9.0 L 8.2 10.4"
                stroke="#d97706"
                strokeWidth="0.75"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              <path
                d="M 4.2 9.0 Q 5.2 7.6 6.6 8.8"
                fill="#f59e0b"
                style={{ pointerEvents: "none" }}
              />
            </g>
          )}
        </svg>
      </span>
    </span>
  );
}
