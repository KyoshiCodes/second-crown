import React from "react";
import type { GameState } from "@second-crown/sim";
import { realmPower, playerTitle } from "@second-crown/sim";
import { Crest } from "./Crest";
import { crestFor } from "./crests";
import { getRealmFlavor } from "./content/flavor";

export function WorldPanel(props: {
  state: GameState | undefined;
  onFoundGuild: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onGift?: (realmId: string) => void;
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
          </div>
        </div>
      </div>
      <h3>Known Crowns</h3>
      {others.map((r) => {
        const ruler = state.characters.find((c) => c.id === r.rulerId);
        const op = state.opinions.find((o) => o.from === r.rulerId && o.to === "char_player")?.value ?? 0;
        const flavor = getRealmFlavor(r.id);
        const power = realmPower(state, r.id);
        const opLabel = op >= 20 ? "Friendly" : op <= -40 ? "Hostile" : "Neutral";
        const opClass = op >= 20 ? "op-friendly" : op <= -40 ? "op-hostile" : "op-neutral";
        return (
          <div key={r.id} className="sc-realm-card">
            <div className="sc-realm-card-header">
              <Crest realmId={r.id} size={38} />
              <div style={{ flex: 1 }}>
                <strong>{r.name}</strong> {flavor.title} · {ruler?.name ?? flavor.rulerName}
                <div className="sc-realm-meta">
                  {r.era} · {r.lifestyle} · power {power} ·{" "}
                  <span className={`sc-op-tag ${opClass}`}>{op} ({opLabel})</span>
                </div>
                <div className="sc-charge-pill">{crestFor(r.id).chargeName}</div>
              </div>
            </div>
            <p className="sc-realm-blurb">{flavor.blurb}</p>
            <div className="sc-realm-taunt"><em>"{flavor.warTaunt}"</em></div>
            {props.onGift ? (
              <button type="button" className="sc-btn sc-btn-gift" onClick={() => props.onGift?.(r.id)}>
                Send 15 Gold Tribute to {ruler?.name ?? r.name}
              </button>
            ) : null}
          </div>
        );
      })}
      <h3>Factions</h3>
      {(state.factions ?? []).map((f) => {
        const mine = f.memberRealmIds.includes("player");
        return (
          <div key={f.id} className={`sc-faction-card ${mine ? "sc-faction-member" : ""}`}>
            <strong>{f.name}</strong> ({f.kind}) stance {f.stance}
            {mine ? " · member" : ""}
            <div>
              {mine ? (
                <button type="button" onClick={() => props.onLeave(f.id)}>Leave</button>
              ) : (
                <button type="button" onClick={() => props.onJoin(f.id)} disabled={f.stance < -10}>Join</button>
              )}
            </div>
          </div>
        );
      })}
      {!state.factions?.some((f) => f.leaderRealmId === "player") && (
        <button type="button" className="sc-btn sc-btn-primary" onClick={props.onFoundGuild}>Found Your Guild</button>
      )}
    </div>
  );
}
