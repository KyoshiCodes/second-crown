import React from "react";
import {
  tryBuyBazaar,
  tryStrikeHorde,
  raidTicksLeft,
  flagNum,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { ItemChip } from "./ItemChip";

export function MarketPanel(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const wait = state ? raidTicksLeft(state) : 0;
  const iron = state ? flagNum(state, "spoils_iron") : 0;
  const banners = state ? flagNum(state, "spoils_banners") : 0;
  const relics = state ? flagNum(state, "spoils_relics") : 0;
  return (
    <div className="sc-realm-card" style={{ margin: "12px 0" }}>
      <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span>⛺</span> Horde and bazaar
      </h3>
      <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 10px" }}>
        A refugee host presses the pale. Strike it with the army you have. Rewards scale with power.
      </p>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.75, marginBottom: 6 }}>
          Spoils Bag
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <ItemChip itemId="iron_shard" count={iron} showTier />
          <ItemChip itemId="war_banner" count={banners} showTier />
          <ItemChip itemId="ash_relic" count={relics} showTier />
        </div>
      </div>

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

      <h4 style={{ marginTop: 16, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span>🪙</span> Wandering bazaar
      </h4>
      <p style={{ fontSize: 12, opacity: 0.8, margin: "0 0 10px" }}>
        Spend gold for craft mats. Player-to-player stalls come next on the cloud board.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => act((st) => (tryBuyBazaar(st, "iron") ? "Bought iron shards." : "Need 14 gold."))}
        >
          <span>14g →</span>
          <ItemChip itemId="iron_shard" count="+2" />
        </button>
        <button
          type="button"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => act((st) => (tryBuyBazaar(st, "banners") ? "Bought banners." : "Need 22 gold."))}>
          <span>22g →</span>
          <ItemChip itemId="war_banner" count="+2" />
        </button>
        <button
          type="button"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => act((st) => (tryBuyBazaar(st, "relics") ? "Bought an ash relic." : "Need 40 gold."))}>
          <span>40g →</span>
          <ItemChip itemId="ash_relic" count="+1" />
        </button>
      </div>
    </div>
  );
}

