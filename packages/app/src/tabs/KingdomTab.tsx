import React from "react";
import {
  canAfford,
  canTrade,
  countBuilding,
  getBuildingType,
  listBuildableTypes,
  MARKET_OFFERS,
  MAX_BUILDING_LEVEL,
  tryTrade,
  settlementName,
  tryRenameSettlement,
  currentSeason,
  decreeActive,
  routeGoldPerTick,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";

function costLine(cost: Record<string, string | undefined>): string {
  return Object.entries(cost)
    .filter(([, v]) => v)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

export function KingdomTab(props: {
  state: GameState | undefined;
  act: ActFn;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
}) {
  const { state, act, selectedBuild, setSelectedBuild } = props;
  const types = listBuildableTypes();
  const marketsN = state ? countBuilding(state, "market") : 0;
  const selected = selectedBuild ? getBuildingType(selectedBuild) : undefined;
  const hold = state ? settlementName(state) : "Your Hold";
  const [name, setName] = React.useState(hold);
  React.useEffect(() => setName(hold), [hold]);
  const season = state ? currentSeason(state) : "Spring";
  const doctrine = state ? String(state.flags.doctrine || "none") : "none";
  const routes = state ? routeGoldPerTick(state) : 0;
  const decrees = state
    ? ["muster", "rite", "envoys"].filter((id) => decreeActive(state, id)).join(", ")
    : "";

  return (
    <>
      <div className="sc-realm-card" style={{ marginBottom: 10, fontSize: 13 }}>
        <strong>Realm pulse</strong>
        <p style={{ margin: "4px 0" }}>{season} · Doctrine {doctrine} · Routes {routes}/3</p>
        <p style={{ margin: 0, opacity: 0.75 }}>{decrees ? `Active decrees: ${decrees}` : "No decree running. Swear one on the Crown tab."}</p>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Hold name</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} style={{ background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }} />
          <button type="button" onClick={() => act((st) => (tryRenameSettlement(st, name) ? `This hold is ${name.trim()}.` : "Enter a name."))}>
            Rename hold
          </button>
        </div>
      </div>
      {selected ? (
        <div className="sc-realm-card" style={{ marginBottom: 10 }}>
          <strong>{selected.name}</strong>
          <p style={{ fontSize: 13, margin: "6px 0" }}>{selected.blurb || "A work of the realm."}</p>
          <p style={{ fontSize: 12, opacity: 0.75 }}>Cost {costLine(selected.cost)} · {selected.buildTicks / 10}s to raise</p>
          <p style={{ fontSize: 12, opacity: 0.65 }}>Click an empty tile to place. Occupied tile upgrades (max {MAX_BUILDING_LEVEL}).</p>
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {types.map((t) => {
          const afford = state ? canAfford(state, t.id) : false;
          const n = state ? countBuilding(state, t.id) : 0;
          return (
            <button
              key={t.id}
              type="button"
              title={t.blurb}
              onClick={() => setSelectedBuild(t.id)}
              style={{ background: selectedBuild === t.id ? "#3d6b30" : afford ? "#2d5a27" : "#2a221c", color: "#eee" }}
            >
              {t.name}{n ? ` x${n}` : ""}{selectedBuild === t.id ? " *" : ""}
            </button>
          );
        })}
      </div>
      <h3>Market</h3>
      <p style={{ fontSize: 12 }}>{marketsN < 1 ? "Build a Market to trade." : `Markets x${marketsN}`}</p>
      {MARKET_OFFERS.map((o) => (
        <button key={o.id} type="button" disabled={!(state && canTrade(state, o.id))} onClick={() => act((st) => (tryTrade(st, o.id) ? "Trade complete." : "Cannot trade."))}>{o.label}</button>
      ))}
    </>
  );
}
