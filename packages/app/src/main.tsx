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
  trainCostMultiplier,
  tryDeclareWar,
  tryResolveWar,
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
  type GameState,
} from "@second-crown/sim";
import { createMapRenderer, type MapRenderer } from "@second-crown/render";
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDbSave } from "./save/indexedDb";
import { downloadSave, pickSaveFile } from "./save/fileIo";

type Tab = "kingdom" | "army" | "war" | "crown";

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  borderRadius: 6,
  border: active ? "1px solid #58a6ff" : "1px solid #30363d",
  background: active ? "#1f2937" : "#161b22",
  color: active ? "#fff" : "#8b949e",
  cursor: "pointer",
  fontWeight: active ? 600 : 400,
});

function App() {
  const [tab, setTab] = React.useState<Tab>("kingdom");
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
  const [peaceLeft, setPeaceLeft] = React.useState(0);
  const [prestige, setPrestige] = React.useState(0);
  const [ascendReady, setAscendReady] = React.useState(false);
  const [ascendNeed, setAscendNeed] = React.useState(30_000);
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
    setBuildings([...s.buildings]);
    setUnits([...s.units]);
    setWars([...s.wars]);
    setCharacters([...s.characters]);
    setRealms([...s.realms]);
    setPower({ player: realmPower(s, "player"), rival: realmPower(s, "rival") });
    setPeaceLeft(peaceTicksRemaining(s));
    setPrestige(Number(s.flags["prestige_level"] ?? 0));
    setAscendReady(canAscend(s));
    setAscendNeed(ascendThreshold(s));
    mapRef.current?.sync(s);

    const rivalWar = s.wars.find(
      (w) => w.status === "active" && w.attackerRealmId === "rival"
    );
    if (rivalWar && rivalWar.id !== lastRivalWar.current) {
      lastRivalWar.current = rivalWar.id;
      setStatus("Iron March has declared war on you!");
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
            settled > 0
              ? `Welcome back — settled ${settled} ticks (~${Math.floor(settled / 10)}s offline)`
              : ""
          );
          setStatus("Loaded autosave");
        } else {
          state = createGameState({ seed: 42, withStarterBuildings: true });
          state.resources.wood = "40";
          state.resources.food = "50";
          setStatus("Select a building, click empty tile to place, existing tile to upgrade");
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
            if (!eng) return;
            const st = eng.getState();
            const existing = st.buildings.find((b) => b.x === x && b.y === y);
            if (existing) {
              if (existing.completesAtTick !== null) {
                setStatus("Still under construction");
                return;
              }
              if (existing.level >= MAX_BUILDING_LEVEL) {
                setStatus(`${existing.typeId} already max level`);
                return;
              }
              const ok = tryUpgrade(st, existing.id);
              setStatus(
                ok
                  ? `Upgraded ${existing.typeId} to lv${existing.level}`
                  : `Cannot afford upgrade (lv${existing.level} → ${existing.level + 1})`
              );
              if (ok) {
                syncUi(eng);
                saveToIndexedDb(serializeState(st)).catch(() => {});
              }
              return;
            }
            const typeId = selectedBuildRef.current;
            if (!typeId) {
              setStatus("Select a building type first");
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

  const engine = engineRef.current;
  const state = engine?.getState();
  const types = listBuildableTypes();
  const unitTypes = listUnitTypes();
  const activeWar = wars.find((w) => w.status === "active");
  const canDeclare = !activeWar && peaceLeft <= 0;
  const trainMult = state ? trainCostMultiplier(state) : 1;
  const barracksN = state ? countBuilding(state, "barracks") : 0;
  const towersN = state ? countBuilding(state, "watchtower") : 0;
  const marketsN = state ? countBuilding(state, "market") : 0;

  const buildingCounts: Record<string, number> = {};
  for (const b of buildings) {
    buildingCounts[b.typeId] = (buildingCounts[b.typeId] ?? 0) + 1;
  }

  const wins = wars.filter(
    (w) =>
      (w.attackerRealmId === "player" && w.status === "attacker_won") ||
      (w.defenderRealmId === "player" && w.status === "defender_won")
  ).length;
  const losses = wars.filter(
    (w) =>
      (w.attackerRealmId === "player" && w.status === "defender_won") ||
      (w.defenderRealmId === "player" && w.status === "attacker_won")
  ).length;

  const handleTrain = (typeId: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    const ok = tryTrain(st, { typeId, count: trainQty });
    setStatus(ok ? `Trained ${trainQty} ${typeId}` : `Cannot afford ${trainQty}× ${typeId}`);
    if (ok) {
      syncUi(eng);
      saveToIndexedDb(serializeState(st)).catch(() => {});
    }
  };

  const handleDeclareWar = () => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    if (peaceTicksRemaining(st) > 0) {
      setStatus(`Peace — ${peaceTicksRemaining(st)} ticks left`);
      return;
    }
    const ok = tryDeclareWar(st, { attackerRealmId: "player", defenderRealmId: "rival" });
    setStatus(ok ? "War declared!" : "Cannot declare war");
    if (ok) {
      syncUi(eng);
      saveToIndexedDb(serializeState(st)).catch(() => {});
    }
  };

  const handleResolveWar = () => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    const result = tryResolveWar(st, eng.rng);
    if (result.ok && result.result) {
      const { winnerId, loot } = result.result;
      const lootStr = Object.entries(loot)
        .map(([r, v]) => `${formatLetterSuffix(v)} ${r}`)
        .join(", ");
      setStatus(
        winnerId === "player"
          ? lootStr
            ? `Victory! Loot: ${lootStr}`
            : "Victory!"
          : lootStr
            ? `Defeat — lost ${lootStr}`
            : "Defeat"
      );
      syncUi(eng);
      saveToIndexedDb(serializeState(st)).catch(() => {});
    } else setStatus("No active war");
  };

  const handleAscend = () => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    if (!tryAscend(st)) {
      setStatus(`Need ${formatLetterSuffix(ascendNeed)} total resources`);
      return;
    }
    setStatus(`Ascended! Prestige ${st.flags["prestige_level"]}`);
    syncUi(eng);
    saveToIndexedDb(serializeState(st)).catch(() => {});
  };

  const handleTrade = (offerId: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    const st = eng.getState();
    const ok = tryTrade(st, offerId);
    setStatus(ok ? "Trade complete" : marketsN < 1 ? "Build a Market first" : "Cannot afford trade");
    if (ok) {
      syncUi(eng);
      saveToIndexedDb(serializeState(st)).catch(() => {});
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 740, margin: "0 auto" }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>Second Crown</h1>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          Tick {formatLetterSuffix(tick)}
          {prestige > 0 ? ` · Prestige ${prestige}` : ""}
          {wins + losses > 0 ? ` · ${wins}W–${losses}L` : ""}
          {" · "}
          Power {power.player} vs {power.rival}
        </div>
        {offlineNote ? (
          <p style={{ color: "#3fb950", fontSize: 13, margin: "6px 0 0" }}>{offlineNote}</p>
        ) : null}
      </header>

      <div
        style={{
          background: "#161b22",
          borderRadius: 8,
          padding: "12px 14px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {(["food", "wood", "stone", "gold"] as const).map((r) => (
          <div key={r}>
            <div style={{ opacity: 0.55, fontSize: 11 }}>{r}</div>
            <div>{formatLetterSuffix(resources[r] ?? "0")}</div>
            <div style={{ opacity: 0.5, fontSize: 11 }}>
              +{formatLetterSuffix(income[r] ?? "0")}/s
            </div>
          </div>
        ))}
      </div>

      {status ? (
        <div
          style={{
            fontSize: 13,
            opacity: 0.85,
            marginBottom: 12,
            padding: "8px 10px",
            background: "#21262d",
            borderRadius: 6,
          }}
        >
          {status}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {(
          [
            ["kingdom", "Kingdom"],
            ["army", "Army"],
            ["war", "War"],
            ["crown", "Crown"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" style={tabBtn(tab === id)} onClick={() => setTab(id)}>
            {label}
            {id === "war" && activeWar ? " ●" : ""}
          </button>
        ))}
      </div>

      <div style={{ display: tab === "kingdom" ? "block" : "none", marginBottom: 14 }}>
        <p style={{ fontSize: 12, opacity: 0.65, margin: "0 0 6px" }}>
          Selected: <strong>{selectedBuild ?? "none"}</strong> — empty tile places, occupied tile upgrades (max lv{MAX_BUILDING_LEVEL})
        </p>
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            maxWidth: 512,
            borderRadius: 8,
            border: "1px solid #30363d",
            imageRendering: "pixelated",
          }}
        />
      </div>

      {tab === "kingdom" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 0 }}>
            Ambitious −10% build cost
            {barracksN > 0 ? ` · Barracks×${barracksN} train ×${(trainMult * 100).toFixed(0)}%` : ""}
            {towersN > 0 ? ` · Towers +${towersN * 2} power` : ""}
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
                  title={t.blurb ? `${t.blurb}\n${costStr}` : costStr}
                  onClick={() => setSelectedBuild(t.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: selected ? "2px solid #58a6ff" : "1px solid #30363d",
                    background: afford ? "#238636" : "#21262d",
                    color: afford ? "#fff" : "#8b949e",
                    cursor: "pointer",
                    textAlign: "left",
                    minWidth: 110,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: `#${t.color.toString(16).padStart(6, "0")}`,
                      }}
                    />
                    {t.name}
                    {buildingCounts[t.id] ? (
                      <span style={{ opacity: 0.7, fontSize: 11 }}>×{buildingCounts[t.id]}</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{costStr}</div>
                </button>
              );
            })}
          </div>

          <h3 style={{ fontSize: 14, marginTop: 20 }}>Market</h3>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: -8 }}>
            {marketsN < 1 ? "Build a Market to unlock trades." : `Markets ×${marketsN}`}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MARKET_OFFERS.map((o) => {
              const ok = state ? canTrade(state, o.id) : false;
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!ok}
                  onClick={() => handleTrade(o.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #30363d",
                    background: ok ? "#9e6a03" : "#21262d",
                    color: ok ? "#fff" : "#8b949e",
                    cursor: ok ? "pointer" : "not-allowed",
                    fontSize: 13,
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "army" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[1, 5, 10].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setTrainQty(q)}
                style={{
                  padding: "4px 12px",
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
            <span style={{ fontSize: 12, opacity: 0.6, alignSelf: "center" }}>
              {barracksN > 0
                ? `Barracks discount: ${Math.round((1 - trainMult) * 100)}%`
                : "Build barracks (Kingdom) to discount training"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {unitTypes.map((u) => {
              const afford = state ? canAffordTrain(state, u.id, trainQty) : false;
              const costStr = Object.entries(u.cost)
                .map(([r, c]) =>
                  `${formatLetterSuffix(Math.ceil(Number(c) * trainQty * trainMult))} ${r}`
                )
                .join(", ");
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={!afford}
                  title={u.blurb}
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
                  {u.name} ⚔{u.power} ×{trainQty}
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{costStr}</div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
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
        </>
      )}

      {tab === "war" && (
        <>
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            You {power.player} · Iron March {power.rival}
            {activeWar ? " · Battle pending" : ""}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
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
              {peaceLeft > 0 ? `Peace (${Math.ceil(peaceLeft / 10)}s)` : "Declare war"}
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
          <ul style={{ fontSize: 13, marginTop: 12 }}>
            {wars.length === 0 && <li style={{ opacity: 0.6 }}>No wars yet</li>}
            {wars.slice(-8).map((w) => (
              <li key={w.id}>
                {w.attackerRealmId} vs {w.defenderRealmId} — <strong>{w.status}</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "crown" && (
        <>
          <h3 style={{ fontSize: 15, marginTop: 0 }}>People</h3>
          <ul style={{ fontSize: 13 }}>
            {characters.map((c) => {
              const realm = realms.find((r) => r.id === c.realmId);
              return (
                <li key={c.id}>
                  <strong>{c.name}</strong> ({c.role}) — {realm?.name ?? c.realmId}
                  {c.traits.length ? ` · ${c.traits.join(", ")}` : ""}
                </li>
              );
            })}
          </ul>

          <h3 style={{ fontSize: 15 }}>Claim the Second Crown</h3>
          <p style={{ fontSize: 12, opacity: 0.65 }}>
            Soft reset at {formatLetterSuffix(ascendNeed)} total resources. Permanent +1 prod per
            building per prestige level.
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
            Ascend{prestige > 0 ? ` (Prestige ${prestige})` : ""}
          </button>

          <h3 style={{ fontSize: 15, marginTop: 24 }}>Saves</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={async () => {
                const eng = engineRef.current;
                if (!eng) return;
                eng.getState().meta.lastRealTime = Date.now();
                await saveToIndexedDb(serializeState(eng.getState()));
                setStatus("Saved");
              }}
            >
              Save now
            </button>
            <button
              type="button"
              onClick={() => {
                const eng = engineRef.current;
                if (!eng) return;
                eng.getState().meta.lastRealTime = Date.now();
                downloadSave(serializeState(eng.getState()));
                setStatus("Exported");
              }}
            >
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
                  const eng = new TickEngine(st);
                  engineRef.current = eng;
                  lastRivalWar.current = null;
                  setStatus("Imported");
                  setOfflineNote("");
                  syncUi(eng);
                  await saveToIndexedDb(serializeState(st));
                } catch {
                  setStatus("Import cancelled or invalid");
                }
              }}
            >
              Import
            </button>
            <button
              type="button"
              onClick={async () => {
                await clearIndexedDbSave();
                const st = createGameState({
                  seed: Date.now() >>> 0,
                  withStarterBuildings: true,
                });
                st.resources.wood = "40";
                st.resources.food = "50";
                const eng = new TickEngine(st);
                engineRef.current = eng;
                lastRivalWar.current = null;
                setStatus("New game");
                setOfflineNote("");
                setTab("kingdom");
                syncUi(eng);
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

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
