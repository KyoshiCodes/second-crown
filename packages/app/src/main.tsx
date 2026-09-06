import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";
import "./theme.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
