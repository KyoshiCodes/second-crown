import React from "react";
import {
  BOARD_H,
  BOARD_W,
  listMarches,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { realmTokenPalette } from "@second-crown/render";

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

function MiniKeep(props: { cx: number; cy: number; fill: string; roof: string; home: boolean }) {
  const { cx, cy, fill, roof, home } = props;
  return (
    <g>
      <rect x={cx - 7} y={cy - 6} width={14} height={8} fill="#1a120c" opacity={0.45} />
      <rect x={cx - 6} y={cy - 14} width={12} height={10} fill={fill} stroke="#e8dcc8" strokeWidth={0.6} />
      <rect x={cx - 7} y={cy - 16} width={3} height={3} fill={fill} />
      <rect x={cx - 1.5} y={cy - 16} width={3} height={3} fill={fill} />
      <rect x={cx + 4} y={cy - 16} width={3} height={3} fill={fill} />
      <polygon points={`${cx - 8},${cy - 16} ${cx},${cy - 26} ${cx + 8},${cy - 16}`} fill={roof} stroke="#111" strokeWidth={0.4} />
      <rect x={cx - 1.5} y={cy - 8} width={3} height={4} fill="#111" />
      {home ? <circle cx={cx + 5} cy={cy - 22} r={1.6} fill="#fde047" /> : null}
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
          const top = selected ? "#d4a72c" : occupant ? accent : paint.top;
          const hw = TILE_W / 2;
          const hh = TILE_H / 2;
          const lift = paint.lift;
          return (
            <g
              key={p.id}
              filter="url(#atlas-shade)"
              style={{ cursor: "pointer" }}
              onClick={() => selectProvince(p.id)}
            >
              <polygon
                points={`${cx - hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + lift} ${cx - hw},${cy + lift}`}
                fill={paint.left}
              />
              <polygon
                points={`${cx + hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + lift} ${cx + hw},${cy + lift}`}
                fill={paint.right}
              />
              <polygon
                points={diamond(cx, cy)}
                fill={top}
                stroke={isHome ? "#fde047" : selected ? "#facc15" : "#1a140c"}
                strokeWidth={selected ? 2.2 : isHome ? 1.6 : 0.6}
                opacity={0.95}
              />
              {selected ? (
                <g className="sc-atlas-select-rim" pointerEvents="none">
                  {/* Ground ring at base */}
                  <polygon
                    points={diamond(cx, cy + lift)}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={3.5}
                    opacity={0.5}
                  />
                  <polygon
                    points={diamond(cx, cy + lift)}
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
              {p.node === "hold" ? (
                <MiniKeep cx={cx} cy={cy} fill={wall} roof={isHome ? "#ca8a04" : accent} home={isHome} />
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
              <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={4} fill={stroke} stroke="#111" />
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}
