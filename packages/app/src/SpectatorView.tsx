import React from "react";
import { deserializeState, formatLetterSuffix, realmPower, playerTitle, getWorldLog, type GameState } from "@second-crown/sim";
import { WorldPanel } from "./WorldPanel";
import { BattleVisual } from "./BattleVisual";
import { cloudUrl } from "./net/cloud";

export function watchCodeFromHash(): string {
  const hash = window.location.hash.replace(/^#/, "");
  const p = new URLSearchParams(hash);
  return p.get("watch") || "";
}

export function SpectatorView(props: { code: string }) {
  const [state, setState] = React.useState<GameState | null>(null);
  const [err, setErr] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`${cloudUrl()}/watch/${props.code}`);
      if (!res.ok) throw new Error("no room");
      const raw = await res.text();
      setState(deserializeState(raw));
      setErr("");
    } catch {
      setErr("Waiting for the host to share a live save…");
    }
  }, [props.code]);

  React.useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [load]);

  if (!state) {
    return <div style={{ padding: 24 }}>Watching {props.code}. {err || "Loading…"}</div>;
  }
  const war = state.wars.find((w) => w.status === "active");
  return (
    <div style={{ padding: 20, maxWidth: 760, margin: "0 auto" }}>
      <p style={{ color: "#e3b341" }}>Spectator · {props.code} · refreshes every 4s</p>
      <h1>Second Crown</h1>
      <div>
        {playerTitle(state)} · Tick {formatLetterSuffix(state.meta.tick)} · Power{" "}
        {realmPower(state, "player")} vs {realmPower(state, "rival")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, margin: "12px 0" }}>
        {(["food", "wood", "stone", "gold"] as const).map((r) => (
          <div key={r}>
            <div style={{ opacity: 0.55, fontSize: 11 }}>{r}</div>
            <div>{formatLetterSuffix(state.resources[r] ?? "0")}</div>
          </div>
        ))}
      </div>
      {war ? <BattleVisual snap={null} active /> : null}
      <ul>
        {getWorldLog(state)
          .slice(-8)
          .reverse()
          .map((e, i) => (
            <li key={i}>
              Tick {e.tick}: {e.text}
            </li>
          ))}
      </ul>
      <WorldPanel state={state} onFoundGuild={() => {}} onJoin={() => {}} onLeave={() => {}} />
    </div>
  );
}
