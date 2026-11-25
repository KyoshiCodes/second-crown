import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ACTION_CONFIRM_LABEL,
  ADMIN_ACTION_FLASH_MS,
  AdminPanel,
  detectFlaggedMessage,
  isMessageFlagged,
  resolveAdminPlayerStatus,
} from "./AdminPanel";
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
const SAMPLE_MSGS: ChatMessage[] = [
  { id: "a", author: "Wren", text: "hello", at: NOW - 60_000 },
  { id: "b", author: "You", text: "mine", at: NOW - 30_000, local: true },
  { id: "c", author: "Ilse", text: "hi", at: NOW - 10_000 },
  { id: "d", author: "Wren", text: "again", at: NOW },
];

describe("admin living helpers", () => {
  it("maps moderation marks to player status", () => {
    expect(resolveAdminPlayerStatus(undefined)).toBe("online");
    expect(resolveAdminPlayerStatus("mute")).toBe("muted");
    expect(resolveAdminPlayerStatus("kick")).toBe("kicked");
    expect(resolveAdminPlayerStatus("ban")).toBe("banned");
  });

  it("flags shouting or spam text without flagging normal seed messages", () => {
    for (const msg of SEED_CHAT) {
      expect(detectFlaggedMessage(msg.text)).toBe(false);
    }
    for (const msg of SAMPLE_MSGS) {
      expect(detectFlaggedMessage(msg.text)).toBe(false);
    }
    expect(detectFlaggedMessage("STOP SPAMMING THE REALM CHAT NOW")).toBe(true);
    expect(detectFlaggedMessage("Wait what is going on!!!!")).toBe(true);
  });

  it("recognizes explicit flagged IDs and armed Ban targets", () => {
    const cleanMsg = SAMPLE_MSGS[0];
    expect(isMessageFlagged(cleanMsg)).toBe(false);
    expect(isMessageFlagged(cleanMsg, { flaggedIds: ["a"] })).toBe(true);
    expect(isMessageFlagged(cleanMsg, { flaggedIds: new Set(["a"]) })).toBe(true);
    expect(isMessageFlagged(cleanMsg, { armedBanId: "a" })).toBe(true);
    expect(isMessageFlagged(cleanMsg, { armedBanId: "d" })).toBe(false);
  });
});

describe("admin living UI accents", () => {
  it("renders living online status pips on message rows and player rows by default", () => {
    const html = renderToStaticMarkup(<AdminPanel forceStaff messages={SAMPLE_MSGS} now={NOW} />);
    expect(html.match(/data-admin-status-pip="online"/g)?.length).toBe(6);
    expect(html.match(/class="sc-admin-status-ring"/g)?.length).toBe(6);
    expect(html.match(/data-admin-player="(Wren|Ilse)"/g)?.length).toBe(2);
    expect(html).toContain("Seen in chat: Wren, Ilse");
  });

  it("transitions status pips between muted, kicked, and banned via marksOverride", () => {
    const html = renderToStaticMarkup(
      <AdminPanel
        forceStaff
        messages={SAMPLE_MSGS}
        now={NOW}
        marksOverride={{ Wren: "mute", Ilse: "ban" }}
      />,
    );
    expect(html.match(/data-admin-status-pip="muted"/g)?.length).toBe(3); // 2 Wren msgs + 1 player row
    expect(html.match(/data-admin-status-pip="banned"/g)?.length).toBe(2); // 1 Ilse msg + 1 player row
    expect(html.match(/data-admin-status-pip="online"/g)?.length).toBe(1); // Your own row

    const kickHtml = renderToStaticMarkup(
      <AdminPanel
        forceStaff
        messages={SAMPLE_MSGS}
        now={NOW}
        marksOverride={{ Ilse: "kick" }}
      />,
    );
    expect(kickHtml.match(/data-admin-status-pip="kicked"/g)?.length).toBe(2);
  });

  it("applies flagged state and warning classes on flagged rows and armed Ban rows", () => {
    const flaggedHtml = renderToStaticMarkup(
      <AdminPanel forceStaff messages={SAMPLE_MSGS} now={NOW} flaggedIdsOverride={["a"]} />,
    );
    expect(flaggedHtml).toContain('class="sc-admin-row is-flagged" data-admin-msg="a"');
    expect(flaggedHtml).toContain('data-admin-flagged="true"');
    expect(flaggedHtml.match(/class="sc-admin-flag-pill"/g)?.length).toBe(1);

    const armedHtml = renderToStaticMarkup(
      <AdminPanel forceStaff messages={SAMPLE_MSGS} now={NOW} armedBanOverride="d" />,
    );
    expect(armedHtml).toContain('class="sc-admin-row is-flagged" data-admin-msg="d"');
    expect(armedHtml).toContain("sc-admin-btn act-ban is-armed");
    expect(armedHtml).toContain(">Confirm ban<");
  });

  it("renders a gentle confirmation flash on the targeted row and player row", () => {
    for (const action of ["mute", "kick", "ban"] as const) {
      const html = renderToStaticMarkup(
        <AdminPanel
          forceStaff
          messages={SAMPLE_MSGS}
          now={NOW}
          actionFlashOverride={{ msgId: "d", author: "Wren", action }}
        />,
      );
      expect(html).toContain(`sc-admin-row is-action-flash flash-${action}`);
      expect(html).toContain(`sc-admin-player-row is-action-flash flash-${action}`);
      expect(html).toContain(`data-admin-flash="${action}"`);
      expect(html).toContain(`✓ ${ADMIN_ACTION_CONFIRM_LABEL[action]}`);
    }
    expect(ADMIN_ACTION_FLASH_MS).toBe(1400);
  });
});

describe("admin-living.css isolation and safety", () => {
  const css = readTextFile("./admin-living.css");
  const panelSrc = readTextFile("./AdminPanel.tsx");

  it("is imported after admin-panel.css in AdminPanel.tsx", () => {
    const baseIdx = panelSrc.indexOf('import "./admin-panel.css";');
    const livingIdx = panelSrc.indexOf('import "./admin-living.css";');
    expect(baseIdx).toBeGreaterThan(-1);
    expect(livingIdx).toBeGreaterThan(baseIdx);
  });

  it("supports Dusk, Night, and Parchment chrome themes and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses pointer-events: none !important on decorative pips, pills, and sweeps", () => {
    expect(css).toMatch(/\.sc-admin-status-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-admin-flag-pill\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-admin-confirm-pill\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/is-action-flash::after[\s\S]*?pointer-events:\s*none\s*!important/);
  });

  it("defines keyframes for warning pulses, status pips, and action confirmation", () => {
    expect(css).toContain("@keyframes sc-admin-warn-pulse-mute");
    expect(css).toContain("@keyframes sc-admin-warn-pulse-kick");
    expect(css).toContain("@keyframes sc-admin-warn-pulse-ban");
    expect(css).toContain("@keyframes sc-admin-pip-online");
    expect(css).toContain("@keyframes sc-admin-pip-ring");
    expect(css).toContain("@keyframes sc-admin-flash-mute");
    expect(css).toContain("@keyframes sc-admin-flash-kick");
    expect(css).toContain("@keyframes sc-admin-flash-ban");
  });

  it("does not touch board, chat, news, or theme dock selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-news-float");
    expect(css).not.toContain(".sc-theme-dock");
  });
});
