import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminPanel, playersSeenInChat, recentForModeration } from "./AdminPanel";
import { fetchPlayerList, fetchServerStatus, moderatePlayer, parseStaffQuery, readStaffFlag } from "./staff";
import { getChatFeed, publishChatFeed, subscribeChatFeed } from "../chat/chatFeed";
import { SEED_CHAT, type ChatMessage } from "../chat/globalChat";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const NOW = Date.UTC(2026, 10, 25, 10, 0);
const msgs: ChatMessage[] = [
  { id: "a", author: "Wren", text: "hello", at: NOW - 60_000 },
  { id: "b", author: "You", text: "mine", at: NOW - 30_000, local: true },
  { id: "c", author: "Ilse", text: "hi", at: NOW - 10_000 },
  { id: "d", author: "Wren", text: "again", at: NOW },
];

describe("admin staff gate", () => {
  it("reads ?staff=1 / ?staff=0 and ignores anything else", () => {
    expect(parseStaffQuery("?staff=1")).toBe(true);
    expect(parseStaffQuery("?x=2&staff=0")).toBe(false);
    expect(parseStaffQuery("?staff=yes")).toBeNull();
    expect(parseStaffQuery("")).toBeNull();
  });

  it("is off by default (no localStorage in node)", () => {
    expect(readStaffFlag()).toBe(false);
  });

  it("renders nothing when not staff", () => {
    expect(renderToStaticMarkup(<AdminPanel messages={msgs} now={NOW} />)).toBe("");
  });
});

describe("admin panel (staff)", () => {
  const html = renderToStaticMarkup(<AdminPanel forceStaff messages={msgs} now={NOW} />);

  it("has the three sections and the off switch", () => {
    expect(html).toContain("Admin");
    expect(html).toContain('aria-label="Chat moderation"');
    expect(html).toContain('aria-label="Players"');
    expect(html).toContain('aria-label="Server status"');
    expect(html).toContain("Turn off staff tools");
  });

  it("lists recent messages newest first with Mute/Kick/Ban", () => {
    expect(html.match(/class="sc-admin-row"/g)?.length).toBe(4);
    expect(html.indexOf('data-admin-msg="d"')).toBeLessThan(html.indexOf('data-admin-msg="a"'));
    expect(html.match(/>Mute</g)?.length).toBe(4);
    expect(html.match(/>Kick</g)?.length).toBe(4);
    expect(html.match(/>Ban</g)?.length).toBe(4);
  });

  it("disables actions on your own message", () => {
    expect(html.match(/disabled=""/g)?.length).toBe(3);
  });

  it("names players seen in chat, excluding you", () => {
    expect(html).toContain("Seen in chat: Wren, Ilse");
  });
});

describe("admin helpers", () => {
  it("caps and reverses recent messages", () => {
    expect(recentForModeration(msgs, 2).map((m) => m.id)).toEqual(["d", "c"]);
  });

  it("dedupes players", () => {
    expect(playersSeenInChat(msgs, "You")).toEqual(["Wren", "Ilse"]);
  });

  it("stubs resolve without data and never fetch", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await moderatePlayer("ban", "Wren")).toBe(false);
    expect(await fetchPlayerList()).toBeNull();
    expect(await fetchServerStatus()).toBeNull();
    expect(info).toHaveBeenCalledTimes(3);
    info.mockRestore();
    const src = readTextFile("./staff.ts") + readTextFile("./AdminPanel.tsx");
    expect(src.replace(/^\s*\*.*$/gm, "")).not.toMatch(/\bfetch\(/);
  });
});

describe("chat feed mirror", () => {
  it("starts with the seed list and notifies on publish", () => {
    expect(getChatFeed()).toBe(SEED_CHAT);
    const fn = vi.fn();
    const off = subscribeChatFeed(fn);
    publishChatFeed(msgs);
    expect(getChatFeed()).toBe(msgs);
    publishChatFeed(msgs);
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    publishChatFeed(SEED_CHAT);
  });
});
