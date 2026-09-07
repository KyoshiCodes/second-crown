import React from "react";
import {
  activePlayerMarch,
  getProvince,
  isProvinceSeen,
  listMarches,
  maxMarches,
  tryMarch,
  tryMarchWith,
  tryScoutProvince,
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
  const seen = isProvinceSeen(state, selectedId);
  const marching = listMarches(state).filter((m) => m.realmId === "player").length;
  const slots = maxMarches(state);
  const occupant = !seen
    ? "Unknown"
    : p.occupantRealmId
      ? state.realms.find((r) => r.id === p.occupantRealmId)?.name ?? p.occupantRealmId
      : "None";
  const full = marching >= slots;
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
          {seen ? TERRAIN[p.terrain] ?? p.terrain : "Unscouted"} · {p.x},{p.y}
        </strong>
        <button type="button" onClick={onClear}>
          Close
        </button>
      </div>
      <div style={{ opacity: 0.85, marginTop: 4 }}>
        {seen ? NODE[p.node] ?? p.node : "Fog"} · Occupant: {occupant}
      </div>
      <div style={{ marginTop: 6, color: "#fef08a" }}>
        Companies out {marching}/{slots}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {home ? (
          <span style={{ opacity: 0.75 }}>This is your hold. Zoom in to build.</span>
        ) : (
          <>
            {!seen ? (
              <button
                type="button"
                onClick={() =>
                  act((s) => (tryScoutProvince(s, selectedId) ? "Scouts return with a map." : "Need 8 gold, or already seen."))
                }
              >
                Scout (8 gold)
              </button>
            ) : null}
            <button
              type="button"
              disabled={full}
              onClick={() =>
                act((s) => {
                  const ok = tryMarch(s, selectedId);
                  if (!ok) return "Need militia, or no free company slot.";
                  const m = activePlayerMarch(s);
                  const eta = m ? m.arrivesTick - s.meta.tick : 0;
                  return `5 militia marching. ETA ${eta} ticks.`;
                })
              }
            >
              March 5 militia
            </button>
            <button
              type="button"
              disabled={full}
              onClick={() =>
                act((s) => {
                  const ok = tryMarchWith(s, selectedId, { militia: 2, archer: 2 });
                  if (!ok) return "Need 2 militia and 2 archers, or no slot.";
                  return "Mixed column of 2 militia and 2 archers is away.";
                })
              }
            >
              March 2 militia + 2 archers
            </button>
          </>
        )}
      </div>
    </div>
  );
}
