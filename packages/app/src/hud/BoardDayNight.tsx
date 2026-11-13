import type { CSSProperties } from "react";
import {
  isProvinceSeen,
  type GameState,
} from "@second-crown/sim";
import "./board-day-night.css";

export type BoardDayNightPhase = "dawn" | "day" | "dusk" | "night";

const DAY_CYCLE_TICKS = 3600;

export function resolveDayNightPhase(state?: GameState | null): BoardDayNightPhase {
  if (!state) return "day";
  const explicit =
    (state as { dayPhase?: unknown; flags?: Record<string, unknown> }).dayPhase ??
    state.flags?.dayPhase ??
    state.flags?.day_phase;
  if (typeof explicit === "string") {
    const norm = explicit.toLowerCase().trim();
    if (norm === "dawn" || norm === "day" || norm === "dusk" || norm === "night") {
      return norm;
    }
  }
  const rawTick = typeof state.meta?.tick === "number" ? state.meta.tick : 0;
  const t = ((Math.floor(rawTick) % DAY_CYCLE_TICKS) + DAY_CYCLE_TICKS) % DAY_CYCLE_TICKS;
  if (t < 540) return "dawn";
  if (t < 1980) return "day";
  if (t < 2520) return "dusk";
  return "night";
}

export interface DayNightWashDescriptor {
  phase: BoardDayNightPhase;
  isNight: boolean;
  label: string;
  washTop: string;
  washBottom: string;
  washTopOpacity: number;
  washBottomOpacity: number;
  tileFill: string;
  tileOpacity: number;
}

export interface BuildingLanternPoint {
  key: string;
  buildingId: string;
  typeId: string;
  provinceId: string;
  wx: number;
  wy: number;
  delaySec: number;
}

const CANVAS_W = 560;
const CANVAS_H = 360;
const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

function boardGridToWorld(bx: number, by: number): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (bx - by) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (bx + by) * BOARD_HALF_H,
  };
}

const DAY_NIGHT_PALETTE: Record<BoardDayNightPhase, DayNightWashDescriptor> = {
  dawn: {
    phase: "dawn",
    isNight: false,
    label: "Warm Dawn Wash",
    washTop: "#fde68a",
    washBottom: "#fb923c",
    washTopOpacity: 0.14,
    washBottomOpacity: 0.07,
    tileFill: "#fcd34d",
    tileOpacity: 0.1,
  },
  day: {
    phase: "day",
    isNight: false,
    label: "Warm Daylight Wash",
    washTop: "#fef08a",
    washBottom: "#fde047",
    washTopOpacity: 0.12,
    washBottomOpacity: 0.05,
    tileFill: "#fef08a",
    tileOpacity: 0.1,
  },
  dusk: {
    phase: "dusk",
    isNight: false,
    label: "Amber Dusk Wash",
    washTop: "#fb923c",
    washBottom: "#6366f1",
    washTopOpacity: 0.15,
    washBottomOpacity: 0.11,
    tileFill: "#fdba74",
    tileOpacity: 0.11,
  },
  night: {
    phase: "night",
    isNight: true,
    label: "Cool Night Wash",
    washTop: "#1e3a8a",
    washBottom: "#0f172a",
    washTopOpacity: 0.28,
    washBottomOpacity: 0.24,
    tileFill: "#38bdf8",
    tileOpacity: 0.14,
  },
};

const LANTERN_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: -7.5, dy: -2.2 },
  { dx: 7.5, dy: -2.2 },
  { dx: -10.5, dy: 2.0 },
  { dx: 10.5, dy: 2.0 },
  { dx: -4.2, dy: 4.5 },
  { dx: 4.2, dy: 4.5 },
  { dx: 0, dy: -5.5 },
  { dx: 0, dy: 6.2 },
];

export function resolveDayNightDescriptor(state: GameState): DayNightWashDescriptor {
  const phase = resolveDayNightPhase(state);
  return DAY_NIGHT_PALETTE[phase];
}

export function listFinishedBuildingLanterns(state: GameState): BuildingLanternPoint[] {
  const provinces = state.board?.provinces ?? [];
  const buildings = state.buildings ?? [];
  const homeId = state.board?.homeProvinceId;
  const result: BuildingLanternPoint[] = [];

  const provinceById = new Map(provinces.map((p) => [p.id, p]));
  const holdByRealm = new Map<string, string>();
  if (homeId) holdByRealm.set("player", homeId);
  for (const p of provinces) {
    if (p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player") {
      if (!holdByRealm.has(p.occupantRealmId)) {
        holdByRealm.set(p.occupantRealmId, p.id);
      }
    }
  }

  const perProvinceCount = new Map<string, number>();
  for (const b of buildings) {
    if (b.completesAtTick !== null) continue;
    const provinceId = holdByRealm.get(b.realmId);
    if (!provinceId || !isProvinceSeen(state, provinceId)) continue;
    const prov = provinceById.get(provinceId);
    if (!prov) continue;

    const slotIdx = perProvinceCount.get(provinceId) ?? 0;
    if (slotIdx >= LANTERN_OFFSETS.length) continue;
    perProvinceCount.set(provinceId, slotIdx + 1);

    const { wx, wy } = boardGridToWorld(prov.x, prov.y);
    const offset = LANTERN_OFFSETS[slotIdx];
    result.push({
      key: `lantern-${b.id}`,
      buildingId: b.id,
      typeId: b.typeId,
      provinceId,
      wx: wx + offset.dx,
      wy: wy + offset.dy,
      delaySec: ((slotIdx * 0.47 + prov.x * 0.31 + prov.y * 0.23) % 3.2),
    });
  }

  return result;
}

export interface BoardDayNightProps {
  state: GameState;
}

export function BoardDayNight({ state }: BoardDayNightProps) {
  const desc = resolveDayNightDescriptor(state);
  const provinces = state.board?.provinces ?? [];
  const seenProvs = provinces.filter((p) => isProvinceSeen(state, p.id));
  const lanterns = desc.isNight ? listFinishedBuildingLanterns(state) : [];

  const washGradId = `sc-board-day-night-grad-${desc.phase}`;
  const lanternGradId = "sc-board-day-night-lantern-grad";

  return (
    <g
      className={`sc-board-day-night is-${desc.phase}`}
      data-phase={desc.phase}
      data-night={desc.isNight ? "true" : "false"}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id={washGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={desc.washTop} stopOpacity={desc.washTopOpacity} />
          <stop offset="100%" stopColor={desc.washBottom} stopOpacity={desc.washBottomOpacity} />
        </linearGradient>
        <radialGradient id={lanternGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.88" />
          <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle day-night atmospheric wash across the board */}
      <rect
        x={0}
        y={0}
        width={CANVAS_W}
        height={CANVAS_H}
        fill={`url(#${washGradId})`}
        className="sc-board-day-night-wash"
        style={{ pointerEvents: "none" }}
      />

      {/* Per-tile warm daylight / cool night tint on seen isometric tiles */}
      {seenProvs.map((p) => {
        const { wx, wy } = boardGridToWorld(p.x, p.y);
        const points = `${wx},${wy - BOARD_HALF_H} ${wx + BOARD_HALF_W},${wy} ${wx},${wy + BOARD_HALF_H} ${wx - BOARD_HALF_W},${wy}`;
        return (
          <polygon
            key={`dn-tile-${p.id}`}
            points={points}
            fill={desc.tileFill}
            fillOpacity={desc.tileOpacity}
            className="sc-board-day-night-tile"
            style={{ pointerEvents: "none" }}
          />
        );
      })}

      {/* Soft lantern glows on finished buildings at night */}
      {lanterns.length > 0 && (
        <g
          className="sc-board-day-night-lanterns"
          aria-hidden="true"
          style={{ pointerEvents: "none" }}
        >
          {lanterns.map((l) => {
            const delayStyle: CSSProperties = {
              animationDelay: `-${l.delaySec.toFixed(2)}s`,
              pointerEvents: "none",
            };
            return (
              <g
                key={l.key}
                className="sc-board-day-night-lantern"
                data-building-id={l.buildingId}
                data-building-type={l.typeId}
                data-province-id={l.provinceId}
                style={{ pointerEvents: "none" }}
              >
                <ellipse
                  cx={l.wx}
                  cy={l.wy}
                  rx={6.4}
                  ry={3.4}
                  fill={`url(#${lanternGradId})`}
                  className="sc-board-day-night-lantern-bloom"
                  style={delayStyle}
                />
                <circle
                  cx={l.wx}
                  cy={l.wy - 0.6}
                  r={1.15}
                  fill="#fef08a"
                  className="sc-board-day-night-lantern-core"
                  style={delayStyle}
                />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}
