import React from "react";
import type { GiftOffer } from "@second-crown/sim";
import "./gift-line.css";

/**
 * Tribute status line for Diplomacy cards. Display only: every number comes
 * from the sim's giftOffer (cost, gain, gold still missing, standing cap).
 */

export type GiftLineTone = "ready" | "short" | "full" | "off";

export function giftLineTone(offer: GiftOffer): GiftLineTone {
  if (offer.ok) return "ready";
  if (offer.block === "no_gold") return "short";
  if (offer.block === "at_cap") return "full";
  return "off";
}

/** One short sentence: what a gift costs and earns, or why it cannot be sent. */
export function giftLineText(offer: GiftOffer): string {
  if (offer.block === "no_ruler") return "Tribute: no ruler to receive it";
  if (offer.block === "at_cap") return "Tribute: standing is as high as it goes";
  const deal = `Tribute: ${offer.cost} gold for +${offer.gain} opinion`;
  if (offer.block === "no_gold") return `${deal} · short ${offer.short} gold`;
  return `${deal} · ready`;
}

/** Message for the action log when a gift is refused. */
export function giftRefusal(offer: GiftOffer): string {
  if (offer.block === "at_cap") return "Their opinion of you is already as high as it goes.";
  if (offer.block === "no_ruler") return "No ruler to receive a gift.";
  return `Need ${offer.cost} gold.`;
}

export function giftButtonLabel(offer: GiftOffer): string {
  return `Gift ${offer.cost} gold (+${offer.gain} opinion)`;
}

export function GiftLine(props: { offer: GiftOffer }) {
  const tone = giftLineTone(props.offer);
  return (
    <span className={`sc-gift-line is-${tone}`} data-gift={tone}>
      <span className="sc-gift-line-dot" aria-hidden="true" />
      {giftLineText(props.offer)}
    </span>
  );
}
