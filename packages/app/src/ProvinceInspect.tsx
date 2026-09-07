import React from "react";
import {
  activePlayerMarch,
  getProvince,
  isProvinceSeen,
  listUnitTypes,
  scoutCost,
  tryMarchWith,
  tryScoutProvince,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { UnitIcon } from "./UnitIcon";

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

function owned(state: GameState, typeId: string): number {
  const u = state.units.find((x) => x.realmId === "player" && x.typeId === typeId);
  return Number(u?.count ?? 0);
}

export function ProvinceInspect(props: {
  state: GameState | undefined;
  selectedId: string | null;
  onClear: () => void;
  act: ActFn;
}) {
  const { state, selectedId, onClear, act } = props;
  const [force, setForce] = React.useState<Record<string, number>>({ militia: 5 });
  if (!state || !selectedId) return null;
  const p = getProvince(state, selectedId);
  if (!p) return null;
  const roster = listUnitTypes();
  const home = selectedId === state.board.homeProvinceId;
  const march = activePlayerMarch(state);
  const seen = isProvinceSeen(state, selectedId);
  const cost = scoutCost(state);
  const gold = Number(state.resources.gold ?? 0);
  const occupant = seen
    ? p.occupantRealmId
      ? state.realms.find((r) => r.id === p.occupantRealmId)?.name ?? p.occupantRealmId
      : "None"
    : "Unknown (fog)";
  return (
    <div
      style={{
        maxWidth: 560,
        width: "100%",
        margin: "8px auto 10px",
        padding: "10px 12px",
        background: "rgba(18,12,8,0.94)",
        border: "1px solid #c8963e",
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
        {seen ? NODE[p.node] ?? p.node : "Fog hides the token."} · Occupant: {occupant} · Gold {gold}
      </div>
      {march ? (
        <div style={{ marginTop: 6, color: "#fef08a" }}>
          Company marching · {Math.max(0, march.arrivesTick - state.meta.tick)} ticks left
        </div>
      ) : null}
      {home ? (
        <div style={{ marginTop: 8, opacity: 0.8 }}>This is your hold. Zoom in to build.</div>
      ) : (
        <>
          {!seen ? (
            <button
              type="button"
              style={{ marginTop: 8, marginRight: 8 }}
              disabled={gold < cost}
              onClick={() =>
                act((s) => {
                  const c = scoutCost(s);
                  if (tryScoutProvince(s, selectedId)) return `Scouted for ${c} gold.`;
                  return `Need ${c} gold to scout. You have ${s.resources.gold ?? 0}.`;
                })
              }
            >
              Scout ({cost} gold)
            </button>
          ) : (
            <span style={{ marginTop: 8, display: "inline-block" }}>Scouted.</span>
          )}
          <div style={{ marginTop: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>March Column Composition</div>
            {roster.map((u) => {
              const have = owned(state, u.id);
              if (have <= 0 && !(force[u.id] > 0)) return null;
              return (
                <label
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <UnitIcon typeId={u.id} size={22} animated />
                  <span>
                    {u.name} (have {have})
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={have}
                    value={force[u.id] ?? 0}
                    onChange={(e) =>
                      setForce((f) => ({
                        ...f,
                        [u.id]: Math.max(0, Math.min(have, Number(e.target.value) || 0)),
                      }))
                    }
                    style={{ width: 64, marginLeft: "auto" }}
                  />
                </label>
              );
            })}
          </div>
          <button
            type="button"
            style={{ marginTop: 8 }}
            disabled={Boolean(march) || roster.every((u) => !(force[u.id] > 0))}
            onClick={() =>
              act((s) => {
                if (activePlayerMarch(s)) return "Company already on the march.";
                const ok = tryMarchWith(s, selectedId, force);
                if (!ok) return "Cannot march — check counts or a free column slot.";
                s.flags.tutorial_marched = 1;
                return "Column ordered.";
              })
            }
          >
            Send column
          </button>
        </>
      )}
    </div>
  );
}
