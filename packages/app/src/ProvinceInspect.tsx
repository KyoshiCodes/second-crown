import React from "react";
import {
  GATHER_NODES,
  activePlayerMarch,
  campThreat,
  garrisonAt,
  garrisonPower,
  getProvince,
  isProvinceSeen,
  listGathers,
  listMarches,
  listOutposts,
  listUnitTypes,
  maxMarches,
  outpostTithePerTick,
  scoutCost,
  tryDispatchGarrison,
  tryDispatchRecallGarrison,
  tryGather,
  tryMarchWith,
  tryRecallGather,
  tryRecallMarch,
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
  ruins: "Ruins",
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
  const gathers = listGathers(state);
  const here = gathers.find((g) => g.toId === selectedId && g.phase !== "returning");
  const seen = isProvinceSeen(state, selectedId);
  const cost = scoutCost(state);
  const gold = Number(state.resources.gold ?? 0);
  const canGather = seen && p.node in GATHER_NODES;
  const slotsUsed =
    listMarches(state).filter((m) => m.realmId === "player").length +
    gathers.filter((g) => g.phase !== "returning").length;
  const full = slotsUsed >= maxMarches(state);
  const flagged = listOutposts(state).some((o) => o.id === selectedId);
  const tithe = flagged ? outpostTithePerTick(state) : null;
  const posted = garrisonAt(state, selectedId);
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
      {seen && p.node === "camp" ? <div style={{ marginTop: 4 }}>Camp threat {campThreat(state, p)}</div> : null}
      {flagged ? (
        <div style={{ marginTop: 4, color: "#86efac" }}>
          Your flag. Tithe / tick — food {tithe?.food ?? 0} wood {tithe?.wood ?? 0} stone {tithe?.stone ?? 0} gold{" "}
          {tithe?.gold ?? 0}
          {posted ? ` · Garrison power ${garrisonPower(state, selectedId)}` : " · No garrison"}
        </div>
      ) : null}
      {march ? (
        <div style={{ marginTop: 6, color: "#fef08a" }}>
          Column · {march.purpose ?? "raid"} · {Math.max(0, march.arrivesTick - state.meta.tick)} ticks left
          {march.arrivesTick > state.meta.tick ? (
            <button type="button" style={{ marginLeft: 8 }} onClick={() => act((s) => (tryRecallMarch(s) ? "Column recalled." : "Cannot recall."))}>
              Recall column
            </button>
          ) : null}
        </div>
      ) : null}
      {here ? (
        <div style={{ marginTop: 6 }}>
          Gathering {here.node} · load {here.load}/{here.capacity} · {here.phase}
          <button type="button" style={{ marginLeft: 8 }} onClick={() => act((s) => (tryRecallGather(s, here.id) ? "Column recalled." : "Cannot recall."))}>
            Recall gather
          </button>
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
          ) : null}
          {canGather ? (
            <button
              type="button"
              style={{ marginTop: 8, marginRight: 8 }}
              disabled={Boolean(here) || full}
              onClick={() =>
                act((s) => {
                  const pack: Record<string, number> = {};
                  for (const [k, v] of Object.entries(force)) if (v > 0) pack[k] = v;
                  if (Object.keys(pack).length === 0) pack.militia = 5;
                  return tryGather(s, selectedId, pack) ? "Gather column sent." : "Cannot gather.";
                })
              }
            >
              Gather here
            </button>
          ) : null}
          {flagged ? (
            <>
              <button
                type="button"
                style={{ marginTop: 8, marginRight: 8 }}
                disabled={Boolean(march) || full}
                onClick={() =>
                  act((s) => {
                    const pack: Record<string, number> = {};
                    for (const [k, v] of Object.entries(force)) if (v > 0) pack[k] = v;
                    if (Object.keys(pack).length === 0) pack.militia = 3;
                    return tryDispatchGarrison(s, selectedId, pack) ? "Garrison marching." : "Cannot send garrison.";
                  })
                }
              >
                Station garrison
              </button>
              {posted ? (
                <button
                  type="button"
                  style={{ marginTop: 8, marginRight: 8 }}
                  disabled={Boolean(march) || full}
                  onClick={() => act((s) => (tryDispatchRecallGarrison(s, selectedId) ? "Garrison marching home." : "No garrison."))}
                >
                  Recall garrison
                </button>
              ) : null}
            </>
          ) : null}
          <div style={{ marginTop: 10, fontSize: 12 }}>
            Column
            {roster.map((u) => {
              const have = owned(state, u.id);
              if (have <= 0 && !(force[u.id] > 0)) return null;
              return (
                <label key={u.id} style={{ display: "block", marginTop: 4 }}>
                  {u.name} (have {have})
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
                    style={{ width: 64, marginLeft: 8 }}
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
                if (activePlayerMarch(s)) return "Company already on the board.";
                const ok = tryMarchWith(s, selectedId, force);
                if (!ok) return "Cannot raid.";
                return "Raid column ordered.";
              })
            }
          >
            Send raid column
          </button>
        </>
      )}
    </div>
  );
}
