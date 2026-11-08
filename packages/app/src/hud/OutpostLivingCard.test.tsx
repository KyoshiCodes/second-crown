import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, garrisonPower, listOutposts, plantOutpost, type GameState } from "@second-crown/sim";
import { OutpostLivingCard, outpostRows } from "./OutpostLivingCard";

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

function withFlag(): { s: GameState; id: string } {
  const s = createGameState({ seed: 1 });
  const p = s.board.provinces.find((x) => x.id !== s.board.homeProvinceId && x.node !== "hold")!;
  plantOutpost(s, p);
  const flag = listOutposts(s).find((o) => o.id === p.id)!;
  return { s, id: flag.id };
}

const tileOf = (s: GameState, id: string) => s.board.provinces.find((p) => p.id === id)!;

describe("outpostRows", () => {
  it("stacks name, camp, flag", () => {
    const { s, id } = withFlag();
    expect(outpostRows(s, tileOf(s, id)).map((r) => r.kind)).toEqual(["name", "camp", "flag"]);
  });

  it("names the node and its coordinates", () => {
    const { s, id } = withFlag();
    const p = tileOf(s, id);
    const name = outpostRows(s, p)[0];
    expect(name.value).toBe("Forage field");
    expect(name.sub).toBe(`${p.x},${p.y}`);
  });

  it("reads Unguarded and Flying for a bare, quiet flag", () => {
    const { s, id } = withFlag();
    const [, camp, flag] = outpostRows(s, tileOf(s, id));
    expect(camp.value).toBe("Unguarded");
    expect(camp.tone).toBe("warn");
    expect(flag.value).toBe("Flying");
    expect(flag.tone).toBe("safe");
  });

  it("shows garrison power and soldier count from the stored garrison", () => {
    const { s, id } = withFlag();
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force: { militia: 3, skirmisher: 2 } }]);
    const camp = outpostRows(s, tileOf(s, id))[1];
    expect(camp.value).toBe(`Garrison ${garrisonPower(s, id)}`);
    expect(camp.sub).toBe("5 soldiers");
    expect(camp.tone).toBe("safe");
  });

  it("flags an inbound rival with name and seconds", () => {
    const { s, id } = withFlag();
    const rival = s.realms.find((r) => r.id !== "player")!;
    s.flags["marches_json"] = JSON.stringify([
      { id: "m1", realmId: rival.id, fromId: id, toId: id, arrivesTick: s.meta.tick + 50, kind: "hold", levy: 1 },
    ]);
    const [, camp, flag] = outpostRows(s, tileOf(s, id), () => "Raiders");
    expect(flag.value).toBe("Under threat");
    expect(flag.sub).toBe("Raiders in 5s");
    expect(flag.tone).toBe("danger");
    expect(camp.tone).toBe("danger");
  });

  it("does not change state", () => {
    const { s, id } = withFlag();
    const before = JSON.stringify(s);
    renderToStaticMarkup(<OutpostLivingCard state={s} province={tileOf(s, id)} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("OutpostLivingCard", () => {
  it("renders three living rows with tones", () => {
    const { s, id } = withFlag();
    const html = renderToStaticMarkup(<OutpostLivingCard state={s} province={tileOf(s, id)} />);
    expect(html).toContain("sc-outpost-card is-living");
    expect(html).toContain("is-bare");
    expect((html.match(/sc-outpost-card-row /g) ?? []).length).toBe(3);
    expect(html).toContain("tone-warn");
  });

  it("keeps the Abandon control on the Kingdom tab flag card", () => {
    const src = readFile("../tabs/KingdomTab.tsx");
    expect(src).toContain("<OutpostLivingCard");
    expect(src).toContain("tryAbandonOutpost(st, p.id)");
  });

  it("uses its own CSS file, scoped to .sc-outpost-card", () => {
    const css = readFile("./outpost-living.css");
    expect(css).toContain(".sc-outpost-card");
    expect(css).toContain("prefers-reduced-motion");
  });
});
