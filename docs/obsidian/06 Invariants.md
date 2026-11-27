# Invariants

Full law: `docs/INVARIANTS.md`.

- Deterministic 10 Hz sim
- Sim has no React, no DOM, no server tick for solo play
- A shared hold may call `packages/sim` on the server (ADR-011); never copy rules into `server/`
- Presentation cannot change `packages/sim` or `server/`
- Column fights the column
- Living Realm snapshots are read-only: no game math changes, no lazy flag writes
- Each living layer hides cleanly when its `living_*` flag is off or its snapshot is null
- Fog never leaks: inspect detail shows only on seen tiles
