import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CHAT_ARRIVAL_MS, detectNewChatMessageId, GlobalChatPanel } from "./GlobalChatPanel";
import { SEED_CHAT, type ChatMessage } from "./globalChat";

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

describe("Living Global Chat accents", () => {
  it("detects new message arrivals only after initial paint", () => {
    expect(CHAT_ARRIVAL_MS).toBe(900);
    expect(detectNewChatMessageId(null, SEED_CHAT)).toBeNull();
    expect(detectNewChatMessageId(SEED_CHAT[SEED_CHAT.length - 1].id, [])).toBeNull();
    expect(detectNewChatMessageId(SEED_CHAT[SEED_CHAT.length - 1].id, SEED_CHAT)).toBeNull();

    const appended: ChatMessage[] = [
      ...SEED_CHAT,
      { id: "msg-new", author: "You", text: "Hail the crown!", at: Date.UTC(2026, 10, 25, 9, 10), local: true },
    ];
    expect(detectNewChatMessageId(SEED_CHAT[SEED_CHAT.length - 1].id, appended)).toBe("msg-new");
  });

  it("renders presence pip in header, quiet initial rows, and arrival accents when a new message arrives", () => {
    const idleHtml = renderToStaticMarkup(<GlobalChatPanel defaultOpen />);
    expect(idleHtml).toContain("sc-chat-presence-pip");
    expect(idleHtml).toContain("sc-chat-title-wrap");
    expect(idleHtml).toContain("Global Chat");
    expect(idleHtml).toContain('data-chat-arrival="false"');
    expect(idleHtml).toContain("pointer-events:none");
    expect(idleHtml.match(/sc-chat-msg/g)?.length).toBe(SEED_CHAT.length);
    expect(idleHtml).not.toContain("has-new-message");
    expect(idleHtml).not.toContain("is-entering");

    const latestId = SEED_CHAT[SEED_CHAT.length - 1].id;
    const arrivingHtml = renderToStaticMarkup(<GlobalChatPanel defaultOpen arrivalOverrideId={latestId} />);
    expect(arrivingHtml).toContain('data-chat-arrival="true"');
    expect(arrivingHtml).toContain("sc-chat-fold has-new-message");
    expect(arrivingHtml).toContain("sc-chat-msg is-entering");
    expect(arrivingHtml.match(/sc-chat-msg/g)?.length).toBe(SEED_CHAT.length);
  });

  it("isolates styles in chat-living.css without touching theme.css or hud-micro-feedback pseudos", () => {
    const css = readTextFile("./chat-living.css");
    const themeCss = readTextFile("../theme.css");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain(".sc-chat-presence-pip");
    expect(css).toContain(".sc-chat-presence-pip::after");
    expect(css).toContain(".sc-chat-fold.has-new-message > .sc-fold-head");
    expect(css).toContain(".sc-chat-fold.has-new-message > .sc-fold-head::after");
    expect(css).toContain(".sc-chat-list > .sc-work-card.sc-chat-msg.is-entering");
    expect(css).toContain("@keyframes sc-chat-presence-breathe");
    expect(css).toContain("@keyframes sc-chat-head-glow");
    expect(css).toContain("@keyframes sc-chat-row-enter");
    expect(css).not.toContain(".sc-fold-head::before");

    for (const theme of ["dusk", "night", "parchment"] as const) {
      expect(css).toContain(`:root[data-chrome="${theme}"]`);
    }
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(themeCss).not.toContain("sc-chat-presence");
  });
});
