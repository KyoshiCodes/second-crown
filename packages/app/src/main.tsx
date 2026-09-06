import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";
import "./theme.css";
import { sfx } from "./sfx";

const THEMES = ["kingdom", "army", "war", "world", "crown"] as const;

function applyTheme(name: string) {
  document.body.classList.remove(...THEMES.map((t) => `theme-${t}`));
  document.body.classList.add("sc-shell", `theme-${name}`);
}

applyTheme("kingdom");

document.addEventListener("click", (e) => {
  const el = e.target as HTMLElement | null;
  const label = el?.textContent?.trim() ?? "";
  const key = THEMES.find((t) => label === t[0].toUpperCase() + t.slice(1) || label.startsWith(t[0].toUpperCase() + t.slice(1) + " "));
  if (key) applyTheme(key);
  if (label === "Fight") sfx.war();
  else if (label.startsWith("Gift")) sfx.gift();
  else if (label.startsWith("Trained") || label.includes("Militia") || label.includes("Knight")) sfx.train();
  else if (label === "Save" || label === "Export") sfx.click();
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
