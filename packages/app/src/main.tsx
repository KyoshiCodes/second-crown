import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
