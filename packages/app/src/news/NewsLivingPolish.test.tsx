import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GameNewsPanel } from "./GameNewsPanel";
import { NewsUnreadBadge } from "./NewsUnreadBadge";
import {
  GAME_NEWS,
  getActiveNewsFeed,
  NEWS_ENDPOINT_PLACEHOLDER,
  type NewsEntry,
} from "./gameNews";
import {
  countUnreadNews,
  hasUnreadNews,
  latestNewsId,
  markNewsSeen,
  NEWS_SEEN_KEY,
  readLastSeenNewsId,
} from "./newsState";

function readTextFile(relativePath: string): string {
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

function stubStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("Living news polish & unread indicator", () => {
  beforeEach(() => stubStorage());
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("tracks unread news in localStorage and clears cleanly when marked seen", () => {
    const newest = latestNewsId(GAME_NEWS);
    expect(newest).toBe(GAME_NEWS[0].id);
    expect(readLastSeenNewsId()).toBeNull();
    expect(countUnreadNews(GAME_NEWS)).toBe(GAME_NEWS.length);
    expect(hasUnreadNews(GAME_NEWS)).toBe(true);

    markNewsSeen(GAME_NEWS);
    expect(readLastSeenNewsId()).toBe(newest);
    expect(countUnreadNews(GAME_NEWS)).toBe(0);
    expect(hasUnreadNews(GAME_NEWS)).toBe(false);

    const newerEntry: NewsEntry = {
      id: "2026-11-25-future",
      date: "2026-11-25",
      kind: "major",
      title: "New Chronicle",
      body: ["Line one.", "Line two."],
    };
    expect(countUnreadNews([newerEntry, ...GAME_NEWS])).toBe(1);
    expect(NEWS_SEEN_KEY).toBe("sc-news-seen-id");
  });

  it("keeps a clean empty placeholder for a future server news endpoint", () => {
    expect(NEWS_ENDPOINT_PLACEHOLDER).toBeNull();
    expect(getActiveNewsFeed()).toBe(GAME_NEWS);
  });

  it("renders NewsUnreadBadge only when unread count > 0 with pointer-events: none", () => {
    const unreadHtml = renderToStaticMarkup(<NewsUnreadBadge unreadOverride={3} />);
    expect(unreadHtml).toContain("sc-news-tab-badge");
    expect(unreadHtml).toContain("sc-news-tab-dot");
    expect(unreadHtml).toContain('data-unread-count="3"');
    expect(unreadHtml).toContain("New");
    expect(unreadHtml).toContain("pointer-events:none");

    expect(renderToStaticMarkup(<NewsUnreadBadge unreadOverride={0} />)).toBe("");
  });

  it("renders living pips, date seals, and hover styles without altering card count or theme.css", () => {
    const html = renderToStaticMarkup(<GameNewsPanel />);
    expect(html.match(/sc-news-card/g)?.length).toBe(GAME_NEWS.length);
    expect(html.match(/sc-news-pip/g)?.length).toBe(GAME_NEWS.length);
    expect(html.match(/sc-news-date-seal/g)?.length).toBe(GAME_NEWS.length);
    expect(html.match(/sc-news-seal-icon/g)?.length).toBe(GAME_NEWS.length);
    expect(html).toContain("sc-news-pip is-minor is-latest");

    const css = readTextFile("./news-living.css");
    const themeCss = readTextFile("../theme.css");
    const appShellTsx = readTextFile("../AppShell.tsx");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain(".sc-news-pip");
    expect(css).toContain(".sc-news-date-seal");
    expect(css).toContain(".sc-news-tab-badge");
    expect(css).toContain(".sc-news-list > .sc-work-card.sc-news-card:hover");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(themeCss).not.toContain("sc-news-");
    expect(appShellTsx).toContain("NewsUnreadBadge");
  });
});
