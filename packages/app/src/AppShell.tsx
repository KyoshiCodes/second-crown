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
import { KeepInterior } from "./KeepInterior";
import { OverworldAtlas } from "./OverworldAtlas";
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
    tapHoldTile,
    saveNow, exportSave, importSaveFile, newGame,
  } = engine;

  const activeWar = state?.wars.find((w) => w.status === "active");
  const hold = state ? settlementName(state) : "Your Hold";
  const season = (state ? currentSeason(state) : "Spring") as SeasonName;
  const [holidayId, setHolidayId] = React.useState<HolidayId>(() => detectCurrentHoliday());
  const holiday = holidayId !== "none" ? getHolidayMeta(holidayId) : null;
  const activePack = resolveActiveThemePack(season, holidayId);
  const prevSeasonRef = React.useRef(season);
  const [keepOpen, setKeepOpen] = React.useState(false);
  const closeKeep = React.useCallback(() => setKeepOpen(false), []);

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
        <ResourceHud resources={resources} income={income} state={state} />
        <TutorialBanner state={state} act={act} />
        {status ? <div className="sc-status-banner" style={{ marginBottom: 10 }}>{status}</div> : null}
        <CultureContext.Provider value={state ? playerCultureId(state) : "western"}>
        {tab === "kingdom" ? (
          <ProvinceInspect
            state={state}
            selectedId={selectedProvinceId}
            onClear={() => setSelectedProvinceId(null)}
            act={act}
            onEnterKeep={() => setKeepOpen(true)}
          />
        ) : null}
        {keepOpen && tab === "kingdom" ? (
          <KeepInterior
            state={state}
            selectedBuild={selectedBuild}
            setSelectedBuild={setSelectedBuild}
            onTap={tapHoldTile}
            onClose={closeKeep}
          />
        ) : null}
        <div className="sc-tabs-bar" style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {(["kingdom", "army", "war", "world", "crown"] as Tab[]).map((id) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                type="button"
                className={`sc-tab tab-${id} ${isActive ? "active" : ""}`}
                onClick={() => setTab(id)}
              >
                <span className="sc-tab-icon">{TAB_ICON[id]}</span>
                <span>{TAB_LABEL[id]}</span>
                {isActive && (
                  <span className="sc-tab-lantern" title="Active lantern tick" aria-hidden="true">
                    <svg
                      width="13"
                      height="15"
                      viewBox="0 0 14 16"
                      fill="none"
                      style={{ verticalAlign: "middle", overflow: "visible" }}
                    >
                      {/* Lantern top cap & ring */}
                      <path d="M7 1v2M4.5 3h5l1 2.5h-7L4.5 3z" stroke="#d4a359" strokeWidth="1.2" strokeLinecap="round" />
                      {/* Glass cage & corner ribs */}
                      <rect x="3.5" y="5.5" width="7" height="6.5" rx="1" stroke="#d4a359" strokeWidth="1" fill="rgba(245, 158, 11, 0.2)" />
                      <line x1="7" y1="5.5" x2="7" y2="12" stroke="#d4a359" strokeWidth="0.8" />
                      {/* Dancing lantern flame */}
                      <circle cx="7" cy="8.8" r="2.2" fill="#fef08a" />
                      <circle cx="7" cy="8.8" r="1.1" fill="#ffffff" />
                      {/* Brass pedestal base */}
                      <path d="M5 12h4l1 2.5H4L5 12z" fill="#b45309" stroke="#d4a359" strokeWidth="0.8" />
                    </svg>
                  </span>
                )}
                {id === "war" && activeWar ? <span className="sc-war-badge"> *</span> : null}
              </button>
            );
          })}
        </div>
        <div
          className="sc-map-canvas-container"
          style={{
            display: tab === "kingdom" || tab === "world" ? "flex" : "none",
            position: "relative",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", maxWidth: 900, width: "100%" }}>
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
          {tab === "world" && (
            <>
              <OverworldAtlas
                state={state}
                selectedId={selectedProvinceId}
                onSelect={(id) => setSelectedProvinceId(id)}
              />
              <WorldTab state={state} act={act} worldLog={worldLog} />
            </>
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
        </CultureContext.Provider>
      </div>
    </div>
  );
}
