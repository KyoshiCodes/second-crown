import React from "react";
import {
  formatLetterSuffix,
  resourceLedger,
  type GameState,
} from "@second-crown/sim";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";
import { ResourcePip, resolveResourcePipVariant } from "./ResourcePip";
import {
  ResourceLivingGlyph,
  ResourceLivingUnderlay,
  resolveResourceGlyphDescriptor,
} from "./ResourceLivingGlyph";
import "./resource-pip.css";
import "./resource-living.css";
import "./hud-micro-feedback.css";
import "./economy-pressure.css";
import "./income-bracket.css";
import { bottleneckResourceMap } from "./economyPressure";
import { foodDeficit, formatSignedRate, realmRates, starvationNote, type StarvationState } from "../projection";
import "../cost-projection.css";
import { incomeBracketLabel, resolveIncomeBracket, type IncomeBracket } from "./incomeBracket";
import "./blocker-deficit.css";
import { isFoodInDeficit } from "./blockerAccents";
import "./starvation-accents.css";

export const HUD_PULSE_MS = 680;
export type ResourceMicroPulseKey = "food" | "wood" | "stone" | "gold";
export type ResourceMicroPulseKind = "income-up" | "became-full" | "became-empty" | null;

export interface ResourceCellSnapshot {
  income: number;
  full: boolean;
  empty: boolean;
}

export function parseResourceNumeric(raw: string | undefined): number {
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n : 0;
}

/** Detects transient store micro-pulse triggers across snapshots (never on initial paint). */
export function detectResourceMicroPulse(
  prev: ResourceCellSnapshot | undefined,
  next: ResourceCellSnapshot,
): ResourceMicroPulseKind {
  if (!prev) return null;
  if (!prev.empty && next.empty) return "became-empty";
  if (!prev.full && next.full) return "became-full";
  if (next.income > prev.income + 1e-9) return "income-up";
  return null;
}

const RES_LABEL: Record<string, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

function hasIncome(raw: string | undefined): boolean {
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n > 0 : n === Infinity;
}

/** Display-only fill for the stock meter: how much of the shown cap the shown amount covers. */
function meterPct(have: string, cap: number | undefined): number | null {
  if (cap === undefined || !Number.isFinite(cap) || cap <= 0) return null;
  const n = Number(have);
  if (!Number.isFinite(n)) return n === Infinity ? 100 : null;
  return Math.max(0, Math.min(100, (n / cap) * 100));
}

export function ResourceHud(props: {
  resources: Record<string, string>;
  income: Record<string, string>;
  state?: GameState;
  pulseOverride?: Partial<Record<ResourceMicroPulseKey, Exclude<ResourceMicroPulseKind, null>>>;
  bottleneckOverride?: Readonly<Record<string, string | boolean>>;
  incomeBracketOverride?: Partial<Record<ResourceMicroPulseKey, IncomeBracket>>;
  foodDeficitOverride?: number | null;
  starvationOverride?: StarvationState | null;
}) {
  const hungry = props.state ? isFoodStoresEmptyOrLow(props.state) : false;
  const bottleneckMap = bottleneckResourceMap(props.state);
  const rates = props.state ? realmRates(props.state) : null;
  const foodNet =
    props.foodDeficitOverride !== undefined
      ? isFoodInDeficit(props.foodDeficitOverride)
        ? props.foodDeficitOverride
        : null
      : rates
        ? foodDeficit(rates)
        : null;
  const starveNote = props.state && rates ? starvationNote(props.state, rates) : null;
  const foodStarveState: StarvationState | null =
    props.starvationOverride !== undefined ? props.starvationOverride : starveNote?.state ?? null;
  const foodStarveTip = foodStarveState
    ? starveNote?.state === foodStarveState
      ? starveNote.text
      : foodStarveState === "starving"
        ? "Starving: trained troops at risk of deserting"
        : "Hunger soon: larder draining toward desertion"
    : "";

  const entries = (["food", "wood", "stone", "gold"] as const).map((r) => {
    const line = props.state ? resourceLedger(props.state, r) : null;
    const have = props.resources[r] ?? "0";
    const cap = line && Number.isFinite(line.cap) ? formatLetterSuffix(String(line.cap)) : null;
    const income = props.income[r];
    const empty = r === "food" && hungry;
    const full = !empty && Boolean(line?.full);
    return {
      r,
      line,
      have,
      cap,
      income,
      empty,
      full,
      snap: { income: parseResourceNumeric(income), full, empty } as ResourceCellSnapshot,
    };
  });

  const [food, wood, stone, gold] = entries;
  const prevRef = React.useRef<Record<ResourceMicroPulseKey, ResourceCellSnapshot> | null>(null);
  const seqRef = React.useRef(0);
  const [pulses, setPulses] = React.useState<
    Partial<Record<ResourceMicroPulseKey, { kind: Exclude<ResourceMicroPulseKind, null>; seq: number }>>
  >({});

  React.useEffect(() => {
    const current = { food: food.snap, wood: wood.snap, stone: stone.snap, gold: gold.snap };
    const prev = prevRef.current;
    prevRef.current = current;
    if (!prev || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const triggered: Array<[ResourceMicroPulseKey, Exclude<ResourceMicroPulseKind, null>]> = [];
    for (const key of ["food", "wood", "stone", "gold"] as const) {
      const kind = detectResourceMicroPulse(prev[key], current[key]);
      if (kind) triggered.push([key, kind]);
    }
    if (triggered.length === 0) return;

    const seq = ++seqRef.current;
    setPulses((cur) => {
      const next = { ...cur };
      for (const [k, kind] of triggered) next[k] = { kind, seq };
      return next;
    });

    const timers = triggered.map(([k]) =>
      window.setTimeout(() => {
        setPulses((cur) => {
          if (cur[k]?.seq !== seq) return cur;
          const next = { ...cur };
          delete next[k];
          return next;
        });
      }, HUD_PULSE_MS),
    );
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [
    food.snap.income, food.snap.full, food.snap.empty,
    wood.snap.income, wood.snap.full, wood.snap.empty,
    stone.snap.income, stone.snap.full, stone.snap.empty,
    gold.snap.income, gold.snap.full, gold.snap.empty,
  ]);

  return (
    <div className="sc-resource-bar sc-ledger" role="list" aria-label="Stores">
      {entries.map(({ r, line, have, cap, income, empty, full }) => {
        const tone = empty ? "empty" : full ? "full" : "";
        const variant = resolveResourcePipVariant(r, props.state, full, have);
        const desc = resolveResourceGlyphDescriptor(r, have, income, props.state);
        const tip = [
          `${RES_LABEL[r]} ${formatLetterSuffix(have)}${cap ? ` of ${cap}` : ""}`,
          line ? `vault keeps ${formatLetterSuffix(String(line.vault))} safe` : "",
          full ? "stores full, excess is lost" : "",
          empty ? "larder bare, the host is tired" : "",
        ].filter(Boolean).join(" · ");
        const pct = meterPct(have, line?.cap);
        const earning = hasIncome(income);
        const activePulse = props.pulseOverride?.[r] ?? pulses[r]?.kind ?? null;
        const pulseSeq = pulses[r]?.seq ?? 0;
        const overrideVal = props.bottleneckOverride && r in props.bottleneckOverride ? props.bottleneckOverride[r] : undefined;
        const bottleneckTargets =
          overrideVal !== undefined
            ? typeof overrideVal === "string"
              ? [overrideVal]
              : overrideVal
                ? ["upgrade"]
                : []
            : (bottleneckMap[r] ?? []).map((b) => b.target);
        const isBottleneck = !empty && bottleneckTargets.length > 0;
        const incomeBracket = props.incomeBracketOverride?.[r] ?? resolveIncomeBracket(income);
        const incomeBracketNote = incomeBracketLabel(incomeBracket);
        const isHighIncome = incomeBracket !== "base";
        const deficitAmount = r === "food" && isFoodInDeficit(foodNet) ? foodNet : null;
        const isFoodDeficit = deficitAmount !== null;
        const starveState = r === "food" ? foodStarveState : null;
        const cellTip = [
          tip,
          isBottleneck ? `limiter for ${bottleneckTargets.join(", ")}` : "",
          incomeBracketNote ?? "",
          isFoodDeficit ? `Food ${formatSignedRate(deficitAmount)} after upkeep` : "",
          starveState ? foodStarveTip : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <div
            key={r}
            role="listitem"
            className={`sc-ledger-cell sc-resource-living is-${r} ${tone ? `is-${tone}` : ""}${isBottleneck ? " is-bottleneck" : ""}${isHighIncome ? ` is-income-${incomeBracket}` : ""}${isFoodDeficit ? " is-food-deficit" : ""}${starveState ? ` is-starve-${starveState}` : ""}`}
            data-hud-pulse={activePulse ?? undefined}
            data-economy-bottleneck={isBottleneck ? "true" : undefined}
            data-bottleneck-targets={isBottleneck ? bottleneckTargets.join(", ") : undefined}
            data-income-bracket={isHighIncome ? incomeBracket : undefined}
            data-food-deficit-cell={isFoodDeficit ? "true" : undefined}
            data-starve-cell={starveState ?? undefined}
            title={cellTip}
          >
            <ResourceLivingUnderlay resource={r} mood={desc.mood} />
            {isBottleneck ? <span className="sc-econ-bottleneck-glow" aria-hidden="true" /> : null}
            {isHighIncome ? <span className={`sc-income-bracket-glow is-${incomeBracket}`} aria-hidden="true" /> : null}
            {isFoodDeficit ? <span className="sc-food-deficit-glow" aria-hidden="true" /> : null}
            {starveState ? <span className={`sc-starve-cell-glow is-${starveState}`} aria-hidden="true" /> : null}
            {activePulse ? (
              <span
                key={`flash-${pulseSeq}`}
                className={`sc-hud-cell-flash is-${activePulse}`}
                aria-hidden="true"
                style={{ pointerEvents: "none" }}
              />
            ) : null}
            <div className="sc-resource-living-rows">
              <div className="sc-resource-living-row is-name">
                <div className="sc-ledger-name">
                  <ResourcePip resource={r} variant={variant} />
                  {RES_LABEL[r]}
                  {isBottleneck ? <span className="sc-econ-bottleneck-pip" aria-hidden="true" /> : null}
                  {isBottleneck ? (
                    <span className="sc-ledger-tag is-limiter" data-limiter-tag={r}>
                      limiter
                      <span className="sc-visually-hidden"> for {bottleneckTargets.join(", ")}</span>
                    </span>
                  ) : null}
                  {full ? <span className="sc-ledger-tag">full</span> : null}
                  {empty ? <span className="sc-ledger-tag">bare</span> : null}
                  {starveState ? (
                    <span className={`sc-ledger-tag sc-starve-tag is-${starveState}`} data-starve-tag={starveState}>
                      <span className="sc-starve-pip" aria-hidden="true" />
                      {starveState === "starving" ? "starving" : "hunger soon"}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="sc-resource-living-row is-amount">
                <span className="sc-resource-living-label">Stock</span>
                <div className="sc-ledger-amount">
                  {formatLetterSuffix(have)}
                  {cap ? <span className="sc-ledger-cap"> / {cap}</span> : null}
                </div>
                {pct !== null ? (
                  <span className="sc-resource-living-meter" aria-hidden="true">
                    <span className="sc-resource-living-meter-fill" style={{ width: `${pct}%` }} />
                  </span>
                ) : null}
              </div>
              <div className={`sc-resource-living-row is-income ${earning ? "is-earning" : "is-idle"}`}>
                <span className="sc-resource-living-label">Income</span>
                {earning ? (
                  <div className="sc-ledger-rate" title={incomeBracketNote ?? undefined}>
                    +{formatLetterSuffix(income!)}/s
                    {isHighIncome ? (
                      <span
                        className={`sc-income-bracket-pip is-${incomeBracket}`}
                        data-income-pip={incomeBracket}
                        aria-hidden="true"
                      >
                        {incomeBracket === "late" ? <span className="sc-income-bracket-pip-ring" /> : null}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="sc-ledger-rate is-idle">idle</div>
                )}
              </div>
              {r === "food" && foodNet !== null ? (
                <div className="sc-resource-living-row is-net" data-food-deficit={foodNet}>
                  <span className="sc-resource-living-label">Net</span>
                  <div className="sc-ledger-rate is-deficit">
                    <span className="sc-deficit-pip" data-deficit-pip="true" aria-hidden="true" />
                    {formatSignedRate(foodNet)} after upkeep
                  </div>
                </div>
              ) : null}
            </div>
            <ResourceLivingGlyph resource={r} have={have} income={income} state={props.state} />
          </div>
        );
      })}
    </div>
  );
}
