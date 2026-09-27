import React from "react";
import { Crest } from "../Crest";
import type { RealmStance } from "./RealmCard";
import "./realm-card.css";

export interface RealmCrestPipProps {
  /** The realm ID whose heraldic crest to display (e.g. "rival", "k_silk", etc.) */
  realmId: string;
  /** Stance with the player ("war" | "truce" | "friendly" | "wary" | "hostile") */
  stance?: RealmStance;
  /** Whether the crest should display a colder hostile appearance (defaults to stance === "hostile" || stance === "war") */
  isColder?: boolean;
  /** Size in pixels (default: 28) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 28px Realm Crest Pip:
 * - Uses the existing realm crest heraldic shield at 28px.
 * - When hostile/at war: the crest is COLDER (chilly cyan/ice-blue shift, desaturated frost aura, and icy crystal accents).
 * - Warm/radiant in friendly, truce, or wary stances.
 * GUARANTEE: strictly pointer-events: none so clicks on the diplomacy card are never blocked!
 */
export function RealmCrestPip({
  realmId,
  stance,
  isColder,
  size = 28,
  className = "",
  style,
}: RealmCrestPipProps) {
  const cold = isColder !== undefined ? isColder : (stance === "hostile" || stance === "war");
  const coldClass = cold ? "is-colder" : "is-warm";

  return (
    <span
      className={`sc-realm-crest-wrapper ${coldClass} ${stance ? `is-${stance}` : ""} ${className}`}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        ...style,
      }}
      aria-hidden="true"
      data-realm={realmId}
      data-stance={stance}
      data-colder={cold}
    >
      <span
        className="sc-realm-crest-art"
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Crest realmId={realmId} size={size} />
      </span>

      {/* Colder hostile frost aura & crystalline icicle glints */}
      {cold && (
        <svg
          className="sc-realm-crest-frost"
          viewBox="0 0 28 28"
          width={size}
          height={size}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {/* Frost rim contour */}
          <path
            d="M14 2 L24 6 V15 C24 22 19 26 14 27 C9 26 4 22 4 15 V6 Z"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeDasharray="2.5 2"
            opacity="0.75"
          />
          {/* Top arch ice crystal sparkle */}
          <circle cx="14" cy="3" r="1" fill="#ffffff" />
          <path d="M14 1.5 V4.5 M12.5 3 H15.5" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" />
          {/* Chilled corner glints */}
          <circle cx="5" cy="8" r="0.75" fill="#bae6fd" opacity="0.85" />
          <circle cx="23" cy="8" r="0.75" fill="#bae6fd" opacity="0.85" />
        </svg>
      )}
    </span>
  );
}
