import React from "react";
import type { StudyStatus } from "./StudyLedger";
import "./academy-glyph-living.css";

export type ResearchDiscipline =
  | "agronomy"
  | "masonry"
  | "cartography"
  | "tactics"
  | "horsemanship"
  | "siegecraft";

export type LecternLivingMode = "studying" | "mastered" | "academy" | "field";

export interface StudyLivingDescriptor {
  topicId: string;
  discipline: ResearchDiscipline;
  status: StudyStatus;
  academyFast: boolean;
  flair: string;
}

export interface LecternLivingDescriptor {
  mode: LecternLivingMode;
  flair: string;
}

const TOPIC_FOLIO_LABEL: Record<string, string> = {
  husbandry: "Agronomy folio",
  forestry: "Silviculture folio",
  masonry: "Ashlar treatise",
  logistics: "Quartermaster codex",
  surveying: "Astrolabe chart",
  fieldcraft: "Ranger manual",
  drill: "Marshal drillbook",
  screening: "Vanguard treatise",
  horse: "Equerry tome",
  siege: "Poliorcetics scroll",
  crop_rotation: "Fallow-field almanac",
  timber_framing: "Joiner's pattern book",
  fortification: "Curtain-wall treatise",
  supply_trains: "Wagon-master ledger",
  cartography: "Realm atlas",
  quartermastery: "Muster-roll codex",
};

/** Maps a research topic id to its scholarly discipline. */
export function getResearchDiscipline(topicId: string): ResearchDiscipline {
  switch (topicId) {
    case "husbandry":
    case "forestry":
    case "crop_rotation":
    case "timber_framing":
      return "agronomy";
    case "masonry":
    case "fortification":
      return "masonry";
    case "logistics":
    case "surveying":
    case "supply_trains":
    case "cartography":
      return "cartography";
    case "fieldcraft":
    case "drill":
    case "screening":
    case "quartermastery":
      return "tactics";
    case "horse":
      return "horsemanship";
    case "siege":
      return "siegecraft";
    default:
      return "cartography";
  }
}

/**
 * Pure descriptor for one study card's living research glyph.
 * Reads only the topic id, StudyStatus, and whether an Academy hall stands.
 */
export function resolveStudyLiving(input: {
  topicId: string;
  status: StudyStatus;
  academyFast?: boolean;
}): StudyLivingDescriptor {
  const { topicId, status, academyFast = false } = input;
  const discipline = getResearchDiscipline(topicId);
  const folio = TOPIC_FOLIO_LABEL[topicId] ?? "Scholarly folio";

  const stateWord =
    status === "studying"
      ? "scribes ink"
      : status === "known"
        ? "codified"
        : status === "open"
          ? academyFast
            ? "lectern -20%"
            : "lectern open"
          : "hall sealed";

  return {
    topicId,
    discipline,
    status,
    academyFast,
    flair: `${folio} · ${stateWord}`,
  };
}

/**
 * Pure descriptor for the outer Academy Lectern card's living strip.
 * Reads only counts/labels ResearchBar already computes.
 */
export function resolveAcademyLecternLiving(input: {
  activeName?: string;
  knownCount: number;
  totalCount: number;
  academyCount: number;
}): LecternLivingDescriptor {
  const { activeName, knownCount, totalCount, academyCount } = input;
  if (activeName) {
    return {
      mode: "studying",
      flair: `Lectern lamp lit · studying ${activeName} · ${knownCount}/${totalCount} codified`,
    };
  }
  if (totalCount > 0 && knownCount >= totalCount) {
    return {
      mode: "mastered",
      flair: `Academy codex complete · all ${totalCount} studies codified`,
    };
  }
  if (academyCount >= 1) {
    return {
      mode: "academy",
      flair: `Academy armillary · -20% study pace · ${knownCount}/${totalCount} codified`,
    };
  }
  return {
    mode: "field",
    flair: `Field lectern · base study pace · ${knownCount}/${totalCount} codified`,
  };
}

/** A tier II study builds on a tier I study (sim researchRequires mapping). */
export const TIER_TWO_EMBLEM: Record<string, string> = {
  crop_rotation: "husbandry",
  timber_framing: "forestry",
  fortification: "masonry",
  supply_trains: "logistics",
  cartography: "surveying",
  quartermastery: "drill",
};

export const TIER_TWO_TOPICS = new Set<string>([
  "crop_rotation",
  "timber_framing",
  "fortification",
  "supply_trains",
  "cartography",
  "quartermastery",
]);

export function isTierTwoStudy(topicId: string): boolean {
  return TIER_TWO_TOPICS.has(topicId);
}

function TopicEmblemSvg(props: { topicId: string; discipline: ResearchDiscipline }) {
  const { topicId, discipline } = props;
  if (discipline === "agronomy") {
    if (topicId === "crop_rotation") {
      /* Crop rotation: four-quadrant fallow cycle, clover leaf, grain ear, furrow lines & turning plow */
      return (
        <>
          <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.8" fill="currentColor" opacity="0.18" />
          <g className="sc-academy-drift-layer sc-research-drift-layer">
            <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeDasharray="3 1.8" />
            <path d="M12 4.8 V19.2 M4.8 12 H19.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
            <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="0.9" />
            <path d="M14.5 9.5 L16.5 7.5 M15 7.5 L16.5 9" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
            <path d="M13.8 14.5 H17.2 M14.2 16.5 H16.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M7 16 C6.8 13.8 8.8 13.8 9.5 15.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g className="sc-academy-pulse-layer sc-research-pulse-layer">
            <circle cx="12" cy="4.8" r="1.15" fill="currentColor" />
            <circle cx="19.2" cy="12" r="0.9" fill="currentColor" opacity="0.85" />
            <circle cx="12" cy="19.2" r="0.8" fill="currentColor" opacity="0.75" />
            <circle cx="4.8" cy="12" r="0.9" fill="currentColor" opacity="0.85" />
          </g>
        </>
      );
    }

    if (topicId === "timber_framing") {
      /* Timber framing: joiner's timber truss, pegged mortise-and-tenon joints & plumb bob */
      return (
        <>
          <rect className="sc-academy-glow-layer sc-research-glow-layer" x="4.5" y="4.5" width="15" height="15" rx="3" fill="currentColor" opacity="0.18" />
          <g className="sc-academy-drift-layer sc-research-drift-layer">
            <path d="M4.6 18 H19.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M5.5 18 L12 5.5 L18.5 18" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
            <path d="M12 5.5 V18" stroke="currentColor" strokeWidth="1.25" />
            <path d="M8.2 18 L12 12.5 M15.8 18 L12 12.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
            <circle cx="12" cy="6.2" r="0.9" fill="currentColor" />
            <circle cx="6.2" cy="17.2" r="0.8" fill="currentColor" />
            <circle cx="17.8" cy="17.2" r="0.8" fill="currentColor" />
          </g>
          <g className="sc-academy-pulse-layer sc-research-pulse-layer">
            <path d="M12 12.5 V15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <polygon points="12,17.2 10.8,15 13.2,15" fill="currentColor" />
          </g>
        </>
      );
    }

    const isForestry = topicId === "forestry";
    return (
      <>
        <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
        <g className="sc-academy-drift-layer sc-research-drift-layer">
          {isForestry ? (
            /* Silviculture oak bough & felling blade */
            <>
              <path
                d="M12 20 V6 M12 10 L7.5 13.2 M12 12.5 L16.5 15.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <path
                d="M12 4.2 L7.2 11.4 H10.2 L6.6 16.4 H17.4 L13.8 11.4 H16.8 Z"
                fill="currentColor"
                fillOpacity="0.26"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
            </>
          ) : (
            /* Husbandry grain ear & crescent sickle */
            <>
              <path
                d="M10.2 19.5 V6.2 M10.2 14.5 C7.8 12.6 6.4 10.6 5.4 8.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <ellipse cx="8.6" cy="9.4" rx="1.15" ry="1.8" transform="rotate(-20 8.6 9.4)" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="11.8" cy="9.4" rx="1.15" ry="1.8" transform="rotate(20 11.8 9.4)" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
              <path
                d="M14.2 18.2 C18.2 16.8 19.6 12.2 16.8 8.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
            </>
          )}
        </g>
        <g className="sc-academy-pulse-layer sc-research-pulse-layer">
          <circle cx={isForestry ? "12" : "10.2"} cy="4.8" r="1.15" fill="currentColor" />
          <circle cx="17.8" cy="6.8" r="0.85" fill="currentColor" opacity="0.85" />
        </g>
      </>
    );
  }

  if (discipline === "masonry") {
    if (topicId === "fortification") {
      /* Fortification: crenellated curtain-wall bastion with machicolations, arrow slits & beacon star */
      return (
        <>
          <rect className="sc-academy-glow-layer sc-research-glow-layer" x="4" y="4" width="16" height="16" rx="2.5" fill="currentColor" opacity="0.18" />
          <g className="sc-academy-drift-layer sc-research-drift-layer">
            <path
              d="M4.8 6.5 H7.2 V8.5 H9.6 V6.5 H14.4 V8.5 H16.8 V6.5 H19.2 V11.2 H4.8 Z"
              fill="currentColor"
              fillOpacity="0.28"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M4.8 11.2 H19.2 L20.2 18.8 H3.8 Z"
              fill="currentColor"
              fillOpacity="0.24"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <path d="M7.2 11.2 V12.8 M12 11.2 V13.2 M16.8 11.2 V12.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M8.5 15.2 H15.5 M4.8 16.8 H19.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </g>
          <g className="sc-academy-pulse-layer sc-research-pulse-layer">
            <path d="M12 13.8 V17 M10.8 15 H13.2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            <circle cx="12" cy="5.2" r="1.15" fill="currentColor" />
          </g>
        </>
      );
    }

    return (
      <>
        <rect className="sc-academy-glow-layer sc-research-glow-layer" x="4.5" y="5" width="15" height="14" rx="3" fill="currentColor" opacity="0.16" />
        <g className="sc-academy-drift-layer sc-research-drift-layer">
          {/* Dressed ashlar block & mason dividers */}
          <rect
            x="5.2"
            y="13.6"
            width="13.6"
            height="5.6"
            rx="0.9"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path d="M12 13.6 V19.2" stroke="currentColor" strokeWidth="1.05" />
          <path
            d="M12 4.6 L7.6 13.2 M12 4.6 L16.4 13.2 M9.1 10.2 H14.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
        <g className="sc-academy-pulse-layer sc-research-pulse-layer">
          <circle cx="12" cy="4.6" r="1.35" fill="currentColor" />
          <polygon points="12,10.8 10.9,12.5 12,13.6 13.1,12.5" fill="currentColor" />
        </g>
      </>
    );
  }

  if (discipline === "cartography") {
    if (topicId === "supply_trains") {
      /* Supply trains: covered draught wagon with spoked wheels & road-dust lantern */
      return (
        <>
          <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.8" fill="currentColor" opacity="0.18" />
          <g className="sc-academy-drift-layer sc-research-drift-layer">
            <path
              d="M5.4 12.5 C4.8 6.8 17.6 6.8 18.2 12.5 Z"
              fill="currentColor"
              fillOpacity="0.28"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <rect x="4.6" y="12.5" width="14" height="2.8" rx="0.5" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.1" />
            <path d="M18.6 14.2 L21.6 15.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="7.6" cy="17.4" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7.6 15.1 V19.7 M5.3 17.4 H9.9" stroke="currentColor" strokeWidth="0.95" />
            <circle cx="16" cy="17.4" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M16 15.1 V19.7 M13.7 17.4 H18.3" stroke="currentColor" strokeWidth="0.95" />
          </g>
          <g className="sc-academy-pulse-layer sc-research-pulse-layer">
            <rect x="3.8" y="10.8" width="1.8" height="2.5" rx="0.4" fill="currentColor" />
            <circle cx="4.7" cy="12.1" r="0.8" fill="currentColor" opacity="0.9" />
            <circle cx="19.8" cy="13.2" r="0.9" fill="currentColor" opacity="0.8" />
          </g>
        </>
      );
    }

    if (topicId === "cartography") {
      /* Cartography: unfolded realm map sheet with creases, coastline & compass rose */
      return (
        <>
          <rect className="sc-academy-glow-layer sc-research-glow-layer" x="4.2" y="4.2" width="15.6" height="15.6" rx="2" fill="currentColor" opacity="0.18" />
          <g className="sc-academy-drift-layer sc-research-drift-layer">
            <rect x="4.6" y="4.6" width="14.8" height="14.8" rx="1.2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 4.6 V19.4 M14.5 4.6 V19.4" stroke="currentColor" strokeWidth="0.85" strokeDasharray="1.5 1.5" />
            <path d="M6 9 C7.8 7.8 9.2 10.5 11.2 9.5 C13.2 8.5 14.8 11.5 18 10.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M5.5 17.5 L17.5 5.5" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
          </g>
          <g className="sc-academy-pulse-layer sc-research-pulse-layer">
            <polygon points="15.5,13.2 16.3,14.7 17.8,15.5 16.3,16.3 15.5,17.8 14.7,16.3 13.2,15.5 14.7,14.7" fill="currentColor" />
            <circle cx="7.2" cy="7.2" r="1.15" fill="currentColor" />
          </g>
        </>
      );
    }

    const isLogistics = topicId === "logistics";
    return (
      <>
        <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.8" fill="currentColor" opacity="0.18" />
        <g className="sc-academy-drift-layer sc-research-drift-layer">
          <circle cx="12" cy="12" r="6.4" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.25" />
          {isLogistics ? (
            /* Quartermaster route wheel & ledger spokes */
            <path
              d="M12 5.6 V18.4 M5.6 12 H18.4 M7.6 7.6 L16.4 16.4 M16.4 7.6 L7.6 16.4"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          ) : (
            /* Surveying astrolabe meridian & horizon sight */
            <>
              <ellipse cx="12" cy="12" rx="6.4" ry="2.6" transform="rotate(-28 12 12)" fill="none" stroke="currentColor" strokeWidth="1.15" />
              <path d="M4.2 12 H19.8 M12 4.2 V6.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
            </>
          )}
        </g>
        <g className="sc-academy-pulse-layer sc-research-pulse-layer">
          <polygon points="12,7.8 13.3,10.7 16.2,12 13.3,13.3 12,16.2 10.7,13.3 7.8,12 10.7,10.7" fill="currentColor" />
        </g>
      </>
    );
  }

  if (discipline === "tactics") {
    if (topicId === "quartermastery") {
      /* Quartermastery: muster-roll balance scale with weighed ration/weapons, coins & chevron */
      return (
        <>
          <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.6" fill="currentColor" opacity="0.18" />
          <g className="sc-academy-drift-layer sc-research-drift-layer">
            <path d="M12 5.5 V18.5 M9 18.5 H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M6.2 8.2 L17.8 8.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
            <path d="M6.2 8.2 L4.8 12.8 M6.2 8.2 L7.6 12.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M4.2 12.8 C4.8 14.5 7.6 14.5 8.2 12.8 Z" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.05" />
            <path d="M17.8 8.2 L16.4 12.8 M17.8 8.2 L19.2 12.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M15.8 12.8 C16.4 14.5 19.2 14.5 19.8 12.8 Z" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.05" />
            <path d="M10.2 16.4 L12 14.8 L13.8 16.4" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          </g>
          <g className="sc-academy-pulse-layer sc-research-pulse-layer">
            <polygon points="12,4.2 12.9,5.5 12,6.8 11.1,5.5" fill="currentColor" />
            <circle cx="17.8" cy="11.4" r="0.9" fill="currentColor" />
            <circle cx="6.2" cy="11.4" r="0.9" fill="currentColor" opacity="0.85" />
          </g>
        </>
      );
    }

    return (
      <>
        <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.18" />
        <g className="sc-academy-drift-layer sc-research-drift-layer">
          {topicId === "fieldcraft" ? (
            /* Ranger recurve bow & fletched shaft */
            <>
              <path
                d="M7.6 4.8 C14.6 7.2 14.6 16.8 7.6 19.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <path d="M7.6 4.8 V19.2 M5.2 12 H18.8" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
            </>
          ) : topicId === "drill" ? (
            /* Marshal swallowtail banner & pike staff */
            <>
              <path d="M7.2 4.2 V20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d="M7.2 5.4 H18.4 L15.6 9.2 L18.4 13 H7.2 Z"
                fill="currentColor"
                fillOpacity="0.28"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </>
          ) : (
            /* Screening kite ward-shield & boss */
            <path
              d="M6.4 5.4 H17.6 V11.4 C17.6 15.6 14.8 18.4 12 19.8 C9.2 18.4 6.4 15.6 6.4 11.4 Z"
              fill="currentColor"
              fillOpacity="0.24"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          )}
        </g>
        <g className="sc-academy-pulse-layer sc-research-pulse-layer">
          {topicId === "fieldcraft" ? (
            <polygon points="19.6,12 16.6,10.2 16.6,13.8" fill="currentColor" />
          ) : topicId === "drill" ? (
            <circle cx="7.2" cy="4.2" r="1.25" fill="currentColor" />
          ) : (
            <path d="M12 8.4 V15.4 M9.2 11.6 H14.8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          )}
        </g>
      </>
    );
  }

  if (discipline === "horsemanship") {
    return (
      <>
        <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.6" fill="currentColor" opacity="0.18" />
        <g className="sc-academy-drift-layer sc-research-drift-layer">
          {/* Iron horseshoe arch & nail calkins */}
          <path
            d="M7.6 18.6 V11.4 C7.6 7.6 9.6 5.2 12 5.2 C14.4 5.2 16.4 7.6 16.4 11.4 V18.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <rect x="6.3" y="17.4" width="2.6" height="2" rx="0.5" fill="currentColor" />
          <rect x="15.1" y="17.4" width="2.6" height="2" rx="0.5" fill="currentColor" />
        </g>
        <g className="sc-academy-pulse-layer sc-research-pulse-layer">
          <path d="M12 9.4 V14.6 M9.4 12 H14.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.15" fill="currentColor" />
        </g>
      </>
    );
  }

  /* Siegecraft: torsion frame, throwing arm & flaming counterweight shot */
  return (
    <>
      <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.8" fill="currentColor" opacity="0.18" />
      <g className="sc-academy-drift-layer sc-research-drift-layer">
        <path
          d="M4.8 18.8 H19.2 M7.4 18.8 L11.8 10.6 L15.4 18.8 M6.6 13.8 L17.6 6.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="18.8" r="1.35" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1" />
        <circle cx="15.6" cy="18.8" r="1.35" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1" />
      </g>
      <g className="sc-academy-pulse-layer sc-research-pulse-layer">
        <circle cx="18.2" cy="6.1" r="1.65" fill="currentColor" />
        <path d="M18.2 3.4 V4.4 M20.2 6.1 H21.2" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
      </g>
    </>
  );
}

function LecternEmblemSvg({ mode }: { mode: LecternLivingMode }) {
  return (
    <>
      <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="11.5" r="8" fill="currentColor" opacity="0.2" />
      <g className="sc-academy-drift-layer sc-research-drift-layer">
        {/* Open codex tome on scholar lectern */}
        <path
          d="M4.6 7.4 C7.4 6.6 10.2 7.2 12 8.6 C13.8 7.2 16.6 6.6 19.4 7.4 V16.4 C16.6 15.6 13.8 16.2 12 17.6 C10.2 16.2 7.4 15.6 4.6 16.4 Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path d="M12 8.6 V17.6 M8.6 19.8 H15.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <g className="sc-academy-pulse-layer sc-research-pulse-layer">
        {mode === "studying" ? (
          /* Lit scholar lamp flame above the codex */
          <path
            d="M12 2.6 C13.6 4.4 13.8 6 12 7 C10.2 6 10.4 4.4 12 2.6 Z"
            fill="currentColor"
          />
        ) : mode === "mastered" ? (
          /* Mastered 4-point celestial star */
          <path d="M12 2.4 V6.6 M9.9 4.5 H14.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        ) : (
          <circle cx="12" cy="4.6" r="1.2" fill="currentColor" />
        )}
      </g>
    </>
  );
}

/**
 * Living 15x15 lectern emblem & status strip rendered directly beneath the
 * Academy Lectern summary paragraph inside `ResearchBar`.
 */
export function AcademyLecternLivingGlyph(props: {
  activeName?: string;
  knownCount: number;
  totalCount: number;
  academyCount: number;
}) {
  const { mode, flair } = resolveAcademyLecternLiving(props);
  return (
    <span
      className={`sc-academy-lectern-glyph mode-${mode}`}
      aria-hidden="true"
      data-lectern-mode={mode}
    >
      <svg viewBox="0 0 24 24" className="sc-academy-lectern-icon" focusable="false">
        <LecternEmblemSvg mode={mode} />
      </svg>
      <span className="sc-academy-lectern-flair">{flair}</span>
    </span>
  );
}

/**
 * Corner-confined 30x30 ambient research topic watermark inside `.sc-study-living-card`.
 * Strictly pointer-events: none so Study / Cancel buttons are never blocked.
 */
export function StudyLivingUnderlay(props: {
  topicId: string;
  status: StudyStatus;
  academyFast?: boolean;
}) {
  const { topicId, discipline, status, academyFast } = resolveStudyLiving(props);
  const isTier2 = isTierTwoStudy(topicId);
  return (
    <span
      className={`sc-academy-living-underlay sc-research-living-underlay discipline-${discipline} status-${status}${academyFast ? " is-fast" : ""}${isTier2 ? " is-tier-2" : ""}`}
      aria-hidden="true"
      data-study-watermark={topicId}
      data-study-discipline={discipline}
      data-study-tier={isTier2 ? "2" : "1"}
    >
      <svg viewBox="0 0 24 24" className="sc-academy-underlay-svg sc-research-underlay-svg" focusable="false">
        <TopicEmblemSvg topicId={topicId} discipline={discipline} />
      </svg>
    </span>
  );
}

/**
 * Living 14x14 research topic emblem & flair strip rendered directly beneath
 * `StudyLedger` on each study card in `ResearchBar`.
 */
export function StudyLivingGlyph(props: {
  topicId: string;
  status: StudyStatus;
  academyFast?: boolean;
}) {
  const { topicId, discipline, status, academyFast, flair } = resolveStudyLiving(props);
  const isTier2 = isTierTwoStudy(topicId);
  return (
    <span
      className={`sc-academy-topic-glyph sc-research-topic-glyph sc-research-living-glyph discipline-${discipline} status-${status}${academyFast ? " is-fast" : ""}${isTier2 ? " is-tier-2" : ""}`}
      aria-hidden="true"
      data-study-glyph={topicId}
      data-study-discipline={discipline}
      data-study-status={status}
      data-study-tier={isTier2 ? "2" : "1"}
    >
      <svg viewBox="0 0 24 24" className="sc-academy-glyph-icon sc-research-glyph-icon" focusable="false">
        <TopicEmblemSvg topicId={topicId} discipline={discipline} />
      </svg>
      <span className="sc-academy-glyph-flair sc-research-glyph-flair">{flair}</span>
    </span>
  );
}

export const ResearchLivingGlyph = StudyLivingGlyph;
export const ResearchLivingUnderlay = StudyLivingUnderlay;
export const ResearchTopicLivingGlyph = StudyLivingGlyph;
export const ResearchLecternLivingGlyph = AcademyLecternLivingGlyph;
export const resolveResearchLiving = resolveStudyLiving;
export const resolveResearchGlyphDescriptor = resolveStudyLiving;
export type ResearchLivingDescriptor = StudyLivingDescriptor;
export type ResearchDisciplineKind = ResearchDiscipline;
