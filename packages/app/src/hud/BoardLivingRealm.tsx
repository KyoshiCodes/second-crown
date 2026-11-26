import React from "react";
import {
  cultureOfRealm,
  getCultureNews,
  getProvince,
  getWorldLog,
  isProvinceSeen,
  playerCultureId,
  playerWarPhase,
  unitActivity,
  warPhase,
  workerSnapshot,
  type GameState,
  type Province,
  type UnitDoing,
  type WarPhaseId,
  type WorkerTaskTag,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./living-realm-board.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

/** How long recent caravan events remain visible as living board trails (ticks). */
export const CARAVAN_BOARD_WINDOW_TICKS = 600;

/**
 * Living culture kit ids aligned with Western (including regional holds), Cedar (`woodland`),
 * Sand (`desert`), Steppe (`steppe`), Islands (`tide`), and Iron March (`iron`).
 */
export type LivingCultureKit = "western" | "woodland" | "desert" | "steppe" | "tide" | "iron";

export const LIVING_CULTURE_PALETTE: Record<
  LivingCultureKit,
  { tunic: string; trim: string; accent: string; label: string }
> = {
  western: { tunic: "#3b82f6", trim: "#facc15", accent: "#dbeafe", label: "Western" },
  woodland: { tunic: "#22c55e", trim: "#d97706", accent: "#dcfce7", label: "Cedar" },
  desert: { tunic: "#f59e0b", trim: "#fef08a", accent: "#fef3c7", label: "Sand" },
  steppe: { tunic: "#e11d48", trim: "#fb923c", accent: "#ffe4e6", label: "Steppe" },
  tide: { tunic: "#06b6d4", trim: "#f8fafc", accent: "#cffafe", label: "Islands" },
  iron: { tunic: "#94a3b8", trim: "#ef4444", accent: "#f1f5f9", label: "Iron March" },
};

function toLivingKit(cultureId: string | undefined): LivingCultureKit | null {
  switch (cultureId) {
    case "western":
    case "mist":
    case "glen":
    case "salt":
    case "fen":
    case "peak":
      return "western";
    case "woodland":
      return "woodland";
    case "desert":
      return "desert";
    case "steppe":
      return "steppe";
    case "tide":
      return "tide";
    case "iron":
      return "iron";
    default:
      return null;
  }
}

/** Resolves a realm's visual culture kit, falling back to the player's kit when absent. */
export function resolveLivingCultureKit(
  state: GameState | null | undefined,
  realmId = "player",
): LivingCultureKit {
  if (!state) return "western";
  if (realmId === "rival") return "iron";
  if (realmId !== "player") {
    const raw = state.flags?.[`culture_${realmId}`];
    const explicit = typeof raw === "string" ? toLivingKit(raw) : null;
    if (explicit) return explicit;
    if (state.realms?.some((r) => r.id === realmId)) {
      const npcKit = toLivingKit(cultureOfRealm(state, realmId));
      if (npcKit) return npcKit;
    }
  }
  return toLivingKit(playerCultureId(state)) ?? "western";
}

function tileWorldPos(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function holdProvinceForRealm(state: GameState, realmId: string): Province | undefined {
  if (realmId === "player") {
    return getProvince(state, state.board.homeProvinceId);
  }
  return state.board.provinces.find((p) => p.node === "hold" && p.occupantRealmId === realmId);
}

const CITIZEN_OFFSETS: readonly { dx: number; dy: number }[] = [
  { dx: -10, dy: 4 },
  { dx: -4, dy: 6.5 },
  { dx: 3, dy: 6.5 },
  { dx: 9.5, dy: 4 },
  { dx: -7.5, dy: -2 },
  { dx: 7.5, dy: -2 },
];

export interface BoardWorkerFigure {
  id: string;
  kind: "citizen" | "crew";
  tag: WorkerTaskTag;
  job: string;
  working: boolean;
  kit: LivingCultureKit;
  wx: number;
  wy: number;
  heads: number;
  delaySeconds: number;
}

/**
 * Deterministic board positions for posted workers & resource-node crews via `workerSnapshot`.
 * Idle workers sit still around the home hold; working citizens and crews animate quietly.
 */
export function listBoardWorkerFigures(state: GameState | null | undefined): BoardWorkerFigure[] {
  if (!state?.board?.provinces || !state.flags || !Array.isArray(state.citizens)) return [];
  const snap = workerSnapshot(state);
  const homeProv = getProvince(state, state.board.homeProvinceId);
  const kit = resolveLivingCultureKit(state, "player");
  const out: BoardWorkerFigure[] = [];

  if (homeProv) {
    const homeCenter = tileWorldPos(homeProv);
    const citizens = snap.posts.filter((p) => p.kind === "citizen").slice(0, CITIZEN_OFFSETS.length);
    for (let i = 0; i < citizens.length; i++) {
      const post = citizens[i];
      const off = CITIZEN_OFFSETS[i];
      out.push({
        id: post.id,
        kind: "citizen",
        tag: post.tag,
        job: post.job,
        working: post.tag !== "idle",
        kit,
        wx: Number((homeCenter.wx + off.dx).toFixed(1)),
        wy: Number((homeCenter.wy + off.dy).toFixed(1)),
        heads: post.heads,
        delaySeconds: Number(((i * 0.45) % 2.4).toFixed(2)),
      });
    }
  }

  let crewCount = 0;
  for (const post of snap.posts) {
    if (post.kind !== "crew" || !post.provinceId || crewCount >= 8) continue;
    const prov = getProvince(state, post.provinceId);
    if (!prov || (prov.id !== state.board.homeProvinceId && !isProvinceSeen(state, prov.id))) continue;
    const c = tileWorldPos(prov);
    out.push({
      id: post.id,
      kind: "crew",
      tag: post.tag,
      job: post.job,
      working: true,
      kit,
      wx: Number((c.wx + (crewCount % 2 === 0 ? -5.5 : 5.5)).toFixed(1)),
      wy: Number((c.wy + 3.5).toFixed(1)),
      heads: post.heads,
      delaySeconds: Number(((crewCount * 0.38) % 2.2).toFixed(2)),
    });
    crewCount += 1;
  }

  return out;
}

export interface BoardUnitTaskPoint {
  id: string;
  doing: Exclude<UnitDoing, "home">;
  label: string;
  kit: LivingCultureKit;
  men: number;
  wx: number;
  wy: number;
  fromWx: number | null;
  fromWy: number | null;
  delaySeconds: number;
}

/** Maps active player troop tasks from `unitActivity` onto seen board coordinates. */
export function listBoardUnitTasks(state: GameState | null | undefined): BoardUnitTaskPoint[] {
  if (!state?.board?.provinces || !state.flags || !Array.isArray(state.units)) return [];
  const kit = resolveLivingCultureKit(state, "player");
  const list = unitActivity(state).filter((a) => a.doing !== "home").slice(0, 8);
  const out: BoardUnitTaskPoint[] = [];

  for (let i = 0; i < list.length; i++) {
    const act = list[i];
    const targetProv = getProvince(state, act.provinceId);
    if (!targetProv) continue;
    if (targetProv.id !== state.board.homeProvinceId && !isProvinceSeen(state, targetProv.id)) continue;

    const toPt = tileWorldPos(targetProv);
    const fromProv = act.fromId ? getProvince(state, act.fromId) : undefined;
    const fromPt = fromProv ? tileWorldPos(fromProv) : null;
    const moving = Boolean(fromPt && (act.doing === "marching" || act.doing === "returning" || act.doing === "scouting"));

    const wx = moving && fromPt ? Number(((fromPt.wx + toPt.wx) * 0.5).toFixed(1)) : Number((toPt.wx + 6).toFixed(1));
    const wy = moving && fromPt ? Number(((fromPt.wy + toPt.wy) * 0.5 - 4).toFixed(1)) : Number((toPt.wy - 4).toFixed(1));

    out.push({
      id: act.id,
      doing: act.doing as Exclude<UnitDoing, "home">,
      label: act.label,
      kit,
      men: act.men,
      wx,
      wy,
      fromWx: fromPt ? Number(fromPt.wx.toFixed(1)) : null,
      fromWy: fromPt ? Number(fromPt.wy.toFixed(1)) : null,
      delaySeconds: Number(((i * 0.35) % 2.1).toFixed(2)),
    });
  }
  return out;
}

export interface BoardWarPhaseArc {
  warId: string;
  phaseId: WarPhaseId;
  title: string;
  isPlayer: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  mx: number;
  my: number;
}

/** Projects active & aftermath war phase arcs between belligerent hold provinces. */
export function listBoardWarPhaseArcs(state: GameState | null | undefined): BoardWarPhaseArc[] {
  if (!state?.board?.provinces || !Array.isArray(state.wars)) return [];
  const out: BoardWarPhaseArc[] = [];
  const seenWar = new Set<string>();
  const playerPhase = playerWarPhase(state);

  for (let i = state.wars.length - 1; i >= 0 && out.length < 4; i--) {
    const w = state.wars[i];
    if (w.id.startsWith("w_siege_") || seenWar.has(w.id)) continue;
    const isPlayer = w.attackerRealmId === "player" || w.defenderRealmId === "player";
    const phase = isPlayer && playerPhase?.warId === w.id ? playerPhase : warPhase(state, w);
    if (!phase) continue;

    const aHold = holdProvinceForRealm(state, w.attackerRealmId);
    const dHold = holdProvinceForRealm(state, w.defenderRealmId);
    if (!aHold || !dHold) continue;
    if (!isPlayer && !isProvinceSeen(state, aHold.id) && !isProvinceSeen(state, dHold.id)) continue;

    seenWar.add(w.id);
    const p1 = tileWorldPos(aHold);
    const p2 = tileWorldPos(dHold);
    const mx = Number(((p1.wx + p2.wx) * 0.5).toFixed(1));
    const my = Number(((p1.wy + p2.wy) * 0.5 - 12).toFixed(1));
    out.push({
      warId: w.id,
      phaseId: phase.id,
      title: phase.title,
      isPlayer,
      x1: Number(p1.wx.toFixed(1)),
      y1: Number(p1.wy.toFixed(1)),
      x2: Number(p2.wx.toFixed(1)),
      y2: Number(p2.wy.toFixed(1)),
      cx: mx,
      cy: Number((Math.min(p1.wy, p2.wy) - 18).toFixed(1)),
      mx,
      my,
    });
  }
  return out;
}

export interface BoardCaravanTrail {
  id: string;
  fromRealmId: string;
  toRealmId: string;
  kit: LivingCultureKit;
  isPlayer: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  mx: number;
  my: number;
}

/** Finds recent NPC-to-NPC caravans (`getCultureNews`) and NPC-to-player trade dispatches (`getWorldLog`). */
export function listBoardCaravanTrails(state: GameState | null | undefined): BoardCaravanTrail[] {
  if (!state?.board?.provinces || !state.flags) return [];
  const now = state.meta?.tick ?? 0;
  const out: BoardCaravanTrail[] = [];
  const pairs = new Set<string>();

  const pushPair = (id: string, fromRealmId: string, toRealmId: string, isPlayer: boolean) => {
    if (out.length >= 4) return;
    const key = [fromRealmId, toRealmId].sort().join(":");
    if (pairs.has(key)) return;
    const fromHold = holdProvinceForRealm(state, fromRealmId);
    const toHold = holdProvinceForRealm(state, toRealmId);
    if (!fromHold || !toHold) return;
    if (!isPlayer && !isProvinceSeen(state, fromHold.id) && !isProvinceSeen(state, toHold.id)) return;

    pairs.add(key);
    const p1 = tileWorldPos(fromHold);
    const p2 = tileWorldPos(toHold);
    const cx = Number(((p1.wx + p2.wx) * 0.5).toFixed(1));
    const cy = Number(((p1.wy + p2.wy) * 0.5 + 10).toFixed(1));
    out.push({
      id,
      fromRealmId,
      toRealmId,
      kit: resolveLivingCultureKit(state, fromRealmId),
      isPlayer,
      x1: Number(p1.wx.toFixed(1)),
      y1: Number(p1.wy.toFixed(1)),
      x2: Number(p2.wx.toFixed(1)),
      y2: Number(p2.wy.toFixed(1)),
      cx,
      cy,
      mx: cx,
      my: Number(((p1.wy + p2.wy) * 0.5 + 5).toFixed(1)),
    });
  };

  const news = getCultureNews(state);
  for (let i = news.length - 1; i >= 0 && out.length < 4; i--) {
    const n = news[i];
    if (n.kind !== "caravan") continue;
    if (now - n.tick > CARAVAN_BOARD_WINDOW_TICKS) continue;
    pushPair(`cn-${n.tick}-${n.fromRealmId}`, n.fromRealmId, n.toRealmId, n.toRealmId === "player");
  }

  const worldLog = getWorldLog(state);
  for (let i = worldLog.length - 1; i >= 0 && out.length < 4; i--) {
    const e = worldLog[i];
    if (e.id !== "trade" || now - e.tick > CARAVAN_BOARD_WINDOW_TICKS) continue;
    const partner = state.realms.find((r) => r.id !== "player" && e.text.startsWith(`${r.name} trades caravans with `));
    if (partner) {
      pushPair(`wt-${e.tick}-${partner.id}`, partner.id, "player", true);
    }
  }

  return out;
}

/**
 * Quiet, non-blocking SVG overlay rendering board workers/tasks, unit maneuvers,
 * war phase front arcs, and recent trade caravan trails inside BoardLiving.
 */
export function BoardLivingRealm({ state }: { state: GameState }) {
  const workers = listBoardWorkerFigures(state);
  const unitTasks = listBoardUnitTasks(state);
  const warArcs = listBoardWarPhaseArcs(state);
  const caravans = listBoardCaravanTrails(state);

  if (workers.length === 0 && unitTasks.length === 0 && warArcs.length === 0 && caravans.length === 0) {
    return null;
  }

  return (
    <g className="sc-lr-board-layer" aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* 1. Recent Trade Caravan Trails */}
      {caravans.map((c) => {
        const d = `M ${c.x1} ${c.y1} Q ${c.cx} ${c.cy} ${c.x2} ${c.y2}`;
        return (
          <g
            key={c.id}
            className="sc-lr-caravan-group"
            data-caravan-pair={`${c.fromRealmId}:${c.toRealmId}`}
            style={{ pointerEvents: "none" }}
          >
            <path d={d} className="sc-lr-caravan-trail" />
            <circle cx={c.mx} cy={c.my} r={2} className="sc-lr-caravan-mote" />
          </g>
        );
      })}

      {/* 2. War Phase Front Arcs */}
      {warArcs.map((arc) => {
        const d = `M ${arc.x1} ${arc.y1} Q ${arc.cx} ${arc.cy} ${arc.x2} ${arc.y2}`;
        const sigilStroke =
          arc.phaseId === "clash"
            ? "#f87171"
            : arc.phaseId === "skirmish"
              ? "#fb923c"
              : arc.phaseId === "aftermath"
                ? "#86efac"
                : "#facc15";
        return (
          <g
            key={`arc-${arc.warId}`}
            className={`sc-lr-war-arc is-phase-${arc.phaseId}`}
            data-war-phase={arc.phaseId}
            data-war-id={arc.warId}
            style={{ pointerEvents: "none" }}
          >
            <path d={d} className="sc-lr-war-arc-path" strokeWidth={arc.phaseId === "clash" ? 1.5 : 1.1} />
            <g className="sc-lr-war-arc-sigil" transform={`translate(${arc.mx}, ${arc.my})`}>
              {arc.phaseId === "clash" ? (
                <>
                  <circle cx={0} cy={0} r={4.2} fill="none" stroke={sigilStroke} strokeWidth={0.95} />
                  <path d="M-1.8,-1.8 L1.8,1.8 M1.8,-1.8 L-1.8,1.8" stroke="#fecaca" strokeWidth={1.1} strokeLinecap="round" />
                </>
              ) : arc.phaseId === "aftermath" ? (
                <circle cx={0} cy={0} r={2.6} fill="rgba(20, 44, 30, 0.85)" stroke={sigilStroke} strokeWidth={0.95} />
              ) : (
                <polygon
                  points="0,-2.8 2.6,0 0,2.8 -2.6,0"
                  fill="rgba(24, 18, 12, 0.85)"
                  stroke={sigilStroke}
                  strokeWidth={0.95}
                />
              )}
            </g>
          </g>
        );
      })}

      {/* 3. Posted Workers & Node Crews */}
      {workers.map((w) => {
        const pal = LIVING_CULTURE_PALETTE[w.kit];
        const delayStyle: React.CSSProperties = {
          pointerEvents: "none",
          animationDelay: `-${w.delaySeconds}s`,
        };
        return (
          <g
            key={`worker-${w.id}`}
            className={`sc-lr-worker ${w.working ? "is-working" : "is-idle"} is-task-${w.tag} is-kit-${w.kit}`}
            data-worker-state={w.working ? "working" : "idle"}
            data-worker-task={w.tag}
            data-culture-kit={w.kit}
            transform={`translate(${w.wx}, ${w.wy})`}
            style={delayStyle}
          >
            {/* Soft ground anchor */}
            <ellipse cx={0} cy={1.8} rx={2.2} ry={0.9} fill="rgba(15, 23, 42, 0.42)" />
            {w.working ? (
              <>
                <rect x={-1.3} y={-2.5} width={2.6} height={3.6} rx={0.8} fill={pal.tunic} stroke={pal.trim} strokeWidth={0.45} />
                <circle cx={0} cy={-3.6} r={1.05} fill={pal.accent} />
                <circle cx={1.8} cy={-1.5} r={0.75} fill={pal.trim} />
              </>
            ) : (
              <>
                {/* Seated idle worker profile */}
                <rect x={-1.5} y={-1.6} width={3} height={2.5} rx={0.9} fill={pal.tunic} opacity={0.78} />
                <circle cx={0} cy={-2.5} r={0.95} fill={pal.accent} opacity={0.85} />
              </>
            )}
          </g>
        );
      })}

      {/* 4. Active Unit Task Chevrons */}
      {unitTasks.map((u) => {
        const pal = LIVING_CULTURE_PALETTE[u.kit];
        const delayStyle: React.CSSProperties = {
          pointerEvents: "none",
          animationDelay: `-${u.delaySeconds}s`,
        };
        return (
          <g
            key={`utask-${u.id}`}
            className={`sc-lr-unit-task is-doing-${u.doing} is-kit-${u.kit}`}
            data-unit-doing={u.doing}
            data-culture-kit={u.kit}
            transform={`translate(${u.wx}, ${u.wy})`}
            style={delayStyle}
          >
            <circle cx={0} cy={0} r={3.6} fill="rgba(15, 23, 42, 0.72)" stroke={pal.trim} strokeWidth={0.85} />
            {u.doing === "garrisoned" ? (
              <polygon points="-1.5,-1.6 1.5,-1.6 1.5,0.4 0,2 -1.5,0.4" fill={pal.tunic} stroke={pal.accent} strokeWidth={0.5} />
            ) : u.doing === "scouting" ? (
              <circle cx={0} cy={0} r={1.35} fill={pal.trim} />
            ) : (
              <path
                d={u.doing === "returning" ? "M1.3,-1.2 L-1.2,0 L1.3,1.2" : "M-1.3,-1.2 L1.2,0 L-1.3,1.2"}
                fill="none"
                stroke={pal.trim}
                strokeWidth={1.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
