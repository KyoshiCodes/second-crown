import React from "react";
import {
  garrisonAt,
  garrisonPower,
  getProvince,
  incomingOnHome,
  incomingOnPlayerFlags,
  incomingOnProvince,
  isProvinceSeen,
  keepLevel,
  listOutposts,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./banner-status.css";

/**
 * One-line status for the keep banner and for outpost flags, shown on the province
 * inspect card and on the Kingdom tab.
 *
 * Display only. Every value comes from existing sim readers (`incomingOnHome`,
 * `incomingOnProvince`, `incomingOnPlayerFlags`, `listOutposts`, `garrisonAt`,
 * `garrisonPower`, `keepLevel`). No new game math and no sim writes: the only work
 * here is choosing words and a tone for numbers the sim already has. Where banners
 * and flags are drawn on the board is untouched.
 */

export type BannerTone = "safe" | "warn" | "danger" | "calm";
export type BannerKind = "keep" | "flag" | "rival" | "flags";

export type BannerStatus = {
  kind: BannerKind;
  tone: BannerTone;
  /** What the line is about: "Keep banner", "Your flag", "Flags". */
  title: string;
  /** The headline word: "Flying", "Under threat", "Unguarded". */
  headline: string;
  /** Short facts after the headline, in reading order. */
  parts: string[];
  /** The whole line as plain text, for labels and tests. */
  text: string;
};

type NameOf = (realmId: string) => string;

function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

function secondsLeft(state: GameState, arrivesTick: number): number {
  return Math.max(0, Math.ceil((arrivesTick - state.meta.tick) / TICKS_PER_SECOND));
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function build(kind: BannerKind, tone: BannerTone, title: string, headline: string, parts: string[]): BannerStatus {
  return { kind, tone, title, headline, parts, text: [`${title}: ${headline}`, ...parts].join(" · ") };
}

/** How many of your flags have a rival host marching on them right now. */
function threatenedFlagCount(state: GameState): number {
  return new Set(incomingOnPlayerFlags(state).map((m) => m.toId)).size;
}

/**
 * Status of the banner over your keep: is a host marching on the hold, what level the
 * keep is, and how the flags planted from it are doing.
 */
export function keepBannerStatus(state: GameState, nameOf: NameOf = (id) => realmName(state, id)): BannerStatus {
  const hosts = incomingOnHome(state);
  const flags = listOutposts(state).length;
  const flagsHit = threatenedFlagCount(state);
  const keep = `Keep level ${keepLevel(state)}`;
  const flagPart =
    flags === 0
      ? "no flags planted"
      : flagsHit > 0
        ? `${plural(flags, "flag", "flags")} out, ${flagsHit} under threat`
        : `${plural(flags, "flag", "flags")} out, all quiet`;

  if (hosts.length > 0) {
    const first = hosts.reduce((a, b) => (b.arrivesTick < a.arrivesTick ? b : a));
    const who = `${nameOf(first.realmId)} arrives in ${secondsLeft(state, first.arrivesTick)}s`;
    const more = hosts.length > 1 ? [`${hosts.length} hosts marching on the keep`] : [];
    return build("keep", "danger", "Keep banner", "Under threat", [who, ...more, keep, flagPart]);
  }
  return build("keep", flagsHit > 0 ? "warn" : "safe", "Keep banner", "Flying", ["no host inbound", keep, flagPart]);
}

/**
 * Status of the flag on one tile. Your own flag says whether it is flying or under threat
 * and whether it is guarded. A rival flag names its realm. Returns null for your home,
 * for tiles hidden by fog, and for tiles with no flag (hostile camps are not flags).
 */
export function flagBannerStatus(
  state: GameState,
  provinceId: string,
  nameOf: NameOf = (id) => realmName(state, id),
): BannerStatus | null {
  if (provinceId === state.board.homeProvinceId) return null;
  const p = getProvince(state, provinceId);
  if (!p || !isProvinceSeen(state, provinceId)) return null;

  if (listOutposts(state).some((o) => o.id === provinceId)) {
    const posted = garrisonAt(state, provinceId);
    const troops = posted ? Object.values(posted.force).reduce((a, n) => a + (n > 0 ? n : 0), 0) : 0;
    const guard = posted
      ? `garrison power ${garrisonPower(state, provinceId)} (${plural(troops, "soldier", "soldiers")})`
      : "no garrison";
    const hit = incomingOnProvince(state, provinceId);
    if (hit) {
      const who = `${nameOf(hit.realmId)} arrives in ${secondsLeft(state, hit.arrivesTick)}s`;
      return build("flag", "danger", "Your flag", "Under threat", [who, guard]);
    }
    return posted
      ? build("flag", "safe", "Your flag", "Flying", ["no host inbound", guard])
      : build("flag", "warn", "Your flag", "Unguarded", ["no host inbound", "post a garrison to hold it"]);
  }

  const occ = p.occupantRealmId;
  if (occ && occ !== "player" && p.node !== "hold" && p.node !== "camp") {
    return build("rival", "calm", `${nameOf(occ)} flag`, "Rival outpost", ["not yours"]);
  }
  return null;
}

/** Roll-up of all your flags for the Kingdom tab's Flags heading. Null when none are planted. */
export function flagsSummaryStatus(state: GameState): BannerStatus | null {
  const flags = listOutposts(state);
  if (flags.length === 0) return null;
  const guarded = flags.filter((p) => Boolean(garrisonAt(state, p.id))).length;
  const bare = flags.length - guarded;
  const hit = threatenedFlagCount(state);
  const parts = [`${guarded} guarded`, `${bare} unguarded`];
  const headline = `${plural(flags.length, "flag", "flags")} planted`;
  if (hit > 0) return build("flags", "danger", "Flags", headline, [...parts, `${hit} under threat`]);
  return build("flags", bare > 0 ? "warn" : "safe", "Flags", headline, [...parts, "no host inbound"]);
}

/** Renders one status line. Renders nothing when there is no status. */
export function BannerStatusLine(props: { status: BannerStatus | null }) {
  const s = props.status;
  if (!s) return null;
  return (
    <div className={`sc-bannerline is-${s.kind} tone-${s.tone}`} title={s.text}>
      <span className="sc-bannerline-pip" aria-hidden="true" />
      <span className="sc-bannerline-title">{s.title}</span>
      <span className="sc-bannerline-headline">{s.headline}</span>
      {s.parts.map((part, i) => (
        <span key={i} className="sc-bannerline-part">
          {part}
        </span>
      ))}
    </div>
  );
}

/** Keep banner line: the home hold on the inspect card, and the Kingdom tab. */
export function KeepBannerLine(props: { state: GameState; nameOf?: NameOf }) {
  return <BannerStatusLine status={keepBannerStatus(props.state, props.nameOf)} />;
}

/** Outpost flag line for one tile on the inspect card. */
export function FlagBannerLine(props: { state: GameState; provinceId: string; nameOf?: NameOf }) {
  return <BannerStatusLine status={flagBannerStatus(props.state, props.provinceId, props.nameOf)} />;
}

/** Flags roll-up line under the Kingdom tab's Flags heading. */
export function FlagsSummaryLine(props: { state: GameState }) {
  return <BannerStatusLine status={flagsSummaryStatus(props.state)} />;
}
