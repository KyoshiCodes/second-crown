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
  DOCTRINES,
  tryPickDoctrine,
  tryAppointMarshal,
  playerMarshal,
  MARSHAL_TREES,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { EventPanel } from "../EventPanel";
import { DecreesPanel } from "../DecreesPanel";
import { CulturePicker } from "../CulturePicker";
import { LedgerPanel } from "../LedgerPanel";
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
  const prestige = state ? Number(state.flags.prestige_level ?? 0) : 0;
  const doctrine = state ? String(state.flags.doctrine ?? "") : "";
  const locked = state ? Number(state.flags.doctrine_lock ?? 0) === prestige && Boolean(doctrine) : false;
  const marshal = state ? playerMarshal(state) : undefined;
  const court = state?.characters.filter((c) => c.realmId === "player") ?? [];

  return (
    <>
      <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} state={state} />
      <CulturePicker state={state} act={act} />
      <h3>Marshal</h3>
      <p style={{ fontSize: 13 }}>
        {marshal
          ? `${marshal.name} walks the ${marshal.marshalTree} tree (rank ${marshal.marshalRank ?? 1}).`
          : "Appoint a courtier. Line, shock, and ranged each have a rank-1 skill."}
      </p>
      {court.map((c) => (
        <div key={c.id} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
          <span>{c.name}</span>
          {MARSHAL_TREES.map((tree) => (
            <button
              key={tree}
              type="button"
              disabled={marshal?.id === c.id && marshal.marshalTree === tree}
              onClick={() => act((st) => (tryAppointMarshal(st, c.id, tree) ? `${c.name} takes the ${tree} tree.` : "Cannot appoint."))}
            >
              {tree}
            </button>
          ))}
        </div>
      ))}
      <LedgerPanel state={state} />
      <p>Ascend at {formatLetterSuffix(ascendNeed)} total resources.</p>
      <button type="button" disabled={!ascendReady} onClick={() => act((st) => (tryAscend(st) ? "Ascended. Pick a doctrine." : "Not ready."))}>Ascend</button>

      <h3>Doctrine</h3>
      {prestige < 1 ? (
        <p style={{ fontSize: 13 }}>Ascend once to swear a law for this age.</p>
      ) : (
        <>
          <p style={{ fontSize: 13 }}>{doctrine ? `Current: ${doctrine}` : "Swear one law. You may change it again after the next ascent."}</p>
          {DOCTRINES.map((d) => (
            <button
              key={d.id}
              type="button"
              disabled={locked && doctrine === d.id}
              onClick={() => act((st) => (tryPickDoctrine(st, d.id) ? `Swore ${d.name}.` : "Already sworn this age, or not yet ascended."))}
            >
              {d.name} - {d.blurb}
            </button>
          ))}
        </>
      )}

      <DecreesPanel state={state} act={act} />

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
          <li key={a.def.id}>{a.done ? "[x]" : "[ ]"} {a.def.name} - {a.def.hint}</li>
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
