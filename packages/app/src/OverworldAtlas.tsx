import React from "react";
import {
  BOARD_H,
  BOARD_W,
  listMarches,
  nodeStock,
  isProvinceSeen,
  currentSeason,
  type GameState,
  type Province,
} from "@second-crown/sim";
import {
  realmTokenPalette,
  listKeepYardBuildings,
  type KeepYardBuildingInfo,
  calculateMarchProgress,
  getThemeVisuals,
  getTileMarchDestination,
  resolveBoardSeasonWash,
} from "@second-crown/render";
import { detectCurrentHoliday } from "./seasons/holidays";

const TILE_W = 54;
const TILE_H = 27;

/** Pixi palettes store colors as 0xRRGGBB numbers. SVG fill/stroke need CSS strings. */
export function cssColor(value: string | number | undefined, fallback: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `#${(value >>> 0).toString(16).padStart(6, "0")}`;
  }
  return fallback;
}

function iso(x: number, y: number) {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2),
  };
}

function diamond(cx: number, cy: number) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
}

function terrainPaint(p: Province): { top: string; left: string; right: string; lift: number } {
  if (p.node === "hold") {
    return { top: "#6a5340", left: "#3a2c22", right: "#2a1e16", lift: 14 };
  }
  switch (p.terrain) {
    case "peak":
      return { top: "#8a8f86", left: "#4a4e48", right: "#32362f", lift: 18 };
    case "hill":
      return { top: "#6b7a4a", left: "#3f4a2c", right: "#2c3420", lift: 11 };
    case "wood":
      return { top: "#2f5a38", left: "#1c3822", right: "#122418", lift: 7 };
    case "plain":
      return { top: "#5c7a3a", left: "#3a4e24", right: "#283618", lift: 3 };
    case "waste":
      return { top: "#c2a36a", left: "#8a7040", right: "#6a5430", lift: 2 };
    case "shore":
      return { top: "#2a6a7a", left: "#163e48", right: "#0e2a32", lift: 1 };
    default:
      return { top: "#4a5c38", left: "#2c3822", right: "#1c2416", lift: 4 };
  }
}

function MiniYardBuilding(props: { cx: number; cy: number; info: KeepYardBuildingInfo }) {
  const { cx, cy, info } = props;
  let ax = cx;
  let ay = cy;
  if (info.slot === "south") {
    ax = cx - 11.5;
    ay = cy + 2.8;
  } else if (info.slot === "east") {
    ax = cx + 11.5;
    ay = cy + 2.8;
  } else if (info.slot === "west") {
    ax = cx - 11.5;
    ay = cy - 4.5;
  } else {
    // north
    ax = cx + 11.5;
    ay = cy - 4.5;
  }

  if (!info.isFinished) {
    // Unfinished scaffolding
    return (
      <g className="sc-atlas-yard-scaffolding" style={{ pointerEvents: "none" }}>
        {/* Timber upright posts */}
        <line x1={ax - 3} y1={ay - 6} x2={ax - 3} y2={ay + 1} stroke="#78350f" strokeWidth={0.7} />
        <line x1={ax + 3} y1={ay - 6} x2={ax + 3} y2={ay + 1} stroke="#78350f" strokeWidth={0.7} />
        <line x1={ax} y1={ay - 7.5} x2={ax} y2={ay + 2} stroke="#78350f" strokeWidth={0.7} />
        {/* Horizontal ledgers */}
        <line x1={ax - 3} y1={ay - 1.5} x2={ax} y2={ay} stroke="#92400e" strokeWidth={0.6} />
        <line x1={ax} y1={ay} x2={ax + 3} y2={ay - 1.5} stroke="#92400e" strokeWidth={0.6} />
        <line x1={ax - 3} y1={ay - 4} x2={ax} y2={ay - 2.5} stroke="#92400e" strokeWidth={0.6} />
        <line x1={ax} y1={ay - 2.5} x2={ax + 3} y2={ay - 4} stroke="#92400e" strokeWidth={0.6} />
        {/* Diagonal X-bracing */}
        <line x1={ax - 3} y1={ay - 4} x2={ax} y2={ay} stroke="#b45309" strokeWidth={0.5} opacity={0.8} />
        <line x1={ax - 3} y1={ay - 1.5} x2={ax} y2={ay - 2.5} stroke="#b45309" strokeWidth={0.5} opacity={0.8} />
        <line x1={ax} y1={ay - 2.5} x2={ax + 3} y2={ay - 1.5} stroke="#b45309" strokeWidth={0.5} opacity={0.8} />
        {/* Staging deck */}
        <polygon points={`${ax - 3.5},${ay - 3} ${ax},${ay - 1.5} ${ax + 3.5},${ay - 3} ${ax},${ay - 4.2}`} fill="#b45309" stroke="#78350f" strokeWidth={0.4} />
        {/* Hoist & block */}
        <line x1={ax + 0.8} y1={ay - 7} x2={ax + 0.8} y2={ay - 3.5} stroke="#e2e8f0" strokeWidth={0.5} />
        <rect x={ax + 0.1} y={ay - 3.5} width={1.4} height={1.4} fill="#94a3b8" stroke="#334155" strokeWidth={0.3} />
      </g>
    );
  }

  // Finished annex
  return (
    <g className="sc-atlas-yard-annex" style={{ pointerEvents: "none" }}>
      {/* Footprint shadow */}
      <ellipse cx={ax} cy={ay + 2} rx={4.5} ry={2} fill="#1a120c" opacity={0.45} />
      {/* Plinth */}
      <polygon points={`${ax - 4},${ay + 0.5} ${ax},${ay + 2} ${ax + 4},${ay + 0.5} ${ax},${ay - 1}`} fill="#1e293b" />
      {/* Sunlit left facet */}
      <polygon points={`${ax - 3.5},${ay + 0.5} ${ax},${ay + 2} ${ax},${ay - 3} ${ax - 3.5},${ay - 4.5}`} fill="#94a3b8" stroke="#0f172a" strokeWidth={0.4} />
      {/* Shaded right facet */}
      <polygon points={`${ax},${ay + 2} ${ax + 3.5},${ay + 0.5} ${ax + 3.5},${ay - 4.5} ${ax},${ay - 3}`} fill="#475569" stroke="#0f172a" strokeWidth={0.4} />
      {/* Gabled roof */}
      <polygon points={`${ax - 4.5},${ay - 4} ${ax},${ay - 7.5} ${ax + 4.5},${ay - 4} ${ax},${ay - 2.5}`} fill="#5c3818" stroke="#0f172a" strokeWidth={0.4} />
      <polygon points={`${ax - 4.5},${ay - 4} ${ax},${ay - 7.5} ${ax},${ay - 2.5}`} fill="#854d0e" />
      {/* Warm door / hearth */}
      <rect x={ax - 1} y={ay - 0.5} width={2} height={2} fill="#18181b" />
      <circle cx={ax} cy={ay + 0.5} r={0.6} fill="#fef08a" />
    </g>
  );
}

function MiniRealmCrest(props: { cx: number; cy: number; realmId: string }) {
  const { cx, cy, realmId } = props;
  const pal = realmTokenPalette(realmId);
  const border = cssColor(pal.borderColor, "#71717a");
  const pennant = cssColor(pal.pennantColor, "#991b1b");
  const accent = cssColor(pal.accentColor, "#ef4444");
  const stud = cssColor(pal.studColor, "#fde047");

  return (
    <g className="sc-atlas-realm-crest" style={{ pointerEvents: "none" }}>
      {/* Drop shadow */}
      <polygon
        points={`${cx - 4.5},${cy - 3.5} ${cx + 4.5},${cy - 3.5} ${cx + 4.5},${cy + 1} ${cx},${cy + 5.5} ${cx - 4.5},${cy + 1}`}
        fill="#000000"
        opacity={0.45}
      />
      {/* Outer shield rim */}
      <polygon
        points={`${cx - 4.5},${cy - 4} ${cx + 4.5},${cy - 4} ${cx + 4.5},${cy + 0.5} ${cx},${cy + 5} ${cx - 4.5},${cy + 0.5}`}
        fill={pennant}
        stroke={border}
        strokeWidth={0.7}
      />
      {/* Finial topper */}
      <polygon
        points={`${cx - 1.8},${cy - 4} ${cx},${cy - 5.5} ${cx + 1.8},${cy - 4}`}
        fill={stud}
        stroke={border}
        strokeWidth={0.4}
      />
      <circle cx={cx} cy={cy - 5.5} r={0.6} fill="#ffffff" />
      {/* Faction Sigil / Charge */}
      {realmId === "rival" ? (
        <>
          <line x1={cx - 2} y1={cy - 2} x2={cx + 2} y2={cy + 2} stroke="#ffffff" strokeWidth={0.6} />
          <line x1={cx + 2} y1={cy - 2} x2={cx - 2} y2={cy + 2} stroke="#ffffff" strokeWidth={0.6} />
          <circle cx={cx} cy={cy} r={0.7} fill={accent} />
        </>
      ) : realmId === "k_silk" ? (
        <>
          <line x1={cx} y1={cy - 2.5} x2={cx} y2={cy + 2.5} stroke={accent} strokeWidth={0.6} />
          <path d={`M ${cx - 1.6} ${cy + 1.2} A 1.6 1.6 0 0 0 ${cx + 1.6} ${cy + 1.2}`} fill="none" stroke={accent} strokeWidth={0.6} />
          <circle cx={cx} cy={cy - 2.5} r={0.5} fill={stud} />
        </>
      ) : realmId === "k_ash" ? (
        <polygon points={`${cx},${cy - 2.5} ${cx + 2},${cy + 1.5} ${cx - 2},${cy + 1.5}`} fill={accent} />
      ) : realmId === "k_veil" ? (
        <polygon points={`${cx},${cy - 2.8} ${cx + 0.8},${cy - 0.6} ${cx + 2.5},${cy} ${cx + 0.8},${cy + 0.6} ${cx},${cy + 2.8} ${cx - 0.8},${cy + 0.6} ${cx - 2.8},${cy} ${cx - 0.8},${cy - 0.6}`} fill="#ffffff" />
      ) : realmId === "k_glass" ? (
        <polygon points={`${cx},${cy - 2.5} ${cx + 2},${cy} ${cx},${cy + 2.5} ${cx - 2},${cy}`} fill={accent} stroke="#ffffff" strokeWidth={0.3} />
      ) : realmId === "k_frost" ? (
        <>
          <line x1={cx} y1={cy - 2.4} x2={cx} y2={cy + 2.4} stroke="#ffffff" strokeWidth={0.6} />
          <line x1={cx - 2} y1={cy - 1.2} x2={cx + 2} y2={cy + 1.2} stroke="#ffffff" strokeWidth={0.6} />
          <line x1={cx - 2} y1={cy + 1.2} x2={cx + 2} y2={cy - 1.2} stroke="#ffffff" strokeWidth={0.6} />
        </>
      ) : realmId === "k_tide" ? (
        <>
          <path d={`M ${cx - 2} ${cy - 0.8} Q ${cx} ${cy - 2.2} ${cx + 2} ${cy - 0.8}`} fill="none" stroke={accent} strokeWidth={0.6} />
          <path d={`M ${cx - 2} ${cy + 1.2} Q ${cx} ${cy - 0.2} ${cx + 2} ${cy + 1.2}`} fill="none" stroke={accent} strokeWidth={0.6} />
        </>
      ) : realmId === "k_ember" ? (
        <>
          <polygon points={`${cx - 1.2},${cy + 1.2} ${cx},${cy - 2.5} ${cx + 1.2},${cy + 1.2}`} fill={accent} />
          <circle cx={cx} cy={cy + 1} r={0.9} fill="#f97316" />
        </>
      ) : (
        <>
          <polygon points={`${cx - 1.8},${cy + 1.5} ${cx},${cy - 1} ${cx + 1.8},${cy + 1.5}`} fill="none" stroke={accent} strokeWidth={0.6} />
          <circle cx={cx} cy={cy - 0.5} r={0.6} fill={stud} />
        </>
      )}
    </g>
  );
}

function MiniKeep(props: {
  cx: number;
  cy: number;
  fill: string;
  roof: string;
  home: boolean;
  occupantRealmId?: string | null;
  yardBuildings?: KeepYardBuildingInfo[];
}) {
  const { cx, cy, fill, roof, home, occupantRealmId, yardBuildings = [] } = props;
  const rearAnnexes = yardBuildings.filter((a) => a.slot === "west" || a.slot === "north");
  const frontAnnexes = yardBuildings.filter((a) => a.slot === "south" || a.slot === "east");
  const showRivalCrest = !home && Boolean(occupantRealmId && occupantRealmId !== "player");

  return (
    <g>
      {/* Rear yard annexes / scaffolding */}
      {rearAnnexes.map((info) => (
        <MiniYardBuilding key={info.id ?? info.slot} cx={cx} cy={cy} info={info} />
      ))}
      <rect x={cx - 7} y={cy - 6} width={14} height={8} fill="#1a120c" opacity={0.45} />
      <rect x={cx - 6} y={cy - 14} width={12} height={10} fill={fill} stroke="#e8dcc8" strokeWidth={0.6} />
      <rect x={cx - 7} y={cy - 16} width={3} height={3} fill={fill} />
      <rect x={cx - 1.5} y={cy - 16} width={3} height={3} fill={fill} />
      <rect x={cx + 4} y={cy - 16} width={3} height={3} fill={fill} />
      <polygon points={`${cx - 8},${cy - 16} ${cx},${cy - 26} ${cx + 8},${cy - 16}`} fill={roof} stroke="#111" strokeWidth={0.4} />
      <rect x={cx - 1.5} y={cy - 8} width={3} height={4} fill="#111" />
      {home ? <circle cx={cx + 5} cy={cy - 22} r={1.6} fill="#fde047" /> : null}
      {showRivalCrest ? <MiniRealmCrest cx={cx} cy={cy - 28} realmId={occupantRealmId!} /> : null}
      {/* Front yard annexes / scaffolding */}
      {frontAnnexes.map((info) => (
        <MiniYardBuilding key={info.id ?? info.slot} cx={cx} cy={cy} info={info} />
      ))}
    </g>
  );
}

function MiniLogs(props: { cx: number; cy: number }) {
  const { cx, cy } = props;
  return (
    <g className="sc-atlas-node-pile sc-atlas-pile-logs" style={{ pointerEvents: "none" }}>
      {/* Ground contact shadow */}
      <ellipse cx={cx} cy={cy + 1} rx={8} ry={3} fill="#000000" opacity={0.35} />
      {/* Bottom left log */}
      <rect x={cx - 7} y={cy - 3} width={9} height={3.5} rx={0.8} fill="#78350f" stroke="#3f1d0b" strokeWidth={0.5} />
      <ellipse cx={cx + 2} cy={cy - 1.25} rx={1.2} ry={1.6} fill="#d97706" />
      <circle cx={cx + 2} cy={cy - 1.25} r={0.5} fill="#fde047" />
      {/* Bottom right log */}
      <rect x={cx - 3} y={cy - 1.5} width={9} height={3.5} rx={0.8} fill="#78350f" stroke="#3f1d0b" strokeWidth={0.5} />
      <ellipse cx={cx + 6} cy={cy + 0.25} rx={1.2} ry={1.6} fill="#d97706" />
      <circle cx={cx + 6} cy={cy + 0.25} r={0.5} fill="#fde047" />
      {/* Top log */}
      <rect x={cx - 5} y={cy - 5.5} width={9} height={3.5} rx={0.8} fill="#9a3412" stroke="#451a03" strokeWidth={0.5} />
      <ellipse cx={cx + 4} cy={cy - 3.75} rx={1.2} ry={1.6} fill="#f59e0b" />
      <circle cx={cx + 4} cy={cy - 3.75} r={0.5} fill="#fef08a" />
    </g>
  );
}

function MiniSacks(props: { cx: number; cy: number }) {
  const { cx, cy } = props;
  return (
    <g className="sc-atlas-node-pile sc-atlas-pile-sacks" style={{ pointerEvents: "none" }}>
      {/* Ground contact shadow */}
      <ellipse cx={cx} cy={cy + 1} rx={8} ry={3} fill="#000000" opacity={0.35} />
      {/* Bottom left sack */}
      <ellipse cx={cx - 4} cy={cy - 1} rx={4} ry={3} fill="#b45309" stroke="#78350f" strokeWidth={0.5} />
      <ellipse cx={cx - 4.5} cy={cy - 1.8} rx={2.5} ry={1.5} fill="#d97706" />
      <rect x={cx - 4.5} y={cy - 4.2} width={1.8} height={1.2} fill="#78350f" />
      <circle cx={cx - 3.6} cy={cy - 4.5} r={0.7} fill="#fde047" />
      {/* Bottom right sack */}
      <ellipse cx={cx + 4} cy={cy} rx={4} ry={3} fill="#b45309" stroke="#78350f" strokeWidth={0.5} />
      <ellipse cx={cx + 3.5} cy={cy - 0.8} rx={2.5} ry={1.5} fill="#d97706" />
      <rect x={cx + 3.5} y={cy - 3.2} width={1.8} height={1.2} fill="#78350f" />
      <circle cx={cx + 4.4} cy={cy - 3.5} r={0.7} fill="#fde047" />
      {/* Top sack */}
      <ellipse cx={cx} cy={cy - 3.5} rx={3.8} ry={2.8} fill="#ca8a04" stroke="#78350f" strokeWidth={0.5} />
      <ellipse cx={cx - 0.5} cy={cy - 4.2} rx={2.4} ry={1.4} fill="#eab308" />
      <rect x={cx - 0.8} y={cy - 6.6} width={1.6} height={1.2} fill="#78350f" />
      <circle cx={cx - 0.2} cy={cy - 7} r={0.8} fill="#fef08a" />
    </g>
  );
}

function MiniBlocks(props: { cx: number; cy: number }) {
  const { cx, cy } = props;
  return (
    <g className="sc-atlas-node-pile sc-atlas-pile-blocks" style={{ pointerEvents: "none" }}>
      {/* Ground contact shadow */}
      <ellipse cx={cx} cy={cy + 1.5} rx={8} ry={3} fill="#000000" opacity={0.35} />
      {/* Bottom left block */}
      <polygon points={`${cx - 7},${cy - 2} ${cx - 3},${cy - 4} ${cx + 1},${cy - 2} ${cx - 3},${cy}`} fill="#e4e4e7" stroke="#3f3f46" strokeWidth={0.4} />
      <polygon points={`${cx - 7},${cy - 2} ${cx - 3},${cy} ${cx - 3},${cy + 3} ${cx - 7},${cy + 1}`} fill="#a1a1aa" stroke="#3f3f46" strokeWidth={0.4} />
      <polygon points={`${cx - 3},${cy} ${cx + 1},${cy - 2} ${cx + 1},${cy + 1} ${cx - 3},${cy + 3}`} fill="#71717a" stroke="#3f3f46" strokeWidth={0.4} />
      {/* Bottom right block */}
      <polygon points={`${cx - 1},${cy - 0.5} ${cx + 3},${cy - 2.5} ${cx + 7},${cy - 0.5} ${cx + 3},${cy + 1.5}`} fill="#e4e4e7" stroke="#3f3f46" strokeWidth={0.4} />
      <polygon points={`${cx - 1},${cy - 0.5} ${cx + 3},${cy + 1.5} ${cx + 3},${cy + 4.5} ${cx - 1},${cy + 2.5}`} fill="#a1a1aa" stroke="#3f3f46" strokeWidth={0.4} />
      <polygon points={`${cx + 3},${cy + 1.5} ${cx + 7},${cy - 0.5} ${cx + 7},${cy + 2.5} ${cx + 3},${cy + 4.5}`} fill="#71717a" stroke="#3f3f46" strokeWidth={0.4} />
      {/* Top center block */}
      <polygon points={`${cx - 4},${cy - 4.5} ${cx},${cy - 6.5} ${cx + 4},${cy - 4.5} ${cx},${cy - 2.5}`} fill="#f4f4f5" stroke="#3f3f46" strokeWidth={0.4} />
      <polygon points={`${cx - 4},${cy - 4.5} ${cx},${cy - 2.5} ${cx},${cy + 0.5} ${cx - 4},${cy - 1.5}`} fill="#d4d4d8" stroke="#3f3f46" strokeWidth={0.4} />
      <polygon points={`${cx},${cy - 2.5} ${cx + 4},${cy - 4.5} ${cx + 4},${cy - 1.5} ${cx},${cy + 0.5}`} fill="#a1a1aa" stroke="#3f3f46" strokeWidth={0.4} />
    </g>
  );
}

function MiniCamp(props: { cx: number; cy: number; isPlayer?: boolean; flagColor?: string }) {
  const { cx, cy, isPlayer = false, flagColor = "#2563eb" } = props;
  return (
    <g className="sc-atlas-camp" style={{ pointerEvents: "none" }}>
      {/* Ground contact shadow */}
      <ellipse cx={cx - 1} cy={cy + 3.5} rx={7} ry={2.5} fill="#000000" opacity={0.35} />
      {/* Guy ropes */}
      <line x1={cx - 6} y1={cy + 2} x2={cx - 8.5} y2={cy + 4} stroke="#d4a373" strokeWidth={0.5} />
      <line x1={cx + 2} y1={cy + 2} x2={cx + 4} y2={cy + 4} stroke="#d4a373" strokeWidth={0.5} />
      {/* Pitched tent - left shaded face */}
      <polygon
        points={`${cx - 7},${cy + 3.5} ${cx - 2},${cy - 5} ${cx},${cy - 5} ${cx - 5},${cy + 3.5}`}
        fill={isPlayer ? "#92400e" : "#78350f"}
        stroke="#451a03"
        strokeWidth={0.4}
      />
      {/* Pitched tent - right sunlit face */}
      <polygon
        points={`${cx - 5},${cy + 3.5} ${cx},${cy - 5} ${cx + 3},${cy + 3.5}`}
        fill={isPlayer ? "#d97706" : "#b45309"}
        stroke="#451a03"
        strokeWidth={0.4}
      />
      {/* Entrance flap */}
      <polygon points={`${cx - 4},${cy + 3.5} ${cx - 2.5},${cy} ${cx - 1},${cy + 3.5}`} fill="#1c1917" />
      {/* Hearth lantern glow */}
      <circle cx={cx - 2.5} cy={cy + 2} r={1.2} fill="#fef08a" />
      <circle cx={cx - 2.5} cy={cy + 2} r={0.5} fill="#ffffff" />
      {/* Flagpole */}
      <line x1={cx + 4.5} y1={cy + 4} x2={cx + 4.5} y2={cy - 11} stroke="#78350f" strokeWidth={1} />
      {/* Finial gold ball */}
      <circle cx={cx + 4.5} cy={cy - 11.5} r={1} fill={isPlayer ? "#facc15" : "#a1a1aa"} />
      {/* Flag pennant */}
      <polygon
        points={`${cx + 4.5},${cy - 11} ${cx + 12},${cy - 8.5} ${cx + 10},${cy - 6.5} ${cx + 12},${cy - 4.5} ${cx + 4.5},${cy - 4.5}`}
        fill={flagColor}
        stroke={isPlayer ? "#facc15" : "#451a03"}
        strokeWidth={0.5}
      />
      {/* Chevron / stripe on flag */}
      <polygon
        points={`${cx + 6.5},${cy - 8.5} ${cx + 8.5},${cy - 6.5} ${cx + 6.5},${cy - 5.5} ${cx + 7.5},${cy - 5.5} ${cx + 9.5},${cy - 6.5} ${cx + 7.5},${cy - 8.5}`}
        fill={isPlayer ? "#fde047" : "#fca5a5"}
      />
    </g>
  );
}

function MiniCloudVeil(props: { cx: number; cy: number }) {
  const { cx, cy } = props;
  const hw = TILE_W / 2; // 27
  const hh = TILE_H / 2; // 13.5

  return (
    <g className="sc-atlas-fog-veil" style={{ pointerEvents: "none" }}>
      {/* 1. Diffused floating aerial shadow on table */}
      <ellipse cx={cx} cy={cy + 4} rx={hw * 0.92} ry={hh * 0.85} fill="#000000" opacity={0.32} />
      <ellipse cx={cx} cy={cy + 3} rx={hw * 0.72} ry={hh * 0.65} fill="#0f172a" opacity={0.25} />

      {/* 2. Ethereal atmospheric sky-mist aura & base stratum */}
      <ellipse cx={cx} cy={cy + 2} rx={hw * 0.94} ry={hh * 0.84} fill="#38bdf8" opacity={0.18} />
      <ellipse cx={cx} cy={cy + 1} rx={hw * 0.88} ry={hh * 0.78} fill="#64748b" opacity={0.45} />
      <ellipse cx={cx} cy={cy - 1} rx={hw * 0.88} ry={hh * 0.76} fill="#94a3b8" opacity={0.65} />
      <ellipse cx={cx} cy={cy - 2} rx={hw * 0.84} ry={hh * 0.7} fill="#cbd5e1" opacity={0.85} />

      {/* 3. Multi-tiered billowing cumulus cloud lobes */}
      {/* Lateral flanks */}
      <circle cx={cx - 15} cy={cy - 3} r={8} fill="#dbeafe" opacity={0.9} />
      <circle cx={cx + 15} cy={cy - 3} r={8} fill="#dbeafe" opacity={0.9} />
      <circle cx={cx - 19} cy={cy - 1} r={6} fill="#e2e8f0" />
      <circle cx={cx + 19} cy={cy - 1} r={6} fill="#e2e8f0" />
      <circle cx={cx} cy={cy - 9} r={9.5} fill="#e0f2fe" />
      <circle cx={cx} cy={cy + 2} r={9} fill="#cbd5e1" />

      {/* Main volumetric cumulus mounds */}
      <circle cx={cx - 9} cy={cy - 4} r={9.5} fill="#f1f5f9" />
      <circle cx={cx + 9} cy={cy - 4} r={9.5} fill="#f1f5f9" />
      <circle cx={cx - 1} cy={cy - 7} r={10.5} fill="#f8fafc" />
      <circle cx={cx + 1} cy={cy} r={10} fill="#ffffff" />
      <circle cx={cx - 7} cy={cy + 1} r={8} fill="#f8fafc" />
      <circle cx={cx + 7} cy={cy + 1} r={8} fill="#f8fafc" />

      {/* 4. Sunlit rounded crest highlights */}
      <ellipse cx={cx - 2} cy={cy - 11} rx={7} ry={3.5} fill="#ffffff" />
      <circle cx={cx - 8} cy={cy - 7} r={5} fill="#ffffff" />
      <circle cx={cx + 8} cy={cy - 7} r={5} fill="#ffffff" />
      <ellipse cx={cx + 1} cy={cy - 2} rx={6.5} ry={3.5} fill="#ffffff" />
      <circle cx={cx + 15} cy={cy - 4.5} r={3.5} fill="#ffffff" />
      <circle cx={cx - 15} cy={cy - 4.5} r={3.5} fill="#ffffff" />

      {/* 5. Wind wisps & curving vapor tendrils */}
      <path
        d={`M ${cx - 18} ${cy - 5} Q ${cx - 22} ${cy - 8} ${cx - 26} ${cy - 5.5}`}
        stroke="#e0f2fe"
        strokeWidth={1}
        fill="none"
        opacity={0.85}
      />
      <path
        d={`M ${cx + 16} ${cy + 2} Q ${cx + 21} ${cy + 5} ${cx + 25} ${cy + 3}`}
        stroke="#e0f2fe"
        strokeWidth={1}
        fill="none"
        opacity={0.85}
      />
      <path
        d={`M ${cx - 7} ${cy - 12.5} Q ${cx} ${cy - 15} ${cx + 7} ${cy - 12.5}`}
        stroke="#ffffff"
        strokeWidth={1.1}
        fill="none"
        opacity={0.9}
      />

      {/* 6. Antique cartographer brass compass star & glint */}
      <polygon
        points={`${cx},${cy - 7} ${cx + 1.6},${cy - 1.8} ${cx + 6.5},${cy} ${cx + 1.6},${cy + 1.8} ${cx},${cy + 7} ${cx - 1.6},${cy + 1.8} ${cx - 6.5},${cy} ${cx - 1.6},${cy - 1.8}`}
        fill="#d4a359"
        opacity={0.8}
        stroke="#78350f"
        strokeWidth={0.4}
      />
      <polygon
        points={`${cx - 3.2},${cy - 3.2} ${cx},${cy - 0.9} ${cx + 3.2},${cy - 3.2} ${cx + 0.9},${cy} ${cx + 3.2},${cy + 3.2} ${cx},${cy + 0.9} ${cx - 3.2},${cy + 3.2} ${cx - 0.9},${cy}`}
        fill="#b45309"
        opacity={0.7}
      />
      <circle cx={cx} cy={cy} r={1.6} fill="#fef08a" />
      <circle cx={cx} cy={cy} r={0.7} fill="#ffffff" />
    </g>
  );
}

/** Pointer travel (screen px) below which a press counts as a click, not a drag. */
const DRAG_SLOP = 6;
const PAD = 24;
/** Tallest decoration above a tile top (MiniKeep roof peak). */
const HEADROOM = 28;

export function OverworldAtlas(props: {
  state: GameState | undefined;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { state, selectedId, onSelect } = props;
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const drag = React.useRef<{
    id: number;
    sx: number;
    sy: number;
    px: number;
    py: number;
    moved: boolean;
  } | null>(null);
  /** Set when the last press became a drag, so the trailing click is ignored. */
  const suppressClick = React.useRef(false);

  if (!state) return null;
  const provinces = state.board.provinces;
  const origin = iso(0, BOARD_H - 1);
  const ox = (BOARD_W * TILE_W + 80) / 2;
  const oy = 42;
  const marches = listMarches(state);
  const homeId = state.board.homeProvinceId;
  const season = state ? currentSeason(state) : "Spring";
  const holiday = typeof detectCurrentHoliday === "function" ? detectCurrentHoliday() : "none";
  const visuals = getThemeVisuals(season, holiday);
  const globalWash = resolveBoardSeasonWash(state, null, visuals);
  const seasonTint = globalWash.hasWash && globalWash.hex
    ? { color: globalWash.hex, alpha: globalWash.washAlpha }
    : null;

  const sorted = [...provinces].sort((a, b) => a.x + a.y - (b.x + b.y));

  // Fit the viewBox to the tile cloud so it sits centered regardless of board shape.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of provinces) {
    const pos = iso(p.x, p.y);
    const cx = ox + pos.x - origin.x;
    const cy = oy + pos.y;
    minX = Math.min(minX, cx - TILE_W / 2);
    maxX = Math.max(maxX, cx + TILE_W / 2);
    minY = Math.min(minY, cy - TILE_H / 2 - HEADROOM);
    maxY = Math.max(maxY, cy + TILE_H / 2 + terrainPaint(p).lift);
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = BOARD_W * TILE_W;
    minY = 0;
    maxY = (BOARD_W + BOARD_H) * (TILE_H / 2);
  }
  const vbX = minX - PAD;
  const vbY = minY - PAD;
  const width = maxX - minX + PAD * 2;
  const height = maxY - minY + PAD * 2;
  const midX = vbX + width / 2;
  const midY = vbY + height / 2;

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
    suppressClick.current = false;
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return;
      d.moved = true;
      setDragging(true);
      // Capture only once it is a real drag, so plain clicks still land on the province.
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = svgRef.current?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? width / rect.width : 1;
    setPan({ x: d.px + dx * scale, y: d.py + dy * scale });
  }

  function endDrag(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.moved) {
      suppressClick.current = true;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
    drag.current = null;
    setDragging(false);
  }

  function selectProvince(id: string) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onSelect?.(id);
  }

  const panned = pan.x !== 0 || pan.y !== 0;

  return (
    <div className="sc-overworld-atlas" style={{ margin: "0 0 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <strong style={{ color: "#fef08a", fontSize: 14 }}>Kingdom Atlas</strong>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            Drag to pan · click a province
          </span>
          <button
            type="button"
            onClick={() => setPan({ x: 0, y: 0 })}
            disabled={!panned}
            title="Center the atlas again"
            style={{ fontSize: 12, padding: "2px 8px" }}
          >
            Recenter
          </button>
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${width} ${height}`}
        width="100%"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          display: "block",
          background: "radial-gradient(ellipse at 50% 30%, #1c2830 0%, #0c1014 70%)",
          border: "1px solid #78531e",
          borderRadius: 10,
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <defs>
          <filter id="atlas-shade" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
          </filter>
          <radialGradient id="atlas-water" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#163848" />
            <stop offset="100%" stopColor="#0a1418" />
          </radialGradient>
        </defs>
        <g transform={`translate(${pan.x} ${pan.y})`}>
        <ellipse cx={midX} cy={midY} rx={width * 0.5} ry={height * 0.46} fill="url(#atlas-water)" opacity={0.55} />
        {sorted.map((p) => {
          const pos = iso(p.x, p.y);
          const cx = ox + pos.x - origin.x;
          const cy = oy + pos.y;
          const paint = terrainPaint(p);
          const occupant = p.occupantRealmId;
          const pal = occupant ? realmTokenPalette(occupant) : null;
          const isHome = p.id === homeId || occupant === "player";
          const selected = selectedId === p.id;
          const accent = cssColor(pal?.accentColor, paint.top);
          const wall = cssColor(pal?.keepWallColor, "#3f2a1c");
          const seen = state ? isProvinceSeen(state, p.id) : true;
          const top = selected ? "#d4a72c" : occupant ? accent : paint.top;
          const hw = TILE_W / 2;
          const hh = TILE_H / 2;
          const lift = paint.lift;
          const destKind = getTileMarchDestination(state, p.id);
          const wash = resolveBoardSeasonWash(state, p, visuals);
          const washColor = wash.hex ?? (wash.washColor !== null ? cssColor(wash.washColor, "#bae6fd") : null);
          return (
            <g
              key={p.id}
              filter={seen ? "url(#atlas-shade)" : undefined}
              style={{ cursor: "pointer" }}
              onClick={() => selectProvince(p.id)}
            >
              {seen ? (
                <>
                  <polygon
                    points={`${cx - hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + lift} ${cx - hw},${cy + lift}`}
                    fill={paint.left}
                  />
                  <polygon
                    points={`${cx + hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + lift} ${cx + hw},${cy + lift}`}
                    fill={paint.right}
                  />
                  {wash.hasWash && washColor ? (
                    <>
                      <polygon
                        points={`${cx - hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + lift} ${cx - hw},${cy + lift}`}
                        fill={washColor}
                        opacity={wash.washAlpha * 0.55}
                        style={{ pointerEvents: "none" }}
                      />
                      <polygon
                        points={`${cx + hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + lift} ${cx + hw},${cy + lift}`}
                        fill={washColor}
                        opacity={wash.washAlpha * 0.4}
                        style={{ pointerEvents: "none" }}
                      />
                    </>
                  ) : null}
                  <polygon
                    points={diamond(cx, cy)}
                    fill={top}
                    stroke={isHome ? "#fde047" : selected ? "#facc15" : "#1a140c"}
                    strokeWidth={selected ? 2.2 : isHome ? 1.6 : 0.6}
                    opacity={0.95}
                  />
                  {wash.hasWash && washColor ? (
                    <polygon
                      points={diamond(cx, cy)}
                      fill={washColor}
                      opacity={wash.washAlpha}
                      style={{ pointerEvents: "none" }}
                    />
                  ) : null}
                  {wash.kind === "winter-frost" ? (
                    <>
                      {/* Delicate frost rime line along rear facets */}
                      <polyline
                        points={`${cx - hw},${cy} ${cx},${cy - hh} ${cx + hw},${cy}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={1.2}
                        opacity={0.65}
                        style={{ pointerEvents: "none" }}
                      />
                      {/* Subtle snow dusting flecks */}
                      <circle cx={cx - 7} cy={cy - 2} r={1} fill="#ffffff" opacity={0.7} style={{ pointerEvents: "none" }} />
                      <circle cx={cx + 6} cy={cy + 3} r={0.9} fill="#ffffff" opacity={0.7} style={{ pointerEvents: "none" }} />
                    </>
                  ) : null}
                  {wash.kind === "harvest-gold" ? (
                    <>
                      {/* Golden harvest rim line along rear facets */}
                      <polyline
                        points={`${cx - hw},${cy} ${cx},${cy - hh} ${cx + hw},${cy}`}
                        fill="none"
                        stroke="#fde047"
                        strokeWidth={1.2}
                        opacity={0.55}
                        style={{ pointerEvents: "none" }}
                      />
                      {/* Warm golden glints on harvested ground */}
                      <circle cx={cx - 5} cy={cy - 1} r={1} fill="#fef08a" opacity={0.6} style={{ pointerEvents: "none" }} />
                      <circle cx={cx + 5} cy={cy + 2} r={0.9} fill="#fde047" opacity={0.6} style={{ pointerEvents: "none" }} />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Subtle click target diamond beneath cloud veil */}
                  <polygon
                    points={diamond(cx, cy)}
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth={0.6}
                    opacity={0.35}
                  />
                  {/* Atmospheric cloud veil */}
                  <MiniCloudVeil cx={cx} cy={cy} />
                </>
              )}
              {/* March destination faint ring (player gold, hostile red) */}
              {destKind ? (
                <g className="sc-atlas-dest-ring" pointerEvents="none">
                  {/* Ground ring at base */}
                  <polygon
                    points={diamond(cx, cy + (seen ? lift : 0))}
                    fill="none"
                    stroke={destKind === "player" ? "#f59e0b" : "#ef4444"}
                    strokeWidth={2}
                    opacity={destKind === "player" ? 0.45 : 0.55}
                  />
                  {/* Elevated plateau ring */}
                  {seen && lift > 0 ? (
                    <polygon
                      points={diamond(cx, cy)}
                      fill="none"
                      stroke={destKind === "player" ? "#facc15" : "#f87171"}
                      strokeWidth={1.2}
                      opacity={destKind === "player" ? 0.50 : 0.60}
                    />
                  ) : null}
                  {/* Cardinal corner bracket pips */}
                  <circle cx={cx} cy={cy - hh} r={1.3} fill={destKind === "player" ? "#fde047" : "#fca5a5"} opacity={0.7} />
                  <circle cx={cx + hw} cy={cy} r={1.3} fill={destKind === "player" ? "#fde047" : "#fca5a5"} opacity={0.7} />
                  <circle cx={cx} cy={cy + hh} r={1.3} fill={destKind === "player" ? "#fde047" : "#fca5a5"} opacity={0.7} />
                  <circle cx={cx - hw} cy={cy} r={1.3} fill={destKind === "player" ? "#fde047" : "#fca5a5"} opacity={0.7} />
                </g>
              ) : null}
              {selected ? (
                <g className="sc-atlas-select-rim" pointerEvents="none">
                  {/* Ground ring at base */}
                  <polygon
                    points={diamond(cx, cy + (seen ? lift : 0))}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={3.5}
                    opacity={0.5}
                  />
                  <polygon
                    points={diamond(cx, cy + (seen ? lift : 0))}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth={2}
                    opacity={0.95}
                  />
                  {/* Top gold rim */}
                  <polygon
                    points={diamond(cx, cy)}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={3.5}
                    opacity={0.45}
                  />
                  <polygon
                    points={diamond(cx, cy)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1}
                    opacity={0.85}
                  />
                  {/* Cardinal corner bracket pips */}
                  <circle cx={cx} cy={cy - hh} r={2} fill="#ffffff" stroke="#b45309" strokeWidth={0.5} />
                  <circle cx={cx + hw} cy={cy} r={1.6} fill="#fef08a" stroke="#b45309" strokeWidth={0.5} />
                  <circle cx={cx} cy={cy + hh} r={1.6} fill="#fef08a" stroke="#b45309" strokeWidth={0.5} />
                  <circle cx={cx - hw} cy={cy} r={1.6} fill="#fef08a" stroke="#b45309" strokeWidth={0.5} />
                </g>
              ) : null}
              {seen ? (
                <>
                  {p.node === "hold" ? (
                    <MiniKeep
                      cx={cx}
                      cy={cy}
                      fill={wall}
                      roof={isHome ? "#ca8a04" : accent}
                      home={isHome}
                      occupantRealmId={p.occupantRealmId}
                      yardBuildings={isHome && state ? listKeepYardBuildings(state) : undefined}
                    />
                  ) : p.node === "woodcut" && nodeStock(state, p.id) > 0 ? (
                    <MiniLogs cx={cx} cy={cy} />
                  ) : p.node === "field" && nodeStock(state, p.id) > 0 ? (
                    <MiniSacks cx={cx} cy={cy} />
                  ) : p.node === "quarry" && nodeStock(state, p.id) > 0 ? (
                    <MiniBlocks cx={cx} cy={cy} />
                  ) : p.node === "camp" || (occupant === "player" && p.id !== homeId) ? (
                    <MiniCamp cx={cx} cy={cy} isPlayer={occupant === "player"} flagColor={occupant === "player" ? "#2563eb" : "#dc2626"} />
                  ) : p.node && p.node !== "none" ? (
                    <circle cx={cx} cy={cy - 2} r={3.2} fill="#fbbf24" stroke="#111" strokeWidth={0.5} />
                  ) : p.terrain === "wood" ? (
                    <>
                      <ellipse cx={cx - 4} cy={cy} rx={3} ry={2} fill="#163822" />
                      <ellipse cx={cx + 3} cy={cy + 1} rx={2.4} ry={1.6} fill="#1a4028" />
                    </>
                  ) : p.terrain === "peak" ? (
                    <polygon points={`${cx - 5},${cy + 2} ${cx},${cy - 10} ${cx + 5},${cy + 2}`} fill="#d6d3d1" opacity={0.85} />
                  ) : null}
                </>
              ) : null}
            </g>
          );
        })}
        {marches.map((m) => {
          const from = provinces.find((pr) => pr.id === m.fromId);
          const to = provinces.find((pr) => pr.id === m.toId);
          if (!from || !to) return null;
          const a = iso(from.x, from.y);
          const b = iso(to.x, to.y);
          const x1 = ox + a.x - origin.x;
          const y1 = oy + a.y;
          const x2 = ox + b.x - origin.x;
          const y2 = oy + b.y;
          const pal = realmTokenPalette(m.realmId);
          const stroke = cssColor(pal.accentColor, "#fbbf24");
          const dist = Math.max(1, Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
          const progress = typeof m.arrivesTick === "number"
            ? calculateMarchProgress(state.meta.tick, m.arrivesTick, dist)
            : 0.5;
          const mx = x1 + (x2 - x1) * progress;
          const my = y1 + (y2 - y1) * progress;
          const hasEta = typeof m.arrivesTick === "number";
          const secs = hasEta
            ? Math.max(0, Math.ceil((m.arrivesTick - state.meta.tick) / 10))
            : null;
          return (
            <g key={m.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={2}
                strokeDasharray="4 3"
                opacity={0.85}
              />
              <circle cx={mx} cy={my} r={4} fill={stroke} stroke="#111" />
              {hasEta && secs !== null ? (
                <g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>
                  <rect
                    x={mx - 10}
                    y={my - 16}
                    width={20}
                    height={10}
                    rx={3}
                    fill="#090d16"
                    stroke={stroke}
                    strokeWidth={0.8}
                  />
                  <text
                    x={mx}
                    y={my - 8.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={7.5}
                    fontWeight="bold"
                    fontFamily="monospace"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {secs}s
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}
