import React from "react";

export interface HallChipProps {
  /** Building type ID (e.g. farm, cottage, lumber_camp, quarry, barracks, etc.) */
  typeId: string;
  /** Whether the building currently has assigned citizens/staff */
  staffed?: boolean;
  /** Whether the building is scarred from siege damage */
  scarred?: boolean;
  /** Optional custom class */
  className?: string;
  /** Chip size in pixels (default 24) */
  size?: number;
}

/**
 * HallChip: 24px isometric hall chip matching the building type.
 * - Unstaffed chip is dim (dark windows, cold hearth, desaturated/reduced opacity).
 * - Scarred chip is cracked (jagged red/stone fracture lines, chipped masonry).
 * - GUARANTEE: strictly `pointer-events: none` so all card clicks and buttons work unobstructed!
 */
export function HallChip({
  typeId,
  staffed = false,
  scarred = false,
  className = "",
  size = 24,
}: HallChipProps) {
  const normType = normalizeBuildingType(typeId);
  const statusCls = scarred ? "is-scarred" : staffed ? "is-staffed" : "is-unstaffed";

  return (
    <div
      className={`sc-chip-wrapper ${statusCls} ${className}`}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
      aria-hidden="true"
      data-building-type={normType}
      data-staffed={staffed}
      data-scarred={scarred}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-chip sc-chip-${normType} ${statusCls}`}
        style={{ pointerEvents: "none" }}
      >
        {renderBuildingSvg(normType, staffed, scarred)}
        {scarred && <CrackedOverlay />}
      </svg>
    </div>
  );
}

function normalizeBuildingType(raw: string): string {
  if (raw === "camp") return "lumber_camp";
  return raw;
}

function CrackedOverlay() {
  return (
    <g className="sc-chip-cracks" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M10 2 L12 6 L9 10 L13 14 L11 20"
        stroke="#f87171"
        strokeWidth="1.2"
        fill="none"
        className="sc-chip-crack-main"
      />
      <path
        d="M12 6 L16 8 L14 12"
        stroke="#fca5a5"
        strokeWidth="0.8"
        fill="none"
        className="sc-chip-crack-branch"
      />
      <circle cx="12" cy="6" r="0.6" fill="#ef4444" />
      <circle cx="13" cy="14" r="0.6" fill="#ef4444" />
    </g>
  );
}

function renderBuildingSvg(type: string, staffed: boolean, scarred: boolean) {
  switch (type) {
    case "cottage":
      return <CottageSvg staffed={staffed} />;
    case "farm":
      return <FarmSvg staffed={staffed} />;
    case "lumber_camp":
      return <LumberCampSvg staffed={staffed} />;
    case "quarry":
    case "mason":
      return <QuarrySvg staffed={staffed} />;
    case "market":
      return <MarketSvg staffed={staffed} />;
    case "barracks":
      return <BarracksSvg staffed={staffed} />;
    case "academy":
      return <AcademySvg staffed={staffed} />;
    case "chapel":
      return <ChapelSvg staffed={staffed} />;
    case "infirmary":
      return <InfirmarySvg staffed={staffed} />;
    case "watchtower":
      return <WatchtowerSvg staffed={staffed} />;
    case "granary":
      return <GranarySvg staffed={staffed} />;
    case "sawmill":
      return <SawmillSvg staffed={staffed} />;
    case "gold_mine":
    case "mint":
      return <GoldMineSvg staffed={staffed} />;
    case "stables":
      return <StablesSvg staffed={staffed} />;
    case "archery_range":
      return <ArcheryRangeSvg staffed={staffed} />;
    case "siege_workshop":
      return <SiegeWorkshopSvg staffed={staffed} />;
    case "walls":
    case "gate":
      return <WallGateSvg staffed={staffed} />;
    default:
      return <DefaultHallSvg staffed={staffed} />;
  }
}

/* 1. Cottage: Timber hall, pitched thatch roof, warm hearth window & smoke */
function CottageSvg({ staffed }: { staffed: boolean }) {
  const windowFill = staffed ? "#fef08a" : "#4b5563";
  return (
    <g>
      {/* Stone foundation */}
      <path d="M3 16 L12 20 L21 16 L12 12 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.6" />
      {/* Timber walls */}
      <path d="M3 14 L12 18 L12 21 L3 17 Z" fill="#6b4226" stroke="#38200d" strokeWidth="0.7" />
      <path d="M12 18 L21 14 L21 17 L12 21 Z" fill="#8c5a2b" stroke="#38200d" strokeWidth="0.7" />
      {/* Half-timber framing studs */}
      <path d="M7.5 16 V19.5 M16.5 16 V19.5" stroke="#38200d" strokeWidth="0.7" />
      {/* Door */}
      <path d="M6 15.5 L9 17 V20 L6 18.5 Z" fill="#2e1708" />
      {/* Pitched thatch roof */}
      <path d="M12 6 L12 13 L3 14 Z" fill="#966835" stroke="#38200d" strokeWidth="0.7" />
      <path d="M12 6 L21 14 L12 18 L12 13 Z" fill="#c49352" stroke="#38200d" strokeWidth="0.7" />
      {/* Window */}
      <rect x="15" y="15" width="2.5" height="2.5" rx="0.5" fill={windowFill} stroke="#38200d" strokeWidth="0.5" />
      {/* Chimney & smoke */}
      <path d="M15 4 V8 H17 V5 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
      {staffed && (
        <path d="M16 3 Q15 1.5 17 0.5" stroke="#e2e8f0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

/* 2. Farm: Gambrel barn roof, round stone granary silo, golden hay */
function FarmSvg({ staffed }: { staffed: boolean }) {
  const windowFill = staffed ? "#fef08a" : "#4b5563";
  return (
    <g>
      {/* Barn walls */}
      <path d="M3 14 L13 18 L13 21 L3 17 Z" fill="#881337" stroke="#4c0519" strokeWidth="0.7" />
      <path d="M13 18 L18 16 L18 19 L13 21 Z" fill="#9f1239" stroke="#4c0519" strokeWidth="0.7" />
      {/* Barn double doors with cross brace */}
      <path d="M6 15.5 L10 17 V20.5 L6 19 Z" fill="#4c0519" />
      <path d="M6 16 L10 20 M10 17 L6 19.5" stroke="#fef08a" strokeWidth="0.5" />
      {/* Gambrel barn roof */}
      <path d="M10 5 L10 12 L3 14 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.7" />
      <path d="M10 5 L18 11 L13 18 L10 12 Z" fill="#d97706" stroke="#78350f" strokeWidth="0.7" />
      {/* Round silo on right */}
      <path d="M17 11 L21 9 V17 L17 19 Z" fill="#64748b" stroke="#334155" strokeWidth="0.6" />
      <path d="M17 11 L19 5 L21 9 Z" fill="#ca8a04" stroke="#78350f" strokeWidth="0.6" />
      {/* Loft window */}
      <circle cx="10" cy="9" r="1.2" fill={windowFill} stroke="#78350f" strokeWidth="0.5" />
    </g>
  );
}

/* 3. Lumber Camp: A-frame logging shelter, stacked firewood rick, woodsman axe */
function LumberCampSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      {/* A-frame shelter on left */}
      <path d="M2 17 L7 7 L13 17 Z" fill="#3d2210" stroke="#26150a" strokeWidth="0.8" />
      <path d="M7 7 L15 11 L13 17 Z" fill="#58351d" stroke="#26150a" strokeWidth="0.8" />
      <path d="M4 17 L7 10 L10 17 Z" fill="#1c0f06" />
      {/* Stacked timber logs on right */}
      <rect x="13" y="14" width="7" height="3" rx="1.5" fill="#6b4226" stroke="#26150a" strokeWidth="0.5" />
      <ellipse cx="19.5" cy="15.5" rx="1.2" ry="1.4" fill="#d4a359" />
      <rect x="12" y="17" width="8" height="3" rx="1.5" fill="#58351d" stroke="#26150a" strokeWidth="0.5" />
      <ellipse cx="19.5" cy="18.5" rx="1.2" ry="1.4" fill="#d4a359" />
      {/* Tree stump with axe */}
      <ellipse cx="6" cy="18.5" rx="2" ry="1.2" fill="#d4a359" stroke="#3d2210" strokeWidth="0.5" />
      <path d="M5 18 L7 14" stroke="#854d0e" strokeWidth="0.8" />
      <path d="M6.5 14 L8 14.5 L7 16 Z" fill="#94a3b8" />
      {staffed && <circle cx="8" cy="13" r="0.6" fill="#fef08a" />}
    </g>
  );
}

/* 4. Quarry & Mason: Excavated stone pit, terraced granite, hoisting derrick, ashlar blocks & pickaxe */
function QuarrySvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      {/* Dark excavated pit floor */}
      <path d="M2 16 L12 21 L22 16 L12 12 Z" fill="#18181b" stroke="#09090b" strokeWidth="0.6" />
      {/* Stepped terraced granite rockfaces */}
      <path d="M3 14 L9 17 L9 20 L3 17 Z" fill="#52525b" stroke="#27272a" strokeWidth="0.6" />
      <path d="M9 17 L15 14 L15 18 L9 20 Z" fill="#71717a" stroke="#27272a" strokeWidth="0.6" />
      <path d="M3 14 L9 11 L15 14 L9 17 Z" fill="#94a3b8" stroke="#27272a" strokeWidth="0.5" />
      {/* Cut ashlar block stack on quarry floor */}
      <rect x="4" y="16.5" width="3.2" height="2.2" fill="#cbd5e1" stroke="#334155" strokeWidth="0.5" />
      <rect x="5.5" y="14.8" width="3" height="2" fill="#e2e8f0" stroke="#334155" strokeWidth="0.5" />
      {/* Chiseled block seams */}
      <line x1="4" y1="17.6" x2="7.2" y2="17.6" stroke="#475569" strokeWidth="0.4" />
      {/* Timber A-frame hoisting derrick crane */}
      <line x1="11" y1="17" x2="19" y2="4" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="14" y1="15" x2="18.5" y2="4.5" stroke="#92400e" strokeWidth="0.9" />
      {/* Brass pulley wheel & hoist line */}
      <circle cx="19" cy="4" r="1.3" fill="#f59e0b" stroke="#78350f" strokeWidth="0.5" />
      <line x1="19" y1="5.3" x2="19" y2="9.5" stroke="#cbd5e1" strokeWidth="0.7" />
      {/* Suspended cut ashlar stone block dangling in air */}
      <rect x="17.5" y="9.5" width="3" height="3" fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
      {/* Steel mason pickaxe resting on stone shelf */}
      <line x1="7" y1="13" x2="10.5" y2="10" stroke="#451a03" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M6 12 L7.5 13.5 L8.5 12.5 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.4" />
      {staffed && (
        <>
          <circle cx="19" cy="3" r="0.8" fill="#ffffff" />
          <circle cx="16.5" cy="11" r="0.5" fill="#facc15" />
        </>
      )}
    </g>
  );
}

/* 5. Market: Merchant stall with striped awning canopy, goods crates */
function MarketSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      {/* Timber stall counter */}
      <path d="M4 15 L12 18 L20 15 L12 12 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.6" />
      <path d="M4 15 L12 18 L12 21 L4 18 Z" fill="#451a03" stroke="#260e02" strokeWidth="0.6" />
      <path d="M12 18 L20 15 L20 18 L12 21 Z" fill="#5c2406" stroke="#260e02" strokeWidth="0.6" />
      {/* Awning support posts */}
      <path d="M5 8 V15 M19 8 V15 M12 6 V12" stroke="#92400e" strokeWidth="0.8" />
      {/* Striped canopy awning */}
      <path d="M3 10 L12 6 L21 10 L12 13 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.7" />
      {/* Yellow stripes */}
      <path d="M6 9 L9 7.5 L12 11.5 L9 12.5 Z" fill="#facc15" />
      <path d="M15 7.5 L18 9 L15 12.5 L12 11.5 Z" fill="#facc15" />
      {/* Scalloped edge valance */}
      <path d="M3 10 Q4.5 12 6 10 Q7.5 12 9 10 Q10.5 12 12 10 Q13.5 12 15 10 Q16.5 12 18 10 Q19.5 12 21 10" stroke="#facc15" strokeWidth="0.7" fill="none" />
      {/* Produce baskets */}
      <circle cx="9" cy="15.5" r="1.3" fill="#4ade80" />
      <circle cx="14" cy="15.5" r="1.3" fill="#f97316" />
    </g>
  );
}

/* 6. Barracks: Fortified ashlar training hall, crenellated parapet, crest */
function BarracksSvg({ staffed }: { staffed: boolean }) {
  const windowFill = staffed ? "#fef08a" : "#334155";
  return (
    <g>
      {/* Heavy stone walls */}
      <path d="M3 13 L12 17 L12 21 L3 17 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M12 17 L21 13 L21 17 L12 21 Z" fill="#64748b" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M3 13 L12 9 L21 13 L12 17 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.6" />
      {/* Crenellations along parapet */}
      <path d="M3 11 H5 V13 H7 V11 H9 V13 H11 V11 L12 11.5 L13 11 H15 V13 H17 V11 H19 V13 H21 V11" stroke="#334155" strokeWidth="0.8" fill="none" />
      {/* Arched portcullis gateway */}
      <path d="M10 16 L12 17 L14 16 V19 L12 20 L10 19 Z" fill="#0f172a" />
      {/* Heraldic badge */}
      <path d="M11 11 L13 11 L13 13 L12 14 L11 13 Z" fill="#dc2626" stroke="#fef08a" strokeWidth="0.5" />
      {/* Arrow slit windows */}
      <line x1="6" y1="14" x2="6" y2="16" stroke={windowFill} strokeWidth="0.8" />
      <line x1="17" y1="14" x2="17" y2="16" stroke={windowFill} strokeWidth="0.8" />
    </g>
  );
}

/* 7. Academy: Classical portico, columns, scholar cupola, astrolabe finial */
function AcademySvg({ staffed }: { staffed: boolean }) {
  const windowFill = staffed ? "#fef08a" : "#4b5563";
  return (
    <g>
      {/* Marble stairs & base */}
      <path d="M3 16 L12 20 L21 16 L12 12 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="0.6" />
      {/* Scriptorium walls */}
      <path d="M4 14 L12 18 L12 21 L4 17 Z" fill="#581c87" stroke="#2e1065" strokeWidth="0.7" />
      <path d="M12 18 L20 14 L20 17 L12 21 Z" fill="#6b21a8" stroke="#2e1065" strokeWidth="0.7" />
      {/* Columns */}
      <path d="M6 14 V18 M9 15 V19 M15 15 V19 M18 14 V18" stroke="#e2e8f0" strokeWidth="0.8" />
      {/* Classical pediment */}
      <path d="M3 13 L12 8 L21 13 Z" fill="#9333ea" stroke="#2e1065" strokeWidth="0.7" />
      {/* Scholar cupola / observatory dome */}
      <path d="M10 8 L12 3 L14 8 Z" fill="#7c3aed" stroke="#2e1065" strokeWidth="0.6" />
      <ellipse cx="12" cy="8" rx="2" ry="1" fill="#a855f7" />
      {/* Astrolabe golden finial */}
      <circle cx="12" cy="2" r="1" fill="#facc15" stroke="#78350f" strokeWidth="0.5" />
      {/* Candlelight lancets */}
      <rect x="11.2" y="14.5" width="1.6" height="3" rx="0.8" fill={windowFill} />
    </g>
  );
}

/* 8. Chapel: Soaring sanctuary bell spire, pinnacle cross, stained glass lancet */
function ChapelSvg({ staffed }: { staffed: boolean }) {
  const glassFill = staffed ? "#38bdf8" : "#334155";
  return (
    <g>
      {/* Stone walls */}
      <path d="M5 14 L12 18 L12 21 L5 17 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M12 18 L19 14 L19 17 L12 21 Z" fill="#64748b" stroke="#1e293b" strokeWidth="0.7" />
      {/* Steep roof slopes */}
      <path d="M12 7 L12 13 L5 14 Z" fill="#6d28d9" stroke="#3b0764" strokeWidth="0.7" />
      <path d="M12 7 L19 14 L12 18 L12 13 Z" fill="#8b5cf6" stroke="#3b0764" strokeWidth="0.7" />
      {/* Bell spire */}
      <path d="M10 8 L12 2 L14 8 Z" fill="#a78bfa" stroke="#3b0764" strokeWidth="0.7" />
      {/* Golden pinnacle cross */}
      <path d="M12 1 V4 M10.5 2.2 H13.5" stroke="#facc15" strokeWidth="0.8" strokeLinecap="round" />
      {/* Stained glass lancet window */}
      <path d="M11 14.5 C11 13, 13 13, 13 14.5 V18 H11 Z" fill={glassFill} stroke="#1e293b" strokeWidth="0.6" />
    </g>
  );
}

/* 9. Infirmary: Healer's hospice, slate roof, bold red cross medallion */
function InfirmarySvg({ staffed }: { staffed: boolean }) {
  const windowFill = staffed ? "#fef08a" : "#4b5563";
  return (
    <g>
      {/* White stone walls */}
      <path d="M3 14 L12 18 L12 21 L3 17 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.7" />
      <path d="M12 18 L21 14 L21 17 L12 21 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.7" />
      {/* Slate gabled roof */}
      <path d="M12 6 L12 13 L3 14 Z" fill="#334155" stroke="#0f172a" strokeWidth="0.7" />
      <path d="M12 6 L21 14 L12 18 L12 13 Z" fill="#475569" stroke="#0f172a" strokeWidth="0.7" />
      {/* Red cross healer emblem */}
      <path d="M12 9.5 V14.5 M9.5 12 H14.5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="square" />
      {/* Window */}
      <rect x="15" y="15" width="2.5" height="2.5" rx="0.5" fill={windowFill} stroke="#334155" strokeWidth="0.5" />
    </g>
  );
}

/* 10. Watchtower: Tall stone tower shaft, arrow loops, crenellated parapet & active beacon fire */
function WatchtowerSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      {/* Talus base plinth */}
      <path d="M7 19 L12 22 L17 19 L12 16 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      {/* Tall stone tower shaft */}
      <path d="M8 8 L12 10.5 L12 21 L8 19 Z" fill="#64748b" stroke="#334155" strokeWidth="0.7" />
      <path d="M12 10.5 L16 8 L16 19 L12 21 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.7" />
      <line x1="12" y1="10.5" x2="12" y2="21" stroke="#334155" strokeWidth="0.7" />
      {/* Arrow loop slits */}
      <line x1="10" y1="12" x2="10" y2="15" stroke="#0f172a" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="14" y1="12" x2="14" y2="15" stroke="#0f172a" strokeWidth="0.9" strokeLinecap="round" />
      {/* Projecting machicolated parapet gallery */}
      <path d="M6.5 7.5 L12 9.5 L17.5 7.5 L12 5.5 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.6" />
      {/* Crenellated battlements */}
      <path d="M6.5 5.5 V7.5 H8 V5.5 H9.5 V7.5 H14.5 V5.5 H16 V7.5 H17.5 V5.5" stroke="#1e293b" strokeWidth="0.7" fill="none" />
      {/* Iron brazier basket */}
      <path d="M10 4.5 H14 L13 6.5 H11 Z" fill="#18181b" stroke="#09090b" strokeWidth="0.5" />
      {/* Always-active sentry beacon fire (embers/flame; brilliant glow when staffed) */}
      <circle cx="12" cy="3.8" r={staffed ? 2.2 : 1.4} fill="#ea580c" />
      <circle cx="12" cy="3.2" r={staffed ? 1.3 : 0.8} fill="#f97316" />
      {staffed && (
        <>
          <circle cx="12" cy="2.5" r="0.7" fill="#fef08a" />
          <circle cx="12.6" cy="1.2" r="0.4" fill="#ffffff" />
        </>
      )}
    </g>
  );
}

/* 11. Granary: Round stone silo with conical thatched cap */
function GranarySvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      <path d="M6 12 L12 16 L18 12 L12 8 Z" fill="#a8a29e" stroke="#57534e" strokeWidth="0.6" />
      <path d="M6 12 L12 16 L12 21 L6 17 Z" fill="#78716c" stroke="#57534e" strokeWidth="0.7" />
      <path d="M12 16 L18 12 L18 17 L12 21 Z" fill="#a8a29e" stroke="#57534e" strokeWidth="0.7" />
      {/* Conical roof */}
      <path d="M6 12 L12 4 L18 12 Z" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
      <circle cx="12" cy="4" r="0.9" fill="#fef08a" />
      {staffed && <circle cx="12" cy="14" r="0.8" fill="#fef08a" />}
    </g>
  );
}

/* 12. Sawmill: Timber mill with waterwheel blades */
function SawmillSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      <path d="M6 14 L14 18 L14 21 L6 17 Z" fill="#5c4033" stroke="#26150a" strokeWidth="0.7" />
      <path d="M14 18 L20 15 L20 18 L14 21 Z" fill="#78533e" stroke="#26150a" strokeWidth="0.7" />
      <path d="M14 6 L6 14 L14 18 L20 15 Z" fill="#8b5a2b" stroke="#26150a" strokeWidth="0.7" />
      {/* Waterwheel on left */}
      <circle cx="5" cy="17" r="3" fill="none" stroke="#38bdf8" strokeWidth="0.9" />
      <path d="M5 14 V20 M2 17 H8" stroke="#38bdf8" strokeWidth="0.8" />
      {staffed && <circle cx="12" cy="14" r="0.8" fill="#fef08a" />}
    </g>
  );
}

/* 13. Gold Mine & Mint: Adit mouth with gold nuggets */
function GoldMineSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      {/* Mountain slope */}
      <path d="M2 20 L10 6 L22 20 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
      {/* Mine timber adit frame */}
      <path d="M7 16 L12 13 L17 16 V21 L12 18 L7 21 Z" fill="#0f172a" stroke="#78350f" strokeWidth="1" />
      {/* Gold cart & nuggets */}
      <rect x="10" y="17" width="4" height="2.5" fill="#b45309" stroke="#78350f" strokeWidth="0.5" />
      <circle cx="11" cy="16.5" r="0.8" fill="#fbbf24" />
      <circle cx="13" cy="16.5" r="0.8" fill="#facc15" />
      {staffed && <circle cx="12" cy="15" r="1.2" fill="#fef08a" />}
    </g>
  );
}

/* 14. Stables: Horse barn with stall bays and hayloft */
function StablesSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      <path d="M3 14 L12 18 L12 21 L3 17 Z" fill="#854d0e" stroke="#451a03" strokeWidth="0.7" />
      <path d="M12 18 L21 14 L21 17 L12 21 Z" fill="#a16207" stroke="#451a03" strokeWidth="0.7" />
      <path d="M12 6 L3 14 L12 18 L21 14 Z" fill="#ca8a04" stroke="#451a03" strokeWidth="0.7" />
      {/* Stall gates */}
      <path d="M6 16.5 V20 M9 18 V20.5 M15 17.5 V20" stroke="#fef08a" strokeWidth="0.7" />
      {staffed && <circle cx="12" cy="10" r="1" fill="#fef08a" />}
    </g>
  );
}

/* 15. Archery Range: Shooting shed with round target butt */
function ArcheryRangeSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      <path d="M2 13 L10 16 L10 20 L2 17 Z" fill="#14532d" stroke="#052e16" strokeWidth="0.7" />
      <path d="M10 7 L2 13 L10 16 L18 10 Z" fill="#166534" stroke="#052e16" strokeWidth="0.7" />
      {/* Target butt */}
      <circle cx="17" cy="15" r="3.2" fill="#fef08a" stroke="#78350f" strokeWidth="0.6" />
      <circle cx="17" cy="15" r="2.1" fill="#dc2626" />
      <circle cx="17" cy="15" r="1" fill="#ffffff" />
      <circle cx="17" cy="15" r="0.4" fill="#dc2626" />
    </g>
  );
}

/* 16. Siege Workshop: Timber crane, gears and catapult arm */
function SiegeWorkshopSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      <path d="M3 14 L12 18 L12 21 L3 17 Z" fill="#5c4033" stroke="#26150a" strokeWidth="0.7" />
      <path d="M12 18 L21 14 L21 17 L12 21 Z" fill="#78533e" stroke="#26150a" strokeWidth="0.7" />
      <path d="M12 6 L3 14 L12 18 L21 14 Z" fill="#3d2210" stroke="#1c0f06" strokeWidth="0.7" />
      {/* Throwing arm & wheel */}
      <path d="M7 17 L17 8" stroke="#ca8a04" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="15" cy="17" r="2" fill="none" stroke="#78350f" strokeWidth="0.9" />
    </g>
  );
}

/* 17. Walls & Gate: Crenellated curtain wall or portcullis barbican */
function WallGateSvg({ staffed }: { staffed: boolean }) {
  return (
    <g>
      <path d="M2 13 L12 17 L12 21 L2 17 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M12 17 L22 13 L22 17 L12 21 Z" fill="#64748b" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M2 13 L12 9 L22 13 L12 17 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.6" />
      {/* Crenellations */}
      <path d="M2 11 H4 V13 H7 V11 H10 V13 H12 V11 H14 V13 H17 V11 H20 V13 H22 V11" stroke="#334155" strokeWidth="0.8" fill="none" />
      {/* Gate arch */}
      <path d="M10 16 C10 14, 14 14, 14 16 V20 L10 19 Z" fill="#0f172a" />
    </g>
  );
}

/* 18. Default Fallback: Medieval timber hall */
function DefaultHallSvg({ staffed }: { staffed: boolean }) {
  const windowFill = staffed ? "#fef08a" : "#4b5563";
  return (
    <g>
      <path d="M3 14 L12 18 L12 21 L3 17 Z" fill="#6b4226" stroke="#38200d" strokeWidth="0.7" />
      <path d="M12 18 L21 14 L21 17 L12 21 Z" fill="#8c5a2b" stroke="#38200d" strokeWidth="0.7" />
      <path d="M12 6 L3 14 L12 18 L21 14 Z" fill="#c49352" stroke="#38200d" strokeWidth="0.7" />
      <rect x="15" y="15" width="2.5" height="2.5" rx="0.5" fill={windowFill} stroke="#38200d" strokeWidth="0.5" />
    </g>
  );
}
