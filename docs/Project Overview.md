# 👑 Project Overview

## 🎯 Purpose
Second Crown is an **idle, kingdom-builder, grand-war hybrid game**. Its primary goal is to provide a highly deterministic and engaging simulation experience that remains fully functional and consistent even when running offline. The focus is on deep, strategic gameplay rather than superficial graphical flourish.

## 💻 Tech Stack
*   **Structure:** TypeScript Monorepo (`npm workspaces`).
*   **UI Layer:** React + Vite (Modern front-end development).
*   **Graphics Engine:** PixiJS (High-performance map rendering for the game world).
*   **Simulation Logic:** Pure TypeScript (Ensuring zero dependency on UI frameworks and maximum determinism in core rules).
*   **Testing:** Vitest.

## 📂 Major Folders & Modules
The architecture is organized into specialized packages:
*   `packages/sim`: The **Engine**. Houses all deterministic game rules, state management, combat, and resource ticks. (Pure TS)
*   `packages/app`: The **Client UI Shell**. Manages the overall user flow and presents data received from the simulation engine.
*   `packages/render`: The **Visualization Layer**. Handles drawing the world onto the screen using PixiJS based on the current game state.
*   `packages/shared`: **Utilities**. Stores types, constants, and helper functions used universally across all packages to maintain codebase consistency.

## 🚀 Entry Points
*   **Development:** `npm run dev` (Starts the development server targeting `@second-crown/app`).
*   **Testing Core Logic:** `npm test` (Runs unit tests focused on the core simulation logic in `packages/sim`).

## ❓ Known Unknowns / Areas of Focus
*   **Data Flow Integrity:** Ensuring that data passed from `packages/sim` to both `packages/app` and `packages/render` is always immutable and fully validated.
*   **Offline Resilience:** Continuously testing the state synchronization mechanism, especially across long offline periods, to guarantee perfect determinism upon reconnection.
*   **Performance Scaling:** As map size or unit counts increase, monitoring performance bottlenecks in the PixiJS rendering pipeline (`packages/render`) will be critical.