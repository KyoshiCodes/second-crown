import React from "react";
import {
  formatLetterSuffix,
  tryAscend,
  listAchievements,
  flagNum,
  shieldTicksLeft,
  tryBuyShield,
  tryCraft,
  CRAFTS,
  playerGuild,
  tryRenameGuild,
  trySetGuildCrest,
  GUILD_CRESTS,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
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
  const iron = state ? flagNum(state, "spoils_iron") : 0;
  const banners = state ? flagNum(state, "spoils_banners") : 0;
  const relics = state ? flagNum(state, "spoils_relics") : 0;
  const shield = state ? shieldTicksLeft(state) : 0;
  const guild = state ? playerGuild(state) : null;
  const [guildName, setGuildName] = React.useState(guild?.name ?? "Your Banner");

  return (
    <>
      <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} state={state} />
      <p>Ascend at {formatLetterSuffix(ascendNeed)} total resources.</p>
      <button type="button" disabled={!ascendReady} onClick={() => act((st) => (tryAscend(st) ? "Ascended." : "Not ready."))}>Ascend</button>

      <h3>Spoils</h3>
      <p style={{ fontSize: 13 }}>Iron {iron} · Banners {banners} · Relics {relics}</p>
      <p style={{ fontSize: 12, opacity: 0.7 }}>Win battles to earn spoils. Spend them on crafts.</p>
      {CRAFTS.map((c) => {
        const owned = state ? flagNum(state, c.flag) > 0 : false;
        return (
          <button key={c.id} type="button" disabled={owned || !state} onClick={() => act((st) => (tryCraft(st, c.id) ? `Crafted ${c.name}.` : "Need more spoils."))}>
            {owned ? `${c.name} owned` : `Craft ${c.name} (${c.blurb})`}
          </button>
        );
      })}

      <h3>Offline shield</h3>
      <p style={{ fontSize: 13 }}>{shield > 0 ? `Shield up for ${Math.ceil(shield / 10)}s. NPC crowns will not declare.` : "No shield. 250 gold buys ~200s of peace from NPC attacks."}</p>
      <button type="button" disabled={!state || shield > 0} onClick={() => act((st) => (tryBuyShield(st) ? "Shield raised." : "Need 250 gold."))}>Buy shield (250 gold)</button>

      <h3>Guild kit</h3>
      {guild ? (
        <>
          <p>Guild: {guild.name}</p>
          <input value={guildName} onChange={(e) => setGuildName(e.target.value)} maxLength={32} />
          <button type="button" onClick={() => act((st) => (tryRenameGuild(st, guildName) ? `Guild renamed ${guildName}.` : "Rename failed."))}>Rename</button>
          <div>
            {GUILD_CRESTS.map((c) => (
              <button key={c} type="button" onClick={() => act((st) => (trySetGuildCrest(st, c) ? `Crest set to ${c}.` : "Need a guild."))}>{c}</button>
            ))}
          </div>
        </>
      ) : (
        <p style={{ fontSize: 13 }}>Found a guild on the World tab, then customize it here.</p>
      )}

      <h3>Achievements</h3>
      <ul style={{ fontSize: 13 }}>
        {(state ? listAchievements(state) : []).map((a) => (
          <li key={a.def.id}>{a.done ? "[x]" : "[ ]"} {a.def.name} — {a.def.hint}</li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => state && saveNow()}>Save</button>
        <button type="button" onClick={() => state && exportSave()}>Export</button>
        <button type="button" onClick={() => importSaveFile()}>Import</button>
        <button type="button" onClick={() => newGame()}>New Game</button>
      </div>
    </>
  );
}
