import React from "react";
import type { GameState } from "@second-crown/sim";
import { RealmCrestPip } from "./RealmCrestPip";
import "./realm-card.css";

type Realm = GameState["realms"][number];

export type RealmStance = "war" | "truce" | "friendly" | "wary" | "hostile";

export function realmStance(atWar: boolean, peaceLeft: number, opinion: number): RealmStance {
  if (atWar) return "war";
  if (peaceLeft > 0) return "truce";
  if (opinion >= 25) return "friendly";
  if (opinion <= -25) return "hostile";
  return "wary";
}

const STANCE_LABEL: Record<RealmStance, string> = {
  war: "At war",
  truce: "Truce",
  friendly: "Friendly",
  wary: "Wary",
  hostile: "Hostile",
};

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
}) {
  const { realm, stance, peaceLeft, opinion, myOpinion, mine, theirs } = props;
  const favored = mine >= theirs;
  const share = mine + theirs > 0 ? Math.round((mine / (mine + theirs)) * 100) : 50;

  return (
    <div className={`sc-realm-dip is-${stance}`} data-realm={realm.id}>
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
      <span className="sc-realm-dip-line">
        Opinion of you <strong>{opinion}</strong>
        {myOpinion !== undefined ? <> · yours of them {myOpinion}</> : null}
      </span>
      <span className={`sc-realm-dip-line ${favored ? "is-favored" : "is-unfavored"}`}>
        Power {mine} vs {theirs} ({share}%)
      </span>
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
          <button type="button" className="sc-realm-dip-btn" onClick={props.onGift}>
            Gift 15 gold (+12 opinion)
          </button>
        ) : null}
      </span>
    </div>
  );
}
