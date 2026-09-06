import React from "react";
import { createRoot } from "react-dom/client";
import {
  createGameState,
  TickEngine,
  tryBuild,
  canAfford,
  listBuildableTypes,
  listUnitTypes,
  tryTrain,
  canAffordTrain,
  tryDeclareWar,
  tryResolveWar,
  realmPower,
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
  const [units, setUnits] = React.useState<GameState["units"]>([]);
  const [wars, setWars] = React.useState<GameState["wars"]>([]);
  const [characters, setCharacters] = React.useState<GameState["characters"]>([]);
  const [realms, setRealms] = React.useState<GameState["realms"]>([]);
  const [status, setStatus] = React.useState("");
  const [offlineNote, setOfflineNote] = React.useState("");
  const [power, setPower] = React.useState({ player: 0, rival: 0 });
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
    setUnits([...s.units]);
    setWars([...s.wars]);
    setCharacters([...s.characters]);
    setRealms([...s.realms]);
    setPower({
      player: realmPower(s, "player"),
      rival: realmPower(s, "rival"),
    });
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
          state.resources.food = "50";
          setStatus("New game");
          setOfflineNote("");
        }
      } catch {
        state = createGameState({ seed: 42, withStarterBuildings: true });
        state.resources.wood = "40";
        state.resources.food = "50";
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
    setStatus(ok ? `Queued ${typeId}` : `Cannot afford ${typeId}`);
    if (ok) {
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    }
  };

  const handleTrain = (typeId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const ok = tryTrain(state, { typeId, count: 1 });
    setStatus(ok ? `Trained 1 ${typeId}` : `Cannot afford ${typeId}`);
    if (ok) {
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    }
  };

  const handleDeclareWar = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const ok = tryDeclareWar(state, {
      attackerRealmId: "player",
      defenderRealmId: "rival",
    });
    setStatus(ok ? "War declared on Iron March!" : "Cannot declare war");
    if (ok) {
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    }
  };

  const handleResolveWar = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const result = tryResolveWar(state, engine.rng);
    if (result.ok && result.result) {
      const { winnerId, loserId } = result.result;
      setStatus(
        winnerId === "player"
          ? `Victory! You defeated ${loserId}`
          : `Defeat — ${winnerId} won`
      );
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    } else {
      setStatus("No active war to resolve");
    }
  };

  const handleNewGame = async () => {
    await clearIndexedDbSave();
    const state = createGameState({ seed: Date.now() >>> 0, withStarterBuildings: true });
    state.resources.wood = "40";
    state.resources.food = "50";
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
  const unitTypes = listUnitTypes();
  const engine = engineRef.current;
  const state = engine?.getState();
  const activeWar = wars.find((w) => w.status === "active");

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Second Crown</h1>
      <p style={{ opacity: 0.8, marginBottom: 4 }}>Phase I — war, characters, polish</p>
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
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>Tick: {formatLetterSuffix(tick)}</span>
          <span style={{ opacity: 0.8 }}>
            Power: you {power.player} · rival {power.rival}
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
              title={`${t.name}\nCost: ${costStr}\n${prodStr}`}
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
                    background: `#${t.color.toString(16).padStart(6, "0")}`,
                    display: "inline-block",
                  }}
                />
                {t.name}
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{costStr}</div>
            </button>
          );
        })}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Army</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {unitTypes.map((u) => {
          const afford = state ? canAffordTrain(state, u.id, 1) : false;
          const costStr = Object.entries(u.cost)
            .map(([r, c]) => `${formatLetterSuffix(c)} ${r}`)
            .join(", ");
          return (
            <button
              key={u.id}
              type="button"
              disabled={!afford}
              title={`${u.name} — power ${u.power}\nCost: ${costStr}`}
              onClick={() => handleTrain(u.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #30363d",
                background: afford ? "#1f6feb" : "#21262d",
                color: afford ? "#fff" : "#8b949e",
                cursor: afford ? "pointer" : "not-allowed",
                textAlign: "left",
              }}
            >
              {u.name} (⚔{u.power})
              <div style={{ fontSize: 11, opacity: 0.85 }}>{costStr}</div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
        {units.filter((u) => u.realmId === "player").length === 0 ? (
          <span style={{ opacity: 0.6 }}>No units yet — train militia when you have food.</span>
        ) : (
          units
            .filter((u) => u.realmId === "player")
            .map((u) => (
              <span key={u.id} style={{ marginRight: 12 }}>
                {u.typeId} ×{formatLetterSuffix(u.count)}
              </span>
            ))
        )}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>War</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={handleDeclareWar}
          disabled={!!activeWar}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #30363d",
            background: activeWar ? "#21262d" : "#a371f7",
            color: "#fff",
            cursor: activeWar ? "not-allowed" : "pointer",
          }}
        >
          Declare war on Iron March
        </button>
        <button
          type="button"
          onClick={handleResolveWar}
          disabled={!activeWar}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #30363d",
            background: activeWar ? "#da3633" : "#21262d",
            color: "#fff",
            cursor: activeWar ? "pointer" : "not-allowed",
          }}
        >
          Fight battle
        </button>
      </div>
      <ul style={{ fontSize: 13, marginTop: 8 }}>
        {wars.length === 0 && <li style={{ opacity: 0.6 }}>No wars yet</li>}
        {wars.map((w) => (
          <li key={w.id}>
            {w.attackerRealmId} vs {w.defenderRealmId} — <strong>{w.status}</strong>
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>People</h2>
      <ul style={{ fontSize: 13 }}>
        {characters.map((c) => {
          const realm = realms.find((r) => r.id === c.realmId);
          return (
            <li key={c.id}>
              <strong>{c.name}</strong> ({c.role}) — {realm?.name ?? c.realmId}
              {c.traits.length ? ` · ${c.traits.join(", ")}` : ""}
              {c.ambition ? ` · ambition: ${c.ambition}` : ""}
            </li>
          );
        })}
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
