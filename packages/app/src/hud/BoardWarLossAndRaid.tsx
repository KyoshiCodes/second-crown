import React from "react";
import {
  getProvince,
  homeRaidSnapshot,
  isNpcWar,
  isProvinceSeen,
  npcWarLossesFor,
  warPhase,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./war-loss-raid-accents.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

const WAR_LOSS_CAP = 6;

export interface BoardNpcWarLossPoint {
  warId: string;
  realmId: string;
  provinceId: string;
  lost: number;
  kit: LivingCultureKit;
  wx: number;
  wy: number;
  delaySeconds: number;
}

export type BoardHomeRaidAccent =
  | {
      mode: "inbound";
      homeProvinceId: string;
      wx: number;
      wy: number;
      realmId: string;
      realmName: string;
      marchId: string;
      kit: LivingCultureKit;
      fromWx: number | null;
      fromWy: number | null;
      cx: number | null;
      cy: number | null;
      chevronX: number;
      chevronY: number;
      angleDeg: number;
      arrivesTick: number;
    }
  | {
      mode: "resting";
      homeProvinceId: string;
      wx: number;
      wy: number;
      cooldownUntil: number;
      nextStartTick: number | null;
    };

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function quadPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: Number((mt * mt * x0 + 2 * mt * t * cx + t * t * x1).toFixed(1)),
    y: Number((mt * mt * y0 + 2 * mt * t * cy + t * t * y1).toFixed(1)),
  };
}

/**
 * Lists short-lived aftermath accents for NPC-vs-NPC wars that applied unit losses,
 * anchored to each losing hold (seen holds only) while the war remains in its `aftermath` phase.
 */
export function listBoardNpcWarLosses(
  state: GameState | null | undefined,
): BoardNpcWarLossPoint[] {
  if (!state?.board?.provinces || !state.flags || !state.meta || !Array.isArray(state.wars)) {
    return [];
  }

  const out: BoardNpcWarLossPoint[] = [];
  const seenRealms = new Set<string>();

  for (let i = state.wars.length - 1; i >= 0; i--) {
    if (out.length >= WAR_LOSS_CAP) break;
    const war = state.wars[i];
    if (war.status === "active" || !isNpcWar(war)) continue;

    const phase = warPhase(state, war);
    if (!phase || phase.id !== "aftermath") continue;

    const loss = npcWarLossesFor(state, war.id);
    if (!loss) continue;

    const sides: Array<[string, number]> = [
      [war.attackerRealmId, loss.attacker],
      [war.defenderRealmId, loss.defender],
    ];
    for (const [realmId, lost] of sides) {
      if (out.length >= WAR_LOSS_CAP) break;
      if (lost <= 0 || seenRealms.has(realmId)) continue;
      const hold = state.board.provinces.find(
        (p) => p.node === "hold" && p.occupantRealmId === realmId,
      );
      if (!hold || !isProvinceSeen(state, hold.id)) continue;

      seenRealms.add(realmId);
      const { wx, wy } = tileCenter(hold);
      const kit = resolveLivingCultureKit(state, realmId);
      out.push({
        warId: war.id,
        realmId,
        provinceId: hold.id,
        lost,
        kit,
        wx,
        wy,
        delaySeconds: Number(((out.length * 0.5) % 2.5).toFixed(2)),
      });
    }
  }

  return out;
}

/**
 * Reads `homeRaidSnapshot(state)` and resolves either an active inbound raid accent
 * (takes precedence while a column is on the road) or a quiet cooldown resting mark.
 */
export function resolveBoardHomeRaid(
  state: GameState | null | undefined,
): BoardHomeRaidAccent | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) return null;
  const homeProv = getProvince(state, state.board.homeProvinceId);
  if (!homeProv) return null;

  const snap = homeRaidSnapshot(state);
  const { wx, wy } = tileCenter(homeProv);

  if (snap.inbound) {
    const kit = resolveLivingCultureKit(state, snap.inbound.realmId);
    const fromProv = state.board.provinces.find(
      (p) => p.node === "hold" && p.occupantRealmId === snap.inbound!.realmId,
    );

    if (fromProv) {
      const from = tileCenter(fromProv);
      const cx = Number(((from.wx + wx) / 2).toFixed(1));
      const cy = Number(((from.wy + wy) / 2 - 12).toFixed(1));
      const span = Math.max(1, snap.inbound.arrivesTick - snap.inbound.sinceTick);
      const raw = (snap.tick - snap.inbound.sinceTick) / span;
      const t = Math.max(0.25, Math.min(0.82, raw));
      const pos = quadPoint(from.wx, from.wy, cx, cy, wx, wy, t);
      const ahead = quadPoint(from.wx, from.wy, cx, cy, wx, wy, Math.min(0.95, t + 0.08));
      const angleDeg = Number(
        ((Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI).toFixed(1),
      );
      return {
        mode: "inbound",
        homeProvinceId: homeProv.id,
        wx,
        wy,
        realmId: snap.inbound.realmId,
        realmName: snap.inbound.realmName,
        marchId: snap.inbound.marchId,
        kit,
        fromWx: from.wx,
        fromWy: from.wy,
        cx,
        cy,
        chevronX: pos.x,
        chevronY: pos.y,
        angleDeg,
        arrivesTick: snap.inbound.arrivesTick,
      };
    }

    const fallbackX = Number((wx + 14).toFixed(1));
    const fallbackY = Number((wy - 9).toFixed(1));
    const angleDeg = Number(
      ((Math.atan2(wy - fallbackY, wx - fallbackX) * 180) / Math.PI).toFixed(1),
    );
    return {
      mode: "inbound",
      homeProvinceId: homeProv.id,
      wx,
      wy,
      realmId: snap.inbound.realmId,
      realmName: snap.inbound.realmName,
      marchId: snap.inbound.marchId,
      kit,
      fromWx: null,
      fromWy: null,
      cx: null,
      cy: null,
      chevronX: fallbackX,
      chevronY: fallbackY,
      angleDeg,
      arrivesTick: snap.inbound.arrivesTick,
    };
  }

  if (snap.cooldownUntil !== null && snap.tick < snap.cooldownUntil) {
    return {
      mode: "resting",
      homeProvinceId: homeProv.id,
      wx,
      wy,
      cooldownUntil: snap.cooldownUntil,
      nextStartTick: snap.nextStartTick,
    };
  }

  return null;
}

/**
 * Quiet, non-blocking SVG overlay for NPC war loss aftermath markers (dipped heraldic
 * standards on losing holds) and home-raid timing (inbound chevron/ring or cooldown rest mark).
 */
export const BoardWarLossAndRaid: React.FC<{ state: GameState }> = ({ state }) => {
  const losses = listBoardNpcWarLosses(state);
  const raid = resolveBoardHomeRaid(state);
  if (losses.length === 0 && !raid) return null;

  return (
    <g
      className="sc-war-loss-raid-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {losses.map((pt) => {
        const pal = LIVING_CULTURE_PALETTE[pt.kit];
        return (
          <g
            key={`war-loss-${pt.warId}-${pt.realmId}`}
            className={`sc-npc-war-loss is-kit-${pt.kit}`}
            data-npc-war-loss={pt.provinceId}
            data-loss-realm={pt.realmId}
            data-loss-war={pt.warId}
            data-loss-count={pt.lost}
            data-culture-kit={pt.kit}
            transform={`translate(${pt.wx}, ${pt.wy})`}
          >
            <polygon
              className="sc-war-loss-hush"
              points="0,-8 15,0 0,8 -15,0"
              style={{ animationDelay: `${pt.delaySeconds}s` }}
            />
            <g
              className="sc-war-loss-standard"
              transform="translate(-10, -10)"
              style={{ animationDelay: `${pt.delaySeconds}s` }}
            >
              <g transform="rotate(-28)">
                <line x1={0} y1={-6} x2={0} y2={2} stroke={pal.trim} strokeWidth={0.9} />
                <polygon
                  points="0,-5.5 5.2,-3.8 4.4,-1.8 0,-2.4"
                  fill={pal.tunic}
                  stroke={pal.trim}
                  strokeWidth={0.55}
                  opacity={0.85}
                />
              </g>
            </g>
            <circle
              className="sc-war-loss-wisp"
              cx={-8}
              cy={-13}
              r={1.1}
              style={{ animationDelay: `${pt.delaySeconds}s` }}
            />
          </g>
        );
      })}

      {raid?.mode === "inbound" && (
        <g
          className={`sc-home-raid is-inbound is-kit-${raid.kit}`}
          data-home-raid="inbound"
          data-raid-realm={raid.realmId}
          data-culture-kit={raid.kit}
        >
          {raid.fromWx !== null &&
            raid.fromWy !== null &&
            raid.cx !== null &&
            raid.cy !== null && (
              <path
                className="sc-home-raid-trail"
                d={`M ${raid.fromWx} ${raid.fromWy} Q ${raid.cx} ${raid.cy} ${raid.wx} ${raid.wy}`}
              />
            )}
          <ellipse
            className="sc-home-raid-ring"
            cx={raid.wx}
            cy={raid.wy}
            rx={14.5}
            ry={7.5}
          />
          <g
            className="sc-home-raid-chevron"
            transform={`translate(${raid.chevronX}, ${raid.chevronY}) rotate(${raid.angleDeg})`}
          >
            <polygon
              points="-3.5,-2.8 4.2,0 -3.5,2.8 -1.6,0"
              fill={LIVING_CULTURE_PALETTE[raid.kit].tunic}
              stroke="#fbbf24"
              strokeWidth={0.8}
            />
          </g>
        </g>
      )}

      {raid?.mode === "resting" && (
        <g
          className="sc-home-raid is-resting"
          data-home-raid="resting"
          data-cooldown-until={raid.cooldownUntil}
          transform={`translate(${raid.wx}, ${raid.wy})`}
        >
          <ellipse
            className="sc-home-raid-rest-ring"
            cx={0}
            cy={0}
            rx={13.2}
            ry={6.8}
          />
          <g className="sc-home-raid-rest-mark" transform="translate(11, -13)">
            <circle
              cx={0}
              cy={0}
              r={2.9}
              fill="rgba(22, 34, 28, 0.82)"
              stroke="rgba(var(--sc-home-raid-rest-rgb), 0.78)"
              strokeWidth={0.75}
            />
            <line
              x1={-1.4}
              y1={0}
              x2={1.4}
              y2={0}
              stroke="rgba(var(--sc-home-raid-rest-rgb), 0.92)"
              strokeWidth={0.9}
              strokeLinecap="round"
            />
          </g>
        </g>
      )}
    </g>
  );
};
