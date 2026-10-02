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
  tryPromoteMarshal,
  canPromoteMarshal,
  playerMarshal,
  MARSHAL_TREES,
  MARSHAL_PROMOTE_GOLD,
  MARSHAL_PROMOTE_KEEP,
  keepLevel,
  keepNotice,
  clearKeepNotice,
  tryClaimSeason,
  seasonClaimed,
  seasonBoonPreview,
  tryClaimDaily,
  dailyClaimed,
  dailyMsLeft,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { EventPanel } from "../EventPanel";
import { DecreesPanel } from "../DecreesPanel";
import { CulturePicker } from "../CulturePicker";
import { LedgerPanel } from "../LedgerPanel";
import { DawnCard } from "../hud/DawnCard";
import type { ActFn } from "../game/useGameEngine";
import "../hud/plain-buttons.css";
import "../hud/crown-card.css";

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
  const boon = state ? seasonBoonPreview(state) : null;
  const claimed = state ? seasonClaimed(state) : true;
  const dailyDone = state ? dailyClaimed(state) : true;
  const dailyWait = state ? dailyMsLeft(state) : 0;
  const rank = marshal?.marshalRank ?? 0;
  const keep = state ? keepLevel(state) : 0;
  const canPromo = state ? canPromoteMarshal(state) : false;
  const notice = state ? keepNotice(state) : "";

  return (
    <>
      <EventPanel lastEvent={lastEvent} lastEventTick={lastEventTick} log={eventLog} state={state} />
      {notice ? (
        <div className="sc-work-card sc-plain-card sc-plain-inline is-notice">
          <span className="sc-work-status">{notice}</span>
          <button type="button" className="sc-work-btn" onClick={() => act((st) => { clearKeepNotice(st); return "Noted."; })}>Dismiss</button>
        </div>
      ) : null}
      <CulturePicker state={state} act={act} />
      <h3>Marshal</h3>
      <p style={{ fontSize: 13 }}>
        {marshal
          ? `${marshal.name} walks the ${marshal.marshalTree} tree (rank ${rank}). Rank 2 needs Keep ${MARSHAL_PROMOTE_KEEP} and ${MARSHAL_PROMOTE_GOLD} gold.`
          : "Appoint a courtier. Line, shock, and ranged each have a rank-1 skill."}
      </p>
      <div className="sc-plain-grid">
        {court.map((c) => (
          <div key={c.id} className={`sc-work-card sc-plain-card ${marshal?.id === c.id ? "is-done" : ""}`}>
            <div className="sc-work-head">
              <span className="sc-work-name">{c.name}</span>
              {marshal?.id === c.id ? <span className="sc-work-level">{marshal.marshalTree}</span> : null}
            </div>
            <div className="sc-plain-actions">
              {MARSHAL_TREES.map((tree) => (
                <button
                  key={tree}
                  type="button"
                  className="sc-work-btn"
                  disabled={marshal?.id === c.id && marshal.marshalTree === tree}
                  onClick={() => act((st) => (tryAppointMarshal(st, c.id, tree) ? `${c.name} takes the ${tree} tree.` : "Cannot appoint."))}
                >
                  {tree}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className={`sc-work-card sc-plain-card ${rank >= 2 ? "is-done" : canPromo ? "is-ready" : ""}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Promote</span>
            <span className="sc-work-level">rank {rank}</span>
          </div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!canPromo}
              onClick={() => act((st) => (tryPromoteMarshal(st) ? "Marshal raised to rank 2." : `Need Keep ${MARSHAL_PROMOTE_KEEP} and ${MARSHAL_PROMOTE_GOLD} gold.`))}
            >
              {rank >= 2 ? "Rank 2" : keep < MARSHAL_PROMOTE_KEEP ? `Promote (needs Keep ${MARSHAL_PROMOTE_KEEP})` : `Promote marshal (${MARSHAL_PROMOTE_GOLD} gold)`}
            </button>
          </div>
        </div>
      </div>
      <div className="sc-plain-grid">
        <div className={`sc-work-card sc-plain-card ${dailyDone ? "is-done" : "is-ready"}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Daily court</span>
          </div>
          <div className="sc-work-status">+12 gold and +20 food once per UTC day.</div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!state || dailyDone}
              onClick={() => act((st) => (tryClaimDaily(st) ? "Daily court collected." : "Already claimed today."))}
            >
              {dailyDone ? `Returns in ${Math.ceil(dailyWait / 3_600_000)}h` : "Claim daily court"}
            </button>
          </div>
        </div>
        <div className={`sc-work-card sc-plain-card ${claimed ? "is-done" : "is-ready"}`}>
          <div className="sc-work-head">
            <span className="sc-work-name">Season court</span>
          </div>
          <div className="sc-work-status">
            {boon ? `${boon.season}: +${boon.amount} ${boon.res} once this season.` : ""}
          </div>
          <div className="sc-plain-actions">
            <button
              type="button"
              className="sc-work-btn"
              disabled={!state || claimed}
              onClick={() => act((st) => (tryClaimSeason(st) ? "Season court collected." : "Already claimed this season."))}
            >
              {claimed ? "Claimed" : "Claim season court"}
            </button>
          </div>
        </div>
      </div>
      <LedgerPanel state={state} />
      <DawnCard state={state} />
      <div className={`sc-work-card sc-plain-card sc-plain-inline ${ascendReady ? "is-ready" : ""}`}>
        <span className="sc-work-status">Ascend at {formatLetterSuffix(ascendNeed)} total resources.</span>
        <button type="button" className="sc-work-btn" disabled={!ascendReady} onClick={() => act((st) => (tryAscend(st) ? "Ascended. Pick a doctrine." : "Not ready."))}>Ascend</button>
      </div>

      <h3>Doctrine</h3>
      {prestige < 1 ? (
        <p style={{ fontSize: 13 }}>Ascend once to swear a law for this age.</p>
      ) : (
        <>
          <p style={{ fontSize: 13 }}>{doctrine ? `Current: ${doctrine}` : "Swear one law. You may change it again after the next ascent."}</p>
          <div className="sc-plain-grid">
            {DOCTRINES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`sc-work-card sc-plain-pick ${doctrine === d.id ? "is-picked" : ""}`}
                disabled={locked && doctrine === d.id}
                onClick={() => act((st) => (tryPickDoctrine(st, d.id) ? `Swore ${d.name}.` : "Already sworn this age, or not yet ascended."))}
              >
                <span className="sc-work-head">
                  <span className="sc-work-name">{d.name}</span>
                </span>
                <span className="sc-work-status">{d.blurb}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <DecreesPanel state={state} act={act} />

      <h3>Spoils</h3>
      <p style={{ fontSize: 13 }}>Iron {iron} · Banners {banners} · Relics {relics}</p>
      <p style={{ fontSize: 12, opacity: 0.7 }}>Win battles to earn spoils. Spend them on crafts.</p>
      <div className="sc-crown-grid">
        {CRAFTS.map((c) => {
          const owned = state ? flagNum(state, c.flag) > 0 : false;
          const cost = Object.entries(c.cost).map(([k, v]) => `${v} ${k}`).join(" · ");
          return (
            <div key={c.id} className={`sc-work-card sc-crown-card ${owned ? "is-owned" : "is-empty"}`}>
              <div className="sc-work-head">
                <span className="sc-work-name">{c.name}</span>
                {owned ? <span className="sc-work-level">owned</span> : null}
              </div>
              <div className="sc-work-status">{c.blurb}</div>
              <div className="sc-work-foot">
                <span className="sc-work-where">{cost}</span>
                <button
                  type="button"
                  className="sc-work-btn"
                  disabled={owned || !state}
                  onClick={() => act((st) => (tryCraft(st, c.id) ? `Crafted ${c.name}.` : "Need more spoils."))}
                >
                  {owned ? `${c.name} owned` : `Craft ${c.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h3>Offline shield</h3>
      <div className={`sc-work-card sc-plain-card ${shield > 0 ? "is-done" : ""}`}>
        <div className="sc-work-status">{shield > 0 ? `Shield up for ${Math.ceil(shield / 10)}s. NPC crowns will not declare.` : "No shield. 250 gold buys ~200s of peace from NPC attacks."}</div>
        <div className="sc-plain-actions">
          <button type="button" className="sc-work-btn" disabled={!state || shield > 0} onClick={() => act((st) => (tryBuyShield(st) ? "Shield raised." : "Need 250 gold."))}>Buy shield (250 gold)</button>
        </div>
      </div>

      <h3>Guild kit</h3>
      {guild ? (
        <div className="sc-work-card sc-plain-card">
          <div className="sc-work-head">
            <span className="sc-work-name">Guild: {guild.name}</span>
          </div>
          <div className="sc-plain-actions">
            <input value={guildName} onChange={(e) => setGuildName(e.target.value)} maxLength={32} />
            <button type="button" className="sc-work-btn" onClick={() => act((st) => (tryRenameGuild(st, guildName) ? `Guild renamed ${guildName}.` : "Rename failed."))}>Rename</button>
          </div>
          <div className="sc-plain-actions">
            {GUILD_CRESTS.map((c) => (
              <button key={c} type="button" className="sc-work-btn" onClick={() => act((st) => (trySetGuildCrest(st, c) ? `Crest set to ${c}.` : "Need a guild."))}>{c}</button>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13 }}>Found a guild on the World tab, then customize it here.</p>
      )}

      <h3>Achievements</h3>
      <div className="sc-crown-grid">
        {(state ? listAchievements(state) : []).map((a) => (
          <div key={a.def.id} className={`sc-work-card sc-crown-card ${a.done ? "is-done" : "is-empty"}`}>
            <div className="sc-work-head">
              <span className="sc-work-name">{a.def.name}</span>
              <span className="sc-work-level">{a.done ? "[x]" : "[ ]"}</span>
            </div>
            <div className="sc-work-status">{a.def.hint}</div>
          </div>
        ))}
      </div>

      <div className="sc-work-card sc-crown-save">
        <span className="sc-work-name">Save file</span>
        <button type="button" className="sc-work-btn" onClick={() => state && saveNow()}>Save</button>
        <button type="button" className="sc-work-btn" onClick={() => state && exportSave()}>Export</button>
        <button type="button" className="sc-work-btn" onClick={() => importSaveFile()}>Import</button>
        <button type="button" className="sc-work-btn" onClick={() => newGame()}>New Game</button>
      </div>
    </>
  );
}
