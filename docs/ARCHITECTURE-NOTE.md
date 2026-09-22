# 👑 Second Crown Architecture Overview

## Purpose and Goal
The core purpose of Second Crown is to deliver a robust, deterministic, and offline-capable idle kingdom simulation. The architecture is designed around decoupling complex game logic from the presentation layer, ensuring that the simulation remains mathematically sound regardless of UI state or platform limitations.

## 🏗️ Monorepo Structure
The project utilizes a **TypeScript Monorepo** managed by `npm workspaces`. This structure isolates concerns into dedicated packages:

```
packages/
├── app/     (UI Shell) - The React frontend container.
├── render/  (Graphics Engine) - PixiJS map rendering and visuals.
├── sim/     (Core Logic) - Pure TS game rules, state, and mechanics.
├── shared/  (Utilities) - Reusable types, constants, and helper functions.
└── ui/      (Components) - Common, reusable React UI widgets (implied).
```

## 🧩 Component Responsibilities

| Package | Layer | Role | Key Technologies |
| :--- | :--- | :--- | :--- |
| **`packages/sim`** | **Simulation (Core)** | The engine. Runs deterministic logic for state changes, combat resolution, and resource generation. *Must be UI-agnostic.* | Pure TypeScript / TS |
| **`packages/app`** | **Presentation (UI)** | React container that coordinates the display of game data. Handles user input and passes events to `sim`. | React, Vite, TS |
| **`packages/render`** | **Visualization** | Renders the world state onto a map view. Responsible for displaying units, buildings, and geographical features efficiently. | PixiJS, TypeScript |
| **`packages/shared`** | **Common Services** | Provides consistent utility functions (e.g., number formatting) and shared data types used by all other packages to maintain type safety. | TypeScript |

## 🔄 Data Flow and Execution Flow
The system adheres to a clear separation of concerns, preventing the UI from influencing core game logic:

1.  **Input:** The user interacts with a component in `packages/app`.
2.  **Action:** The component calls an action function within `packages/sim` (e.g., `attemptBuild(location)`).
3.  **Simulation:** `packages/sim` calculates the new state, strictly following deterministic rules, and returns the *new calculated state object*.
4.  **Rendering:** The `packages/app` receives this updated state object and passes it to the `packages/render` module, which then updates all visual elements (map tiles, units) accordingly.

## ⚠️ Architectural Constraints (Non-Negotiables)
1.  **Determinism:** All game logic in `packages/sim` must be perfectly deterministic.
2.  **Independence:** The simulation (`packages/sim`) cannot rely on any framework specific to the UI layer (e.g., React hooks, DOM APIs).
3.  **Hosting:** Simulation processing is intended to occur client-side (offline capability) and must remain separate from the server process.