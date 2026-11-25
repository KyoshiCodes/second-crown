import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { GlobalChatPanel, hasRealChatMessages } from "./GlobalChatPanel";
import {
  CHAT_MAX_LEN,
  CHAT_MAX_MESSAGES,
  SEED_CHAT,
  appendChat,
  chatSummary,
  cleanChatText,
  makeLocalMessage,
  sendToServer,
  type ChatMessage,
} from "./globalChat";

describe("global chat helpers", () => {
  it("seeds 2-3 messages with unique ids", () => {
    expect(SEED_CHAT.length).toBeGreaterThanOrEqual(2);
    expect(SEED_CHAT.length).toBeLessThanOrEqual(3);
    expect(new Set(SEED_CHAT.map((m) => m.id)).size).toBe(SEED_CHAT.length);
  });

  it("cleans whitespace and clamps length", () => {
    expect(cleanChatText("   ")).toBe("");
    expect(cleanChatText("  hi \n there ")).toBe("hi there");
    expect(cleanChatText("x".repeat(CHAT_MAX_LEN + 50)).length).toBe(CHAT_MAX_LEN);
  });

  it("makes local messages and rejects blank input", () => {
    expect(makeLocalMessage("You", "  ")).toBeNull();
    const m = makeLocalMessage("You", " hello ", 1000);
    expect(m).toMatchObject({ author: "You", text: "hello", at: 1000, local: true });
    const m2 = makeLocalMessage("You", "again", 1000);
    expect(m2?.id).not.toBe(m?.id);
  });

  it("appends and caps the list", () => {
    let list: ChatMessage[] = [];
    for (let i = 0; i < CHAT_MAX_MESSAGES + 5; i++) {
      list = appendChat(list, { id: String(i), author: "a", text: "t", at: i });
    }
    expect(list.length).toBe(CHAT_MAX_MESSAGES);
    expect(list[list.length - 1].id).toBe(String(CHAT_MAX_MESSAGES + 4));
  });

  it("summarises count and last author", () => {
    expect(chatSummary([])).toBe("No messages");
    expect(chatSummary(SEED_CHAT)).toBe(`${SEED_CHAT.length} · ${SEED_CHAT[SEED_CHAT.length - 1].author}`);
  });

  it("server send is a placeholder that reports not delivered", async () => {
    await expect(sendToServer(SEED_CHAT[0])).resolves.toBe(false);
  });
});

describe("GlobalChatPanel", () => {
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("detects whether non-seed messages exist", () => {
    expect(hasRealChatMessages([])).toBe(false);
    expect(hasRealChatMessages(SEED_CHAT)).toBe(false);
    expect(hasRealChatMessages([...SEED_CHAT, { id: "real-1", author: "You", text: "hi", at: 1000, local: true }])).toBe(
      true,
    );
  });

  it("folds sample chat by default on a fresh hold", () => {
    const html = renderToStaticMarkup(<GlobalChatPanel />);
    expect(html).toContain('data-fold="global-chat"');
    expect(html).toContain("Global Chat");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(chatSummary(SEED_CHAT));
    expect(html).not.toContain("sc-chat-msg");
  });

  it("opens when real messages exist or when explicitly opened", () => {
    const html = renderToStaticMarkup(<GlobalChatPanel defaultOpen />);
    expect(html).toContain('data-fold="global-chat"');
    expect(html).toContain('aria-expanded="true"');
    expect(html.match(/sc-chat-msg/g)?.length).toBe(SEED_CHAT.length);
    expect(html).toContain('class="sc-chat-input"');
    expect(html).toContain(">Send</button>");

    const realMsg: ChatMessage = { id: "real-1", author: "You", text: "Hail", at: 1000, local: true };
    const withRealHtml = renderToStaticMarkup(<GlobalChatPanel initial={[...SEED_CHAT, realMsg]} />);
    expect(withRealHtml).toContain('aria-expanded="true"');
    expect(withRealHtml.match(/sc-chat-msg/g)?.length).toBe(SEED_CHAT.length + 1);

    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (k === "sc-fold:global-chat" ? "1" : null),
      setItem: () => {},
      removeItem: () => {},
    };
    expect(renderToStaticMarkup(<GlobalChatPanel />)).toContain('aria-expanded="true"');
  });
});
