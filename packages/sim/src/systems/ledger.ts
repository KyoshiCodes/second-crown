import type { GameState } from "@second-crown/shared";
import type { WorldEvent } from "./events.js";
import { getWorldLog, pushWorldLog } from "./events.js";

export interface LedgerEntry {
  tick: number;
  kind: string;
  text: string;
}

export function recordCrown(state: GameState, kind: string, text: string): void {
  pushWorldLog(state, kind, text);
}

export function listLedger(state: GameState): LedgerEntry[] {
  const out: LedgerEntry[] = [];
  for (const ev of getWorldLog(state)) {
    out.push({ tick: ev.tick, kind: ev.id, text: ev.text });
  }
  for (const w of state.wars) {
    const atk = state.realms.find((r) => r.id === w.attackerRealmId)?.name ?? w.attackerRealmId;
    const def = state.realms.find((r) => r.id === w.defenderRealmId)?.name ?? w.defenderRealmId;
    out.push({
      tick: w.endedTick ?? w.startedTick,
      kind: w.status,
      text: `${atk} vs ${def} — ${w.status.replace(/_/g, " ")}`,
    });
  }
  for (const rec of state.inputLog) {
    if (rec.type === "appoint_marshal") {
      const payload = rec.payload as { tree?: string } | undefined;
      out.push({
        tick: rec.tick,
        kind: "marshal",
        text: `Marshal appointed to the ${payload?.tree ?? "unknown"} tree`,
      });
    }
    if (rec.type === "promote_marshal") {
      const payload = rec.payload as { rank?: number; tree?: string } | undefined;
      out.push({
        tick: rec.tick,
        kind: "marshal",
        text: `Marshal raised to rank ${payload?.rank ?? 2} (${payload?.tree ?? "tree"})`,
      });
    }
  }
  out.sort((a, b) => b.tick - a.tick);
  return out.slice(0, 24);
}

export type { WorldEvent };
