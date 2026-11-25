import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GameNewsPanel } from "./GameNewsPanel";
import { GAME_NEWS, formatNewsDate, newsSummary, sortedNews, type NewsEntry } from "./gameNews";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("GAME_NEWS seed", () => {
  it("has the six shipped updates with unique ids, ISO dates, and 2-4 body lines", () => {
    expect(GAME_NEWS.length).toBe(6);
    expect(new Set(GAME_NEWS.map((n) => n.id)).size).toBe(GAME_NEWS.length);
    for (const n of GAME_NEWS) {
      expect(n.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThanOrEqual(2);
      expect(n.body.length).toBeLessThanOrEqual(4);
      expect(["major", "minor"]).toContain(n.kind);
    }
  });
});

describe("news helpers", () => {
  const a: NewsEntry = { id: "a", date: "2026-01-02", kind: "minor", title: "A", body: ["x", "y"] };
  const b: NewsEntry = { id: "b", date: "2026-03-01", kind: "major", title: "B", body: ["x", "y"] };
  const c: NewsEntry = { id: "c", date: "2026-03-01", kind: "minor", title: "C", body: ["x", "y"] };

  it("sorts newest first and keeps array order on equal dates", () => {
    expect(sortedNews([a, b, c]).map((n) => n.id)).toEqual(["b", "c", "a"]);
  });

  it("summarises count and newest title", () => {
    expect(newsSummary([])).toBe("No news yet");
    expect(newsSummary([a])).toBe("1 update · A");
    expect(newsSummary([a, b])).toBe("2 updates · B");
  });

  it("formats dates without timezone drift", () => {
    expect(formatNewsDate("2026-11-24")).toBe("Nov 24, 2026");
    expect(formatNewsDate("2026-01-05")).toBe("Jan 5, 2026");
    expect(formatNewsDate("soon")).toBe("soon");
  });
});

describe("GameNewsPanel", () => {
  it("renders a crown-news fold with one card per entry", () => {
    const html = renderToStaticMarkup(<GameNewsPanel />);
    expect(html).toContain('data-fold="crown-news"');
    expect(html).toContain("Game News");
    expect(html.match(/sc-news-card/g)?.length).toBe(GAME_NEWS.length);
    expect(html).toContain("Board first: new layout");
    expect(html).toContain('dateTime="2026-11-24"');
  });

  it("shows an empty line when there is no news", () => {
    const html = renderToStaticMarkup(<GameNewsPanel news={[]} />);
    expect(html).toContain("No news yet.");
    expect(html).not.toContain("sc-news-card");
  });

  it("keeps styles in its own CSS file", () => {
    const css = readCssFile("./game-news.css");
    expect(css).toContain(".sc-news-card.is-major");
    expect(css).toContain(".sc-news-kind");
  });
});
