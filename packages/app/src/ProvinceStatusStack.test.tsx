import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GATHER_NODES, createGameState, isProvinceSeen, nodeStock, nodeStockMax, revealProvince } from "@second-crown/sim";
import { ProvinceStatusStack, provinceStatusRows } from "./ProvinceStatusStack";
import { ProvinceInspect } from "./ProvinceInspect";

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

const KINDS = ["terrain", "owner", "stock", "outpost", "garrison"];

describe("provinceStatusRows", () => {
  it("returns the five rows in order for the home hold", () => {
    const s = fresh();
    const rows = provinceStatusRows(s, s.board.homeProvinceId);
    expect(rows.map((r) => r.kind)).toEqual(KINDS);
    expect(rows.find((r) => r.kind === "owner")).toMatchObject({ value: "You", tone: "you" });
    expect(rows.find((r) => r.kind === "outpost")).toMatchObject({ value: "Your hold", tone: "you" });
  });

  it("returns no rows for an unknown id", () => {
    expect(provinceStatusRows(fresh(), "nope")).toEqual([]);
  });

  it("fog hides terrain, owner, stock, outpost and garrison", () => {
    const s = fresh();
    const p = s.board.provinces.find((x) => x.id !== s.board.homeProvinceId && !isProvinceSeen(s, x.id))!;
    const rows = provinceStatusRows(s, p.id);
    expect(rows.every((r) => r.tone === "fog")).toBe(true);
    expect(rows.find((r) => r.kind === "terrain")?.value).toBe("Unknown");
  });

  it("stock reads nodeStock / nodeStockMax and carries a matching bar", () => {
    const s = fresh();
    const p = s.board.provinces.find((x) => x.node in GATHER_NODES)!;
    revealProvince(s, p.id);
    const row = provinceStatusRows(s, p.id).find((r) => r.kind === "stock")!;
    const have = nodeStock(s, p.id);
    const max = nodeStockMax(p.node);
    expect(row.value.startsWith(`${have}/${max} `)).toBe(true);
    expect(row.bar).toBeCloseTo(have / max);
  });

  it("outpost row reads occupantRealmId: your flag, rival flag", () => {
    const s = fresh();
    const p = s.board.provinces.find(
      (x) => x.id !== s.board.homeProvinceId && x.node !== "hold" && x.node !== "camp"
    )!;
    revealProvince(s, p.id);
    p.occupantRealmId = "player";
    expect(provinceStatusRows(s, p.id).find((r) => r.kind === "outpost")).toMatchObject({ value: "Your flag", tone: "you" });
    const rival = s.realms.find((r) => r.id !== "player")!;
    p.occupantRealmId = rival.id;
    expect(provinceStatusRows(s, p.id).find((r) => r.kind === "outpost")).toMatchObject({
      value: `${rival.name} flag`,
      tone: "rival",
    });
  });

  it("garrison row sums the posted force and shows garrisonPower", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force: { militia: 4, archer: 2 } }]);
    const g = provinceStatusRows(s, id).find((r) => r.kind === "garrison")!;
    expect(g.value.startsWith("6 men · power ")).toBe(true);
    expect(g.tone).toBe("you");
  });

  it("does not mutate state", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    for (const p of s.board.provinces) provinceStatusRows(s, p.id);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("ProvinceStatusStack", () => {
  it("renders a dl with one row per kind", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<ProvinceStatusStack state={s} provinceId={s.board.homeProvinceId} />);
    expect(html).toContain('class="sc-provstat"');
    for (const k of KINDS) expect(html).toContain(`is-${k}`);
  });

  it("sits inside ProvinceInspect", () => {
    const s = fresh();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} onClear={() => {}} act={() => {}} />
    );
    expect(html).toContain("sc-provstat");
  });

  it("css lives in its own file, not theme.css, and honours reduced motion", () => {
    const css = readCssFile("./province-status-stack.css");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("./theme.css")).not.toContain("sc-provstat");
  });
});
