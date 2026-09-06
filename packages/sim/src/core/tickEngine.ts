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

  tick(): void {
    this.state.meta.tick += 1;
    this.state.meta.playTimeMs += 100;

    for (const sys of SYSTEMS) {
      sys.processEventsAt(this.state, this.state.meta.tick);
    }

    for (const sys of SYSTEMS) {
      if ("tick" in sys && typeof (sys as any).tick === "function") {
        (sys as any).tick(this.state);
      }
    }
  }

  tickMany(n: number): void {
    for (let i = 0; i < n; i++) {
      this.tick();
    }
  }

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

      const jumpTo =
        nextEvent === null
          ? targetTick
          : Math.min(nextEvent, targetTick);

      const distance = jumpTo - this.state.meta.tick;

      if (distance <= 4) {
        this.tickMany(Math.min(distance, targetTick - this.state.meta.tick));
        continue;
      }

      const from = this.state.meta.tick;
      for (const sys of SYSTEMS) {
        sys.advanceAnalytic(this.state, from, jumpTo);
      }

      this.state.meta.tick = jumpTo;
      this.state.meta.playTimeMs += distance * 100;

      if (nextEvent !== null && this.state.meta.tick === nextEvent) {
        for (const sys of SYSTEMS) {
          sys.processEventsAt(this.state, this.state.meta.tick);
        }
      }
    }
  }
}
