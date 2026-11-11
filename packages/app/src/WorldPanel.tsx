import React from "react";
import type { GameState } from "@second-crown/sim";
import { realmPower, playerTitle, KINGDOM_OFFERS, getUnitType, isScouted, giftOffer } from "@second-crown/sim";
import { Crest } from "./Crest";
import { crestFor } from "./crests";
import { getRealmFlavor } from "./content/flavor";
import { playerStanceToward, RealmCardHead } from "./hud/RealmCard";
import { RealmCrestPip } from "./hud/RealmCrestPip";
import { FactionSealPip } from "./hud/FactionSealPip";
import { DiploLedger, pactLedgerRows, realmLedgerRows } from "./hud/DiploLedger";
import { DiploLivingRows, realmPactOf } from "./hud/DiploLivingRows";
import { RealmLivingGlyph, RealmLivingUnderlay, PactLivingGlyph, PactLivingUnderlay } from "./hud/DiploLivingGlyph";
import { GiftPip, resolveGiftStatus } from "./hud/GiftPip";
import { GiftLine } from "./hud/GiftLine";
import "./hud/crown-card.css";
import "./hud/faction-seals.css";
import "./hud/diplo-glyph-living.css";
import "./hud/gift-pip.css";

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
  onScout?: (realmId: string) => void;
  onGift?: (realmId: string) => void;
  onTrade?: (realmId: string, offerId: string) => void;
}) {
  const { state } = props;
  if (!state) return null;
  const player = state.realms.find((r) => r.id === "player");
  const others = state.realms.filter((r) => r.id !== "player");
  const tit = playerTitle(state);
  return (
    <div style={{ margin: "12px 0" }}>
      <div className="sc-world-banner" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", border: "1px solid var(--chrome-btn-border)", borderRadius: 6, marginBottom: 14 }}>
        <Crest realmId="player" size={44} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{player?.name ?? "Your Realm"}</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            {tit} · {player?.era ?? "iron"} · {player?.lifestyle ?? "feudal"} · Power {realmPower(state, "player")}
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
        const gift = giftOffer(state, r.id);
        const giftStatus = resolveGiftStatus({
          state,
          realmId: r.id,
          hasGiftAction: !!props.onGift,
          giftAvailable: gift.ok,
        });
        const hasGift = giftStatus === "available" || giftStatus === "just-sent";
        const cardGiftClass = hasGift ? ` has-gift is-gift-${giftStatus}` : "";
        return (
          <div key={r.id} className={`sc-realm-dip is-${stance} is-living${cardGiftClass}`} data-realm={r.id} data-gift-status={giftStatus ?? undefined}>
            <RealmLivingUnderlay realmId={r.id} stance={stance} />
            {hasGift ? (
              <span
                className="sc-realm-gift-badge"
                aria-hidden="true"
                data-realm-gift={r.id}
                data-gift-status={giftStatus}
              >
                <GiftPip
                  status={giftStatus}
                  size={20}
                  title={giftStatus === "just-sent" ? "Tribute dispatched!" : "Tribute available (15 gold)"}
                />
              </span>
            ) : null}
            <DiploLivingRows
              realmId={r.id}
              stance={stance}
              pact={realmPactOf(state.factions, r.id)}
              rows={realmLedgerRows({
                name: r.name,
                nameSub: `${flavor.title} · ${ruler?.name ?? flavor.rulerName}`,
                stance,
                peaceLeft,
                opinion,
                power: seen ? power : undefined,
                scouted: seen,
                lead: <RealmCrestPip realmId={r.id} stance={stance} size={24} />,
              })}
            />
            <RealmLivingGlyph
              realmId={r.id}
              stance={stance}
              peaceLeft={peaceLeft}
              opinion={opinion}
              power={seen ? power : undefined}
              scouted={seen}
            />
            <span className="sc-realm-dip-line">
              {crestFor(r.id).chargeName} · {r.era} · {r.lifestyle}
            </span>
            <span className="sc-realm-dip-line">
              Scout: {seen ? hostLine(state, r.id) : "unknown host"}
            </span>
            <p className="sc-realm-blurb" style={{ margin: "2px 0 0" }}>{flavor.blurb}</p>
            <div className="sc-realm-taunt"><em>"{flavor.warTaunt}"</em></div>
            {props.onGift ? <GiftLine offer={gift} /> : null}
            <span className="sc-realm-dip-actions">
              {!seen && props.onScout ? (
                <button type="button" className="sc-realm-dip-btn" onClick={() => props.onScout?.(r.id)}>Scout host (10 gold)</button>
              ) : null}
              {props.onGift ? (
                <button
                  type="button"
                  className={`sc-realm-dip-btn sc-realm-gift-btn${giftStatus ? ` is-${giftStatus}` : ""} sc-gift-btn`}
                  disabled={!gift.ok}
                  onClick={() => props.onGift?.(r.id)}
                >
                  <GiftPip status={giftStatus ?? "unaffordable"} size={14} />
                  <span>Send {gift.cost} Gold Tribute to {ruler?.name ?? r.name}</span>
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
          <div key={f.id} className={`sc-work-card sc-faction-card sc-crown-faction ${tone} ${mine ? "sc-faction-member" : ""} is-living`}>
            <PactLivingUnderlay faction={f} isMember={mine} />
            <DiploLedger
              rows={pactLedgerRows({
                name: f.name,
                kind: f.kind,
                stance: f.stance,
                member: mine,
                sworn: f.memberRealmIds.length,
                leadsIt: f.leaderRealmId === "player",
                lead: <FactionSealPip faction={f} isMember={mine} size={24} />,
              })}
            />
            <PactLivingGlyph faction={f} isMember={mine} />
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
