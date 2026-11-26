import React from "react";
import {
  getProvince,
  isProvinceSeen,
  npcBoardSnapshot,
  type GameState,
  type NpcBoardActivity,
  type NpcBoardKind,
  type NpcBoardPhase,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./npc-board-clash.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

const KIND_CAP = 6;

export interface BoardNpcAccentPoint {
  id: string;
  realmId: string;
  realmName: string;
  kind: NpcBoardKind;
  phase: NpcBoardPhase;
  kit: LivingCultureKit;
  provinceId: string;
  wx: number;
  wy: number;
  fromWx: number | null;
  fromWy: number | null;
  cx: number;
  cy: number;
  px: number;
  py: number;
  delaySeconds: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function transitRatio(act: NpcBoardActivity, now: number): number {
  if (act.untilTick === null || act.untilTick <= act.sinceTick) return 0.5;
  const raw = (now - act.sinceTick) / Math.max(1, act.untilTick - act.sinceTick);
  return Math.max(0.2, Math.min(0.8, raw));
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
 * Projects `npcBoardSnapshot(state)` activities (claims, camp marches, foraging gathers)
 * onto seen isometric board coordinates tinted by each NPC realm's culture kit.
 */
export function listBoardNpcAccents(state: GameState | null | undefined): BoardNpcAccentPoint[] {
  if (!state?.board?.provinces || !state.flags) return [];
  const snap = npcBoardSnapshot(state);
  const out: BoardNpcAccentPoint[] = [];
  const counts: Record<NpcBoardKind, number> = { claim: 0, camp: 0, gather: 0 };

  for (let i = 0; i < snap.activities.length; i++) {
    const act = snap.activities[i];
    if (counts[act.kind] >= KIND_CAP) continue;
    const targetProv = getProvince(state, act.provinceId);
    if (!targetProv) continue;

    const targetSeen = targetProv.id === state.board.homeProvinceId || isProvinceSeen(state, targetProv.id);
    const fromProv = act.fromId ? getProvince(state, act.fromId) : undefined;
    const fromSeen = fromProv ? fromProv.id === state.board.homeProvinceId || isProvinceSeen(state, fromProv.id) : false;

    if (act.kind === "claim") {
      if (!targetSeen) continue;
    } else if (!targetSeen && !fromSeen) {
      continue;
    }

    counts[act.kind] += 1;
    const toPt = tileCenter(targetProv);
    const fromPt = fromProv ? tileCenter(fromProv) : null;
    const kit = resolveLivingCultureKit(state, act.realmId);
    const isTransit =
      fromPt !== null &&
      (act.phase === "marching" || act.phase === "outbound" || act.phase === "returning");

    let px = Number(toPt.wx.toFixed(1));
    let py = Number(toPt.wy.toFixed(1));
    let cx = px;
    let cy = py;

    if (isTransit && fromPt) {
      const startX = act.phase === "returning" ? toPt.wx : fromPt.wx;
      const startY = act.phase === "returning" ? toPt.wy : fromPt.wy;
      const endX = act.phase === "returning" ? fromPt.wx : toPt.wx;
      const endY = act.phase === "returning" ? fromPt.wy : toPt.wy;
      cx = Number(((startX + endX) * 0.5).toFixed(1));
      cy = Number((Math.min(startY, endY) - 10).toFixed(1));
      const pt = quadPoint(startX, startY, cx, cy, endX, endY, transitRatio(act, snap.tick));
      px = pt.x;
      py = pt.y;
    } else if (act.kind === "gather") {
      px = Number((toPt.wx - 6.2).toFixed(1));
      py = Number((toPt.wy + 3.2).toFixed(1));
    }

    out.push({
      id: act.id,
      realmId: act.realmId,
      realmName: act.realmName,
      kind: act.kind,
      phase: act.phase,
      kit,
      provinceId: act.provinceId,
      wx: Number(toPt.wx.toFixed(1)),
      wy: Number(toPt.wy.toFixed(1)),
      fromWx: fromPt ? Number(fromPt.wx.toFixed(1)) : null,
      fromWy: fromPt ? Number(fromPt.wy.toFixed(1)) : null,
      cx,
      cy,
      px,
      py,
      delaySeconds: Number((((act.x * 3 + act.y * 5) % 8) * 0.34).toFixed(2)),
    });
  }

  return out;
}

/**
 * Quiet, non-blocking SVG overlay rendering NPC claims, camp marches, and
 * foraging gather crews with culture-kit colors inside BoardLiving.
 */
export function BoardNpcActivity({ state }: { state: GameState }) {
  const items = listBoardNpcAccents(state);
  if (items.length === 0) return null;

  return (
    <g className="sc-npc-board-layer" aria-hidden="true" style={{ pointerEvents: "none" }}>
      {items.map((item) => {
        const pal = LIVING_CULTURE_PALETTE[item.kit];
        const delayStyle: React.CSSProperties = {
          pointerEvents: "none",
          animationDelay: `-${item.delaySeconds}s`,
        };

        if (item.kind === "claim") {
          const diamond = `${item.wx},${item.wy - 7} ${item.wx + 14},${item.wy} ${item.wx},${item.wy + 7} ${item.wx - 14},${item.wy}`;
          return (
            <g
              key={item.id}
              className={`sc-npc-activity is-claim is-kit-${item.kit}`}
              data-npc-kind="claim"
              data-npc-phase={item.phase}
              data-npc-realm={item.realmId}
              data-culture-kit={item.kit}
              style={{ pointerEvents: "none" }}
            >
              <polygon
                points={diamond}
                fill={pal.tunic}
                stroke={pal.trim}
                strokeWidth={0.85}
                className="sc-npc-claim-aura"
                style={delayStyle}
              />
              <line
                x1={item.wx + 4.5}
                y1={item.wy + 1.5}
                x2={item.wx + 4.5}
                y2={item.wy - 7.5}
                stroke={pal.accent}
                strokeWidth={0.9}
                strokeLinecap="round"
              />
              <polygon
                points={`${item.wx + 4.5},${item.wy - 7.5} ${item.wx + 10},${item.wy - 5.8} ${item.wx + 4.5},${item.wy - 4.1}`}
                fill={pal.tunic}
                stroke={pal.trim}
                strokeWidth={0.65}
                strokeLinejoin="round"
              />
              <circle
                cx={item.wx + 4.5}
                cy={item.wy - 8}
                r={0.95}
                fill={pal.trim}
                className="sc-npc-claim-pip"
                style={delayStyle}
              />
            </g>
          );
        }

        if (item.kind === "camp") {
          const pathD =
            item.fromWx !== null && item.fromWy !== null
              ? `M ${item.fromWx} ${item.fromWy} Q ${item.cx} ${item.cy} ${item.wx} ${item.wy}`
              : null;
          return (
            <g
              key={item.id}
              className={`sc-npc-activity is-camp is-kit-${item.kit}`}
              data-npc-kind="camp"
              data-npc-phase={item.phase}
              data-npc-realm={item.realmId}
              data-culture-kit={item.kit}
              style={{ pointerEvents: "none" }}
            >
              {pathD ? <path d={pathD} stroke={pal.trim} className="sc-npc-camp-path" style={delayStyle} /> : null}
              <g className="sc-npc-camp-column" transform={`translate(${item.px}, ${item.py})`} style={delayStyle}>
                <circle cx={0} cy={0} r={3.4} fill="rgba(15, 23, 42, 0.78)" stroke={pal.trim} strokeWidth={0.85} />
                <polygon points="0,-2 2.1,1.3 -2.1,1.3" fill={pal.tunic} stroke={pal.accent} strokeWidth={0.5} />
              </g>
            </g>
          );
        }

        const pathD =
          item.fromWx !== null && item.fromWy !== null && item.phase !== "gathering"
            ? `M ${item.fromWx} ${item.fromWy} Q ${item.cx} ${item.cy} ${item.wx} ${item.wy}`
            : null;
        return (
          <g
            key={item.id}
            className={`sc-npc-activity is-gather is-phase-${item.phase} is-kit-${item.kit}`}
            data-npc-kind="gather"
            data-npc-phase={item.phase}
            data-npc-realm={item.realmId}
            data-culture-kit={item.kit}
            style={{ pointerEvents: "none" }}
          >
            {pathD ? <path d={pathD} stroke={pal.tunic} className="sc-npc-gather-path" style={delayStyle} /> : null}
            <g
              className={`sc-npc-gather-crew ${item.phase === "gathering" ? "is-working" : "is-transit"}`}
              transform={`translate(${item.px}, ${item.py})`}
              style={delayStyle}
            >
              <ellipse cx={0} cy={1.8} rx={2.1} ry={0.85} fill="rgba(15, 23, 42, 0.45)" />
              <rect x={-1.25} y={-2.3} width={2.5} height={3.3} rx={0.75} fill={pal.tunic} stroke={pal.trim} strokeWidth={0.45} />
              <circle cx={0} cy={-3.3} r={1} fill={pal.accent} />
              {item.phase === "gathering" ? <circle cx={1.8} cy={-1.2} r={0.7} fill={pal.trim} /> : null}
            </g>
          </g>
        );
      })}
    </g>
  );
}
