import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen } from "@second-crown/sim";
import { AtlasProvinceCards, atlasProvinceRows } from "./AtlasProvinceCard";
import { OverworldAtlas } from "../OverworldAtlas";

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

describe("atlasProvinceRows", () => {
  it("stacks name, terrain, owner for the home hold", () => {
    const s = fresh();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const rows = atlasProvinceRows(s, home.id);
    expect(rows.map((r) => r.kind)).toEqual(["name", "terrain", "owner"]);
    expect(rows[0]).toMatchObject({ value: "Your hold", sub: `${home.x},${home.y}`, tone: "you" });
    expect(rows[1]).toMatchObject({ terrain: home.terrain, tone: "calm" });
    expect(rows[2]).toMatchObject({ value: "You", tone: "you" });
  });

  it("returns no rows for an unknown id", () => {
    expect(atlasProvinceRows(fresh(), "nope")).toEqual([]);
  });

  it("fog hides name, terrain and owner but keeps coords", () => {
    const s = fresh();
    const hidden = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId && !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const rows = atlasProvinceRows(s, hidden!.id);
    expect(rows.map((r) => r.tone)).toEqual(["fog", "fog", "fog"]);
    expect(rows[0]).toMatchObject({ value: "Uncharted", sub: `${hidden!.x},${hidden!.y}` });
  });

  it("does not change state", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    for (const p of s.board.provinces) atlasProvinceRows(s, p.id);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("AtlasProvinceCards", () => {
  it("falls back to a home card when nothing is selected", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<AtlasProvinceCards state={s} selectedId={null} />);
    expect(html).toContain("sc-atlas-card is-home");
    expect(html).toContain("Your hold");
  });

  it("shows selected and hover cards side by side", () => {
    const s = fresh();
    const other = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
    const html = renderToStaticMarkup(
      <AtlasProvinceCards state={s} selectedId={s.board.homeProvinceId} hoveredId={other.id} />
    );
    expect(html).toContain("is-selected");
    expect(html).toContain("is-hover");
    expect(html).not.toContain("is-home");
  });

  it("renders under the atlas and keeps the Recenter control", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<OverworldAtlas state={s} selectedId={s.board.homeProvinceId} />);
    expect(html).toContain("Recenter");
    expect(html).toContain("sc-atlas-cards");
    expect(html.indexOf("</svg>")).toBeLessThan(html.indexOf("sc-atlas-cards"));
  });

  it("styles live in atlas-living.css, not theme.css", () => {
    expect(readFile("./atlas-living.css")).toContain(".sc-atlas-card-row");
    expect(readFile("../theme.css")).not.toContain("sc-atlas-card");
  });
});
