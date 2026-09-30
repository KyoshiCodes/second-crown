import type { GameState, Province } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { canAfford, canPlaceType, isHoldRim, listWorksInProgress, tryBuild } from "../actions/build.js";
import { canAffordTrain, tryTrain } from "../actions/train.js";
import { listTraining } from "../systems/training.js";
import { canRaiseWork, housingCap, population, WORK_PLOTS } from "../systems/housing.js";
import { currentTutorial, tryAdvanceTutorial, tutorialIndex, TUTORIAL_STEPS } from "../systems/tutorial.js";
import { isProvinceSeen, scoutCost, tryScoutProvince } from "../systems/fog.js";
import { tryDispatchScout } from "../systems/scoutColumn.js";
import { listGathers, tryGather, GATHER_NODES } from "../systems/gather.js";
import { listMarches, tryMarchWith } from "../systems/march.js";
import { maxMarches } from "../systems/labor.js";
import { getProvince } from "../systems/board.js";
import { nodeStock } from "../systems/nodeStock.js";
import { tryStartResearch } from "../systems/research.js";
import { storageCap } from "../systems/storage.js";

/**
 * Sim-only playtest bot. Plays a fresh game through the public sim actions,
 * the same calls the UI makes, and reports what worked. No I/O here: the
 * writer in playtest.report.ts turns the report into docs/PLAYTEST.md.
 */

export interface PlaytestOptions {
  seed?: number;
  ticks?: number;
  /** Ticks between bot turns. */
  turnEvery?: number;
}

export interface ActionStat {
  tried: number;
  ok: number;
  firstOkTick: number | null;
  fails: Record<string, number>;
}

export interface PlaytestReport {
  seed: number;
  ticksRun: number;
  turns: number;
  actions: Record<string, ActionStat>;
  errors: { tick: number; where: string; message: string }[];
  failedAsserts: { tick: number; check: string; detail: string }[];
  raids: {
    firstWarTick: number | null;
    /** Non-player columns aimed at the player's home province, by launch tick. */
    list: { tick: number; realmId: string; levy: number; arrivesTick: number }[];
    militiaTrained: number;
    /** Home + queued + out in columns. */
    militiaAtEnd: number;
  };
  primer: { reached: number; total: number; stuckOn: string | null; log: { tick: number; step: string }[] };
  final: {
    resources: Record<string, string>;
    peakResources: Record<string, number>;
    buildings: Record<string, number>;
    playerUnits: Record<string, number>;
    population: number;
    housingCap: number;
    marchesOut: number;
    gathersOut: number;
  };
  notes: string[];
}

const HOME_X = 2;
const HOME_Y = 2;
const MILITIA_TARGET = 8;
const FARM_TARGET = 3;
const COTTAGE_TARGET = 2;
const QUARRY_TARGET = 1;
const WALLS_TARGET = 1;

class Recorder {
  actions: Record<string, ActionStat> = {};
  errors: PlaytestReport["errors"] = [];
  failedAsserts: PlaytestReport["failedAsserts"] = [];
  private assertKeys = new Set<string>();

  constructor(private state: GameState) {}

  /** Runs one attempt. `why` explains a refusal before calling, since try* only returns false. */
  attempt(name: string, why: () => string | null, act: () => boolean): boolean {
    const stat = (this.actions[name] ??= { tried: 0, ok: 0, firstOkTick: null, fails: {} });
    stat.tried += 1;
    let reason: string | null = null;
    try {
      reason = why();
    } catch (e) {
      this.error(`${name} (precheck)`, e);
    }
    let ok = false;
    try {
      ok = act();
    } catch (e) {
      this.error(name, e);
      reason = "threw";
    }
    if (ok) {
      stat.ok += 1;
      stat.firstOkTick ??= this.state.meta.tick;
    } else {
      const key = reason ?? "sim said no (precheck passed)";
      stat.fails[key] = (stat.fails[key] ?? 0) + 1;
    }
    return ok;
  }

  error(where: string, e: unknown): void {
    const message = e instanceof Error ? e.message : String(e);
    this.errors.push({ tick: this.state.meta.tick, where, message });
  }

  /** Soft assert: logged once per check+detail, never throws. */
  check(name: string, ok: boolean, detail: string): void {
    if (ok) return;
    const key = `${name}|${detail}`;
    if (this.assertKeys.has(key)) return;
    this.assertKeys.add(key);
    this.failedAsserts.push({ tick: this.state.meta.tick, check: name, detail });
  }
}

function num(v: string | undefined): number {
  return D(v ?? "0").toNumber();
}

function playerUnitCount(state: GameState, typeId: string): number {
  return state.units
    .filter((u) => u.realmId === "player" && u.typeId === typeId)
    .reduce((n, u) => n + num(u.count), 0);
}

function queuedCount(state: GameState, typeId: string): number {
  return listTraining(state, "player")
    .filter((j) => j.typeId === typeId)
    .reduce((n, j) => n + Number(j.count), 0);
}

function allOfType(state: GameState, typeId: string): number {
  return state.buildings.filter((b) => b.realmId === "player" && b.typeId === typeId).length;
}

function freeSlot(state: GameState, typeId: string, rim: boolean): { x: number; y: number } | null {
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 16; x++) {
      if (isHoldRim(x, y) !== rim) continue;
      if (canPlaceType(state, typeId, x, y)) return { x, y };
    }
  }
  return null;
}

function dist(p: Province): number {
  return Math.abs(p.x - HOME_X) + Math.abs(p.y - HOME_Y);
}

function nearest(list: Province[]): Province | undefined {
  return [...list].sort((a, b) => dist(a) - dist(b) || a.id.localeCompare(b.id))[0];
}

function busySlots(state: GameState): number {
  return listMarches(state).filter((m) => m.realmId === "player").length + listGathers(state).filter((g) => g.realmId === "player").length;
}

/** True when a gain of `res` would be clamped away by the warehouse. */
function atCap(state: GameState, res: string): boolean {
  return num(state.resources[res]) >= storageCap(state, res) - 1e-9;
}

function buildWhy(state: GameState, typeId: string, rim = false): string | null {
  if (!canAfford(state, typeId)) return "cannot afford";
  if (WORK_PLOTS.has(typeId) && !canRaiseWork(state)) return "no free work plot";
  if (!freeSlot(state, typeId, rim)) return "no legal tile";
  return null;
}

function tryBuildType(rec: Recorder, state: GameState, typeId: string, rim = false): boolean {
  return rec.attempt(`build ${typeId}`, () => buildWhy(state, typeId, rim), () => {
    const slot = freeSlot(state, typeId, rim);
    return slot ? tryBuild(state, { typeId, ...slot }) : false;
  });
}

function checkInvariants(rec: Recorder, state: GameState, expectTick: number): void {
  rec.check("tick advanced", state.meta.tick === expectTick, `meta.tick=${state.meta.tick} expected ${expectTick}`);
  for (const [res, v] of Object.entries(state.resources)) {
    const n = num(v);
    rec.check("resource finite", Number.isFinite(n), `${res}=${v}`);
    rec.check("resource non-negative", n >= 0, `${res}=${v}`);
  }
  for (const u of state.units) {
    const n = num(u.count);
    rec.check("unit count sane", Number.isFinite(n) && n >= 0, `${u.realmId}/${u.typeId}=${u.count}`);
  }
  rec.check(
    "population within beds",
    population(state) <= housingCap(state),
    `population ${population(state)} > beds ${housingCap(state)}`
  );
  for (const key of ["marches_json", "gathers_json", "fog_seen"]) {
    const raw = state.flags[key];
    if (typeof raw !== "string") continue;
    try {
      JSON.parse(raw);
    } catch {
      rec.check("flag JSON parses", false, key);
    }
  }
}

interface BotMemo {
  scouted: boolean;
  gathered: boolean;
  marched: boolean;
  studied: boolean;
  militiaTrained: number;
}

/** One bot turn: tries each goal once, in primer order. */
function botTurn(rec: Recorder, state: GameState, memo: BotMemo): void {
  // Economy: cottage first when plots are full, then farms.
  if (allOfType(state, "cottage") < COTTAGE_TARGET && (!canRaiseWork(state) || allOfType(state, "cottage") === 0)) {
    tryBuildType(rec, state, "cottage");
  }
  // Quarry once one farm stands: the hold's own stone source for walls.
  if (allOfType(state, "quarry") < QUARRY_TARGET && allOfType(state, "farm") >= 1) tryBuildType(rec, state, "quarry");
  if (allOfType(state, "farm") < FARM_TARGET) tryBuildType(rec, state, "farm");

  // Militia: a little levy, two at a time.
  const militia = playerUnitCount(state, "militia") + queuedCount(state, "militia");
  if (militia < MILITIA_TARGET) {
    const trained = rec.attempt(
      "train militia x2",
      () => (canAffordTrain(state, "militia", 2) ? null : "cannot afford or queue full"),
      () => tryTrain(state, { typeId: "militia", count: 2 })
    );
    if (trained) memo.militiaTrained += 2;
  }

  const homeId = state.board.homeProvinceId;
  const unseen = state.board.provinces.filter((p) => p.id !== homeId && !isProvinceSeen(state, p.id) && dist(p) >= 2);

  // Scout column (needs gold + one militia/skirmisher), then the instant gold scout as a fallback.
  if (!memo.scouted && unseen.length > 0) {
    const target = nearest(unseen)!;
    const ok = rec.attempt(
      "scout column",
      () => {
        if (num(state.resources.gold) < scoutCost(state)) return `gold < ${scoutCost(state)}`;
        if (playerUnitCount(state, "militia") + playerUnitCount(state, "skirmisher") < 1) return "no militia/skirmisher home";
        if (busySlots(state) >= maxMarches(state)) return "march slots full";
        return null;
      },
      () => tryDispatchScout(state, target.id)
    );
    const ok2 =
      ok ||
      rec.attempt(
        "scout (instant, gold)",
        () => (num(state.resources.gold) < scoutCost(state) ? `gold < ${scoutCost(state)}` : null),
        () => tryScoutProvince(state, target.id)
      );
    if (ok2) memo.scouted = true;
  }

  // Gather: keep one column working. Nearest seen open node with stock; a quarry first while stone is short for walls.
  const gathering = listGathers(state).some((g) => g.realmId === "player");
  // After the first gather, hold the slot free until the one march has gone out.
  if (!gathering && (!memo.gathered || memo.marched) && playerUnitCount(state, "militia") >= 3) {
    const nodes = state.board.provinces.filter(
      (p) => p.node in GATHER_NODES && !p.occupantRealmId && isProvinceSeen(state, p.id)
    );
    // Skip nodes whose resource is already at the warehouse cap: the haul would be lost.
    const stocked = nodes.filter(
      (p) => nodeStock(state, p.id) > 0 && !atCap(state, GATHER_NODES[p.node as keyof typeof GATHER_NODES].resource)
    );
    const wantStone = num(state.resources.stone) < 24;
    const target = (wantStone ? nearest(stocked.filter((p) => p.node === "quarry")) : undefined) ?? nearest(stocked);
    const ok = rec.attempt(
      `gather ${target?.node ?? "node"} x2 militia`,
      () => {
        if (!target) return nodes.length ? "all seen nodes empty or at cap" : "no seen gather node";
        if (busySlots(state) >= maxMarches(state)) return "march slots full";
        return null;
      },
      () => (target ? tryGather(state, target.id, { militia: 2 }) : false)
    );
    if (ok) memo.gathered = true;
  }

  // One short march: nearest seen camp or ruins, three militia.
  if (!memo.marched && memo.gathered && !gathering && playerUnitCount(state, "militia") >= 3) {
    const targets = state.board.provinces.filter(
      (p) => (p.node === "camp" || p.node === "ruins") && isProvinceSeen(state, p.id)
    );
    const target = nearest(targets) ?? nearest(state.board.provinces.filter((p) => p.id !== homeId && dist(p) === 1));
    const ok = rec.attempt(
      "march x3 militia",
      () => {
        if (!target) return "no target";
        if (busySlots(state) >= maxMarches(state)) return "march slots full";
        return null;
      },
      () => (target ? tryMarchWith(state, target.id, { militia: 3 }) : false)
    );
    if (ok) memo.marched = true;
  }

  // Walls: once any stone exists (quarry, gather, or march), or when the primer asks.
  const step = currentTutorial(state)?.id;
  if (allOfType(state, "walls") < WALLS_TARGET && (num(state.resources.stone) > 0 || step === "walls")) {
    tryBuildType(rec, state, "walls", true);
  }
  if (step === "lectern" && !memo.studied) {
    const ok = rec.attempt(
      "study husbandry",
      () => (num(state.resources.food) < 20 || num(state.resources.wood) < 12 ? "cannot afford" : null),
      () => tryStartResearch(state, "husbandry")
    );
    if (ok) memo.studied = true;
  }

  // Primer: press "next" until it refuses, as the banner button does.
  let guard = 0;
  while (guard++ < TUTORIAL_STEPS.length) {
    const before = currentTutorial(state)?.id;
    if (!before) break;
    const advanced = rec.attempt("primer advance", () => null, () => tryAdvanceTutorial(state));
    if (!advanced) break;
  }
}

export function runPlaytest(options: PlaytestOptions = {}): PlaytestReport {
  const seed = options.seed ?? 20260930;
  const totalTicks = options.ticks ?? 12_000;
  const turnEvery = options.turnEvery ?? 25;

  // Mirrors the app's freshState (packages/app/src/game/useGameEngine.ts), minus the browser-only culture pick.
  const state = createGameState({ seed, now: 1, withStarterBuildings: true });
  state.resources.wood = "40";
  state.resources.food = "50";
  const engine = new TickEngine(state);
  const rec = new Recorder(state);
  const memo: BotMemo = { scouted: false, gathered: false, marched: false, studied: false, militiaTrained: 0 };
  const raidIds = new Set<string>();
  const raids: PlaytestReport["raids"]["list"] = [];
  let firstWarTick: number | null = null;
  const primerLog: PlaytestReport["primer"]["log"] = [];
  let lastPrimer = tutorialIndex(state);
  let turns = 0;
  let ticksRun = 0;
  let firstStarve: number | null = null;
  const peak: Record<string, number> = {};

  while (ticksRun < totalTicks) {
    try {
      botTurn(rec, state, memo);
    } catch (e) {
      rec.error("bot turn", e);
    }
    turns += 1;
    const idx = tutorialIndex(state);
    for (let i = lastPrimer; i < idx; i++) primerLog.push({ tick: state.meta.tick, step: TUTORIAL_STEPS[i].id });
    lastPrimer = idx;

    const n = Math.min(turnEvery, totalTicks - ticksRun);
    const expect = state.meta.tick + n;
    for (let i = 0; i < n; i++) {
      try {
        engine.tick();
      } catch (e) {
        rec.error("engine.tick", e);
      }
      ticksRun += 1;
      for (const [k, v] of Object.entries(state.resources)) peak[k] = Math.max(peak[k] ?? 0, Math.floor(num(v)));
      for (const m of listMarches(state)) {
        if (m.realmId === "player" || m.toId !== state.board.homeProvinceId || raidIds.has(m.id)) continue;
        raidIds.add(m.id);
        raids.push({ tick: state.meta.tick, realmId: m.realmId, levy: m.levy, arrivesTick: m.arrivesTick });
      }
      if (firstWarTick === null && state.wars.some((w) => w.defenderRealmId === "player" || w.attackerRealmId === "player")) {
        firstWarTick = state.meta.tick;
      }
    }
    checkInvariants(rec, state, expect);
    if (firstStarve === null && num(state.resources.food) <= 0 && ticksRun > 100) firstStarve = state.meta.tick;
  }

  const buildings: Record<string, number> = {};
  for (const b of state.buildings.filter((x) => x.realmId === "player")) buildings[b.typeId] = (buildings[b.typeId] ?? 0) + 1;
  const playerUnits: Record<string, number> = {};
  for (const u of state.units.filter((x) => x.realmId === "player")) playerUnits[u.typeId] = (playerUnits[u.typeId] ?? 0) + num(u.count);

  const militiaOut =
    listMarches(state).filter((m) => m.realmId === "player").reduce((n, m) => n + (m.force?.militia ?? 0), 0) +
    listGathers(state).filter((g) => g.realmId === "player").reduce((n, g) => n + (g.force.militia ?? 0), 0);

  const report: PlaytestReport = {
    seed,
    raids: {
      firstWarTick,
      list: raids,
      militiaTrained: memo.militiaTrained,
      militiaAtEnd: playerUnitCount(state, "militia") + queuedCount(state, "militia") + militiaOut,
    },
    ticksRun,
    turns,
    actions: rec.actions,
    errors: rec.errors,
    failedAsserts: rec.failedAsserts,
    primer: {
      reached: tutorialIndex(state),
      total: TUTORIAL_STEPS.length,
      stuckOn: currentTutorial(state)?.id ?? null,
      log: primerLog,
    },
    final: {
      resources: { ...state.resources },
      peakResources: peak,
      buildings,
      playerUnits,
      population: population(state),
      housingCap: housingCap(state),
      marchesOut: listMarches(state).filter((m) => m.realmId === "player").length,
      gathersOut: listGathers(state).filter((g) => g.realmId === "player").length,
    },
    notes: [],
  };
  report.notes = autoNotes(report, state, firstStarve);
  return report;
}

function autoNotes(r: PlaytestReport, state: GameState, firstStarve: number | null): string[] {
  const notes: string[] = [];
  const never = Object.entries(r.actions).filter(([, s]) => s.ok === 0).map(([k]) => k);
  if (never.length) notes.push(`Never succeeded: ${never.join(", ")}.`);
  if (r.primer.stuckOn) notes.push(`Primer stopped at step "${r.primer.stuckOn}" (${r.primer.reached}/${r.primer.total}).`);
  const scout = r.actions["scout column"];
  if (scout && scout.ok === 0 && Object.keys(scout.fails).some((k) => k.startsWith("gold"))) {
    notes.push("A fresh game starts with 0 gold and no gold income, so the primer's scout step is gated on finding gold elsewhere.");
  }
  if (scout && scout.ok === 0 && r.primer.log.some((l) => l.step === "scout")) {
    notes.push("The primer's scout step still completed without a scout: a gather/march column's vision revealed a tile 2+ away.");
  }
  if (r.raids.list.length) {
    const lost = r.raids.militiaTrained - r.raids.militiaAtEnd;
    notes.push(
      `Home was marched on ${r.raids.list.length} time(s) (first launched at tick ${r.raids.list[0].tick}; war on the player first seen at tick ${r.raids.firstWarTick ?? "—"}). Militia trained ${r.raids.militiaTrained}, alive at end ${r.raids.militiaAtEnd} (${lost} lost). Balance question: can a fresh crown hold any levy?`
    );
  }
  const walls = r.actions["build walls"];
  if (walls && walls.ok === 0) {
    const quarryGathers = r.actions["gather quarry x2 militia"]?.ok ?? 0;
    const quarryBuilt = r.actions["build quarry"]?.ok ?? 0;
    notes.push(
      `Walls (24 stone, 12 wood) never built: peak stone was ${r.final.peakResources.stone ?? 0}. ` +
        `Quarry built ${quarryBuilt} time(s); quarry gathers ${quarryGathers}.`
    );
  }
  if (firstStarve !== null) notes.push(`Food first hit 0 at tick ${firstStarve}.`);
  if (listWorksInProgress(state).length) notes.push(`${listWorksInProgress(state).length} work(s) still under scaffolding at the end.`);
  return notes;
}

function table(rows: string[][]): string {
  const [head, ...body] = rows;
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

/** Deterministic markdown (no timestamps) so re-runs on the same sim give the same file. */
export function playtestMarkdown(r: PlaytestReport): string {
  const out: string[] = [];
  out.push("## Sim playtest (bot run)");
  out.push("");
  out.push("Generated by `npm run playtest` (`packages/sim/src/harness/playtestHarness.ts`). Sim only: no browser, no server, no Discord.");
  out.push("");
  out.push(`- Seed: \`${r.seed}\``);
  out.push(`- Ticks run: **${r.ticksRun}** (${(r.ticksRun / 10 / 60).toFixed(1)} game minutes at 100 ms/tick), bot turns: ${r.turns}`);
  out.push(`- Errors thrown: **${r.errors.length}**`);
  out.push(`- Failed asserts: **${r.failedAsserts.length}**`);
  out.push(`- Primer: ${r.primer.reached}/${r.primer.total} steps${r.primer.stuckOn ? `, stuck on \`${r.primer.stuckOn}\`` : ", done"}`);
  out.push("");
  out.push("### Primer steps");
  out.push("");
  out.push(r.primer.log.length ? table([["Step", "Done at tick"], ...r.primer.log.map((l) => [l.step, String(l.tick)])]) : "_None completed._");
  out.push("");
  out.push("### Columns on the home hold");
  out.push("");
  out.push(
    r.raids.list.length
      ? table([["Launched tick", "Arrives tick", "Realm", "Levy"], ...r.raids.list.slice(0, 30).map((x) => [String(x.tick), String(x.arrivesTick), x.realmId, String(x.levy)])])
      : "None."
  );
  out.push("");
  out.push(`Militia trained by the bot: ${r.raids.militiaTrained}. Alive at end (home + queued + out): ${r.raids.militiaAtEnd}.`);
  out.push("");
  out.push("### Actions tried");
  out.push("");
  const rows = Object.entries(r.actions).map(([name, s]) => {
    const fails = Object.entries(s.fails).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join("; ");
    return [name, String(s.tried), String(s.ok), s.firstOkTick === null ? "—" : String(s.firstOkTick), fails || "—"];
  });
  out.push(table([["Action", "Tried", "OK", "First OK tick", "Refusals"], ...rows]));
  out.push("");
  out.push("### Errors thrown");
  out.push("");
  out.push(r.errors.length ? table([["Tick", "Where", "Message"], ...r.errors.slice(0, 30).map((e) => [String(e.tick), e.where, e.message.replace(/\|/g, "\\|")])]) : "None.");
  out.push("");
  out.push("### Failed asserts");
  out.push("");
  out.push(r.failedAsserts.length ? table([["Tick", "Check", "Detail"], ...r.failedAsserts.slice(0, 30).map((a) => [String(a.tick), a.check, a.detail])]) : "None. Checked each turn: tick advances, resources finite and ≥ 0, unit counts sane, population ≤ beds, march/gather/fog flags parse.");
  out.push("");
  out.push("### End state");
  out.push("");
  const f = r.final;
  out.push(`- Resources: ${Object.entries(f.resources).map(([k, v]) => `${k} ${Math.floor(num(v))}`).join(", ")}`);
  out.push(`- Peak during run: ${Object.entries(f.peakResources).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  out.push(`- Buildings: ${Object.entries(f.buildings).map(([k, v]) => `${k} ×${v}`).join(", ") || "none"}`);
  out.push(`- Player units: ${Object.entries(f.playerUnits).map(([k, v]) => `${k} ×${v}`).join(", ") || "none"}`);
  out.push(`- Population ${f.population} / beds ${f.housingCap}; columns out: ${f.marchesOut} marches, ${f.gathersOut} gathers`);
  out.push("");
  out.push("### Notes for later");
  out.push("");
  for (const n of r.notes) out.push(`- ${n}`);
  out.push("- Out of scope for this bot: UI, audio, keep rooms, map render. Those still need a human pass.");
  return out.join("\n");
}
