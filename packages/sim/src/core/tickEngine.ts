import type { GameState } from "@second-crown/shared";
import { createRngStreams, type RngStreams } from "./rng.js";
import { EconomySystem } from "../systems/economy.js";
import { RivalSystem } from "../systems/rival.js";
import { EventSystem } from "../systems/events.js";
import { MarchSystem } from "../systems/march.js";
import { UpkeepSystem } from "../systems/upkeep.js";

import { GatherSystem } from "../systems/gather.js";

const SYSTEMS = [EconomySystem, RivalSystem, EventSystem, MarchSystem, UpkeepSystem, GatherSystem];

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
      if ("tick" in sys && typeof (sys as { tick?: unknown }).tick === "function") {
        (sys as { tick: (s: GameState) => void }).tick(this.state);
      }
    }
  }

  tickMany(n: number): void {
    for (let i = 0; i < n; i++) this.tick();
  }

  settleTicks(n: number): void {
    if (n <= 0) return;
    const targetTick = this.state.meta.tick + n;

    while (this.state.meta.tick < targetTick) {
      let nextEvent: number | null = null;
      for (const sys of SYSTEMS) {
        const t = sys.nextEventTick(this.state);
        if (t !== null && t > this.state.meta.tick) {
          if (nextEvent === null || t < nextEvent) nextEvent = t;
        }
      }

      const nextRival = Math.floor(this.state.meta.tick / 100) * 100 + 100;
      if (nextRival > this.state.meta.tick && nextRival <= targetTick) {
        nextEvent = nextEvent === null ? nextRival : Math.min(nextEvent, nextRival);
      }

      if (nextEvent === null || nextEvent > targetTick) {
        const from = this.state.meta.tick;
        const distance = targetTick - from;
        if (distance > 0) {
          for (const sys of SYSTEMS) sys.advanceAnalytic(this.state, from, targetTick);
          this.state.meta.tick = targetTick;
          this.state.meta.playTimeMs += distance * 100;
        }
        break;
      }

      const preEvent = nextEvent - 1;
      if (preEvent > this.state.meta.tick) {
        const from = this.state.meta.tick;
        const distance = preEvent - from;
        if (distance <= 4) {
          this.tickMany(distance);
        } else {
          for (const sys of SYSTEMS) sys.advanceAnalytic(this.state, from, preEvent);
          this.state.meta.tick = preEvent;
          this.state.meta.playTimeMs += distance * 100;
        }
      }

      if (this.state.meta.tick < targetTick) this.tick();
    }
  }
}
