import React from "react";
import { createRoot } from "react-dom/client";
import {
  createGameState,
  TickEngine,
  D,
  tryBuild,
  canAfford,
  listBuildableTypes,
  serializeState,
  deserializeState,
  type GameState,
} from "@second-crown/sim";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "./save/indexedDb";

function App() {
  const [tick, setTick] = React.useState(0);
  const [resources, setResources] = React.useState<Record<string, string>>({});
  const [buildings, setBuildings] = React.useState<GameState["buildings"]>([]);
  const [status, setStatus] = React.useState("");
  const engineRef = React.useRef<TickEngine | null>(null);
  const nextSlot = React.useRef(0);

  const syncUi = React.useCallback((engine: TickEngine) => {
    const s = engine.getState();
    setTick(s.meta.tick);
    setResources({ ...s.resources });
    setBuildings([...s.buildings]);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      let state: GameState;
      try {
        const saved = await loadFromIndexedDb();
        if (saved) {
          state = deserializeState(saved);
          setStatus("Loaded autosave");
        } else {
          state = createGameState({ seed: 42, withStarterBuildings: true });
          // Give a little wood so the player can build soon
          state.resources.wood = "30";
          state.resources.food = "20";
          setStatus("New game");
        }
      } catch {
        state = createGameState({ seed: 42, withStarterBuildings: true });
        state.resources.wood = "30";
        state.resources.food = "20";
        setStatus("New game (save load failed)");
      }

      if (cancelled) return;

      const engine = new TickEngine(state);
      engineRef.current = engine;
      nextSlot.current = state.buildings.length;
      syncUi(engine);

      const id = window.setInterval(() => {
        engine.tick();
        syncUi(engine);
        // Autosave every 50 ticks (~5s)
        if (engine.getState().meta.tick % 50 === 0) {
          saveToIndexedDb(serializeState(engine.getState())).catch(() => {});
        }
      }, 100);

      return () => window.clearInterval(id);
    })();

    return () => {
      cancelled = true;
    };
  }, [syncUi]);

  const format = (s: string | undefined) => {
    if (!s) return "0";
    const d = D(s);
    if (d.lt(1000)) return d.toFixed(0);
    return d.toString();
  };

  const handleBuild = (typeId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const slot = nextSlot.current++;
    const ok = tryBuild(state, { typeId, x: slot, y: 0 });
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
    state.resources.wood = "30";
    state.resources.food = "20";
    const engine = new TickEngine(state);
    engineRef.current = engine;
    nextSlot.current = state.buildings.length;
    setStatus("New game");
    syncUi(engine);
  };

  const handleSave = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await saveToIndexedDb(serializeState(engine.getState()));
    setStatus("Saved");
  };

  const types = listBuildableTypes();
  const engine = engineRef.current;
  const state = engine?.getState();

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Second Crown</h1>
      <p style={{ opacity: 0.8 }}>Phase E — build, save, load</p>

      <div
        style={{
          background: "#161b22",
          borderRadius: 8,
          padding: 16,
          marginTop: 16,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div>Tick: {tick}</div>
        <div style={{ marginTop: 12 }}>
          <div>Food:  {format(resources.food)}</div>
          <div>Wood:  {format(resources.wood)}</div>
          <div>Stone: {format(resources.stone)}</div>
          <div>Gold:  {format(resources.gold)}</div>
        </div>
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>{status}</div>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Build</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {types.map((t) => {
          const afford = state ? canAfford(state, t.id) : false;
          const costStr = Object.entries(t.cost)
            .map(([r, c]) => `${c} ${r}`)
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
              }}
            >
              {t.name}
              <div style={{ fontSize: 11, opacity: 0.85 }}>{costStr}</div>
            </button>
          );
        })}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Buildings ({buildings.length})</h2>
      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
        {buildings.map((b) => (
          <li key={b.id}>
            {b.typeId} @ ({b.x},{b.y}){" "}
            {b.completesAtTick === null
              ? "— complete"
              : `— finishes tick ${b.completesAtTick}`}
          </li>
        ))}
      </ul>

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
