import React from "react";
import { formatLetterSuffix } from "@second-crown/sim";
import { useGameEngine, type Tab } from "./game/useGameEngine";
import { ResourceHud } from "./hud/ResourceHud";
import { SpeedControls } from "./HudControls";
import { KingdomTab } from "./tabs/KingdomTab";
import { ArmyTab } from "./tabs/ArmyTab";
import { WarTab } from "./tabs/WarTab";
import { WorldTab } from "./tabs/WorldTab";
import { CrownTab } from "./tabs/CrownTab";

const TAB_LABEL: Record<Tab, string> = {
  kingdom: "Kingdom",
  army: "Army",
  war: "War",
  world: "World",
  crown: "Crown",
};

export function AppShell() {
  const engine = useGameEngine();
  const {
    tab, setTab,
    tick, resources, income,
    status, offlineNote,
    power, prestige,
    ascendReady, ascendNeed,
    selectedBuild, setSelectedBuild,
    trainQty, setTrainQty,
    lastEvent, lastEventTick, eventLog, worldLog,
    speed, setSpeed, paused, setPaused,
    rivalOp, playerOp, title,
    battleSnap, setBattleSnap,
    canvasRef,
    state,
    act,
    saveNow, exportSave, importSaveFile, newGame,
  } = engine;

  const activeWar = state?.wars.find((w) => w.status === "active");

  return (
    <div style={{ padding: 20, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>Second Crown</h1>
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {title} · Tick {formatLetterSuffix(tick)}
        {prestige > 0 ? ` · Prestige ${prestige}` : ""} · Power {power.player} vs {power.rival}
      </div>
      {offlineNote ? <p style={{ color: "#3fb950" }}>{offlineNote}</p> : null}
      <SpeedControls paused={paused} speed={speed} onPauseToggle={() => setPaused((p) => !p)} onSpeed={(n) => { setPaused(false); setSpeed(n); }} />
      <ResourceHud resources={resources} income={income} />
      {status ? <div style={{ marginBottom: 10, opacity: 0.85 }}>{status}</div> : null}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {(["kingdom", "army", "war", "world", "crown"] as Tab[]).map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)}>
            {TAB_LABEL[id]}{id === "war" && activeWar ? " ●" : ""}
          </button>
        ))}
      </div>
      <div style={{ display: tab === "kingdom" ? "block" : "none", marginBottom: 12 }}>
        <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 512, borderRadius: 8, border: "1px solid #3a2f24" }} />
      </div>
      {tab === "kingdom" && (
        <KingdomTab state={state} act={act} selectedBuild={selectedBuild} setSelectedBuild={setSelectedBuild} />
      )}
      {tab === "army" && (
        <ArmyTab state={state} act={act} trainQty={trainQty} setTrainQty={setTrainQty} />
      )}
      {tab === "war" && (
        <WarTab state={state} act={act} rivalOp={rivalOp} playerOp={playerOp} battleSnap={battleSnap} setBattleSnap={setBattleSnap} />
      )}
      {tab === "world" && (
        <WorldTab state={state} act={act} worldLog={worldLog} />
      )}
      {tab === "crown" && (
        <CrownTab
          state={state}
          act={act}
          lastEvent={lastEvent}
          lastEventTick={lastEventTick}
          eventLog={eventLog}
          ascendReady={ascendReady}
          ascendNeed={ascendNeed}
          saveNow={saveNow}
          exportSave={exportSave}
          importSaveFile={importSaveFile}
          newGame={newGame}
        />
      )}
    </div>
  );
}
