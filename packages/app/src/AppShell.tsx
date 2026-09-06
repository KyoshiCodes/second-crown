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
  tryGiftGold,
  rivalOpinionOfPlayer,
  playerOpinionOfRival,
  tryFoundGuild,
  tryJoinFaction,
  tryLeaveFaction,
  playerTitle,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { createMapRenderer, type MapRenderer } from "@second-crown/render";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "./save/indexedDb";
import { downloadSave, pickSaveFile } from "./save/fileIo";
import { EventPanel } from "./EventPanel";
import { SpeedControls, DiplomacyPanel } from "./HudControls";
import { WorldPanel } from "./WorldPanel";

type Tab = "kingdom" | "army" | "war" | "crown";

export function AppShell() {
  const [tab, setTab] = React.useState<Tab>("kingdom");
  const [tick, setTick] = React.useState(0);
  const [resources, setResources] = React.useState<Record<string, string>>({});
  const [income, setIncome] = React.useState<Record<string, string>>({});
  const [buildings, setBuildings] = React.useState<GameState["buildings"]>([]);
  const [units, setUnits] = React.useState<GameState["units"]>([]);
  const [wars, setWars] = React.useState<GameState["wars"]>([]);
  const [status, setStatus] = React.useState("");
  const [offlineNote, setOfflineNote] = React.useState("");
  const [power, setPower] = React.useState({ player: 0, rival: 0 });
  const [peaceLeft, setPeaceLeft] = React.useState(0);
  const [prestige, setPrestige] = React.useState(0);
  const [ascendReady, setAscendReady] = React.useState(false);
  const [ascendNeed, setAscendNeed] = React.useState(30_000);
  const [selectedBuild, setSelectedBuild] = React.useState<string | null>("farm");
  const [trainQty, setTrainQty] = React.useState(1);
  const [lastEvent, setLastEvent] = React.useState("");
  const [lastEventTick, setLastEventTick] = React.useState(0);
  const [eventLog, setEventLog] = React.useState<WorldEvent[]>([]);
  const [speed, setSpeed] = React.useState(1);
  const [paused, setPaused] = React.useState(false);
  const [rivalOp, setRivalOp] = React.useState(0);
  const [playerOp, setPlayerOp] = React.useState(0);
  const [title, setTitle] = React.useState("Petty Lord");
  const seenEventTick = React.useRef(0);
  const speedRef = React.useRef(1);
  const pausedRef = React.useRef(false);
  const engineRef = React.useRef<TickEngine | null>(null);
  const mapRef = React.useRef<MapRenderer | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectedBuildRef = React.useRef<string | null>("farm");
  const lastRivalWar = React.useRef<string | null>(null);

  React.useEffect(() => {
    selectedBuildRef.current = selectedBuild;
  }, [selectedBuild]);
  React.useEffect(() => {
    speedRef.current = speed;
    pausedRef.current = paused;
  }, [speed, paused]);

  const persist = (st: GameState) => saveToIndexedDb(serializeState(st)).catch(() => {});

  const syncUi = React.useCallback((engine: TickEngine) => {
    const s = engine.getState();
    setTick(s.meta.tick);
    setResources({ ...s.resources });
    setIncome(computeIncomePerSecond(s));
    setBuildings([...s.buildings]);
    setUnits([...s.units]);
    setWars([...s.wars]);
    setPower({ player: realmPower(s, "player"), rival: realmPower(s, "rival") });
    setPeaceLeft(peaceTicksRemaining(s));
    setPrestige(Number(s.flags["prestige_level"] ?? 0));
    setAscendReady(canAscend(s));
    setAscendNeed(ascendThreshold(s));
    setLastEvent(typeof s.flags.last_event === "string" ? s.flags.last_event : "");
    setLastEventTick(Number(s.flags.last_event_tick ?? 0));
    setEventLog(getEventLog(s));
    setRivalOp(rivalOpinionOfPlayer(s));
    setPlayerOp(playerOpinionOfRival(s));
    setTitle(playerTitle(s));
    const evTick = Number(s.flags.last_event_tick ?? 0);
    if (evTick > 0 && evTick !== seenEventTick.current) {
      seenEventTick.current = evTick;
      setStatus(String(s.flags.last_event ?? ""));
    }
    mapRef.current?.sync(s);
    const rivalWar = s.wars.find((w) => w.status === "active" && w.attackerRealmId !== "player");
    if (rivalWar && rivalWar.id !== lastRivalWar.current) {
      lastRivalWar.current = rivalWar.id;
      setStatus(`${rivalWar.attackerRealmId} has declared war!`);
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
          setOfflineNote(
            settled > 0 ? `Welcome back — settled ${settled} ticks` : ""
          );
          setStatus("Loaded autosave — use New game on Crown if extra kingdoms are missing");
        } else {
          state = createGameState({ seed: (Date.now() >>> 0), withStarterBuildings: true });
          state.resources.wood = "40";
          state.resources.food = "50";
          setStatus("Click map to place / upgrade");
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
          if (cancelled) {
            map.destroy();
            return;
          }
          mapRef.current = map;
          map.sync(state);
          map.onTileClick((x, y) => {
            const eng = engineRef.current;
            if (!eng) return;
            const st = eng.getState();
            const existing = st.buildings.find((b) => b.x === x && b.y === y);
            if (existing) {
              const ok = tryUpgrade(st, existing.id);
              setStatus(ok ? `Upgraded ${existing.typeId} lv${existing.level}` : "Cannot upgrade");
              if (ok) {
                syncUi(eng);
                persist(st);
              }
              return;
            }
            const typeId = selectedBuildRef.current;
            if (!typeId) return;
            const ok = tryBuild(st, { typeId, x, y });
            setStatus(ok ? `Built ${typeId}` : `Cannot afford ${typeId}`);
            if (ok) {
              syncUi(eng);
              persist(st);
            }
          });
        } catch (e) {
          console.warn(e);
        }
      }
      syncUi(engine);
      intervalId = window.setInterval(() => {
        if (pausedRef.current) return;
        const n = Math.max(1, speedRef.current);
        for (let i = 0; i < n; i++) engine.tick();
        engine.getState().meta.lastRealTime = Date.now();
        syncUi(engine);
        if (engine.getState().meta.tick % 50 === 0) persist(engine.getState());
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

  const engine = engineRef.current;
  const state = engine?.getState();
  const types = listBuildableTypes();
  const unitTypes = listUnitTypes();
  const activeWar = wars.find((w) => w.status === "active");
  const canDeclare = !activeWar && peaceLeft <= 0;
  const trainMult = state ? trainCostMultiplier(state) : 1;
  const barracksN = state ? countBuilding(state, "barracks") : 0;
  const marketsN = state ? countBuilding(state, "market") : 0;

  return (
    <div style={{ padding: 20, maxWidth: 740, margin: "0 auto", position: "relative" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>Second Crown</h1>
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {title} · Tick {formatLetterSuffix(tick)}
        {prestige > 0 ? ` · Prestige ${prestige}` : ""} · Power {power.player} vs {power.rival}
      </div>
      {offlineNote ? <p style={{ color: "#3fb950" }}>{offlineNote}</p> : null}
      <SpeedControls
        paused={paused}
        speed={speed}
        onPauseToggle={() => setPaused((p) => !p)}
        onSpeed={(n) => {
          setPaused(false);
          setSpeed(n);
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          background: "#16100c",
          padding: 12,
          borderRadius: 8,
          margin: "12px 0",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {(["food", "wood", "stone", "gold"] as const).map((r) => (
          <div key={r}>
            <div style={{ opacity: 0.55, fontSize: 11 }}>{r}</div>
            <div>{formatLetterSuffix(resources[r] ?? "0")}</div>
            <div style={{ opacity: 0.5, fontSize: 11 }}>+{formatLetterSuffix(income[r] ?? "0")}/s</div>
          </div>
        ))}
      </div>
      {status ? <div style={{ marginBottom: 10, opacity: 0.85 }}>{status}</div> : null}

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {(["kingdom", "army", "war", "crown"] as Tab[]).map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)}>
            {id}
            {id === "war" && activeWar ? " ●" : ""}
          </button>
        ))}
      </div>

      <div style={{ display: tab === "kingdom" ? "block" : "none", marginBottom: 12 }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", maxWidth: 512, borderRadius: 8, border: "1px solid #3a2f24" }}
        />
      </div>

      {tab === "kingdom" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.65 }}>Selected {selectedBuild} — empty tile places, occupied upgrades (max {MAX_BUILDING_LEVEL})</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {types.map((t) => {
              const afford = state ? canAfford(state, t.id) : false;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedBuild(t.id)}
                  style={{ background: afford ? "#2d5a27" : "#2a221c", color: "#eee" }}
                >
                  {t.name}
                  {selectedBuild === t.id ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <h3>Market</h3>
          <p style={{ fontSize: 12 }}>{marketsN < 1 ? "Build a Market to trade." : `Markets ×${marketsN}`}</p>
          {MARKET_OFFERS.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={!(state && canTrade(state, o.id))}
              onClick={() =>
                act((st) => (tryTrade(st, o.id) ? "Trade complete" : "Cannot trade"))
              }
            >
              {o.label}
            </button>
          ))}
        </>
      )}

      {tab === "army" && (
        <>
          {[1, 5, 10].map((q) => (
            <button key={q} type="button" onClick={() => setTrainQty(q)}>
              ×{q}
            </button>
          ))}
          <span style={{ marginLeft: 8, fontSize: 12 }}>
            {barracksN ? `Barracks discount ${Math.round((1 - trainMult) * 100)}%` : ""}
          </span>
          <div>
            {unitTypes.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={!(state && canAffordTrain(state, u.id, trainQty))}
                onClick={() =>
                  act((st) =>
                    tryTrain(st, { typeId: u.id, count: trainQty })
                      ? `Trained ${trainQty} ${u.name}`
                      : "Cannot afford"
                  )
                }
              >
                {u.name} ⚔{u.power}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            {units.filter((u) => u.realmId === "player").map((u) => (
              <span key={u.id} style={{ marginRight: 8 }}>
                {u.typeId}×{formatLetterSuffix(u.count)}
              </span>
            ))}
          </div>
        </>
      )}

      {tab === "war" && (
        <>
          <DiplomacyPanel rivalOp={rivalOp} playerOp={playerOp} onGift={() => act((st) => (tryGiftGold(st) ? "Gift sent" : "Need 15 gold"))} />
          <button
            type="button"
            disabled={!canDeclare}
            onClick={() =>
              act((st) =>
                tryDeclareWar(st, { attackerRealmId: "player", defenderRealmId: "rival" })
                  ? "War declared"
                  : "Cannot declare"
              )
            }
          >
            {peaceLeft > 0 ? `Peace (${Math.ceil(peaceLeft / 10)}s)` : "Declare on Iron March"}
          </button>
          <button
            type="button"
            disabled={!activeWar}
            onClick={() =>
              act((st, eng) => {
                const r = tryResolveWar(st, eng.rng);
                return r.ok ? `Battle: ${r.result?.winnerId} wins` : "No war";
              })
            }
          >
            Fight
          </button>
          <button type="button" disabled={!activeWar} onClick={() => act((st) => (tryWhitePeace(st) ? "White peace" : "No war"))}>
            White peace
          </button>
          <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} />
          <WorldPanel
            state={state}
            onFoundGuild={() => act((st) => (tryFoundGuild(st) ? "Guild founded" : "Already lead a guild"))}
            onJoin={(id) => act((st) => (tryJoinFaction(st, id) ? "Joined" : "Cannot join"))}
            onLeave={(id) => act((st) => (tryLeaveFaction(st, id) ? "Left" : "Not a member"))}
          />
        </>
      )}

      {tab === "crown" && (
        <>
          <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} />
          <WorldPanel
            state={state}
            onFoundGuild={() => act((st) => (tryFoundGuild(st) ? "Guild founded" : "Already lead a guild"))}
            onJoin={(id) => act((st) => (tryJoinFaction(st, id) ? "Joined" : "Cannot join"))}
            onLeave={(id) => act((st) => (tryLeaveFaction(st, id) ? "Left" : "Not a member"))}
          />
          <p>Ascend at {formatLetterSuffix(ascendNeed)} total resources.</p>
          <button type="button" disabled={!ascendReady} onClick={() => act((st) => (tryAscend(st) ? "Ascended" : "Not ready"))}>
            Ascend
          </button>
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => state && persist(state)}>
              Save
            </button>
            <button type="button" onClick={() => state && downloadSave(serializeState(state))}>
              Export
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const json = await pickSaveFile();
                  const st = deserializeState(json);
                  applyOfflineProgress(st);
                  st.meta.lastRealTime = Date.now();
                  engineRef.current = new TickEngine(st);
                  lastRivalWar.current = null;
                  setStatus("Imported");
                  syncUi(engineRef.current);
                  persist(st);
                } catch {
                  setStatus("Import cancelled");
                }
              }}
            >
              Import
            </button>
            <button
              type="button"
              onClick={async () => {
                await clearIndexedDbSave();
                const st = createGameState({ seed: Date.now() >>> 0, withStarterBuildings: true });
                st.resources.wood = "40";
                st.resources.food = "50";
                engineRef.current = new TickEngine(st);
                lastRivalWar.current = null;
                setTab("kingdom");
                setStatus("New world generated");
                syncUi(engineRef.current);
              }}
            >
              New game
            </button>
          </div>
        </>
      )}
    </div>
  );
}
