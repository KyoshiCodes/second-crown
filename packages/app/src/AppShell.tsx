import React from "react";
import { formatLetterSuffix, settlementName, currentSeason, playerCultureId } from "@second-crown/sim";
import { useGameEngine, type Tab } from "./game/useGameEngine";
import { CultureContext } from "./UnitIcon";
import { ResourceHud } from "./hud/ResourceHud";
import { SpeedControls } from "./HudControls";
import { KingdomTab } from "./tabs/KingdomTab";
import { ArmyTab } from "./tabs/ArmyTab";
import { WarTab } from "./tabs/WarTab";
import { WorldTab } from "./tabs/WorldTab";
import { CrownTab } from "./tabs/CrownTab";
import { TutorialBanner } from "./TutorialBanner";
import { ProvinceInspect } from "./ProvinceInspect";
import { detectCurrentHoliday, getHolidayMeta, type HolidayId } from "./seasons/holidays";
import { resolveActiveThemePack } from "./themes/packs";
import { audioManager } from "./themes/audioManager";
import { WeatherOverlay } from "./seasons/WeatherOverlay";
import { ThemeStage } from "./seasons/ThemeStage";
import { type SeasonName } from "./music";
import { sfx } from "./sfx";

const TAB_LABEL: Record<Tab, string> = {
  kingdom: "Kingdom",
  army: "Army",
  war: "War",
  world: "World",
  crown: "Crown",
};
const TAB_ICON: Record<Tab, string> = {
  kingdom: "🏰",
  army: "⚔",
  war: "🔥",
  world: "🧭",
  crown: "👑",
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
    selectedProvinceId, setSelectedProvinceId,
    trainQty, setTrainQty,
    lastEvent, lastEventTick, eventLog, worldLog,
    speed, setSpeed, paused, setPaused,
    rivalOp, playerOp, title,
    battleSnap, setBattleSnap,
    canvasRef,
    setMapTheme,
    zoomIn,
    zoomOut,
    resetView,
    cameraBand,
    toggleCameraBand,
    state,
    act,
    saveNow, exportSave, importSaveFile, newGame,
  } = engine;

  const activeWar = state?.wars.find((w) => w.status === "active");
  const hold = state ? settlementName(state) : "Your Hold";
  const season = (state ? currentSeason(state) : "Spring") as SeasonName;
  const [holidayId, setHolidayId] = React.useState<HolidayId>(() => detectCurrentHoliday());
  const holiday = holidayId !== "none" ? getHolidayMeta(holidayId) : null;
  const activePack = resolveActiveThemePack(season, holidayId);
  const prevSeasonRef = React.useRef(season);

  React.useEffect(() => {
    document.title = hold + " - Second Crown";
  }, [hold]);

  React.useEffect(() => {
    const onHolidayChange = () => {
      setHolidayId(detectCurrentHoliday());
    };
    window.addEventListener("sc-holiday-change", onHolidayChange);
    return () => window.removeEventListener("sc-holiday-change", onHolidayChange);
  }, []);

  React.useEffect(() => {
    setMapTheme(activePack.id, holidayId);
  }, [activePack.id, holidayId, setMapTheme]);

  React.useEffect(() => {
    if (prevSeasonRef.current !== season) {
      sfx.seasonShift(season);
      prevSeasonRef.current = season;
    }
    audioManager.sync(activePack, season, !!activeWar);
  }, [activePack, season, activeWar]);

  return (
    <div
      className={`sc-shell theme-${tab} season-${season.toLowerCase()} pack-${activePack.id} ${holiday ? holiday.themeClass : ""}`}
      style={{ background: activePack.backgroundCss }}
    >
      <ThemeStage season={season} holiday={holidayId} />
      <WeatherOverlay season={season} holiday={holidayId} />
      <div className="sc-panel">
        <h1 style={{ margin: "0 0 4px", fontSize: 22 }} className="sc-title">Second Crown</h1>
        <div style={{ fontSize: 13, opacity: 0.85 }} className="sc-subtitle">
          {hold} · {title} · {activePack.propEmoji} {activePack.name} · Tick {formatLetterSuffix(tick)}
          {prestige > 0 ? ` · Prestige ${prestige}` : ""} · Power {power.player} vs {power.rival}
        </div>

        {offlineNote ? <p style={{ color: "#3fb950" }}>{offlineNote}</p> : null}
        <SpeedControls paused={paused} speed={speed} onPauseToggle={() => setPaused((p) => !p)} onSpeed={(n) => { setPaused(false); setSpeed(n); }} />
        <ResourceHud resources={resources} income={income} />
        <TutorialBanner state={state} act={act} />
        {status ? <div className="sc-status-banner" style={{ marginBottom: 10 }}>{status}</div> : null}
        <CultureContext.Provider value={state ? playerCultureId(state) : "western"}>
        {tab === "kingdom" ? (
          <ProvinceInspect
            state={state}
            selectedId={selectedProvinceId}
            onClear={() => setSelectedProvinceId(null)}
            act={act}
          />
        ) : null}
        <div className="sc-tabs-bar" style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {(["kingdom", "army", "war", "world", "crown"] as Tab[]).map((id) => (
            <button key={id} type="button" className={`sc-tab tab-${id} ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <span className="sc-tab-icon">{TAB_ICON[id]}</span> {TAB_LABEL[id]}
              {id === "war" && activeWar ? <span className="sc-war-badge"> *</span> : null}
            </button>
          ))}
        </div>
        <div
          className="sc-map-canvas-container"
          style={{
            display: tab === "kingdom" ? "flex" : "none",
            position: "relative",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", maxWidth: 560, width: "100%" }}>
            <canvas
              ref={canvasRef}
              className="sc-map-canvas"
              style={{ borderColor: activePack.chrome.borderColor }}
            />
            <div
              className="sc-map-controls"
              style={{
                position: "absolute",
                bottom: 22,
                right: 22,
                display: "flex",
                gap: 5,
                background: "rgba(18, 12, 8, 0.88)",
                border: "1px solid #78531e",
                borderRadius: 6,
                padding: "3px 6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                zIndex: 5,
              }}
            >
              <button type="button" onClick={zoomIn} title="Zoom In" style={{ padding: "1px 8px", fontSize: 14, fontWeight: 700, background: "#2a1a10", color: "#fef08a", border: "1px solid #c8963e", borderRadius: 4, cursor: "pointer" }}>+</button>
              <button type="button" onClick={zoomOut} title="Zoom Out" style={{ padding: "1px 8px", fontSize: 14, fontWeight: 700, background: "#2a1a10", color: "#fef08a", border: "1px solid #c8963e", borderRadius: 4, cursor: "pointer" }}>−</button>
              <button type="button" onClick={resetView} title="Reset View" style={{ padding: "1px 6px", fontSize: 12, background: "#2a1a10", color: "#fef08a", border: "1px solid #c8963e", borderRadius: 4, cursor: "pointer" }}>⟲</button>
              <button type="button" onClick={toggleCameraBand} title="Toggle Board / Hold" style={{ padding: "1px 8px", fontSize: 12, fontWeight: 600, background: "#2a1a10", color: "#fef08a", border: "1px solid #c8963e", borderRadius: 4, cursor: "pointer" }}>
                {cameraBand === "board" ? "🏰 Hold" : "🗺️ Board"}
              </button>
            </div>
          </div>
        </div>
          {tab === "kingdom" && <KingdomTab state={state} act={act} selectedBuild={selectedBuild} setSelectedBuild={setSelectedBuild} />}
          {tab === "army" && <ArmyTab state={state} act={act} trainQty={trainQty} setTrainQty={setTrainQty} />}
          {tab === "war" && <WarTab state={state} act={act} rivalOp={rivalOp} playerOp={playerOp} battleSnap={battleSnap} setBattleSnap={setBattleSnap} />}
          {tab === "world" && <WorldTab state={state} act={act} worldLog={worldLog} />}
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
        </CultureContext.Provider>
      </div>
    </div>
  );
}
