import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import {
  RealmLivingGlyph,
  RealmLivingUnderlay,
  PactLivingGlyph,
  PactLivingUnderlay,
  resolveRealmLiving,
  resolvePactLiving,
} from "./DiploLivingGlyph";
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

function inOrder(html: string, keys: string[]): boolean {
  const idx = keys.map((k) => html.indexOf(k));
  return idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]);
}

const noop = () => undefined;

describe("DiploLivingGlyph pure helpers", () => {
  it("resolves realm living descriptors across stances with appropriate flairs", () => {
    const war = resolveRealmLiving({
      realmId: "rival",
      stance: "war",
      matchup: { mine: 40, theirs: 15 },
    });
    expect(war.realmId).toBe("rival");
    expect(war.stance).toBe("war");
    expect(war.chargeName).toBe("Crossed Greatswords & Iron Keep");
    expect(war.flair).toContain("war match-up 40 vs 15");

    const truce = resolveRealmLiving({
      realmId: "k_frost",
      stance: "truce",
      peaceLeft: 250,
      opinion: 10,
    });
    expect(truce.flair).toContain("Truce in force");
    expect(truce.flair).toContain("25s of peace remain");

    const friendly = resolveRealmLiving({
      realmId: "k_silk",
      stance: "friendly",
      opinion: 35,
    });
    expect(friendly.flair).toContain("Warm ally · opinion +35");

    const hostile = resolveRealmLiving({
      realmId: "k_ember",
      stance: "hostile",
      opinion: -30,
    });
    expect(hostile.flair).toContain("Cold enmity · opinion -30");

    const wary = resolveRealmLiving({
      realmId: "k_glass",
      stance: "wary",
      opinion: 5,
      power: 28,
      scouted: true,
    });
    expect(wary.flair).toContain("Guarded borders · power 28 · opinion 5");
  });

  it("resolves pact living descriptors across membership, leadership, and cold states", () => {
    const lead = resolvePactLiving({
      kind: "guild",
      faction: { id: "guild_1", name: "Artisan League", kind: "guild", stance: 20, memberRealmIds: ["player", "k_silk"], leaderRealmId: "player" },
      isMember: true,
    });
    expect(lead.kind).toBe("guild");
    expect(lead.leadsIt).toBe(true);
    expect(lead.flair).toContain("Crown sovereign · leading 2 sworn members");

    const member = resolvePactLiving({
      kind: "order",
      faction: { id: "order_1", name: "Amber Order", kind: "order", stance: 15, memberRealmIds: ["rival", "player"] },
      isMember: true,
    });
    expect(member.isMember).toBe(true);
    expect(member.flair).toContain("Sworn member · 2 crowns bound");

    const cold = resolvePactLiving({
      kind: "pact",
      faction: { id: "pact_1", name: "Salt Compact", kind: "pact", stance: -15, memberRealmIds: ["k_frost"] },
      isMember: false,
    });
    expect(cold.cold).toBe(true);
    expect(cold.flair).toContain("Covenant warded · stance -15");

    const open = resolvePactLiving({
      kind: "order",
      faction: { id: "order_2", name: "Sun Order", kind: "order", stance: 0, memberRealmIds: ["k_veil", "k_glass"] },
      isMember: false,
    });
    expect(open.flair).toContain("Open covenant · 2 crowns sworn");
  });
});

describe("DiploLivingGlyph markup & visual stack order", () => {
  it("renders realm underlay watermark and living crest strip with proper data attributes", () => {
    const underlayHtml = renderToStaticMarkup(
      <RealmLivingUnderlay realmId="rival" stance="war" />,
    );
    expect(underlayHtml).toContain('aria-hidden="true"');
    expect(underlayHtml).toContain("sc-diplo-living-underlay");
    expect(underlayHtml).toContain("realm-rival");
    expect(underlayHtml).toContain("stance-war");
    expect(underlayHtml).toContain("sc-diplo-underlay-svg");

    const glyphHtml = renderToStaticMarkup(
      <RealmLivingGlyph realmId="k_silk" stance="friendly" opinion={40} />,
    );
    expect(glyphHtml).toContain('aria-hidden="true"');
    expect(glyphHtml).toContain("sc-diplo-crest-glyph");
    expect(glyphHtml).toContain("realm-k_silk");
    expect(glyphHtml).toContain("stance-friendly");
    expect(glyphHtml).toContain("Warm ally · opinion +40");
  });

  it("renders pact underlay watermark and living seal strip", () => {
    const underlayHtml = renderToStaticMarkup(
      <PactLivingUnderlay kind="order" isMember={true} />,
    );
    expect(underlayHtml).toContain('aria-hidden="true"');
    expect(underlayHtml).toContain("sc-diplo-living-underlay");
    expect(underlayHtml).toContain("pact-order");
    expect(underlayHtml).toContain("pact-member");

    const glyphHtml = renderToStaticMarkup(
      <PactLivingGlyph kind="pact" faction={{ id: "p1", name: "Salt Pact", kind: "pact", stance: 5, memberRealmIds: ["k_tide"] }} isMember={false} />,
    );
    expect(glyphHtml).toContain('aria-hidden="true"');
    expect(glyphHtml).toContain("sc-diplo-crest-glyph");
    expect(glyphHtml).toContain("pact-pact");
    expect(glyphHtml).toContain("Open covenant · 1 crowns sworn");
  });

  it("RealmCard mounts underlay, ledger, living glyph, and actions in order", () => {
    const state = createGameState({ seed: 42 });
    const rival = state.realms.find((r) => r.id === "rival")!;
    const html = renderToStaticMarkup(
      <RealmCard
        realm={rival}
        stance="wary"
        peaceLeft={0}
        opinion={0}
        mine={50}
        theirs={20}
        declareLocked={false}
        onDeclare={noop}
      />,
    );
    expect(
      inOrder(html, [
        "sc-diplo-living-underlay",
        "sc-diplo-living-head",
        rival.name,
        "sc-diplo-crest-glyph",
        "sc-realm-dip-actions",
        "Declare war",
      ]),
    ).toBe(true);
  });

  it("WorldPanel mounts living underlays and glyphs on both Known Crowns and Factions", () => {
    const state = createGameState({ seed: 42 });
    const html = renderToStaticMarkup(
      <WorldPanel state={state} onFoundGuild={noop} onJoin={noop} onLeave={noop} />,
    );
    expect(html).toContain("sc-diplo-living-underlay");
    expect(html).toContain("sc-diplo-crest-glyph");
    expect(html).toContain("data-realm-watermark");
  });
});

describe("diplo-glyph-living.css contract & contrast safety", () => {
  it("keeps styles isolated without modifying theme.css", () => {
    const css = readCssFile("./diplo-glyph-living.css");
    expect(css).toContain(".sc-realm-dip.is-living");
    expect(css).toContain(".sc-faction-card.is-living");
    expect(css).toContain(".sc-diplo-living-underlay");
    expect(css).toContain(".sc-diplo-crest-glyph");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("strictly enforces pointer-events: none on all decorative layers", () => {
    const css = readCssFile("./diplo-glyph-living.css");
    expect(css).toContain("pointer-events: none !important;");
  });

  it("keeps watermark underlay opacity strictly low (<= 0.25) so diplo text is never obscured", () => {
    const css = readCssFile("./diplo-glyph-living.css");
    const matches = Array.from(css.matchAll(/\.sc-diplo-living-underlay(?:\.[a-z-]+)*\s*\{[^}]*?opacity:\s*([0-9.]+)/gs));
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      const opacity = parseFloat(match[1]);
      expect(opacity).toBeLessThanOrEqual(0.25);
    }
  });
});
