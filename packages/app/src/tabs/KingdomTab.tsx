import React from "react";
import {
  buildTicksLeft,
  canAfford,
  canTrade,
  countBuilding,
  currentSeason,
  edgeWallCount,
  getBuildingType,
  hasClosedWallRing,
  housingCap,
  listBuildableTypes,
  listScarred,
  listUpgrades,
  listWorksInProgress,
  MARKET_OFFERS,
  population,
  settlementName,
  tryCancelBuild,
  tryCancelUpgrade,
  tryRepair,
  tryTrade,
  wallHp,
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
  const selected = selectedBuild ? getBuildingType(selectedBuild) : undefined;
  const hold = state ? settlementName(state) : "Your Hold";
  const season = state ? currentSeason(state) : "Spring";
  const scarred = state ? listScarred(state) : [];
  const works = state ? listWorksInProgress(state) : [];
  const upgrades = state ? listUpgrades(state) : [];
  const rim = state ? edgeWallCount(state, "player") : 0;
  const closed = state ? hasClosedWallRing(state) : false;
  const hp = state ? wallHp(state) : 0;
  const pop = state ? population(state) : 0;
  const beds = state ? housingCap(state) : 2;

  return (
    <>
      <p style={{ fontSize: 13 }}>
        {hold} · {season}. People {pop}/{beds}. Walls on the map edge ({rim}/8{closed ? ", closed" : ""}, {hp} wall HP).
      </p>
      {selected ? <p style={{ fontSize: 12, opacity: 0.8 }}>{selected.name}: {selected.blurb}</p> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {types.map((t) => {
          const n = state ? countBuilding(state, t.id) : 0;
          const afford = state ? canAfford(state, t.id) : false;
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
      {works.length > 0 ? (
        <>
          <h3>Raising</h3>
          {works.map((b) => {
            const left = state ? buildTicksLeft(state, b.id) : 0;
            const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
            return (
              <div key={b.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                <span>{nm} · {Math.ceil(left / 10)}s left</span>
                <button
                  type="button"
                  onClick={() => act((st) => (tryCancelBuild(st, b.id) ? `Struck the ${nm} scaffolding.` : "That work already stands."))}
                >
                  Cancel
                </button>
              </div>
            );
          })}
        </>
      ) : null}
      {upgrades.length > 0 ? (
        <>
          <h3>Improving</h3>
          {upgrades.map((job) => {
            const b = state?.buildings.find((x) => x.id === job.buildingId);
            const nm = getBuildingType(b?.typeId ?? "")?.name ?? job.buildingId;
            const left = state ? Math.max(0, job.doneTick - state.meta.tick) : 0;
            return (
              <div key={job.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                <span>{nm} → lv {job.fromLevel + 1} · {Math.ceil(left / 10)}s left</span>
                <button
                  type="button"
                  onClick={() => act((st) => (tryCancelUpgrade(st, job.buildingId) ? `Stopped improving the ${nm}.` : "That work already finished."))}
                >
                  Cancel
                </button>
              </div>
            );
          })}
        </>
      ) : null}
      {scarred.length > 0 ? (
        <>
          <h3>Scarred works</h3>
          {scarred.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => act((st) => (tryRepair(st, b.id) ? `Repaired ${b.typeId}.` : "Need 8 stone."))}
            >
              Repair {b.typeId} (8 stone)
            </button>
          ))}
        </>
      ) : null}
      <h3>Market</h3>
      <p style={{ fontSize: 12 }}>{marketsN < 1 ? "Build a Market to trade." : `Markets x${marketsN}`}</p>
      {MARKET_OFFERS.map((o) => (
        <button key={o.id} type="button" disabled={!(state && canTrade(state, o.id))} onClick={() => act((st) => (tryTrade(st, o.id) ? "Trade complete." : "Cannot trade."))}>{o.label}</button>
      ))}
    </>
  );
}
