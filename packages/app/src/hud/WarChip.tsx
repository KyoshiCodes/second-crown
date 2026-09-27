import React from "react";

export type WarChipKind =
  | "warband"
  | "cloak"
  | "cart"
  | "tent"
  | "hostile"
  | "scout"
  | "gather"
  | "garrison";

export interface WarChipProps {
  /** Force kind or tone: hostile/warband, scout/cloak, gather/cart, garrison/tent */
  kind: WarChipKind;
  /** Size in pixels (default 24) */
  size?: number;
  /** Optional custom CSS class */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Normalizes tone or name to the 4 canonical war chips:
 * - hostile / warband -> warband (red warband pip)
 * - scout / cloak -> cloak (reconnaissance stealth cloak)
 * - gather / cart -> cart (timber cargo cart with bulging sacks)
 * - garrison / tent -> tent (pavilion military encampment tent)
 */
export function normalizeWarChipKind(kind: WarChipKind | string): "warband" | "cloak" | "cart" | "tent" {
  switch (kind) {
    case "hostile":
    case "warband":
      return "warband";
    case "scout":
    case "cloak":
      return "cloak";
    case "gather":
    case "cart":
      return "cart";
    case "garrison":
    case "tent":
      return "tent";
    default:
      return "warband";
  }
}

/**
 * WarChip: 24px iconic military force chip for War tab cards.
 * - incoming: red warband pip (horned iron helm, blood-red tabard, spiked morningstar)
 * - scouts: the cloak (twilight-navy stealth mantle, cyan moonlit rim, brass spyglass)
 * - gathers: the cart (sturdy timber cargo wagon, bulging burlap sacks, spoke wheels)
 * - garrisons: the tent (pavilion ridgepole tent, warm hearth lantern, leaning shield & spear)
 * GUARANTEE: strictly `pointer-events: none` so cards and Recall/Sally buttons receive clicks cleanly!
 */
export function WarChip({
  kind,
  size = 24,
  className = "",
  style,
}: WarChipProps) {
  const normKind = normalizeWarChipKind(kind);

  return (
    <div
      className={`sc-war-chip-wrapper sc-war-chip-${normKind} ${className}`}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-kind={normKind}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-war-chip sc-war-chip-${normKind}`}
        style={{ pointerEvents: "none" }}
      >
        {normKind === "warband" && <WarbandSvg />}
        {normKind === "cloak" && <CloakSvg />}
        {normKind === "cart" && <CartSvg />}
        {normKind === "tent" && <TentSvg />}
      </svg>
    </div>
  );
}

/* =========================================================================
   1. Red Warband Pip (Incoming / Hostile)
   ========================================================================= */

function WarbandSvg() {
  return (
    <g>
      {/* Ground contact shadow */}
      <ellipse cx="12" cy="22" rx="5.5" ry="1.5" fill="#000000" opacity="0.38" />

      {/* Iron greaves / boots */}
      <rect x="9.5" y="16.5" width="2.2" height="4.8" rx="0.5" fill="#0f172a" />
      <rect x="12.5" y="16.5" width="2.2" height="4.8" rx="0.5" fill="#1e293b" />

      {/* Blood-Red Warband Tabard & Surcoat */}
      <path d="M8 11 L16 11 L17 17 L7 17 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.6" />

      {/* Crossed Iron Straps */}
      <line x1="8.5" y1="11.5" x2="15.5" y2="16.5" stroke="#334155" strokeWidth="1" />
      <line x1="15.5" y1="11.5" x2="8.5" y2="16.5" stroke="#334155" strokeWidth="1" />
      <circle cx="12" cy="14" r="1" fill="#64748b" stroke="#1e293b" strokeWidth="0.4" />

      {/* Spiked iron shoulder pauldrons */}
      <polygon points="7,11 4.5,13 7.5,14" fill="#334155" stroke="#0f172a" strokeWidth="0.5" />
      <polygon points="17,11 19.5,13 16.5,14" fill="#475569" stroke="#0f172a" strokeWidth="0.5" />

      {/* Horned Iron War Helm */}
      <rect x="9" y="5.5" width="6" height="5.5" rx="1.8" fill="#334155" stroke="#0f172a" strokeWidth="0.7" />

      {/* Menacing Curved Blood-Red Horns */}
      <path d="M9 7 C6 6, 5 2.8, 7 2 C7.5 4, 9.5 5.5, 9.5 7 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
      <path d="M15 7 C18 6, 19 2.8, 17 2 C16.5 4, 14.5 5.5, 14.5 7 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />

      {/* Glowing red visor slit */}
      <rect x="10" y="8" width="4" height="1.2" rx="0.3" fill="#fca5a5" stroke="#dc2626" strokeWidth="0.4" />

      {/* Spiked Morningstar Mace */}
      <line x1="16" y1="17" x2="20" y2="8" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="20" cy="8" r="2.8" fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      <polygon points="20,4.5 19,6 21,6" fill="#64748b" />
      <polygon points="23.5,8 22,7 22,9" fill="#64748b" />
      <polygon points="20,11.5 19,10 21,10" fill="#64748b" />
      <polygon points="16.5,8 18,7 18,9" fill="#64748b" />
    </g>
  );
}

/* =========================================================================
   2. The Cloak (Scouts / Reconnaissance)
   ========================================================================= */

function CloakSvg() {
  return (
    <g>
      {/* Ground contact shadow */}
      <ellipse cx="12" cy="22" rx="5" ry="1.4" fill="#000000" opacity="0.32" />

      {/* Ranger stealth boots */}
      <rect x="9.5" y="18" width="2" height="3.5" rx="0.5" fill="#1e293b" />
      <rect x="12.5" y="18" width="2" height="3.5" rx="0.5" fill="#0f172a" />

      {/* Billowing Twilight-Navy Ranger Stealth Cloak */}
      <path
        d="M12 5 C8 7, 5 12, 5 19 C7 20, 10 19.5, 12 20 C14 19.5, 17 20, 19 19 C19 12, 16 7, 12 5 Z"
        fill="#0f172a"
        stroke="#020617"
        strokeWidth="0.7"
      />

      {/* Moonlit cyan outer rim highlight */}
      <path d="M5 19 C5 12, 8 7, 12 5" stroke="#38bdf8" strokeWidth="0.8" fill="none" opacity="0.85" />

      {/* Deep drapery shadow folds */}
      <path d="M10 10 C9 14, 9 17, 8 19" stroke="#020617" strokeWidth="0.8" fill="none" />
      <path d="M14 10 C15 14, 15 17, 16 19" stroke="#020617" strokeWidth="0.8" fill="none" />

      {/* Ranger Hood & Masked Face */}
      <path d="M9 8 C9 4.5, 15 4.5, 15 8 C15 11, 9 11, 9 8 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      <circle cx="11.2" cy="8.2" r="0.6" fill="#38bdf8" />
      <circle cx="12.8" cy="8.2" r="0.6" fill="#38bdf8" />

      {/* Golden Cloak Brooch / Clasp at Collar */}
      <circle cx="12" cy="10.5" r="1.1" fill="#facc15" stroke="#ca8a04" strokeWidth="0.4" />

      {/* Brass Spyglass / Telescope Scanning */}
      <polygon points="13,11 21,7 21.8,9 13.8,13" fill="#d97706" stroke="#78350f" strokeWidth="0.5" />
      <line x1="16" y1="9.5" x2="16.8" y2="11.5" stroke="#facc15" strokeWidth="0.8" />
      <line x1="19" y1="8" x2="19.8" y2="10" stroke="#fef08a" strokeWidth="0.8" />
      <ellipse cx="21.4" cy="8" rx="0.5" ry="1" fill="#38bdf8" />
    </g>
  );
}

/* =========================================================================
   3. The Cart (Gathers / Supply Wagon)
   ========================================================================= */

function CartSvg() {
  return (
    <g>
      {/* Ground contact shadow */}
      <ellipse cx="12" cy="22" rx="8" ry="1.6" fill="#000000" opacity="0.32" />

      {/* Timber Cargo Wagon Bed */}
      <rect x="4" y="13" width="14" height="4.5" rx="0.5" fill="#78350f" stroke="#451a03" strokeWidth="0.7" />
      <line x1="4" y1="15.2" x2="18" y2="15.2" stroke="#b45309" strokeWidth="0.6" />
      <rect x="3.5" y="11" width="1.5" height="5" fill="#451a03" />
      <rect x="17" y="11" width="1.5" height="5" fill="#451a03" />

      {/* High Bulging Cargo Burlap Sacks */}
      <ellipse cx="7.5" cy="11.5" rx="3.5" ry="3" fill="#d97706" stroke="#92400e" strokeWidth="0.5" />
      <rect x="6.8" y="8" width="1.4" height="1.2" fill="#b45309" />

      <ellipse cx="14" cy="11" rx="3.5" ry="3" fill="#f59e0b" stroke="#b45309" strokeWidth="0.5" />
      <rect x="13.3" y="7.5" width="1.4" height="1.2" fill="#92400e" />

      <ellipse cx="10.5" cy="8.5" rx="3" ry="2.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
      <rect x="9.8" y="5.5" width="1.4" height="1.2" fill="#b45309" />

      {/* Cargo grain glints */}
      <circle cx="10.5" cy="8.5" r="0.6" fill="#fef08a" />
      <circle cx="13.5" cy="11" r="0.6" fill="#ffffff" />

      {/* Spoke Wheel Left */}
      <circle cx="7" cy="18.5" r="3.2" fill="#451a03" stroke="#64748b" strokeWidth="0.8" />
      <circle cx="7" cy="18.5" r="1.5" fill="#78350f" />
      <circle cx="7" cy="18.5" r="0.6" fill="#cbd5e1" />
      <line x1="7" y1="15.3" x2="7" y2="21.7" stroke="#b45309" strokeWidth="0.5" />
      <line x1="3.8" y1="18.5" x2="10.2" y2="18.5" stroke="#b45309" strokeWidth="0.5" />

      {/* Spoke Wheel Right */}
      <circle cx="15" cy="18.5" r="3.2" fill="#451a03" stroke="#64748b" strokeWidth="0.8" />
      <circle cx="15" cy="18.5" r="1.5" fill="#78350f" />
      <circle cx="15" cy="18.5" r="0.6" fill="#cbd5e1" />
      <line x1="15" y1="15.3" x2="15" y2="21.7" stroke="#b45309" strokeWidth="0.5" />
      <line x1="11.8" y1="18.5" x2="18.2" y2="18.5" stroke="#b45309" strokeWidth="0.5" />

      {/* Hitch shaft pole */}
      <line x1="18" y1="16" x2="22.5" y2="14" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/* =========================================================================
   4. The Tent (Garrisons / Encampment Pavilion)
   ========================================================================= */

function TentSvg() {
  return (
    <g>
      {/* Ground contact shadow */}
      <ellipse cx="12" cy="22" rx="7.5" ry="1.5" fill="#000000" opacity="0.32" />

      {/* Triangular Pavilion Canvas Tent */}
      <polygon points="12,5 3,19 21,19" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.7" />
      <polygon points="12,5 3,19 12,19" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.6" />
      <polygon points="12,5 12,19 21,19" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" />

      {/* Ridgepole top finial */}
      <circle cx="12" cy="4.8" r="1" fill="#ca8a04" />

      {/* Open arched tent entrance flap revealing warm amber lantern */}
      <path d="M10 19 C10 14, 14 14, 14 19 Z" fill="#1e293b" />
      <ellipse cx="12" cy="17" rx="1.5" ry="2" fill="#f59e0b" />
      <circle cx="12" cy="16.5" r="0.9" fill="#fef08a" />

      {/* Leaning Heraldic Heater Shield beside entrance */}
      <path
        d="M4 14 L7.5 14 L7.5 18 C7.5 20, 5.8 21.2, 4 21.2 C2.2 21.2, 0.5 20, 0.5 18 L0.5 14 Z"
        transform="translate(1, 0)"
        fill="#2563eb"
        stroke="#1d4ed8"
        strokeWidth="0.6"
      />
      <line x1="5" y1="14" x2="5" y2="20" stroke="#facc15" strokeWidth="0.7" />

      {/* Garrison spear upright beside pavilion */}
      <line x1="18.5" y1="21" x2="19.5" y2="4" stroke="#78350f" strokeWidth="1.1" strokeLinecap="round" />
      <polygon points="19.5,2 18,5 21,5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
    </g>
  );
}
