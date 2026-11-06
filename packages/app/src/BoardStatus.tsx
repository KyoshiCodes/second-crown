import React from "react";
import {
  GATHER_NODES,
  garrisonAt,
  garrisonPower,
  getProvince,
  isProvinceSeen,
  listMarches,
  nodeStock,
  nodeStockMax,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./board-status.css";

/**
 * Stacked status chips for the selected province on the board view.
 * Display only: every value is read from existing sim helpers or state fields. No new game math.
 */

export type BoardChipKind = "owner" | "stock" | "garrison" | "event";

export type BoardChip = {
  kind: BoardChipKind;
  label: string;
  value: string;
  /** Tone drives colour only: you / rival / warn / calm / fog. */
  tone: "you" | "rival" | "warn" | "calm" | "fog";
};

function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

/** Builds the 3–4 chips for a province. Returns [] when the id is unknown. */
export function boardStatusChips(state: GameState, provinceId: string): BoardChip[] {
  const p = getProvince(state, provinceId);
  if (!p) return [];
  const home = provinceId === state.board.homeProvinceId;
  const seen = home || isProvinceSeen(state, provinceId);
  const chips: BoardChip[] = [];

  // Owner: home id + occupantRealmId, same reading as the inspect card.
  if (home || p.occupantRealmId === "player") {
    chips.push({ kind: "owner", label: "Owner", value: "You", tone: "you" });
  } else if (!seen) {
    chips.push({ kind: "owner", label: "Owner", value: "Unknown", tone: "fog" });
  } else if (p.occupantRealmId) {
    chips.push({ kind: "owner", label: "Owner", value: realmName(state, p.occupantRealmId), tone: "rival" });
  } else {
    chips.push({ kind: "owner", label: "Owner", value: "Empty", tone: "calm" });
  }

  // Stock: only gather tiles that are seen carry a stock value.
  if (seen && p.node in GATHER_NODES) {
    const have = nodeStock(state, provinceId);
    const max = nodeStockMax(p.node);
    const res = GATHER_NODES[p.node as keyof typeof GATHER_NODES].resource;
    chips.push({
      kind: "stock",
      label: "Stock",
      value: `${have}/${max} ${res}`,
      tone: have <= 0 ? "warn" : "calm",
    });
  }

  // Garrison: posted force on this tile. Fog hides rival ground.
  if (seen) {
    const g = garrisonAt(state, provinceId);
    const men = g ? Object.values(g.force).reduce((a, n) => a + Number(n ?? 0), 0) : 0;
    chips.push({
      kind: "garrison",
      label: "Garrison",
      value: men > 0 ? `${men} · pow ${garrisonPower(state, provinceId)}` : "None",
      tone: men > 0 ? "you" : "calm",
    });
  } else {
    chips.push({ kind: "garrison", label: "Garrison", value: "Unseen", tone: "fog" });
  }

  // Next event: the soonest column (yours or, if seen, a rival's) arriving on this tile.
  const tick = state.meta.tick;
  const inbound = listMarches(state)
    .filter((m) => m.toId === provinceId && m.arrivesTick > tick && (seen || m.realmId === "player"))
    .sort((a, b) => a.arrivesTick - b.arrivesTick);
  const next = inbound[0];
  if (next) {
    const secs = Math.max(0, Math.ceil((next.arrivesTick - tick) / TICKS_PER_SECOND));
    const mine = next.realmId === "player";
    chips.push({
      kind: "event",
      label: "Next",
      value: `${mine ? "Your column" : realmName(state, next.realmId)} in ${secs}s`,
      tone: mine ? "you" : "warn",
    });
  } else {
    chips.push({ kind: "event", label: "Next", value: "Quiet", tone: "calm" });
  }

  return chips;
}

/**
 * Where the stack sits: the canvas edge nearest the tile, at the tile's row.
 * Uses the board's iso layout (x−y across, x+y down) as a fraction of the board, so it is
 * approximate under pan/zoom. It hugs the edge so it never sits over the middle of the board.
 */
export function boardStatusAnchor(state: GameState, provinceId: string): { side: "left" | "right"; topPct: number } {
  const p = getProvince(state, provinceId);
  const w = Math.max(1, state.board.width);
  const h = Math.max(1, state.board.height);
  if (!p) return { side: "right", topPct: 50 };
  const across = (p.x - p.y + h) / (w + h); // 0 = far left, 1 = far right
  const down = (p.x + p.y) / Math.max(1, w + h - 2); // 0 = top, 1 = bottom
  const topPct = Math.round(Math.min(78, Math.max(6, down * 100)));
  return { side: across < 0.5 ? "left" : "right", topPct };
}

export function BoardStatus(props: { state: GameState | undefined; selectedId: string | null; visible: boolean }) {
  const { state, selectedId, visible } = props;
  if (!visible || !state || !selectedId) return null;
  const chips = boardStatusChips(state, selectedId);
  if (chips.length === 0) return null;
  const { side, topPct } = boardStatusAnchor(state, selectedId);
  return (
    <div
      className={`sc-board-status is-${side}`}
      style={{ top: `${topPct}%` }}
      role="status"
      aria-label="Selected province status"
    >
      {chips.map((c) => (
        <div key={c.kind} className={`sc-board-chip is-${c.kind} tone-${c.tone}`}>
          <span className="sc-board-chip-pip" aria-hidden="true" />
          <span className="sc-board-chip-label">{c.label}</span>
          <span className="sc-board-chip-value">{c.value}</span>
        </div>
      ))}
    </div>
  );
}
