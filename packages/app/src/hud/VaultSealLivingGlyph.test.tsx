import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, resourceLedger } from "@second-crown/sim";
import { VAULT_RESOURCES, VaultLivingCards } from "./VaultLivingCard";
import {
  VaultSealLivingGlyph,
  VaultSealUnderlay,
  resolveVaultSealDescriptor,
} from "./VaultSealLivingGlyph";

function readFile(relativePath: string): string {
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

function fresh() {
  return createGameState({ seed: 1 });
}

describe("resolveVaultSealDescriptor", () => {
  it("resolves descriptors for all four resources", () => {
    const s = fresh();
    for (const res of VAULT_RESOURCES) {
      const desc = resolveVaultSealDescriptor(s, res);
      expect(desc.res).toBe(res);
      expect(desc.label).toBeTruthy();
      expect(desc.flair).toBeTruthy();
      expect(desc.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(["drift", "pulse", "calm"]).toContain(desc.motion);
    }
  });

  it("assigns safe status and drift motion when all stores are hidden", () => {
    const s = fresh();
    s.resources.food = "0";
    const desc = resolveVaultSealDescriptor(s, "food");
    expect(desc.status).toBe("safe");
    expect(desc.tone).toBe("safe");
    expect(desc.motion).toBe("drift");
    expect(desc.flair).toContain("all hidden");
    expect(desc.color).toBe("#3fb950");
  });

  it("assigns exposed status and pulse motion when exposed stores exist", () => {
    const s = fresh();
    const l = resourceLedger(s, "wood");
    s.resources.wood = String(l.vault + 10);
    const desc = resolveVaultSealDescriptor(s, "wood");
    expect(desc.status).toBe("exposed");
    expect(desc.tone).toBe("warn");
    expect(desc.motion).toBe("pulse");
    expect(desc.flair).toContain("exposed");
    expect(desc.color).toBe("#d29922");
  });

  it("assigns full status and danger tone when cap is reached", () => {
    const s = fresh();
    const cap = resourceLedger(s, "stone").cap;
    if (Number.isFinite(cap)) {
      s.resources.stone = String(cap);
      const desc = resolveVaultSealDescriptor(s, "stone");
      expect(desc.status).toBe("full");
      expect(desc.tone).toBe("danger");
      expect(desc.motion).toBe("pulse");
      expect(desc.flair).toContain("capacity reached");
      expect(desc.color).toBe("#f85149");
    }
  });
});

describe("VaultSealLivingGlyph component", () => {
  it("renders 14x14 living seal with three animation layers and aria-hidden", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<VaultSealLivingGlyph state={s} res="gold" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="sc-vault-seal-glyph');
    expect(html).toContain('width="14"');
    expect(html).toContain('height="14"');
    expect(html).toContain("sc-vault-glow-layer");
    expect(html).toContain("sc-vault-pulse-layer");
    expect(html).toContain("sc-vault-drift-layer");
    expect(html).toContain("Treasury seal");
  });

  it("renders 34x34 underlay watermark with aria-hidden", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<VaultSealUnderlay state={s} res="food" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="sc-vault-seal-underlay is-food');
    expect(html).toContain('width="34"');
    expect(html).toContain('height="34"');
  });

  it("renders underlays and living seal strips on all cards in VaultLivingCards", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<VaultLivingCards state={s} />);
    expect(html.match(/sc-vault-seal-glyph/g)?.length).toBe(4);
    expect(html.match(/sc-vault-seal-underlay/g)?.length).toBe(4);
  });
});

describe("VaultLivingCard styling isolation & invariants", () => {
  it("enforces pointer-events: none on decorative layers in vault-living.css", () => {
    const css = readFile("./vault-living.css");
    expect(css).toContain(".sc-vault-seal-underlay");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-vault-seal-glyph");
  });

  it("enforces reduced-motion guard in vault-living.css", () => {
    const css = readFile("./vault-living.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");
  });

  it("keeps theme.css untouched without vault seal leaks", () => {
    const theme = readFile("../theme.css");
    expect(theme).not.toContain("sc-vault-seal");
    expect(theme).not.toContain("sc-vault-card");
  });
});
