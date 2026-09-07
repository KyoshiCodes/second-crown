import React from "react";
import {
  activePlayerMarch,
  getProvince,
  tryMarch,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

const TERRAIN: Record<string, string> = {
  plain: "Plain",
  wood: "Wood",
  hill: "Hill",
  waste: "Waste",
  shore: "Shore",
  peak: "Peak",
};

const NODE: Record<string, string> = {
  none: "Open ground",
  hold: "Hold",
  camp: "Hostile camp",
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
};

export function ProvinceInspect(props: {
  state: GameState | undefined;
  selectedId: string | null;
  onClear: () => void;
  act: ActFn;
}) {
  const { state, selectedId, onClear, act } = props;
  if (!state || !selectedId) return null;
  const p = getProvince(state, selectedId);
  if (!p) return null;
  const home = selectedId === state.board.homeProvinceId;
  const march = activePlayerMarch(state);
  const occupant = p.occupantRealmId
    ? state.realms.find((r) => r.id === p.occupantRealmId)?.name ?? p.occupantRealmId
    : "None";
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "8px auto 0",
        padding: "10px 12px",
        background: "rgba(18,12,8,0.92)",
        border: "1px solid #78531e",
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong>
          {TERRAIN[p.terrain] ?? p.terrain} · {p.x},{p.y}
        </strong>
        <button type="button" onClick={onClear}>
          Close
        </button>
      </div>
      <div style={{ opacity: 0.85, marginTop: 4 }}>
        {NODE[p.node] ?? p.node} · Occupant: {occupant}
      </div>
      {march ? (
        <div style={{ marginTop: 6, color: "#fef08a" }}>
          Company marching to {march.toId} · {Math.max(0, march.arrivesTick - state.meta.tick)} ticks left
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {home ? (
          <span style={{ opacity: 0.75 }}>This is your hold. Zoom in to build.</span>
        ) : (
          <button
            type="button"
            disabled={Boolean(march)}
            onClick={() =>
              act((s) => {
                if (activePlayerMarch(s)) return "Company already on the march.";
                const ok = tryMarch(s, selectedId);
                if (!ok) return "Cannot march there.";
                const m = activePlayerMarch(s);
                const eta = m ? m.arrivesTick - s.meta.tick : 0;
                return `March ordered. ETA ${eta} ticks (${(eta / 10).toFixed(1)}s).`;
              })
            }
          >
            March here
          </button>
        )}
      </div>
    </div>
  );
}
