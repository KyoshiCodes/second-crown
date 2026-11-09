import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createCitizen, createGameState, listBuildableTypes, tryAssignCitizen } from "@second-crown/sim";
import {
  WorkLivingGlyph,
  WorkLivingUnderlay,
  BuildingLivingGlyph,
  BuildingLivingUnderlay,
  getHallDomain,
  getBuildingDomain,
  resolveBuildingGlyphDescriptor,
  resolveWorkGlyphDescriptor,
  type HallDomain,
} from "./WorkLivingGlyph";
import { WorkCard, BuildingCard, BuildingLivingCard } from "./WorkCard";

type B = ReturnType<typeof createGameState>["buildings"][number];

function readCssFile(relativePath: string): string {
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

const noop = () => {};

describe("WorkLivingGlyph and WorkLivingUnderlay", () => {
  it("maps every Kingdom building type to one of five hall domains", () => {
    expect(getHallDomain("farm")).toBe("hearth");
    expect(getHallDomain("granary")).toBe("hearth");
    expect(getHallDomain("cottage")).toBe("hearth");
    expect(getHallDomain("lumber_camp")).toBe("craft");
    expect(getHallDomain("camp")).toBe("craft");
    expect(getHallDomain("sawmill")).toBe("craft");
    expect(getHallDomain("quarry")).toBe("craft");
    expect(getHallDomain("mason")).toBe("craft");
    expect(getHallDomain("gold_mine")).toBe("mint");
    expect(getHallDomain("market")).toBe("mint");
    expect(getHallDomain("mint")).toBe("mint");
    expect(getHallDomain("barracks")).toBe("martial");
    expect(getHallDomain("watchtower")).toBe("martial");
    expect(getHallDomain("walls")).toBe("martial");
    expect(getHallDomain("gate")).toBe("martial");
    expect(getHallDomain("keep")).toBe("martial");
    expect(getHallDomain("academy")).toBe("sanctum");
    expect(getHallDomain("chapel")).toBe("sanctum");
    expect(getHallDomain("infirmary")).toBe("sanctum");
    expect(getHallDomain("custom_hall")).toBe("hearth");

    const seen = new Set(listBuildableTypes().map((t) => getHallDomain(t.id)));
    expect(seen).toEqual(new Set(["hearth", "craft", "mint", "martial", "sanctum"]));
  });

  it("renders distinct SVG geometries across all five hall domains", () => {
    const sampleTypes = ["farm", "quarry", "market", "barracks", "academy"];
    const underlays = sampleTypes.map((typeId) =>
      renderToStaticMarkup(
        <WorkLivingUnderlay typeId={typeId} scarred={false} crewed={true} staffed={true} />,
      ),
    );
    expect(new Set(underlays).size).toBe(5);

    const badges = sampleTypes.map((typeId) =>
      renderToStaticMarkup(
        <WorkLivingGlyph typeId={typeId} scarred={false} crewed={true} staffed={true} />,
      ),
    );
    expect(new Set(badges).size).toBe(5);

    const domains: HallDomain[] = ["hearth", "craft", "mint", "martial", "sanctum"];
    for (let i = 0; i < sampleTypes.length; i++) {
      expect(underlays[i]).toContain(`domain-${domains[i]}`);
      expect(badges[i]).toContain(`domain-${domains[i]}`);
    }
  });

  it("shows domain-authentic flairs for working, standing, uncrewed, and scarred halls", () => {
    expect(
      renderToStaticMarkup(<WorkLivingGlyph typeId="farm" scarred={false} crewed={true} staffed={true} />),
    ).toContain("Hearth lit");
    expect(
      renderToStaticMarkup(<WorkLivingGlyph typeId="quarry" scarred={false} crewed={true} staffed={true} />),
    ).toContain("Yards busy");
    expect(
      renderToStaticMarkup(<WorkLivingGlyph typeId="mint" scarred={false} crewed={true} staffed={true} />),
    ).toContain("Coffers brisk");
    expect(
      renderToStaticMarkup(<WorkLivingGlyph typeId="watchtower" scarred={false} crewed={true} staffed={true} />),
    ).toContain("Beacon lit");
    expect(
      renderToStaticMarkup(<WorkLivingGlyph typeId="chapel" scarred={false} crewed={true} staffed={true} />),
    ).toContain("Sanctum lit");

    const cottage = renderToStaticMarkup(
      <WorkLivingGlyph typeId="cottage" scarred={false} crewed={false} staffed={false} />,
    );
    expect(cottage).toContain("is-standing");
    expect(cottage).toContain("Hearth warm");

    const barracks = renderToStaticMarkup(
      <WorkLivingGlyph typeId="barracks" scarred={false} crewed={false} staffed={false} lifted={true} />,
    );
    expect(barracks).toContain("is-standing is-lifted");
    expect(barracks).toContain("Ward standing");
    expect(barracks).toContain("sc-works-glyph-glint");

    const emptyFarm = renderToStaticMarkup(
      <WorkLivingGlyph typeId="farm" scarred={false} crewed={true} staffed={false} />,
    );
    expect(emptyFarm).toContain("is-idle");
    expect(emptyFarm).toContain("Hall uncrewed");
    expect(emptyFarm).not.toContain("sc-works-glyph-glint");

    const scarred = renderToStaticMarkup(
      <WorkLivingGlyph typeId="farm" scarred={true} crewed={true} staffed={true} lifted={true} />,
    );
    expect(scarred).toContain("is-scarred");
    expect(scarred).not.toContain("is-lifted");
    expect(scarred).toContain("Siege scarred");
    expect(scarred).not.toContain("sc-works-glyph-glint");
  });

  it("uses phrasing-only markup (span + svg) and marks decorative layers aria-hidden", () => {
    const u = renderToStaticMarkup(
      <WorkLivingUnderlay typeId="academy" scarred={false} crewed={false} staffed={false} />,
    );
    const g = renderToStaticMarkup(
      <WorkLivingGlyph typeId="academy" scarred={false} crewed={false} staffed={false} />,
    );
    expect(u).toContain('aria-hidden="true"');
    expect(g).toContain('aria-hidden="true"');
    expect(u).not.toMatch(/<(div|dl|dt|dd|p|section|article)\b/);
    expect(g).not.toMatch(/<(div|dl|dt|dd|p|section|article)\b/);
  });

  it("integrates into WorkCard for staffed, uncrewed, passive, and scarred works without altering buttons", () => {
    const s = createGameState({ seed: 1 });
    const farm = { id: "f1", typeId: "farm", realmId: "player", x: 1, y: 2, level: 1, completesAtTick: null } as B;
    const cottage = { id: "c1", typeId: "cottage", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null } as B;
    s.buildings = [farm, cottage];

    const uncrewedHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop as never} />);
    expect(uncrewedHtml).toContain("sc-works-living-underlay domain-hearth is-idle");
    expect(uncrewedHtml).toContain("Hall uncrewed");

    const cit = createCitizen(s, "player");
    expect(tryAssignCitizen(s, cit.id, "f1")).toBe(true);

    const staffedHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop as never} />);
    expect(staffedHtml).toContain("sc-works-living-underlay domain-hearth is-working");
    expect(staffedHtml).toContain("sc-works-status-glyph domain-hearth is-working");
    expect(staffedHtml).toContain("Hearth lit");
    expect(staffedHtml).toContain("Demolish");

    const passiveHtml = renderToStaticMarkup(<WorkCard state={s} b={cottage} scarred={false} act={noop as never} />);
    expect(passiveHtml).toContain("domain-hearth is-standing");
    expect(passiveHtml).toContain("Hearth warm");
    expect(passiveHtml).toContain("Demolish");

    const scarredHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={true} act={noop as never} />);
    expect(scarredHtml).toContain("domain-hearth is-scarred");
    expect(scarredHtml).toContain("Siege scarred");
    expect(scarredHtml).toContain("Repair (8 stone)");
  });

  it("adds is-lifted when adjacency, pair, or keep bonuses lift a standing work", () => {
    const s = createGameState({ seed: 1 });
    const f1 = { id: "f1", typeId: "farm", realmId: "player", x: 1, y: 1, level: 1, completesAtTick: null } as B;
    const f2 = { id: "f2", typeId: "farm", realmId: "player", x: 2, y: 1, level: 1, completesAtTick: null } as B;
    s.buildings = [f1, f2];
    const html = renderToStaticMarkup(<WorkCard state={s} b={f1} scarred={false} act={noop as never} />);
    expect(html).toContain("is-lifted");
  });

  it("renders compact 32x32 underlay and 14x14 status badge across all buildable types", () => {
    const s = createGameState({ seed: 1 });
    for (const t of listBuildableTypes()) {
      const b = { id: `b_${t.id}`, typeId: t.id, realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null } as B;
      s.buildings = [b];
      const html = renderToStaticMarkup(<WorkCard state={s} b={b} scarred={false} act={noop as never} />);
      expect(html).toContain(`domain-${getHallDomain(t.id)}`);
      expect(html).toContain('width="32" height="32"');
      expect(html).toContain('width="14" height="14"');
    }
  });

  it("scopes card positioning via :has(.sc-works-living-underlay) so other .sc-work-card panels stay untouched", () => {
    const css = readCssFile("./works-living.css");
    expect(css).toContain(".sc-work-card:has(.sc-works-living-underlay)");
    expect(css).not.toMatch(/^\.sc-work-card\s*\{/m);
  });

  it("enforces pointer-events: none, reduced-motion, and style isolation outside theme.css and work-status.css", () => {
    const css = readCssFile("./works-living.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-works-hall-drift");
    expect(css).toContain("@keyframes sc-works-lifted-pulse");
    expect(css).toContain("@keyframes sc-works-scarred-pulse");
    expect(css).toContain("@keyframes sc-works-underlay-drift");
    expect(css).toContain("@keyframes sc-works-underlay-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-works-living");
    expect(themeCss).not.toContain("sc-works-status-glyph");

    const workStatusCss = readCssFile("./work-status.css");
    expect(workStatusCss).not.toContain("sc-works-living");
    expect(workStatusCss).not.toContain("sc-works-status-glyph");
  });

  it("keeps the watermark corner-confined above the footer button with capped low opacity", () => {
    const css = readCssFile("./works-living.css");
    expect(css).toContain("width: 32px;");
    expect(css).toContain("height: 32px;");
    expect(css).toContain("right: 2px;");
    expect(css).toContain("bottom: 24px;");
    expect(css).toContain("mask-image: radial-gradient");

    const wrapperOpacities = [
      ...css.matchAll(/\.sc-works-living-underlay(?:\.[a-z-]+)*\s*\{[^}]*?opacity:\s*([0-9.]+);/g),
    ].map((m) => Number(m[1]));
    expect(wrapperOpacities).toEqual([0.25, 0.29, 0.21, 0.15, 0.28]);
    for (const op of wrapperOpacities) {
      expect(op).toBeLessThanOrEqual(0.35);
    }

    const underlayKf = css.match(/@keyframes sc-works-underlay-(?:drift|pulse)\s*\{[\s\S]*?\n\}/g) ?? [];
    expect(underlayKf.length).toBe(2);
    for (const block of underlayKf) {
      const kfOps = [...block.matchAll(/opacity:\s*([0-9.]+);/g)].map((m) => Number(m[1]));
      expect(kfOps.length).toBeGreaterThan(0);
      for (const op of kfOps) {
        expect(op).toBeLessThan(0.6);
      }
    }
  });

  it("resolves state-aware building descriptors with appropriate motion and flairs", () => {
    const scarredDesc = resolveBuildingGlyphDescriptor({
      typeId: "farm",
      scarred: true,
      crewed: true,
      staffed: true,
      lifted: true,
    });
    expect(scarredDesc.mood).toBe("scarred");
    expect(scarredDesc.motion).toBe("pulse");
    expect(scarredDesc.flair).toBe("Siege scarred");
    expect(scarredDesc.lifted).toBe(false);

    const workingLifted = resolveBuildingGlyphDescriptor({
      typeId: "quarry",
      scarred: false,
      crewed: true,
      staffed: true,
      lifted: true,
    });
    expect(workingLifted.mood).toBe("working");
    expect(workingLifted.motion).toBe("pulse");
    expect(workingLifted.flair).toBe("Yards busy");
    expect(workingLifted.lifted).toBe(true);

    const workingSteady = resolveBuildingGlyphDescriptor({
      typeId: "mint",
      scarred: false,
      crewed: true,
      staffed: true,
      lifted: false,
    });
    expect(workingSteady.mood).toBe("working");
    expect(workingSteady.motion).toBe("drift");
    expect(workingSteady.flair).toBe("Coffers brisk");

    const idleDesc = resolveBuildingGlyphDescriptor({
      typeId: "farm",
      scarred: false,
      crewed: true,
      staffed: false,
    });
    expect(idleDesc.mood).toBe("idle");
    expect(idleDesc.motion).toBe("pulse");
    expect(idleDesc.flair).toBe("Hall uncrewed");

    const standingDesc = resolveBuildingGlyphDescriptor({
      typeId: "cottage",
      scarred: false,
      crewed: false,
      staffed: false,
    });
    expect(standingDesc.mood).toBe("standing");
    expect(standingDesc.motion).toBe("drift");
    expect(standingDesc.flair).toBe("Hearth warm");

    expect(resolveWorkGlyphDescriptor).toBe(resolveBuildingGlyphDescriptor);
    expect(getBuildingDomain).toBe(getHallDomain);
  });

  it("exports BuildingLivingGlyph and BuildingLivingUnderlay aliases rendering identical markup", () => {
    const props = { typeId: "academy", scarred: false, crewed: false, staffed: false };
    const workGlyph = renderToStaticMarkup(<WorkLivingGlyph {...props} />);
    const bldgGlyph = renderToStaticMarkup(<BuildingLivingGlyph {...props} />);
    expect(bldgGlyph).toBe(workGlyph);

    const workUnderlay = renderToStaticMarkup(<WorkLivingUnderlay {...props} />);
    const bldgUnderlay = renderToStaticMarkup(<BuildingLivingUnderlay {...props} />);
    expect(bldgUnderlay).toBe(workUnderlay);

    expect(bldgGlyph).toContain("sc-building-living-glyph");
    expect(bldgGlyph).toContain("sc-building-glow-layer");
    expect(bldgUnderlay).toContain("sc-building-living-underlay");
    expect(BuildingLivingGlyph).toBe(WorkLivingGlyph);
    expect(BuildingLivingUnderlay).toBe(WorkLivingUnderlay);
  });

  it("exports BuildingCard and BuildingLivingCard aliases and marks card with sc-building-card", () => {
    const s = createGameState({ seed: 1 });
    const farm = { id: "f1", typeId: "farm", realmId: "player", x: 1, y: 2, level: 1, completesAtTick: null } as B;
    s.buildings = [farm];
    const html = renderToStaticMarkup(<BuildingLivingCard state={s} b={farm} scarred={false} act={noop as never} />);
    expect(html).toContain("sc-work-card");
    expect(html).toContain("sc-building-card");
    expect(html).toContain("sc-building-living-glyph");
    expect(html).toContain("sc-building-living-underlay");
    expect(BuildingCard).toBe(WorkCard);
  });

  it("includes building-specific keyframes and layer rules in works-living.css", () => {
    const css = readCssFile("./works-living.css");
    expect(css).toContain("@keyframes sc-building-drift");
    expect(css).toContain("@keyframes sc-building-breathe");
    expect(css).toContain(".sc-building-glow-layer");
    expect(css).toContain(".sc-building-pulse-layer");
    expect(css).toContain(".sc-building-drift-layer");
    expect(css).toContain(".sc-building-card:has(.sc-building-living-underlay)");
  });
});
