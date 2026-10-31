import React from "react";
import "./hold-store-pip.css";

export type HoldStoreResource = "food" | "wood" | "stone" | "gold";

export interface HoldStorePipProps {
  /** Resource kind: food, wood, stone, or gold */
  resource: HoldStoreResource;
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

function FoodPipGlyph() {
  return (
    <>
      {/* Golden wheat sheaf bundle */}
      <path
        d="M4.5 13.5 C4.5 9 6.5 6 7.5 3.5"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="0.8"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      <path
        d="M11.5 13.5 C11.5 9 9.5 6 8.5 3.5"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="0.8"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="8"
        y1="14"
        x2="8"
        y2="2.5"
        stroke="#eab308"
        strokeWidth="0.9"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="6.2"
        cy="7.5"
        rx="1.3"
        ry="2"
        transform="rotate(-25 6.2 7.5)"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="9.8"
        cy="7.5"
        rx="1.3"
        ry="2"
        transform="rotate(25 9.8 7.5)"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="6.5"
        cy="4.8"
        rx="1.1"
        ry="1.8"
        transform="rotate(-20 6.5 4.8)"
        fill="#fde047"
        stroke="#ca8a04"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="9.5"
        cy="4.8"
        rx="1.1"
        ry="1.8"
        transform="rotate(20 9.5 4.8)"
        fill="#fde047"
        stroke="#ca8a04"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="8"
        cy="2.8"
        rx="1.0"
        ry="1.7"
        fill="#fef08a"
        stroke="#ca8a04"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <path
        d="M5.5 10.5 Q8 11.8 10.5 10.5"
        fill="none"
        stroke="#991b1b"
        strokeWidth="1.1"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="7.5"
        cy="2.5"
        r="0.45"
        fill="#ffffff"
        opacity="0.9"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

function WoodPipGlyph() {
  return (
    <>
      {/* Bottom log */}
      <rect
        x="2"
        y="8.5"
        width="12"
        height="5"
        rx="1.8"
        fill="#78350f"
        stroke="#451a03"
        strokeWidth="0.6"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="4.2"
        cy="11"
        rx="1.8"
        ry="2.2"
        fill="#b45309"
        stroke="#451a03"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="4.2"
        cy="11"
        rx="0.9"
        ry="1.1"
        fill="none"
        stroke="#78350f"
        strokeWidth="0.45"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="4.2"
        cy="11"
        r="0.3"
        fill="#451a03"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="7"
        y1="10.2"
        x2="13"
        y2="10.2"
        stroke="#451a03"
        strokeWidth="0.45"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />

      {/* Top stacked log */}
      <rect
        x="3.8"
        y="3"
        width="10.2"
        height="4.8"
        rx="1.8"
        fill="#92400e"
        stroke="#451a03"
        strokeWidth="0.6"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="5.8"
        cy="5.4"
        rx="1.7"
        ry="2.1"
        fill="#d97706"
        stroke="#451a03"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx="5.8"
        cy="5.4"
        rx="0.8"
        ry="1.0"
        fill="none"
        stroke="#92400e"
        strokeWidth="0.45"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="8.5"
        y1="4.8"
        x2="13"
        y2="4.8"
        stroke="#451a03"
        strokeWidth="0.45"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="5.2"
        cy="4.6"
        r="0.4"
        fill="#fef08a"
        opacity="0.8"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

function StonePipGlyph() {
  return (
    <>
      {/* Top beveled face (lit facet) */}
      <polygon
        points="2.5,6.5 6.2,3 13.8,3 10.2,6.5"
        fill="#94a3b8"
        stroke="#334155"
        strokeWidth="0.55"
        strokeLinejoin="round"
        style={{ pointerEvents: "none" }}
      />
      {/* Front face */}
      <polygon
        points="2.5,6.5 10.2,6.5 10.2,13.2 2.5,13.2"
        fill="#64748b"
        stroke="#334155"
        strokeWidth="0.55"
        strokeLinejoin="round"
        style={{ pointerEvents: "none" }}
      />
      {/* Right shaded facet */}
      <polygon
        points="10.2,6.5 13.8,3 13.8,9.7 10.2,13.2"
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="0.55"
        strokeLinejoin="round"
        style={{ pointerEvents: "none" }}
      />
      {/* Ashlar masonry mortar groove */}
      <line
        x1="2.5"
        y1="9.8"
        x2="10.2"
        y2="9.8"
        stroke="#334155"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="6.3"
        y1="6.5"
        x2="6.3"
        y2="9.8"
        stroke="#334155"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="2.8"
        y1="6.6"
        x2="9.9"
        y2="6.6"
        stroke="#e2e8f0"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="5"
        cy="4.5"
        r="0.45"
        fill="#ffffff"
        opacity="0.85"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

function GoldPipGlyph() {
  return (
    <>
      {/* Outer coin ridge */}
      <circle
        cx="8"
        cy="8"
        r="6.2"
        fill="#ca8a04"
        stroke="#713f12"
        strokeWidth="0.65"
        style={{ pointerEvents: "none" }}
      />
      {/* Rim bevel */}
      <circle
        cx="8"
        cy="8"
        r="5.4"
        fill="#eab308"
        stroke="#a16207"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      {/* Inner coin field */}
      <circle
        cx="8"
        cy="8"
        r="4.4"
        fill="#facc15"
        style={{ pointerEvents: "none" }}
      />
      {/* Stamped royal crown signet */}
      <polygon
        points="5.2,9.8 10.8,9.8 10.8,7.2 9.5,8.3 8,6.2 6.5,8.3 5.2,7.2"
        fill="#a16207"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1="5.6"
        y1="9.2"
        x2="10.4"
        y2="9.2"
        stroke="#fde047"
        strokeWidth="0.5"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="8"
        cy="5.7"
        r="0.5"
        fill="#fef08a"
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx="5.8"
        cy="5.5"
        r="0.65"
        fill="#ffffff"
        opacity="0.9"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

/**
 * 16px living resource pip inside hold-store cards:
 * - Food: Golden wheat sheaf bundle
 * - Wood: Stacked timber logs with end-grain rings
 * - Stone: Beveled dressed ashlar masonry block
 * - Gold: Royal minted crown coin
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldStorePip({
  resource,
  size = 16,
  className = "",
  style,
  title,
}: HoldStorePipProps) {
  const wrapperClass = [
    "sc-hold-store-pip-wrapper",
    `sc-hold-store-pip-${resource}`,
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
      data-hold-store-pip={resource}
      data-resource={resource}
    >
      <span
        className="sc-hold-store-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className={`sc-hold-store-pip sc-hold-store-pip-svg-${resource}`}
          style={{ pointerEvents: "none" }}
        >
          {resource === "food" && <FoodPipGlyph />}
          {resource === "wood" && <WoodPipGlyph />}
          {resource === "stone" && <StonePipGlyph />}
          {resource === "gold" && <GoldPipGlyph />}
        </svg>
      </span>
    </span>
  );
}
