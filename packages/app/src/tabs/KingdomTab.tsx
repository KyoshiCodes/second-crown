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
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";

export function KingdomTab(props: {
  state: GameState | undefined;
  act: ActFn;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
}) {
  const { state, act, selectedBuild, setSelectedBuild } = props;
  const types = listBuildableTypes();
  const marketsN = state ? countBuilding(state, "market") : 0;
  const selectedName = selectedBuild ? getBuildingType(selectedBuild)?.name ?? selectedBuild : "None";
  const hold = state ? settlementName(state) : "Your Hold";
  const [name, setName] = React.useState(hold);
  React.useEffect(() => setName(hold), [hold]);

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Hold name</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} style={{ background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }} />
          <button type="button" onClick={() => act((st) => (tryRenameSettlement(st, name) ? `This hold is ${name.trim()}.` : "Enter a name."))}>
            Rename hold
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, opacity: 0.65 }}>
        Selected: {selectedName}. Empty tile places a building; occupied tile upgrades (max {MAX_BUILDING_LEVEL}).
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {types.map((t) => {
          const afford = state ? canAfford(state, t.id) : false;
          return (
            <button key={t.id} type="button" onClick={() => setSelectedBuild(t.id)} style={{ background: afford ? "#2d5a27" : "#2a221c", color: "#eee" }}>
              {t.name}{selectedBuild === t.id ? " \u2713" : ""}
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
