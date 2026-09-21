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

function terrainPaint(p: Province): { top: string; side: string; lift: number } {
  if (p.node === "hold") return { top: "#6a5340", side: "#3a2c22", lift: 14 };
  switch (p.terrain) {
    case "peak":
      return { top: "#8a8f86", side: "#4a4e48", lift: 16 };
    case "hill":
      return { top: "#6b7a4a", side: "#3f4a2c", lift: 10 };
    case "wood":
      return { top: "#2f5a38", side: "#1c3822", lift: 6 };
    case "plain":
      return { top: "#5c7a3a", side: "#3a4e24", lift: 3 };
    case "waste":
      return { top: "#c2a36a", side: "#8a7040", lift: 2 };
    case "shore":
      return { top: "#2a6a7a", side: "#163e48", lift: 1 };
    default:
      return { top: "#4a5c38", side: "#2c3822", lift: 4 };
  }
}

export function OverworldAtlas(props: {
  state: GameState | undefined;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { state, selectedId, onSelect } = props;
  if (!state) return null;
  const provinces = state.board.provinces;
  const origin = iso(0, BOARD_H - 1);
  const width = BOARD_W * TILE_W + 80;
  const height = (BOARD_W + BOARD_H) * (TILE_H / 2) + 90;
  const ox = width / 2;
  const oy = 36;
  const marches = listMarches(state);
  const homeId = state.board.homeProvinceId;

  return (
    <div className="sc-overworld-atlas" style={{ margin: "0 0 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <strong style={{ color: "#fef08a", fontSize: 14 }}>Kingdom Atlas</strong>
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          Zoom-out board · pixel holds sit on raised 3D tiles · click a province
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{
          display: "block",
          background: "radial-gradient(ellipse at 50% 30%, #1c2830 0%, #0c1014 70%)",
          border: "1px solid #78531e",
          borderRadius: 10,
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
        }}
      >
        <defs>
          <filter id="atlas-shade" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>
        {provinces.map((p) => {
          const pos = iso(p.x, p.y);
          const cx = ox + pos.x - origin.x;
          const cy = oy + pos.y;
          const paint = terrainPaint(p);
          const occupant = p.occupantRealmId;
          const pal = occupant ? realmTokenPalette(occupant) : null;
          const isHome = p.id === homeId || occupant === "player";
          const selected = selectedId === p.id;
          const top = selected ? "#d4a72c" : pal?.accentColor ?? paint.top;
          return (
            <g
              key={p.id}
              filter="url(#atlas-shade)"
              style={{ cursor: "pointer" }}
              onClick={() => onSelect?.(p.id)}
            >
              <polygon points={diamond(cx, cy + paint.lift)} fill={paint.side} />
              <polygon
                points={diamond(cx, cy)}
                fill={top}
                stroke={isHome ? "#fde047" : selected ? "#fff7c2" : "#1a140c"}
                strokeWidth={isHome || selected ? 1.6 : 0.6}
                opacity={0.95}
              />
              {p.node === "hold" ? (
                <g>
                  <rect x={cx - 5} y={cy - 16} width={10} height={10} fill="#2a1c12" stroke="#e8dcc8" strokeWidth={0.6} />
                  <polygon points={`${cx - 7},${cy - 16} ${cx},${cy - 24} ${cx + 7},${cy - 16}`} fill={isHome ? "#ca8a04" : pal?.accentColor ?? "#8b5a2b"} />
                </g>
              ) : p.node && p.node !== "none" ? (
                <circle cx={cx} cy={cy - 2} r={3.2} fill="#fbbf24" stroke="#111" strokeWidth={0.5} />
              ) : null}
            </g>
          );
        })}
        {marches.map((m) => {
          const from = provinces.find((p) => p.id === m.fromId);
          const to = provinces.find((p) => p.id === m.toId);
          if (!from || !to) return null;
          const a = iso(from.x, from.y);
          const b = iso(to.x, to.y);
          const x1 = ox + a.x - origin.x;
          const y1 = oy + a.y;
          const x2 = ox + b.x - origin.x;
          const y2 = oy + b.y;
          const pal = realmTokenPalette(m.realmId);
          return (
            <g key={m.id}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={pal.accentColor} strokeWidth={2} strokeDasharray="4 3" opacity={0.85} />
              <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={4} fill={pal.accentColor} stroke="#111" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
