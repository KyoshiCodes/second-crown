import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, getProvince, isProvinceSeen, neighbors, visionRange } from "@second-crown/sim";
import { FogLine, fogStatus } from "./FogLine";
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

describe("fogStatus", () => {
  it("reports the hold as clear with the sim's vision range", () => {
    const s = fresh();
    const status = fogStatus(s, s.board.homeProvinceId)!;
    expect(status.seen).toBe(true);
    expect(status.label).toBe("Clear");
    expect(status.range).toBe(visionRange(s));
    expect(status.steps).toBe(0);
    expect(status.reason).toContain("always in sight");
  });

  it("agrees with isProvinceSeen on every tile", () => {
    const s = fresh();
    for (const p of s.board.provinces) {
      expect(fogStatus(s, p.id)!.seen).toBe(isProvinceSeen(s, p.id));
    }
  });

  it("counts the tiles in sight across the board", () => {
    const s = fresh();
    const status = fogStatus(s, s.board.homeProvinceId)!;
    expect(status.totalTiles).toBe(s.board.provinces.length);
    expect(status.seenTiles).toBe(s.board.provinces.filter((p) => isProvinceSeen(s, p.id)).length);
    expect(status.seenTiles).toBeLessThan(status.totalTiles);
  });

  it("marks an unseen tile hidden, with steps from the hold and no fog sides", () => {
    const s = fresh();
    const home = getProvince(s, s.board.homeProvinceId)!;
    const far = s.board.provinces.find((p) => !isProvinceSeen(s, p.id))!;
    const status = fogStatus(s, far.id)!;
    expect(status.seen).toBe(false);
    expect(status.label).toBe("Hidden");
    expect(status.steps).toBe(Math.abs(far.x - home.x) + Math.abs(far.y - home.y));
    expect(status.fogSides).toBe(0);
  });

  it("counts fog sides on a seen tile at the edge of vision", () => {
    const s = fresh();
    const edge = s.board.provinces.find(
      (p) => isProvinceSeen(s, p.id) && neighbors(s, p.id).some((n) => !isProvinceSeen(s, n.id))
    )!;
    const status = fogStatus(s, edge.id)!;
    expect(status.fogSides).toBe(neighbors(s, edge.id).filter((n) => !isProvinceSeen(s, n.id)).length);
    expect(status.fogSides).toBeGreaterThan(0);
  });

  it("is null for an unknown province", () => {
    expect(fogStatus(fresh(), "nope")).toBeNull();
  });

  it("does not change the state it reads", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    for (const p of s.board.provinces) fogStatus(s, p.id);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("FogLine", () => {
  it("shows fog off and the vision range on a seen tile", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<FogLine state={s} provinceId={s.board.homeProvinceId} />);
    expect(html).toContain('data-fog="off"');
    expect(html).toContain(`data-vision-range="${visionRange(s)}"`);
    expect(html).toContain(`Clear · Vision ${visionRange(s)}`);
    expect(html).toContain("<details");
    expect(html).not.toContain("scout column");
  });

  it("shows fog on and the scout hint on an unseen tile", () => {
    const s = fresh();
    const far = s.board.provinces.find((p) => !isProvinceSeen(s, p.id))!;
    const html = renderToStaticMarkup(<FogLine state={s} provinceId={far.id} />);
    expect(html).toContain('data-fog="on"');
    expect(html).toContain(`Hidden · Vision ${visionRange(s)}`);
    expect(html).toContain("A scout column lifts it");
    expect(html).toContain("from your hold");
  });

  it("renders nothing without a state or a selection", () => {
    expect(renderToStaticMarkup(<FogLine state={undefined} provinceId="x" />)).toBe("");
    expect(renderToStaticMarkup(<FogLine state={fresh()} provinceId={null} />)).toBe("");
  });

  it("sits inside ProvinceInspect", () => {
    const s = fresh();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} onClear={() => {}} act={() => {}} />
    );
    expect(html).toContain("sc-fog-line");
  });

  it("css lives in its own file, not theme.css", () => {
    expect(readCssFile("./fog-line.css")).toContain(".sc-fog-line");
    expect(readCssFile("../theme.css")).not.toContain("sc-fog-line");
  });
});
