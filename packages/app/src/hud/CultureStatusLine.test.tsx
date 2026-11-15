import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CULTURES,
  CULTURE_UNITS,
  FEN_COTTAGE_BONUS,
  GLEN_QUARRY_BONUS,
  MIST_FARM_BONUS,
  PEAK_KEEP_VISION_BONUS,
  RESEARCH,
  SALT_WOOD_BONUS,
  computeIncomePerSecond,
  createGameState,
  cultureKitId,
  getUnitType,
  housingCap,
  isProvinceSeen,
  playerCultureUnitId,
  setPlayerCulture,
  unitUnlocked,
  visionRange,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { CultureStatusLine, cultureStatus } from "./CultureStatusLine";
import { CULTURE_UNIQUE_UNITS } from "./CultureUnitChip";
import { KingdomTab } from "../tabs/KingdomTab";
import { ProvinceInspect } from "../ProvinceInspect";

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

/** A fresh crown of one culture. */
function crown(cultureId: string): GameState {
  const s = createGameState({ seed: 1 });
  expect(setPlayerCulture(s, cultureId)).toBe(true);
  return s;
}

/** Adds `n` finished player buildings of one type, far from each other's bonuses. */
function addFinished(s: GameState, typeId: string, n: number): void {
  for (let i = 0; i < n; i++) {
    s.buildings.push({
      id: `test_${typeId}_${i}`,
      typeId,
      realmId: "player",
      level: 1,
      completesAtTick: null,
      x: 40 + i * 3,
      y: 40,
    });
  }
}

function removeAll(s: GameState, typeId: string): void {
  s.buildings = s.buildings.filter((b) => b.typeId !== typeId);
}

const BASE = ["western", "woodland", "desert", "steppe", "tide"];
const EDGE = ["mist", "glen", "salt", "fen", "peak"];

describe("cultureStatus: the culture", () => {
  it("names the sim's current culture for all ten", () => {
    for (const c of CULTURES) {
      const st = cultureStatus(crown(c.id));
      expect(st.id).toBe(c.id);
      expect(st.name).toBe(c.name);
    }
  });
});

describe("cultureStatus: the bonus", () => {
  it("says the five base cultures change looks only", () => {
    for (const id of BASE) {
      const st = cultureStatus(crown(id));
      expect(st.bonus).toBeNull();
      expect(st.bonusText).toBe("Bonus: none, this culture changes looks only");
    }
  });

  it("states each edge culture's rule with the sim's number", () => {
    expect(cultureStatus(crown("mist")).bonus?.text).toBe(`each finished farm feeds +${MIST_FARM_BONUS} food per tick`);
    expect(cultureStatus(crown("glen")).bonus?.text).toBe(`each finished quarry cuts +${GLEN_QUARRY_BONUS} stone per tick`);
    expect(cultureStatus(crown("salt")).bonus?.text).toBe(
      `each finished lumber camp fells +${SALT_WOOD_BONUS} wood per tick`,
    );
    expect(cultureStatus(crown("fen")).bonus?.text).toBe(`each finished cottage holds +${FEN_COTTAGE_BONUS} citizen`);
    expect(cultureStatus(crown("peak")).bonus?.text).toBe(
      `a finished keep sees +${PEAK_KEEP_VISION_BONUS} tile farther`,
    );
  });

  it.each([
    ["mist", "farm", "food", "3 farms: +3 now", "no finished farm yet"],
    ["glen", "quarry", "stone", "3 quarries: +3 now", "no finished quarry yet"],
    ["salt", "lumber_camp", "wood", "3 lumber camps: +3 now", "no finished lumber camp yet"],
  ])("%s: the amount now matches the sim's income", (cultureId, typeId, res, nowText, noneText) => {
    const none = crown(cultureId);
    removeAll(none, typeId);
    expect(cultureStatus(none).bonus?.now).toBe(0);
    expect(cultureStatus(none).bonus?.nowText).toBe(noneText);

    const s = crown(cultureId);
    removeAll(s, typeId);
    addFinished(s, typeId, 3);
    const plain = crown("western");
    plain.buildings = s.buildings.map((b) => ({ ...b }));
    const st = cultureStatus(s);
    expect(st.bonus?.now).toBe(3);
    expect(st.bonus?.nowText).toBe(nowText);
    const perTick =
      (Number(computeIncomePerSecond(s)[res] ?? 0) - Number(computeIncomePerSecond(plain)[res] ?? 0)) / TICKS_PER_SECOND;
    expect(perTick).toBeCloseTo(st.bonus!.now, 6);
  });

  it("counts one building in the singular", () => {
    const s = crown("mist");
    removeAll(s, "farm");
    addFinished(s, "farm", 1);
    expect(cultureStatus(s).bonus?.nowText).toBe("1 farm: +1 now");
  });

  it("does not count an unfinished building or a rival's", () => {
    const s = crown("mist");
    removeAll(s, "farm");
    addFinished(s, "farm", 2);
    s.buildings[s.buildings.length - 1].completesAtTick = s.meta.tick + 50;
    s.buildings[s.buildings.length - 2].realmId = "iron";
    expect(cultureStatus(s).bonus?.now).toBe(0);
  });

  it("fen: the amount now matches the sim's housing cap", () => {
    const s = crown("fen");
    removeAll(s, "cottage");
    addFinished(s, "cottage", 2);
    const plain = crown("western");
    plain.buildings = s.buildings.map((b) => ({ ...b }));
    const st = cultureStatus(s);
    expect(st.bonus?.now).toBe(housingCap(s) - housingCap(plain));
    expect(st.bonus?.nowText).toBe("2 cottages: +2 now");
  });

  it("peak: the amount now matches the sim's vision range, with and without a keep", () => {
    const s = crown("peak");
    const plain = crown("western");
    plain.buildings = s.buildings.map((b) => ({ ...b }));
    expect(cultureStatus(s).bonus?.now).toBe(visionRange(s) - visionRange(plain));

    removeAll(s, "keep");
    removeAll(plain, "keep");
    expect(cultureStatus(s).bonus?.now).toBe(visionRange(s) - visionRange(plain));
    expect(cultureStatus(s).bonus?.now).toBe(0);
    expect(cultureStatus(s).bonus?.nowText).toBe("no finished keep yet");

    addFinished(s, "keep", 1);
    addFinished(plain, "keep", 1);
    expect(cultureStatus(s).bonus?.now).toBe(visionRange(s) - visionRange(plain));
    expect(cultureStatus(s).bonus?.now).toBe(PEAK_KEEP_VISION_BONUS);
    expect(cultureStatus(s).bonus?.nowText).toBe(`+${PEAK_KEEP_VISION_BONUS} hold vision now`);
  });
});

describe("cultureStatus: the special unit", () => {
  it("names the unit the sim opens for this culture's halls, for all ten", () => {
    for (const c of CULTURES) {
      const s = crown(c.id);
      const st = cultureStatus(s);
      const unitId = playerCultureUnitId(s);
      expect(st.unit.id).toBe(unitId);
      expect(st.unit.name).toBe(getUnitType(unitId)!.name);
      expect(st.unit.origin).toBe(CULTURE_UNITS.find((g) => g.kit === cultureKitId(c.id))!.origin);
      expect(st.unit.open).toBe(unitUnlocked(s, unitId));
      expect(st.unit.open).toBe(true);
      expect(st.unitText).toBe(`Special unit: ${st.unit.name} (${st.unit.origin} halls only, open on the Army tab)`);
    }
  });

  it("gives each base culture its own unit and the edge cultures the western one", () => {
    expect(cultureStatus(crown("western")).unit.name).toBe("Halberdier");
    expect(cultureStatus(crown("woodland")).unit.name).toBe("Cedar Stalker");
    expect(cultureStatus(crown("desert")).unit.name).toBe("Dune Lancer");
    expect(cultureStatus(crown("steppe")).unit.name).toBe("Horse Archer");
    expect(cultureStatus(crown("tide")).unit.name).toBe("Reef Raider");
    for (const id of EDGE) expect(cultureStatus(crown(id)).unit.name).toBe("Halberdier");
  });

  it("the named unit is one no other kit can train", () => {
    for (const c of CULTURES) {
      const unitId = cultureStatus(crown(c.id)).unit.id;
      for (const other of CULTURES) {
        const same = cultureKitId(other.id) === cultureKitId(c.id);
        expect(unitUnlocked(crown(other.id), unitId)).toBe(same);
      }
    }
  });
});

describe("cultureStatus: the picker unit", () => {
  it("has none for the base cultures", () => {
    for (const id of BASE) {
      const st = cultureStatus(crown(id));
      expect(st.paired).toBeNull();
      expect(st.pairedText).toBe("");
    }
  });

  it("names the picker's unit and the study that opens it for every crown", () => {
    const expected: Record<string, [string, string]> = {
      mist: ["Ranger", RESEARCH.fieldcraft.name],
      glen: ["Banner", RESEARCH.drill.name],
      salt: ["Outrider", RESEARCH.horse.name],
      fen: ["Warden", RESEARCH.screening.name],
      peak: ["Lancer", RESEARCH.horse.name],
    };
    for (const id of EDGE) {
      const st = cultureStatus(crown(id));
      expect(st.paired?.id).toBe(CULTURE_UNIQUE_UNITS[id]);
      expect(st.paired?.name).toBe(expected[id][0]);
      expect(st.paired?.study).toBe(expected[id][1]);
      expect(st.paired?.open).toBe(false);
      expect(st.pairedText).toBe(
        `Picker unit: ${expected[id][0]}, open to every crown after the ${expected[id][1]} study (not studied yet)`,
      );
    }
  });

  it("is honest that the picker unit is not tied to the culture: the study opens it for any crown", () => {
    for (const id of EDGE) {
      const unitId = CULTURE_UNIQUE_UNITS[id];
      const studyId = Object.values(RESEARCH).find((r) => (r.unlocks as readonly string[]).includes(unitId))!.id;
      for (const other of ["western", "tide", id]) {
        const s = crown(other);
        expect(unitUnlocked(s, unitId)).toBe(false);
        s.flags[`research_${studyId}`] = 1;
        expect(unitUnlocked(s, unitId)).toBe(true);
      }
    }
  });

  it("says studied once the study is done", () => {
    const s = crown("mist");
    s.flags["research_fieldcraft"] = 1;
    const st = cultureStatus(s);
    expect(st.paired?.open).toBe(true);
    expect(st.pairedText).toContain("(studied)");
  });
});

describe("cultureStatus is read-only", () => {
  it("does not change the save", () => {
    for (const c of CULTURES) {
      const s = crown(c.id);
      const before = JSON.stringify(s);
      cultureStatus(s);
      renderToStaticMarkup(<CultureStatusLine state={s} />);
      expect(JSON.stringify(s)).toBe(before);
    }
  });
});

describe("CultureStatusLine markup", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<CultureStatusLine state={undefined} />)).toBe("");
  });

  it("shows the culture, its bonus and its special unit", () => {
    const s = crown("mist");
    removeAll(s, "farm");
    addFinished(s, "farm", 2);
    const html = renderToStaticMarkup(<CultureStatusLine state={s} />);
    expect(html).toContain("sc-culture-status-line has-bonus");
    expect(html).toContain('data-culture-status="mist"');
    expect(html).toContain('data-culture-unit="halberdier"');
    expect(html).toContain('data-bonus-now="2"');
    expect(html).toContain("<strong>Mist Reach</strong>");
    expect(html).toContain("Bonus: each finished farm feeds +1 food per tick (2 farms: +2 now)");
    expect(html).toContain("sc-culture-status-bonus is-active");
    expect(html).toContain("Special unit: Halberdier (Western halls only, open on the Army tab)");
    expect(html).toContain("Picker unit: Ranger, open to every crown after the Fieldcraft study (not studied yet)");
  });

  it("marks a looks-only culture and leaves the picker part out", () => {
    const html = renderToStaticMarkup(<CultureStatusLine state={crown("tide")} />);
    expect(html).toContain("sc-culture-status-line is-plain");
    expect(html).toContain("<strong>Tide Clans</strong>");
    expect(html).toContain("Bonus: none, this culture changes looks only");
    expect(html).toContain("Special unit: Reef Raider (Islands halls only, open on the Army tab)");
    expect(html).not.toContain("sc-culture-status-paired");
    expect(html).not.toContain("sc-culture-status-bonus is-active");
  });

  it("does not light the bonus while nothing earns it", () => {
    const s = crown("glen");
    removeAll(s, "quarry");
    const html = renderToStaticMarkup(<CultureStatusLine state={s} />);
    expect(html).toContain('data-bonus-now="0"');
    expect(html).not.toContain("sc-culture-status-bonus is-active");
    expect(html).toContain("(no finished quarry yet)");
  });

  it("has no button and keeps the crest decorative", () => {
    const html = renderToStaticMarkup(<CultureStatusLine state={crown("peak")} />);
    expect(html).not.toContain("<button");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("where the line shows", () => {
  it("shows on the Kingdom tab under the culture line, which keeps its switch button", () => {
    const s = crown("salt");
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const row = html.indexOf('class="sc-culture-line-row"');
    const status = html.indexOf('class="sc-culture-status-line');
    expect(row).toBeGreaterThan(-1);
    expect(status).toBeGreaterThan(row);
    expect(html.match(/sc-culture-status-line/g)?.length).toBe(1);
    expect(html).toContain("each finished lumber camp fells +1 wood per tick");
    expect(html).toContain("Special unit: Halberdier");
    expect(html).toContain("Switch to ");
  });

  it("shows on the inspect card", () => {
    const s = crown("desert");
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html.match(/sc-culture-status-line/g)?.length).toBe(1);
    expect(html).toContain("<strong>Sand Banner</strong>");
    expect(html).toContain("Special unit: Dune Lancer (Sand halls only, open on the Army tab)");
  });

  it("shows on the inspect card for an unseen tile too: the culture belongs to the realm, not the tile", () => {
    const s = crown("fen");
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain('data-culture-status="fen"');
  });
});

describe("culture-status-line.css", () => {
  const css = readFile("./culture-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-culture-status-line",
      "sc-culture-status-icon",
      "sc-culture-status-text",
      "sc-culture-status-label",
      "sc-culture-status-bonus",
      "sc-culture-status-unit",
      "sc-culture-status-paired",
    ]) {
      expect(css).toContain(`.${cls}`);
    }
  });

  it("is scoped to the line, has no animation, and keeps the crest click-through", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}")
      .map((block) => block.split("{")[0].trim())
      .filter(Boolean);
    for (const sel of selectors) {
      for (const part of sel.split(",")) expect(part.trim().startsWith(".sc-culture-status-")).toBe(true);
    }
    expect(css).not.toMatch(/animation|@keyframes|transition/);
    expect(css).toMatch(/\.sc-culture-status-icon\s*\{[^}]*pointer-events:\s*none/);
  });
});
