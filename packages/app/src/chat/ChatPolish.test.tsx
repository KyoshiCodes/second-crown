import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GlobalChatPanel } from "./GlobalChatPanel";
import {
  SEED_CHAT,
  formatChatRelative,
  formatChatStamp,
  isOwnMessage,
  sendToServer,
  type ChatMessage,
} from "./globalChat";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const NOW = new Date(2026, 10, 25, 12, 0).getTime();
const MIN = 60_000;

describe("chat relative time", () => {
  it("steps from now to minutes, hours, yesterday, then a date", () => {
    expect(formatChatRelative(NOW, NOW)).toBe("now");
    expect(formatChatRelative(NOW + 5 * MIN, NOW)).toBe("now"); // clock skew never shows negatives
    expect(formatChatRelative(NOW - 59_000, NOW)).toBe("now");
    expect(formatChatRelative(NOW - 4 * MIN, NOW)).toBe("4m");
    expect(formatChatRelative(NOW - 59 * MIN, NOW)).toBe("59m");
    expect(formatChatRelative(NOW - 2 * 60 * MIN, NOW)).toBe("2h");
    expect(formatChatRelative(NOW - 30 * 60 * MIN, NOW)).toBe("Yesterday");
    expect(formatChatRelative(new Date(2026, 10, 20, 9, 0).getTime(), NOW)).toBe("Nov 20");
  });

  it("gives a full local stamp for the tooltip", () => {
    expect(formatChatStamp(new Date(2026, 10, 25, 9, 4).getTime())).toBe("Nov 25, 09:04");
  });
});

describe("own messages", () => {
  it("treats local or same-author messages as own", () => {
    expect(isOwnMessage({ id: "a", author: "Wren", text: "x", at: 0, local: true }, "You")).toBe(true);
    expect(isOwnMessage({ id: "b", author: "You", text: "x", at: 0 }, "You")).toBe(true);
    expect(isOwnMessage(SEED_CHAT[1], "You")).toBe(false);
  });

  it("renders own rows with is-own, the only-you tag and a relative time", () => {
    const mine: ChatMessage = { id: "local-1", author: "You", text: "Hail!", at: NOW - 3 * MIN, local: true };
    const html = renderToStaticMarkup(<GlobalChatPanel initial={[...SEED_CHAT, mine]} now={NOW} />);
    expect(html.match(/is-own/g)?.length).toBe(1);
    expect(html).toContain('data-chat-own="true"');
    expect(html).toContain("only you</span>");
    expect(html).toContain(">3m</time>");
    expect(html).toMatch(/title="Nov 25, \d\d:\d\d"/);
  });
});

describe("empty state and footer", () => {
  it("shows the quiet-hall empty state with a restore button, and disables Clear", () => {
    const html = renderToStaticMarkup(<GlobalChatPanel defaultOpen initial={[]} now={NOW} />);
    expect(html).toContain("sc-chat-empty");
    expect(html).toContain("The hall is quiet.");
    expect(html).toContain("Restore sample messages");
    expect(html).not.toContain("sc-chat-msg");
    expect(html).toMatch(/<button[^>]*sc-chat-clear[^>]*disabled/);
  });

  it("shows the Local badge note and an enabled Clear when there are messages", () => {
    const html = renderToStaticMarkup(<GlobalChatPanel defaultOpen now={NOW} />);
    expect(html).toContain("sc-chat-note-badge");
    expect(html).toContain("Only you see these. Chat clears on reload.");
    expect(html).toContain(">Clear</button>");
    expect(html).not.toMatch(/<button[^>]*sc-chat-clear[^>]*disabled/);
  });

  it("keeps sendToServer as the single, still-inert seam", async () => {
    await expect(sendToServer(SEED_CHAT[0])).resolves.toBe(false);
    const panelSrc = readTextFile("./GlobalChatPanel.tsx");
    expect(panelSrc).not.toContain("fetch(");
    expect(panelSrc.match(/sendToServer\(/g)?.length).toBe(1);
  });

  it("puts polish styles in chat-polish.css, not theme.css", () => {
    const css = readTextFile("./chat-polish.css");
    expect(css).toContain(".sc-chat-msg.is-own");
    expect(css).toContain(".sc-chat-empty");
    expect(css).toContain(".sc-chat-foot");
    expect(readTextFile("../theme.css")).not.toContain("sc-chat-");
  });
});
