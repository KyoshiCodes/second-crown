import React from "react";
import {
  getProvince,
  isProvinceSeen,
  warImagerySnapshot,
  type GameState,
  type Province,
  type WarPhaseId,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./war-join-imagery.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

const WAR_IMAGERY_CAP = 4;

export interface BoardWarImageryItem {
  warId: string;
  attackerRealmId: string;
  defenderRealmId: string;
  allyRealmId: string | null;
  attackerKit: LivingCultureKit;
  defenderKit: LivingCultureKit;
  allyKit: LivingCultureKit | null;
  phase: WarPhaseId;
  active: boolean;
  player: boolean;
  banner: string;
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  aBannerX: number;
  aBannerY: number;
  dBannerX: number;
  dBannerY: number;
  cx: number;
  cy: number;
  midX: number;
  midY: number;
  pillX: number;
  pillY: number;
  pillW: number;
  delaySeconds: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function findHoldForRealm(state: GameState, realmId: string): Province | undefined {
  if (realmId === "player") return getProvince(state, state.board.homeProvinceId);
  return state.board.provinces.find(
    (p) => p.node === "hold" && p.occupantRealmId === realmId,
  );
}

function trimBanner(text: string): string {
  const max = 48;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Projects `warImagerySnapshot(state)` entries onto seen isometric holds with opposing
 * culture banner coordinates, a short phase line, and a calm banner pill label.
 */
export function listBoardWarImagery(
  state: GameState | null | undefined,
): BoardWarImageryItem[] {
  if (!state?.board?.provinces || !state.flags || !state.meta || !Array.isArray(state.wars)) {
    return [];
  }

  const snap = warImagerySnapshot(state);
  if (snap.length === 0) return [];

  // Prioritize player wars while keeping state order within player/NPC groups.
  const ordered = [
    ...snap.filter((w) => w.player),
    ...snap.filter((w) => !w.player),
  ];

  const out: BoardWarImageryItem[] = [];
  const seenWarIds = new Set<string>();

  for (let i = 0; i < ordered.length && out.length < WAR_IMAGERY_CAP; i++) {
    const entry = ordered[i];
    if (seenWarIds.has(entry.warId)) continue;

    const aHold = findHoldForRealm(state, entry.attackerRealmId);
    const dHold = findHoldForRealm(state, entry.defenderRealmId);
    if (!aHold || !dHold) continue;

    if (
      !entry.player &&
      !isProvinceSeen(state, aHold.id) &&
      !isProvinceSeen(state, dHold.id)
    ) {
      continue;
    }

    seenWarIds.add(entry.warId);
    const aPos = tileCenter(aHold);
    const dPos = tileCenter(dHold);
    const dxVec = dPos.wx - aPos.wx;
    const dyVec = dPos.wy - aPos.wy;
    const dist = Math.hypot(dxVec, dyVec) || 1;
    const ux = dxVec / dist;
    const uy = dyVec / dist;
    const offset = Math.min(13, dist * 0.24);

    const aBannerX = Number((aPos.wx + ux * offset).toFixed(1));
    const aBannerY = Number((aPos.wy + uy * offset - 4).toFixed(1));
    const dBannerX = Number((dPos.wx - ux * offset).toFixed(1));
    const dBannerY = Number((dPos.wy - uy * offset - 4).toFixed(1));

    const cx = Number(((aBannerX + dBannerX) * 0.5).toFixed(1));
    const cy = Number((Math.min(aBannerY, dBannerY) - 9).toFixed(1));
    const midX = cx;
    const midY = Number((0.25 * aBannerY + 0.5 * cy + 0.25 * dBannerY).toFixed(1));

    const banner = trimBanner(entry.banner);
    const pillW = Math.max(54, Math.min(156, banner.length * 3.1 + 12));
    const pillX = Number(Math.max(46, Math.min(514, midX)).toFixed(1));
    const pillY = Number(Math.max(14, Math.min(344, midY - 11)).toFixed(1));

    out.push({
      warId: entry.warId,
      attackerRealmId: entry.attackerRealmId,
      defenderRealmId: entry.defenderRealmId,
      allyRealmId: entry.allyRealmId,
      attackerKit: resolveLivingCultureKit(state, entry.attackerRealmId),
      defenderKit: resolveLivingCultureKit(state, entry.defenderRealmId),
      allyKit: entry.allyRealmId
        ? resolveLivingCultureKit(state, entry.allyRealmId)
        : null,
      phase: entry.phase,
      active: entry.active,
      player: entry.player,
      banner,
      ax: Number(aPos.wx.toFixed(1)),
      ay: Number(aPos.wy.toFixed(1)),
      dx: Number(dPos.wx.toFixed(1)),
      dy: Number(dPos.wy.toFixed(1)),
      aBannerX,
      aBannerY,
      dBannerX,
      dBannerY,
      cx,
      cy,
      midX,
      midY,
      pillX,
      pillY,
      pillW: Number(pillW.toFixed(1)),
      delaySeconds: Number(((out.length * 0.45) % 2.4).toFixed(2)),
    });
  }

  return out;
}

/**
 * Calm, non-blocking SVG war-imagery layer driven by `warImagerySnapshot(state)`:
 * opposing culture standards near the two holds, a short front phase line,
 * and a readable phase banner pill.
 */
export const BoardWarImagery: React.FC<{ state: GameState }> = ({ state }) => {
  const items = listBoardWarImagery(state);
  if (items.length === 0) return null;

  return (
    <g
      className="sc-war-imagery-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {items.map((w) => {
        const atkPal = LIVING_CULTURE_PALETTE[w.attackerKit];
        const defPal = LIVING_CULTURE_PALETTE[w.defenderKit];
        const allyPal = w.allyKit ? LIVING_CULTURE_PALETTE[w.allyKit] : null;
        const tilt = w.active ? 0 : -18;

        return (
          <g
            key={`war-img-${w.warId}`}
            className={`sc-war-imagery-entry is-phase-${w.phase}${w.player ? " is-player" : ""}`}
            data-war-imagery={w.warId}
            data-war-phase={w.phase}
            data-war-active={w.active ? "true" : "false"}
            data-war-banner={w.banner}
            data-attacker-kit={w.attackerKit}
            data-defender-kit={w.defenderKit}
          >
            {/* Short front phase line between the opposing banners */}
            <path
              className={`sc-war-imagery-front is-phase-${w.phase}`}
              d={`M ${w.aBannerX} ${w.aBannerY} Q ${w.cx} ${w.cy} ${w.dBannerX} ${w.dBannerY}`}
            />

            {/* Attacker culture banner (plus small ally pennant if joined war) */}
            <g
              className="sc-war-imagery-standard is-attacker"
              transform={`translate(${w.aBannerX}, ${w.aBannerY}) rotate(${tilt})`}
              style={{ animationDelay: `${w.delaySeconds}s` }}
            >
              <line x1={0} y1={2} x2={0} y2={-9.5} stroke={atkPal.trim} strokeWidth={0.95} />
              <polygon
                points="0,-9 6.6,-7.2 4.9,-5.6 6.6,-4 0,-4"
                fill={atkPal.tunic}
                stroke={atkPal.trim}
                strokeWidth={0.55}
              />
              {allyPal && (
                <g className="sc-war-imagery-ally" transform="translate(-4.5, 1)">
                  <line x1={0} y1={1} x2={0} y2={-6.5} stroke={allyPal.trim} strokeWidth={0.8} />
                  <polygon
                    points="0,-6.2 4.2,-4.7 0,-3.2"
                    fill={allyPal.tunic}
                    stroke={allyPal.trim}
                    strokeWidth={0.45}
                  />
                </g>
              )}
            </g>

            {/* Defender culture banner facing attacker */}
            <g
              className="sc-war-imagery-standard is-defender"
              transform={`translate(${w.dBannerX}, ${w.dBannerY}) rotate(${-tilt})`}
              style={{ animationDelay: `${w.delaySeconds + 0.3}s` }}
            >
              <line x1={0} y1={2} x2={0} y2={-9.5} stroke={defPal.trim} strokeWidth={0.95} />
              <polygon
                points="0,-9 -6.6,-7.2 -4.9,-5.6 -6.6,-4 0,-4"
                fill={defPal.tunic}
                stroke={defPal.trim}
                strokeWidth={0.55}
              />
            </g>

            {/* Center phase crest on the short front line */}
            <polygon
              className="sc-war-imagery-crest"
              points={`${w.midX},${w.midY - 2.3} ${w.midX + 2.3},${w.midY} ${w.midX},${w.midY + 2.3} ${w.midX - 2.3},${w.midY}`}
              fill={w.phase === "clash" ? "#facc15" : atkPal.accent}
              stroke={defPal.trim}
              strokeWidth={0.55}
              style={{ animationDelay: `${w.delaySeconds}s` }}
            />

            {/* Short calm banner pill */}
            <g className="sc-war-imagery-banner" transform={`translate(${w.pillX}, ${w.pillY})`}>
              <rect
                className="sc-war-imagery-pill-bg"
                x={-w.pillW / 2}
                y={-5.5}
                width={w.pillW}
                height={9.5}
                rx={4.5}
              />
              <text
                className="sc-war-imagery-pill-text"
                x={0}
                y={0.9}
                textAnchor="middle"
              >
                {w.banner}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
