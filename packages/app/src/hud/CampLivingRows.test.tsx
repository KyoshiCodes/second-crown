import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, listOutposts, nodeStockMax, plantOutpost, type GameState } from "@second-crown/sim";
import { CampLivingRows, campRows } from "./CampLivingRows";
import { ForceCard } from "./ForceCard";

function withCamp(node = "field"): { s: GameState; id: string } {
  const s = createGameState({ seed: 1 });
  const p = s.board.provinces.find((x) => x.id !== s.board.homeProvinceId && x.node === node)!;
  plantOutpost(s, p);
  const flag = listOutposts(s).find((o) => o.id === p.id)!;
  s.flags["garrisons_json"] = JSON.stringify([{ provinceId: flag.id, force: { militia: 3 } }]);
  return { s, id: flag.id };
}

describe("campRows", () => {
  it("stacks name, flag, resources", () => {
    const { s, id } = withCamp();
    expect(campRows(s, id).map((r) => r.kind)).toEqual(["name", "flag", "resources"]);
  });

  it("names the node and its coordinates", () => {
    const { s, id } = withCamp();
    const p = s.board.provinces.find((x) => x.id === id)!;
    const [name] = campRows(s, id);
    expect(name.value).toBe("Forage field");
    expect(name.sub).toBe(`${p.x},${p.y}`);
  });

  it("reads Flying on your quiet flag", () => {
    const { s, id } = withCamp();
    const flag = campRows(s, id)[1];
    expect(flag.value).toBe("Flying");
    expect(flag.tone).toBe("safe");
  });

  it("reads full node stock from the sim", () => {
    const { s, id } = withCamp();
    const res = campRows(s, id)[2];
    expect(res.value).toBe(`${nodeStockMax("field")} food`);
    expect(res.sub).toBe(`of ${nodeStockMax("field")}`);
    expect(res.tone).toBe("safe");
  });

  it("reads Dry when the stored stock is spent", () => {
    const { s, id } = withCamp();
    s.flags[`node_stock_${id}`] = 0;
    const res = campRows(s, id)[2];
    expect(res.value).toBe("Dry");
    expect(res.tone).toBe("warn");
  });

  it("returns no rows for an unknown tile", () => {
    const { s } = withCamp();
    expect(campRows(s, "nope")).toEqual([]);
  });
});

describe("CampLivingRows in ForceCard", () => {
  it("renders the rows and keeps the Recall control", () => {
    const { s, id } = withCamp();
    const html = renderToStaticMarkup(
      <ForceCard
        tone="garrison"
        name="Garrison · power 3"
        dest="1,1"
        living={<CampLivingRows state={s} provinceId={id} />}
        action={{ label: "Recall", onClick: () => {} }}
      />,
    );
    expect(html).toContain("sc-camp-rows");
    expect(html).toContain("sc-camp-row is-name");
    expect(html).toContain("sc-camp-row is-flag");
    expect(html).toContain("sc-camp-row is-resources");
    expect(html).toContain("Recall");
  });
});
