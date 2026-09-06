import React from "react";
import {
  tryFoundGuild,
  tryGiftGold,
  tryJoinFaction,
  tryLeaveFaction,
  tryKingdomTrade,
  activeClash,
  tryJoinClash,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { WorldPanel } from "../WorldPanel";
import type { ActFn } from "../game/useGameEngine";
import { getGiftThanks } from "../content/flavor";

export function WorldTab(props: {
  state: GameState | undefined;
  act: ActFn;
  worldLog: WorldEvent[];
}) {
  const { state, act, worldLog } = props;
  const worldEntries = [...worldLog].reverse();
  const clash = state ? activeClash(state) : null;
  const nameOf = (id: string) => state?.realms.find((r) => r.id === id)?.name ?? id;

  return (
    <>
      <h3>World Status</h3>
      <p style={{ fontSize: 13, opacity: 0.7 }}>Chronicle of other crowns, wars, and musters.</p>
      {clash ? (
        <div className="sc-realm-card" style={{ marginBottom: 12 }}>
          <strong>Foreign war</strong>
          <p style={{ fontSize: 13 }}>{nameOf(clash.a)} vs {nameOf(clash.b)} — {Math.ceil((clash.until - (state?.meta.tick ?? 0)) / 10)}s left</p>
          <button type="button" disabled={Boolean(state?.flags.world_side)} onClick={() => act((st) => (tryJoinClash(st, clash.a) ? `Levy sent to ${nameOf(clash.a)}.` : "Need 20 gold or already pledged."))}>
            Send levy to {nameOf(clash.a)} (20 gold)
          </button>
          <button type="button" disabled={Boolean(state?.flags.world_side)} onClick={() => act((st) => (tryJoinClash(st, clash.b) ? `Levy sent to ${nameOf(clash.b)}.` : "Need 20 gold or already pledged."))}>
            Send levy to {nameOf(clash.b)} (20 gold)
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, opacity: 0.7 }}>No foreign war right now. Crowns clash about every 30 seconds of open play.</p>
      )}
      <ul style={{ fontSize: 13 }}>
        {worldEntries.length === 0 && <li>The world is quiet — for now.</li>}
        {worldEntries.map((e, i) => (
          <li key={`${e.tick}-${e.id}-${i}`}>Tick {e.tick}: {e.text}</li>
        ))}
      </ul>
      <WorldPanel
        state={state}
        onFoundGuild={() => act((st) => (tryFoundGuild(st) ? "Guild founded." : "You already lead a guild."))}
        onJoin={(id) => act((st) => (tryJoinFaction(st, id) ? "Joined the faction." : "Cannot join."))}
        onLeave={(id) => act((st) => (tryLeaveFaction(st, id) ? "Left the faction." : "Not a member."))}
        onGift={(id) => act((st) => (tryGiftGold(st, 15, id) ? getGiftThanks(id) : "Need 15 gold."))}
        onTrade={(realmId, offerId) => act((st) => (tryKingdomTrade(st, realmId, offerId) ? "Trade complete." : "Cannot make that trade."))}
      />
    </>
  );
}
