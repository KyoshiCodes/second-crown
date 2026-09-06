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
  peaceTicksRemaining,
  tryAscend,
  canAscend,
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
  const [units, setUnits] = React.useState<GameState["units"]>([]);
  const [wars, setWars] = React.useState<GameState["wars"]>([]);
  const [characters, setCharacters] = React.useState<GameState["characters"]>([]);
  const [realms, setRealms] = React.useState<GameState["realms"]>([]);
  const [status, setStatus] = React.useState("");
  const [offlineNote, setOfflineNote] = React.useState("");
  const [power, setPower] = React.useState({ player: 0, rival: 0 });
  const [peaceLeft, setPeaceLeft] = React.useState(0);
  const [prestige, setPrestige] = React.useState(0);
  const [ascendReady, setAscendReady] = React.useState(false);
  const [selectedBuild, setSelectedBuild] = React.useState<string | null>("farm");
  const [trainQty, setTrainQty] = React.useState(1);
  const engineRef = React.useRef<TickEngine | null>(null);
  const mapRef = React.useRef<MapRenderer | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectedBuildRef = React.useRef<string | null>("farm");
  const lastRivalWar = React.useRef<string | null>(null);

  React.useEffect(() => {
    selectedBuildRef.current = selectedBuild;
  }, [selectedBuild]);

  const syncUi = React.useCallback((engine: TickEngine) => {
    const s = engine.getState();
    setTick(s.meta.tick);
    setResources({ ...s.resources });
    setIncome(computeIncomePerSecond(s));
    setUnits([...s.units]);
    setWars([...s.wars]);
    setCharacters([...s.characters]);
    setRealms([...s.realms]);
    setPower({
      player: realmPower(s, "player"),
      rival: realmPower(s, "rival"),
    });
    setPeaceLeft(peaceTicksRemaining(s));
    setPrestige(Number(s.flags["prestige_level"] ?? 0));
    setAscendReady(canAscend(s));
    mapRef.current?.sync(s);

    // Notify if rival just declared
    const rivalWar = s.wars.find(
      (w) => w.status === "active" && w.attackerRealmId === "rival"
    );
    if (rivalWar && rivalWar.id !== lastRivalWar.current) {
      lastRivalWar.current = rivalWar.id;
      setStatus("Iron March has declared war on you!");
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
          setStatus("New game — select a building, click the map to place");
          setOfflineNote("");
        }
      } catch {
        state = createGameState({ seed: 42, withStarterBuildings: true });
        state.resources.wood = "40";
        state.resources.food = "50";
        setStatus("New game");
        setOfflineNote("");
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
            const typeId = selectedBuildRef.current;
            if (!eng || !typeId) {
              setStatus("Select a building type first");
              return;
            }
            const st = eng.getState();
            // Occupied tile?
            if (st.buildings.some((b) => b.x === x && b.y === y)) {
              setStatus("Tile occupied");
              return;
            }
            const ok = tryBuild(st, { typeId, x, y });
            setStatus(ok ? `Built ${typeId} at (${x},${y})` : `Cannot afford ${typeId}`);
            if (ok) {
              syncUi(eng);
              saveToIndexedDb(serializeState(st)).catch(() => {});
            }
          });
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

  const handleTrain = (typeId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const ok = tryTrain(state, { typeId, count: trainQty });
    setStatus(ok ? `Trained ${trainQty} ${typeId}` : `Cannot afford ${trainQty}× ${typeId}`);
    if (ok) {
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    }
  };

  const handleDeclareWar = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const left = peaceTicksRemaining(state);
    if (left > 0) {
      setStatus(`Peace treaty — ${left} ticks remaining (~${Math.ceil(left / 10)}s)`);
      return;
    }
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
      const { winnerId, loot } = result.result;
      const lootStr = Object.entries(loot)
        .map(([r, v]) => `${formatLetterSuffix(v)} ${r}`)
        .join(", ");
      if (winnerId === "player") {
        setStatus(lootStr ? `Victory! Loot: ${lootStr}` : "Victory!");
      } else {
        setStatus(lootStr ? `Defeat — lost ${lootStr}` : "Defeat");
      }
      syncUi(engine);
      saveToIndexedDb(serializeState(state)).catch(() => {});
    } else {
      setStatus("No active war to resolve");
    }
  };

  const handleAscend = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    if (!tryAscend(state)) {
      setStatus("Need 50K total resources to claim the Second Crown");
      return;
    }
    setStatus(`Ascended! Prestige ${state.flags["prestige_level"]} — permanent +1 prod/building`);
    syncUi(engine);
    saveToIndexedDb(serializeState(state)).catch(() => {});
  };

  const handleNewGame = async () => {
    await clearIndexedDbSave();
    const state = createGameState({ seed: Date.now() >>> 0, withStarterBuildings: true });
    state.resources.wood = "40";
    state.resources.food = "50";
    const engine = new TickEngine(state);
    engineRef.current = engine;
    setStatus("New game — select a building, click the map to place");
    setOfflineNote("");
    lastRivalWar.current = null;
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
  const canDeclare = !activeWar && peaceLeft <= 0;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Second Crown</h1>
      <p style={{ opacity: 0.8, marginBottom: 4 }}>
        Phase L — map place, bulk train, rival attacks
        {prestige > 0 ? ` · Prestige ${prestige}` : ""}
      </p>
      {offlineNote ? (
        <p style={{ color: "#3fb950", fontSize: 13, marginTop: 0 }}>{offlineNote}</p>
      ) : null}

      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
        Selected: <strong>{selectedBuild ?? "none"}</strong> — click a grid tile to build
      </p>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          maxWidth: 512,
          borderRadius: 8,
          border: "1px solid #30363d",
          marginTop: 4,
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
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: -8 }}>
        Click a type to select, then click the map. Ambitious −10% cost · Advisor +1 prod
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {types.map((t) => {
          const afford = state ? canAfford(state, t.id) : false;
          const selected = selectedBuild === t.id;
          const costStr = Object.entries(t.cost)
            .map(([r, c]) => `${formatLetterSuffix(c)} ${r}`)
            .join(", ");
          return (
            <button
              key={t.id}
              type="button"
              title={`${t.name}\nCost: ${costStr}`}
              onClick={() => setSelectedBuild(t.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: selected ? "2px solid #58a6ff" : "1px solid #30363d",
                background: afford ? "#238636" : "#21262d",
                color: afford ? "#fff" : "#8b949e",
                cursor: "pointer",
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
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[1, 5, 10].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setTrainQty(q)}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              border: trainQty === q ? "1px solid #58a6ff" : "1px solid #30363d",
              background: trainQty === q ? "#1f6feb" : "#21262d",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ×{q}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {unitTypes.map((u) => {
          const afford = state ? canAffordTrain(state, u.id, trainQty) : false;
          const costStr = Object.entries(u.cost)
            .map(([r, c]) => `${formatLetterSuffix(Number(c) * trainQty)} ${r}`)
            .join(", ");
          return (
            <button
              key={u.id}
              type="button"
              disabled={!afford}
              title={`${u.name} ×${trainQty} — power ${u.power}\nCost: ${costStr}`}
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
              {u.name} (⚔{u.power}) ×{trainQty}
              <div style={{ fontSize: 11, opacity: 0.85 }}>{costStr}</div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
        {units.filter((u) => u.realmId === "player").length === 0 ? (
          <span style={{ opacity: 0.6 }}>No units yet</span>
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
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: -8 }}>
        Rival grows over time and may declare war if stronger than you
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={handleDeclareWar}
          disabled={!canDeclare}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #30363d",
            background: canDeclare ? "#a371f7" : "#21262d",
            color: "#fff",
            cursor: canDeclare ? "pointer" : "not-allowed",
          }}
        >
          {peaceLeft > 0
            ? `Peace (${Math.ceil(peaceLeft / 10)}s)`
            : "Declare war on Iron March"}
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

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Second Crown</h2>
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: -8 }}>
        Soft reset at 50K total resources. Permanent +1 prod/building per prestige.
      </p>
      <button
        type="button"
        onClick={handleAscend}
        disabled={!ascendReady}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #30363d",
          background: ascendReady ? "#d4a72c" : "#21262d",
          color: ascendReady ? "#000" : "#8b949e",
          cursor: ascendReady ? "pointer" : "not-allowed",
        }}
      >
        Claim the Second Crown{prestige > 0 ? ` (Prestige ${prestige})` : ""}
      </button>

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
