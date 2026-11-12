import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  OmenPip,
  LivingOmenPip,
  EventOmenPip,
  OmenLivingPip,
  resolveOmenVariant,
  resolveSpecificEventType,
} from "./OmenPip";
import { EventCard } from "./EventCard";
import type { WorldEvent } from "@second-crown/sim";

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

describe("OmenPip pure helpers", () => {
  it("resolves canonical omen variants correctly", () => {
    expect(resolveOmenVariant("harvest", "Bountiful harvest")).toBe("harvest");
    expect(resolveOmenVariant("timber", "Timber windfall")).toBe("harvest");
    expect(resolveOmenVariant("spoil", "Food blighted")).toBe("raven");
    expect(resolveOmenVariant("levy", "Aderyn raises a levy")).toBe("raven");
    expect(resolveOmenVariant("tribute", "Merchant tribute")).toBe("comet");
    expect(resolveOmenVariant("comet", "Star trails")).toBe("comet");
    expect(resolveOmenVariant(undefined, undefined)).toBe("comet");
  });

  it("resolves specific event types for enhanced heraldic flair", () => {
    expect(resolveSpecificEventType("harvest", "Bountiful harvest")).toBe("harvest");
    expect(resolveSpecificEventType("timber", "Timber windfall")).toBe("timber");
    expect(resolveSpecificEventType("spoil", "Spoilage lost 12 food")).toBe("spoil");
    expect(resolveSpecificEventType("levy", "Raises a levy")).toBe("levy");
    expect(resolveSpecificEventType("tribute", "Merchant tribute")).toBe("tribute");
    expect(resolveSpecificEventType("other", "Unknown portent")).toBe("other");
  });
});

describe("OmenPip component", () => {
  it("renders base comet omen with celestial tail and fire embers", () => {
    const html = renderToStaticMarkup(<OmenPip variant="comet" />);
    expect(html).toContain("sc-omen-pip-wrapper");
    expect(html).toContain("sc-omen-comet");
    expect(html).toContain("sc-omen-aura");
    expect(html).toContain("sc-omen-comet-tail-diffuse");
    expect(html).toContain("sc-omen-comet-core-flame");
    expect(html).toContain("sc-omen-comet-spark-1");
  });

  it("renders raven omen with perched plumage, hackles, and keen eye", () => {
    const html = renderToStaticMarkup(<OmenPip variant="raven" />);
    expect(html).toContain("sc-omen-pip-wrapper");
    expect(html).toContain("sc-omen-raven");
    expect(html).toContain("sc-omen-raven-wing-fold");
    expect(html).toContain("sc-omen-raven-feather-ruffle");
    expect(html).toContain("sc-omen-raven-eye-gleam");
  });

  it("renders harvest omen with ribbon tie and fanning wheat ears", () => {
    const html = renderToStaticMarkup(<OmenPip variant="harvest" />);
    expect(html).toContain("sc-omen-pip-wrapper");
    expect(html).toContain("sc-omen-harvest");
    expect(html).toContain("sc-omen-harvest-sheaf-sway");
    expect(html).toContain("sc-omen-harvest-sparkle-1");
  });

  it("renders event-specific specialized heraldry", () => {
    const htmlTimber = renderToStaticMarkup(<OmenPip eventId="timber" text="Timber windfall" />);
    expect(htmlTimber).toContain('data-omen-type="timber"');
    expect(htmlTimber).toContain("sc-omen-timber-charm");
    expect(htmlTimber).toContain("sc-omen-timber-leaf-flutter");

    const htmlSpoil = renderToStaticMarkup(<OmenPip eventId="spoil" text="Spoilage" />);
    expect(htmlSpoil).toContain('data-omen-type="spoil"');
    expect(htmlSpoil).toContain("sc-omen-spoil-miasma");
    expect(htmlSpoil).toContain("sc-omen-spoil-miasma-mote");

    const htmlLevy = renderToStaticMarkup(<OmenPip eventId="levy" text="Raises a levy" />);
    expect(htmlLevy).toContain('data-omen-type="levy"');
    expect(htmlLevy).toContain("sc-omen-levy-spear");
    expect(htmlLevy).toContain("sc-omen-levy-banner-flutter");

    const htmlTribute = renderToStaticMarkup(<OmenPip eventId="tribute" text="Merchant tribute" />);
    expect(htmlTribute).toContain('data-omen-type="tribute"');
    expect(htmlTribute).toContain("sc-omen-tribute-coin-charm");
  });

  it("renders progress ring when progress prop is provided", () => {
    const htmlPending = renderToStaticMarkup(
      <OmenPip eventId="tribute" progress={0.5} state="pending" />
    );
    expect(htmlPending).toContain("sc-omen-progress-group");
    expect(htmlPending).toContain("sc-omen-progress-ring-bg");
    expect(htmlPending).toContain("sc-omen-progress-ring-fill");
    expect(htmlPending).toContain("is-pending");
    expect(htmlPending).toContain('data-progress="0.5"');

    const htmlDone = renderToStaticMarkup(
      <OmenPip eventId="harvest" progress={1.0} state="settled" />
    );
    expect(htmlDone).toContain("sc-omen-progress-ring-fill");
    expect(htmlDone).toContain("is-settled");
    expect(htmlDone).toContain('data-progress="1"');
  });

  it("drop-in aliases render identically", () => {
    const htmlBase = renderToStaticMarkup(<OmenPip variant="comet" />);
    const htmlLiving = renderToStaticMarkup(<LivingOmenPip variant="comet" />);
    const htmlEvent = renderToStaticMarkup(<EventOmenPip variant="comet" />);
    const htmlOmenLiving = renderToStaticMarkup(<OmenLivingPip variant="comet" />);

    expect(htmlBase).toBe(htmlLiving);
    expect(htmlBase).toBe(htmlEvent);
    expect(htmlBase).toBe(htmlOmenLiving);
  });

  it("integrates seamlessly into EventCard with progress and event metadata", () => {
    const ev: WorldEvent = {
      id: "harvest",
      tick: 500,
      text: "Bountiful harvest — +25 food",
    };
    const html = renderToStaticMarkup(<EventCard event={ev} latest={true} />);

    expect(html).toContain("sc-omen-pip-wrapper");
    expect(html).toContain('data-omen-type="harvest"');
    expect(html).toContain('data-omen-state="latest"');
    expect(html).toContain("sc-omen-aura");
    expect(html).toContain("sc-omen-harvest-sheaf-sway");
  });

  it("omen-pip.css strictly enforces pointer-events: none and reduced motion", () => {
    const css = readCssFile("./omen-pip.css");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("sc-omen-aura-breathe");
    expect(css).toContain("sc-omen-tail-flicker");
    expect(css).toContain("sc-omen-wing-heave");
    expect(css).toContain("sc-omen-ear-sway");
  });

  it("theme.css was not modified or polluted", () => {
    const theme = readCssFile("../theme.css");

    expect(theme).not.toContain("sc-omen-aura");
    expect(theme).not.toContain("sc-omen-comet-tail");
    expect(theme).not.toContain("sc-omen-progress-ring");
  });
});
