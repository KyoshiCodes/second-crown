import React from "react";
import "./hold-status-pip.css";

export interface HoldStatusPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether the hold has pending intents in flight */
  pending?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living status pip inside the hold status card.
 * Depicts a royal hold crown with live emerald heartbeat jewel (or warm amber when pending).
 *
 * GUARANTEE: pointer-events: none on the pip and all children!
 */
export function HoldStatusPip({
  size = 16,
  pending = false,
  className = "",
  style,
  title,
}: HoldStatusPipProps) {
  const jewelColor = pending ? "#facc15" : "#4ade80";
  const jewelStroke = pending ? "#ca8a04" : "#16a34a";
  const haloColor = pending ? "rgba(234, 179, 8, 0.45)" : "rgba(34, 197, 94, 0.4)";
  const pendingClass = pending ? "is-pending" : "is-live";

  const wrapperClass = [
    "sc-hold-status-pip-wrapper",
    pendingClass,
    className,
  ]
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
      data-hold-status-pip
      data-pending={pending}
    >
      <span
        className="sc-hold-status-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-status-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Subtle live halo pulse ring */}
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="none"
            stroke={haloColor}
            strokeWidth="0.6"
            style={{ pointerEvents: "none" }}
          />

          {/* Lower ermine circlet band */}
          <rect
            x="3.2"
            y="11.6"
            width="9.6"
            height="2.2"
            rx="0.5"
            fill="#ca8a04"
            stroke="#713f12"
            strokeWidth="0.5"
            style={{ pointerEvents: "none" }}
          />
          {/* Circlet mini gems */}
          <circle cx="4.8" cy="12.7" r="0.45" fill="#22c55e" style={{ pointerEvents: "none" }} />
          <circle cx="8" cy="12.7" r="0.45" fill="#ef4444" style={{ pointerEvents: "none" }} />
          <circle cx="11.2" cy="12.7" r="0.45" fill="#3b82f6" style={{ pointerEvents: "none" }} />

          {/* Crown golden battlements and peaks */}
          <polygon
            points="3.4,11.6 2.8,6.2 5.4,8.8 8,4.2 10.6,8.8 13.2,6.2 12.6,11.6"
            fill="#eab308"
            stroke="#a16207"
            strokeWidth="0.5"
            style={{ pointerEvents: "none" }}
          />

          {/* Side pearl finials */}
          <circle cx="2.8" cy="5.6" r="0.7" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.3" style={{ pointerEvents: "none" }} />
          <circle cx="13.2" cy="5.6" r="0.7" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.3" style={{ pointerEvents: "none" }} />

          {/* Central peak living status jewel */}
          <circle
            cx="8"
            cy="3.6"
            r="1.3"
            fill={jewelColor}
            stroke={jewelStroke}
            strokeWidth="0.4"
            style={{ pointerEvents: "none" }}
          />
          {/* Status glint reflection */}
          <circle
            cx="7.6"
            cy="3.2"
            r="0.45"
            fill="#ffffff"
            opacity="0.9"
            style={{ pointerEvents: "none" }}
          />
        </svg>
      </span>
    </span>
  );
}
