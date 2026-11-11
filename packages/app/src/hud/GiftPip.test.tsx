import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "@second-crown/sim";
import {
  GiftPip,
  TributePip,
  isGiftAvailable,
  isGiftJustSent,
  giftJustSentTicksAgo,
  resolveGiftStatus,
  GIFT_GOLD_COST,
  GIFT_JUST_SENT_TICKS,
} from "./GiftPip";
import { RealmCard } from "./RealmCard";
import { WorldPanel } from "../WorldPanel";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const noop = () => undefined;

describe("GiftPip pure helpers", () => {
  it("isGiftAvailable checks gold stores against cost (default 15)", () => {
    expect(isGiftAvailable(undefined)).toBe(false);

    const s = createGameState({ seed: 1 });
    s.resources.gold = "10";
    expect(isGiftAvailable(s)).toBe(false);

    s.resources.gold = "15";
    expect(isGiftAvailable(s)).toBe(true);

    s.resources.gold = "100";
    expect(isGiftAvailable(s)).toBe(true);
    expect(isGiftAvailable(s, 200)).toBe(false);
  });

  it("isGiftJustSent and giftJustSentTicksAgo inspect state.inputLog within window", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 100;

    expect(isGiftJustSent(s, "rival")).toBe(false);
    expect(giftJustSentTicksAgo(s, "rival")).toBeNull();

    // Add a gift record to rival at tick 85 (15 ticks ago, within 40 tick window)
    s.inputLog.push({
      tick: 85,
      type: "gift",
      payload: { amount: 15, to: "rival" },
      issuerId: "player",
    });

    expect(isGiftJustSent(s, "rival")).toBe(true);
    expect(giftJustSentTicksAgo(s, "rival")).toBe(15);
    // Different realm has no gift
    expect(isGiftJustSent(s, "k_silk")).toBe(false);

    // If tick advances past the window (tick 130 -> diff 45 > 40)
    s.meta.tick = 130;
    expect(isGiftJustSent(s, "rival")).toBe(false);
    expect(giftJustSentTicksAgo(s, "rival")).toBeNull();
  });

  it("resolveGiftStatus prioritizes just-sent over available over unaffordable", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 50;
    s.resources.gold = "20";

    // Available state
    expect(resolveGiftStatus({ state: s, realmId: "rival", hasGiftAction: true })).toBe("available");

    // Action disabled
    expect(resolveGiftStatus({ state: s, realmId: "rival", hasGiftAction: false })).toBeNull();

    // Gold < 15
    s.resources.gold = "5";
    expect(resolveGiftStatus({ state: s, realmId: "rival", hasGiftAction: true })).toBe("unaffordable");

    // Just sent takes priority even if gold is 0
    s.inputLog.push({
      tick: 48,
      type: "gift",
      payload: { amount: 15, to: "rival" },
      issuerId: "player",
    });
    expect(resolveGiftStatus({ state: s, realmId: "rival", hasGiftAction: true })).toBe("just-sent");
  });
});

describe("GiftPip rendering", () => {
  it("renders with default 24px size, aria-hidden, and pointer-events: none", () => {
    const html = renderToStaticMarkup(<GiftPip status="available" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events:none');
    expect(html).toContain('width:24px');
    expect(html).toContain('height:24px');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('data-gift-pip="true"');
    expect(html).toContain('data-gift-status="available"');
    expect(html).toContain("sc-gift-chest-base");
    expect(html).toContain("sc-gift-glow-layer");
    expect(html).toContain("sc-gift-glint-star");
  });

  it("TributePip is an alias for GiftPip", () => {
    expect(TributePip).toBe(GiftPip);
  });

  it("renders distinct layers for just-sent celebration state", () => {
    const html = renderToStaticMarkup(<GiftPip status="just-sent" size={28} />);
    expect(html).toContain("is-just-sent");
    expect(html).toContain("sc-gift-sent-ping");
    expect(html).toContain("sc-gift-mote");
    expect(html).toContain('title="Tribute dispatched!"');
  });

  it("renders dimmed unaffordable state", () => {
    const html = renderToStaticMarkup(<GiftPip status="unaffordable" size={16} />);
    expect(html).toContain("is-unaffordable");
    expect(html).toContain('data-gift-status="unaffordable"');
  });
});

describe("RealmCard diplomacy integration", () => {
  it("renders living gift badge when a gift is available", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "50";
    const rival = s.realms.find((r) => r.id === "rival")!;

    const html = renderToStaticMarkup(
      <RealmCard
        state={s}
        realm={rival}
        stance="wary"
        peaceLeft={0}
        opinion={0}
        mine={20}
        theirs={20}
        declareLocked={false}
        onDeclare={noop}
        onGift={noop}
      />,
    );

    expect(html).toContain("sc-realm-gift-badge");
    expect(html).toContain('data-realm-gift="rival"');
    expect(html).toContain('data-gift-status="available"');
    expect(html).toContain("sc-realm-gift-btn");
    expect(html).toContain("is-available");
  });

  it("renders living celebration gift badge when a gift was just sent", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 80;
    s.resources.gold = "0"; // no gold, but just sent
    s.inputLog.push({
      tick: 78,
      type: "gift",
      payload: { amount: 15, to: "rival" },
      issuerId: "player",
    });

    const rival = s.realms.find((r) => r.id === "rival")!;

    const html = renderToStaticMarkup(
      <RealmCard
        state={s}
        realm={rival}
        stance="friendly"
        peaceLeft={0}
        opinion={12}
        mine={20}
        theirs={20}
        declareLocked={false}
        onDeclare={noop}
        onGift={noop}
      />,
    );

    expect(html).toContain("sc-realm-gift-badge");
    expect(html).toContain('data-gift-status="just-sent"');
    expect(html).toContain("sc-gift-sent-ping");
    expect(html).toContain("is-gift-just-sent");
  });

  it("does not render corner badge when gold is insufficient and no recent gift", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "5"; // < 15 gold
    const rival = s.realms.find((r) => r.id === "rival")!;

    const html = renderToStaticMarkup(
      <RealmCard
        state={s}
        realm={rival}
        stance="wary"
        peaceLeft={0}
        opinion={0}
        mine={20}
        theirs={20}
        declareLocked={false}
        onDeclare={noop}
        onGift={noop}
      />,
    );

    expect(html).not.toContain("sc-realm-gift-badge");
    // Button still renders dimmed unaffordable pip
    expect(html).toContain("sc-realm-gift-btn");
    expect(html).toContain("is-unaffordable");
  });
});

describe("WorldPanel integration", () => {
  it("renders living gift badge on Known Crowns when onGift and gold are available", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "30";

    const html = renderToStaticMarkup(
      <WorldPanel
        state={s}
        onFoundGuild={noop}
        onJoin={noop}
        onLeave={noop}
        onGift={noop}
      />,
    );

    expect(html).toContain("sc-realm-gift-badge");
    expect(html).toContain("sc-realm-gift-btn");
    expect(html).toContain("is-available");
  });
});

describe("CSS safety and motion accessibility", () => {
  it("gift-pip.css enforces pointer-events: none and respects reduced motion", () => {
    const css = readCssFile("./gift-pip.css");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("sc-gift-glow-breathe");
    expect(css).toContain("sc-gift-sent-ping");
    expect(css).toContain("sc-gift-motes-drift");
    expect(css).toContain("sc-gift-glint-flare");

    // Must not touch theme.css
    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-gift-pip");
    expect(themeCss).not.toContain("sc-realm-gift-badge");
  });
});
