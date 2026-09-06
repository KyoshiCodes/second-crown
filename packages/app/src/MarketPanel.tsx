import React from "react";
import {
  tryBuyBazaar,
  tryStrikeHorde,
  raidTicksLeft,
  flagNum,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function MarketPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const wait = state ? raidTicksLeft(state) : 0;
  const iron = state ? flagNum(state, "spoils_iron") : 0;
  const banners = state ? flagNum(state, "spoils_banners") : 0;
  const relics = state ? flagNum(state, "spoils_relics") : 0;
  return (
    <div className="sc-realm-card" style={{ margin: "12px 0" }}>
      <h3 style={{ marginTop: 0 }}>Horde and bazaar</h3>
      <p style={{ fontSize: 13 }}>
        A refugee host presses the pale. Strike it with the army you have. Rewards scale with power.
      </p>
      <p style={{ fontSize: 12 }}>Spoils bag: iron {iron} · banners {banners} · relics {relics}</p>
      <button
        type="button"
        disabled={!state || wait > 0}
        onClick={() =>
          act((st) => {
            const ok = tryStrikeHorde(st);
            if (!ok) return "Need 20 food and 10 gold, or the host has not reformed.";
            return `Horde broken. Loot iron ${st.flags.raid_last_iron}, banners ${st.flags.raid_last_banners}, relics ${st.flags.raid_last_relics}.`;
          })
        }
      >
        {wait > 0 ? `Horde reforms in ${Math.ceil(wait / 10)}s` : "Strike the horde (20 food, 10 gold)"}
      </button>
      <h4>Wandering bazaar</h4>
      <p style={{ fontSize: 12 }}>Spend gold for craft mats. Player-to-player stalls come next on the cloud board.</p>
      <button type="button" onClick={() => act((st) => (tryBuyBazaar(st, "iron") ? "Bought iron shards." : "Need 14 gold."))}>
        14 gold → 2 iron
      </button>
      <button type="button" onClick={() => act((st) => (tryBuyBazaar(st, "banners") ? "Bought banners." : "Need 22 gold."))}>
        22 gold → 2 banners
      </button>
      <button type="button" onClick={() => act((st) => (tryBuyBazaar(st, "relics") ? "Bought an ash relic." : "Need 40 gold."))}>
        40 gold → 1 relic
      </button>
    </div>
  );
}
