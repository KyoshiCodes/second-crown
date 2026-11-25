import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CHAT_JUST_SENT_MS,
  GlobalChatPanel,
  resolveChatSenderCrest,
} from "./GlobalChatPanel";
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

const NOW = new Date(2026, 10, 25, 12, 0).getTime();

describe("Global Chat living identity & just-sent", () => {
  it("classifies sender crests for self, Herald, and peer messages", () => {
    expect(CHAT_JUST_SENT_MS).toBe(2800);
    expect(resolveChatSenderCrest({ id: "1", author: "You", text: "Hi", at: NOW, local: true }, "You")).toBe("self");
    expect(resolveChatSenderCrest({ id: "2", author: "You", text: "Echo", at: NOW }, "You")).toBe("self");
    expect(resolveChatSenderCrest(SEED_CHAT[0], "You")).toBe("herald");
    expect(resolveChatSenderCrest(SEED_CHAT[1], "You")).toBe("peer");
  });

  it("renders sender pips, settling just-sent accents, and ready-send button states cleanly", () => {
    const mine: ChatMessage = { id: "local-just-sent", author: "You", text: "Onward!", at: NOW, local: true };
    const html = renderToStaticMarkup(
      <GlobalChatPanel
        initial={[...SEED_CHAT, mine]}
        now={NOW}
        justSentOverrideId="local-just-sent"
        initialDraft="March at dawn"
      />,
    );

    expect(html).toContain("sc-chat-sender-pip sender-self");
    expect(html).toContain("sc-chat-sender-pip sender-herald");
    expect(html).toContain("sc-chat-sender-pip sender-peer");
    expect(html.match(/sc-chat-sender-pip/g)?.length).toBe(SEED_CHAT.length + 1);
    expect(html.match(/is-own/g)?.length).toBe(1);

    expect(html).toContain("is-just-sent");
    expect(html).toContain('data-just-sent="true"');
    expect(html).toContain("sc-chat-just-sent-pill");
    expect(html).toContain("sc-chat-send is-ready");
    expect(html).toContain('data-send-ready="true"');

    const idleHtml = renderToStaticMarkup(<GlobalChatPanel defaultOpen now={NOW} initialDraft="" />);
    expect(idleHtml).toContain('data-send-ready="false"');
    expect(idleHtml).not.toContain("sc-chat-send is-ready");
    expect(idleHtml).not.toContain("is-just-sent");
  });

  it("isolates styles in chat-identity.css without touching theme.css or existing chat CSS files", () => {
    const css = readTextFile("./chat-identity.css");
    const themeCss = readTextFile("../theme.css");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain(".sc-chat-sender-pip.sender-self");
    expect(css).toContain(".sc-chat-sender-pip.sender-herald");
    expect(css).toContain(".sc-chat-sender-pip.sender-peer");
    expect(css).toContain(".is-just-sent");
    expect(css).toContain(".sc-chat-just-sent-pill");
    expect(css).toContain(".sc-chat-send.is-ready:not(:disabled)");
    expect(css).toContain("@keyframes sc-chat-just-sent-settle");
    expect(css).toContain("@keyframes sc-chat-send-breathe");

    for (const theme of ["dusk", "night", "parchment"] as const) {
      expect(css).toContain(`:root[data-chrome="${theme}"]`);
    }
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(themeCss).not.toContain("sc-chat-sender-pip");
    expect(themeCss).not.toContain("sc-chat-just-sent");
  });
});
