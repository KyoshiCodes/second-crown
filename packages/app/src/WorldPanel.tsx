import React from "react";
import type { GameState } from "@second-crown/sim";
import { realmPower, playerTitle, KINGDOM_OFFERS, getUnitType, isScouted } from "@second-crown/sim";
import { Crest } from "./Crest";
import { crestFor } from "./crests";
import { getRealmFlavor } from "./content/flavor";
import { RealmCardHead, playerStanceToward } from "./hud/RealmCard";
import "./hud/crown-card.css";

function hostLine(state: GameState, realmId: string): string {
  const parts = state.units
    .filter((u) => u.realmId === realmId)
    .map((u) => {
      const n = Math.floor(Number(u.count) || 0);
      if (n <= 0) return "";
      const name = getUnitType(u.typeId)?.name ?? u.typeId;
      return `${n} ${name}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "no standing host";
}

export function WorldPanel(props: {
  state: GameState | undefined;
  onFoundGuild: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onGift?: (realmId: string) => void;
  onTrade?: (realmId: string, offerId: string) => void;
  onScout?: (realmId: string) => void;
}) {
  const state = props.state;
  if (!state) return null;
  const title = playerTitle(state);
  const playerFlavor = getRealmFlavor("player");
  const others = state.realms.filter((r) => r.id !== "player");

  return (
    <div className="sc-world-view" style={{ margin: "14px 0" }}>
      <div className="sc-player-banner">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Crest realmId="player" size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 16, color: "#fcd34d" }}>Your Crown</strong>
              <span className="sc-rank-badge">{title}</span>
              <span className="sc-charge-pill">{playerFlavor.chargeName}</span>
            </div>
            <p className="sc-realm-blurb">{playerFlavor.blurb}</p>
            <p style={{ fontSize: 12, opacity: 0.75 }}>Power {realmPower(state, "player")} · {hostLine(state, "player")}</p>
          </div>
        </div>
      </div>
      <h3>Known Crowns</h3>
      <div className="sc-world-realms" style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      {others.map((r) => {
        const ruler = state.characters.find((c) => c.id === r.rulerId);
        const { stance, peaceLeft, opinion } = playerStanceToward(state, r.id);
        const flavor = getRealmFlavor(r.id);
        const power = realmPower(state, r.id);
        const seen = isScouted(state, r.id);
        const offers = KINGDOM_OFFERS[r.id] ?? [];
        return (
          <div key={r.id} className={`sc-realm-dip is-${stance}`} data-realm={r.id}>
            <RealmCardHead realm={r} stance={stance} peaceLeft={peaceLeft} />
            <span className="sc-realm-dip-line">
              {flavor.title} · {ruler?.name ?? flavor.rulerName} · {crestFor(r.id).chargeName}
            </span>
            <span className="sc-realm-dip-line">
              {r.era} · {r.lifestyle} · {seen ? `power ${power}` : "power ?"} · opinion of you <strong>{opinion}</strong>
            </span>
            <span className="sc-realm-dip-line">
              Scout: {seen ? hostLine(state, r.id) : "unknown host"}
            </span>
            <p className="sc-realm-blurb" style={{ margin: "2px 0 0" }}>{flavor.blurb}</p>
            <div className="sc-realm-taunt"><em>"{flavor.warTaunt}"</em></div>
            <span className="sc-realm-dip-actions">
              {!seen && props.onScout ? (
                <button type="button" className="sc-realm-dip-btn" onClick={() => props.onScout?.(r.id)}>Scout host (10 gold)</button>
              ) : null}
              {props.onGift ? (
                <button type="button" className="sc-realm-dip-btn" onClick={() => props.onGift?.(r.id)}>
                  Send 15 Gold Tribute to {ruler?.name ?? r.name}
                </button>
              ) : null}
              {props.onTrade && offers.map((o) => (
                <button key={o.id} type="button" className="sc-realm-dip-btn" onClick={() => props.onTrade?.(r.id, o.id)}>
                  Trade: {o.label}
                </button>
              ))}
            </span>
          </div>
        );
      })}
      </div>
      <h3>Factions</h3>
      <div className="sc-crown-grid">
      {(state.factions ?? []).map((f) => {
        const mine = f.memberRealmIds.includes("player");
        const cold = f.stance < -10;
        const tone = mine ? "is-member" : cold ? "is-cold" : "is-empty";
        return (
          <div key={f.id} className={`sc-work-card sc-faction-card sc-crown-faction ${tone} ${mine ? "sc-faction-member" : ""}`}>
            <div className="sc-work-head">
              <span className="sc-work-name">{f.name}</span>
              {f.kind ? <span className="sc-work-level">{f.kind}</span> : null}
            </div>
            <div className="sc-work-status">
              Stance {f.stance}
              {mine ? " · member" : ""}
            </div>
            <div className="sc-work-foot">
              <span className="sc-work-where">{f.memberRealmIds.length} sworn</span>
              {mine ? (
                <button type="button" className="sc-work-btn" onClick={() => props.onLeave(f.id)}>Leave</button>
              ) : (
                <button type="button" className="sc-work-btn" onClick={() => props.onJoin(f.id)} disabled={cold} title={cold ? "Stance too cold to join (below -10)." : undefined}>Join</button>
              )}
            </div>
          </div>
        );
      })}
      </div>
      {!state.factions?.some((f) => f.leaderRealmId === "player") && (
        <button type="button" className="sc-btn sc-btn-primary" onClick={props.onFoundGuild}>Found Your Guild</button>
      )}
    </div>
  );
}
