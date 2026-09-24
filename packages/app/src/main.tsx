import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";
import { ChromeDock } from "./ChromeDock";
import { SpectatorView, watchCodeFromHash } from "./SpectatorView";
import "./theme.css";
import "./seasons/themeStage.css";
import { sfx } from "./sfx";
import { loadMusicMuted, startMusicBed } from "./music";
import { audioManager } from "./themes/audioManager";
import { applyChrome, loadChrome } from "./ThemeDock";

const THEMES = ["kingdom", "army", "war", "world", "crown"] as const;

function applyTheme(name: string) {
  document.body.classList.remove(...THEMES.map((t) => `theme-${t}`));
  document.body.classList.add("sc-shell", `theme-${name}`);
}

applyTheme("kingdom");
applyChrome(loadChrome());
loadMusicMuted();

document.addEventListener("click", (e) => {
  audioManager.start();
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
      <ChromeDock />
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
