import {
  getProvince,
  isProvinceSeen,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { useNowPlaying, type MusicSource, type NowPlaying } from "../nowPlaying";
import { boardTerrainElevation } from "./BoardRoads";
import "./board-living-accents.css";

export type AccentDayPhase = "dawn" | "day" | "dusk" | "night";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;
const BOARD_DAY_CYCLE_TICKS = 3600;
const MAX_KEEP_ACCENTS = 8;
const MAX_TERRAIN_ACCENTS = 10;

export interface KeepAccentPoint {
  id: string;
  wx: number;
  wy: number;
  isPlayer: boolean;
  glowColor: string;
  sparkColor: string;
  glowOpacity: number;
  delaySeconds: number;
}

export interface TerrainAccentPoint {
  id: string;
  terrain: Province["terrain"];
  kind: "mote" | "glint";
  wx: number;
  wy: number;
  color: string;
  opacity: number;
  radius: number;
  delaySeconds: number;
}

export type SelectionFeedbackTone = "player" | "rival" | "fog" | "neutral";

export interface ProvinceSelectionFeedback {
  provinceId: string;
  wx: number;
  wy: number;
  tone: SelectionFeedbackTone;
  edgeColor: string;
  cornerColor: string;
  rippleColor: string;
  sheenColor: string;
}

export interface AccentMusicTint {
  keepGlow: string;
  keepSpark: string;
  firefly: string;
  waterGlint: string;
  ridgeGlint: string;
  keepOpacity: number;
  terrainOpacity: number;
}

export interface BoardLivingAccentsProps {
  state: GameState;
  selectedId: string | null;
  dayPhase?: AccentDayPhase;
  nowPlayingOverride?: Pick<NowPlaying, "playing" | "source">;
}

function tileWorldCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function tileSeedDelay(x: number, y: number): number {
  return Number((((x * 7 + y * 13) % 11) * 0.42).toFixed(2));
}

/** Reads day phase standalone without importing BoardLiving (avoids circular deps). */
export function readAccentDayPhase(state?: GameState | null): AccentDayPhase {
  if (!state) return "day";
  const raw =
    (state as { dayPhase?: unknown }).dayPhase ??
    (state.flags as { dayPhase?: unknown; day_phase?: unknown } | undefined)?.dayPhase ??
    (state.flags as { dayPhase?: unknown; day_phase?: unknown } | undefined)?.day_phase;
  if (typeof raw === "string") {
    const norm = raw.toLowerCase().trim();
    if (norm === "dawn" || norm === "day" || norm === "dusk" || norm === "night") {
      return norm;
    }
  }
  const tick = typeof state.meta?.tick === "number" ? state.meta.tick : 0;
  const phaseTick = ((Math.floor(tick) % BOARD_DAY_CYCLE_TICKS) + BOARD_DAY_CYCLE_TICKS) % BOARD_DAY_CYCLE_TICKS;
  if (phaseTick < 540) return "dawn";
  if (phaseTick < 1980) return "day";
  if (phaseTick < 2520) return "dusk";
  return "night";
}

/** Resolves quiet ambient tint and opacity from time of day and active music. */
export function resolveAccentMusicTint(
  playing: boolean,
  source: MusicSource,
  phase: AccentDayPhase,
): AccentMusicTint {
  const isNight = phase === "night";
  const isTwilight = phase === "dawn" || phase === "dusk";

  let keepGlow = isNight ? "#fbbf24" : isTwilight ? "#f59e0b" : "#fde68a";
  let keepSpark = isNight ? "#fef08a" : "#fcd34d";
  let firefly = isNight ? "#fef08a" : isTwilight ? "#fde68a" : "#d9f99d";
  let waterGlint = isNight ? "#bae6fd" : "#e0f2fe";
  let ridgeGlint = isNight ? "#cbd5e1" : "#f8fafc";

  let keepOpacity = isNight ? 0.34 : isTwilight ? 0.25 : 0.16;
  let terrainOpacity = isNight ? 0.3 : isTwilight ? 0.24 : 0.18;

  if (playing) {
    keepOpacity = Math.min(0.4, keepOpacity + 0.04);
    terrainOpacity = Math.min(0.36, terrainOpacity + 0.04);
    if (source === "travis") {
      keepGlow = "#fbbf24";
      keepSpark = "#fef08a";
      firefly = "#fde68a";
      ridgeGlint = "#fef3c7";
    } else if (source === "lofi") {
      keepGlow = isNight ? "#f59e0b" : "#cbd5e1";
      firefly = "#c7d2fe";
      waterGlint = "#bae6fd";
      ridgeGlint = "#e2e8f0";
    } else if (source === "realm") {
      firefly = isNight ? "#bef264" : "#fde047";
    }
  }

  return {
    keepGlow,
    keepSpark,
    firefly,
    waterGlint,
    ridgeGlint,
    keepOpacity,
    terrainOpacity,
  };
}

/** Deterministic, sparse hearth glow points on seen keeps/outposts (capped at 8). */
export function listKeepAccents(
  state: GameState | null | undefined,
  phase: AccentDayPhase,
  nowPlaying: Pick<NowPlaying, "playing" | "source">,
): KeepAccentPoint[] {
  if (!state?.board?.provinces) return [];
  const homeId = state.board.homeProvinceId;
  const tint = resolveAccentMusicTint(nowPlaying.playing, nowPlaying.source, phase);
  const out: KeepAccentPoint[] = [];

  for (const p of state.board.provinces) {
    if (out.length >= MAX_KEEP_ACCENTS) break;
    const isPlayer = p.id === homeId || p.occupantRealmId === "player";
    const isKeepSite = p.id === homeId || p.node === "hold" || Boolean(p.occupantRealmId);
    if (!isKeepSite) continue;
    if (!isPlayer && !isProvinceSeen(state, p.id)) continue;

    const { wx, wy } = tileWorldCenter(p);
    out.push({
      id: p.id,
      wx,
      wy,
      isPlayer,
      glowColor: isPlayer ? tint.keepGlow : "#fb923c",
      sparkColor: isPlayer ? tint.keepSpark : "#fed7aa",
      glowOpacity: isPlayer ? tint.keepOpacity : Math.max(0.14, tint.keepOpacity * 0.78),
      delaySeconds: tileSeedDelay(p.x, p.y),
    });
  }
  return out;
}

/** Deterministic, sparse ambient micro-life on seen natural terrain (capped at 10). */
export function listTerrainAccents(
  state: GameState | null | undefined,
  phase: AccentDayPhase,
  nowPlaying: Pick<NowPlaying, "playing" | "source">,
): TerrainAccentPoint[] {
  if (!state?.board?.provinces) return [];
  const homeId = state.board.homeProvinceId;
  const tint = resolveAccentMusicTint(nowPlaying.playing, nowPlaying.source, phase);
  const out: TerrainAccentPoint[] = [];

  for (const p of state.board.provinces) {
    if (out.length >= MAX_TERRAIN_ACCENTS) break;
    if (p.id === homeId || p.node === "hold" || p.occupantRealmId) continue;
    if (!isProvinceSeen(state, p.id)) continue;

    const parity = (p.x * 3 + p.y * 5) % 4;
    if (p.terrain === "plain" && (p.x + p.y) % 3 !== 0) continue;
    if ((p.terrain === "waste" || p.terrain === "hill") && parity !== 0) continue;

    const center = tileWorldCenter(p);
    const dx = ((p.x * 5 + p.y) % 7) - 3;
    const dy = ((p.x + p.y * 3) % 5) - 4;
    const delaySeconds = tileSeedDelay(p.x, p.y);

    if (p.terrain === "wood") {
      out.push({
        id: p.id,
        terrain: p.terrain,
        kind: "mote",
        wx: center.wx + dx * 1.4,
        wy: center.wy - 2.5 + dy * 0.7,
        color: tint.firefly,
        opacity: tint.terrainOpacity,
        radius: 1.05,
        delaySeconds,
      });
    } else if (p.terrain === "shore") {
      out.push({
        id: p.id,
        terrain: p.terrain,
        kind: "glint",
        wx: center.wx + dx * 1.5,
        wy: center.wy + 1.5 + dy * 0.4,
        color: tint.waterGlint,
        opacity: tint.terrainOpacity * 0.92,
        radius: 0.95,
        delaySeconds,
      });
    } else if (p.terrain === "peak" || p.terrain === "hill") {
      out.push({
        id: p.id,
        terrain: p.terrain,
        kind: "glint",
        wx: center.wx + dx * 0.9,
        wy: center.wy - 4.5,
        color: tint.ridgeGlint,
        opacity: tint.terrainOpacity * 0.88,
        radius: 0.9,
        delaySeconds,
      });
    } else if (p.terrain === "plain") {
      out.push({
        id: p.id,
        terrain: p.terrain,
        kind: "mote",
        wx: center.wx + dx * 1.6,
        wy: center.wy - 1.5 + dy * 0.5,
        color: tint.firefly,
        opacity: tint.terrainOpacity * 0.72,
        radius: 0.85,
        delaySeconds,
      });
    }
  }
  return out;
}

/** Tactile selection highlight geometry & palette for the currently selected province. */
export function resolveProvinceSelectionFeedback(
  state: GameState | null | undefined,
  selectedId: string | null | undefined,
  nowPlaying: Pick<NowPlaying, "playing" | "source">,
): ProvinceSelectionFeedback | null {
  if (!state || !selectedId) return null;
  let prov: Province | undefined;
  try {
    prov = getProvince(state, selectedId);
  } catch {
    return null;
  }
  if (!prov) return null;

  const homeId = state.board?.homeProvinceId;
  const isPlayer = prov.id === homeId || prov.occupantRealmId === "player";
  const isSeen = isPlayer || isProvinceSeen(state, prov.id);

  let tone: SelectionFeedbackTone = "neutral";
  if (!isSeen) tone = "fog";
  else if (isPlayer) tone = "player";
  else if (prov.occupantRealmId) tone = "rival";

  const { wx, wy } = tileWorldCenter(prov);
  const brightBoost = nowPlaying.playing;

  if (tone === "player") {
    return {
      provinceId: prov.id,
      wx,
      wy,
      tone,
      edgeColor: brightBoost ? "#fef08a" : "#fde047",
      cornerColor: "#fbbf24",
      rippleColor: "#fde68a",
      sheenColor: "rgba(253, 224, 71, 0.24)",
    };
  }
  if (tone === "rival") {
    return {
      provinceId: prov.id,
      wx,
      wy,
      tone,
      edgeColor: "#fca5a5",
      cornerColor: "#f87171",
      rippleColor: "#fecaca",
      sheenColor: "rgba(248, 113, 113, 0.20)",
    };
  }
  if (tone === "fog") {
    return {
      provinceId: prov.id,
      wx,
      wy,
      tone,
      edgeColor: "#e2e8f0",
      cornerColor: "#94a3b8",
      rippleColor: "#cbd5e1",
      sheenColor: "rgba(148, 163, 184, 0.16)",
    };
  }
  return {
    provinceId: prov.id,
    wx,
    wy,
    tone,
    edgeColor: brightBoost ? "#fef3c7" : "#fef08a",
    cornerColor: "#e4b248",
    rippleColor: "#fde68a",
    sheenColor: "rgba(254, 240, 138, 0.18)",
  };
}

/**
 * Quiet ambient terrain/keep accents + tactile province selection feedback.
 * Pointer-events none, read-only against state, theme.css & hit-testing untouched.
 */
export function BoardLivingAccents({
  state,
  selectedId,
  dayPhase,
  nowPlayingOverride,
}: BoardLivingAccentsProps) {
  const liveNp = useNowPlaying();
  const np = nowPlayingOverride ?? liveNp;
  const phase = dayPhase ?? readAccentDayPhase(state);
  const keepAccents = listKeepAccents(state, phase, np);
  const terrainAccents = listTerrainAccents(state, phase, np);
  const selection = resolveProvinceSelectionFeedback(state, selectedId, np);

  return (
    <g
      className={`sc-board-living-accents phase-${phase} source-${np.source} ${np.playing ? "is-music-playing" : "is-music-idle"}`}
      data-day-phase={phase}
      data-music-playing={np.playing ? "true" : "false"}
      data-music-source={np.source}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {/* Keep hearth glow & subtle sparks */}
      {keepAccents.length > 0 && (
        <g className="sc-board-accent-keeps" style={{ pointerEvents: "none" }}>
          {keepAccents.map((k) => (
            <g key={`kaccent-${k.id}`} data-province-id={k.id} style={{ pointerEvents: "none" }}>
              <ellipse
                cx={k.wx}
                cy={k.wy + 0.5}
                rx={k.isPlayer ? 13 : 10}
                ry={k.isPlayer ? 6.5 : 5}
                fill={k.glowColor}
                fillOpacity={k.glowOpacity}
                className="sc-board-accent-keep-glow"
                style={{ animationDelay: `-${k.delaySeconds}s` }}
              />
              <circle
                cx={k.wx + 3.2}
                cy={k.wy - 4.5}
                r={k.isPlayer ? 1.05 : 0.85}
                fill={k.sparkColor}
                fillOpacity={Math.min(0.65, k.glowOpacity + 0.22)}
                className="sc-board-accent-keep-spark"
                style={{ animationDelay: `-${(k.delaySeconds + 0.9).toFixed(2)}s` }}
              />
            </g>
          ))}
        </g>
      )}

      {/* Quiet natural terrain micro-life */}
      {terrainAccents.length > 0 && (
        <g className="sc-board-accent-terrain" style={{ pointerEvents: "none" }}>
          {terrainAccents.map((t) => (
            <circle
              key={`taccent-${t.id}`}
              cx={t.wx}
              cy={t.wy}
              r={t.radius}
              fill={t.color}
              fillOpacity={t.opacity}
              className={`sc-board-accent-terrain-mote${t.kind === "glint" ? " is-glint" : ""}`}
              data-terrain={t.terrain}
              style={{ animationDelay: `-${t.delaySeconds}s` }}
            />
          ))}
        </g>
      )}

      {/* Tactile province selection feedback */}
      {selection && (
        <g
          key={`sel-${selection.provinceId}`}
          className={`sc-board-select-feedback tone-${selection.tone}`}
          data-selected-province={selection.provinceId}
          style={{ pointerEvents: "none" }}
        >
          {/* Soft isometric inner sheen */}
          <polygon
            points={`${selection.wx},${selection.wy - BOARD_HALF_H} ${selection.wx + BOARD_HALF_W},${selection.wy} ${selection.wx},${selection.wy + BOARD_HALF_H} ${selection.wx - BOARD_HALF_W},${selection.wy}`}
            fill={selection.sheenColor}
            className="sc-board-select-sheen"
          />
          {/* One-shot settle ripple on selection change */}
          <polygon
            points={`${selection.wx},${selection.wy - BOARD_HALF_H} ${selection.wx + BOARD_HALF_W},${selection.wy} ${selection.wx},${selection.wy + BOARD_HALF_H} ${selection.wx - BOARD_HALF_W},${selection.wy}`}
            fill="none"
            stroke={selection.rippleColor}
            strokeWidth="1.2"
            className="sc-board-select-ripple"
          />
          {/* Lifted sunward bevel edge highlight */}
          <polyline
            points={`${selection.wx - BOARD_HALF_W + 1},${selection.wy} ${selection.wx},${selection.wy - BOARD_HALF_H + 0.6} ${selection.wx + BOARD_HALF_W - 1},${selection.wy}`}
            fill="none"
            stroke={selection.edgeColor}
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sc-board-select-edge"
          />
          {/* Crisp isometric vertex focus ticks (N / E / S / W) */}
          <path
            d={`M ${selection.wx - 4} ${selection.wy - BOARD_HALF_H + 2} L ${selection.wx} ${selection.wy - BOARD_HALF_H} L ${selection.wx + 4} ${selection.wy - BOARD_HALF_H + 2}`}
            fill="none"
            stroke={selection.cornerColor}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sc-board-select-corner"
          />
          <path
            d={`M ${selection.wx - 4} ${selection.wy + BOARD_HALF_H - 2} L ${selection.wx} ${selection.wy + BOARD_HALF_H} L ${selection.wx + 4} ${selection.wy + BOARD_HALF_H - 2}`}
            fill="none"
            stroke={selection.cornerColor}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sc-board-select-corner"
          />
          <path
            d={`M ${selection.wx - BOARD_HALF_W + 3.5} ${selection.wy - 1.8} L ${selection.wx - BOARD_HALF_W} ${selection.wy} L ${selection.wx - BOARD_HALF_W + 3.5} ${selection.wy + 1.8}`}
            fill="none"
            stroke={selection.cornerColor}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sc-board-select-corner"
          />
          <path
            d={`M ${selection.wx + BOARD_HALF_W - 3.5} ${selection.wy - 1.8} L ${selection.wx + BOARD_HALF_W} ${selection.wy} L ${selection.wx + BOARD_HALF_W - 3.5} ${selection.wy + 1.8}`}
            fill="none"
            stroke={selection.cornerColor}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sc-board-select-corner"
          />
        </g>
      )}
    </g>
  );
}
