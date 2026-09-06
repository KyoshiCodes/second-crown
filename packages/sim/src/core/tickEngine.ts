import type { GameState } from "@second-crown/shared";
import { createRngStreams, type RngStreams } from "./rng.js";
import { EconomySystem } from "../systems/economy.js";

const SYSTEMS = [EconomySystem];

export class TickEngine {
  readonly rng: RngStreams;

  constructor(private state: GameState) {
    this.rng = createRngStreams(state.meta.seed);
  }

  getState(): GameState {
    return this.state;
  }

  /** Advance exactly one fine tick. */
  tick(): void {
    this.state.meta.tick += 1;
    this.state.meta.playTimeMs += 100; // 10 Hz → 100 ms logical time

    // Process any events scheduled for this exact tick first
    for (const sys of SYSTEMS) {
      sys.processEventsAt(this.state, this.state.meta.tick);
    }

    // Then apply per-tick production
    for (const sys of SYSTEMS) {
      if ("tick" in sys && typeof (sys as any).tick === "function") {
        (sys as any).tick(this.state);
      }
    }
  }

  /** Advance N fine ticks one-by-one (correctness baseline). */
  tickMany(n: number): void {
    for (let i = 0; i < n; i++) {
      this.tick();
    }
  }

  /**
   * Event-horizon settlement.
   * Jumps analytically to the next interesting event (or to the target)
   * instead of simulating every fine tick. Falls back to fine ticks
   * when events are dense or the remaining distance is small.
   *
   * When landing exactly on an event tick, process the event and then
   * apply production for that tick — same order as fine ticks — so
   * offline-equals-online holds (Invariant 2).
   */
  settleTicks(n: number): void {
    if (n <= 0) return;

    const targetTick = this.state.meta.tick + n;

    while (this.state.meta.tick < targetTick) {
      // Find the nearest future event across all systems
      let nextEvent: number | null = null;
      for (const sys of SYSTEMS) {
        const t = sys.nextEventTick(this.state);
        if (t !== null && t > this.state.meta.tick) {
          if (nextEvent === null || t < nextEvent) {
            nextEvent = t;
          }
        }
      }

      // How far can we jump?
      const jumpTo =
        nextEvent === null
          ? targetTick
          : Math.min(nextEvent, targetTick);

      const distance = jumpTo - this.state.meta.tick;

      // Small distances: just run fine ticks (cheaper + simpler)
      if (distance <= 4) {
        this.tickMany(Math.min(distance, targetTick - this.state.meta.tick));
        continue;
      }

      // Analytic jump over the empty interval (from exclusive → jumpTo inclusive of time span)
      const from = this.state.meta.tick;
      for (const sys of SYSTEMS) {
        sys.advanceAnalytic(this.state, from, jumpTo);
      }

      this.state.meta.tick = jumpTo;
      this.state.meta.playTimeMs += distance * 100;

      // If we landed exactly on an event, process it and apply production
      // for this tick (matches fine-tick order: events then production).
      if (nextEvent !== null && this.state.meta.tick === nextEvent) {
        for (const sys of SYSTEMS) {
          sys.processEventsAt(this.state, this.state.meta.tick);
        }
        for (const sys of SYSTEMS) {
          if ("tick" in sys && typeof (sys as any).tick === "function") {
            (sys as any).tick(this.state);
          }
        }
      }
    }
  }
}
