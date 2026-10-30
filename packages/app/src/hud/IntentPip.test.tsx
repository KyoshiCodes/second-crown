import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldIntentLog, IntentPip } from "./IntentPip";
import { JoinHoldCard, resolveHoldIntentLines } from "../JoinHoldCard";

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

describe("IntentPip and HoldIntentLog (bakeoff/gemini-intent-pip)", () => {
  it("renders a 16px seal or quill SVG pip with pointer-events: none", () => {
    const sealHtml = renderToStaticMarkup(<IntentPip />);
    expect(sealHtml).toContain('width="16"');
    expect(sealHtml).toContain('height="16"');
    expect(sealHtml).toContain('viewBox="0 0 16 16"');
    expect(sealHtml).toContain('data-intent-pip="true"');
    expect(sealHtml).toContain('data-variant="seal"');
    expect(sealHtml).toContain('data-pulsing="false"');
    expect(sealHtml).toContain('aria-hidden="true"');
    expect(sealHtml).toContain("pointer-events:none");
    expect(sealHtml).not.toContain("is-pulsing");

    const quillHtml = renderToStaticMarkup(<IntentPip variant="quill" pulse pulseKey={3} />);
    expect(quillHtml).toContain('width="16"');
    expect(quillHtml).toContain('height="16"');
    expect(quillHtml).toContain('data-variant="quill"');
    expect(quillHtml).toContain('data-pulsing="true"');
    expect(quillHtml).toContain("is-pulsing");
    expect(quillHtml).toContain("pointer-events:none");
  });

  it("keeps pip styles isolated in intent-pip.css with pointer-events: none, 1-shot pulse, and reduced-motion guard", () => {
    const intentPipCss = readCssFile("./intent-pip.css");
    expect(intentPipCss).toContain(".sc-intent-pip-wrapper");
    expect(intentPipCss).toContain("pointer-events: none;");
    expect(intentPipCss).toContain("@keyframes sc-intent-pip-pulse");
    expect(intentPipCss).toMatch(/animation:\s*sc-intent-pip-pulse\s+[^;]+\s+1;/);
    expect(intentPipCss).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render IntentPip when there are no intent log lines", () => {
    const emptyLogHtml = renderToStaticMarkup(<HoldIntentLog lines={[]} />);
    expect(emptyLogHtml).toBe("");
    expect(emptyLogHtml).not.toContain("data-intent-pip");

    const cardHtml = renderToStaticMarkup(<JoinHoldCard signedIn={true} />);
    expect(cardHtml).not.toContain("data-intent-pip");
    expect(cardHtml).not.toContain('aria-label="Last intents"');
  });

  it("places IntentPip to the left of the intent log lines and pulses when a new intent is added", () => {
    const lines = ["Tick 9: stamp", "Tick 6: train militia"];
    const cardHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={lines} intentPulseKey={2} />,
    );

    expect(cardHtml).toContain('aria-label="Last intents"');
    expect(cardHtml).toContain("is-pulsing");
    expect(cardHtml).toContain("Tick 9: stamp");
    expect(cardHtml).toContain("Tick 6: train militia");

    const pipIndex = cardHtml.indexOf("sc-intent-pip-wrapper");
    const linesIndex = cardHtml.indexOf("sc-intent-log-lines");
    expect(pipIndex).toBeGreaterThan(-1);
    expect(linesIndex).toBeGreaterThan(pipIndex);
  });

  it("resolves up to 3 newest intent lines for the active hold only", () => {
    const entries = [
      { realmId: "join-oak", line: "Tick 2: build cottage" },
      { realmId: "join-pine", line: "Tick 3: stamp" },
      { realmId: "join-oak", line: "Tick 5: build farm" },
      { realmId: "join-oak", line: "Tick 7: build lumber camp" },
      { realmId: "join-oak", line: "Tick 9: train militia" },
    ];

    expect(resolveHoldIntentLines(null, entries)).toEqual([]);
    expect(resolveHoldIntentLines("join-ash", entries)).toEqual([]);
    expect(resolveHoldIntentLines("join-oak", entries)).toEqual([
      "Tick 9: train militia",
      "Tick 7: build lumber camp",
      "Tick 5: build farm",
    ]);
  });
});
