import React from "react";
import "./people-living.css";

/**
 * Living walker & idle-pose glyphs under People/Job cards (JobCard).
 * Purely decorative display layer: reads role, idle flag, worker count, walk-to site count,
 * and post count already computed on JobCard. No sim mutations or new game math.
 */

export type PeopleCraft =
  | "farmer"
  | "woodcutter"
  | "miner"
  | "merchant"
  | "guard"
  | "scholar"
  | "idle";

export type PeoplePose = "walking" | "idle";

export type PeopleLivingState = "striding" | "waiting" | "calm";

export interface PeopleLivingInput {
  role: string;
  idle: boolean;
  count: number;
  siteCount: number;
  postCount: number;
}

export interface PeopleLivingDescriptor {
  craft: PeopleCraft;
  pose: PeoplePose;
  state: PeopleLivingState;
  flair: string;
}

const CRAFT_STRIDE_FLAIR: Record<Exclude<PeopleCraft, "idle">, string> = {
  farmer: "Furrows · striding",
  woodcutter: "Timber · striding",
  miner: "Delving · striding",
  merchant: "Stalls · striding",
  guard: "Walls · patrolling",
  scholar: "Sanctum · studying",
};

/** Maps a citizen job/role identifier to its living walker craft or idle pose. */
export function getPeopleCraft(role: string, idle: boolean): PeopleCraft {
  const norm = role.trim().toLowerCase();
  if (idle || norm === "idle" || norm === "unassigned" || norm === "villager") {
    return "idle";
  }
  switch (norm) {
    case "farmer":
    case "farm":
      return "farmer";
    case "woodcutter":
    case "wood":
      return "woodcutter";
    case "miner":
    case "stone":
      return "miner";
    case "merchant":
    case "market":
    case "gold":
      return "merchant";
    case "guard":
      return "guard";
    case "scholar":
      return "scholar";
    default:
      return "farmer";
  }
}

/** Pure resolver for a People/Job card's living walker or idle-pose glyph state. */
export function resolvePeopleLiving(input: PeopleLivingInput): PeopleLivingDescriptor {
  const { role, idle, count, siteCount, postCount } = input;
  const craft = getPeopleCraft(role, idle);

  if (craft === "idle") {
    if (count > 0 && postCount > 0) {
      return { craft: "idle", pose: "idle", state: "waiting", flair: "Resting · posts open" };
    }
    if (postCount === 0) {
      return { craft: "idle", pose: "idle", state: "calm", flair: "Resting · no hall yet" };
    }
    return { craft: "idle", pose: "idle", state: "calm", flair: "Bench empty" };
  }

  if (count > 0 && siteCount > 0) {
    return {
      craft,
      pose: "walking",
      state: "striding",
      flair: CRAFT_STRIDE_FLAIR[craft],
    };
  }

  return {
    craft,
    pose: "walking",
    state: "calm",
    flair: "Awaiting post",
  };
}

function CraftToolCharge({ craft }: { craft: Exclude<PeopleCraft, "idle"> }) {
  switch (craft) {
    case "farmer":
      return (
        <path
          d="M9.6 8.2L12.8 4.4M11.6 4.1L14.2 5.4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "woodcutter":
      return (
        <>
          <path d="M9.5 8.4L12.6 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M11.8 4.2L14.3 5.5L13.1 7.2Z" fill="currentColor" fillOpacity="0.8" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
        </>
      );
    case "miner":
      return (
        <>
          <path d="M9.5 8.4L12.4 4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10.6 4.1Q12.5 3.6 14.2 5.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    case "merchant":
      return (
        <>
          <circle cx="12.5" cy="6.2" r="1.9" stroke="currentColor" strokeWidth="1.15" fill="currentColor" fillOpacity="0.22" />
          <circle cx="12.5" cy="6.2" r="0.65" fill="currentColor" />
        </>
      );
    case "guard":
      return (
        <>
          <path d="M11.8 11.8V3.5M10.8 4.8L11.8 3.2L12.8 4.8" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "scholar":
      return (
        <>
          <rect x="10.6" y="4.8" width="3.2" height="3.8" rx="0.5" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.16" />
          <circle cx="13.2" cy="3.4" r="0.75" fill="currentColor" />
        </>
      );
  }
}

function LivingPoseSvg({ craft, pose }: { craft: PeopleCraft; pose: PeoplePose }) {
  if (pose === "idle" || craft === "idle") {
    return (
      <svg className="sc-people-living-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <ellipse className="sc-people-glow" cx="8" cy="12.6" rx="5.8" ry="2.2" fill="currentColor" fillOpacity="0.24" />
        {/* Timber bench + seated resting villager */}
        <g className="sc-people-idle-drift">
          <path d="M2.8 11.8H9.8M4 11.8V13.8M8.6 11.8V13.8" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
          <circle cx="6.1" cy="5.2" r="1.55" stroke="currentColor" strokeWidth="1.15" fill="currentColor" fillOpacity="0.18" />
          <path
            d="M5.7 6.9L5.4 10.2L8.4 10.5L8.9 13.4M5.6 8.4L8.1 9.1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Warm camp ember & resting mote */}
        <g className="sc-people-idle-pulse">
          <path d="M12.2 12.8C11.3 11.9 11.5 10.5 12.2 9.6C12.9 10.5 13.1 11.9 12.2 12.8Z" fill="currentColor" fillOpacity="0.78" />
          <circle cx="12.2" cy="7.6" r="0.75" fill="currentColor" fillOpacity="0.85" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="sc-people-living-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <ellipse className="sc-people-glow" cx="7.8" cy="13.2" rx="5.8" ry="2" fill="currentColor" fillOpacity="0.24" />
      {/* Striding walker silhouette + footpath */}
      <g className="sc-people-walker-drift">
        <path d="M2.2 13.8H5.2M6.8 13.8H10.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.65" />
        <circle cx="6.8" cy="4.4" r="1.55" stroke="currentColor" strokeWidth="1.15" fill="currentColor" fillOpacity="0.18" />
        <path
          d="M6.8 6.1L6.4 9.6M6.4 9.6L4.4 12.8M6.4 9.6L8.8 12.8M4.8 7.6L9.4 8.2"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* Pulsing craft tool / lantern */}
      <g className="sc-people-walker-pulse">
        <CraftToolCharge craft={craft} />
      </g>
    </svg>
  );
}

function WatermarkCraftMotif({ craft }: { craft: PeopleCraft }) {
  switch (craft) {
    case "idle":
      return (
        <>
          <path d="M7 20.5H17.5M9 20.5V23.2M15.5 20.5V23.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="11.5" cy="11.2" r="2.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M11.2 13.6L10.8 18.2L15 18.6L15.8 22.8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20.5 21.5C19.2 20 19.5 17.8 20.5 16.4C21.5 17.8 21.8 20 20.5 21.5Z" stroke="currentColor" strokeWidth="1.15" />
        </>
      );
    case "farmer":
      return (
        <>
          <path d="M10 22L18.5 9.5M16.2 8.8L21.2 11.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 22.5V14.5M12.2 17L14.5 14.5L16.8 17" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "woodcutter":
      return (
        <>
          <path d="M9.5 22L18 10.5M16.2 9.5L21 12.4L18.8 15.2Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 22.8L17.5 17.5L20.5 22.8H14.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </>
      );
    case "miner":
      return (
        <>
          <path d="M10.5 22L17.8 11.5M13.5 9.8Q17.8 8.8 21.2 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <polygon points="14.5,22.5 16.5,17.8 20.5,18.8 21.2,22.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </>
      );
    case "merchant":
      return (
        <>
          <circle cx="15.5" cy="17.5" r="4" stroke="currentColor" strokeWidth="1.25" />
          <circle cx="19.2" cy="13.8" r="3.2" stroke="currentColor" strokeWidth="1.15" />
          <path d="M9.5 22.2H21.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        </>
      );
    case "guard":
      return (
        <>
          <path d="M12.5 22.5V9.5M10.8 11.8L12.5 9L14.2 11.8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5 14.2C18.2 14.2 20.5 15.5 20.5 18.6C20.5 20.8 18.4 22.2 16.8 22.8C15.2 22.2 13.2 20.8 13.2 18.6" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        </>
      );
    case "scholar":
      return (
        <>
          <rect x="12" y="12.5" width="7.5" height="9.2" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M14.2 15.5H17.3M14.2 18H17.3" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          <circle cx="19.8" cy="10.2" r="1.2" fill="currentColor" />
        </>
      );
  }
}

/** Living walker / idle-pose strip rendered beneath JobStatusStack on a People card. */
export function PeopleLivingGlyph(props: PeopleLivingInput) {
  const desc = resolvePeopleLiving(props);
  return (
    <span
      className={`sc-people-living-glyph pose-${desc.pose} craft-${desc.craft} state-${desc.state}`}
      aria-hidden="true"
      data-people-pose={desc.pose}
      data-people-craft={desc.craft}
      data-people-state={desc.state}
    >
      <span className="sc-people-living-badge">
        <LivingPoseSvg craft={desc.craft} pose={desc.pose} />
      </span>
      <span className="sc-people-living-flair">{desc.flair}</span>
    </span>
  );
}

/** Corner-confined decorative walker/idle watermark placed inside a People/Job card. */
export function PeopleLivingUnderlay(props: PeopleLivingInput) {
  const desc = resolvePeopleLiving(props);
  return (
    <span
      className={`sc-people-living-underlay pose-${desc.pose} craft-${desc.craft} state-${desc.state}`}
      aria-hidden="true"
      data-people-underlay={desc.craft}
    >
      <svg className="sc-people-living-watermark" viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
        <WatermarkCraftMotif craft={desc.craft} />
      </svg>
    </span>
  );
}
