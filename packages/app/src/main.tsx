import React from "react";
import { createRoot } from "react-dom/client";
import {
  createGameState,
  TickEngine,
  tryBuild,
  canAfford,
  listBuildableTypes,
  serializeState,
  deserializeState,
  applyOfflineProgress,
  formatLetterSuffix,
  computeIncomePerSecond,
  type GameState,
} from "@second-crown/sim";
import { createMapRenderer, type MapRenderer } from "@second-crown/render";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "./save/indexedDb";

function App() {
  const [tick, setTick] = React.useState(0);
  const [resources, setResources] = React.useState<Record<string, string>>({});
  const [income, setIncome] = React.useState<Record<string, string>>({});
  const [buildings, setBuildings] = React.useState<GameState["buildings"]>([]);
  const [status, setStatus] = React.useState("");
  const [offlineNote, setOfflineNote] = React.useState("");
  const engineRef = React.useRef<TickEngine | null>(null);
  const mapRef = React.useRef<MapRenderer | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const nextSlot = React.useRef(0);

  const syncUi = React.useCallback((engine: TickEngine) => {
    const s = engine.getState();
    setTick(s.meta.tick);
    setResources({ ...s.resources });
    setIncome(computeIncomePerSecond(s));
    setBuildings([...s.buildings]);
    mapRef.current?.sync(s);
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
          if (settled > 0) {
            const secs = Math.floor(settled / 10);
            setOfflineNote(`Welcome back — settled ${settled} ticks (~${secs}s offline)`);
          } else {
            setOfflineNote("");
          }
          setStatus("Loaded autosave");
        } else {
          state = createGameState({ seed: 42, withStarterBuildings: true });
          state.resources.wood = "40";
          state.resources.food = "30";
          setStatus("New game");
          setOfflineNote("");
        }
      } catch {
        state = createGameState({ seed: 42, withStarterBuildings: true });
        state.resources.wood = "40";
        state.resources.food = "30";
        setStatus("New game (save load failed)");
        setOfflineNote("");
      }

      if (cancelled) return;

      state.meta.lastRealTime = Date.now();
      const engine = new TickEngine(state);
      engineRef.current = engine;
      nextSlot.current = state.buildings.length;

      if (canvasRef.current) {
        try {
          const map = await createMapRenderer(canvasRef.current);
          if (cancelled) {
            map.destroy();
            return;
          }
          mapRef.current = map;
          map.sync(state);
        } catch (e) {
          console.warn("Map renderer failed", e);
        }
      }

      syncUi(engine);

      intervalId = window.setInterval(() => {
        engine.tick();
        engine.getState().meta.lastRealTime = Date.now();
        syncUi(engine);
        if (engine.getState().meta.tick % 50 === 0) {
          saveToIndexedDb(serializeState(engine.getState())).catch(() => {});
        }
      }, 100);
    })();

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [syncUi]);

  const handleBuild = (typeId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const slot = nextSlot.current++;
    const x = slot % 16;
    const y = Math.floor(slot / 16) % 10;
    const ok = tryBuild(state, { typeId, x, y });
    if (ok) {
      setStatus(`Queued ${typeId}`);
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    } else {
      setStatus(`Cannot afford ${typeId}`);
    }
  };

  const handleNewGame = async () => {
    await clearIndexedDbSave();
    const state = createGameState({ seed: Date.now() >>> 0, withStarterBuildings: true });
    state.resources.wood = "40";
    state.resources.food = "30";
    const engine = new TickEngine(state);
    engineRef.current = engine;
    nextSlot.current = state.buildings.length;
    setStatus("New game");
    setOfflineNote("");
    syncUi(engine);
  };

  const handleSave = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.getState().meta.lastRealTime = Date.now();
    await saveToIndexedDb(serializeState(engine.getState()));
    setStatus("Saved");
  };

  const types = listBuildableTypes();
  const engine = engineRef.current;
  const state = engine?.getState();

  const completeCount = buildings.filter((b) => b.completesAtTick === null).length;

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Second Crown</h1>
      <p style={{ opacity: 0.8, marginBottom: 4 }}>Phase G+H — economy depth & map</p>
      {offlineNote ? (
        <p style={{ color: "#3fb950", fontSize: 13, marginTop: 0 }}>{offlineNote}</p>
      ) : null}

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          maxWidth: 512,
          borderRadius: 8,
          border: "1px solid #30363d",
          marginTop: 12,
          imageRendering: "pixelated",
        }}
      />

      <div
        style={{
          background: "#161b22",
          borderRadius: 8,
          padding: 16,
          marginTop: 12,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Tick: {formatLetterSuffix(tick)}</span>
          <span style={{ opacity: 0.7 }}>
            Buildings: {completeCount}/{buildings.length}
          </span>
        </div>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {(["food", "wood", "stone", "gold"] as const).map((r) => (
            <div key={r}>
              {r[0].toUpperCase() + r.slice(1)}:{" "}
              {formatLetterSuffix(resources[r] ?? "0")}
              <span style={{ opacity: 0.55, fontSize: 12 }}>
                {" "}
                (+{formatLetterSuffix(income[r] ?? "0")}/s)
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>{status}</div>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Build</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {types.map((t) => {
          const afford = state ? canAfford(state, t.id) : false;
          const costStr = Object.entries(t.cost)
            .map(([r, c]) => `${formatLetterSuffix(c)} ${r}`)
            .join(", ");
          const prodStr = Object.entries(t.productionPerTick)
            .map(([r, c]) => `+${Number(c) * 10} ${r}/s`)
            .join(", ");
          return (
            <button
              key={t.id}
              type="button"
              disabled={!afford}
              onClick={() => handleBuild(t.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #30363d",
                background: afford ? "#238636" : "#21262d",
                color: afford ? "#fff" : "#8b949e",
                cursor: afford ? "pointer" : "not-allowed",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: `#${(t.color ?? 0x888888).toString(16).padStart(6, "0")}`,
                    display: "inline-block",
                  }}
                />
                {t.name}
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{costStr}</div>
              <div style={{ fontSize: 10, opacity: 0.65 }}>{prodStr}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
        <button type="button" onClick={handleSave}>
          Save now
        </button>
        <button type="button" onClick={handleNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
