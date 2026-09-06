import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";
import "./theme.css";

const THEMES = ["kingdom", "army", "war", "world", "crown"] as const;

function applyTheme(name: string) {
  document.body.classList.remove(...THEMES.map((t) => `theme-${t}`));
  document.body.classList.add("sc-shell", `theme-${name}`);
}

applyTheme("kingdom");

document.addEventListener("click", (e) => {
  const el = e.target as HTMLElement | null;
  const label = el?.textContent?.trim();
  const key = THEMES.find((t) => label === t[0].toUpperCase() + t.slice(1) || label?.startsWith(t[0].toUpperCase() + t.slice(1)));
  if (key) applyTheme(key);
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
