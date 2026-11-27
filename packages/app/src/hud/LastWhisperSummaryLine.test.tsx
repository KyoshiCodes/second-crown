import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  getCulture,
  getCultureNews,
  lastWhisperSummary,
  maybeWhisper,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import {
  LastWhisperSummaryLine,
  resolveLastWhisperSummary,
} from "./LastWhisperSummaryLine";
import { WorldTab } from "../tabs/WorldTab";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function nextPlayerWhisper(s: GameState, startPulse: number): { nextPulse: number } {
  for (let pulse = startPulse; pulse < startPulse + 600; pulse += 1) {
    const w = maybeWhisper(s, pulse * 100);
    if (w && w.toRealmId === "player") {
      s.meta.tick = w.tick + 10;
      return { nextPulse: pulse + 1 };
    }
  }
  throw new Error("no whisper to player produced");
}

describe("LastWhisperSummaryLine World tab presentation", () => {
  it("hides cleanly when state is partial or before any whisper reaches the player (even with NPC news present)", () => {
    expect(resolveLastWhisperSummary(undefined)).toBeNull();
    expect(renderToStaticMarkup(<LastWhisperSummaryLine state={undefined} />)).toBe("");

    const s = createGameState({ seed: 1 });
    s.wars = [];
    expect(lastWhisperSummary(s)).toBeNull();
    expect(renderToStaticMarkup(<LastWhisperSummaryLine state={s} />)).toBe("");

    // Step through initial whispers until at least one NPC-to-NPC whisper exists before player receives any
    let pulse = 3;
    while (pulse < 120) {
      const w = maybeWhisper(s, pulse * 100);
      pulse += 1;
      if (w && w.toRealmId !== "player") {
        expect(getCultureNews(s).length).toBeGreaterThan(0);
        expect(lastWhisperSummary(s)).toBeNull();
        expect(renderToStaticMarkup(<LastWhisperSummaryLine state={s} />)).toBe("");
        break;
      }
      if (w && w.toRealmId === "player") break;
    }
  });

  it("renders 'Last whisper from <realm> (<culture>)' directly under NextWhisperHintLine for the newest player whisper (realm + culture only)", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 200;

    const first = nextPlayerWhisper(s, 3);
    const second = nextPlayerWhisper(s, first.nextPulse);
    expect(second.nextPulse).toBeGreaterThan(first.nextPulse);

    const summary = lastWhisperSummary(s)!;
    expect(summary).not.toBeNull();
    expect(resolveLastWhisperSummary(s)).toEqual(summary);

    const cultureName = getCulture(summary.fromCulture).name;
    const worldHtml = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    const hintPos = worldHtml.indexOf("sc-next-whisper-hint");
    const lastPos = worldHtml.indexOf("sc-last-whisper-summary");
    expect(hintPos).toBeGreaterThan(-1);
    expect(lastPos).toBeGreaterThan(hintPos);

    const lineHtml = renderToStaticMarkup(<LastWhisperSummaryLine state={s} />);
    expect(lineHtml).toContain("sc-last-whisper-summary");
    expect(lineHtml).toContain(`data-last-whisper-tick="${summary.tick}"`);
    expect(lineHtml).toContain(`data-last-whisper-realm="${summary.fromName}"`);
    expect(lineHtml).toContain(`data-last-whisper-culture="${summary.fromCulture}"`);
    expect(lineHtml).toContain("Last whisper from");
    expect(lineHtml).toContain(`<span class="sc-last-whisper-realm">${summary.fromName}</span>`);
    expect(lineHtml).toContain(`(<span class="sc-last-whisper-culture">${cultureName}</span>)`);

    // Prefers realm + culture only — does not inline the full whisper body text
    const quotedStart = summary.text.indexOf('"');
    const bodySnippet = quotedStart >= 0 ? summary.text.slice(quotedStart + 1, quotedStart + 16) : summary.text;
    expect(lineHtml).not.toContain(bodySnippet);

    // Turning living_whispers off hides NextWhisperHintLine, while received summary remains readable
    setLivingSwitch(s, "whispers", false);
    const quietWorldHtml = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    expect(quietWorldHtml).not.toContain("sc-next-whisper-hint");
    expect(quietWorldHtml).toContain("sc-last-whisper-summary");
  });

  it("keeps last-whisper-summary.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./last-whisper-summary.css");
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    for (const forbidden of [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ]) {
      expect(css).not.toContain(forbidden);
    }
  });
});
