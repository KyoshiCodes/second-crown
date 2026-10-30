import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGameState,
  recordCrown,
  serializeState,
  TickEngine,
} from "@second-crown/sim";
import {
  clearSaveAudit,
  formatSaveAuditLine,
  getSaveAuditSnapshot,
  listLedgerWithSaveAudit,
  listSaveAudit,
  parseSaveTick,
  recordSaveLoaded,
  recordSaveWritten,
  SAVE_AUDIT_CAP,
  subscribeSaveAudit,
} from "./save";
import { startSave, type StartDeps } from "./game/pullCloud";
import { loadSaved } from "./game/loadSaved";
import { LedgerPanel } from "./LedgerPanel";

describe("save audit log and LedgerPanel integration", () => {
  beforeEach(() => {
    clearSaveAudit();
  });

  it("records 'Save written' and 'Save loaded' with tick and leaves serialized save format byte-for-byte unchanged", () => {
    const state = createGameState({ seed: 11, withStarterBuildings: true });
    const engine = new TickEngine(state);
    for (let i = 0; i < 45; i++) engine.tick();

    const beforeRaw = serializeState(state);

    const written = recordSaveWritten(beforeRaw);
    expect(written).toEqual({
      tick: 45,
      kind: "save_written",
      text: "Save written · tick 45",
    });

    const loaded = recordSaveLoaded(state);
    expect(loaded).toEqual({
      tick: 45,
      kind: "save_loaded",
      text: "Save loaded · tick 45",
    });

    // Save format and GameState are completely untouched
    expect(serializeState(state)).toBe(beforeRaw);
    expect(listSaveAudit()).toEqual([
      { tick: 45, kind: "save_loaded", text: "Save loaded · tick 45" },
      { tick: 45, kind: "save_written", text: "Save written · tick 45" },
    ]);
  });

  it("records load events through startSave and shared loadSaved without duplicating or altering saves", async () => {
    const state = createGameState({ seed: 21, withStarterBuildings: true });
    state.meta.tick = 120;
    const raw = serializeState(state);

    const deps: StartDeps = {
      readPulled: async () => null,
      clearPulled: async () => {},
      readLocal: async () => raw,
      writeLocal: async () => {},
    };

    const read = await startSave(deps);
    expect(read).toBe(raw);
    expect(listSaveAudit()).toEqual([
      { tick: 120, kind: "save_loaded", text: "Save loaded · tick 120" },
    ]);

    // Solo loadSaved does not add a duplicate load entry
    const solo = await loadSaved(state);
    expect(solo.source).toBe("local");
    expect(listSaveAudit()).toHaveLength(1);

    // Pulled cloud promotion records Save written + Save loaded
    clearSaveAudit();
    const pulledState = createGameState({ seed: 22, withStarterBuildings: true });
    pulledState.meta.tick = 310;
    const pulledRaw = serializeState(pulledState);
    const pulledDeps: StartDeps = {
      readPulled: async () => pulledRaw,
      clearPulled: async () => {},
      readLocal: async () => raw,
      writeLocal: async () => {},
    };
    expect(await startSave(pulledDeps)).toBe(pulledRaw);
    expect(listSaveAudit()).toEqual([
      { tick: 310, kind: "save_loaded", text: "Save loaded · tick 310" },
      { tick: 310, kind: "save_written", text: "Save written · tick 310" },
    ]);
  });

  it("caps the in-memory audit list at SAVE_AUDIT_CAP and notifies subscribers with stable snapshots", () => {
    const onChange = vi.fn();
    const unsub = subscribeSaveAudit(onChange);
    const snap0 = getSaveAuditSnapshot();
    expect(getSaveAuditSnapshot()).toBe(snap0);

    for (let i = 1; i <= SAVE_AUDIT_CAP + 6; i++) {
      recordSaveWritten(i * 10);
    }

    expect(onChange).toHaveBeenCalledTimes(SAVE_AUDIT_CAP + 6);
    const entries = listSaveAudit();
    expect(entries).toHaveLength(SAVE_AUDIT_CAP);
    expect(entries[0]).toEqual({
      tick: (SAVE_AUDIT_CAP + 6) * 10,
      kind: "save_written",
      text: formatSaveAuditLine("save_written", (SAVE_AUDIT_CAP + 6) * 10),
    });

    const snap1 = getSaveAuditSnapshot();
    expect(snap1).not.toBe(snap0);
    expect(getSaveAuditSnapshot()).toBe(snap1);

    unsub();
    recordSaveLoaded(999);
    expect(onChange).toHaveBeenCalledTimes(SAVE_AUDIT_CAP + 6);
  });

  it("ignores malformed save strings safely", () => {
    expect(parseSaveTick("not-json")).toBeNull();
    expect(parseSaveTick("{}")).toBeNull();
    expect(recordSaveWritten("not-json")).toBeNull();
    expect(recordSaveLoaded(null)).toBeNull();
    expect(listSaveAudit()).toEqual([]);
  });

  it("surfaces 'Save written' and 'Save loaded' lines alongside existing entries in LedgerPanel", () => {
    const state = createGameState({ seed: 5, withStarterBuildings: true });
    state.meta.tick = 80;
    recordCrown(state, "crown", "Oath sworn in the hall");
    recordSaveLoaded(20);
    recordSaveWritten(100);

    const merged = listLedgerWithSaveAudit(state);
    expect(merged.map((m) => `${m.tick}:${m.text}`)).toEqual([
      "100:Save written · tick 100",
      "80:Oath sworn in the hall",
      "20:Save loaded · tick 20",
    ]);

    const html = renderToStaticMarkup(<LedgerPanel state={state} />);
    expect(html).toContain("Ledger of Crowns");
    expect(html).toContain("Save written · tick 100");
    expect(html).toContain("Oath sworn in the hall");
    expect(html).toContain("Save loaded · tick 20");
    expect(html).toContain('data-kind="save_written"');
    expect(html).toContain('data-kind="save_loaded"');
  });
});
