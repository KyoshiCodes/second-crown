import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";
import { TesterBar } from "./TesterBar";
import { CloudPanel } from "./CloudPanel";
import { BoardPanel } from "./BoardPanel";
import { SpectatorView, watchCodeFromHash } from "./SpectatorView";
import "./theme.css";
import "./seasons/themeStage.css";
import { sfx } from "./sfx";
import { loadMusicMuted, startMusicBed } from "./music";

const THEMES = ["kingdom", "army", "war", "world", "crown"] as const;

function applyTheme(name: string) {
  document.body.classList.remove(...THEMES.map((t) => `theme-${t}`));
  document.body.classList.add("sc-shell", `theme-${name}`);
}

applyTheme("kingdom");
loadMusicMuted();

document.addEventListener("click", (e) => {
  startMusicBed();
  const el = e.target as HTMLElement | null;
  const label = el?.textContent?.trim() ?? "";
  const key = THEMES.find(
    (t) => label === t[0].toUpperCase() + t.slice(1) || label.startsWith(t[0].toUpperCase() + t.slice(1) + " ")
  );
  if (key) applyTheme(key);
  if (label === "Fight") sfx.war();
  else if (label.startsWith("Gift")) sfx.gift();
});

function Root() {
  const watch = watchCodeFromHash();
  if (watch) return <SpectatorView code={watch} />;
  return (
    <>
      <div
        className="sc-chrome"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 120,
          background: "rgba(10, 8, 6, 0.96)",
          borderBottom: "1px solid #3a3228",
        }}
      >
        <TesterBar />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 12px 8px" }}>
          <CloudPanel />
          <BoardPanel />
        </div>
      </div>
      <AppShell />
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
