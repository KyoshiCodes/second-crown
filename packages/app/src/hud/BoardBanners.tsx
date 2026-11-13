import React from "react";
import { isProvinceSeen, type GameState, type Province } from "@second-crown/sim";
import {
  getPostedGarrison,
  realmTokenPalette,
  resolveAtmosphereWeather,
} from "@second-crown/render";
import "./board-banners.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

function gridToWorld(bx: number, by: number): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (bx - by) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (bx + by) * BOARD_HALF_H,
  };
}

function toHexColor(value: number | string | undefined, fallback: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `#${(value >>> 0).toString(16).padStart(6, "0")}`;
  }
  return fallback;
}

export interface BannerRealmColors {
  realmId: string;
  isPlayer: boolean;
  pennant: string;
  accent: string;
  border: string;
  stud: string;
  pole: string;
}

/**
 * Resolves canonical heraldic banner colors for the player or any rival realm.
 */
export function resolveBannerRealmColors(
  realmId: string | null | undefined,
  isPlayer = false,
): BannerRealmColors {
  if (isPlayer || realmId === "player") {
    return {
      realmId: "player",
      isPlayer: true,
      pennant: "#1d4ed8",
      accent: "#fbbf24",
      border: "#fef08a",
      stud: "#fde047",
      pole: "#78350f",
    };
  }
  const id = realmId || "rival";
  const pal = realmTokenPalette(id);
  return {
    realmId: id,
    isPlayer: false,
    pennant: toHexColor(pal.pennantColor, "#991b1b"),
    accent: toHexColor(pal.accentColor, "#fca5a5"),
    border: toHexColor(pal.borderColor, "#dc2626"),
    stud: toHexColor(pal.studColor, "#fbbf24"),
    pole: "#451a03",
  };
}

function tileDelayStyle(x: number, y: number): React.CSSProperties {
  const delaySec = (((x * 5 + y * 3) % 7) * 0.31).toFixed(2);
  return { pointerEvents: "none", animationDelay: `${delaySec}s` };
}

export interface BoardBannersProps {
  state: GameState | undefined;
}

/**
 * Living animated keep banners and outpost flags rendered atop seen keeps and camps
 * on the isometric board, fluttering with realm-accurate heraldry and weather response.
 */
export function BoardBanners({ state }: BoardBannersProps) {
  if (!state) return null;

  const provinces = state.board?.provinces ?? [];
  const homeId = state.board?.homeProvinceId;
  const weather = resolveAtmosphereWeather(state);
  const windClass =
    weather === "storm" ? "is-storm" : weather === "rain" || weather === "snow" ? "is-windy" : "is-calm";

  const keepBanners: Array<{
    id: string;
    p: Province;
    wx: number;
    wy: number;
    colors: BannerRealmColors;
  }> = [];

  const outpostFlags: Array<{
    id: string;
    p: Province;
    wx: number;
    wy: number;
    colors: BannerRealmColors;
    isPosted: boolean;
  }> = [];

  for (const p of provinces) {
    const isHome = p.id === homeId;
    const isSeen = isHome || isProvinceSeen(state, p.id);
    if (!isSeen) continue;

    const { wx, wy } = gridToWorld(p.x, p.y);
    const isHold = p.node === "hold" || isHome;

    if (isHold) {
      const isPlayer = isHome || p.occupantRealmId === "player";
      const colors = resolveBannerRealmColors(p.occupantRealmId, isPlayer);
      keepBanners.push({ id: p.id, p, wx, wy, colors });
      continue;
    }

    const isOutpostOrCamp = p.node === "camp" || Boolean(p.occupantRealmId);
    if (isOutpostOrCamp) {
      const isPlayer = p.occupantRealmId === "player";
      const colors = resolveBannerRealmColors(p.occupantRealmId, isPlayer);
      const isPosted = isPlayer ? Boolean(getPostedGarrison(state, p.id).posted) : false;
      outpostFlags.push({ id: p.id, p, wx, wy, colors, isPosted });
    }
  }

  if (keepBanners.length === 0 && outpostFlags.length === 0) return null;

  return (
    <g
      className={`sc-board-living-banners ${windClass}`}
      data-weather={weather}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {/* 1. Outpost Flags & Rival Camp Pennants */}
      {outpostFlags.map((flag) => {
        const delay = tileDelayStyle(flag.p.x, flag.p.y);
        const mx = flag.wx + 5.5;
        const my = flag.wy - 2;
        return (
          <g
            key={`bflag-${flag.id}`}
            className={`sc-board-outpost-flag ${flag.colors.isPlayer ? "is-player" : "is-rival"} ${flag.isPosted ? "is-posted" : ""}`}
            data-province-id={flag.id}
            data-realm={flag.colors.realmId}
            style={{ pointerEvents: "none" }}
          >
            {/* Mast shadow */}
            <line
              x1={mx + 0.6}
              y1={my + 1}
              x2={mx + 0.6}
              y2={my - 11.5}
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            {/* Flagpole mast */}
            <line
              x1={mx}
              y1={my}
              x2={mx}
              y2={my - 12}
              stroke={flag.colors.pole}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            {/* Finial ball */}
            <circle cx={mx} cy={my - 12.6} r={1.15} fill={flag.colors.stud} stroke="#0f172a" strokeWidth="0.35" />
            <circle
              cx={mx}
              cy={my - 12.6}
              r={0.45}
              fill="#ffffff"
              className="sc-board-banner-finial-glint"
              style={delay}
            />
            {/* Fluttering outpost pennant */}
            <g className="sc-board-flag-cloth" style={delay}>
              <polygon
                points={`${mx},${my - 12} ${mx + 8.5},${my - 9.8} ${mx + 6.4},${my - 8} ${mx + 8.5},${my - 6.2} ${mx},${my - 6.2}`}
                fill={flag.colors.pennant}
                stroke={flag.colors.border}
                strokeWidth="0.55"
                strokeLinejoin="round"
              />
              {/* Realm accent chevron */}
              <polygon
                points={`${mx + 1.8},${my - 10.2} ${mx + 4.4},${my - 8.1} ${mx + 1.8},${my - 6.8} ${mx + 3.1},${my - 6.8} ${mx + 5.5},${my - 8.1} ${mx + 3.1},${my - 10.2}`}
                fill={flag.colors.accent}
              />
            </g>
            {/* Trailing garrison honor ribbon when posted */}
            {flag.isPosted && (
              <path
                d={`M ${mx} ${my - 6.1} Q ${mx + 3.2} ${my - 4.8} ${mx + 6.5} ${my - 5.4}`}
                fill="none"
                stroke={flag.colors.stud}
                strokeWidth="0.85"
                strokeLinecap="round"
                className="sc-board-flag-ribbon"
                style={delay}
              />
            )}
          </g>
        );
      })}

      {/* 2. Keep Heraldic Banners */}
      {keepBanners.map((kb) => {
        const delay = tileDelayStyle(kb.p.x, kb.p.y);
        const mx = kb.wx;
        const my = kb.wy - 21;
        return (
          <g
            key={`kbanner-${kb.id}`}
            className={`sc-board-keep-banner ${kb.colors.isPlayer ? "is-player" : "is-rival"}`}
            data-province-id={kb.id}
            data-realm={kb.colors.realmId}
            style={{ pointerEvents: "none" }}
          >
            {/* Spire mast shadow */}
            <line
              x1={mx + 0.7}
              y1={my + 1}
              x2={mx + 0.7}
              y2={my - 12.5}
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.3"
            />
            {/* Spire mast */}
            <line
              x1={mx}
              y1={my}
              x2={mx}
              y2={my - 13}
              stroke={kb.colors.pole}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Gilded finial orb */}
            <circle cx={mx} cy={my - 13.7} r={1.3} fill={kb.colors.stud} stroke="#0f172a" strokeWidth="0.4" />
            <circle
              cx={mx}
              cy={my - 13.7}
              r={0.5}
              fill="#ffffff"
              className="sc-board-banner-finial-glint"
              style={delay}
            />
            {/* Trailing secondary streamer */}
            <path
              d={`M ${mx} ${my - 6.8} Q ${mx + 5} ${my - 5.2} ${mx + 10.5} ${my - 6.4}`}
              fill="none"
              stroke={kb.colors.accent}
              strokeWidth="1.0"
              strokeLinecap="round"
              className="sc-board-banner-ribbon"
              style={delay}
            />
            {/* Primary fluttering swallowtail banner */}
            <g className="sc-board-banner-cloth" style={delay}>
              <polygon
                points={`${mx},${my - 13} ${mx + 10.5},${my - 10.8} ${mx + 8},${my - 9} ${mx + 10.5},${my - 7.2} ${mx},${my - 7.2}`}
                fill={kb.colors.pennant}
                stroke={kb.colors.border}
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
              {/* Inner heraldic stripe / charge */}
              <polygon
                points={`${mx + 1.5},${my - 11.1} ${mx + 6.4},${my - 9.8} ${mx + 5.2},${my - 9} ${mx + 6.4},${my - 8.2} ${mx + 1.5},${my - 8.2}`}
                fill={kb.colors.accent}
                opacity="0.92"
              />
              {/* Hoist stud */}
              <circle cx={mx + 1.8} cy={my - 9.6} r={0.7} fill={kb.colors.stud} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

export { BoardBanners as BoardKeepBanners };
