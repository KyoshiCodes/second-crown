import React from "react";
import {
  createGameState,
  TickEngine,
  tryBuild,
  tryCancelBuild,
  tryCancelUpgrade,
  tryUpgrade,
  upgradeJobFor,
  canAfford,
  canPlaceType,
  isUniqueBuilding,
  realmOwnsType,
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
  getProvince,
  setPlayerCulture,
  incomingOnHome,
  incomingOnPlayerFlags,
  watchtowerWarning,
  countBuilding,
  WORK_PLOTS,
  canRaiseWork,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { createMapRenderer, type MapRenderer, type CameraBand } from "@second-crown/render";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "../save/indexedDb";
import { downloadSave, pickSaveFile } from "../save/fileIo";
import { settleOnLoad } from "./settleOnLoad";
import { loadSaved } from "./loadSaved";
import type { BattleSnap } from "../BattleVisual";
import { getWarTaunt } from "../content/flavor";
import { sfx } from "../sfx";
import { rememberedCulture } from "../CulturePicker";

export type Tab = "kingdom" | "army" | "war" | "world" | "crown";
export type ActFn = (fn: (st: GameState, eng: TickEngine) => string) => void;

function freshState(seed: number): GameState {
  const state = createGameState({ seed, withStarterBuildings: true });
  state.resources.wood = "40";
  state.resources.food = "50";
  setPlayerCulture(state, rememberedCulture());
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
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<string | null>(null);
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
  const [cameraBand, setCameraBand] = React.useState<CameraBand>("hold");
  const [battleSnap, setBattleSnap] = React.useState<BattleSnap | null>(null);
  const seenEventTick = React.useRef(0);
  const speedRef = React.useRef(1);
  const pausedRef = React.useRef(false);
  const engineRef = React.useRef<TickEngine | null>(null);
  const mapRef = React.useRef<MapRenderer | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectedBuildRef = React.useRef<string | null>("farm");
  const selectedProvinceIdRef = React.useRef<string | null>(null);
  const lastRivalWar = React.useRef<string | null>(null);
  const lastIncoming = React.useRef<string | null>(null);
  const lastFlagHit = React.useRef<string | null>(null);

  React.useEffect(() => { selectedBuildRef.current = selectedBuild; }, [selectedBuild]);
  React.useEffect(() => {
    selectedProvinceIdRef.current = selectedProvinceId;
    mapRef.current?.setSelectedProvince(selectedProvinceId);
  }, [selectedProvinceId]);
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
    const worldLine = typeof s.flags.last_world === "string" ? s.flags.last_world : "";
    if (worldLine) {
      window.dispatchEvent(new CustomEvent("sc-world-dispatch", { detail: worldLine }));
    }
    mapRef.current?.sync(s, selectedProvinceIdRef.current);
    const incoming = incomingOnHome(s)[0];
    if (incoming && incoming.id !== lastIncoming.current) {
      lastIncoming.current = incoming.id;
      const named = watchtowerWarning(s);
      const name = named
        ? s.realms.find((r) => r.id === incoming.realmId)?.name ?? incoming.realmId
        : "Unknown host";
      const eta = Math.max(0, Math.ceil((incoming.arrivesTick - s.meta.tick) / 10));
      setStatus(`${name} marches on your hold · ${eta}s.`);
      sfx.war();
    }
    if (!incoming) lastIncoming.current = null;
    const flagHit = incomingOnPlayerFlags(s)[0];
    if (flagHit && flagHit.id !== lastFlagHit.current) {
      lastFlagHit.current = flagHit.id;
      const named = countBuilding(s, "watchtower") > 0;
      const name = named
        ? s.realms.find((r) => r.id === flagHit.realmId)?.name ?? flagHit.realmId
        : "Unknown host";
      const dest = getProvince(s, flagHit.toId);
      const where = dest ? `${dest.x},${dest.y}` : "a flag";
      const eta = Math.max(0, Math.ceil((flagHit.arrivesTick - s.meta.tick) / 10));
      setStatus(`${name} contests flag ${where} · ${eta}s.`);
    }
    if (!flagHit) lastFlagHit.current = null;
    const warIn = s.wars.find(
      (w) => w.status === "active" && w.defenderRealmId === "player" && w.attackerRealmId !== "player"
    );
    if (warIn && warIn.id !== lastRivalWar.current) {
      lastRivalWar.current = warIn.id;
      const name = s.realms.find((r) => r.id === warIn.attackerRealmId)?.name ?? warIn.attackerRealmId;
      setStatus(`${name} declares war! "${getWarTaunt(warIn.attackerRealmId)}" Clock still runs.`);
      sfx.war();
    }
  }, []);

  /** One tap on a hold tile: the map canvas and the keep interior share this, so both follow the same build rules. */
  const tapHoldTile = React.useCallback((x: number, y: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    const existing = st.buildings.find((b) => b.x === x && b.y === y);
    if (existing) {
      const nm = getBuildingType(existing.typeId)?.name ?? existing.typeId;
      if (existing.completesAtTick !== null) {
        const ok = tryCancelBuild(st, existing.id);
        setStatus(ok ? `Struck the ${nm} scaffolding. Unused stores returned.` : `Cannot cancel ${nm}.`);
        if (ok) { syncUi(eng); persist(st); }
        return;
      }
      if (upgradeJobFor(st, existing.id)) {
        const ok = tryCancelUpgrade(st, existing.id);
        setStatus(ok ? `Stopped improving the ${nm}. Unused stores returned.` : `Cannot cancel ${nm}.`);
        if (ok) { syncUi(eng); persist(st); }
        return;
      }
      const ok = tryUpgrade(st, existing.id);
      setStatus(ok ? `Improving ${nm} toward level ${existing.level + 1}.` : "Cannot upgrade that building.");
      if (ok) { syncUi(eng); persist(st); }
      return;
    }
    const typeId = selectedBuildRef.current;
    if (!typeId) return;
    const nm = getBuildingType(typeId)?.name ?? typeId;
    if (!canPlaceType(st, typeId, x, y)) {
      setStatus(
        typeId === "walls" || typeId === "gate"
          ? "Walls and gates belong on the rim."
          : isUniqueBuilding(typeId) && realmOwnsType(st, typeId)
            ? `You already have a ${nm}. Upgrade that one.`
            : WORK_PLOTS.has(typeId) && !canRaiseWork(st)
              ? "No free work plots. Raise or improve a cottage, or upgrade the keep."
              : "That plot is taken or outside the hold."
      );
      return;
    }
    const ok = tryBuild(st, { typeId, x, y });
    setStatus(ok ? `Built ${nm}.` : canAfford(st, typeId) ? `Cannot place ${nm}.` : `Cannot afford ${nm}.`);
    if (ok) { syncUi(eng); persist(st); }
  }, [syncUi, persist]);

  React.useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;
    (async () => {
      let state: GameState;
      try {
        const saved = await loadFromIndexedDb();
        if (saved) {
          // Solo returns this same state; a shared realm reads the server save (REALTIME.md Phase 2).
          state = (await loadSaved(deserializeState(saved))).state;
          const result = await settleOnLoad(state);
          const settled = result.mode === "solo" ? result.settled : 0;
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
          map.onTileClick(tapHoldTile);
          map.onProvinceClick((provinceId) => {
            const eng = engineRef.current;
            if (!eng) return;
            const st = eng.getState();
            setSelectedProvinceId(provinceId);
            const dest = getProvince(st, provinceId);
            const label = dest
              ? `${dest.node !== "none" ? dest.node : dest.terrain} (${dest.x}, ${dest.y})`
              : provinceId;
            setStatus(provinceId === st.board.homeProvinceId ? `Your hold — ${label}.` : `Inspecting ${label}.`);
            if (provinceId === st.board.homeProvinceId) {
              mapRef.current?.setBand("hold");
              setCameraBand("hold");
            }
          });
          map.onBandChange((newBand) => {
            setCameraBand(newBand);
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
  }, [syncUi, persist, tapHoldTile]);

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
      lastIncoming.current = null;
      lastFlagHit.current = null;
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
    lastIncoming.current = null;
    lastFlagHit.current = null;
    setBattleSnap(null);
    setOfflineNote("");
    setTab("kingdom");
    persist(st);
    setStatus("New world generated.");
    syncUi(engineRef.current);
  }, [syncUi, persist]);

  const setMapTheme = React.useCallback((themeId: string, holidayId: string) => {
    mapRef.current?.setTheme(themeId, holidayId);
  }, []);

  const zoomIn = React.useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const zoomOut = React.useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const resetView = React.useCallback(() => {
    mapRef.current?.resetView();
  }, []);

  const setCameraBandExplicit = React.useCallback((b: CameraBand) => {
    mapRef.current?.setBand(b);
    setCameraBand(b);
  }, []);

  const toggleCameraBand = React.useCallback(() => {
    const current = mapRef.current?.getBand() ?? "hold";
    const next = current === "hold" ? "board" : "hold";
    mapRef.current?.setBand(next);
    setCameraBand(next);
  }, []);

  React.useEffect(() => {
    const onToggle = () => {
      toggleCameraBand();
    };
    const onBand = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail === "hold" || detail === "board") {
        setCameraBand(detail);
      }
    };
    window.addEventListener("sc-toggle-camera-band", onToggle);
    window.addEventListener("sc-camera-band-change", onBand);
    return () => {
      window.removeEventListener("sc-toggle-camera-band", onToggle);
      window.removeEventListener("sc-camera-band-change", onBand);
    };
  }, [toggleCameraBand]);

  return {
    tab, setTab,
    tick, resources, income, units, wars,
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
    setCameraBand: setCameraBandExplicit,
    toggleCameraBand,
    state: engineRef.current?.getState(),
    act,
    tapHoldTile,
    saveNow, exportSave, importSaveFile, newGame,
  };
}
