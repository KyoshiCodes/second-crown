import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JoinHoldCard, holdLogCards } from "../JoinHoldCard";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function cardsOf(html: string): [string | null, string][] {
  const log = html.slice(html.indexOf('aria-label="Last intents"'));
  return [...log.matchAll(/class="sc-hold-log-card"[^>]*>.*?(?:<span class="sc-hold-log-tick">Tick ([^<]+)<\/span>)?<span class="sc-hold-log-text">([^<]+)<\/span>/g)]
    .map((m) => [m[1] ?? null, m[2]]);
}

describe("JoinHoldCard hold log cards (wave/hud-hold-log)", () => {
  it("splits each intent line into a tick and its text", () => {
    expect(holdLogCards(["Tick 9: stamp", "Tick 12: build lumber camp"])).toEqual([
      { tick: "9", text: "stamp" },
      { tick: "12", text: "build lumber camp" },
    ]);
  });

  it("keeps a line with no tick as text only", () => {
    expect(holdLogCards(["something else"])).toEqual([{ tick: null, text: "something else" }]);
  });

  it("shows one card per log entry, newest first as given, with tick and text", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={["Tick 9: train militia", "Tick 7: build farm", "Tick 5: stamp"]} />,
    );
    expect(cardsOf(html)).toEqual([
      ["9", "train militia"],
      ["7", "build farm"],
      ["5", "stamp"],
    ]);
  });

  it("shows no log cards when there are no intents", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} />);
    expect(html).not.toContain("sc-hold-log-card");
  });

  it("keeps log card styles in hud/hold-log.css", () => {
    const css = readCssFile("./hold-log.css");
    expect(css).toContain(".sc-hold-log-card");
    expect(css).toContain(".sc-hold-log-tick");
    expect(css).toContain(".sc-hold-log-text");
    expect(readCssFile("../theme.css")).not.toContain("sc-hold-log");
  });
});
