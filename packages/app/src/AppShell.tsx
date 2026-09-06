import React from "react";
import {
  createGameState,
  TickEngine,
  tryBuild,
  canAfford,
  listBuildableTypes,
  listUnitTypes,
  tryTrain,
  canAffordTrain,
  trainCostMultiplier,
  tryDeclareWar,
  tryResolveWar,
  tryWhitePeace,
  peaceTicksRemaining,
  tryAscend,
  canAscend,
  ascendThreshold,
  realmPower,
  serializeState,
  deserializeState,
  applyOfflineProgress,
  formatLetterSuffix,
  computeIncomePerSecond,
  countBuilding,
  tryUpgrade,
  MAX_BUILDING_LEVEL,
  tryTrade,
  canTrade,
  MARKET_OFFERS,
  getEventLog,
  getWorldLog,
  tryGiftGold,
  rivalOpinionOfPlayer,
  playerOpinionOfRival,
  tryFoundGuild,
  tryJoinFaction,
  tryLeaveFaction,
  playerTitle,
  getBuildingType,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { createMapRenderer, type MapRenderer } from "@second-crown/render";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "./save/indexedDb";
import { downloadSave, pickSaveFile } from "./save/fileIo";
import { EventPanel } from "./EventPanel";
import { SpeedControls, DiplomacyPanel } from "./HudControls";
import { WorldPanel } from "./WorldPanel";
import { ArmyVisual } from "./ArmyVisual";
import { BattleVisual, type BattleSnap } from "./BattleVisual";
import { getGiftThanks, getWarTaunt } from "./content/flavor";

type Tab = "kingdom" | "army" | "war" | "world" | "crown";
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
const RES_LABEL: Record<string, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

export function AppShell() {
  const [tab, setTab] = React.useState<Tab>("kingdom");
  const [tick, setTick] = React.useState(0);
  const [resources, setResources] = React.useState<Record<string, string>>({});
  const [income, setIncome] = React.useState<Record<string, string>>({});
  const [units, setUnits] = React.useState<GameState["units"]>([]);
  const [wars, setWars] = React.useState<GameState["wars"]>([]);
  const [status, setStatus] = React.useState("");
  const [offlineNote, setOfflineNote] = React.useState("");
  const [power, setPower] = React.useState({ player: 0, rival: 0 });
  const [prestige, setPrestige] = React.useState(0);
  const [ascendReady, setAscendReady] = React.useState(false);
  const [ascendNeed, setAscendNeed] = React.useState(30_000);
  const [selectedBuild, setSelectedBuild] = React.useState<string | null>("farm");
  const [trainQty, setTrainQty] = React.useState(1);
  const [lastEvent, setLastEvent] = React.useState("");
  const [lastEventTick, setLastEventTick] = React.useState(0);
  const [eventLog, setEventLog] = React.useState<WorldEvent[]>([]);
  const [worldLog, setWorldLog] = React.useState<WorldEvent[]>([]);
  const [speed, setSpeed] = React.useState(1);
  const [paused, setPaused] = React.useState(false);
  const [rivalOp, setRivalOp] = React.useState(0);
  const [playerOp, setPlayerOp] = React.useState(0);
  const [title, setTitle] = React.useState("Petty Lord");
  const [battleSnap, setBattleSnap] = React.useState<BattleSnap | null>(null);
  const seenEventTick = React.useRef(0);
  const speedRef = React.useRef(1);
  const pausedRef = React.useRef(false);
  const engineRef = React.useRef<TickEngine | null>(null);
  const mapRef = React.useRef<MapRenderer | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectedBuildRef = React.useRef<string | null>("farm");
  const lastRivalWar = React.useRef<string | null>(null);

  React.useEffect(() => { selectedBuildRef.current = selectedBuild; }, [selectedBuild]);
  React.useEffect(() => { speedRef.current = speed; pausedRef.current = paused; }, [speed, paused]);

  React.useEffect(() => {
    const THEMES = ["kingdom", "army", "war", "world", "crown"];
    document.body.classList.remove(...THEMES.map((t) => `theme-${t}`));
    document.body.classList.add("sc-shell", `theme-${tab}`);
  }, [tab]);

  const persist = (st: GameState) => saveToIndexedDb(serializeState(st)).catch(() => {});

  const syncUi = React.useCallback((engine: TickEngine) => {
    const s = engine.getState();
    setTick(s.meta.tick);
    setResources({ ...s.resources });
    setIncome(computeIncomePerSecond(s));
    setUnits([...s.units]);
    setWars([...s.wars]);
    setPower({ player: realmPower(s, "player"), rival: realmPower(s, "rival") });
    setPrestige(Number(s.flags["prestige_level"] ?? 0));
    setAscendReady(canAscend(s));
    setAscendNeed(ascendThreshold(s));
    setLastEvent(typeof s.flags.last_event === "string" ? s.flags.last_event : "");
    setLastEventTick(Number(s.flags.last_event_tick ?? 0));
    setEventLog(getEventLog(s));
    setWorldLog(getWorldLog(s));
    setRivalOp(rivalOpinionOfPlayer(s));
    setPlayerOp(playerOpinionOfRival(s));
    setTitle(playerTitle(s));
    const evTick = Number(s.flags.last_event_tick ?? 0);
    if (evTick > 0 && evTick !== seenEventTick.current) {
      seenEventTick.current = evTick;
      setStatus(String(s.flags.last_event ?? ""));
    }
    mapRef.current?.sync(s);
    const incoming = s.wars.find((w) => w.status === "active" && w.attackerRealmId !== "player");
    if (incoming && incoming.id !== lastRivalWar.current) {
      lastRivalWar.current = incoming.id;
      const name = s.realms.find((r) => r.id === incoming.attackerRealmId)?.name ?? incoming.attackerRealmId;
      const taunt = getWarTaunt(incoming.attackerRealmId);
      setStatus(`${name} declares war! "${taunt}"`);
      setTab("war");
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;
    (async () => {
      let state: GameState;
      try {
        const saved = await loadFromIndexedDb();
        if (saved) {
          state = deserializeState(saved);
          const settled = applyOfflineProgress(state);
          setOfflineNote(settled > 0 ? `Welcome back — settled ${settled} ticks.` : "");
          setStatus("Loaded autosave.");
        } else {
          state = createGameState({ seed: Date.now() >>> 0, withStarterBuildings: true });
          state.resources.wood = "40";
          state.resources.food = "50";
          setStatus("Click the map to place or upgrade buildings.");
        }
      } catch {
        state = createGameState({ seed: 42, withStarterBuildings: true });
        state.resources.wood = "40";
        state.resources.food = "50";
      }
      if (cancelled) return;
      state.meta.lastRealTime = Date.now();
      const engine = new TickEngine(state);
      engineRef.current = engine;
      if (canvasRef.current) {
        try {
          const map = await createMapRenderer(canvasRef.current);
          if (cancelled) { map.destroy(); return; }
          mapRef.current = map;
          map.sync(state);
          map.onTileClick((x, y) => {
            const eng = engineRef.current;
            if (!eng) return;
            const st = eng.getState();
            const existing = st.buildings.find((b) => b.x === x && b.y === y);
            if (existing) {
              const ok = tryUpgrade(st, existing.id);
              const nm = getBuildingType(existing.typeId)?.name ?? existing.typeId;
              setStatus(ok ? `Upgraded ${nm} to level ${existing.level}.` : "Cannot upgrade that building.");
              if (ok) { syncUi(eng); persist(st); }
              return;
            }
            const typeId = selectedBuildRef.current;
            if (!typeId) return;
            const ok = tryBuild(st, { typeId, x, y });
            const nm = getBuildingType(typeId)?.name ?? typeId;
            setStatus(ok ? `Built ${nm}.` : `Cannot afford ${nm}.`);
            if (ok) { syncUi(eng); persist(st); }
          });
        } catch (e) { console.warn(e); }
      }
      syncUi(engine);
      intervalId = window.setInterval(() => {
        if (pausedRef.current) return;
        const eng = engineRef.current;
        if (!eng) return;
        const n = Math.max(1, speedRef.current);
        for (let i = 0; i < n; i++) eng.tick();
        eng.getState().meta.lastRealTime = Date.now();
        syncUi(eng);
        if (eng.getState().meta.tick % 50 === 0) persist(eng.getState());
      }, 100);
    })();
    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [syncUi]);

  const act = (fn: (st: GameState, eng: TickEngine) => string) => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    setStatus(fn(st, eng));
    syncUi(eng);
    persist(st);
  };

  const state = engineRef.current?.getState();
  const types = listBuildableTypes();
  const unitTypes = listUnitTypes();
  const activeWar = wars.find((w) => w.status === "active");
  const trainMult = state ? trainCostMultiplier(state) : 1;
  const barracksN = state ? countBuilding(state, "barracks") : 0;
  const marketsN = state ? countBuilding(state, "market") : 0;
  const selectedName = selectedBuild ? getBuildingType(selectedBuild)?.name ?? selectedBuild : "None";
  const otherRealms = (state?.realms ?? []).filter((r) => r.id !== "player");
  const worldEntries = [...worldLog].reverse();

  return (
    <div className={`sc-shell theme-${tab}`}>
      <div className="sc-panel">
        <h1 style={{ margin: "0 0 4px", fontSize: 22 }} className="sc-title">Second Crown</h1>
        <div style={{ fontSize: 13, opacity: 0.8 }} className="sc-subtitle">
          {title} · Tick {formatLetterSuffix(tick)}
          {prestige > 0 ? ` · Prestige ${prestige}` : ""} · Power {power.player} vs {power.rival}
        </div>
        {offlineNote ? <p style={{ color: "#3fb950" }}>{offlineNote}</p> : null}
        <SpeedControls paused={paused} speed={speed} onPauseToggle={() => setPaused((p) => !p)} onSpeed={(n) => { setPaused(false); setSpeed(n); }} />
        <div className="sc-resource-bar" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: 12, borderRadius: 8, margin: "12px 0", fontFamily: "ui-monospace, monospace" }}>
          {(["food", "wood", "stone", "gold"] as const).map((r) => (
            <div key={r}>
              <div style={{ opacity: 0.55, fontSize: 11 }}>{RES_LABEL[r]}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{formatLetterSuffix(resources[r] ?? "0")}</div>
              <div style={{ opacity: 0.5, fontSize: 11 }}>+{formatLetterSuffix(income[r] ?? "0")}/s</div>
            </div>
          ))}
        </div>
        {status ? <div className="sc-status-banner" style={{ marginBottom: 10 }}>{status}</div> : null}
        <div className="sc-tabs-bar" style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {(["kingdom", "army", "war", "world", "crown"] as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`sc-tab tab-${id} ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              <span className="sc-tab-icon">{TAB_ICON[id]}</span> {TAB_LABEL[id]}
              {id === "war" && activeWar ? <span className="sc-war-badge">●</span> : null}
            </button>
          ))}
        </div>
        <div style={{ display: tab === "kingdom" ? "block" : "none", marginBottom: 12 }}>
          <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 512, borderRadius: 8, border: "1px solid #3a2f24" }} />
        </div>
        {tab === "kingdom" && (
          <div className="sc-tab-content sc-tab-kingdom">
            <p style={{ fontSize: 12, opacity: 0.65 }}>Selected: {selectedName}. Empty tile places a building; occupied tile upgrades (max {MAX_BUILDING_LEVEL}).</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {types.map((t) => {
                const afford = state ? canAfford(state, t.id) : false;
                return (
                  <button key={t.id} type="button" onClick={() => setSelectedBuild(t.id)} style={{ background: afford ? "#2d5a27" : "#2a221c", color: "#eee" }}>
                    {t.name}{selectedBuild === t.id ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            <h3>Market</h3>
            <p style={{ fontSize: 12 }}>{marketsN < 1 ? "Build a Market to trade." : `Markets ×${marketsN}`}</p>
            {MARKET_OFFERS.map((o) => (
              <button key={o.id} type="button" disabled={!(state && canTrade(state, o.id))} onClick={() => act((st) => (tryTrade(st, o.id) ? "Trade complete." : "Cannot trade."))}>{o.label}</button>
            ))}
          </div>
        )}
        {tab === "army" && (
          <div className="sc-tab-content sc-tab-army">
            {[1, 5, 10].map((q) => (
              <button key={q} type="button" onClick={() => setTrainQty(q)}>×{q}</button>
            ))}
            <span style={{ marginLeft: 8, fontSize: 12 }}>{barracksN ? `Barracks discount ${Math.round((1 - trainMult) * 100)}%` : ""}</span>
            <div>
              {unitTypes.map((u) => (
                <button key={u.id} type="button" disabled={!(state && canAffordTrain(state, u.id, trainQty))} onClick={() => act((st) => (tryTrain(st, { typeId: u.id, count: trainQty }) ? `Trained ${trainQty} ${u.name}.` : "Cannot afford that levy."))}>{u.name} ⚔{u.power}</button>
              ))}
            </div>
            <h3>Your Host</h3>
            <ArmyVisual state={state} realmId="player" />
          </div>
        )}
        {tab === "war" && (
          <div className="sc-tab-content sc-tab-war">
            <DiplomacyPanel
              rivalOp={rivalOp}
              playerOp={playerOp}
              onGift={() => act((st) => {
                const ok = tryGiftGold(st);
                if (!ok) return "Need 15 gold.";
                const thanks = getGiftThanks("rival");
                return `Lord Varric: "${thanks}"`;
              })}
            />
            <BattleVisual snap={battleSnap} active={!!activeWar} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {otherRealms.map((r) => {
                const left = state ? peaceTicksRemaining(state, "player", r.id) : 0;
                const locked = !!activeWar || left > 0;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={locked}
                    onClick={() => act((st) => {
                      const ok = tryDeclareWar(st, { attackerRealmId: "player", defenderRealmId: r.id });
                      if (!ok) return "Cannot declare war.";
                      const taunt = getWarTaunt(r.id);
                      const ruler = st.characters.find((c) => c.realmId === r.id)?.name ?? r.name;
                      return `${ruler} snarls: "${taunt}"`;
                    })}
                  >
                    {left > 0 ? `Peace with ${r.name} (${Math.ceil(left / 10)}s)` : `Declare on ${r.name}`}
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!activeWar} onClick={() => act((st, eng) => {
              const war = st.wars.find((w) => w.status === "active");
              const atk = war ? realmPower(st, war.attackerRealmId) : 0;
              const def = war ? realmPower(st, war.defenderRealmId) : 0;
              const r = tryResolveWar(st, eng.rng);
              if (r.ok && r.result && war) {
                setBattleSnap({ attackerId: war.attackerRealmId, defenderId: war.defenderRealmId, winnerId: r.result.winnerId, attackerPower: r.result.attackerPower ?? atk, defenderPower: r.result.defenderPower ?? def, phases: r.result.phases });
                return r.result.winnerId === "player" ? "Victory." : "Defeat.";
              }
              return "No active war.";
            })}>Fight</button>
            <button type="button" disabled={!activeWar} onClick={() => act((st) => (tryWhitePeace(st) ? "White peace signed." : "No war."))}>White Peace</button>
          </div>
        )}
        {tab === "world" && (
          <div className="sc-tab-content sc-tab-world">
            <h3>World Status</h3>
            <p style={{ fontSize: 13, opacity: 0.7 }}>Chronicle of other crowns, wars, and musters.</p>
            <ul style={{ fontSize: 13 }}>
              {worldEntries.length === 0 && <li>The world is quiet — for now.</li>}
              {worldEntries.map((e, i) => (
                <li key={`${e.tick}-${e.id}-${i}`}>Tick {e.tick}: {e.text}</li>
              ))}
            </ul>
            <WorldPanel
              state={state}
              onFoundGuild={() => act((st) => (tryFoundGuild(st) ? "Guild founded." : "You already lead a guild."))}
              onJoin={(id) => act((st) => (tryJoinFaction(st, id) ? "Joined the faction." : "Cannot join."))}
              onLeave={(id) => act((st) => (tryLeaveFaction(st, id) ? "Left the faction." : "Not a member."))}
              onGift={(id) => act((st) => {
                const ok = tryGiftGold(st, 15, id);
                if (!ok) return "Need 15 gold.";
                const r = st.realms.find((realm) => realm.id === id);
                const ruler = st.characters.find((c) => c.realmId === id)?.name ?? r?.name ?? "The ruler";
                const thanks = getGiftThanks(id);
                return `${ruler}: "${thanks}"`;
              })}
            />
          </div>
        )}
        {tab === "crown" && (
          <div className="sc-tab-content sc-tab-crown">
            <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} />
            <p>Ascend at {formatLetterSuffix(ascendNeed)} total resources.</p>
            <button type="button" disabled={!ascendReady} onClick={() => act((st) => (tryAscend(st) ? "Ascended." : "Not ready."))}>Ascend</button>
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={() => state && persist(state)}>Save</button>
              <button type="button" onClick={() => state && downloadSave(serializeState(state))}>Export</button>
              <button type="button" onClick={async () => {
                try {
                  const json = await pickSaveFile();
                  const st = deserializeState(json);
                  applyOfflineProgress(st);
                  st.meta.lastRealTime = Date.now();
                  engineRef.current = new TickEngine(st);
                  lastRivalWar.current = null;
                  setStatus("Imported.");
                  syncUi(engineRef.current);
                  persist(st);
                } catch { setStatus("Import cancelled."); }
              }}>Import</button>
              <button type="button" onClick={async () => {
                await clearIndexedDbSave();
                const st = createGameState({ seed: Date.now() >>> 0, withStarterBuildings: true });
                st.resources.wood = "40";
                st.resources.food = "50";
                engineRef.current = new TickEngine(st);
                lastRivalWar.current = null;
                setBattleSnap(null);
                setOfflineNote("");
                setTab("kingdom");
                persist(st);
                setStatus("New world generated.");
                syncUi(engineRef.current);
              }}>New Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
