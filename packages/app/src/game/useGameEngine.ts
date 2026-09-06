import React from "react";
import {
  createGameState,
  TickEngine,
  tryBuild,
  tryUpgrade,
  canAscend,
  ascendThreshold,
  realmPower,
  serializeState,
  deserializeState,
  applyOfflineProgress,
  computeIncomePerSecond,
  getEventLog,
  getWorldLog,
  rivalOpinionOfPlayer,
  playerOpinionOfRival,
  playerTitle,
  getBuildingType,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { createMapRenderer, type MapRenderer } from "@second-crown/render";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "../save/indexedDb";
import { downloadSave, pickSaveFile } from "../save/fileIo";
import type { BattleSnap } from "../BattleVisual";
import { getWarTaunt } from "../content/flavor";
import { sfx } from "../sfx";

export type Tab = "kingdom" | "army" | "war" | "world" | "crown";
export type ActFn = (fn: (st: GameState, eng: TickEngine) => string) => void;

function freshState(seed: number): GameState {
  const state = createGameState({ seed, withStarterBuildings: true });
  state.resources.wood = "40";
  state.resources.food = "50";
  return state;
}

export function useGameEngine() {
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

  const persist = React.useCallback((st: GameState) => {
    saveToIndexedDb(serializeState(st)).catch(() => {});
  }, []);

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
      setStatus(`${name} declares war! "${getWarTaunt(incoming.attackerRealmId)}"`);
      setTab("war");
      setPaused(true);
      sfx.war();
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
          state = freshState(Date.now() >>> 0);
          setStatus("Click the map to place or upgrade buildings.");
        }
      } catch {
        state = freshState(42);
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
  }, [syncUi, persist]);

  const act: ActFn = React.useCallback((fn) => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    setStatus(fn(st, eng));
    syncUi(eng);
    persist(st);
  }, [syncUi, persist]);

  const saveNow = React.useCallback(() => {
    const st = engineRef.current?.getState();
    if (st) persist(st);
  }, [persist]);

  const exportSave = React.useCallback(() => {
    const st = engineRef.current?.getState();
    if (st) downloadSave(serializeState(st));
  }, []);

  const importSaveFile = React.useCallback(async () => {
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
    } catch {
      setStatus("Import cancelled.");
    }
  }, [syncUi, persist]);

  const newGame = React.useCallback(async () => {
    await clearIndexedDbSave();
    const st = freshState(Date.now() >>> 0);
    engineRef.current = new TickEngine(st);
    lastRivalWar.current = null;
    setBattleSnap(null);
    setOfflineNote("");
    setTab("kingdom");
    persist(st);
    setStatus("New world generated.");
    syncUi(engineRef.current);
  }, [syncUi, persist]);

  return {
    tab, setTab,
    tick, resources, income, units, wars,
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
    state: engineRef.current?.getState(),
    act,
    saveNow, exportSave, importSaveFile, newGame,
  };
}
