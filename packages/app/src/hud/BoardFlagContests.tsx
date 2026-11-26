import React from "react";
import {
  flagContestSnapshot,
  getProvince,
  isProvinceSeen,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./flag-contest-accents.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

const FLAG_ACCENT_CAP = 8;

export interface BoardFlagContestPoint {
  provinceId: string;
  realmId: string;
  realmName: string;
  marchId: string;
  kit: LivingCultureKit;
  wx: number;
  wy: number;
  sinceTick: number;
  untilTick: number;
  delaySeconds: number;
}

export interface BoardFlagCooldownPoint {
  provinceId: string;
  wx: number;
  wy: number;
  untilTick: number;
  delaySeconds: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function isFlagProvinceVisible(state: GameState, prov: Province): boolean {
  return (
    prov.occupantRealmId === "player" ||
    prov.id === state.board.homeProvinceId ||
    isProvinceSeen(state, prov.id)
  );
}

/**
 * Projects active flag contests from `flagContestSnapshot(state)` onto seen
 * isometric tile coordinates tinted by the contesting realm's culture kit.
 */
export function listBoardFlagContests(
  state: GameState | null | undefined,
): BoardFlagContestPoint[] {
  if (!state?.board?.provinces || !state.flags || !state.meta) return [];
  const snap = flagContestSnapshot(state);
  const out: BoardFlagContestPoint[] = [];
  const seenProvs = new Set<string>();

  for (let i = 0; i < snap.contests.length; i++) {
    if (out.length >= FLAG_ACCENT_CAP) break;
    const entry = snap.contests[i];
    if (seenProvs.has(entry.provinceId)) continue;
    const prov = getProvince(state, entry.provinceId);
    if (!prov || !isFlagProvinceVisible(state, prov)) continue;

    seenProvs.add(entry.provinceId);
    const { wx, wy } = tileCenter(prov);
    const kit = resolveLivingCultureKit(state, entry.realmId);
    out.push({
      provinceId: entry.provinceId,
      realmId: entry.realmId,
      realmName: entry.realmName,
      marchId: entry.marchId,
      kit,
      wx,
      wy,
      sinceTick: entry.sinceTick,
      untilTick: entry.untilTick,
      delaySeconds: Number(((i * 0.45) % 2.4).toFixed(2)),
    });
  }

  return out;
}

/**
 * Projects flags resting in post-contest cooldown from `flagContestSnapshot(state)`
 * onto seen isometric coordinates, skipping any flag currently under active contest.
 */
export function listBoardFlagCooldowns(
  state: GameState | null | undefined,
): BoardFlagCooldownPoint[] {
  if (!state?.board?.provinces || !state.flags || !state.meta) return [];
  const snap = flagContestSnapshot(state);
  const activeIds = new Set(snap.contests.map((c) => c.provinceId));
  const seenProvs = new Set<string>();
  const out: BoardFlagCooldownPoint[] = [];

  for (let i = 0; i < snap.cooldowns.length; i++) {
    if (out.length >= FLAG_ACCENT_CAP) break;
    const cd = snap.cooldowns[i];
    if (activeIds.has(cd.provinceId) || seenProvs.has(cd.provinceId)) continue;
    const prov = getProvince(state, cd.provinceId);
    if (!prov || !isFlagProvinceVisible(state, prov)) continue;

    seenProvs.add(cd.provinceId);
    const { wx, wy } = tileCenter(prov);
    out.push({
      provinceId: cd.provinceId,
      wx,
      wy,
      untilTick: cd.untilTick,
      delaySeconds: Number(((i * 0.55) % 2.6).toFixed(2)),
    });
  }

  return out;
}

/**
 * Quiet, non-blocking SVG overlay for contested flags (pulsing culture ring +
 * miniature contesting realm seal) and post-contest resting flags.
 */
export const BoardFlagContests: React.FC<{ state: GameState }> = ({ state }) => {
  const contests = listBoardFlagContests(state);
  const cooldowns = listBoardFlagCooldowns(state);
  if (contests.length === 0 && cooldowns.length === 0) return null;

  return (
    <g
      className="sc-flag-contest-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {cooldowns.map((cd) => (
        <g
          key={`flag-cooldown-${cd.provinceId}`}
          className="sc-flag-cooldown"
          data-flag-cooldown={cd.provinceId}
          transform={`translate(${cd.wx}, ${cd.wy})`}
        >
          <ellipse
            className="sc-flag-cooldown-ring"
            cx={0}
            cy={0}
            rx={9.6}
            ry={5}
            style={{ animationDelay: `${cd.delaySeconds}s` }}
          />
        </g>
      ))}

      {contests.map((c) => {
        const pal = LIVING_CULTURE_PALETTE[c.kit];
        return (
          <g
            key={`flag-contest-${c.provinceId}`}
            className={`sc-flag-contest is-kit-${c.kit}`}
            data-flag-contest={c.provinceId}
            data-contest-realm={c.realmId}
            data-culture-kit={c.kit}
            transform={`translate(${c.wx}, ${c.wy})`}
          >
            <polygon
              className="sc-flag-contest-aura"
              points="0,-7.5 14,0 0,7.5 -14,0"
              fill={pal.tunic}
              style={{ animationDelay: `${c.delaySeconds}s` }}
            />
            <ellipse
              className="sc-flag-contest-ring"
              cx={0}
              cy={0}
              rx={11.5}
              ry={6}
              fill="none"
              stroke={pal.trim}
              strokeWidth={1.1}
              style={{ animationDelay: `${c.delaySeconds}s` }}
            />
            <ellipse
              className="sc-flag-contest-ring-inner"
              cx={0}
              cy={0}
              rx={8.2}
              ry={4.2}
              fill="none"
              stroke={pal.accent}
              strokeWidth={0.75}
            />
            <g
              className="sc-flag-contest-seal"
              transform="translate(8, -13)"
              style={{ animationDelay: `${c.delaySeconds}s` }}
            >
              <circle
                cx={0}
                cy={0}
                r={3.2}
                fill={pal.tunic}
                stroke={pal.trim}
                strokeWidth={0.8}
              />
              <polygon points="0,-1.6 1.3,0.9 -1.3,0.9" fill={pal.accent} />
            </g>
          </g>
        );
      })}
    </g>
  );
};
