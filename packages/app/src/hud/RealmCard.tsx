import React from "react";
import { opinionOfPlayerFromRealm, peaceTicksRemaining, type GameState } from "@second-crown/sim";
import { RealmCrestPip } from "./RealmCrestPip";
import { realmLedgerRows } from "./DiploLedger";
import { DiploLivingRows, type RealmPact } from "./DiploLivingRows";
import { RealmLivingGlyph, RealmLivingUnderlay } from "./DiploLivingGlyph";
import { GiftPip, resolveGiftStatus, type GiftStatus } from "./GiftPip";
import "./realm-card.css";
import "./diplo-living.css";
import "./diplo-glyph-living.css";
import "./gift-pip.css";

type Realm = GameState["realms"][number];

export type RealmStance = "war" | "truce" | "friendly" | "wary" | "hostile";

export function realmStance(atWar: boolean, peaceLeft: number, opinion: number): RealmStance {
  if (atWar) return "war";
  if (peaceLeft > 0) return "truce";
  if (opinion >= 25) return "friendly";
  if (opinion <= -25) return "hostile";
  return "wary";
}

/** Player's stance toward a realm, same inputs the diplomacy grid uses. */
export function playerStanceToward(state: GameState, realmId: string): { stance: RealmStance; peaceLeft: number; opinion: number } {
  const war = state.wars.find((w) => w.status === "active");
  const atWar = !!war && [war.attackerRealmId, war.defenderRealmId].includes(realmId);
  const peaceLeft = peaceTicksRemaining(state, "player", realmId);
  const opinion = opinionOfPlayerFromRealm(state, realmId);
  return { stance: realmStance(atWar, peaceLeft, opinion), peaceLeft, opinion };
}

const STANCE_LABEL: Record<RealmStance, string> = {
  war: "At war",
  truce: "Truce",
  friendly: "Friendly",
  wary: "Wary",
  hostile: "Hostile",
};

/** Crest + name + stance header shared by the diplomacy grid and the World tab. */
export function RealmCardHead(props: { realm: Realm; stance: RealmStance; peaceLeft: number }) {
  const { realm, stance, peaceLeft } = props;
  return (
    <span className="sc-realm-dip-head">
      <span className="sc-realm-dip-title-group">
        <RealmCrestPip realmId={realm.id} stance={stance} size={28} />
        <span className="sc-realm-dip-name">{realm.name}</span>
      </span>
      <span className={`sc-realm-dip-stance is-${stance}`}>
        {STANCE_LABEL[stance]}
        {stance === "truce" ? ` ${Math.ceil(peaceLeft / 10)}s` : ""}
      </span>
    </span>
  );
}

export function RealmCard(props: {
  realm: Realm;
  stance: RealmStance;
  peaceLeft: number;
  opinion: number;
  myOpinion?: number;
  mine: number;
  theirs: number;
  declareLocked: boolean;
  onDeclare: () => void;
  onGift?: () => void;
  /** Pact this realm is sworn to (realmPactOf over state.factions); null or omitted reads "No pact". */
  pact?: RealmPact | null;
  /** Game state to evaluate gold resources and recent gift history deterministically. */
  state?: GameState;
  /** Explicit gift status override ("available" | "just-sent" | "unaffordable"). */
  giftStatus?: GiftStatus;
  /** Explicit gift available flag (e.g. player has >= 15 gold). */
  giftAvailable?: boolean;
  /** Explicit gift just sent flag (e.g. sent in recent seconds). */
  giftJustSent?: boolean;
}) {
  const { realm, stance, peaceLeft, opinion, myOpinion, mine, theirs } = props;
  const favored = mine >= theirs;
  const rows = realmLedgerRows({
    name: realm.name,
    stance,
    peaceLeft,
    opinion,
    myOpinion,
    matchup: { mine, theirs },
    lead: <RealmCrestPip realmId={realm.id} stance={stance} size={24} />,
  });

  const giftStatus =
    props.giftStatus ??
    resolveGiftStatus({
      state: props.state,
      realmId: realm.id,
      hasGiftAction: !!props.onGift,
      giftAvailable: props.giftAvailable,
      giftJustSent: props.giftJustSent,
    });
  const hasGift = giftStatus === "available" || giftStatus === "just-sent";
  const cardGiftClass = hasGift ? ` has-gift is-gift-${giftStatus}` : "";

  return (
    <div
      className={`sc-realm-dip is-${stance} is-living sc-realm-living-card sc-diplo-living-card${cardGiftClass}`}
      data-realm={realm.id}
      data-gift-status={giftStatus ?? undefined}
    >
      <RealmLivingUnderlay realmId={realm.id} stance={stance} />
      {hasGift ? (
        <span
          className="sc-realm-gift-badge"
          aria-hidden="true"
          data-realm-gift={realm.id}
          data-gift-status={giftStatus}
        >
          <GiftPip
            status={giftStatus}
            size={20}
            title={giftStatus === "just-sent" ? "Tribute dispatched!" : "Tribute available (15 gold)"}
          />
        </span>
      ) : null}
      <DiploLivingRows realmId={realm.id} stance={stance} rows={rows} pact={props.pact ?? null} />
      <RealmLivingGlyph
        realmId={realm.id}
        stance={stance}
        peaceLeft={peaceLeft}
        opinion={opinion}
        myOpinion={myOpinion}
        matchup={{ mine, theirs }}
      />
      {/* former sc-realm-dip-line rows stacked by DiploLivingRows (Name / Stance / Pact / Power) */}
      <span className="sc-realm-dip-actions">
        <button
          type="button"
          className="sc-realm-dip-btn"
          disabled={props.declareLocked}
          style={{ borderColor: favored ? "#3fb950" : "#f85149", borderWidth: 1, borderStyle: "solid" }}
          onClick={props.onDeclare}
        >
          Declare war
        </button>
        {props.onGift ? (
          <button
            type="button"
            className={`sc-realm-dip-btn sc-realm-gift-btn${giftStatus ? ` is-${giftStatus}` : ""}`}
            onClick={props.onGift}
          >
            <GiftPip status={giftStatus ?? "unaffordable"} size={14} />
            <span>Gift 15 gold (+12 opinion)</span>
          </button>
        ) : null}
      </span>
    </div>
  );
}

export const RealmLivingCard = RealmCard;
export const DiploLivingCard = RealmCard;
