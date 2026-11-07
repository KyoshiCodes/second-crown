import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import {
  EventOmenLivingGlyph,
  EventOmenUnderlay,
  QuestScrollLivingGlyph,
  QuestScrollUnderlay,
  getQuestSealMotif,
  resolveOmenLiving,
  resolveScrollLiving,
} from "./EventsLivingGlyph";
import { EventCard } from "./EventCard";
import { QuestCard } from "./QuestCard";
import { EventPanel } from "../EventPanel";
import { QuestPanel } from "../QuestPanel";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("EventsLivingGlyph — living omen and scroll glyphs under EventCard and QuestCard", () => {
  it("resolves omen states and flairs across comet, raven, harvest, timber, spoil, and pending choices", () => {
    expect(resolveOmenLiving({ omen: "comet", eventId: "tribute", latest: true })).toEqual({
      omen: "comet",
      state: "latest",
      flair: "Comet omen · blazing sky",
    });
    expect(resolveOmenLiving({ omen: "comet", eventId: "tribute" })).toEqual({
      omen: "comet",
      state: "settled",
      flair: "Comet omen · foretold",
    });
    expect(resolveOmenLiving({ omen: "raven", eventId: "levy", latest: true })).toEqual({
      omen: "raven",
      state: "latest",
      flair: "Raven omen · wings aloft",
    });
    expect(resolveOmenLiving({ omen: "raven", eventId: "spoil" })).toEqual({
      omen: "raven",
      state: "loss",
      flair: "Raven portent · stores blighted",
    });
    expect(resolveOmenLiving({ omen: "harvest", eventId: "harvest", latest: true })).toEqual({
      omen: "harvest",
      state: "latest",
      flair: "Harvest omen · golden sheaf",
    });
    expect(resolveOmenLiving({ omen: "harvest", eventId: "timber", latest: true })).toEqual({
      omen: "harvest",
      state: "latest",
      flair: "Timber omen · windfall",
    });
    expect(resolveOmenLiving({ omen: "comet", eventId: "tribute", choiceCount: 2 })).toEqual({
      omen: "comet",
      state: "pending",
      flair: "Comet omen · choice awaits",
    });
  });

  it("resolves quest seal motifs and scroll states across open, ready, and claimed quests", () => {
    expect(getQuestSealMotif("raise_chapel")).toBe("sanctum");
    expect(getQuestSealMotif("first_scout")).toBe("scout");
    expect(getQuestSealMotif("first_victory")).toBe("valor");
    expect(getQuestSealMotif("swear_champion")).toBe("valor");
    expect(getQuestSealMotif("open_route")).toBe("caravan");
    expect(getQuestSealMotif("unknown_quest")).toBe("royal");

    expect(resolveScrollLiving({ questId: "raise_chapel", status: "open" })).toEqual({
      status: "open",
      motif: "sanctum",
      flair: "Mandate scroll · unsealed",
    });
    expect(resolveScrollLiving({ questId: "first_victory", status: "ready" })).toEqual({
      status: "ready",
      motif: "valor",
      flair: "Royal scroll · seal lit",
    });
    expect(resolveScrollLiving({ questId: "open_route", status: "claimed" })).toEqual({
      status: "claimed",
      motif: "caravan",
      flair: "Archived scroll · sealed",
    });
  });

  it("renders distinct living SVG artwork with glow, drift, and pulse layers for omens and scrolls", () => {
    const omenMarkup = (["comet", "raven", "harvest"] as const).map((omen) =>
      renderToStaticMarkup(<EventOmenLivingGlyph omen={omen} eventId={omen} latest />),
    );
    expect(new Set(omenMarkup).size).toBe(3);
    for (const html of omenMarkup) {
      expect(html).toContain("sc-events-glow-layer");
      expect(html).toContain("sc-events-drift-layer");
      expect(html).toContain("sc-events-pulse-layer");
    }

    const scrollMarkup = (["open", "ready", "claimed"] as const).map((status) =>
      renderToStaticMarkup(<QuestScrollLivingGlyph questId="raise_chapel" status={status} />),
    );
    expect(new Set(scrollMarkup).size).toBe(3);
    for (const html of scrollMarkup) {
      expect(html).toContain("sc-events-glow-layer");
      expect(html).toContain("sc-events-drift-layer");
      expect(html).toContain("sc-events-pulse-layer");
    }
  });

  it("uses phrasing-only markup (<span> + <svg>) and aria-hidden on all decorative components", () => {
    const html = [
      renderToStaticMarkup(<EventOmenUnderlay omen="comet" eventId="tribute" latest />),
      renderToStaticMarkup(<EventOmenLivingGlyph omen="raven" eventId="spoil" />),
      renderToStaticMarkup(<QuestScrollUnderlay questId="raise_chapel" status="ready" />),
      renderToStaticMarkup(<QuestScrollLivingGlyph questId="raise_chapel" status="open" />),
    ].join("");

    expect(html).not.toMatch(/<(div|p|section|article|ul|li|dl|button)\b/);
    expect((html.match(/aria-hidden="true"/g) ?? []).length).toBe(4);
  });

  it("mounts living omen glyph under EventsLedger on EventCard while preserving choice buttons", () => {
    const html = renderToStaticMarkup(
      <EventCard
        event={{ tick: 500, id: "tribute", text: "A merchant pays tribute — +10 gold" }}
        latest
        choices={[
          { id: "accept", label: "Accept", onPick: () => {} },
          { id: "refuse", label: "Refuse", disabled: true, onPick: () => {} },
        ]}
      />,
    );

    const ledgerIdx = html.indexOf("sc-events-ledger");
    const glyphIdx = html.indexOf("sc-events-status-glyph kind-omen omen-comet state-pending");
    const choicesIdx = html.indexOf("sc-event-choices");
    expect(ledgerIdx).toBeGreaterThan(0);
    expect(glyphIdx).toBeGreaterThan(ledgerIdx);
    expect(choicesIdx).toBeGreaterThan(glyphIdx);
    expect(html).toContain('data-omen-watermark="comet"');
    expect(html).toContain("Comet omen · choice awaits");
    expect(html).toContain("Accept");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Refuse/);
  });

  it("mounts living scroll glyph under EventsLedger on QuestCard without adding buttons when open or claimed", () => {
    const openHtml = renderToStaticMarkup(
      <QuestCard id="raise_chapel" name="Raise a chapel" hint="Place a Chapel" gold={20} complete={false} claimed={false} onClaim={() => {}} />,
    );
    expect(openHtml).toContain('data-scroll-watermark="open"');
    expect(openHtml).toContain("Mandate scroll · unsealed");
    expect(openHtml).not.toContain("<button");

    const readyHtml = renderToStaticMarkup(
      <QuestCard id="first_victory" name="Win a field" hint="Win any war." gold={25} complete claimed={false} onClaim={() => {}} />,
    );
    const ledgerIdx = readyHtml.indexOf("sc-events-ledger");
    const glyphIdx = readyHtml.indexOf("sc-events-status-glyph kind-scroll scroll-ready");
    expect(ledgerIdx).toBeGreaterThan(0);
    expect(glyphIdx).toBeGreaterThan(ledgerIdx);
    expect(readyHtml).toContain("Royal scroll · seal lit");
    expect(readyHtml).toContain("Claim 25 gold");
  });

  it("renders EventPanel and QuestPanel without mutating GameState", () => {
    const state = createGameState({ seed: 42 });
    const log = [
      { tick: 500, id: "harvest", text: "Bountiful harvest — +25 food" },
      { tick: 1000, id: "spoil", text: "Spoilage — lost 4 food" },
    ];
    const before = JSON.stringify(state);

    const eventsHtml = renderToStaticMarkup(
      <EventPanel lastEvent="Spoilage — lost 4 food" lastEventTick={1000} log={log} state={state} />,
    );
    const questsHtml = renderToStaticMarkup(<QuestPanel state={state} act={() => {}} />);

    expect(JSON.stringify(state)).toBe(before);
    expect(eventsHtml).toContain("Raven portent · stores blighted");
    expect(eventsHtml).toContain("Harvest omen · gathered");
    expect(questsHtml).toContain("Mandate scroll · unsealed");
  });

  it("confines card watermarks to a low-opacity bottom-right pocket so text never obscures", () => {
    const css = readTextFile("./events-glyph-living.css");
    expect(css).toMatch(/\.sc-events-living-underlay\s*\{[^}]*width:\s*32px/s);
    expect(css).toMatch(/\.sc-events-living-underlay\s*\{[^}]*height:\s*32px/s);
    expect(css).toMatch(/\.sc-events-living-underlay\s*\{[^}]*right:\s*-2px/s);
    expect(css).toMatch(/\.sc-events-living-underlay\s*\{[^}]*bottom:\s*-2px/s);
    expect(css).toContain("mask-image: radial-gradient");

    const wrapperOpacities = [...css.matchAll(/\.sc-events-living-underlay[^{]*\{[^}]*?opacity:\s*([0-9.]+)/gs)].map(
      (m) => Number(m[1]),
    );
    expect(wrapperOpacities.length).toBeGreaterThanOrEqual(3);
    for (const op of wrapperOpacities) {
      expect(op).toBeLessThanOrEqual(0.25);
    }

    for (const kf of ["sc-events-underlay-drift", "sc-events-underlay-pulse"]) {
      const block = css.slice(css.indexOf(`@keyframes ${kf}`));
      const end = block.indexOf("\n}\n");
      const kfBody = block.slice(0, end > 0 ? end : 260);
      const kfOpacities = [...kfBody.matchAll(/opacity:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
      expect(kfOpacities.length).toBeGreaterThanOrEqual(2);
      for (const op of kfOpacities) {
        expect(op).toBeLessThanOrEqual(0.55);
      }
    }
  });

  it("enforces pointer-events: none, reduced-motion support, and strict isolation from theme.css", () => {
    const css = readTextFile("./events-glyph-living.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-events-omen-glow");
    expect(css).toContain("@keyframes sc-events-omen-drift");
    expect(css).toContain("@keyframes sc-events-scroll-drift");
    expect(css).toContain("@keyframes sc-events-omen-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const themeCss = readTextFile("../theme.css");
    expect(themeCss).not.toContain("sc-events-living-underlay");
    expect(themeCss).not.toContain("sc-events-status-glyph");
  });
});
