import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import type { HoldView } from "../net/hold";
import { publishHoldView } from "./holdWatch";
import {
  SharedRealmSeal,
  cleanSharedRealmName,
  resolveSharedRealmInfo,
} from "./SharedRealmSeal";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const SAMPLE_HOLD: HoldView = {
  realmId: "join-oak-hill",
  tick: 14,
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 4,
  training: 1,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [{ tick: 12, by: "alice" }],
  pending: 0,
};

describe("cleanSharedRealmName and resolveSharedRealmInfo", () => {
  it("stays null in solo play with no joined hold", () => {
    const solo = createGameState({ seed: 1 });
    expect(resolveSharedRealmInfo({ state: solo })).toBeNull();
    expect(cleanSharedRealmName("  join-oak-hill ")).toBe("oak-hill");
    expect(cleanSharedRealmName("realm-a")).toBe("realm-a");
  });

  it("prefers shared-realm when sharedRealmIdFn returns an id, and falls back to shared-hold when holdWatch is active", () => {
    const state = createGameState({ seed: 1 });
    expect(
      resolveSharedRealmInfo({
        state,
        holdView: SAMPLE_HOLD,
        sharedRealmIdFn: () => "realm-alpha",
      }),
    ).toEqual({
      scope: "shared-realm",
      realm: "realm-alpha",
      label: "Shared",
      summary: "Shared realm: realm-alpha",
    });

    expect(
      resolveSharedRealmInfo({
        state,
        holdView: SAMPLE_HOLD,
      }),
    ).toEqual({
      scope: "shared-hold",
      realm: "oak-hill",
      label: "Shared hold",
      summary: "Shared hold joined: oak-hill (solo crown stays separate)",
    });

    expect(
      resolveSharedRealmInfo({
        state,
        holdView: SAMPLE_HOLD,
        includeHoldWatch: false,
      }),
    ).toBeNull();
  });
});

describe("SharedRealmSeal rendering", () => {
  it("renders empty in solo play and phrasing-only living seal in shared-realm and compact modes", () => {
    const state = createGameState({ seed: 1 });
    expect(renderToStaticMarkup(<SharedRealmSeal state={state} />)).toBe("");

    const full = renderToStaticMarkup(
      <SharedRealmSeal state={state} sharedRealmIdFn={() => "join-oak-hill"} />,
    );
    expect(full).toContain('data-shared-scope="shared-realm"');
    expect(full).toContain('data-shared-realm="oak-hill"');
    expect(full).toContain("sc-shared-realm-seal is-shared-realm");
    expect(full).toContain("sc-shared-realm-pip");
    expect(full).toContain("sc-shared-realm-ring");
    expect(full).toContain("<svg");
    expect(full).toContain(">Shared</span>");
    expect(full).toContain("· oak-hill");
    expect(full).not.toMatch(/<(div|p|dl)\b/);

    const compact = renderToStaticMarkup(
      <SharedRealmSeal state={state} sharedRealmIdFn={() => "join-oak-hill"} compact />,
    );
    expect(compact).toContain("is-compact");
    expect(compact).toContain(">Shared</span>");
    expect(compact).not.toContain("· oak-hill");
    expect(compact).not.toMatch(/<(div|p|dl)\b/);
  });

  it("subscribes to holdWatch when joined to a shared hold and clears cleanly when left", () => {
    try {
      publishHoldView(SAMPLE_HOLD);
      const html = renderToStaticMarkup(<SharedRealmSeal />);
      expect(html).toContain('data-shared-scope="shared-hold"');
      expect(html).toContain('data-shared-realm="oak-hill"');
      expect(html).toContain("Shared hold");
      expect(html).toContain("· oak-hill");
    } finally {
      publishHoldView(null);
    }
    expect(renderToStaticMarkup(<SharedRealmSeal />)).toBe("");
  });
});

describe("SharedRealmSeal wiring and CSS isolation", () => {
  const css = readTextFile("./shared-realm-seal.css");
  const sealSrc = readTextFile("./SharedRealmSeal.tsx");
  const chromeSrc = readTextFile("../ChromeDock.tsx");
  const shellSrc = readTextFile("../AppShell.tsx");
  const themeCss = readTextFile("../theme.css");
  const holdDensityCss = readTextFile("./hold-density.css");

  it("wires into ChromeDock and AppShell without altering BandToggle or HoldFocusTag", () => {
    expect(sealSrc).toContain('import "./shared-realm-seal.css";');
    expect(chromeSrc).toContain("<SharedRealmSeal />");
    expect(shellSrc).toContain("<BandToggle band={cameraBand} onToggle={toggleCameraBand} />");
    expect(shellSrc).toContain('<HoldFocusTag visible={cameraBand === "hold"} />');
    expect(shellSrc).toContain("<SharedRealmSeal state={state} includeHoldWatch={false} compact />");
    expect(themeCss).not.toContain("sc-shared-realm-seal");
    expect(holdDensityCss).not.toContain("sc-shared-realm-seal");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, reduced motion, and no forbidden selectors", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-shared-realm-seal\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-shared-realm-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-shared-realm-ring\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-shared-realm-icon\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).not.toContain(".sc-ledger-cell::before");
    expect(css).not.toContain(".sc-ledger-cell::after");
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
  });
});
