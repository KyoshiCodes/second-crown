import React from "react";
import { ResourcePip, type ResourceKind } from "./ResourcePip";
import "./resource-pip.css";
import "./stall-status.css";

/**
 * Stacked status rows for a Market stall card: give, get, stock.
 * Display only. Every input is a value the Market already has: the fixed
 * `MARKET_OFFERS` entry, the player's stores in `state.resources`, and
 * whether a Market stands. `canTrade` / `tryTrade` still decide everything.
 */

export type StallRowKind = "give" | "get" | "stock";
export type StallRowTone = "calm" | "warn" | "danger" | "fog";

export interface StallAmount {
  res: string;
  /** Offer amount, as written in MARKET_OFFERS. */
  amt: string;
  /** Player stores of this resource right now (display number). */
  have: number;
  /** Give side only: stores fall short of this amount. */
  short?: boolean;
}

export interface StallStatusRow {
  kind: StallRowKind;
  label: string;
  amounts: StallAmount[];
  /** Short note after the amounts. */
  note: string;
  tone: StallRowTone;
  /** 0..1 bar fill. */
  fill?: number;
  /** Pip breathes (stall is open and the trade can run now). */
  live?: boolean;
}

export interface StallStatusInput {
  give: Record<string, string>;
  get: Record<string, string>;
  /** Raw `state.resources`; missing means no state yet. */
  resources?: Record<string, string | undefined>;
  /** At least one Market built. */
  hasMarket: boolean;
}

const STOCK_CAP = 999;
const PIP_KINDS: readonly string[] = ["food", "wood", "stone", "gold"];

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : n > 0 ? 1 : 0);

function haveOf(resources: StallStatusInput["resources"], res: string): number {
  const n = Number(resources?.[res] ?? "0");
  return Number.isNaN(n) ? 0 : n;
}

/** Compact store count for a narrow card: 950, 12.4K, 3.1M, 999M+. */
export function shortCount(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? "999M+" : "0";
  const v = Math.max(0, Math.floor(n));
  if (v < 1000) return String(v);
  if (v < 1_000_000) return `${(v / 1000).toFixed(v < 10_000 ? 1 : 0)}K`;
  if (v < 1_000_000_000) return `${(v / 1_000_000).toFixed(v < 10_000_000 ? 1 : 0)}M`;
  return "999M+";
}

export function stallStatusRows(input: StallStatusInput): StallStatusRow[] {
  const { give, get, resources, hasMarket } = input;
  const known = resources !== undefined;

  const giveAmts: StallAmount[] = Object.entries(give).map(([res, amt]) => {
    const have = haveOf(resources, res);
    return { res, amt, have, short: have < Number(amt) };
  });
  const getAmts: StallAmount[] = Object.entries(get).map(([res, amt]) => ({ res, amt, have: haveOf(resources, res) }));

  // How many times the stores cover the give side (display only).
  let runs = Infinity;
  for (const a of giveAmts) {
    const need = Number(a.amt);
    runs = Math.min(runs, need > 0 ? Math.floor(a.have / need) : Infinity);
  }
  if (!Number.isFinite(runs)) runs = giveAmts.length ? STOCK_CAP + 1 : 0;
  const anyShort = giveAmts.some((a) => a.short);
  const coverFill = giveAmts.length
    ? Math.min(...giveAmts.map((a) => clamp01(Number(a.amt) > 0 ? a.have / Number(a.amt) : 1)))
    : undefined;

  const open = known && hasMarket;
  const rows: StallStatusRow[] = [];

  rows.push({
    kind: "give",
    label: "Give",
    amounts: giveAmts,
    note: known ? `have ${giveAmts.map((a) => shortCount(a.have)).join(" / ")}` : "",
    tone: !open ? "fog" : anyShort ? "danger" : "calm",
    fill: known ? coverFill : undefined,
  });

  rows.push({
    kind: "get",
    label: "Get",
    amounts: getAmts,
    note: known ? `have ${getAmts.map((a) => shortCount(a.have)).join(" / ")}` : "",
    tone: open ? "calm" : "fog",
  });

  let stock: StallStatusRow;
  if (!known) {
    stock = { kind: "stock", label: "Stock", amounts: [], note: "—", tone: "fog" };
  } else if (!hasMarket) {
    stock = { kind: "stock", label: "Stock", amounts: [], note: "Build a Market", tone: "fog" };
  } else if (runs < 1) {
    stock = { kind: "stock", label: "Stock", amounts: [], note: "Short of stores", tone: "danger" };
  } else {
    stock = {
      kind: "stock",
      label: "Stock",
      amounts: [],
      note: runs > STOCK_CAP ? `x${STOCK_CAP}+ in hand` : `x${runs} in hand`,
      tone: runs === 1 ? "warn" : "calm",
      live: true,
    };
  }
  rows.push(stock);
  return rows;
}

export function StallStatus(props: { rows: StallStatusRow[] }) {
  if (props.rows.length === 0) return null;
  return (
    <span className="sc-stall-status">
      {props.rows.map((r) => (
        <span key={r.kind} className={`sc-stall-row is-${r.kind} tone-${r.tone}${r.live ? " is-live" : ""}`}>
          <span className="sc-stall-row-label">
            <span className="sc-stall-row-pip" aria-hidden="true" />
            {r.label}
          </span>
          <span className="sc-stall-row-value">
            {r.amounts.map((a) => (
              <span key={a.res} className={`sc-stall-amt${a.short ? " is-short" : ""}`}>
                {PIP_KINDS.includes(a.res) ? (
                  <ResourcePip resource={a.res as ResourceKind} className="sc-stall-res-pip" />
                ) : null}
                <span>
                  {r.kind === "get" ? "+" : ""}
                  {a.amt} {a.res}
                </span>
              </span>
            ))}
            {r.note ? <span className="sc-stall-row-note">{r.note}</span> : null}
          </span>
          {r.fill !== undefined ? (
            <span className="sc-stall-row-bar" aria-hidden="true">
              <span className="sc-stall-row-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
