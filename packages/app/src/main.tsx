import React from "react";
import { createRoot } from "react-dom/client";
import { createGameState, TickEngine, D } from "@second-crown/sim";

function App() {
  const [tick, setTick] = React.useState(0);
  const [resources, setResources] = React.useState<Record<string, string>>({});
  const engineRef = React.useRef<TickEngine | null>(null);

  React.useEffect(() => {
    const state = createGameState({ seed: 42, withStarterBuildings: true });
    const engine = new TickEngine(state);
    engineRef.current = engine;

    const id = window.setInterval(() => {
      engine.tick();
      const s = engine.getState();
      setTick(s.meta.tick);
      setResources({ ...s.resources });
    }, 100);

    return () => window.clearInterval(id);
  }, []);

  const format = (s: string | undefined) => {
    if (!s) return "0";
    const d = D(s);
    if (d.lt(1000)) return d.toFixed(1);
    return d.toString();
  };

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ marginTop: 0 }}>Second Crown</h1>
      <p style={{ opacity: 0.8 }}>Phase D — resources & production</p>

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
      </div>

      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 20 }}>
        Starter: 1 completed Farm + 1 Lumber Camp (finishes at tick 50).
        <br />
        Run <code>npm test</code> to verify offline-equals-online.
      </p>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
