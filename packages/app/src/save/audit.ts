import { listLedger, type GameState, type LedgerEntry } from "@second-crown/sim";

export type SaveAuditKind = "save_written" | "save_loaded";

export interface SaveAuditEntry {
  tick: number;
  kind: SaveAuditKind;
  text: string;
}

interface StoredSaveAuditEntry extends SaveAuditEntry {
  seq: number;
}

/** Matches listLedger's 24-entry cap so the in-memory audit array stays bounded. */
export const SAVE_AUDIT_CAP = 24;
export const LEDGER_CAP = 24;

let nextSeq = 1;
const auditEntries: StoredSaveAuditEntry[] = [];
const listeners = new Set<() => void>();
let cachedSnapshot: readonly SaveAuditEntry[] = Object.freeze([]);

function rebuildSnapshot(): void {
  const sorted = [...auditEntries]
    .sort((a, b) => (b.tick !== a.tick ? b.tick - a.tick : b.seq - a.seq))
    .map(({ tick, kind, text }) => ({ tick, kind, text }));
  cachedSnapshot = Object.freeze(sorted);
}

function notifyListeners(): void {
  for (const fn of listeners) {
    fn();
  }
}

/** Extracts a non-negative integer tick from serialized save JSON, a GameState-like object, or a number. */
export function parseSaveTick(
  source: number | string | { meta?: { tick?: unknown } } | null | undefined
): number | null {
  if (typeof source === "number") {
    return Number.isFinite(source) && source >= 0 ? Math.floor(source) : null;
  }
  if (typeof source === "string") {
    try {
      const parsed = JSON.parse(source) as { meta?: { tick?: unknown } } | null;
      const t = parsed?.meta?.tick;
      return typeof t === "number" && Number.isFinite(t) && t >= 0 ? Math.floor(t) : null;
    } catch {
      return null;
    }
  }
  if (source && typeof source === "object") {
    const t = source.meta?.tick;
    return typeof t === "number" && Number.isFinite(t) && t >= 0 ? Math.floor(t) : null;
  }
  return null;
}

export function formatSaveAuditLine(kind: SaveAuditKind, tick: number): string {
  const safeTick = Number.isFinite(tick) && tick >= 0 ? Math.floor(tick) : 0;
  return kind === "save_written"
    ? `Save written · tick ${safeTick}`
    : `Save loaded · tick ${safeTick}`;
}

function pushSaveAudit(
  kind: SaveAuditKind,
  source: number | string | { meta?: { tick?: unknown } } | null | undefined
): SaveAuditEntry | null {
  const tick = parseSaveTick(source);
  if (tick === null) return null;
  const entry: StoredSaveAuditEntry = {
    tick,
    kind,
    text: formatSaveAuditLine(kind, tick),
    seq: nextSeq++,
  };
  auditEntries.push(entry);
  if (auditEntries.length > SAVE_AUDIT_CAP) {
    auditEntries.splice(0, auditEntries.length - SAVE_AUDIT_CAP);
  }
  rebuildSnapshot();
  notifyListeners();
  return { tick: entry.tick, kind: entry.kind, text: entry.text };
}

/** Records a "Save written · tick <N>" line without touching GameState or the save format. */
export function recordSaveWritten(
  source: number | string | { meta?: { tick?: unknown } } | null | undefined
): SaveAuditEntry | null {
  return pushSaveAudit("save_written", source);
}

/** Records a "Save loaded · tick <N>" line without touching GameState or the save format. */
export function recordSaveLoaded(
  source: number | string | { meta?: { tick?: unknown } } | null | undefined
): SaveAuditEntry | null {
  return pushSaveAudit("save_loaded", source);
}

/** Returns recorded save/load audit entries, newest first. */
export function listSaveAudit(): SaveAuditEntry[] {
  return [...cachedSnapshot];
}

/** Stable snapshot reference for React.useSyncExternalStore. */
export function getSaveAuditSnapshot(): readonly SaveAuditEntry[] {
  return cachedSnapshot;
}

/** Subscribe to save/load audit log updates. */
export function subscribeSaveAudit(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Clears the in-memory save/load audit log. */
export function clearSaveAudit(): void {
  if (auditEntries.length === 0) return;
  auditEntries.length = 0;
  rebuildSnapshot();
  notifyListeners();
}

/**
 * Merges the sim's Ledger of Crowns entries with client-side save/load audit entries,
 * sorted newest tick first and capped at LEDGER_CAP. Never mutates GameState.
 */
export function listLedgerWithSaveAudit(
  state: GameState | undefined,
  audit: readonly SaveAuditEntry[] = cachedSnapshot
): LedgerEntry[] {
  const simRows = state ? listLedger(state) : [];
  if (audit.length === 0) return simRows;
  const combined: { entry: LedgerEntry; order: number }[] = [];
  let order = 0;
  // Audit snapshot is already newest-first; give newer audit entries slightly lower tie-break index so they stay ahead on equal ticks.
  for (const a of audit) {
    combined.push({ entry: { tick: a.tick, kind: a.kind, text: a.text }, order: order++ });
  }
  for (const r of simRows) {
    combined.push({ entry: r, order: order++ });
  }
  combined.sort((a, b) =>
    b.entry.tick !== a.entry.tick ? b.entry.tick - a.entry.tick : a.order - b.order
  );
  return combined.slice(0, LEDGER_CAP).map((item) => item.entry);
}
