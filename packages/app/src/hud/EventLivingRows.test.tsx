import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { eventLedgerRows } from "./EventsLedger";
import { EventLivingRows, orderEventRows } from "./EventLivingRows";
import { EventCard } from "./EventCard";
import { EventPanel } from "../EventPanel";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const base = { id: "tribute", title: "A merchant pays tribute", body: "+10 gold", tickLabel: "500" };

describe("orderEventRows", () => {
  it("puts name, omen (effect), duration (progress) in order regardless of input order", () => {
    const rows = eventLedgerRows(base);
    expect(orderEventRows([rows[1], rows[2], rows[0]]).map((r) => r.kind)).toEqual(["name", "reward", "progress"]);
  });
});

describe("EventLivingRows", () => {
  it("stacks name, omen, duration using the existing row values", () => {
    const rows = eventLedgerRows({ ...base, latest: true });
    const html = renderToStaticMarkup(<EventLivingRows eventId="tribute" omen="comet" state="latest" rows={rows} />);
    const order = ["is-name", "is-omen", "is-duration"].map((c) => html.indexOf(`sc-event-living-row ${c}`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const r of rows) expect(html).toContain(r.value);
    expect(html).toContain("Omen");
    expect(html).toContain("Duration");
    expect(html).toContain("t500");
    expect(html).toContain("is-latest omen-comet");
    expect(html).toContain("comet · latest");
    expect(html).toContain('aria-valuenow="1"');
  });

  it("pending choice shows awaiting state and an empty meter", () => {
    const rows = eventLedgerRows({ ...base, choiceCount: 2 });
    const html = renderToStaticMarkup(<EventLivingRows eventId="tribute" omen="comet" state="pending" rows={rows} />);
    expect(html).toContain("Awaiting choice · 2");
    expect(html).toContain("comet · awaiting");
    expect(html).toContain('style="width:0%"');
    expect(html).toContain("sc-event-living-row is-duration tone-busy");
  });

  it("spoilage reads as a blighted loss", () => {
    const rows = eventLedgerRows({ id: "spoil", title: "Spoilage", body: "lost 4 food", tickLabel: "1K" });
    const html = renderToStaticMarkup(<EventLivingRows eventId="spoil" omen="raven" state="loss" rows={rows} />);
    expect(html).toContain("raven · blighted");
    expect(html).toContain("sc-event-living-row is-omen tone-loss");
    expect(html).toContain("lost 4 food");
  });
});

describe("EventCard living head", () => {
  it("renders chip + rows, keeps glyph and choice buttons after them", () => {
    const html = renderToStaticMarkup(
      <EventCard
        event={{ tick: 500, id: "tribute", text: "A merchant pays tribute — +10 gold" }}
        latest
        choices={[
          { id: "a", label: "Accept", onPick: () => {} },
          { id: "b", label: "Refuse", disabled: true, onPick: () => {} },
        ]}
      />,
    );
    const head = html.indexOf("sc-event-living-head");
    const chip = html.indexOf("sc-event-living-chip");
    const glyph = html.indexOf("sc-events-status-glyph");
    const choices = html.indexOf("sc-event-choices");
    expect(head).toBeGreaterThan(0);
    expect(chip).toBeGreaterThan(head);
    expect(html.indexOf("sc-omen-pip-wrapper")).toBeGreaterThan(chip);
    expect(glyph).toBeGreaterThan(head);
    expect(choices).toBeGreaterThan(glyph);
    expect(html).toContain("comet · awaiting");
    expect(html).toContain("Accept");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Refuse/);
  });

  it("EventPanel renders living rows for latest and older events", () => {
    const html = renderToStaticMarkup(
      <EventPanel
        lastEvent=""
        lastEventTick={0}
        log={[
          { tick: 500, id: "harvest", text: "Bountiful harvest — +25 food" },
          { tick: 1000, id: "spoil", text: "Spoilage — lost 4 food" },
        ]}
      />,
    );
    expect((html.match(/sc-event-living-head/g) ?? []).length).toBe(2);
    expect(html).toContain("raven · blighted");
    expect(html).toContain("harvest · settled");
  });
});

describe("event-living-rows.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./event-living-rows.css");
    expect(css).toContain(".sc-event-living-head");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-event-living");
  });
});
