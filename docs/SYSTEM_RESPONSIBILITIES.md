# ✨ Second Crown Major Systems Overview

This document lists the core systems of the game and outlines their primary responsibilities, ensuring all developers are aligned on functional boundaries.

## 🌐 World & State Management
*   **System:** **State Persistence (`packages/sim/state`)**
    *   **Responsibility:** Managing the canonical state of the entire world (player assets, kingdom status, resources). Responsible for saving and restoring data structures consistently across sessions.
    *   **Constraint:** Must handle offline catch-up logic to reconcile long periods of absence accurately.

## ⚔️ Simulation & Game Rules
*   **System:** **Core Engine (`packages/sim`)**
    *   **Responsibility:** The mathematical heart of the game. Handles all turn-based progression, resource generation ticks, combat resolution (deterministic battles), and complex state transitions based on player actions.
    *   **Constraint:** Must be 100% deterministic and independent of the UI layer.

## 🗺️ Visualization & Map Rendering
*   **System:** **Map Renderer (`packages/render`)**
    *   **Responsibility:** Taking abstract coordinates from the `sim` engine and drawing them efficiently using PixiJS. Renders all visual assets like buildings, resource tiles, unit sprites (militia, etc.), and topographical features.

## 📱 User Interface (UI)
*   **System:** **Application Shell (`packages/app`)**
    *   **Responsibility:** Providing the user experience wrapper. It observes state changes from `sim` and orchestrates which components are visible and how data is presented to the player in an intuitive manner.

## 🛠️ Shared Utilities & Tooling
*   **System:** **Common Services (`packages/shared`)**
    *   **Responsibility:** Maintaining consistency across all packages by providing universal helpers (e.g., number formatting, date utilities) and shared type definitions.

---
***Goal:*** *All major systems must communicate via data payloads (state objects), never directly calling methods on other package's internal components.*