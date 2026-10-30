import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY_FLASH_MS, CopyFlashPip, startCopyFlashTimer } from "./CopyFlashPip";
import { JoinHoldCard } from "../JoinHoldCard";
import type { HoldView } from "../net/hold";

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

const SAMPLE_VIEW: HoldView = {
  realmId: "join-oak-hill",
  tick: 18,
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("CopyFlashPip and JoinHoldCard Copy button placement (bakeoff/gemini-copy-flash)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a 16px flash/check SVG pip with pointer-events: none", () => {
    const html = renderToStaticMarkup(<CopyFlashPip flashKey={2} />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('data-copy-flash="true"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
  });

  it("keeps pip styles isolated in copy-flash.css with pointer-events: none and reduced-motion guard", () => {
    const css = readCssFile("./copy-flash.css");
    expect(css).toContain(".sc-copy-flash-pip-wrapper");
    expect(css).toContain("pointer-events: none;");
    expect(css).toContain("@keyframes sc-copy-flash-pop");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render CopyFlashPip when no hold is joined or before a successful copy", () => {
    // No hold joined (even if initialCopyFlash were true)
    const unjoinedHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={null} initialCopyFlash={true} />,
    );
    expect(unjoinedHtml).not.toContain("data-copy-flash");

    // Hold joined with visible key, before copying
    const idleKeyHtml = renderToStaticMarkup(
      <JoinHoldCard
        signedIn={true}
        initialView={SAMPLE_VIEW}
        initialMadeKey="k9x2m4p8q1w3r7t5"
      />,
    );
    expect(idleKeyHtml).toContain(">Copy key</button>");
    expect(idleKeyHtml).not.toContain("data-copy-flash");
  });

  it("places CopyFlashPip to the left of the Copy button when active after a successful copy", () => {
    const madeKey = "k9x2m4p8q1w3r7t5";
    const flashedHtml = renderToStaticMarkup(
      <JoinHoldCard
        signedIn={true}
        initialView={SAMPLE_VIEW}
        initialMadeKey={madeKey}
        initialCopyFlash={true}
      />,
    );

    expect(flashedHtml).toContain('data-copy-flash="true"');
    const keyIndex = flashedHtml.indexOf(`>${madeKey}</code>`);
    const flashIndex = flashedHtml.indexOf("sc-copy-flash-pip-wrapper");
    const copyBtnIndex = flashedHtml.indexOf(">Copy key</button>");
    expect(keyIndex).toBeGreaterThan(-1);
    expect(flashIndex).toBeGreaterThan(keyIndex);
    expect(copyBtnIndex).toBeGreaterThan(flashIndex);
  });

  it("shows for a short time and hides once COPY_FLASH_MS elapses (or cancels cleanly)", () => {
    vi.useFakeTimers();
    let visible = true;
    const cancel = startCopyFlashTimer(() => {
      visible = false;
    });

    vi.advanceTimersByTime(COPY_FLASH_MS - 1);
    expect(visible).toBe(true);

    vi.advanceTimersByTime(1);
    expect(visible).toBe(false);

    // Early cancel (e.g. on Leave or unmount) prevents firing
    let secondVisible = true;
    const cancelEarly = startCopyFlashTimer(() => {
      secondVisible = false;
    });
    cancelEarly();
    cancel();
    vi.advanceTimersByTime(COPY_FLASH_MS * 2);
    expect(secondVisible).toBe(true);
  });
});
