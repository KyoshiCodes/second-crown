import React from "react";
import type { GameState } from "@second-crown/sim";
import "./gift-pip.css";

export type GiftStatus = "available" | "just-sent" | "unaffordable";

export const GIFT_GOLD_COST = 15;
export const GIFT_JUST_SENT_TICKS = 40; // 4 seconds at 10 Hz

/**
 * Checks whether the player currently holds enough gold to send tribute.
 */
export function isGiftAvailable(state?: GameState, cost = GIFT_GOLD_COST): boolean {
  if (!state?.resources) return false;
  const gold = Number(state.resources.gold ?? 0);
  return gold >= cost;
}

/**
 * Returns how many ticks ago a tribute gift was sent to a specific realm,
 * or null if no gift was sent within windowTicks.
 */
export function giftJustSentTicksAgo(
  state?: GameState,
  realmId = "rival",
  windowTicks = GIFT_JUST_SENT_TICKS,
): number | null {
  if (!state?.inputLog) return null;
  for (let i = state.inputLog.length - 1; i >= 0; i--) {
    const entry = state.inputLog[i];
    if (entry.type === "gift") {
      const target = (entry.payload as { to?: string } | undefined)?.to ?? "rival";
      if (target === realmId || (realmId === "rival" && !target)) {
        const diff = state.meta.tick - entry.tick;
        if (diff >= 0 && diff <= windowTicks) {
          return diff;
        }
        return null;
      }
    }
  }
  return null;
}

/**
 * Checks whether a tribute gift was sent to the given realm within the recent window.
 */
export function isGiftJustSent(
  state?: GameState,
  realmId = "rival",
  windowTicks = GIFT_JUST_SENT_TICKS,
): boolean {
  return giftJustSentTicksAgo(state, realmId, windowTicks) !== null;
}

/**
 * Resolves the gift/tribute status for a realm card:
 * - "just-sent": gift was recently sent to this realm
 * - "available": player has gold to send tribute
 * - "unaffordable": action exists but player lacks gold
 * - null: realm cannot receive gifts
 */
export function resolveGiftStatus(options: {
  state?: GameState;
  realmId: string;
  hasGiftAction?: boolean;
  giftAvailable?: boolean;
  giftJustSent?: boolean;
  cost?: number;
}): GiftStatus | null {
  const {
    state,
    realmId,
    hasGiftAction = true,
    giftAvailable,
    giftJustSent,
    cost = GIFT_GOLD_COST,
  } = options;

  if (giftJustSent || (state && isGiftJustSent(state, realmId))) {
    return "just-sent";
  }

  if (!hasGiftAction) return null;

  const available = giftAvailable !== undefined ? giftAvailable : isGiftAvailable(state, cost);
  return available ? "available" : "unaffordable";
}

export interface GiftPipProps {
  /** Current state: "available" (ready to send), "just-sent" (recently dispatched), or "unaffordable" */
  status?: GiftStatus;
  /** Size in pixels (default: 24) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Living Gift or Tribute Pip:
 * - Depicts an ornate gilded diplomatic tribute coffer.
 * - When available: breathes with a warm golden amber aura glow and coin clasp glint.
 * - When just sent: displays an expanding golden celebration ping shockwave and rising motes.
 * - Strictly pointer-events: none so card clicks and button interactions are never blocked.
 */
export function GiftPip({
  status = "available",
  size = 24,
  className = "",
  style,
  title,
}: GiftPipProps) {
  const isAvailable = status === "available";
  const isJustSent = status === "just-sent";
  const isUnaffordable = status === "unaffordable";

  const defaultTitle = isJustSent
    ? "Tribute dispatched!"
    : isAvailable
      ? "Tribute ready (15 gold)"
      : "15 gold needed for tribute";

  return (
    <span
      className={`sc-gift-pip-wrapper is-${status} ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        pointerEvents: "none",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
      data-gift-pip="true"
      data-gift-status={status}
      title={title ?? defaultTitle}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="sc-gift-pip-svg"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        {/* Layer 1: Ambient golden aura glow */}
        <circle
          className="sc-gift-glow-layer"
          cx="12"
          cy="13"
          r="8"
          fill="currentColor"
        />

        {/* Layer 2: Expanding celebration ripple shockwave when just sent */}
        {isJustSent && (
          <circle
            className="sc-gift-sent-ping"
            cx="12"
            cy="13"
            r="8.5"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.2"
          />
        )}

        {/* Layer 3: Rising sparkle/coin motes */}
        <g className="sc-gift-drift-layer">
          {/* Left coin sparkle */}
          <path
            className="sc-gift-sparkle sc-gift-sparkle-1"
            d="M5.5 6 L6 7.5 L7.5 8 L6 8.5 L5.5 10 L5 8.5 L3.5 8 L5 7.5 Z"
            fill="currentColor"
          />
          {/* Right coin sparkle */}
          <path
            className="sc-gift-sparkle sc-gift-sparkle-2"
            d="M18.5 5 L19 6.2 L20.2 6.7 L19 7.2 L18.5 8.4 L18 7.2 L16.8 6.7 L18 6.2 Z"
            fill="currentColor"
          />
          {/* Ascending tribute dust */}
          {isJustSent && (
            <>
              <circle className="sc-gift-mote sc-gift-mote-1" cx="9.5" cy="5" r="0.9" fill="currentColor" />
              <circle className="sc-gift-mote sc-gift-mote-2" cx="14.5" cy="4" r="1.1" fill="currentColor" />
              <circle className="sc-gift-mote sc-gift-mote-3" cx="12" cy="2.5" r="0.8" fill="currentColor" />
            </>
          )}
        </g>

        {/* Layer 4: Gilded diplomatic tribute coffer geometry */}
        <g className="sc-gift-chest-base">
          {/* Coffer casket body */}
          <path
            className="sc-gift-chest-body"
            d="M4.5 11.5 L5.5 19 C5.5 19.8 7 20.5 12 20.5 C17 20.5 18.5 19.8 18.5 19 L19.5 11.5 Z"
            fill="currentColor"
            fillOpacity="0.45"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Arched domed lid */}
          <path
            className="sc-gift-chest-lid"
            d="M4 9.5 C4 7 8 5.5 12 5.5 C16 5.5 20 7 20 9.5 L20 11.5 C16 9.8 8 9.8 4 11.5 Z"
            fill="currentColor"
            fillOpacity="0.6"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Lid rim / coin lip accent */}
          <path
            className="sc-gift-lid-rim"
            d="M4 11.5 C8 9.8 16 9.8 20 11.5"
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />

          {/* Reinforced gilded iron straps */}
          <path
            className="sc-gift-straps"
            d="M8.5 7 L9 20 M15.5 7 L15 20"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Gilded lock clasp & seal flap */}
          <rect
            className="sc-gift-clasp-plate"
            x="10.2"
            y="9.8"
            width="3.6"
            height="3.6"
            rx="0.6"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          {/* Keyhole slot */}
          <path
            className="sc-gift-keyhole"
            d="M12 10.8 V12.2"
            stroke="#1c1917"
            strokeWidth="0.8"
            strokeLinecap="round"
          />

          {/* Hanging ribbon / royal seal swallowtail */}
          <path
            className="sc-gift-ribbon"
            d="M10.8 13.4 L10.2 16 L12 14.8 L13.8 16 L13.2 13.4"
            fill="currentColor"
            opacity="0.75"
          />
        </g>

        {/* Layer 5: Brilliant 4-point royal star glint on the clasp */}
        <g className="sc-gift-pulse-layer">
          <path
            className="sc-gift-glint-star"
            d="M12 8.5 L12.5 10.5 L14.5 11 L12.5 11.5 L12 13.5 L11.5 11.5 L9.5 11 L11.5 10.5 Z"
            fill="#ffffff"
          />
        </g>
      </svg>
    </span>
  );
}

export const TributePip = GiftPip;
