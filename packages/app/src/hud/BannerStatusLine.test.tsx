import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  garrisonPower,
  isProvinceSeen,
  keepLevel,
  neighbors,
  plantOutpost,
  type GameState,
} from "@second-crown/sim";
import {
  BannerStatusLine,
  flagBannerStatus,
  flagsSummaryStatus,
  keepBannerStatus,
} from "./BannerStatusLine";
import { ProvinceInspect } from "../ProvinceInspect";
import { KingdomTab } from "../tabs/KingdomTab";

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

function fresh(): GameState {
  return createGameState({ seed: 1 });
}

/** Plants player flags on the first `count` tiles next to the home hold (all seen). */
function withFlags(count = 1): { s: GameState; ids: string[] } {
  const s = fresh();
  const tiles = neighbors(s, s.board.homeProvinceId).slice(0, count);
  for (const t of tiles) {
    t.node = "field";
    plantOutpost(s, t);
  }
  return { s, ids: tiles.map((t) => t.id) };
}

function rivalId(s: GameState): string {
  return s.realms.find((r) => r.id !== "player")!.id;
}

function sendHost(s: GameState, toIds: string[], ticks = 50): void {
  s.flags["marches_json"] = JSON.stringify(
    toIds.map((toId, i) => ({
      id: `m${i}`,
      realmId: rivalId(s),
      fromId: toId,
      toId,
      arrivesTick: s.meta.tick + ticks + i * 100,
      kind: "hold",
      levy: 1,
    })),
  );
}

function garrison(s: GameState, id: string, force: Record<string, number>): void {
  s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force }]);
}

describe("keepBannerStatus", () => {
  it("flies with no host inbound and no flags on a fresh game", () => {
    const s = fresh();
    const st = keepBannerStatus(s);
    expect(st.tone).toBe("safe");
    expect(st.headline).toBe("Flying");
    expect(st.text).toBe(`Keep banner: Flying · no host inbound · Keep level ${keepLevel(s)} · no flags planted`);
  });

  it("counts planted flags", () => {
    const { s } = withFlags(2);
    expect(keepBannerStatus(s).parts).toContain("2 flags out, all quiet");
    expect(keepBannerStatus(withFlags(1).s).parts).toContain("1 flag out, all quiet");
  });

  it("goes amber when a flag is under threat but the keep is not", () => {
    const { s, ids } = withFlags(2);
    sendHost(s, [ids[0]]);
    const st = keepBannerStatus(s);
    expect(st.tone).toBe("warn");
    expect(st.headline).toBe("Flying");
    expect(st.parts).toContain("2 flags out, 1 under threat");
  });

  it("goes red and names the soonest host marching on the keep", () => {
    const s = fresh();
    const home = s.board.homeProvinceId;
    sendHost(s, [home, home], 50);
    const st = keepBannerStatus(s, () => "Raiders");
    expect(st.tone).toBe("danger");
    expect(st.headline).toBe("Under threat");
    expect(st.parts[0]).toBe("Raiders arrives in 5s");
    expect(st.parts).toContain("2 hosts marching on the keep");
  });

  it("uses the realm's own name when no resolver is passed", () => {
    const s = fresh();
    sendHost(s, [s.board.homeProvinceId]);
    const name = s.realms.find((r) => r.id === rivalId(s))!.name;
    expect(keepBannerStatus(s).parts[0]).toBe(`${name} arrives in 5s`);
  });
});

describe("flagBannerStatus", () => {
  it("is null on the home hold, on a quiet tile and on a hostile camp", () => {
    const s = fresh();
    const tile = neighbors(s, s.board.homeProvinceId)[0];
    tile.node = "none";
    tile.occupantRealmId = null;
    expect(flagBannerStatus(s, s.board.homeProvinceId)).toBeNull();
    expect(flagBannerStatus(s, tile.id)).toBeNull();
    tile.node = "camp";
    expect(flagBannerStatus(s, tile.id)).toBeNull();
    expect(flagBannerStatus(s, "no-such-tile")).toBeNull();
  });

  it("keeps a rival flag hidden on an unseen tile", () => {
    const s = fresh();
    const far = s.board.provinces.find((p) => !isProvinceSeen(s, p.id))!;
    far.node = "field";
    far.occupantRealmId = rivalId(s);
    expect(isProvinceSeen(s, far.id)).toBe(false);
    expect(flagBannerStatus(s, far.id)).toBeNull();
  });

  it("warns on an unguarded flag", () => {
    const { s, ids } = withFlags();
    const st = flagBannerStatus(s, ids[0])!;
    expect(st.kind).toBe("flag");
    expect(st.tone).toBe("warn");
    expect(st.text).toBe("Your flag: Unguarded · no host inbound · post a garrison to hold it");
  });

  it("flies green with the stored garrison's power and soldier count", () => {
    const { s, ids } = withFlags();
    garrison(s, ids[0], { militia: 3, skirmisher: 2 });
    const st = flagBannerStatus(s, ids[0])!;
    expect(st.tone).toBe("safe");
    expect(st.headline).toBe("Flying");
    expect(st.parts).toEqual(["no host inbound", `garrison power ${garrisonPower(s, ids[0])} (5 soldiers)`]);
  });

  it("goes red with the host's name and seconds when a host is inbound", () => {
    const { s, ids } = withFlags();
    sendHost(s, [ids[0]]);
    const st = flagBannerStatus(s, ids[0], () => "Raiders")!;
    expect(st.tone).toBe("danger");
    expect(st.text).toBe("Your flag: Under threat · Raiders arrives in 5s · no garrison");
  });

  it("names the realm on a rival flag", () => {
    const s = fresh();
    const tile = neighbors(s, s.board.homeProvinceId)[0];
    tile.node = "field";
    tile.occupantRealmId = rivalId(s);
    const st = flagBannerStatus(s, tile.id, () => "Raiders")!;
    expect(st.kind).toBe("rival");
    expect(st.title).toBe("Raiders flag");
    expect(st.tone).toBe("calm");
  });
});

describe("flagsSummaryStatus", () => {
  it("is null with no flags", () => {
    expect(flagsSummaryStatus(fresh())).toBeNull();
  });

  it("counts guarded and unguarded flags", () => {
    const { s, ids } = withFlags(2);
    garrison(s, ids[0], { militia: 2 });
    const st = flagsSummaryStatus(s)!;
    expect(st.tone).toBe("warn");
    expect(st.text).toBe("Flags: 2 flags planted · 1 guarded · 1 unguarded · no host inbound");
  });

  it("is green when every flag is guarded", () => {
    const { s, ids } = withFlags(1);
    garrison(s, ids[0], { militia: 2 });
    expect(flagsSummaryStatus(s)!.tone).toBe("safe");
  });

  it("goes red and counts threatened flags once each", () => {
    const { s, ids } = withFlags(2);
    sendHost(s, [ids[0], ids[0]]);
    const st = flagsSummaryStatus(s)!;
    expect(st.tone).toBe("danger");
    expect(st.parts).toContain("1 under threat");
  });
});

describe("BannerStatusLine", () => {
  it("renders nothing without a status", () => {
    expect(renderToStaticMarkup(<BannerStatusLine status={null} />)).toBe("");
  });

  it("renders title, headline, parts and a tone class", () => {
    const { s, ids } = withFlags();
    const html = renderToStaticMarkup(<BannerStatusLine status={flagBannerStatus(s, ids[0])} />);
    expect(html).toContain('class="sc-bannerline is-flag tone-warn"');
    expect(html).toContain("Your flag");
    expect(html).toContain("Unguarded");
    expect(html).toContain("post a garrison to hold it");
    expect(html).toContain('aria-hidden="true"');
  });

  it("does not change state", () => {
    const { s, ids } = withFlags(2);
    sendHost(s, [ids[0], s.board.homeProvinceId]);
    const before = JSON.stringify(s);
    keepBannerStatus(s);
    flagBannerStatus(s, ids[0]);
    flagsSummaryStatus(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("banner status lines in the views", () => {
  const inspect = (s: GameState, id: string) =>
    renderToStaticMarkup(<ProvinceInspect state={s} selectedId={id} onClear={() => {}} act={() => {}} />);

  it("shows the keep banner line on the home hold's inspect card", () => {
    const s = fresh();
    const html = inspect(s, s.board.homeProvinceId);
    expect(html).toContain("sc-bannerline is-keep");
    expect(html).toContain("Keep banner");
  });

  it("shows the flag line on a flagged tile in place of the bare outpost line", () => {
    const { s, ids } = withFlags();
    const html = inspect(s, ids[0]);
    expect(html).toContain("sc-bannerline is-flag");
    expect(html).not.toContain("sc-inspect-outpost");
  });

  it("keeps the old camp line on a hostile camp and adds no banner line", () => {
    const s = fresh();
    const tile = neighbors(s, s.board.homeProvinceId)[0];
    tile.node = "camp";
    tile.occupantRealmId = null;
    const html = inspect(s, tile.id);
    expect(html).toContain("Rival camp");
    expect(html).not.toContain("sc-bannerline");
  });

  it("shows the keep banner and the flags roll-up on the Kingdom tab", () => {
    const { s } = withFlags(2);
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-bannerline is-keep");
    expect(html).toContain("sc-bannerline is-flags");
    expect(html).toContain("2 flags planted");
  });

  it("shows no flags roll-up on the Kingdom tab before any flag is planted", () => {
    const html = renderToStaticMarkup(
      <KingdomTab state={fresh()} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-bannerline is-keep");
    expect(html).not.toContain("sc-bannerline is-flags");
  });
});

describe("banner-status.css", () => {
  const css = readFile("./banner-status.css");

  it("lives in its own file, not theme.css", () => {
    expect(css).toContain(".sc-bannerline");
    expect(readFile("../theme.css")).not.toContain("sc-bannerline");
  });

  it("keeps the decorative pennant from catching clicks", () => {
    const pip = css.slice(css.indexOf(".sc-bannerline-pip {"));
    expect(pip.slice(0, pip.indexOf("}"))).toContain("pointer-events: none");
  });

  it("does not reuse the banner chip's class names", () => {
    expect(css).not.toContain("sc-banner-");
  });
});
