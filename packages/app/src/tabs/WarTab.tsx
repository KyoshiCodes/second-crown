import React from "react";
import {
  peaceTicksRemaining,
  realmPower,
  tryDeclareWar,
  tryGiftGold,
  tryResolveWar,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { DiplomacyPanel } from "../HudControls";
import { BattleVisual, type BattleSnap } from "../BattleVisual";
import type { ActFn } from "../game/useGameEngine";

export function WarTab(props: {
  state: GameState | undefined;
  act: ActFn;
  rivalOp: number;
  playerOp: number;
  battleSnap: BattleSnap | null;
  setBattleSnap: (snap: BattleSnap | null) => void;
}) {
  const { state, act, rivalOp, playerOp, battleSnap, setBattleSnap } = props;
  const activeWar = state?.wars.find((w) => w.status === "active");
  const otherRealms = (state?.realms ?? []).filter((r) => r.id !== "player");

  return (
    <>
      <DiplomacyPanel
        rivalOp={rivalOp}
        playerOp={playerOp}
        onGift={() => act((st) => (tryGiftGold(st) ? "Gift sent." : "Need 15 gold."))}
      />
      <BattleVisual snap={battleSnap} active={!!activeWar} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {otherRealms.map((r) => {
          const left = state ? peaceTicksRemaining(state, "player", r.id) : 0;
          const locked = !!activeWar || left > 0;
          return (
            <button
              key={r.id}
              type="button"
              disabled={locked}
              onClick={() => act((st) => (tryDeclareWar(st, { attackerRealmId: "player", defenderRealmId: r.id }) ? `War declared on ${r.name}.` : "Cannot declare war."))}
            >
              {left > 0 ? `Peace with ${r.name} (${Math.ceil(left / 10)}s)` : `Declare on ${r.name}`}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={!activeWar}
        onClick={() => act((st, eng) => {
          const war = st.wars.find((w) => w.status === "active");
          const atk = war ? realmPower(st, war.attackerRealmId) : 0;
          const def = war ? realmPower(st, war.defenderRealmId) : 0;
          const r = tryResolveWar(st, eng.rng);
          if (r.ok && r.result && war) {
            setBattleSnap({
              attackerId: war.attackerRealmId,
              defenderId: war.defenderRealmId,
              winnerId: r.result.winnerId,
              attackerPower: r.result.attackerPower ?? atk,
              defenderPower: r.result.defenderPower ?? def,
              phases: r.result.phases,
            });
            return r.result.winnerId === "player" ? "Victory." : "Defeat.";
          }
          return "No active war.";
        })}
      >
        Fight
      </button>
      <button type="button" disabled={!activeWar} onClick={() => act((st) => (tryWhitePeace(st) ? "White peace signed." : "No war."))}>
        White Peace
      </button>
    </>
  );
}
