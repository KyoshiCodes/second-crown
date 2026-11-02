import React from "react";
import "./hold-work-pip.css";

export type HoldWorkKind = "militia" | "farms" | "cottages" | "lumberCamps";

export interface HoldWorkPipProps {
  /** Which hold work this pip represents */
  work: HoldWorkKind | string;
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living work pip inside each hold work card (Militia, Farms, Cottages, Lumber camps).
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldWorkPip({
  work,
  size = 16,
  className = "",
  style,
  title,
}: HoldWorkPipProps) {
  const wrapperClass = ["sc-hold-work-pip-wrapper", className]
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
      data-hold-work-pip={work}
      data-work={work}
    >
      <span
        className="sc-hold-work-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-work-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Base outer medallion disc */}
          <circle
            cx="8"
            cy="8"
            r="6.8"
            fill="#1f1813"
            stroke="#4a3b2c"
            strokeWidth="0.65"
            style={{ pointerEvents: "none" }}
          />

          {work === "militia" ? (
            /* Conical iron guard helmet with golden brow ring and nasal piece */
            <>
              <path
                d="M 4.2 11.0 C 4.2 6.5 8 3.2 8 3.2 C 8 3.2 11.8 6.5 11.8 11.0 Z"
                fill="#475569"
                stroke="#334155"
                strokeWidth="0.6"
                style={{ pointerEvents: "none" }}
              />
              <path
                d="M 4.6 10.6 C 4.6 7.2 7.8 4.2 7.8 4.2 C 7.8 4.2 8.6 6.5 8.6 10.6 Z"
                fill="#64748b"
                opacity="0.6"
                style={{ pointerEvents: "none" }}
              />
              <rect
                x="4.0"
                y="10.2"
                width="8.0"
                height="1.5"
                rx="0.3"
                fill="#d97706"
                stroke="#b45309"
                strokeWidth="0.4"
                style={{ pointerEvents: "none" }}
              />
              <rect
                x="7.3"
                y="10.6"
                width="1.4"
                height="3.0"
                rx="0.3"
                fill="#64748b"
                stroke="#334155"
                strokeWidth="0.4"
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx="8"
                cy="10.9"
                r="0.45"
                fill="#fef08a"
                style={{ pointerEvents: "none" }}
              />
            </>
          ) : work === "farms" ? (
            /* Curved harvesting sickle and golden grain ear */
            <>
              <line
                x1="11.5"
                y1="12.5"
                x2="8.0"
                y2="4.5"
                stroke="#d97706"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
              <ellipse
                cx="8.0"
                cy="5.2"
                rx="0.9"
                ry="0.6"
                fill="#f59e0b"
                transform="rotate(-30 8 5.2)"
                style={{ pointerEvents: "none" }}
              />
              <ellipse
                cx="9.2"
                cy="6.6"
                rx="0.9"
                ry="0.6"
                fill="#fbbf24"
                transform="rotate(-20 9.2 6.6)"
                style={{ pointerEvents: "none" }}
              />
              <line
                x1="4.5"
                y1="12.8"
                x2="6.8"
                y2="9.8"
                stroke="#78350f"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              <path
                d="M 6.8 9.8 C 6.2 6.2 9.5 4.0 12.0 4.8 C 10.0 5.4 7.6 7.2 8.2 9.4 Z"
                fill="#94a3b8"
                stroke="#cbd5e1"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
            </>
          ) : work === "cottages" ? (
            /* Thatched timber cottage with warm glowing hearth window */
            <>
              <rect
                x="4.4"
                y="8.2"
                width="7.2"
                height="4.4"
                rx="0.4"
                fill="#573a27"
                stroke="#3a2518"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
              <rect
                x="9.2"
                y="4.5"
                width="1.4"
                height="3.0"
                fill="#4b5563"
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx="10.2"
                cy="3.5"
                r="0.7"
                fill="#9ca3af"
                opacity="0.6"
                style={{ pointerEvents: "none" }}
              />
              <polygon
                points="3.6,8.6 8,4.2 12.4,8.6"
                fill="#b45309"
                stroke="#78350f"
                strokeWidth="0.6"
                style={{ pointerEvents: "none" }}
              />
              <line
                x1="7.2"
                y1="4.6"
                x2="8.8"
                y2="4.6"
                stroke="#d97706"
                strokeWidth="0.6"
                style={{ pointerEvents: "none" }}
              />
              <rect
                x="6.8"
                y="9.8"
                width="2.4"
                height="2.8"
                rx="0.3"
                fill="#fbbf24"
                style={{ pointerEvents: "none" }}
              />
              <rect
                x="7.3"
                y="10.4"
                width="1.4"
                height="1.8"
                fill="#fef08a"
                style={{ pointerEvents: "none" }}
              />
            </>
          ) : (
            /* Felling axe embedded in woodchopper tree stump */
            <>
              <polygon
                points="4.4,12.8 5.0,9.0 11.0,9.0 11.6,12.8"
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="0.5"
                style={{ pointerEvents: "none" }}
              />
              <ellipse
                cx="8"
                cy="9.0"
                rx="3.0"
                ry="1.0"
                fill="#a16207"
                stroke="#451a03"
                strokeWidth="0.4"
                style={{ pointerEvents: "none" }}
              />
              <ellipse
                cx="8"
                cy="9.0"
                rx="1.5"
                ry="0.5"
                fill="#78350f"
                style={{ pointerEvents: "none" }}
              />
              <line
                x1="7.5"
                y1="8.8"
                x2="11.8"
                y2="3.8"
                stroke="#d97706"
                strokeWidth="0.9"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
              <polygon
                points="6.2,8.4 8.0,7.2 8.4,9.2 6.6,9.6"
                fill="#94a3b8"
                stroke="#cbd5e1"
                strokeWidth="0.45"
                style={{ pointerEvents: "none" }}
              />
            </>
          )}
        </svg>
      </span>
    </span>
  );
}
