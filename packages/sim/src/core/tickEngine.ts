import type { GameState } from "@second-crown/shared";
import { createRngStreams, type RngStreams } from "./rng.js";
import { EconomySystem } from "../systems/economy.js";
import { RivalSystem } from "../systems/rival.js";
import { EventSystem } from "../systems/events.js";
import { MarchSystem } from "../systems/march.js";
import { UpkeepSystem } from "../systems/upkeep.js";

import { GatherSystem } from "../systems/gather.js";
import { TrainingSystem } from "../systems/training.js";
import { NodeStockSystem } from "../systems/nodeStock.js";
import { WardSystem } from "../systems/ward.js";
import { UpgradeSystem } from "../actions/upgrade.js";
import { ColumnVisionSystem } from "../systems/columnVision.js";
import { economyGain } from "../systems/economy.js";
import { storageCap } from "../systems/storage.js";
import { upkeepPerTick } from "../systems/upkeep.js";
import { D } from "./decimal.js";

/** Stores with a cap. A batch over these can clip where tick-by-tick would not. */
const STORES = ["food", "wood", "stone", "gold"] as const;
/** Fine ticks a store must hold still before a batch may pin it. Rates are flat within a stretch, so one is enough. */
const STEADY_TICKS = 1;

const SYSTEMS = [EconomySystem, RivalSystem, EventSystem, MarchSystem, UpkeepSystem, GatherSystem, TrainingSystem, NodeStockSystem, WardSystem, UpgradeSystem, ColumnVisionSystem];

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

  /**
   * Advance n ticks and end as n ordinary ticks would. Quiet stretches are batched.
   * A stretch that would fill a store or starve the host is fine-ticked instead,
   * except that a store which has held still tick after tick is pinned through the batch.
   */
  settleTicks(n: number): void {
    if (n <= 0) return;
    const targetTick = this.state.meta.tick + n;
    const watch = this.watchStores();

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
        this.settleStretch(targetTick, watch);
        break;
      }

      const preEvent = nextEvent - 1;
      if (preEvent > this.state.meta.tick) this.settleStretch(preEvent, watch);

      if (this.state.meta.tick < targetTick) this.fineTick(watch);
    }
  }

  /**
   * Reach `to` with no event in between. Batch as far as tick-by-tick would agree,
   * then fine-tick across the tick where a store fills or the food runs out.
   */
  private settleStretch(to: number, watch: StoreWatch): void {
    while (this.state.meta.tick < to) {
      const distance = to - this.state.meta.tick;
      if (distance <= 4) {
        for (let i = 0; i < distance; i++) this.fineTick(watch);
        return;
      }
      const pinned = STORES.filter((res) => watch.still[res] >= STEADY_TICKS || watch.full[res]);
      const foodPinned = pinned.includes("food") && watch.unitsStill >= STEADY_TICKS;
      const safe = this.safeTicks(distance, pinned, foodPinned);
      if (safe <= 4) {
        this.fineTick(watch);
        continue;
      }
      this.batch(this.state.meta.tick + safe, pinned, foodPinned);
      for (const res of STORES) {
        if (pinned.includes(res)) continue;
        watch.last[res] = this.state.resources[res] ?? "0";
        watch.still[res] = 0;
        watch.full[res] = false;
      }
      const units = unitCounts(this.state);
      if (units !== watch.units) watch.unitsStill = 0;
      watch.units = units;
    }
  }

  /**
   * How many of the next `distance` ticks one batch can cover and still end as tick-by-tick.
   * A batch is not linear in two places: an unpinned store clipping at its cap, and food
   * running short of upkeep. The batch stops short of both.
   */
  private safeTicks(distance: number, pinned: readonly string[], foodPinned: boolean): number {
    const perTick = economyGain(this.state, 1);
    let safe = distance;
    for (const res of STORES) {
      if (pinned.includes(res)) continue;
      const g = perTick[res]?.toNumber() ?? 0;
      if (g <= 0) continue;
      const cap = storageCap(this.state, res);
      if (!Number.isFinite(cap)) continue;
      const room = cap - D(this.state.resources[res] ?? "0").toNumber();
      safe = Math.min(safe, Math.floor(room / g));
    }
    if (!foodPinned) {
      const short = upkeepPerTick(this.state) - (perTick.food?.toNumber() ?? 0);
      if (short > 0) safe = Math.min(safe, Math.floor(D(this.state.resources.food ?? "0").toNumber() / short));
    }
    return Math.max(0, safe);
  }

  /** One batch to `to`. Pinned stores keep their steady value; with food pinned, so does every unit count. */
  private batch(to: number, pinned: readonly string[], foodPinned: boolean): void {
    const from = this.state.meta.tick;
    const held = pinned.map((res) => [res, this.state.resources[res] ?? "0"] as const);
    const units = this.state.units;
    const counts = units.map((u) => u.count);
    for (const sys of SYSTEMS) sys.advanceAnalytic(this.state, from, to);
    this.state.meta.tick = to;
    this.state.meta.playTimeMs += (to - from) * 100;
    for (const [res, value] of held) this.state.resources[res] = value;
    if (foodPinned) {
      const added = this.state.units.filter((u) => !units.includes(u));
      units.forEach((u, i) => (u.count = counts[i]));
      this.state.units = [...units, ...added];
    }
  }

  private fineTick(watch: StoreWatch): void {
    this.tick();
    for (const res of STORES) {
      const value = this.state.resources[res] ?? "0";
      watch.still[res] = value === watch.last[res] ? watch.still[res] + 1 : 0;
      watch.last[res] = value;
      watch.full[res] = D(value).gte(storageCap(this.state, res));
    }
    const units = unitCounts(this.state);
    watch.unitsStill = units === watch.units ? watch.unitsStill + 1 : 0;
    watch.units = units;
  }

  private watchStores(): StoreWatch {
    const last = {} as Record<Store, string>;
    const still = {} as Record<Store, number>;
    const full = {} as Record<Store, boolean>;
    for (const res of STORES) {
      last[res] = this.state.resources[res] ?? "0";
      still[res] = 0;
      full[res] = false;
    }
    return { last, still, full, units: unitCounts(this.state), unitsStill: 0 };
  }
}

type Store = (typeof STORES)[number];

/**
 * How long each store, and the roster, has held still across fine ticks. A store that
 * ended the last fine tick at its cap ends every tick there until something spends it.
 */
type StoreWatch = {
  last: Record<Store, string>;
  still: Record<Store, number>;
  full: Record<Store, boolean>;
  units: string;
  unitsStill: number;
};

function unitCounts(state: GameState): string {
  return state.units.map((u) => `${u.id}:${u.count}`).join("|");
}
