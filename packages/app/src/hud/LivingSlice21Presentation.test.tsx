import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DECREE_EFFECTS,
  DECREE_SUGGESTIONS,
  DECREE_SUGGEST_SAVE,
  createGameState,
  decreeEffectSummarySnapshot,
  inspectDetailSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { ProvinceInspect } from "../ProvinceInspect";
import { KingdomTab } from "../tabs/KingdomTab";
import {
  DecreeEffectSummaryLine,
  resolveDecreeEffectSummary,
} from "./DecreeEffectSummaryLine";
import {
  InspectDetailSection,
  resolveInspectDetail,
} from "./InspectDetailSection";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Living Realm Slice 21: decree effect summary and province inspect detail", () => {
  it("renders DecreeEffectSummaryLine under CourtDetailLine with effect lines & suggestion, hiding when null or off", () => {
    expect(resolveDecreeEffectSummary(undefined)).toBeNull();
    expect(renderToStaticMarkup(<DecreeEffectSummaryLine state={{} as GameState} />)).toBe("");

    const s = createGameState({ seed: 1 });
    s.meta.tick = 500;
    for (const k of Object.keys(s.flags)) if (k.startsWith("decree_")) delete s.flags[k];
    s.resources.gold = "1000";
    s.resources.food = "1000";

    // Active muster + open affordable decrees -> shows effect + next suggestion
    s.flags.decree_muster_until = 620;
    const snap = decreeEffectSummarySnapshot(s)!;
    expect(snap.active[0]).toMatchObject({ id: "muster", effect: DECREE_EFFECTS.muster });
    expect(snap.suggestion).toBe(DECREE_SUGGESTIONS.rite);

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const detailPos = tabHtml.indexOf("sc-court-detail-line");
    const effectsPos = tabHtml.indexOf("sc-decree-effects-line");
    expect(detailPos).toBeGreaterThan(-1);
    expect(effectsPos).toBeGreaterThan(detailPos);
    expect(tabHtml).toContain('data-effect-decree="muster"');
    expect(tabHtml).toContain(DECREE_EFFECTS.muster);
    expect(tabHtml).toContain(DECREE_SUGGESTIONS.rite);

    // Zero resources -> save suggestion
    s.resources.gold = "0";
    s.resources.food = "0";
    const poorHtml = renderToStaticMarkup(<DecreeEffectSummaryLine state={s} />);
    expect(poorHtml).toContain(DECREE_SUGGEST_SAVE);

    // No player court -> null -> hidden
    const noCourt = createGameState({ seed: 1 });
    noCourt.characters = noCourt.characters.filter((c) => c.realmId !== "player");
    expect(renderToStaticMarkup(<DecreeEffectSummaryLine state={noCourt} />)).toBe("");

    // Switch off -> null -> hidden
    setLivingSwitch(s, "decreeEffects", false);
    expect(renderToStaticMarkup(<DecreeEffectSummaryLine state={s} />)).toBe("");
  });

  it("renders InspectDetailSection inside ProvinceInspect for seen provinces and preserves fog secrecy & off switch", () => {
    expect(resolveInspectDetail(undefined, null)).toBeNull();
    expect(renderToStaticMarkup(<InspectDetailSection state={{} as GameState} provinceId="p1" />)).toBe("");

    const s = createGameState({ seed: 1 });
    s.meta.tick = 400;
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const nodeProv = s.board.provinces.find(
      (p) =>
        p.id !== home.id &&
        isProvinceSeen(s, p.id) &&
        (p.node === "woodcut" || p.node === "quarry" || p.node === "field"),
    ) ?? (() => {
      const p = s.board.provinces.find((q) => q.id !== home.id && isProvinceSeen(s, q.id))!;
      p.node = "woodcut";
      return p;
    })();
    const adjOutpost = s.board.provinces.find(
      (p) =>
        p.id !== nodeProv.id &&
        p.id !== home.id &&
        Math.abs(p.x - nodeProv.x) + Math.abs(p.y - nodeProv.y) <= 2,
    )!;
    adjOutpost.node = "quarry";
    adjOutpost.occupantRealmId = "player";
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_inspect_1",
        realmId: "player",
        fromId: home.id,
        toId: nodeProv.id,
        arrivesTick: 470,
        kind: "node",
        levy: 4,
      },
    ]);

    const snap = inspectDetailSnapshot(s, nodeProv.id)!;
    expect(snap.stock).not.toBeNull();
    expect(snap.outposts.some((o) => o.id === adjOutpost.id)).toBe(true);
    expect(snap.marches[0]).toMatchObject({ id: "m_inspect_1", kind: "node", eta: 70 });

    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={nodeProv.id} onClear={() => {}} act={() => ({ ok: true })} />,
    );
    expect(html).toContain("sc-inspect-detail-section");
    expect(html).toContain(`data-inspect-detail-id="${nodeProv.id}"`);
    expect(html).toContain(`data-inspect-stock-res="${snap.stock!.resource}"`);
    expect(html).toContain(`${snap.stock!.resource} ${snap.stock!.have}/${snap.stock!.max}`);
    expect(html).toContain(`${adjOutpost.x},${adjOutpost.y} (yours)`);
    expect(html).toContain('data-inspect-march-id="m_inspect_1"');
    expect(html).toContain("node ~7s (70t)");

    // Unseen (fogged) tile must NOT render InspectDetailSection inside ProvinceInspect
    const unseen = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id));
    if (unseen) {
      const fogHtml = renderToStaticMarkup(
        <ProvinceInspect state={s} selectedId={unseen.id} onClear={() => {}} act={() => ({ ok: true })} />,
      );
      expect(fogHtml).not.toContain("sc-inspect-detail-section");
    }

    // Switch off -> hides cleanly
    setLivingSwitch(s, "inspectDetail", false);
    expect(
      renderToStaticMarkup(
        <ProvinceInspect state={s} selectedId={nodeProv.id} onClear={() => {}} act={() => ({ ok: true })} />,
      ),
    ).not.toContain("sc-inspect-detail-section");
  });

  it("isolates Slice 21 styles with Dusk/Night/Parchment tokens, non-blocking elements, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./decree-effect-summary.css",
      "./inspect-detail.css",
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
