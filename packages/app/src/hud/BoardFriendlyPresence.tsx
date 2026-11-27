import React from "react";
import {
  friendlyPresenceSnapshot,
  getProvince,
  isProvinceSeen,
  type FriendlyPresenceKind,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./friendly-presence-standard.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardFriendlyPresenceItem {
  realmId: string;
  name: string;
  culture: string;
  kind: FriendlyPresenceKind;
  kit: LivingCultureKit;
  hx: number;
  hy: number;
  px: number;
  py: number;
  routePath: string | null;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function findHold(state: GameState, realmId: string): Province | undefined {
  if (realmId === "player") return getProvince(state, state.board.homeProvinceId);
  return state.board.provinces.find(
    (p) => p.node === "hold" && p.occupantRealmId === realmId,
  );
}

/**
 * Projects `friendlyPresenceSnapshot(state)` onto seen holds (plus gentle routes for
 * active trade or pact partners) so non-war neighbors feel present without visual noise.
 */
export function listBoardFriendlyPresence(
  state: GameState | null | undefined,
): BoardFriendlyPresenceItem[] {
  if (
    !state?.board?.provinces ||
    !state.flags ||
    !state.meta ||
    !Array.isArray(state.realms) ||
    !Array.isArray(state.wars)
  ) {
    return [];
  }

  const entries = friendlyPresenceSnapshot(state);
  if (entries.length === 0) return [];

  const homeHold = findHold(state, "player");
  const homePt = homeHold ? tileCenter(homeHold) : null;

  const out: BoardFriendlyPresenceItem[] = [];
  for (const entry of entries) {
    const hold = findHold(state, entry.realmId);
    if (!hold || !isProvinceSeen(state, hold.id)) continue;

    const pt = tileCenter(hold);
    const hx = Number(pt.wx.toFixed(1));
    const hy = Number(pt.wy.toFixed(1));
    const px = Number(Math.max(22, Math.min(538, pt.wx - 11.5)).toFixed(1));
    const py = Number(Math.max(18, Math.min(342, pt.wy - 3.5)).toFixed(1));

    let routePath: string | null = null;
    if ((entry.kind === "trade" || entry.kind === "pact") && homePt) {
      const cx = Number(((hx + homePt.wx) * 0.5).toFixed(1));
      const cy = Number((Math.min(hy, homePt.wy) - 10).toFixed(1));
      const tx = Number(homePt.wx.toFixed(1));
      const ty = Number(homePt.wy.toFixed(1));
      routePath = `M ${hx} ${hy} Q ${cx} ${cy} ${tx} ${ty}`;
    }

    out.push({
      realmId: entry.realmId,
      name: entry.name,
      culture: entry.culture,
      kind: entry.kind,
      kit: resolveLivingCultureKit(state, entry.realmId),
      hx,
      hy,
      px,
      py,
      routePath,
    });
  }

  return out;
}

/**
 * Calm, non-blocking SVG layer for non-war friendly realms (`peace` / `pact` / `trade`)
 * near their seen holds and quiet routes. Zero blood/gore, `pointer-events: none`.
 */
export const BoardFriendlyPresence: React.FC<{ state: GameState }> = ({ state }) => {
  const items = listBoardFriendlyPresence(state);
  if (items.length === 0) return null;

  return (
    <g
      className="sc-friendly-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {items.map((item) => {
        const pal = LIVING_CULTURE_PALETTE[item.kit];
        return (
          <g
            key={item.realmId}
            className={`sc-friendly-entry is-friendly-${item.kind}`}
            data-friendly-realm={item.realmId}
            data-friendly-kind={item.kind}
            data-friendly-culture={item.culture}
          >
            {item.routePath ? (
              <path
                className={`sc-friendly-route is-${item.kind}`}
                d={item.routePath}
              />
            ) : null}

            {item.kind === "pact" ? (
              <g
                className="sc-friendly-standard is-pact"
                transform={`translate(${item.px}, ${item.py})`}
              >
                <line
                  x1={0}
                  y1={2}
                  x2={0}
                  y2={-4.8}
                  stroke={pal.trim}
                  strokeWidth={0.85}
                />
                <polygon
                  points="0,-4.6 3.8,-3.3 0,-2"
                  fill={pal.tunic}
                  stroke={pal.trim}
                  strokeWidth={0.4}
                />
                <circle cx={0} cy={-5.1} r={0.6} fill={pal.trim} />
              </g>
            ) : item.kind === "trade" ? (
              <g
                className="sc-friendly-pip is-trade"
                transform={`translate(${item.px}, ${item.py})`}
              >
                <rect
                  className="sc-friendly-aura is-trade"
                  x={-2.8}
                  y={-2.8}
                  width={5.6}
                  height={5.6}
                  rx={1.1}
                  transform="rotate(45)"
                />
                <circle r={1.4} fill={pal.tunic} stroke={pal.trim} strokeWidth={0.45} />
              </g>
            ) : (
              <g
                className="sc-friendly-pip is-peace"
                transform={`translate(${item.px}, ${item.py})`}
              >
                <circle className="sc-friendly-aura is-peace" r={2.8} />
                <circle r={1.6} fill={pal.tunic} stroke={pal.trim} strokeWidth={0.45} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
