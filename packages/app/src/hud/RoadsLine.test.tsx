import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, neighbors } from "@second-crown/sim";
import { listBoardRoads } from "@second-crown/render";
import { RoadsLine, roadsStatus } from "./RoadsLine";
import { ProvinceInspect } from "../ProvinceInspect";

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

function fresh() {
  return createGameState({ seed: 1 });
}

describe("roadsStatus", () => {
  it("lists one link per neighbour of the home hold", () => {
    const s = fresh();
    const home = s.board.homeProvinceId;
    const status = roadsStatus(s, home)!;
    expect(status.visible).toBe(true);
    expect(status.links.map((l) => l.toId).sort()).toEqual(
      neighbors(s, home)
        .map((n) => n.id)
        .sort()
    );
  });

  it("matches the roads the board draws for that tile", () => {
    const s = fresh();
    const home = s.board.homeProvinceId;
    const drawn = listBoardRoads(s).filter((r) => r.fromId === home || r.toId === home);
    const status = roadsStatus(s, home)!;
    expect(status.links).toHaveLength(drawn.length);
    for (const r of drawn) {
      const other = r.fromId === home ? r.toId : r.fromId;
      const link = status.links.find((l) => l.toId === other)!;
      expect(link.kind).toBe(r.intoFog ? "fog" : r.kind);
    }
  });

  it("names a trail into fog without giving away the hidden terrain", () => {
    const s = fresh();
    const edge = s.board.provinces.find(
      (p) => isProvinceSeen(s, p.id) && neighbors(s, p.id).some((n) => !isProvinceSeen(s, n.id))
    )!;
    const status = roadsStatus(s, edge.id)!;
    const fog = status.links.filter((l) => l.kind === "fog");
    expect(fog.length).toBeGreaterThan(0);
    for (const l of fog) {
      expect(l.label).toBe("Trail");
      expect(l.target.startsWith("fog ")).toBe(true);
    }
    expect(status.summary).toContain("into fog");
  });

  it("says hidden by fog on an unseen tile and lists nothing", () => {
    const s = fresh();
    const far = s.board.provinces.find((p) => !isProvinceSeen(s, p.id))!;
    const status = roadsStatus(s, far.id)!;
    expect(status.visible).toBe(false);
    expect(status.links).toEqual([]);
    expect(status.summary).toBe("Hidden by fog");
  });

  it("is null for an unknown province", () => {
    expect(roadsStatus(fresh(), "nope")).toBeNull();
  });

  it("does not change the state it reads", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    roadsStatus(s, s.board.homeProvinceId);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("RoadsLine", () => {
  it("renders an open toggle with the list on a seen tile", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<RoadsLine state={s} provinceId={s.board.homeProvinceId} />);
    expect(html).toContain("<details");
    expect(html).toContain("open");
    expect(html).toContain("sc-roads-list");
    expect(html).toContain('data-roads-visible="true"');
  });

  it("renders a plain status with no list on an unseen tile", () => {
    const s = fresh();
    const far = s.board.provinces.find((p) => !isProvinceSeen(s, p.id))!;
    const html = renderToStaticMarkup(<RoadsLine state={s} provinceId={far.id} />);
    expect(html).toContain("Hidden by fog");
    expect(html).not.toContain("<details");
    expect(html).not.toContain("sc-roads-list");
  });

  it("renders nothing without a state or a selection", () => {
    expect(renderToStaticMarkup(<RoadsLine state={undefined} provinceId="x" />)).toBe("");
    expect(renderToStaticMarkup(<RoadsLine state={fresh()} provinceId={null} />)).toBe("");
  });

  it("sits inside ProvinceInspect", () => {
    const s = fresh();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} onClear={() => {}} act={() => {}} />
    );
    expect(html).toContain("sc-roads-line");
  });

  it("css lives in its own file, not theme.css", () => {
    expect(readCssFile("./roads-line.css")).toContain(".sc-roads-line");
    expect(readCssFile("../theme.css")).not.toContain("sc-roads");
  });
});
