import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  listOutposts,
  plantOutpost,
  type GameState,
} from "@second-crown/sim";
import {
  CampLivingGlyph,
  CampLivingUnderlay,
  resolveCampGlyphDescriptor,
  resolveCampGlyphDescriptorByValues,
} from "./CampLivingGlyph";
import { CampLivingRows } from "./CampLivingRows";
import { ForceCard } from "./ForceCard";

function withCampState(node = "field"): { s: GameState; id: string } {
  const s = createGameState({ seed: 42 });
  const p = s.board.provinces.find((x) => x.id !== s.board.homeProvinceId && x.node === node)!;
  plantOutpost(s, p);
  const flag = listOutposts(s).find((o) => o.id === p.id)!;
  s.flags["garrisons_json"] = JSON.stringify([{ provinceId: flag.id, force: { militia: 4 } }]);
  return { s, id: flag.id };
}

describe("resolveCampGlyphDescriptorByValues", () => {
  it("resolves flying mood with full stock on forage field", () => {
    const desc = resolveCampGlyphDescriptorByValues("field", "flying", 160, 160);
    expect(desc.mood).toBe("flying");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Forage camp");
    expect(desc.flair).toBe("Banner flying · 160 food stockpiled");
    expect(desc.color).toBe("#3fb950");
    expect(desc.motion).toBe("drift");
  });

  it("resolves flying mood with depleted stock", () => {
    const desc = resolveCampGlyphDescriptorByValues("woodcut", "flying", 0, 160);
    expect(desc.mood).toBe("flying");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Timber camp");
    expect(desc.flair).toBe("Banner flying · wood depleted");
    expect(desc.color).toBe("#3fb950");
  });

  it("resolves flying mood on non-gather tile", () => {
    const desc = resolveCampGlyphDescriptorByValues("none", "flying");
    expect(desc.mood).toBe("flying");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Garrison camp");
    expect(desc.flair).toBe("Banner flying · camp secure");
  });

  it("resolves threatened mood with incoming host", () => {
    const desc = resolveCampGlyphDescriptorByValues("quarry", "threatened", 100, 160, {
      realmName: "Dusk Vanguard",
      etaSeconds: 15,
    });
    expect(desc.mood).toBe("threatened");
    expect(desc.tone).toBe("danger");
    expect(desc.label).toBe("Stone redoubt");
    expect(desc.flair).toBe("Dusk Vanguard inbound (15s) · camp watch");
    expect(desc.color).toBe("#f85149");
    expect(desc.motion).toBe("pulse");
    expect(desc.threatSeconds).toBe(15);
    expect(desc.threatRealm).toBe("Dusk Vanguard");
  });

  it("resolves struck mood when flag is not player's", () => {
    const desc = resolveCampGlyphDescriptorByValues("ruins", "struck");
    expect(desc.mood).toBe("struck");
    expect(desc.tone).toBe("warn");
    expect(desc.label).toBe("Ruins claim");
    expect(desc.flair).toBe("Flag struck · post contested");
    expect(desc.color).toBe("#d29922");
    expect(desc.motion).toBe("drift");
  });
});

describe("resolveCampGlyphDescriptor", () => {
  it("resolves from live GameState without threat", () => {
    const { s, id } = withCampState("field");
    const desc = resolveCampGlyphDescriptor(s, id);
    expect(desc.mood).toBe("flying");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Forage camp");
    expect(desc.flair).toContain("Banner flying");
  });

  it("resolves threatened state when incoming march exists", () => {
    const { s, id } = withCampState("woodcut");
    s.flags["marches_json"] = JSON.stringify([
      {
        id: "hostile-1",
        realmId: "rival",
        fromId: "rival-keep",
        toId: id,
        kind: "attack",
        arrivesTick: s.meta.tick + 100,
        travelTicks: 100,
        force: { militia: 10 },
      },
    ]);

    const desc = resolveCampGlyphDescriptor(s, id, (rId) => (rId === "rival" ? "Rival Cohort" : rId));
    expect(desc.mood).toBe("threatened");
    expect(desc.tone).toBe("danger");
    expect(desc.label).toBe("Timber redoubt");
    expect(desc.threatRealm).toBe("Rival Cohort");
    expect(desc.threatSeconds).toBe(10);
  });
});

describe("CampLivingGlyph component", () => {
  it("renders phrasing-only markup with living SVG layers", () => {
    const { s, id } = withCampState();
    const html = renderToStaticMarkup(<CampLivingGlyph state={s} provinceId={id} />);
    expect(html).toContain("sc-camp-living-glyph");
    expect(html).toContain("sc-camp-glyph-icon");
    expect(html).toContain("sc-camp-glyph-label");
    expect(html).toContain("sc-camp-glyph-flair");
    expect(html).toContain("sc-camp-glow-layer");
    expect(html).toContain("sc-camp-drift-layer");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a");
  });

  it("renders corner underlay watermark with radial vignette", () => {
    const html = renderToStaticMarkup(<CampLivingUnderlay mood="flying" node="field" />);
    expect(html).toContain("sc-camp-living-underlay");
    expect(html).toContain("sc-camp-living-watermark");
    expect(html).toContain('viewBox="0 0 34 34"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("integrates seamlessly into ForceCard via CampLivingRows", () => {
    const { s, id } = withCampState("woodcut");
    const html = renderToStaticMarkup(
      <ForceCard
        tone="garrison"
        name="Garrison · power 4"
        dest="2,3"
        living={<CampLivingRows state={s} provinceId={id} />}
        action={{ label: "Recall", onClick: () => {} }}
      />
    );
    expect(html).toContain("sc-camp-card is-living");
    expect(html).toContain("sc-camp-living-underlay");
    expect(html).toContain("sc-camp-rows is-woodcut");
    expect(html).toContain("sc-camp-living-glyph");
    expect(html).toContain("Timber camp");
    expect(html).toContain("Recall");
  });
});
