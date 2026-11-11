import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, giftOffer } from "@second-crown/sim";
import { GiftLine, giftButtonLabel, giftLineText, giftLineTone, giftRefusal } from "./GiftLine";
import { RealmCard } from "./RealmCard";
import { WorldPanel } from "../WorldPanel";

const noop = () => undefined;

function stateWithGold(gold: string) {
  const s = createGameState({ seed: 1 });
  s.resources.gold = gold;
  return s;
}

describe("gift status line", () => {
  it("ready: cost, gain, ready", () => {
    const offer = giftOffer(stateWithGold("40"));
    expect(giftLineTone(offer)).toBe("ready");
    expect(giftLineText(offer)).toBe("Tribute: 15 gold for +12 opinion · ready");
    expect(giftButtonLabel(offer)).toBe("Gift 15 gold (+12 opinion)");
  });

  it("short: names the missing gold", () => {
    const offer = giftOffer(stateWithGold("9"));
    expect(giftLineTone(offer)).toBe("short");
    expect(giftLineText(offer)).toBe("Tribute: 15 gold for +12 opinion · short 6 gold");
    expect(giftRefusal(offer)).toBe("Need 15 gold.");
  });

  it("full standing and missing ruler have their own lines", () => {
    const base = giftOffer(stateWithGold("40"));
    const full = { ...base, ok: false, block: "at_cap" as const };
    expect(giftLineTone(full)).toBe("full");
    expect(giftLineText(full)).toContain("as high as it goes");
    const none = giftOffer(stateWithGold("40"), "nowhere");
    expect(giftLineTone(none)).toBe("off");
    expect(giftLineText(none)).toContain("no ruler");
  });

  it("button label follows the real gain (Court doctrine)", () => {
    const s = stateWithGold("40");
    s.flags.doctrine = "court";
    expect(giftButtonLabel(giftOffer(s))).toBe("Gift 15 gold (+17 opinion)");
  });

  it("renders a toned line", () => {
    const html = renderToStaticMarkup(<GiftLine offer={giftOffer(stateWithGold("0"))} />);
    expect(html).toContain("sc-gift-line is-short");
    expect(html).toContain("short 15 gold");
  });
});

describe("gift on diplomacy cards", () => {
  it("RealmCard: status line sits before the buttons; Declare war stays", () => {
    const s = stateWithGold("40");
    const realm = s.realms.find((r) => r.id === "rival")!;
    const html = renderToStaticMarkup(
      <RealmCard realm={realm} stance="wary" peaceLeft={0} opinion={0} mine={20} theirs={20} declareLocked={false} onDeclare={noop} onGift={noop} gift={giftOffer(s, realm.id)} />,
    );
    const at = ["sc-gift-line is-ready", "Declare war", "Gift 15 gold (+12 opinion)"].map((k) => html.indexOf(k));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at[0] < at[1] && at[1] < at[2]).toBe(true);
    expect(html).not.toMatch(/sc-gift-btn"[^>]*disabled/);
  });

  it("RealmCard: Gift button is disabled when gold is short", () => {
    const s = stateWithGold("0");
    const realm = s.realms.find((r) => r.id === "rival")!;
    const html = renderToStaticMarkup(
      <RealmCard realm={realm} stance="wary" peaceLeft={0} opinion={0} mine={20} theirs={20} declareLocked={false} onDeclare={noop} onGift={noop} gift={giftOffer(s, realm.id)} />,
    );
    expect(html).toMatch(/<button[^>]*sc-gift-btn[^>]*disabled/);
  });

  it("WorldPanel: every crown card shows the line with onGift, none without", () => {
    const s = stateWithGold("40");
    const crowns = s.realms.filter((r) => r.id !== "player").length;
    const withGift = renderToStaticMarkup(<WorldPanel state={s} onFoundGuild={noop} onJoin={noop} onLeave={noop} onGift={noop} />);
    expect(withGift.split("sc-gift-line is-").length - 1).toBe(crowns);
    expect(withGift).toContain("Send 15 Gold Tribute to");
    const spectator = renderToStaticMarkup(<WorldPanel state={s} onFoundGuild={noop} onJoin={noop} onLeave={noop} />);
    expect(spectator).not.toContain("sc-gift-line");
  });

  it("gift-line.css is scoped and theme.css is not involved", () => {
    const proc = (globalThis as {
      process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
    }).process;
    const fsMod = proc?.getBuiltinModule?.("node:fs");
    if (!fsMod) throw new Error("node:fs unavailable in test runner");
    const css = fsMod.readFileSync(new URL("./gift-line.css", import.meta.url), "utf8");
    const selectors = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]+(?=\{)/g) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) expect(sel).toMatch(/sc-gift-/);
  });
});
