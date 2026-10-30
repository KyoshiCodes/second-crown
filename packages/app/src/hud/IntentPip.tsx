import React from "react";
import "./intent-pip.css";

export type IntentPipVariant = "seal" | "quill";

export interface IntentPipProps {
  /** Visual variant: "seal" (stamped wax seal with quill nib, default) or "quill" (scribe quill) */
  variant?: IntentPipVariant;
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether to pulse once for a newly added intent */
  pulse?: boolean;
  /** Key incremented when a new intent is added so the single pulse replays */
  pulseKey?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living SVG pip next to the shared-hold intent log.
 * Shows a small stamped wax seal or chronicler quill, pulses once when a new
 * intent is added, and strictly enforces pointer-events: none.
 */
export function IntentPip({
  variant = "seal",
  size = 16,
  pulse = false,
  pulseKey = 0,
  className = "",
  style,
  title,
}: IntentPipProps) {
  const pulseClass = pulse ? "is-pulsing" : "";
  const classes = ["sc-intent-pip-wrapper", `sc-intent-pip-${variant}`, pulseClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      title={title}
      data-intent-pip
      data-variant={variant}
      data-pulsing={pulse}
    >
      <span
        key={pulse ? String(pulseKey) : "idle"}
        className="sc-intent-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-intent-pip"
          style={{ pointerEvents: "none" }}
        >
          {variant === "quill" ? (
            <g>
              {/* Wax signet drop beneath quill */}
              <circle cx="5.2" cy="11.2" r="3.4" fill="#991b1b" stroke="#450a0a" strokeWidth="0.6" />
              <circle cx="5.2" cy="11.2" r="2.1" fill="#dc2626" stroke="#fbbf24" strokeWidth="0.45" />
              {/* Scribe quill feather & golden nib */}
              <path
                d="M14.2 1.8 C 11.2 2.1, 8.2 4.6, 6.2 8.8 L 7.6 10.0 C 11.4 8.1, 13.8 5.0, 14.2 1.8 Z"
                fill="#fef3c7"
                stroke="#92400e"
                strokeWidth="0.55"
                strokeLinejoin="round"
              />
              <path
                d="M13.8 2.2 L 5.0 11.0"
                stroke="#b45309"
                strokeWidth="0.65"
                strokeLinecap="round"
              />
              <polygon
                points="6.2,8.8 4.4,11.6 7.4,9.9"
                fill="#fbbf24"
                stroke="#78350f"
                strokeWidth="0.45"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <g>
              {/* Ribbon tails under royal wax seal */}
              <polygon
                points="5.4,10.8 3.8,15.0 5.8,13.8 7.0,15.0 6.8,10.8"
                fill="#991b1b"
                stroke="#450a0a"
                strokeWidth="0.45"
              />
              <polygon
                points="9.2,10.8 9.0,15.0 10.2,13.8 12.2,15.0 10.6,10.8"
                fill="#b91c1c"
                stroke="#450a0a"
                strokeWidth="0.45"
              />
              {/* Outer pressed crimson-amber wax rim */}
              <circle cx="8" cy="7.2" r="5.6" fill="#991b1b" stroke="#450a0a" strokeWidth="0.65" />
              {/* Inner golden signet ring */}
              <circle cx="8" cy="7.2" r="4.0" fill="#dc2626" stroke="#fbbf24" strokeWidth="0.6" />
              {/* Stamped gold quill-nib signet inside the seal */}
              <path
                d="M10.7 4.4 C 8.8 4.7, 7.2 6.1, 6.2 8.4 L 7.6 9.5 C 9.7 8.4, 10.5 6.5, 10.7 4.4 Z"
                fill="#fef08a"
                stroke="#78350f"
                strokeWidth="0.45"
                strokeLinejoin="round"
              />
              <line
                x1="10.4"
                y1="4.7"
                x2="5.7"
                y2="9.4"
                stroke="#92400e"
                strokeWidth="0.55"
                strokeLinecap="round"
              />
              {/* Top-left molten wax highlight glint */}
              <circle cx="5.7" cy="4.8" r="0.75" fill="#fde68a" opacity="0.85" />
            </g>
          )}
        </svg>
      </span>
    </span>
  );
}

export interface HoldIntentLogProps {
  lines: readonly string[];
  /** Monotonic counter (> 0 when a new intent was added) */
  pulseKey?: number;
  variant?: IntentPipVariant;
}

/**
 * Places a 16px IntentPip to the left of the intent log lines.
 * Renders nothing (and no pip) when there are no lines.
 */
export function HoldIntentLog({
  lines,
  pulseKey = 0,
  variant = "seal",
}: HoldIntentLogProps) {
  if (lines.length === 0) return null;
  return (
    <div className="sc-intent-log" aria-label="Last intents">
      <IntentPip variant={variant} pulse={pulseKey > 0} pulseKey={pulseKey} />
      <div className="sc-intent-log-lines">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
