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
   * Event-horizon settlement (Invariant 2).
   *
   * Strategy:
   * - Find next event tick.
   * - Analytically advance production up to (eventTick - 1).
   * - Step exactly one fine tick onto the event (processEvents + production).
   * - Repeat until target is reached.
   *
   * This matches the fine-tick order bit-for-bit and avoids off-by-one
   * double-counting on the completion tick.
   */
  settleTicks(n: number): void {
    if (n <= 0) return;

    const targetTick = this.state.meta.tick + n;

    while (this.state.meta.tick < targetTick) {
      let nextEvent: number | null = null;
      for (const sys of SYSTEMS) {
        const t = sys.nextEventTick(this.state);
        if (t !== null && t > this.state.meta.tick) {
          if (nextEvent === null || t < nextEvent) {
            nextEvent = t;
          }
        }
      }

      // No upcoming event before target: one analytic jump and done
      if (nextEvent === null || nextEvent > targetTick) {
        const from = this.state.meta.tick;
        const distance = targetTick - from;
        if (distance > 0) {
          for (const sys of SYSTEMS) {
            sys.advanceAnalytic(this.state, from, targetTick);
          }
          this.state.meta.tick = targetTick;
          this.state.meta.playTimeMs += distance * 100;
        }
        break;
      }

      // Advance analytically to the tick *before* the event
      const preEvent = nextEvent - 1;
      if (preEvent > this.state.meta.tick) {
        const from = this.state.meta.tick;
        const distance = preEvent - from;
        // Small gap: just fine-tick (keeps logic simple)
        if (distance <= 4) {
          this.tickMany(distance);
        } else {
          for (const sys of SYSTEMS) {
            sys.advanceAnalytic(this.state, from, preEvent);
          }
          this.state.meta.tick = preEvent;
          this.state.meta.playTimeMs += distance * 100;
        }
      }

      // Step one fine tick onto the event (processEvents + production)
      if (this.state.meta.tick < targetTick) {
        this.tick();
      }
    }
  }
}
