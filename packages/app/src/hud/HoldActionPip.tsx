import React from "react";
import "./hold-action-pip.css";

export type HoldActionKind = "train" | "build" | "stamp" | "leave";

export interface HoldActionPipProps {
  /** Action kind: train, build, stamp, or leave */
  action: HoldActionKind;
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

function TrainActionGlyph() {
  return (
    <>
      {/* Backing crossed spear */}
      <line
        x1="3"
        y1="3"
        x2="13"
        y2="13"
        stroke="#78350f"
        strokeWidth="0.85"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      <polygon
        points="2.2,2.2 4.4,2.6 3.6,4.8"
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="0.4"
        style={{ pointerEvents: "none" }}
      />
      {/* Upright steel militia broadsword */}
      <path
        d="M8 2 L9.3 4.2 L9.3 10.5 L8 11.8 L6.7 10.5 L6.7 4.2 Z"
        fill="#cbd5e1"
        stroke="#475569"
        strokeWidth="0.45"
        style={{ pointerEvents: "none" }}
      />
      {/* Blade center fuller groove */}
      <line
        x1="8"
        y1="3.2"
        x2="8"
        y2="10.2"
        stroke="#94a3b8"
        strokeWidth="0.55"
        style={{ pointerEvents: "none" }}
      />
      {/* Golden crossguard */}
      <rect
        x="4.8"
        y="10.8"
        width="6.4"
        height="1.3"
        rx="0.4"
        fill="#eab308"
        stroke="#a16207"
        strokeWidth="0.4"
        style={{ pointerEvents: "none" }}
      />
      {/* Crimson leather wrapped grip */}
      <line
        x1="8"
        y1="12.1"
        x2="8"
        y2="14"
        stroke="#991b1b"
        strokeWidth="1.1"
        style={{ pointerEvents: "none" }}
      />
      {/* Golden pommel */}
      <circle
        cx="8"
        cy="14.4"
        r="0.75"
        fill="#facc15"
        stroke="#a16207"
        strokeWidth="0.35"
        style={{ pointerEvents: "none" }}
      />
      {/* Steel edge shine glint */}
      <circle
        cx="7.4"
        cy="3.8"
        r="0.4"
        fill="#ffffff"
        opacity="0.9"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

function BuildActionGlyph() {
  return (
    <>
      {/* Mason's trowel / carpenter square backing */}
      <path
        d="M3 8.5 L6.5 12 L4 13.5 Z"
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="0.45"
        style={{ pointerEvents: "none" }}
      />
      {/* Craftsman oak mallet handle */}
      <line
        x1="4.2"
        y1="13.8"
        x2="10.4"
        y2="5.6"
        stroke="#92400e"
        strokeWidth="1.15"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      {/* Heavy forged iron mallet head */}
      <rect
        x="7.8"
        y="2.6"
        width="5.6"
        height="3.2"
        rx="0.6"
        transform="rotate(-36 10.6 4.2)"
        fill="#64748b"
        stroke="#334155"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      {/* Brass ferrule collar ring */}
      <circle
        cx="9.1"
        cy="7.3"
        r="0.55"
        fill="#facc15"
        style={{ pointerEvents: "none" }}
      />
      {/* Striking face glint */}
      <circle
        cx="11.4"
        cy="3.6"
        r="0.4"
        fill="#ffffff"
        opacity="0.85"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

function StampActionGlyph() {
  return (
    <>
      {/* Stamped crimson wax seal pool */}
      <ellipse
        cx="8"
        cy="11.8"
        rx="5.4"
        ry="2.8"
        fill="#991b1b"
        stroke="#450a0a"
        strokeWidth="0.45"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="8"
        cy="11.8"
        rx="3.7"
        ry="1.8"
        fill="#dc2626"
        stroke="#fbbf24"
        strokeWidth="0.4"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="8"
        cy="11.8"
        r="0.75"
        fill="#fde68a"
        style={{ pointerEvents: "none" }}
      />
      {/* Royal brass signet stamp handle */}
      <path
        d="M8 2 C7 2, 6.3 2.9, 6.5 4.3 C6.7 5, 7.2 5.7, 7.3 6.8 L8.7 6.8 C8.8 5.7, 9.3 5, 9.5 4.3 C9.7 2.9, 9 2, 8 2 Z"
        fill="#ca8a04"
        stroke="#713f12"
        strokeWidth="0.45"
        style={{ pointerEvents: "none" }}
      />
      {/* Polished brass handle knob */}
      <circle
        cx="8"
        cy="2.4"
        r="1"
        fill="#facc15"
        stroke="#a16207"
        strokeWidth="0.35"
        style={{ pointerEvents: "none" }}
      />
      {/* Matrix press collar */}
      <rect
        x="5.2"
        y="6.8"
        width="5.6"
        height="1.8"
        rx="0.4"
        fill="#eab308"
        stroke="#854d0e"
        strokeWidth="0.4"
        style={{ pointerEvents: "none" }}
      />
      {/* Molten wax shine glint */}
      <circle
        cx="6.6"
        cy="11.2"
        r="0.4"
        fill="#ffffff"
        opacity="0.9"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

function LeaveActionGlyph() {
  return (
    <>
      {/* Outer stone postern archway */}
      <path
        d="M2.8 14 V 6 A 5.2 5.2 0 0 1 13.2 6 V 14"
        fill="none"
        stroke="#475569"
        strokeWidth="1.1"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      {/* Warm daylight beaming through the open door */}
      <path
        d="M4.2 14 V 6.6 A 3.8 3.8 0 0 1 11.8 6.6 V 14 Z"
        fill="#fef08a"
        style={{ pointerEvents: "none" }}
      />
      {/* Path threshold apron */}
      <polygon
        points="4.6,14 11.4,14 13.2,15.5 2.8,15.5"
        fill="#fde047"
        opacity="0.75"
        style={{ pointerEvents: "none" }}
      />
      {/* Swung open wooden door */}
      <polygon
        points="4.2,6.6 7.4,7.6 7.4,14 4.2,14"
        fill="#78350f"
        stroke="#451a03"
        strokeWidth="0.4"
        style={{ pointerEvents: "none" }}
      />
      {/* Wrought iron door hinge straps */}
      <line
        x1="4.2"
        y1="8.6"
        x2="6.4"
        y2="9.3"
        stroke="#1e293b"
        strokeWidth="0.55"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="4.2"
        y1="12"
        x2="6.4"
        y2="12.7"
        stroke="#1e293b"
        strokeWidth="0.55"
        style={{ pointerEvents: "none" }}
      />
      {/* Sunbeam glint */}
      <circle
        cx="9.8"
        cy="7.6"
        r="0.45"
        fill="#ffffff"
        opacity="0.9"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

/**
 * 16px living action pip inside hold-action cards:
 * - Train: Militia broadsword and crossed spear
 * - Build: Craftsman mallet and builder's trowel
 * - Stamp: Royal brass signet stamp on crimson wax
 * - Leave: Wayfarer stone postern arch and sunlit doorway
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldActionPip({
  action,
  size = 16,
  className = "",
  style,
  title,
}: HoldActionPipProps) {
  const wrapperClass = [
    "sc-hold-action-pip-wrapper",
    `sc-hold-action-pip-${action}`,
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
      data-hold-action-pip={action}
      data-action={action}
    >
      <span
        className="sc-hold-action-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className={`sc-hold-action-pip sc-hold-action-pip-svg-${action}`}
          style={{ pointerEvents: "none" }}
        >
          {action === "train" && <TrainActionGlyph />}
          {action === "build" && <BuildActionGlyph />}
          {action === "stamp" && <StampActionGlyph />}
          {action === "leave" && <LeaveActionGlyph />}
        </svg>
      </span>
    </span>
  );
}
