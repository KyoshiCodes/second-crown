import React from "react";

export type FactionKind = "order" | "pact" | "guild";

/**
 * Resolves the faction kind ("order", "pact", or "guild") from kind string or faction instance.
 */
export function resolveFactionKind(
  kind?: string,
  faction?: { id?: string; name?: string; kind?: string }
): FactionKind {
  const k = (kind ?? faction?.kind ?? "").toLowerCase();
  const id = (faction?.id ?? "").toLowerCase();
  const name = (faction?.name ?? "").toLowerCase();

  if (k === "guild" || id.startsWith("guild") || /\bguild\b/i.test(name)) {
    return "guild";
  }
  if (k === "pact" || id.includes("salt") || /\bpact\b/i.test(name)) {
    return "pact";
  }
  return "order";
}

export interface FactionSealPipProps {
  /** Faction kind: "order", "pact", or "guild" */
  kind?: string;
  /** Full faction object (auto-resolves kind if not specified) */
  faction?: { id?: string; name?: string; kind?: string };
  /** Whether player is a member of this faction (adds glowing member insignia) */
  isMember?: boolean;
  /** Size in pixels (default: 24) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 24px Faction Seal Pip:
 * - Order: Golden Amber Chivalric Order signet seal with knightly cruciform blade and radiant sunburst.
 * - Pact: Carmine & Silver Salt Covenant seal with crossed treaty stilettos and faceted salt diamond.
 * - Guild: Imperial Emerald & Bronze Artisan Guild seal with master hammer, drafting compass, and gold boss.
 * GUARANTEE: strictly pointer-events: none so all card buttons and clicks work unobstructed!
 */
export function FactionSealPip({
  kind,
  faction,
  isMember = false,
  size = 24,
  className = "",
  style,
  title,
}: FactionSealPipProps) {
  const resolvedKind = resolveFactionKind(kind, faction);
  const memberClass = isMember ? "is-member" : "";

  const kindClass =
    resolvedKind === "order"
      ? "sc-faction-seal-order"
      : resolvedKind === "pact"
        ? "sc-faction-seal-pact"
        : "sc-faction-seal-guild";

  return (
    <span
      className={`sc-faction-seal-wrapper is-${resolvedKind} ${memberClass} ${className}`}
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
      title={title ?? `${resolvedKind.toUpperCase()} Seal`}
      data-faction-seal
      data-kind={resolvedKind}
      data-member={isMember}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-faction-seal ${kindClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {resolvedKind === "order" ? (
          /* ----------------- ORDER: AMBER CHIVALRIC SUN COMPACT ----------------- */
          <g className="sc-seal-order">
            {/* 1. Hanging amber silk ribbons */}
            <polygon
              points="8.5,15 6,22.5 9,20.5 11,22.5 10.5,15"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="0.5"
            />
            <polygon
              points="13.5,15 13,22.5 15,20.5 18,22.5 15.5,15"
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="0.5"
            />
            {/* 2. Poured amber wax puddle */}
            <path
              d="M12 2 C14 2 15.5 2.6 17 3.5 C18.5 4.3 19.6 5.5 20.4 7 C21.2 8.5 21.5 10.2 21.3 11.8 C21 13.5 20 15 18.8 16.2 C17.4 17.5 15.7 18.3 14 18.6 C12.7 18.8 11.3 18.8 10 18.6 C8.3 18.3 6.6 17.5 5.2 16.2 C4 15 3 13.5 2.7 11.8 C2.5 10.2 2.8 8.5 3.6 7 C4.4 5.5 5.5 4.3 7 3.5 C8.5 2.6 10 2 12 2 Z"
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="0.8"
            />
            {/* 3. Outer golden bezel ring */}
            <circle cx="12" cy="10.5" r="7.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
            {/* 4. Pressed honey matrix bed */}
            <circle cx="12" cy="10.5" r="6.2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            {/* 5. Beaded sunburst rim */}
            <circle
              cx="12"
              cy="10.5"
              r="5.3"
              fill="none"
              stroke="#fef08a"
              strokeWidth="0.6"
              strokeDasharray="1.2 1.2"
            />
            {/* 6. Chivalric Knightly Sword Cross Sigil */}
            {/* Vertical blade */}
            <path
              d="M12 5.5 L12.8 14.2 L12 15.5 L11.2 14.2 Z"
              fill="#ffffff"
              stroke="#78350f"
              strokeWidth="0.4"
            />
            <line x1="12" y1="6" x2="12" y2="14.8" stroke="#d97706" strokeWidth="0.4" />
            {/* Crossguard */}
            <path
              d="M9.2 8.5 H14.8"
              stroke="#ffffff"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M9.2 8.5 H14.8"
              stroke="#78350f"
              strokeWidth="0.4"
              strokeLinecap="round"
            />
            {/* Pommel */}
            <circle cx="12" cy="5.4" r="0.75" fill="#ffffff" stroke="#78350f" strokeWidth="0.3" />
            {/* Solar side diamond studs */}
            <polygon points="7.2,10.5 7.9,9.8 8.6,10.5 7.9,11.2" fill="#ffffff" />
            <polygon points="16.8,10.5 16.1,9.8 15.4,10.5 16.1,11.2" fill="#ffffff" />
            {/* 7. Star sparkle glint */}
            <circle cx="16.5" cy="5.5" r="0.9" fill="#ffffff" />
            <path d="M16.5 3.8 V7.2 M14.8 5.5 H18.2" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        ) : resolvedKind === "pact" ? (
          /* ----------------- PACT: CARMINE & SILVER SALT COVENANT ----------------- */
          <g className="sc-seal-pact">
            {/* 1. Hanging crimson & black ribbons */}
            <polygon
              points="8.5,15 6,22.5 9,20.5 11,22.5 10.5,15"
              fill="#7f1d1d"
              stroke="#450a0a"
              strokeWidth="0.5"
            />
            <polygon
              points="13.5,15 13,22.5 15,20.5 18,22.5 15.5,15"
              fill="#991b1b"
              stroke="#450a0a"
              strokeWidth="0.5"
            />
            {/* 2. Poured crimson blood-wax puddle */}
            <path
              d="M12 2 C14 2 15.5 2.6 17 3.5 C18.5 4.3 19.6 5.5 20.4 7 C21.2 8.5 21.5 10.2 21.3 11.8 C21 13.5 20 15 18.8 16.2 C17.4 17.5 15.7 18.3 14 18.6 C12.7 18.8 11.3 18.8 10 18.6 C8.3 18.3 6.6 17.5 5.2 16.2 C4 15 3 13.5 2.7 11.8 C2.5 10.2 2.8 8.5 3.6 7 C4.4 5.5 5.5 4.3 7 3.5 C8.5 2.6 10 2 12 2 Z"
              fill="#991b1b"
              stroke="#5c0a0a"
              strokeWidth="0.8"
            />
            {/* 3. Outer scarlet bezel ring */}
            <circle cx="12" cy="10.5" r="7.5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.8" />
            {/* 4. Pressed shadow crimson matrix bed */}
            <circle cx="12" cy="10.5" r="6.2" fill="#7f1d1d" stroke="#5c0a0a" strokeWidth="0.5" />
            {/* 5. Beaded corded perimeter */}
            <circle
              cx="12"
              cy="10.5"
              r="5.3"
              fill="none"
              stroke="#fca5a5"
              strokeWidth="0.6"
              strokeDasharray="1.2 1.2"
            />
            {/* 6. Crossed Treaty Stilettos & Salt Diamond Sigil */}
            {/* Stiletto 1 (down-right) */}
            <line x1="8.5" y1="7" x2="15.5" y2="14" stroke="#ffffff" strokeWidth="0.85" strokeLinecap="round" />
            <line x1="8" y1="7.8" x2="9.8" y2="6.2" stroke="#fca5a5" strokeWidth="0.75" />
            <circle cx="8.2" cy="6.8" r="0.6" fill="#f8fafc" />
            {/* Stiletto 2 (down-left) */}
            <line x1="15.5" y1="7" x2="8.5" y2="14" stroke="#ffffff" strokeWidth="0.85" strokeLinecap="round" />
            <line x1="16" y1="7.8" x2="14.2" y2="6.2" stroke="#fca5a5" strokeWidth="0.75" />
            <circle cx="15.8" cy="6.8" r="0.6" fill="#f8fafc" />
            {/* Central faceted Salt Covenant Diamond */}
            <polygon
              points="12,8.6 13.8,10.5 12,12.4 10.2,10.5"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="0.4"
            />
            <polygon
              points="12,9.3 13.1,10.5 12,11.7 10.9,10.5"
              fill="#ffffff"
            />
            {/* 7. Salt crystal gleam */}
            <circle cx="16.5" cy="5.5" r="0.9" fill="#ffffff" />
            <path d="M16.5 3.8 V7.2 M14.8 5.5 H18.2" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        ) : (
          /* ----------------- GUILD: EMERALD & BRONZE ARTISAN GUILD ----------------- */
          <g className="sc-seal-guild">
            {/* 1. Hanging verdigris bronze ribbons */}
            <polygon
              points="8.5,15 6,22.5 9,20.5 11,22.5 10.5,15"
              fill="#065f46"
              stroke="#064e3b"
              strokeWidth="0.5"
            />
            <polygon
              points="13.5,15 13,22.5 15,20.5 18,22.5 15.5,15"
              fill="#047857"
              stroke="#064e3b"
              strokeWidth="0.5"
            />
            {/* 2. Poured verdigris emerald wax puddle */}
            <path
              d="M12 2 C14 2 15.5 2.6 17 3.5 C18.5 4.3 19.6 5.5 20.4 7 C21.2 8.5 21.5 10.2 21.3 11.8 C21 13.5 20 15 18.8 16.2 C17.4 17.5 15.7 18.3 14 18.6 C12.7 18.8 11.3 18.8 10 18.6 C8.3 18.3 6.6 17.5 5.2 16.2 C4 15 3 13.5 2.7 11.8 C2.5 10.2 2.8 8.5 3.6 7 C4.4 5.5 5.5 4.3 7 3.5 C8.5 2.6 10 2 12 2 Z"
              fill="#047857"
              stroke="#064e3b"
              strokeWidth="0.8"
            />
            {/* 3. Outer bronze-green bezel ring */}
            <circle cx="12" cy="10.5" r="7.5" fill="#059669" stroke="#065f46" strokeWidth="0.8" />
            {/* 4. Pressed dark emerald matrix bed */}
            <circle cx="12" cy="10.5" r="6.2" fill="#065f46" stroke="#047857" strokeWidth="0.5" />
            {/* 5. Cogwheel milled border */}
            <circle
              cx="12"
              cy="10.5"
              r="5.3"
              fill="none"
              stroke="#6ee7b7"
              strokeWidth="0.6"
              strokeDasharray="1.2 1.2"
            />
            {/* 6. Master Craftsman Hammer & Drafting Calipers Sigil */}
            {/* Drafting Calipers (compass legs) */}
            <path
              d="M9.5 14.5 L12 6.5 L14.5 14.5"
              fill="none"
              stroke="#a7f3d0"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="6.5" r="0.75" fill="#facc15" stroke="#b45309" strokeWidth="0.3" />
            {/* Blacksmith / Mason Hammer */}
            <line x1="8.2" y1="14.2" x2="14.5" y2="7.8" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" />
            {/* Hammer Head */}
            <polygon
              points="13.6,6.8 15.6,8.8 16.2,8.2 14.2,6.2"
              fill="#facc15"
              stroke="#b45309"
              strokeWidth="0.4"
            />
            {/* Central bullion boss / golden coin */}
            <circle cx="12" cy="10.5" r="1.3" fill="#facc15" stroke="#b45309" strokeWidth="0.4" />
            <circle cx="12" cy="10.5" r="0.5" fill="#ffffff" />
            {/* 7. Guild brass catchlight */}
            <circle cx="16.5" cy="5.5" r="0.9" fill="#ffffff" />
            <path d="M16.5 3.8 V7.2 M14.8 5.5 H18.2" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        )}

        {/* 8. Sworn Member Insignia Laurel Stud (when player is a sworn member) */}
        {isMember && (
          <g className="sc-seal-member-ring">
            <circle
              cx="12"
              cy="10.5"
              r="8.3"
              fill="none"
              stroke="#4ade80"
              strokeWidth="0.65"
              strokeDasharray="2 1.2"
            />
            {/* Emerald jewel stud on crown apex */}
            <circle cx="12" cy="2.2" r="1.1" fill="#4ade80" stroke="#14532d" strokeWidth="0.3" />
            <circle cx="12" cy="2.2" r="0.45" fill="#ffffff" />
          </g>
        )}
      </svg>
    </span>
  );
}
