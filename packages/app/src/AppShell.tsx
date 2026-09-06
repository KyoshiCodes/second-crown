import React from "react";
import { formatLetterSuffix, settlementName, currentSeason } from "@second-crown/sim";
import { useGameEngine, type Tab } from "./game/useGameEngine";
import { ResourceHud } from "./hud/ResourceHud";
import { SpeedControls } from "./HudControls";
import { KingdomTab } from "./tabs/KingdomTab";
import { ArmyTab } from "./tabs/ArmyTab";
import { WarTab } from "./tabs/WarTab";
import { WorldTab } from "./tabs/WorldTab";
import { CrownTab } from "./tabs/CrownTab";
import { detectCurrentHoliday, getHolidayMeta, type HolidayId } from "./seasons/holidays";
import { WeatherOverlay } from "./seasons/WeatherOverlay";
import { ThemeStage } from "./seasons/ThemeStage";
import { playRecordedLoop } from "./seasons/recorded";
import { isMusicMuted, setMusicSeason, setMusicHoliday, setMusicBattle, type SeasonName } from "./music";
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
  const hold = state ? settlementName(state) : "Your Hold";
  const season = (state ? currentSeason(state) : "Spring") as SeasonName;
  const [holidayId, setHolidayId] = React.useState<HolidayId>(() => detectCurrentHoliday());
  const holiday = holidayId !== "none" ? getHolidayMeta(holidayId) : null;
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
    setMusicSeason(season);
    if (prevSeasonRef.current !== season) {
      sfx.seasonShift(season);
      prevSeasonRef.current = season;
    }
  }, [season]);

  React.useEffect(() => {
    setMusicHoliday(holidayId !== "none" ? holidayId : null);
  }, [holidayId]);

  React.useEffect(() => {
    setMusicBattle(!!activeWar);
  }, [activeWar]);

  React.useEffect(() => {
    const id = holidayId !== "none" ? holidayId : season.toLowerCase();
    playRecordedLoop(id, isMusicMuted());
  }, [holidayId, season]);

  return (
    <div className={`sc-shell theme-${tab} season-${season.toLowerCase()} ${holiday ? holiday.themeClass : ""}`}>
      <ThemeStage season={season} holiday={holidayId} />
      <WeatherOverlay season={season} holiday={holidayId} />
      <div className="sc-panel">
        <h1 style={{ margin: "0 0 4px", fontSize: 22 }} className="sc-title">Second Crown</h1>
        <div style={{ fontSize: 13, opacity: 0.85 }} className="sc-subtitle">
          {hold} · {title} · {season}
          {holiday ? ` · ${holiday.propEmoji} ${holiday.name}` : ""} · Tick {formatLetterSuffix(tick)}
          {prestige > 0 ? ` · Prestige ${prestige}` : ""} · Power {power.player} vs {power.rival}
        </div>

        {offlineNote ? <p style={{ color: "#3fb950" }}>{offlineNote}</p> : null}
        <SpeedControls paused={paused} speed={speed} onPauseToggle={() => setPaused((p) => !p)} onSpeed={(n) => { setPaused(false); setSpeed(n); }} />
        <ResourceHud resources={resources} income={income} />
        {status ? <div className="sc-status-banner" style={{ marginBottom: 10 }}>{status}</div> : null}
        <div className="sc-tabs-bar" style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {(["kingdom", "army", "war", "world", "crown"] as Tab[]).map((id) => (
            <button key={id} type="button" className={`sc-tab tab-${id} ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <span className="sc-tab-icon">{TAB_ICON[id]}</span> {TAB_LABEL[id]}
              {id === "war" && activeWar ? <span className="sc-war-badge"> *</span> : null}
            </button>
          ))}
        </div>
        <div style={{ display: tab === "kingdom" ? "block" : "none", marginBottom: 12 }}>
          <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 512, borderRadius: 8, border: "1px solid #3a2f24" }} />
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
      </div>
    </div>
  );
}
