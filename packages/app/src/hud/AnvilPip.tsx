import React from "react";

export interface AnvilPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether the yard is actively working / forging (adds glowing hot iron & sparks) */
  active?: boolean;
  /** Number of works touching the keep (optional for title tooltip) */
  count?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Small Living Anvil Pip (Yard room & works cards):
 * - Blacksmith forged cast steel anvil on an iron-banded oak stump.
 * - Reactive living state: cherry-red glowing heated iron bar & flying sparks when active.
 * - Strictly pointer-events: none.
 */
export function AnvilPip({
  size = 16,
  active = false,
  count,
  className = "",
  style,
  title,
}: AnvilPipProps) {
  const tooltip =
    title ??
    (count !== undefined
      ? `Keep Yard · ${count} ${count === 1 ? "work" : "works"} touching the keep`
      : active
        ? "Blacksmith Anvil (Forging active)"
        : "Blacksmith Anvil (Yard works)");

  return (
    <span
      className={`sc-anvil-pip-wrapper ${active ? "is-active" : "is-cold"} ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        pointerEvents: "none",
        userSelect: "none",
        verticalAlign: "middle",
        position: "relative",
        ...style,
      }}
      aria-hidden="true"
      title={tooltip}
      data-anvil-pip
      data-active={active}
      data-count={count}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ pointerEvents: "none", display: "block" }}
        aria-hidden="true"
      >
        {/* 1. Oak Log Stump Base */}
        <polygon
          points="6,16 18,16 19,23 5,23"
          fill="#451a03"
          stroke="#271406"
          strokeWidth="0.8"
        />
        {/* Wood grain cracks */}
        <line x1="10" y1="16.5" x2="9.5" y2="22.5" stroke="#271406" strokeWidth="0.5" />
        <line x1="14" y1="16.5" x2="14.5" y2="22.5" stroke="#271406" strokeWidth="0.5" />

        {/* Iron binding hoop around stump */}
        <line x1="5.5" y1="19.5" x2="18.5" y2="19.5" stroke="#334155" strokeWidth="1.2" />
        <circle cx="9" cy="19.5" r="0.4" fill="#94a3b8" />
        <circle cx="15" cy="19.5" r="0.4" fill="#94a3b8" />

        {/* 2. Forged Steel Anvil Feet & Base */}
        <polygon
          points="7,16 17,16 15,14 9,14"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="0.6"
        />

        {/* 3. Anvil Narrow Waist & Body */}
        <polygon
          points="9.5,14 14.5,14 14,11 10,11"
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="0.5"
        />

        {/* 4. Anvil Upper Body & Conical Horn (Bick) */}
        {/* Left conical horn (tapering to point) */}
        <path
          d="M 10 9 L 2.5 10.2 C 2.2 10.8 2.8 11.4 3.5 11.5 L 10 11.8 Z"
          fill="#64748b"
          stroke="#1e293b"
          strokeWidth="0.6"
        />
        {/* Main body & heel on right */}
        <polygon
          points="10,9 20.5,9 20.5,11.5 10,11.8"
          fill="#475569"
          stroke="#1e293b"
          strokeWidth="0.6"
        />

        {/* Flat striking face table (hardened steel) */}
        <polygon
          points="9.5,8.2 20.5,8.2 20.2,9.4 9.2,9.4"
          fill="#94a3b8"
          stroke="#334155"
          strokeWidth="0.5"
        />
        {/* Hardy square hole on face */}
        <rect x="17.5" y="8.5" width="1.2" height="0.7" fill="#0f172a" />

        {/* 5. Living Details (Hot Billet & Sparks when Active) */}
        {active ? (
          <g className="sc-anvil-active-forge">
            {/* Glowing hot iron billet on the anvil face */}
            <rect
              className="sc-anvil-hot-billet"
              x="11"
              y="7.4"
              width="5.2"
              height="1.4"
              rx="0.4"
              fill="#f97316"
              stroke="#fbbf24"
              strokeWidth="0.4"
            />
            {/* Flying forging sparks */}
            <circle className="sc-anvil-spark" cx="13" cy="4.5" r="0.65" fill="#fef08a" />
            <circle className="sc-anvil-spark" cx="16" cy="3.5" r="0.55" fill="#fde047" />
            <circle className="sc-anvil-spark" cx="10" cy="5" r="0.45" fill="#ffffff" />
            <path d="M 13 3 V 6 M 11.5 4.5 H 14.5" stroke="#fef08a" strokeWidth="0.4" />

            {/* Blacksmith hammer poised above */}
            <line x1="16.5" y1="5.2" x2="22" y2="1.8" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
            <polygon points="15,4 17.5,2.5 18.2,3.8 15.7,5.3" fill="#cbd5e1" stroke="#334155" strokeWidth="0.4" />
          </g>
        ) : (
          <g className="sc-anvil-cold-glint">
            {/* Blacksmith hammer resting across anvil */}
            <line x1="15" y1="8" x2="21.5" y2="4.5" stroke="#78350f" strokeWidth="1.1" strokeLinecap="round" />
            <polygon points="14,7 16,5.8 16.6,6.8 14.6,8" fill="#94a3b8" stroke="#334155" strokeWidth="0.4" />
            {/* Cold steel horn glint */}
            <circle cx="3.8" cy="10.5" r="0.5" fill="#ffffff" />
          </g>
        )}
      </svg>
    </span>
  );
}
