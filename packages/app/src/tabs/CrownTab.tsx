import React from "react";
import { formatLetterSuffix, tryAscend, type GameState, type WorldEvent } from "@second-crown/sim";
import { EventPanel } from "../EventPanel";
import type { ActFn } from "../game/useGameEngine";

export function CrownTab(props: {
  state: GameState | undefined;
  act: ActFn;
  lastEvent: string;
  lastEventTick: number;
  eventLog: WorldEvent[];
  ascendReady: boolean;
  ascendNeed: number;
  saveNow: () => void;
  exportSave: () => void;
  importSaveFile: () => Promise<void>;
  newGame: () => void;
}) {
  const { state, act, lastEvent, lastEventTick, eventLog, ascendReady, ascendNeed, saveNow, exportSave, importSaveFile, newGame } = props;

  return (
    <>
      <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} />
      <p>Ascend at {formatLetterSuffix(ascendNeed)} total resources.</p>
      <button type="button" disabled={!ascendReady} onClick={() => act((st) => (tryAscend(st) ? "Ascended." : "Not ready."))}>
        Ascend
      </button>
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => state && saveNow()}>Save</button>
        <button type="button" onClick={() => state && exportSave()}>Export</button>
        <button type="button" onClick={() => importSaveFile()}>Import</button>
        <button type="button" onClick={() => newGame()}>New Game</button>
      </div>
    </>
  );
}
