import React from "react";
import type { HoldView } from "../net/hold";
import "./hold-living.css";

/**
 * Living hold glyphs under the joined hold status cards (works, stores, stamps, key).
 * Purely decorative display layer: reads HoldView + key UI state without sim calls or new math,
 * never repeats the secret hold key, and enforces pointer-events: none across all layers.
 */

export type HoldLivingDomain = "works" | "stores" | "stamps" | "key";

export type HoldLivingState = "busy" | "warn" | "active" | "calm";

export interface HoldLivingItem {
  domain: HoldLivingDomain;
  state: HoldLivingState;
  flair: string;
}

export interface HoldLivingInput {
  view: HoldView;
  madeKey: string | null;
  copied: boolean;
}

const STORE_KEYS = ["food", "wood", "stone", "gold"] as const;

/** Pure resolver for the four living hold domains in deterministic order. */
export function resolveHoldLivingItems(input: HoldLivingInput): HoldLivingItem[] {
  const { view, madeKey, copied } = input;

  // 1. Works: training pulses briskly; standing works glow/drift; empty yards rest calm.
  const totalWorks = view.militia + view.farms + view.cottages + view.lumberCamps;
  const worksItem: HoldLivingItem =
    view.training > 0
      ? { domain: "works", state: "busy", flair: `Drilling +${view.training}` }
      : totalWorks > 0
        ? { domain: "works", state: "active", flair: "Yards active" }
        : { domain: "works", state: "calm", flair: "Yards quiet" };

  // 2. Stores: stocked when at least 1 whole unit sits in any vault; calm when bare.
  const stockedCount = STORE_KEYS.filter((k) => Number(view.stores[k]) >= 1).length;
  const storesItem: HoldLivingItem =
    stockedCount > 0
      ? { domain: "stores", state: "active", flair: `${stockedCount}/4 stocked` }
      : { domain: "stores", state: "calm", flair: "Vaults bare" };

  // 3. Stamps: royal wax signet glows when stamped; calm when unstamped.
  const stampCount = view.stamps.length;
  const stampsItem: HoldLivingItem =
    stampCount > 0
      ? { domain: "stamps", state: "active", flair: stampCount === 1 ? "1 stamped" : `${stampCount} stamped` }
      : { domain: "stamps", state: "calm", flair: "Unstamped" };

  // 4. Key: pulses amber while a one-time key awaits copying; never repeats madeKey text.
  const keyItem: HoldLivingItem =
    madeKey !== null && !copied
      ? { domain: "key", state: "warn", flair: "Copy key" }
      : madeKey !== null && copied
        ? { domain: "key", state: "active", flair: "Key copied" }
        : { domain: "key", state: "calm", flair: "Key warded" };

  return [worksItem, storesItem, stampsItem, keyItem];
}

function DomainBadgeSvg({ domain }: { domain: HoldLivingDomain }) {
  switch (domain) {
    case "works":
      return (
        <svg className="sc-hold-living-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle className="sc-hold-living-glow" cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.2" />
          <g className="sc-hold-living-pulse">
            <path
              d="M4.2 12.2L10.8 5.6M9.2 3.6L12.4 6.8L11.1 8.1L7.9 4.9L9.2 3.6Z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g className="sc-hold-living-drift">
            <path
              d="M4.6 3.8L7.1 6.3M3.6 5.2L5.8 3.2"
              stroke="currentColor"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            <circle cx="12.1" cy="11.6" r="1" fill="currentColor" fillOpacity="0.85" />
          </g>
        </svg>
      );
    case "stores":
      return (
        <svg className="sc-hold-living-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle className="sc-hold-living-glow" cx="8" cy="8.5" r="5.8" fill="currentColor" fillOpacity="0.18" />
          <g className="sc-hold-living-pulse">
            <rect x="3" y="6.5" width="10" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
            <path d="M2.6 6.5H13.4M8 6.5V12.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </g>
          <g className="sc-hold-living-drift">
            <path d="M5.5 4.6C6.4 3.4 7.5 3.2 8 4.4C8.5 3.2 9.6 3.4 10.5 4.6" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
            <circle cx="8" cy="8.8" r="1.05" fill="currentColor" />
          </g>
        </svg>
      );
    case "stamps":
      return (
        <svg className="sc-hold-living-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle className="sc-hold-living-glow" cx="8" cy="7.6" r="5.8" fill="currentColor" fillOpacity="0.2" />
          <g className="sc-hold-living-pulse">
            <circle cx="8" cy="7.4" r="4.3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.14" />
            <path d="M6.1 8.2L6.6 5.9L8 7.1L9.4 5.9L9.9 8.2H6.1Z" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" />
          </g>
          <g className="sc-hold-living-drift">
            <path d="M6.3 11.4L5.3 13.8L7.4 12.8M9.7 11.4L10.7 13.8L8.6 12.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "key":
      return (
        <svg className="sc-hold-living-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle className="sc-hold-living-glow" cx="8" cy="8" r="5.8" fill="currentColor" fillOpacity="0.2" />
          <g className="sc-hold-living-pulse">
            <circle cx="5.6" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" fill="currentColor" fillOpacity="0.14" />
            <circle cx="5.6" cy="8" r="0.85" fill="currentColor" />
          </g>
          <g className="sc-hold-living-drift">
            <path d="M8.1 8H13.2M11.1 8V10.1M12.8 8V10.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </g>
        </svg>
      );
  }
}

function WatermarkMotif({ domain, variant }: { domain: HoldLivingDomain; variant?: string }) {
  if (domain === "works") {
    switch (variant) {
      case "militia":
        return (
          <>
            <path d="M7 19L18 6M15.2 6H18V8.8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.5 11.5C15.5 11.5 18.5 13 18.5 16.5C18.5 19.2 15.8 20.8 13.8 21.5C11.8 20.8 9.2 19.2 9.2 16.5C9.2 13 11.2 11.5 12.5 11.5Z" stroke="currentColor" strokeWidth="1.2" />
          </>
        );
      case "farms":
        return (
          <>
            <path d="M14 21V9M14 12C11.5 11.5 10.5 9.8 11 8C12.8 8.5 13.8 10 14 12ZM14 15C16.5 14.5 17.5 12.8 17 11C15.2 11.5 14.2 13 14 15Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 20.5C10.5 19 16.5 19 21 20.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
          </>
        );
      case "cottages":
        return (
          <>
            <path d="M8 15L14.5 9.5L21 15M10 14V20.5H19V14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.2 20.5V16.8H15.8V20.5" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
          </>
        );
      default:
        return (
          <>
            <path d="M9 20L18.5 9.5M14.5 7.5L20.5 12.2L18.2 14.6L12.8 9.8L14.5 7.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="17.5" cy="18.5" r="2.2" stroke="currentColor" strokeWidth="1.15" />
          </>
        );
    }
  }

  if (domain === "stores") {
    switch (variant) {
      case "food":
        return (
          <>
            <path d="M14.5 21V8.5M11.5 11.5L14.5 8.5L17.5 11.5M11 15L14.5 12L18 15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case "wood":
        return (
          <>
            <path d="M8.5 18.5H19.5M9.8 15.2H18.8M11.2 12H17.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="19.5" cy="18.5" r="1.2" fill="currentColor" />
          </>
        );
      case "stone":
        return (
          <>
            <polygon points="9,19.5 11.5,13.5 17.5,12.5 20.5,17.5 18,20.5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M11.5 13.5L15 16.5L18 20.5" stroke="currentColor" strokeWidth="1.05" />
          </>
        );
      default:
        return (
          <>
            <circle cx="13.5" cy="16.5" r="3.6" stroke="currentColor" strokeWidth="1.25" />
            <circle cx="17.2" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.15" />
          </>
        );
    }
  }

  if (domain === "stamps") {
    return (
      <>
        <circle cx="15" cy="14.5" r="4.6" stroke="currentColor" strokeWidth="1.25" />
        <path d="M12.8 15.3L13.4 12.8L15 14.1L16.6 12.8L17.2 15.3H12.8Z" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" />
        <path d="M13 18.8L11.8 21.5M17 18.8L18.2 21.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </>
    );
  }

  return (
    <>
      <circle cx="11.5" cy="15.5" r="3" stroke="currentColor" strokeWidth="1.25" />
      <path d="M14.5 15.5H20.8M18.2 15.5V18M20.2 15.5V18.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </>
  );
}

/** Living 4-domain glyph strip mounted directly under HoldStatusStack. */
export function HoldLivingStrip(props: HoldLivingInput) {
  const items = resolveHoldLivingItems(props);
  return (
    <span className="sc-hold-living-strip" aria-hidden="true" data-hold-living-strip="true">
      {items.map((item) => (
        <span
          key={item.domain}
          className={`sc-hold-living-item domain-${item.domain} state-${item.state}`}
          data-hold-domain={item.domain}
          data-hold-state={item.state}
        >
          <span className="sc-hold-living-badge">
            <DomainBadgeSvg domain={item.domain} />
          </span>
          <span className="sc-hold-living-flair">{item.flair}</span>
        </span>
      ))}
    </span>
  );
}

/** Corner-confined decorative watermark placed at the end of a hold work, store, stamp, or key card. */
export function HoldCardUnderlay({
  domain,
  variant,
  state = "active",
}: {
  domain: HoldLivingDomain;
  variant?: string;
  state?: HoldLivingState;
}) {
  return (
    <span
      className={`sc-hold-living-underlay domain-${domain} state-${state}`}
      aria-hidden="true"
      data-hold-underlay={domain}
      data-hold-variant={variant}
    >
      <svg className="sc-hold-living-watermark" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <WatermarkMotif domain={domain} variant={variant} />
      </svg>
    </span>
  );
}
