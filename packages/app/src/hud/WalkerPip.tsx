import React from "react";

export type WalkerTool = "hoe" | "axe" | "pick" | "coin";

/**
 * Maps a citizen job or role ID to one of the 4 iconic hold walker tools:
 * - farmer / fields -> hoe
 * - woodcutter / timber -> axe
 * - miner / quarry / gold -> pick
 * - merchant / market -> coin
 */
export function toolForRole(role: string): WalkerTool {
  switch (role) {
    case "farmer":
    case "farm":
    case "hoe":
      return "hoe";
    case "woodcutter":
    case "wood":
    case "axe":
      return "axe";
    case "miner":
    case "stone":
    case "pick":
      return "pick";
    case "merchant":
    case "gold":
    case "coin":
    case "market":
      return "coin";
    default:
      return "hoe";
  }
}

export interface WalkerPipProps {
  /** Citizen job ID, role ID, or trade name (e.g. farmer, woodcutter, miner, merchant, unassigned) */
  role?: string;
  /** Explicit tool override (hoe, axe, pick, coin) */
  tool?: WalkerTool;
  /** Whether the worker is assigned (walks 2 frames) or idle (sits) */
  assigned?: boolean;
  /** Size in pixels (default 24) */
  size?: number;
  /** Optional custom CSS class */
  className?: string;
}

/**
 * WalkerPip: Authentic pixel/vector walker role pip for people cards.
 * - 4 matching role tools: hoe (farmer), axe (woodcutter), pick (miner), coin (merchant).
 * - Idle pip sits (peaceful resting seated pose on log / bench / turf).
 * - Assigned pip walks 2 frames (looping stepped stride cycle with arm/tool swing).
 * - GUARANTEE: strictly `pointer-events: none` on wrapper and SVGs so clicks never get blocked!
 */
export function WalkerPip({
  role,
  tool: explicitTool,
  assigned: explicitAssigned,
  size = 24,
  className = "",
}: WalkerPipProps) {
  const normRole = role ?? "unassigned";
  const isIdle = normRole === "unassigned" || normRole === "idle";
  const assigned = explicitAssigned !== undefined ? explicitAssigned : !isIdle;
  const tool = explicitTool ?? toolForRole(normRole);
  const stateCls = assigned ? "is-walking" : "is-sitting";

  return (
    <div
      className={`sc-walker-pip-wrapper ${stateCls} ${className}`}
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
      data-role={normRole}
      data-tool={tool}
      data-assigned={assigned}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-walker-pip sc-walker-pip-${tool} ${stateCls}`}
        style={{ pointerEvents: "none" }}
      >
        {/* Contact ground shadow */}
        <ellipse cx="12" cy="22" rx="5.5" ry="1.6" fill="#000000" opacity="0.32" />

        {tool === "hoe" && <FarmerPip isIdle={!assigned} />}
        {tool === "axe" && <WoodcutterPip isIdle={!assigned} />}
        {tool === "pick" && <MinerPip isIdle={!assigned} />}
        {tool === "coin" && <MerchantPip isIdle={!assigned} />}
      </svg>
    </div>
  );
}

/* =========================================================================
   1. Hoe: Farmer / Agriculture
   ========================================================================= */

function FarmerPip({ isIdle }: { isIdle: boolean }) {
  return (
    <>
      {/* Frame 0: Stride A */}
      <g className="sc-walker-frame sc-walker-f0" data-frame="0">
        <rect x="9.5" y="16" width="2" height="5.2" rx="0.5" fill="#1e293b" />
        <rect x="13" y="15" width="2" height="5.2" rx="0.5" fill="#334155" />
        <path d="M9 11 L15 11 L16 17 L8 17 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.6" />
        <rect x="8.5" y="14" width="7" height="1.2" fill="#78350f" />
        <circle cx="12" cy="7" r="2.5" fill="#fed7aa" />
        <ellipse cx="12" cy="6.2" rx="6" ry="1.8" fill="#d97706" stroke="#92400e" strokeWidth="0.5" />
        <path d="M9.5 6 C9.5 3.5, 14.5 3.5, 14.5 6 Z" fill="#facc15" stroke="#92400e" strokeWidth="0.5" />
        <line x1="14" y1="18" x2="18" y2="7" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="17.2" y="6.2" width="2.4" height="1.4" rx="0.3" fill="#64748b" />
        <path d="M16 6 L20 6 L19.5 9 L16.5 9 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.6" />
        <path d="M12 12 L15 14" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="13" r="1.2" fill="#fbbf24" />
      </g>

      {/* Frame 1: Stride B (opposite leg leads, arm/hoe swings forward, vertical bob) */}
      <g className="sc-walker-frame sc-walker-f1" data-frame="1">
        <rect x="8" y="14.2" width="2" height="5.2" rx="0.5" fill="#334155" />
        <rect x="14" y="15.2" width="2" height="5.2" rx="0.5" fill="#1e293b" />
        <path d="M9 10.2 L15 10.2 L16 16.2 L8 16.2 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.6" />
        <rect x="8.5" y="13.2" width="7" height="1.2" fill="#78350f" />
        <circle cx="12" cy="6.2" r="2.5" fill="#fed7aa" />
        <ellipse cx="12" cy="5.4" rx="6" ry="1.8" fill="#d97706" stroke="#92400e" strokeWidth="0.5" />
        <path d="M9.5 5.2 C9.5 2.7, 14.5 2.7, 14.5 5.2 Z" fill="#facc15" stroke="#92400e" strokeWidth="0.5" />
        <line x1="14" y1="16.2" x2="19" y2="8.2" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="18.2" y="7.4" width="2.4" height="1.4" rx="0.3" fill="#64748b" />
        <path d="M17 7.2 L21 7.2 L20.5 10.2 L17.5 10.2 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.6" />
        <path d="M12 11.2 L15 13.2" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="12.2" r="1.4" fill="#fde047" />
      </g>

      {/* Sitting Pose: Idle pip sits on hay bale with hoe resting beside */}
      <g className="sc-walker-frame sc-walker-sit" data-frame="sit">
        <rect x="6" y="17" width="12" height="4.5" rx="1.5" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.7" />
        <line x1="7" y1="19" x2="17" y2="19" stroke="#eab308" strokeWidth="0.6" strokeDasharray="1 1.5" />
        <path d="M9.5 12 L14.5 12 L15 17 L9 17 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.6" />
        <path d="M9 17 C9 19.5, 15 19.5, 15 17 Z" fill="#1e293b" />
        <circle cx="12" cy="8" r="2.5" fill="#fed7aa" />
        <ellipse cx="12" cy="7.2" rx="5.5" ry="1.6" fill="#d97706" stroke="#92400e" strokeWidth="0.5" />
        <path d="M10 7 C10 4.8, 14 4.8, 14 7 Z" fill="#facc15" stroke="#92400e" strokeWidth="0.5" />
        <circle cx="9.5" cy="17" r="1" fill="#fed7aa" />
        <circle cx="14.5" cy="17" r="1" fill="#fed7aa" />
        <line x1="3" y1="21" x2="10" y2="21" stroke="#92400e" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M2 20 L4 20 L3.5 22.5 L1.5 22.5 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
      </g>
    </>
  );
}

/* =========================================================================
   2. Axe: Woodcutter / Forestry
   ========================================================================= */

function WoodcutterPip({ isIdle }: { isIdle: boolean }) {
  return (
    <>
      {/* Frame 0: Stride A */}
      <g className="sc-walker-frame sc-walker-f0" data-frame="0">
        <rect x="9.5" y="16" width="2.2" height="5.2" rx="0.5" fill="#3f220c" />
        <rect x="13" y="15" width="2.2" height="5.2" rx="0.5" fill="#271406" />
        <path d="M9 11 L15 11 L16 17 L8 17 Z" fill="#c2410c" stroke="#9a3412" strokeWidth="0.6" />
        <rect x="8.5" y="14" width="7" height="1.2" fill="#451a03" />
        <circle cx="12" cy="7" r="2.5" fill="#fed7aa" />
        <path d="M9.5 7 C9.5 4, 14.5 4, 14.5 7 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.5" />
        <rect x="9" y="6.5" width="6" height="1.2" rx="0.4" fill="#b91c1c" />
        <line x1="13" y1="17" x2="18" y2="6" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M17 6 L21 4.5 L20 10 L16 8 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.6" />
        <path d="M21 4.5 L20 10" stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" />
        <path d="M12 12 L15 14" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Frame 1: Stride B */}
      <g className="sc-walker-frame sc-walker-f1" data-frame="1">
        <rect x="8" y="14.2" width="2.2" height="5.2" rx="0.5" fill="#271406" />
        <rect x="14" y="15.2" width="2.2" height="5.2" rx="0.5" fill="#3f220c" />
        <path d="M9 10.2 L15 10.2 L16 16.2 L8 16.2 Z" fill="#c2410c" stroke="#9a3412" strokeWidth="0.6" />
        <rect x="8.5" y="13.2" width="7" height="1.2" fill="#451a03" />
        <circle cx="12" cy="6.2" r="2.5" fill="#fed7aa" />
        <path d="M9.5 6.2 C9.5 3.2, 14.5 3.2, 14.5 6.2 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.5" />
        <rect x="9" y="5.7" width="6" height="1.2" rx="0.4" fill="#b91c1c" />
        <line x1="13" y1="15.2" x2="19" y2="7.2" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M18 7.2 L22 5.7 L21 11.2 L17 9.2 Z" fill="#64748b" stroke="#1e293b" strokeWidth="0.6" />
        <path d="M22 5.7 L21 11.2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 11.2 L15 13.2" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Sitting Pose: Idle pip sits on pine log with axe resting */}
      <g className="sc-walker-frame sc-walker-sit" data-frame="sit">
        <rect x="6" y="17" width="12" height="4.5" rx="1" fill="#713f12" stroke="#451a03" strokeWidth="0.7" />
        <ellipse cx="17" cy="19.2" rx="1" ry="1.8" fill="#d4a359" />
        <circle cx="17" cy="19.2" r="0.4" fill="#451a03" />
        <path d="M9.5 12 L14.5 12 L15 17 L9 17 Z" fill="#c2410c" stroke="#9a3412" strokeWidth="0.6" />
        <path d="M9 17 C9 19.5, 15 19.5, 15 17 Z" fill="#3f220c" />
        <circle cx="12" cy="8" r="2.5" fill="#fed7aa" />
        <path d="M9.5 8 C9.5 5, 14.5 5, 14.5 8 Z" fill="#991b1b" />
        <rect x="9" y="7.5" width="6" height="1.2" rx="0.4" fill="#b91c1c" />
        <line x1="4" y1="12" x2="6.5" y2="18" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M3.5 12 L7 11 L6 15 L3 14 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
        <circle cx="9.5" cy="17" r="1" fill="#fed7aa" />
        <circle cx="14.5" cy="17" r="1" fill="#fed7aa" />
      </g>
    </>
  );
}

/* =========================================================================
   3. Pick: Miner / Mining
   ========================================================================= */

function MinerPip({ isIdle }: { isIdle: boolean }) {
  return (
    <>
      {/* Frame 0: Stride A */}
      <g className="sc-walker-frame sc-walker-f0" data-frame="0">
        <rect x="9.5" y="16" width="2.2" height="5.2" rx="0.5" fill="#1e293b" />
        <rect x="13" y="15" width="2.2" height="5.2" rx="0.5" fill="#0f172a" />
        <path d="M9 11 L15 11 L16 17 L8 17 Z" fill="#475569" stroke="#334155" strokeWidth="0.6" />
        <rect x="8.5" y="14" width="7" height="1.2" fill="#1e293b" />
        <circle cx="12" cy="7" r="2.5" fill="#fed7aa" />
        <path d="M9.5 7 C9.5 4, 14.5 4, 14.5 7 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
        <circle cx="12" cy="4.5" r="1.3" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
        <line x1="13" y1="17" x2="18" y2="7" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="14" y1="5.5" x2="22" y2="9.5" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20.5 8.7 L23 10 L21.5 7.5 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.5" />
        <path d="M12 12 L15 14" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Frame 1: Stride B */}
      <g className="sc-walker-frame sc-walker-f1" data-frame="1">
        <rect x="8" y="14.2" width="2.2" height="5.2" rx="0.5" fill="#0f172a" />
        <rect x="14" y="15.2" width="2.2" height="5.2" rx="0.5" fill="#1e293b" />
        <path d="M9 10.2 L15 10.2 L16 16.2 L8 16.2 Z" fill="#475569" stroke="#334155" strokeWidth="0.6" />
        <rect x="8.5" y="13.2" width="7" height="1.2" fill="#1e293b" />
        <circle cx="12" cy="6.2" r="2.5" fill="#fed7aa" />
        <path d="M9.5 6.2 C9.5 3.2, 14.5 3.2, 14.5 6.2 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
        <circle cx="12" cy="3.7" r="1.5" fill="#fef08a" stroke="#b45309" strokeWidth="0.5" />
        <line x1="13" y1="15.2" x2="19" y2="8.2" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="15" y1="6.7" x2="23" y2="10.7" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M21.5 9.9 L24 11.2 L22.5 8.7 Z" fill="#ffffff" stroke="#334155" strokeWidth="0.5" />
        <path d="M12 11.2 L15 13.2" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Sitting Pose: Idle pip sits on granite block with pick resting */}
      <g className="sc-walker-frame sc-walker-sit" data-frame="sit">
        <rect x="6" y="17" width="12" height="4.5" rx="0.5" fill="#64748b" stroke="#334155" strokeWidth="0.7" />
        <line x1="6" y1="17" x2="18" y2="17" stroke="#94a3b8" strokeWidth="0.6" />
        <path d="M9.5 12 L14.5 12 L15 17 L9 17 Z" fill="#475569" stroke="#334155" strokeWidth="0.6" />
        <path d="M9 17 C9 19.5, 15 19.5, 15 17 Z" fill="#1e293b" />
        <circle cx="12" cy="8" r="2.5" fill="#fed7aa" />
        <path d="M9.5 8 C9.5 5, 14.5 5, 14.5 8 Z" fill="#334155" />
        <circle cx="12" cy="5.5" r="1" fill="#facc15" />
        <line x1="3" y1="13" x2="5" y2="21" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="1" y1="12" x2="6" y2="14.5" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9.5" cy="17" r="1" fill="#fed7aa" />
        <circle cx="14.5" cy="17" r="1" fill="#fed7aa" />
      </g>
    </>
  );
}

/* =========================================================================
   4. Coin: Merchant / Commerce
   ========================================================================= */

function MerchantPip({ isIdle }: { isIdle: boolean }) {
  return (
    <>
      {/* Frame 0: Stride A */}
      <g className="sc-walker-frame sc-walker-f0" data-frame="0">
        <rect x="9.5" y="16" width="2" height="5.2" rx="0.5" fill="#4c1d95" />
        <rect x="13" y="15" width="2" height="5.2" rx="0.5" fill="#2e1065" />
        <path d="M9 11 L15 11 L16 17 L8 17 Z" fill="#701a75" stroke="#4a044e" strokeWidth="0.6" />
        <path d="M10 11 L12 13 L14 11" stroke="#facc15" strokeWidth="0.8" fill="none" />
        <circle cx="12" cy="7" r="2.5" fill="#fed7aa" />
        <ellipse cx="12.5" cy="5.5" rx="4.5" ry="1.8" fill="#581c87" stroke="#3b0764" strokeWidth="0.5" />
        <circle cx="14.5" cy="4.5" r="1" fill="#f59e0b" />
        <path d="M12 12 L16 12 L18 9" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="18" cy="8" r="2.6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
        <circle cx="18" cy="8" r="1.6" fill="#fde047" stroke="#eab308" strokeWidth="0.4" />
        <circle cx="19" cy="7" r="0.7" fill="#ffffff" />
        <circle cx="8" cy="14" r="1.6" fill="#854d0e" stroke="#713f12" strokeWidth="0.5" />
      </g>

      {/* Frame 1: Stride B */}
      <g className="sc-walker-frame sc-walker-f1" data-frame="1">
        <rect x="8" y="14.2" width="2" height="5.2" rx="0.5" fill="#2e1065" />
        <rect x="14" y="15.2" width="2" height="5.2" rx="0.5" fill="#4c1d95" />
        <path d="M9 10.2 L15 10.2 L16 16.2 L8 16.2 Z" fill="#701a75" stroke="#4a044e" strokeWidth="0.6" />
        <path d="M10 10.2 L12 12.2 L14 10.2" stroke="#facc15" strokeWidth="0.8" fill="none" />
        <circle cx="12" cy="6.2" r="2.5" fill="#fed7aa" />
        <ellipse cx="12.5" cy="4.7" rx="4.5" ry="1.8" fill="#581c87" stroke="#3b0764" strokeWidth="0.5" />
        <circle cx="14.5" cy="3.7" r="1" fill="#f59e0b" />
        <path d="M12 11.2 L16 11.2 L18 8.2" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="18" cy="6.2" r="2.6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
        <circle cx="18" cy="6.2" r="1.6" fill="#fde047" stroke="#eab308" strokeWidth="0.4" />
        <path d="M18 4.2 V8.2 M16 6.2 H20" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="8" cy="13.2" r="1.6" fill="#854d0e" stroke="#713f12" strokeWidth="0.5" />
      </g>

      {/* Sitting Pose: Idle pip sits on strongbox trunk */}
      <g className="sc-walker-frame sc-walker-sit" data-frame="sit">
        <rect x="6" y="17" width="12" height="4.5" rx="0.8" fill="#78350f" stroke="#451a03" strokeWidth="0.7" />
        <rect x="6" y="17" width="12" height="1" fill="#92400e" />
        <circle cx="12" cy="19.2" r="0.9" fill="#facc15" stroke="#b45309" strokeWidth="0.4" />
        <path d="M9.5 12 L14.5 12 L15 17 L9 17 Z" fill="#701a75" stroke="#4a044e" strokeWidth="0.6" />
        <path d="M9 17 C9 19.5, 15 19.5, 15 17 Z" fill="#4c1d95" />
        <circle cx="12" cy="8" r="2.5" fill="#fed7aa" />
        <ellipse cx="12.5" cy="6.5" rx="4.5" ry="1.8" fill="#581c87" />
        <circle cx="14.5" cy="5.5" r="1" fill="#f59e0b" />
        <circle cx="13" cy="16" r="1.6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.4" />
        <circle cx="13.5" cy="15.5" r="0.5" fill="#ffffff" />
        <circle cx="9.5" cy="17" r="1" fill="#fed7aa" />
        <circle cx="14.5" cy="17" r="1" fill="#fed7aa" />
      </g>
    </>
  );
}
