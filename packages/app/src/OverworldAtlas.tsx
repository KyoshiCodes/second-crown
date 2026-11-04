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
  resolveAtmosphereWeather,
  getPostedGarrison,
  hasProvinceClash,
  hasProvinceIncoming,
  hasProvinceTrail,
} from "@second-crown/render";
import { detectCurrentHoliday } from "./seasons/holidays";
import "./hud/atlas-select-rim.css";
import "./hud/atlas-node-piles.css";
import "./hud/atlas-camps.css";
import "./hud/atlas-weather.css";
import "./hud/atlas-fog.css";
import "./hud/atlas-marches.css";
import "./hud/atlas-keeps.css";
import "./hud/atlas-roads.css";
import "./hud/atlas-units.css";
import "./hud/atlas-effects.css";
import "./hud/atlas-hover.css";

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

function selectionBrackets(cx: number, cy: number, pad: number = 3): string {
  const hw = TILE_W / 2 + pad;
  const hh = TILE_H / 2 + pad * 0.5;
  const verts = [
    { x: cx, y: cy - hh },
    { x: cx + hw, y: cy },
    { x: cx, y: cy + hh },
    { x: cx - hw, y: cy },
  ];
  const t = 0.32;
  const segs: string[] = [];
  for (let i = 0; i < 4; i++) {
    const v = verts[i];
    const prev = verts[(i + 3) % 4];
    const next = verts[(i + 1) % 4];
    const ax = v.x + (prev.x - v.x) * t;
    const ay = v.y + (prev.y - v.y) * t;
    const bx = v.x + (next.x - v.x) * t;
    const by = v.y + (next.y - v.y) * t;
    segs.push(`M ${ax} ${ay} L ${v.x} ${v.y} L ${bx} ${by}`);
  }
  return segs.join(" ");
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

  // Determine owner rim color matching boardKeepRimColor
  let rimColor = "#e2e8f0";
  if (home || occupantRealmId === "player") {
    rimColor = "#fbbf24";
  } else if (occupantRealmId === "rival") {
    rimColor = "#ef4444";
  } else if (occupantRealmId) {
    const pal = realmTokenPalette(occupantRealmId);
    rimColor = cssColor(pal.borderColor, "#38bdf8");
  }

  return (
    <g className="sc-atlas-keep" style={{ pointerEvents: "none" }}>
      {/* 1. Steady dark ink plinth underlay with owner-colored rim */}
      <g className="sc-atlas-keep-plinth" style={{ pointerEvents: "none" }}>
        <ellipse cx={cx} cy={cy + 2} rx={12} ry={5.5} fill="#0f172a" opacity={0.65} style={{ pointerEvents: "none" }} />
        <ellipse cx={cx} cy={cy + 2} rx={12} ry={5.5} fill="none" stroke={rimColor} strokeWidth={1.2} opacity={0.9} style={{ pointerEvents: "none" }} />
      </g>

      {/* Rear yard annexes / scaffolding */}
      {rearAnnexes.map((info) => (
        <MiniYardBuilding key={info.id ?? info.slot} cx={cx} cy={cy} info={info} />
      ))}

      {/* Ground shadow beneath keep building */}
      <rect x={cx - 7} y={cy - 6} width={14} height={8} fill="#1a120c" opacity={0.45} />
      {/* Stone keep walls */}
      <rect x={cx - 6} y={cy - 14} width={12} height={10} fill={fill} stroke="#e8dcc8" strokeWidth={0.6} />
      {/* Crenellations */}
      <rect x={cx - 7} y={cy - 16} width={3} height={3} fill={fill} />
      <rect x={cx - 1.5} y={cy - 16} width={3} height={3} fill={fill} />
      <rect x={cx + 4} y={cy - 16} width={3} height={3} fill={fill} />
      {/* Roof pavilion */}
      <polygon points={`${cx - 8},${cy - 16} ${cx},${cy - 26} ${cx + 8},${cy - 16}`} fill={roof} stroke="#111" strokeWidth={0.4} />

      {/* Living hearth / doorway warm golden light */}
      <rect x={cx - 1.5} y={cy - 8} width={3} height={4} fill="#111" />
      <rect className="sc-atlas-keep-light" x={cx - 1} y={cy - 7} width={2} height={3} fill="#fde047" opacity={0.9} style={{ pointerEvents: "none" }} />

      {/* Living watchfire beacon on home keep roof / spire */}
      {home ? (
        <g className="sc-atlas-keep-beacon" style={{ pointerEvents: "none" }}>
          <circle cx={cx + 5} cy={cy - 22} r={2.5} fill="#f59e0b" opacity={0.5} style={{ pointerEvents: "none" }} />
          <circle cx={cx + 5} cy={cy - 22} r={1.6} fill="#fde047" style={{ pointerEvents: "none" }} />
          <circle cx={cx + 5} cy={cy - 22} r={0.7} fill="#ffffff" style={{ pointerEvents: "none" }} />
        </g>
      ) : null}

      {/* Living fluttering heraldic banner atop the keep roof */}
      <g className="sc-atlas-keep-banner" style={{ pointerEvents: "none" }}>
        <line x1={cx} y1={cy - 26} x2={cx} y2={cy - 34} stroke="#78350f" strokeWidth={1} />
        <polygon
          points={`${cx},${cy - 34} ${cx + 7},${cy - 32} ${cx + 5},${cy - 30.5} ${cx + 7},${cy - 29} ${cx},${cy - 29}`}
          fill={rimColor}
          stroke="#0f172a"
          strokeWidth={0.4}
        />
      </g>

      {showRivalCrest ? <MiniRealmCrest cx={cx} cy={cy - 38} realmId={occupantRealmId!} /> : null}

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
      {/* Dark ink plinth underlay with warm rim for weather/fog contrast */}
      <ellipse cx={cx} cy={cy + 1.8} rx={9.5} ry={4.4} fill="#1c1208" opacity={0.62} style={{ pointerEvents: "none" }} />
      <ellipse cx={cx} cy={cy + 1.8} rx={9.5} ry={4.4} fill="none" stroke="#fde68a" strokeWidth={0.8} opacity={0.38} style={{ pointerEvents: "none" }} />
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
      {/* Dark ink plinth underlay with warm rim for weather/fog contrast */}
      <ellipse cx={cx} cy={cy + 1.8} rx={9.5} ry={4.4} fill="#1c1208" opacity={0.62} style={{ pointerEvents: "none" }} />
      <ellipse cx={cx} cy={cy + 1.8} rx={9.5} ry={4.4} fill="none" stroke="#fde68a" strokeWidth={0.8} opacity={0.38} style={{ pointerEvents: "none" }} />
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
      {/* Dark ink plinth underlay with warm rim for weather/fog contrast */}
      <ellipse cx={cx} cy={cy + 1.8} rx={9.5} ry={4.4} fill="#1c1208" opacity={0.62} style={{ pointerEvents: "none" }} />
      <ellipse cx={cx} cy={cy + 1.8} rx={9.5} ry={4.4} fill="none" stroke="#fde68a" strokeWidth={0.8} opacity={0.38} style={{ pointerEvents: "none" }} />
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

function MiniCamp(props: { cx: number; cy: number; isPlayer?: boolean; flagColor?: string; isPosted?: boolean }) {
  const { cx, cy, isPlayer = false, flagColor = "#2563eb", isPosted = false } = props;
  return (
    <g
      className={`sc-atlas-camp ${isPlayer ? "sc-atlas-camp-outpost" : "sc-atlas-camp-rival"}`}
      style={{ pointerEvents: "none" }}
    >
      {/* Living stationed unit / sentry pulse glow */}
      <ellipse
        className={`sc-atlas-unit-pulse-glow ${isPosted ? "sc-atlas-unit-sentry" : ""}`}
        cx={cx - 1}
        cy={cy + 3.8}
        rx={isPosted ? 10.5 : 8.5}
        ry={isPosted ? 5.0 : 3.8}
        fill={isPlayer ? "#3b82f6" : "#ef4444"}
        fillOpacity={0.22}
        stroke={isPlayer ? "#60a5fa" : "#f87171"}
        strokeWidth={0.8}
        style={{ pointerEvents: "none" }}
      />
      {/* Dark ink plinth underlay with kind rim for weather/fog contrast */}
      <ellipse
        cx={cx - 1}
        cy={cy + 3.8}
        rx={8.5}
        ry={3.8}
        fill="#0e0906"
        opacity={0.68}
        style={{ pointerEvents: "none" }}
      />
      <ellipse
        cx={cx - 1}
        cy={cy + 3.8}
        rx={8.5}
        ry={3.8}
        fill="none"
        stroke={isPlayer ? "#86efac" : "#fda4af"}
        strokeWidth={0.8}
        opacity={0.72}
        style={{ pointerEvents: "none" }}
      />
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
      <g className="sc-atlas-camp-lantern" style={{ pointerEvents: "none" }}>
        <circle cx={cx - 2.5} cy={cy + 2} r={1.2} fill="#fef08a" />
        <circle cx={cx - 2.5} cy={cy + 2} r={0.5} fill="#ffffff" />
      </g>
      {/* Flagpole */}
      <line x1={cx + 4.5} y1={cy + 4} x2={cx + 4.5} y2={cy - 11} stroke="#78350f" strokeWidth={1} />
      {/* Finial gold ball */}
      <circle cx={cx + 4.5} cy={cy - 11.5} r={1} fill={isPlayer ? "#facc15" : "#a1a1aa"} />
      {/* Flag pennant */}
      <g className="sc-atlas-camp-flag" style={{ pointerEvents: "none" }}>
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
    </g>
  );
}

function MiniWeatherGlyph(props: { weather: string; x: number; y: number }) {
  const { weather, x, y } = props;
  if (!weather || weather === "clear") return null;
  const cloud = weather === "storm" ? "#94a3b8" : weather === "snow" ? "#e2e8f0" : "#cbd5e1";
  const cx = x + 16;
  const cy = y + 8;
  return (
    <g className={`sc-atlas-weather-glyph sc-atlas-weather-${weather}`} style={{ pointerEvents: "none" }}>
      {/* Plaque backing */}
      <rect x={x} y={y} width={32} height={22} rx={4} fill="#0f172a" opacity={0.75} stroke="#b45309" strokeWidth={1} style={{ pointerEvents: "none" }} />
      {/* Cloud */}
      <ellipse cx={cx} cy={cy + 1} rx={8} ry={3.2} fill={cloud} opacity={0.95} style={{ pointerEvents: "none" }} />
      <circle cx={cx - 3} cy={cy - 0.5} r={3} fill={cloud} opacity={0.95} style={{ pointerEvents: "none" }} />
      <circle cx={cx + 2.5} cy={cy - 1.2} r={3.6} fill={cloud} opacity={0.95} style={{ pointerEvents: "none" }} />
      {/* Precipitation marks */}
      {weather === "rain" || weather === "storm" ? (
        <g className="sc-atlas-glyph-rain" style={{ pointerEvents: "none" }}>
          <line x1={cx - 4} y1={cy + 6} x2={cx - 5.2} y2={cy + 9.6} stroke={weather === "storm" ? "#60a5fa" : "#93c5fd"} strokeWidth={1.2} opacity={0.95} />
          <line x1={cx} y1={cy + 6} x2={cx - 1.2} y2={cy + 9.6} stroke={weather === "storm" ? "#60a5fa" : "#93c5fd"} strokeWidth={1.2} opacity={0.95} />
          <line x1={cx + 4} y1={cy + 6} x2={cx + 2.8} y2={cy + 9.6} stroke={weather === "storm" ? "#60a5fa" : "#93c5fd"} strokeWidth={1.2} opacity={0.95} />
          {weather === "storm" ? (
            <polyline points={`${cx + 1.5},${cy + 2.5} ${cx - 1},${cy + 6.5} ${cx + 1},${cy + 6.5} ${cx - 1.5},${cy + 10.5}`} fill="none" stroke="#facc15" strokeWidth={1.2} opacity={0.95} />
          ) : null}
        </g>
      ) : weather === "snow" ? (
        <g className="sc-atlas-glyph-snow" style={{ pointerEvents: "none" }}>
          <circle cx={cx - 5} cy={cy + 8} r={1.2} fill="#f8fafc" opacity={0.95} />
          <circle cx={cx} cy={cy + 9} r={1.2} fill="#f8fafc" opacity={0.95} />
          <circle cx={cx + 5} cy={cy + 8} r={1.2} fill="#f8fafc" opacity={0.95} />
        </g>
      ) : weather === "leaves" ? (
        <g className="sc-atlas-glyph-leaves" style={{ pointerEvents: "none" }}>
          <ellipse cx={cx - 4.5} cy={cy + 7.5} rx={2.2} ry={1.2} fill="#f59e0b" opacity={0.95} />
          <ellipse cx={cx + 4.5} cy={cy + 7.5} rx={2.2} ry={1.2} fill="#d97706" opacity={0.95} />
        </g>
      ) : null}
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

      {/* 2. Ethereal atmospheric sky-mist aura & base stratum with living drift */}
      <g className="sc-atlas-fog-drift" style={{ pointerEvents: "none" }}>
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

        {/* Main volumetric cumulus mounds with living pulse */}
        <g className="sc-atlas-fog-puff" style={{ pointerEvents: "none" }}>
          <circle cx={cx - 9} cy={cy - 4} r={9.5} fill="#f1f5f9" />
          <circle cx={cx + 9} cy={cy - 4} r={9.5} fill="#f1f5f9" />
          <circle cx={cx - 1} cy={cy - 7} r={10.5} fill="#f8fafc" />
          <circle cx={cx + 1} cy={cy} r={10} fill="#ffffff" />
          <circle cx={cx - 7} cy={cy + 1} r={8} fill="#f8fafc" />
          <circle cx={cx + 7} cy={cy + 1} r={8} fill="#f8fafc" />
        </g>

        {/* 4. Sunlit rounded crest highlights */}
        <ellipse cx={cx - 2} cy={cy - 11} rx={7} ry={3.5} fill="#ffffff" />
        <circle cx={cx - 8} cy={cy - 7} r={5} fill="#ffffff" />
        <circle cx={cx + 8} cy={cy - 7} r={5} fill="#ffffff" />
        <ellipse cx={cx + 1} cy={cy - 2} rx={6.5} ry={3.5} fill="#ffffff" />
        <circle cx={cx + 15} cy={cy - 4.5} r={3.5} fill="#ffffff" />
        <circle cx={cx - 15} cy={cy - 4.5} r={3.5} fill="#ffffff" />

        {/* 5. Wind wisps & curving vapor tendrils with living wisp animation */}
        <g className="sc-atlas-fog-tendril" style={{ pointerEvents: "none" }}>
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
        </g>
      </g>

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
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
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

  const weather = state ? resolveAtmosphereWeather(state) : "clear";
  const sorted = [...provinces].sort((a, b) => a.x + a.y - (b.x + b.y));

  const atlasRoads = React.useMemo(() => {
    if (!state?.board?.provinces) return [];
    const provs = state.board.provinces;
    const at = new Map<string, Province>();
    const seenMap = new Map<string, boolean>();
    const safeState = state ? (state.buildings ? state : ({ ...state, buildings: [] } as unknown as GameState)) : null;
    for (const p of provs) {
      at.set(`${p.x},${p.y}`, p);
      seenMap.set(p.id, safeState ? isProvinceSeen(safeState, p.id) : true);
    }
    const result: Array<{
      id: string;
      from: Province;
      to: Province;
      kind: "road" | "path";
      intoFog: boolean;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      midX: number;
      midY: number;
    }> = [];

    for (const p of provs) {
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const n = at.get(`${p.x + dx},${p.y + dy}`);
        if (!n) continue;
        const pSeen = seenMap.get(p.id) === true;
        const nSeen = seenMap.get(n.id) === true;
        if (!pSeen && !nSeen) continue;
        const from = pSeen ? p : n;
        const to = pSeen ? n : p;
        const p1 = iso(from.x, from.y);
        const p2 = iso(to.x, to.y);
        const x1 = ox + p1.x - origin.x;
        const y1 = oy + p1.y;
        const x2 = ox + p2.x - origin.x;
        const y2 = oy + p2.y;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const kind = from.terrain === "peak" || to.terrain === "peak" ? "path" : "road";
        const intoFog = !(pSeen && nSeen);
        result.push({
          id: `${from.id}-${to.id}`,
          from,
          to,
          kind,
          intoFog,
          x1,
          y1,
          x2: intoFog ? midX : x2,
          y2: intoFog ? midY : y2,
          midX,
          midY,
        });
      }
    }
    return result;
  }, [state, ox, oy, origin.x]);

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
        {/* Pass 1: Tile Ground Surfaces */}
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
          const seen = state ? isProvinceSeen(state, p.id) : true;
          const top = selected ? "#d4a72c" : occupant ? accent : paint.top;
          const hw = TILE_W / 2;
          const hh = TILE_H / 2;
          const lift = paint.lift;
          const wash = resolveBoardSeasonWash(state, p, visuals);
          const washColor = wash.hex ?? (wash.washColor !== null ? cssColor(wash.washColor, "#bae6fd") : null);
          return (
            <g
              key={`ground-${p.id}`}
              filter={seen ? "url(#atlas-shade)" : undefined}
              style={{ cursor: "pointer" }}
              onClick={() => selectProvince(p.id)}
              onPointerEnter={() => setHoveredId(p.id)}
              onPointerLeave={() => setHoveredId((cur) => (cur === p.id ? null : cur))}
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
                </>
              ) : (
                <>
                  <polygon
                    points={diamond(cx, cy)}
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth={0.6}
                    opacity={0.35}
                  />
                  <polygon
                    className="sc-atlas-fog-edge"
                    points={diamond(cx, cy)}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={1.2}
                    opacity={0.5}
                    style={{ pointerEvents: "none" }}
                  />
                  <polygon
                    className="sc-atlas-fog-mist"
                    points={diamond(cx, cy)}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={0.8}
                    opacity={0.7}
                    style={{ pointerEvents: "none" }}
                  />
                  <MiniCloudVeil cx={cx} cy={cy} />
                </>
              )}
            </g>
          );
        })}

        {/* Pass 2: Living Roads & Paths */}
        <g className="sc-atlas-roads" style={{ pointerEvents: "none" }}>
          {atlasRoads.map((r) => (
            <g
              key={r.id}
              className={`sc-atlas-road sc-atlas-road-${r.kind}${r.intoFog ? " sc-atlas-road-fog" : ""}`}
              style={{ pointerEvents: "none" }}
            >
              {/* Steady dark ink underlay */}
              <line
                className="sc-atlas-road-ink"
                x1={r.x1}
                y1={r.y1}
                x2={r.x2}
                y2={r.y2}
                stroke="#1a120b"
                strokeWidth={r.kind === "road" ? 4.4 : 3.2}
                strokeLinecap="round"
                opacity={0.65}
                style={{ pointerEvents: "none" }}
              />
              {/* Packed-earth bed */}
              <line
                className={`sc-atlas-road-bed ${r.kind === "path" ? "sc-atlas-path-dash" : ""}`}
                x1={r.x1}
                y1={r.y1}
                x2={r.x2}
                y2={r.y2}
                stroke="#d6b98a"
                strokeWidth={r.kind === "road" ? 2.4 : 1.6}
                strokeDasharray={r.kind === "path" ? "3 2.5" : undefined}
                strokeLinecap="round"
                opacity={0.92}
                style={{ pointerEvents: "none" }}
              />
              {/* Thin pale crown on roads */}
              {r.kind === "road" && (
                <line
                  className="sc-atlas-road-crown"
                  x1={r.x1}
                  y1={r.y1}
                  x2={r.x2}
                  y2={r.y2}
                  stroke="#faf3e0"
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  opacity={0.5}
                  style={{ pointerEvents: "none" }}
                />
              )}
              {/* Living road traffic and dust puff */}
              {!r.intoFog && (
                <g className="sc-atlas-road-traffic-group" style={{ pointerEvents: "none" }}>
                  <circle
                    className="sc-atlas-road-traffic"
                    cx={r.midX}
                    cy={r.midY}
                    r={1.2}
                    fill="#ca8a04"
                    opacity={0.92}
                    style={{ pointerEvents: "none" }}
                  />
                  <circle
                    className="sc-atlas-road-dust"
                    cx={r.midX - 1.6}
                    cy={r.midY + 0.8}
                    r={0.9}
                    fill="#d4bda5"
                    opacity={0.45}
                    style={{ pointerEvents: "none" }}
                  />
                </g>
              )}
            </g>
          ))}
        </g>

        {/* Pass 3: Tile Tokens, Keeps, Nodes, Weather, Selection Rim */}
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
          const hw = TILE_W / 2;
          const hh = TILE_H / 2;
          const lift = paint.lift;
          const destKind = getTileMarchDestination(state, p.id);
          return (
            <g
              key={p.id}
              style={{ cursor: "pointer", pointerEvents: "none" }}
            >
              {seen ? (
                <>
                  {selected ? (
                    <g className="sc-atlas-select-rim" style={{ pointerEvents: "none" }}>
                      {/* Steady pale halo under the ink for night, storm dim, and dark tile contrast */}
                      <polygon
                        className="sc-atlas-select-halo"
                        points={diamond(cx, cy)}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={4.5}
                        opacity={0.55}
                        style={{ pointerEvents: "none" }}
                      />
                      {/* Dark ink underlay */}
                      <polygon
                        points={diamond(cx, cy)}
                        fill="none"
                        stroke="#1c1208"
                        strokeWidth={3.2}
                        opacity={0.9}
                      />
                      {/* Soft breathing amber glow */}
                      <polygon
                        className="sc-atlas-select-glow"
                        points={diamond(cx, cy)}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth={2.4}
                        opacity={0.65}
                      />
                      {/* Sharp radiant gold core */}
                      <polygon
                        points={diamond(cx, cy)}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth={1.4}
                        opacity={0.98}
                      />
                      {/* Four subtle corner brackets framing the diamond corners */}
                      <path
                        className="sc-atlas-select-brackets"
                        d={selectionBrackets(cx, cy, 6)}
                        fill="none"
                        stroke="#1c1208"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.9}
                      />
                      <path
                        className="sc-atlas-select-brackets"
                        d={selectionBrackets(cx, cy, 6)}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={1}
                      />
                      {/* Cardinal target pips */}
                      <circle cx={cx} cy={cy - hh} r={1.6} fill="#ffffff" stroke="#b45309" strokeWidth={0.5} />
                      <circle cx={cx + hw} cy={cy} r={1.6} fill="#ffffff" stroke="#b45309" strokeWidth={0.5} />
                      <circle cx={cx} cy={cy + hh} r={1.6} fill="#ffffff" stroke="#b45309" strokeWidth={0.5} />
                      <circle cx={cx - hw} cy={cy} r={1.6} fill="#ffffff" stroke="#b45309" strokeWidth={0.5} />
                    </g>
                  ) : null}
                  {/* Subtle elevated facet facet-highlight when selected */}
                  {selected && lift > 0 ? (
                    <polyline
                      points={`${cx - hw},${cy} ${cx},${cy + hh} ${cx + hw},${cy}`}
                      fill="none"
                      stroke="#fde047"
                      strokeWidth={1.5}
                      opacity={0.8}
                    />
                  ) : null}
                </>
              ) : null}
              {/* Living hover treatment on diamond tile (bakeoff/gemini-hover) */}
              {!selected && hoveredId === p.id ? (
                <g className="sc-atlas-hover-rim" style={{ pointerEvents: "none" }}>
                  <polygon
                    className="sc-atlas-hover-wash"
                    points={diamond(cx, cy)}
                    fill="#ffffff"
                    style={{ pointerEvents: "none" }}
                  />
                  <polygon
                    className="sc-atlas-hover-ink"
                    points={diamond(cx, cy)}
                    fill="none"
                    stroke="#0b0f17"
                    strokeWidth={2.8}
                    style={{ pointerEvents: "none" }}
                  />
                  <polygon
                    className="sc-atlas-hover-halo"
                    points={diamond(cx, cy)}
                    fill="none"
                    stroke={seen ? "#f8fafc" : "#94a3b8"}
                    strokeWidth={1.3}
                    style={{ pointerEvents: "none" }}
                  />
                  <circle cx={cx} cy={cy - hh} r={1.2} className="sc-atlas-hover-tick" fill={seen ? "#f8fafc" : "#94a3b8"} style={{ pointerEvents: "none" }} />
                  <circle cx={cx + hw} cy={cy} r={1.2} className="sc-atlas-hover-tick" fill={seen ? "#f8fafc" : "#94a3b8"} style={{ pointerEvents: "none" }} />
                  <circle cx={cx} cy={cy + hh} r={1.2} className="sc-atlas-hover-tick" fill={seen ? "#f8fafc" : "#94a3b8"} style={{ pointerEvents: "none" }} />
                  <circle cx={cx - hw} cy={cy} r={1.2} className="sc-atlas-hover-tick" fill={seen ? "#f8fafc" : "#94a3b8"} style={{ pointerEvents: "none" }} />
                </g>
              ) : null}
              {selected && hoveredId === p.id ? (
                <g className="sc-atlas-hover-glint" style={{ pointerEvents: "none" }}>
                  <circle cx={cx} cy={cy - hh} r={2.0} fill="#fef08a" opacity={0.8} style={{ pointerEvents: "none" }} />
                  <circle cx={cx + hw} cy={cy} r={2.0} fill="#fef08a" opacity={0.8} style={{ pointerEvents: "none" }} />
                  <circle cx={cx} cy={cy + hh} r={2.0} fill="#fef08a" opacity={0.8} style={{ pointerEvents: "none" }} />
                  <circle cx={cx - hw} cy={cy} r={2.0} fill="#fef08a" opacity={0.8} style={{ pointerEvents: "none" }} />
                </g>
              ) : null}
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
              {seen && (weather === "rain" || weather === "storm") ? (
                <g className="sc-atlas-weather-drops" style={{ pointerEvents: "none" }}>
                  <line x1={cx - 4} y1={cy - 6} x2={cx - 6} y2={cy} stroke="#0f172a" strokeWidth={2.0} opacity={0.34} style={{ pointerEvents: "none" }} />
                  <line x1={cx + 5} y1={cy - 8} x2={cx + 3} y2={cy - 2} stroke="#0f172a" strokeWidth={2.0} opacity={0.34} style={{ pointerEvents: "none" }} />
                  <line x1={cx - 4} y1={cy - 6} x2={cx - 6} y2={cy} stroke={weather === "storm" ? "#60a5fa" : "#93c5fd"} strokeWidth={1.0} opacity={0.7} style={{ pointerEvents: "none" }} />
                  <line x1={cx + 5} y1={cy - 8} x2={cx + 3} y2={cy - 2} stroke={weather === "storm" ? "#60a5fa" : "#93c5fd"} strokeWidth={1.0} opacity={0.7} style={{ pointerEvents: "none" }} />
                </g>
              ) : seen && weather === "snow" ? (
                <g className="sc-atlas-weather-flakes" style={{ pointerEvents: "none" }}>
                  <circle cx={cx - 4} cy={cy - 4} r={1.6} stroke="#0f172a" strokeWidth={1.0} fill="none" opacity={0.34} style={{ pointerEvents: "none" }} />
                  <circle cx={cx + 5} cy={cy + 1} r={1.6} stroke="#0f172a" strokeWidth={1.0} fill="none" opacity={0.34} style={{ pointerEvents: "none" }} />
                  <circle cx={cx - 4} cy={cy - 4} r={1.2} fill="#f8fafc" opacity={0.8} style={{ pointerEvents: "none" }} />
                  <circle cx={cx + 5} cy={cy + 1} r={1.2} fill="#f8fafc" opacity={0.8} style={{ pointerEvents: "none" }} />
                </g>
              ) : seen && weather === "leaves" ? (
                <g className="sc-atlas-weather-leaves" style={{ pointerEvents: "none" }}>
                  <ellipse cx={cx - 4} cy={cy - 4} rx={2.8} ry={1.6} stroke="#0f172a" strokeWidth={1.0} fill="none" opacity={0.34} style={{ pointerEvents: "none" }} />
                  <ellipse cx={cx + 5} cy={cy + 1} rx={2.8} ry={1.6} stroke="#0f172a" strokeWidth={1.0} fill="none" opacity={0.34} style={{ pointerEvents: "none" }} />
                  <ellipse cx={cx - 4} cy={cy - 4} rx={2.2} ry={1.1} fill="#f59e0b" opacity={0.88} style={{ pointerEvents: "none" }} />
                  <ellipse cx={cx + 5} cy={cy + 1} rx={2.2} ry={1.1} fill="#d97706" opacity={0.88} style={{ pointerEvents: "none" }} />
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
                    <MiniCamp
                      cx={cx}
                      cy={cy}
                      isPlayer={occupant === "player"}
                      flagColor={occupant === "player" ? "#2563eb" : "#dc2626"}
                      isPosted={Boolean(state && getPostedGarrison(state, p.id).posted)}
                    />
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
                  {state && hasProvinceClash(state, p.id) ? (
                    <g className="sc-atlas-status-clash" style={{ pointerEvents: "none" }}>
                      <circle cx={cx} cy={cy - 6} r={7.5} fill="#ef4444" fillOpacity={0.25} stroke="#f87171" strokeWidth={0.8} />
                      <circle cx={cx - 3.5} cy={cy - 8.5} r={1.2} fill="#fef08a" />
                      <circle cx={cx + 3.5} cy={cy - 4.5} r={1.0} fill="#ffffff" />
                      <circle cx={cx} cy={cy - 3.5} r={0.8} fill="#fef08a" />
                    </g>
                  ) : null}
                  {state && hasProvinceIncoming(state, p.id) ? (
                    <g className="sc-atlas-status-incoming" style={{ pointerEvents: "none" }}>
                      <circle cx={cx + 8} cy={cy - 8} r={6.5} fill="#f97316" fillOpacity={0.25} stroke="#fb923c" strokeWidth={0.8} />
                      <polygon points={`${cx + 8},${cy - 11} ${cx + 10.5},${cy - 7} ${cx + 5.5},${cy - 7}`} fill="#ffedd5" />
                    </g>
                  ) : null}
                  {state && hasProvinceTrail(state, p.id) ? (
                    <g className="sc-atlas-status-trail" style={{ pointerEvents: "none" }}>
                      <circle cx={cx - 8} cy={cy - 8} r={5.5} fill="#fde68a" fillOpacity={0.22} stroke="#fde047" strokeWidth={0.7} />
                    </g>
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
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
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
            <g key={m.id} className="sc-atlas-march" style={{ pointerEvents: "none" }}>
              {/* Steady dark ink underlay so the route reads across snow, dark night and fog */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#0f172a"
                strokeWidth={4.2}
                strokeLinecap="round"
                opacity={0.65}
              />
              {/* Role / realm colored solid base path */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={1.8}
                strokeLinecap="round"
                opacity={0.85}
              />
              {/* Animated living marching dashed trail */}
              <line
                className="sc-atlas-march-trail"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#ffffff"
                strokeWidth={1.2}
                strokeDasharray="3 4"
                opacity={0.7}
              />
              {/* Living trailing dust puffs behind the marching column */}
              <g className="sc-atlas-march-dust" style={{ pointerEvents: "none" }}>
                <circle cx={mx - ux * 6} cy={my - uy * 6} r={1.6} fill="#d6d3d1" opacity={0.55} />
                <circle cx={mx - ux * 10} cy={my - uy * 10 - 0.5} r={1.2} fill="#cbd5e1" opacity={0.4} />
              </g>
              {/* Living trailing wake motes along march line */}
              <g className="sc-atlas-march-wake" style={{ pointerEvents: "none" }}>
                <circle cx={mx - ux * 4} cy={my - uy * 4} r={1.8} fill={stroke} opacity={0.65} style={{ pointerEvents: "none" }} />
                <circle cx={mx - ux * 8} cy={my - uy * 8} r={1.3} fill="#ffffff" opacity={0.55} style={{ pointerEvents: "none" }} />
                <circle cx={mx - ux * 12} cy={my - uy * 12} r={0.9} fill={stroke} opacity={0.35} style={{ pointerEvents: "none" }} />
              </g>
              {/* Living status aura breathing under the advancing column */}
              <ellipse
                className="sc-atlas-unit-pulse-glow"
                cx={mx}
                cy={my + 2.5}
                rx={8.5}
                ry={4.2}
                fill={stroke}
                fillOpacity={0.22}
                stroke={stroke}
                strokeWidth={0.8}
                style={{ pointerEvents: "none" }}
              />
              {/* Meeple base ink ring with role-colored rim */}
              <ellipse
                cx={mx}
                cy={my + 2.5}
                rx={6}
                ry={3}
                fill="#0f172a"
                fillOpacity={0.6}
                stroke={stroke}
                strokeWidth={0.8}
              />
              {/* Living marching meeple with step motion */}
              <g className="sc-atlas-march-meeple" style={{ pointerEvents: "none" }}>
                <circle cx={mx} cy={my} r={3.6} fill={stroke} stroke="#0f172a" strokeWidth={1} />
                {/* Fluttering march banner standard */}
                <g className="sc-atlas-march-banner" style={{ pointerEvents: "none" }}>
                  <line x1={mx} y1={my + 1} x2={mx} y2={my - 11} stroke="#78350f" strokeWidth={1} />
                  <polygon
                    points={`${mx},${my - 11} ${mx + 6},${my - 9.5} ${mx + 4},${my - 8} ${mx + 6},${my - 6.5} ${mx},${my - 6.5}`}
                    fill={stroke}
                    stroke="#0f172a"
                    strokeWidth={0.4}
                  />
                </g>
              </g>
              {hasEta && secs !== null ? (
                <g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>
                  <rect
                    x={mx - 10}
                    y={my - 18}
                    width={20}
                    height={10}
                    rx={3}
                    fill="#090d16"
                    stroke={stroke}
                    strokeWidth={0.8}
                  />
                  <text
                    x={mx}
                    y={my - 10.5}
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
        <MiniWeatherGlyph weather={weather} x={minX - 10} y={minY - 10} />
      </svg>
    </div>
  );
}
