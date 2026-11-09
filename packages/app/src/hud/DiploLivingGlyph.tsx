import React from "react";
import type { RealmStance } from "./RealmCard";
import { resolveFactionKind, type FactionKind } from "./FactionSealPip";
import { crestFor } from "../crests";
import "./diplo-glyph-living.css";

export interface RealmLivingDescriptor {
  realmId: string;
  chargeName: string;
  stance: RealmStance;
  flair: string;
}

export interface PactLivingDescriptor {
  kind: FactionKind;
  name: string;
  isMember: boolean;
  leadsIt: boolean;
  cold: boolean;
  flair: string;
}

/** Pure descriptor for a realm's living crest glyph and watermark. */
export function resolveRealmLiving(input: {
  realmId: string;
  stance: RealmStance;
  peaceLeft?: number;
  opinion?: number;
  myOpinion?: number;
  matchup?: { mine: number; theirs: number };
  power?: number;
  scouted?: boolean;
}): RealmLivingDescriptor {
  const { realmId, stance, peaceLeft = 0, opinion, matchup, power, scouted } = input;
  const crest = crestFor(realmId);

  let flair: string;
  if (stance === "war") {
    if (matchup) {
      flair = `Hostile banner · war match-up ${matchup.mine} vs ${matchup.theirs}`;
    } else {
      flair = `Hostile banner · at war with crown`;
    }
  } else if (stance === "truce") {
    const sec = Math.ceil(peaceLeft / 10);
    flair = `Truce in force · ${sec}s of peace remain`;
  } else if (stance === "friendly") {
    flair = `Warm ally · opinion ${opinion !== undefined ? (opinion >= 0 ? `+${opinion}` : opinion) : "positive"}`;
  } else if (stance === "hostile") {
    flair = `Cold enmity · opinion ${opinion !== undefined ? opinion : "negative"}`;
  } else {
    // wary
    if (scouted && power !== undefined) {
      flair = `Guarded borders · power ${power} · opinion ${opinion ?? 0}`;
    } else {
      flair = `Guarded borders · opinion ${opinion ?? 0}`;
    }
  }

  return {
    realmId,
    chargeName: crest.chargeName,
    stance,
    flair,
  };
}

export interface FactionLike {
  id?: string;
  name?: string;
  kind?: string;
  stance?: number;
  memberRealmIds?: string[];
  leaderRealmId?: string | null;
}

/** Pure descriptor for a pact/faction's living seal glyph and watermark. */
export function resolvePactLiving(input: {
  kind?: string;
  faction?: FactionLike;
  isMember?: boolean;
}): PactLivingDescriptor {
  const { kind, faction, isMember = false } = input;
  const resolvedKind = resolveFactionKind(kind, faction);
  const name = faction?.name ?? (resolvedKind === "order" ? "Holy Order" : resolvedKind === "pact" ? "Salt Pact" : "Artisan Guild");
  const stanceVal = faction?.stance ?? 0;
  const cold = stanceVal < -10;
  const sworn = faction?.memberRealmIds?.length ?? 0;
  const leadsIt = faction?.leaderRealmId === "player";

  let flair: string;
  if (leadsIt) {
    flair = `Crown sovereign · leading ${sworn} sworn members`;
  } else if (isMember) {
    flair = `Sworn member · ${sworn} crowns bound`;
  } else if (cold) {
    flair = `Covenant warded · stance ${stanceVal} (too cold to join)`;
  } else {
    flair = `Open covenant · ${sworn} crowns sworn`;
  }

  return {
    kind: resolvedKind,
    name,
    isMember,
    leadsIt,
    cold,
    flair,
  };
}

function RealmChargeEmblemSvg({ realmId, stance }: { realmId: string; stance: RealmStance }) {
  const isActive = stance === "war" || stance === "hostile";

  return (
    <>
      <circle className="sc-diplo-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
      <g className="sc-diplo-drift-layer">
        {realmId === "player" ? (
          /* Imperial Solar Crown */
          <>
            <path
              d="M7 16 H17 M8 15 L7 10 L10 12 L12 7.5 L14 12 L17 10 L16 15 Z"
              fill="currentColor"
              fillOpacity="0.32"
              stroke="currentColor"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <path d="M12 4.5 V6 M9 5.5 L10 7 M15 5.5 L14 7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </>
        ) : realmId === "rival" ? (
          /* Crossed Greatswords & Iron Keep */
          <>
            <path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <path
              d="M9 11 H15 V17 H9 Z M10 13 H11 M13 13 H14 M11.5 15 H12.5"
              fill="currentColor"
              fillOpacity="0.35"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </>
        ) : realmId === "k_frost" ? (
          /* Twin Bearded Waraxes & Runic Stag */
          <>
            <path d="M7 6 L12 18 M17 6 L12 18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <path d="M6 6 C9 5 10 8 7 9 M18 6 C15 5 14 8 17 9" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.8" />
          </>
        ) : realmId === "k_silk" ? (
          /* Gilded Caravel & Balance Scales */
          <>
            <path d="M6 14 C8 17 16 17 18 14 Z M12 6 V14 M8 9 L12 6 L16 9" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
          </>
        ) : realmId === "k_veil" ? (
          /* Eye of Providence & Eightfold Star */
          <>
            <path d="M6 12 C9 8 15 8 18 12 C15 16 9 16 6 12 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.9" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          </>
        ) : realmId === "k_tide" ? (
          /* Abyssal Trident & Breaker Waves */
          <>
            <path d="M12 5 V19 M9 7 V11 C9 13 15 13 15 11 V7" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M6 17 C9 15 15 19 18 17" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          </>
        ) : realmId === "k_ember" ? (
          /* Fire-Phoenix & Arcane Flame */
          <>
            <path d="M12 6 C10 9 7 11 8 15 C10 18 14 18 16 15 C17 11 14 9 12 6 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.9" />
            <path d="M12 10 C11 12 11 14 12 15 C13 14 13 12 12 10 Z" fill="currentColor" />
          </>
        ) : (
          /* Standard Heater Shield & Charge Star */
          <>
            <path
              d="M7 6 H17 V12 C17 16 12 18.5 12 18.5 C12 18.5 7 16 7 12 Z"
              fill="currentColor"
              fillOpacity="0.28"
              stroke="currentColor"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <path d="M12 8.5 V14.5 M9 11.5 H15" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </>
        )}
      </g>
      <g className="sc-diplo-pulse-layer">
        {isActive ? (
          <>
            <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
            <path d="M12 5.8 V9.2 M10.3 7.5 H13.7" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
          </>
        ) : (
          <circle cx="12" cy="7.5" r="0.8" fill="currentColor" />
        )}
      </g>
    </>
  );
}

function FactionChargeEmblemSvg({ kind, isMember }: { kind: FactionKind; isMember: boolean }) {
  return (
    <>
      <circle className="sc-diplo-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
      <g className="sc-diplo-drift-layer">
        {kind === "order" ? (
          /* Chivalric cruciform blade and sunburst */
          <>
            <path d="M12 4.5 V18.5 M8 8.5 H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="12" cy="8.5" r="1.4" fill="currentColor" fillOpacity="0.4" />
          </>
        ) : kind === "pact" ? (
          /* Crossed covenant treaty stilettos */
          <>
            <path d="M7 6.5 L17 16.5 M17 6.5 L7 16.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <polygon points="12,8.5 14.5,11.5 12,14.5 9.5,11.5" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="0.7" />
          </>
        ) : (
          /* Artisan guild hammer and drafting compass */
          <>
            <path d="M8 17 L15 10 M13 8 L17 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M12 5 L7 17 M12 5 L17 17" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          </>
        )}
      </g>
      <g className="sc-diplo-pulse-layer">
        {isMember ? (
          <>
            <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="12" cy="12" r="1.1" fill="currentColor" />
          </>
        ) : (
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
        )}
      </g>
    </>
  );
}

/**
 * Corner-confined 34x34 ambient realm crest watermark inside `.sc-realm-dip`.
 * Strictly pointer-events: none so clicks and buttons are never blocked.
 */
export function RealmLivingUnderlay(props: {
  realmId: string;
  stance: RealmStance;
  isColder?: boolean;
}) {
  const { realmId, stance, isColder } = props;
  const cold = isColder !== undefined ? isColder : (stance === "hostile" || stance === "war");
  const desc = resolveRealmLiving({ realmId, stance });

  return (
    <span
      className={`sc-diplo-living-underlay sc-realm-living-underlay sc-realm-crest-underlay realm-${realmId} stance-${stance} is-${stance}${cold ? " is-colder" : ""}`}
      aria-hidden="true"
      data-realm-watermark={realmId}
      data-stance={stance}
    >
      <svg viewBox="0 0 24 24" className="sc-diplo-underlay-svg" focusable="false">
        <RealmChargeEmblemSvg realmId={realmId} stance={stance} />
      </svg>
    </span>
  );
}

/**
 * Living 14x14 realm crest emblem and flair status strip rendered directly beneath
 * `DiploLedger` on realm cards in WarRoom and WorldPanel.
 */
export function RealmLivingGlyph(props: {
  realmId: string;
  stance: RealmStance;
  peaceLeft?: number;
  opinion?: number;
  myOpinion?: number;
  matchup?: { mine: number; theirs: number };
  power?: number;
  scouted?: boolean;
}) {
  const { realmId, stance } = props;
  const desc = resolveRealmLiving(props);

  return (
    <span
      className={`sc-diplo-crest-glyph sc-realm-living-glyph sc-realm-crest-glyph sc-diplo-living-glyph realm-${realmId} stance-${stance} is-${stance}`}
      aria-hidden="true"
      data-realm-glyph={realmId}
      data-stance={stance}
    >
      <svg viewBox="0 0 24 24" className="sc-diplo-crest-icon sc-realm-crest-icon" focusable="false">
        <RealmChargeEmblemSvg realmId={realmId} stance={stance} />
      </svg>
      <span className="sc-diplo-crest-flair sc-realm-crest-flair">{desc.flair}</span>
    </span>
  );
}

/**
 * Corner-confined 34x34 ambient faction seal watermark inside `.sc-faction-card`.
 * Strictly pointer-events: none so Join/Leave buttons are never blocked.
 */
export function PactLivingUnderlay(props: {
  kind?: string;
  faction?: FactionLike;
  isMember?: boolean;
}) {
  const desc = resolvePactLiving(props);
  const toneClass = desc.isMember ? "pact-member" : desc.cold ? "pact-cold" : "pact-empty";

  return (
    <span
      className={`sc-diplo-living-underlay sc-pact-living-underlay sc-pact-seal-underlay pact-${desc.kind} ${toneClass}`}
      aria-hidden="true"
      data-pact-watermark={desc.kind}
      data-member={desc.isMember}
    >
      <svg viewBox="0 0 24 24" className="sc-diplo-underlay-svg" focusable="false">
        <FactionChargeEmblemSvg kind={desc.kind} isMember={desc.isMember} />
      </svg>
    </span>
  );
}

/**
 * Living 14x14 faction seal emblem and flair status strip rendered directly beneath
 * `DiploLedger` on faction cards in WorldPanel.
 */
export function PactLivingGlyph(props: {
  kind?: string;
  faction?: FactionLike;
  isMember?: boolean;
}) {
  const desc = resolvePactLiving(props);
  const toneClass = desc.isMember ? "pact-member" : desc.cold ? "pact-cold" : "pact-empty";

  return (
    <span
      className={`sc-diplo-crest-glyph sc-pact-crest-glyph sc-pact-living-glyph pact-${desc.kind} ${toneClass}`}
      aria-hidden="true"
      data-pact-glyph={desc.kind}
      data-member={desc.isMember}
    >
      <svg viewBox="0 0 24 24" className="sc-diplo-crest-icon" focusable="false">
        <FactionChargeEmblemSvg kind={desc.kind} isMember={desc.isMember} />
      </svg>
      <span className="sc-diplo-crest-flair">{desc.flair}</span>
    </span>
  );
}

export const RealmCrestLivingGlyph = RealmLivingGlyph;
export const DiploLivingGlyph = RealmLivingGlyph;
export const RealmCrestLivingUnderlay = RealmLivingUnderlay;
export const DiploLivingUnderlay = RealmLivingUnderlay;
export const PactSealLivingGlyph = PactLivingGlyph;
export const PactSealLivingUnderlay = PactLivingUnderlay;
