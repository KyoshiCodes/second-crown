import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  COURT_GUIDANCE_IDLE,
  boardInteractionDetailSnapshot,
  courtDetailSnapshot,
  createGameState,
  researchDetailSnapshot,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { KingdomTab } from "../tabs/KingdomTab";
import { BoardFeedbackLayer } from "./BoardFeedbackLayer";
import {
  BoardNearbyFriendlyMark,
  resolveBoardNearbyFriendly,
} from "./BoardInteractionDetailOverlay";
import { CourtDetailLine, resolveCourtDetail } from "./CourtDetailLine";
import {
  ResearchDetailExpander,
  resolveResearchDetail,
} from "./ResearchDetailExpander";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Living Realm Slice 19: research, court, and board interaction detail", () => {
  it("renders a collapsed-by-default Next unlocks expander from researchDetailSnapshot and hides when empty or off", () => {
    expect(resolveResearchDetail(undefined)).toBeNull();
    expect(resolveResearchDetail({} as GameState)).toBeNull();
    expect(renderToStaticMarkup(<ResearchDetailExpander state={{} as GameState} />)).toBe("");

    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.meta.tick = 100;
    const snap = researchDetailSnapshot(s)!;
    expect(snap.nextUnlocks.length).toBeGreaterThan(0);

    const html = renderToStaticMarkup(<ResearchDetailExpander state={s} />);
    expect(html).toContain('<details class="sc-research-detail"');
    expect(html).not.toContain('open=""');
    expect(html).not.toContain(" open>");
    expect(html).toContain(`Next unlocks (${snap.nextUnlocks.length})`);
    for (const u of snap.nextUnlocks) {
      expect(html).toContain(`data-unlock-id="${u.id}"`);
      expect(html).toContain(u.name);
      if (u.requires.length === 0) {
        expect(html).toContain(">ready<");
      } else {
        expect(html).toContain(`needs ${u.requires.join(", ")}`);
      }
    }

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const progressPos = tabHtml.indexOf("is-research");
    const detailPos = tabHtml.indexOf("sc-research-detail");
    expect(progressPos).toBeGreaterThan(-1);
    expect(detailPos).toBeGreaterThan(progressPos);

    // Hide when living_research_detail is off
    setLivingSwitch(s, "researchDetail", false);
    expect(renderToStaticMarkup(<ResearchDetailExpander state={s} />)).toBe("");

    // Hide when nextUnlocks is empty (all studies completed)
    setLivingSwitch(s, "researchDetail", true);
    for (let guard = 0; guard < 12; guard++) {
      const remaining = researchDetailSnapshot(s)!.nextUnlocks;
      if (remaining.length === 0) break;
      for (const u of remaining) {
        s.flags[`research_${u.id}`] = 1;
      }
    }
    expect(researchDetailSnapshot(s)!.nextUnlocks).toEqual([]);
    expect(renderToStaticMarkup(<ResearchDetailExpander state={s} />)).toBe("");
  });

  it("renders CourtDetailLine under CourtStatusLine with guidance and active decree ticks-left, hiding when null or off", () => {
    expect(resolveCourtDetail(undefined)).toBeNull();
    expect(renderToStaticMarkup(<CourtDetailLine state={{} as GameState} />)).toBe("");

    const s = createGameState({ seed: 1 });
    s.meta.tick = 500;
    for (const k of Object.keys(s.flags)) if (k.startsWith("decree_")) delete s.flags[k];

    // Idle court shows guidance
    const idleSnap = courtDetailSnapshot(s)!;
    expect(idleSnap.active).toEqual([]);
    expect(idleSnap.guidance).toBe(COURT_GUIDANCE_IDLE);

    const idleTab = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const courtPos = idleTab.indexOf("is-court");
    const detailPos = idleTab.indexOf("sc-court-detail-line");
    expect(courtPos).toBeGreaterThan(-1);
    expect(detailPos).toBeGreaterThan(courtPos);
    expect(idleTab).toContain(COURT_GUIDANCE_IDLE);

    // Active decree shows ticks left & approx seconds
    s.flags.decree_muster_until = 620;
    const activeSnap = courtDetailSnapshot(s)!;
    expect(activeSnap.active[0]).toMatchObject({ id: "muster", ticksLeft: 120 });

    const activeHtml = renderToStaticMarkup(<CourtDetailLine state={s} />);
    expect(activeHtml).toContain('data-decree-id="muster"');
    expect(activeHtml).toContain('data-decree-ticks="120"');
    expect(activeHtml).toContain(activeSnap.active[0].name);
    expect(activeHtml).toContain("~12s (120t)");

    // No player character -> null -> hidden
    const noCourt = createGameState({ seed: 1 });
    noCourt.characters = noCourt.characters.filter((c) => c.realmId !== "player");
    expect(renderToStaticMarkup(<CourtDetailLine state={noCourt} />)).toBe("");

    // Switch off -> null -> hidden
    setLivingSwitch(s, "courtDetail", false);
    expect(renderToStaticMarkup(<CourtDetailLine state={s} />)).toBe("");
  });

  it("renders non-blocking nearby-friendly mark on BoardFeedbackLayer when a province is selected and hides when unselected or off", () => {
    expect(resolveBoardNearbyFriendly(undefined)).toBeNull();

    const s = createGameState({ seed: 1 });
    s.meta.tick = 400;
    s.wars = [];
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const adj = s.board.provinces.find(
      (p) =>
        p.id !== home.id &&
        Math.abs(p.x - home.x) + Math.abs(p.y - home.y) <= 2,
    )!;
    const npcRealm = s.realms.find((r) => r.id !== "player")!;
    adj.occupantRealmId = npcRealm.id;
    s.flags[`peace_player_${npcRealm.id}`] = 900;

    // Unselected -> null / omitted
    expect(resolveBoardNearbyFriendly(s, { selectedProvinceId: null })).toBeNull();
    expect(
      renderToStaticMarkup(<svg><BoardNearbyFriendlyMark state={s} selectedId={null} /></svg>),
    ).toBe("<svg></svg>");

    // Selected -> shows non-blocking nearby friendly pill
    const snap = boardInteractionDetailSnapshot(s, { selectedProvinceId: home.id })!;
    expect(snap.nearbyFriendly).toContain(npcRealm.id);

    const html = renderToStaticMarkup(
      <BoardLiving state={s} selectedId={home.id} visible />,
    );
    expect(html).toContain("sc-fb-layer");
    expect(html).toContain("sc-fb-nearby");
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain(`data-fb-nearby-realms="${snap.nearbyFriendly.join(",")}"`);
    expect(html).toContain(`Near: ${npcRealm.name}`);

    // Switch off -> omitted while selection rim remains
    setLivingSwitch(s, "boardDetail", false);
    const offHtml = renderToStaticMarkup(
      <svg><BoardFeedbackLayer state={s} selectedId={home.id} /></svg>,
    );
    expect(offHtml).toContain("sc-fb-layer");
    expect(offHtml).not.toContain("sc-fb-nearby");
  });

  it("isolates Slice 19 styles with Dusk/Night/Parchment tokens, non-blocking elements, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./research-detail.css",
      "./court-detail.css",
      "./board-interaction-detail.css",
    ]) {
      const css = readTextFile(cssPath);
      expect(css, cssPath).toContain(':root[data-chrome="dusk"]');
      expect(css, cssPath).toContain(':root[data-chrome="night"]');
      expect(css, cssPath).toContain(':root[data-chrome="parchment"]');
      expect(css, cssPath).toContain("pointer-events: none !important;");
      expect(css, cssPath).toContain("@media (prefers-reduced-motion: reduce)");
      for (const token of forbidden) {
        expect(css, `${cssPath} should not contain ${token}`).not.toContain(token);
      }
    }
  });
});
