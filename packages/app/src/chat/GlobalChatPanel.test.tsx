import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GlobalChatPanel } from "./GlobalChatPanel";
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
  it("renders a global-chat fold with seed messages, input and Send", () => {
    const html = renderToStaticMarkup(<GlobalChatPanel />);
    expect(html).toContain('data-fold="global-chat"');
    expect(html).toContain("Global Chat");
    expect(html.match(/sc-chat-msg/g)?.length).toBe(SEED_CHAT.length);
    expect(html).toContain('class="sc-chat-input"');
    expect(html).toContain(">Send</button>");
  });
});
