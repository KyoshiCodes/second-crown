import React from "react";
import {
  tryFoundGuild,
  tryGiftGold,
  tryJoinFaction,
  tryLeaveFaction,
  tryKingdomTrade,
  activeClash,
  tryJoinClash,
  tryScout,
  incomingOnHome,
  watchtowerWarning,
  type GameState,
  type WorldEvent,
} from "@second-crown/sim";
import { realmTokenPalette } from "@second-crown/render";
import { WorldPanel } from "../WorldPanel";
import { MarketPanel } from "../MarketPanel";
import { AuctionPanel } from "../AuctionPanel";
import type { ActFn } from "../game/useGameEngine";
import { getGiftThanks } from "../content/flavor";

type LogFilter = "all" | "claim" | "trade" | "war" | "levy";

function getEventBadge(id: string): { icon: string; label: string; bg: string; border: string; color: string } {
  switch (id) {
    case "claim":
      return { icon: "🚩", label: "Claim", bg: "#2a1c08", border: "#b45309", color: "#fbbf24" };
    case "trade":
      return { icon: "⚖️", label: "Trade", bg: "#06281e", border: "#059669", color: "#34d399" };
    case "declare":
      return { icon: "⚔️", label: "War", bg: "#380d0d", border: "#dc2626", color: "#f87171" };
    case "battle":
      return { icon: "💥", label: "Battle", bg: "#301308", border: "#ea580c", color: "#fb923c" };
    case "raid":
      return { icon: "🐎", label: "Raid", bg: "#280f38", border: "#9333ea", color: "#c084fc" };
    case "levy":
      return { icon: "🛡️", label: "Muster", bg: "#101e38", border: "#3b82f6", color: "#93c5fd" };
    case "loot":
      return { icon: "💰", label: "Spoils", bg: "#2b2207", border: "#eab308", color: "#fde047" };
    case "faction_sour":
    case "faction_cold":
      return { icon: "❄️", label: "Faction", bg: "#0c2838", border: "#0284c7", color: "#38bdf8" };
    default:
      return { icon: "📜", label: "Dispatch", bg: "#1e1812", border: "#78531e", color: "#fef08a" };
  }
}

export function WorldTab(props: {
  state: GameState | undefined;
  act: ActFn;
  worldLog: WorldEvent[];
}) {
  const { state, act, worldLog } = props;
  const [filter, setFilter] = React.useState<LogFilter>("all");
  const worldEntries = [...worldLog].reverse();
  const clash = state ? activeClash(state) : null;
  const nameOf = (id: string) => state?.realms.find((r) => r.id === id)?.name ?? id;
  const holds = state?.board.provinces.filter((p) => p.node === "hold") ?? [];
  const incoming = state ? incomingOnHome(state) : [];
  const seen = state ? watchtowerWarning(state) : undefined;

  const filteredEntries = worldEntries.filter((e) => {
    if (filter === "all") return true;
    if (filter === "claim") return e.id === "claim";
    if (filter === "trade") return e.id === "trade";
    if (filter === "war") return e.id === "declare" || e.id === "battle" || e.id === "raid";
    if (filter === "levy") return e.id === "levy" || e.id === "loot";
    return true;
  });

  const claimCount = worldEntries.filter((e) => e.id === "claim").length;
  const tradeCount = worldEntries.filter((e) => e.id === "trade").length;
  const warCount = worldEntries.filter((e) => e.id === "declare" || e.id === "battle" || e.id === "raid").length;
  const levyCount = worldEntries.filter((e) => e.id === "levy" || e.id === "loot").length;

  return (
    <>
      {incoming.length > 0 ? (
        <div className="sc-realm-card" style={{ marginBottom: 12, border: "1px solid #dc2626" }}>
          <strong style={{ color: "#f87171" }}>{seen ? "Watchtower Warning" : "Dust on the road"}</strong>
          <p style={{ fontSize: 13, margin: "4px 0 0" }}>
            {seen
              ? `${nameOf(seen.realmId)} is ${Math.max(0, Math.ceil((seen.arrivesTick - (state?.meta.tick ?? 0)) / 10))}s from the gates.`
              : "A host is moving. Build a Watchtower to name them."}
          </p>
        </div>
      ) : null}

      <div
        className="sc-realm-card"
        style={{
          marginBottom: 16,
          background: "#14100c",
          border: "1px solid #78531e",
          borderRadius: 8,
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: "#fef08a", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📜</span> Crown Chronicle & World Dispatches
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.75 }}>
              Live record of claims, trade caravans, and wars between realms across the board.
            </p>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: filter === "all" ? "#3b2a1a" : "#1a1410",
                color: filter === "all" ? "#fef08a" : "#d4a72c",
                border: filter === "all" ? "1px solid #d4a72c" : "1px solid #5a4520",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              All ({worldEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("claim")}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: filter === "claim" ? "#2a1c08" : "#1a1410",
                color: filter === "claim" ? "#fbbf24" : "#b45309",
                border: filter === "claim" ? "1px solid #fbbf24" : "1px solid #5a4520",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Claims 🚩 ({claimCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("trade")}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: filter === "trade" ? "#06281e" : "#1a1410",
                color: filter === "trade" ? "#34d399" : "#059669",
                border: filter === "trade" ? "1px solid #34d399" : "1px solid #5a4520",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Trades ⚖️ ({tradeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("war")}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: filter === "war" ? "#380d0d" : "#1a1410",
                color: filter === "war" ? "#f87171" : "#dc2626",
                border: filter === "war" ? "1px solid #f87171" : "1px solid #5a4520",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Wars ⚔️ ({warCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("levy")}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: filter === "levy" ? "#101e38" : "#1a1410",
                color: filter === "levy" ? "#93c5fd" : "#3b82f6",
                border: filter === "levy" ? "1px solid #93c5fd" : "1px solid #5a4520",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Musters 🛡️ ({levyCount})
            </button>
          </div>
        </div>

        <div
          style={{
            maxHeight: 260,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingRight: 4,
          }}
        >
          {filteredEntries.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.6, fontStyle: "italic", padding: "12px 0", textAlign: "center" }}>
              {worldEntries.length === 0 ? "The world is quiet — for now." : "No dispatches match this category."}
            </div>
          ) : (
            filteredEntries.map((e, i) => {
              const badge = getEventBadge(e.id);
              const isLatest = i === 0 && filter === "all";
              return (
                <div
                  key={`${e.tick}-${e.id}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    background: isLatest ? "rgba(42, 26, 16, 0.7)" : "rgba(22, 18, 14, 0.5)",
                    border: isLatest ? "1px solid #b45309" : "1px solid rgba(120, 83, 30, 0.3)",
                    borderRadius: 5,
                    fontSize: 12.5,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 3,
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      color: badge.color,
                      flexShrink: 0,
                    }}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.5, flexShrink: 0, fontFamily: "monospace" }}>
                    T{e.tick}
                  </span>
                  <span style={{ color: isLatest ? "#fef08a" : "#e8dcc8", flex: 1 }}>
                    {e.text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {clash ? (
        <div className="sc-realm-card" style={{ marginBottom: 12, border: "1px solid #b45309" }}>
          <strong style={{ color: "#fbbf24" }}>⚔️ Foreign War: {nameOf(clash.a)} vs {nameOf(clash.b)}</strong>
          <p style={{ fontSize: 13, margin: "4px 0 8px" }}>
            War rages on the board — {Math.ceil((clash.until - (state?.meta.tick ?? 0)) / 10)}s until decisive clash.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={Boolean(state?.flags.world_side)}
              onClick={() => act((st) => (tryJoinClash(st, clash.a) ? `Levy sent to ${nameOf(clash.a)}.` : "Need 20 gold or already pledged."))}
            >
              Send levy to {nameOf(clash.a)} (20 gold)
            </button>
            <button
              type="button"
              disabled={Boolean(state?.flags.world_side)}
              onClick={() => act((st) => (tryJoinClash(st, clash.b) ? `Levy sent to ${nameOf(clash.b)}.` : "Need 20 gold or already pledged."))}>
              Send levy to {nameOf(clash.b)} (20 gold)
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12, fontSize: 12.5, opacity: 0.7 }}>
          No foreign war right now. Crowns clash about every 30 seconds of open play.
        </div>
      )}

      <div className="sc-realm-card" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#fcd34d" }}>Holds on the Board</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {holds.map((p) => {
            const occupantId = p.occupantRealmId;
            const pal = occupantId ? realmTokenPalette(occupantId) : null;
            const isPlayer = occupantId === "player" || p.id === state?.board.homeProvinceId;
            const borderCol = isPlayer ? "#ca8a04" : pal ? pal.accentColor : "#3a3228";
            const bgCol = isPlayer ? "rgba(35, 28, 15, 0.8)" : pal ? "rgba(22, 18, 14, 0.8)" : "rgba(18, 14, 10, 0.5)";
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  background: bgCol,
                  border: `1px solid ${borderCol}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: pal?.accentColor ?? (isPlayer ? "#ca8a04" : "#666"),
                    border: "1px solid #111",
                    flexShrink: 0,
                  }}
                />
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontWeight: 600, color: isPlayer ? "#fef08a" : "#e8dcc8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isPlayer ? "Your Hold" : occupantId ? nameOf(occupantId) : "Empty Keep"}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    ({p.x}, {p.y}) · {p.terrain}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MarketPanel state={state} act={act} />
      <AuctionPanel state={state} />

      <WorldPanel
        state={state}
        onFoundGuild={() => act((st) => (tryFoundGuild(st) ? "Guild founded." : "You already lead a guild."))}
        onJoin={(id) => act((st) => (tryJoinFaction(st, id) ? "Joined the faction." : "Cannot join."))}
        onLeave={(id) => act((st) => (tryLeaveFaction(st, id) ? "Left the faction." : "Not a member."))}
        onGift={(id) => act((st) => (tryGiftGold(st, 15, id) ? getGiftThanks(id) : "Need 15 gold."))}
        onTrade={(realmId, offerId) => act((st) => (tryKingdomTrade(st, realmId, offerId) ? "Trade complete." : "Cannot make that trade."))}
        onScout={(id) => act((st) => (tryScout(st, id) ? `Scouts ride to ${nameOf(id)}.` : "Need 10 gold."))}
      />
    </>
  );
}
