/**
 * Game News: a short, hand-written list of player-facing updates.
 *
 * App only, no server. To post news, add an entry to the TOP of GAME_NEWS
 * (newest first). Keep `body` to 2-4 short lines. `kind` is "major" for a new
 * system or a big layout change, "minor" for polish.
 */

export type NewsKind = "major" | "minor";

export interface NewsEntry {
  /** Stable id, used as the React key. */
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  kind: NewsKind;
  title: string;
  /** 2-4 short lines; each string is one line. */
  body: string[];
}

export const GAME_NEWS: readonly NewsEntry[] = [
  {
    id: "2026-11-24-hud-micro-feedback",
    date: "2026-11-24",
    kind: "minor",
    title: "The stores strip comes alive",
    body: [
      "Resource cells now flash softly when income ticks up, a store fills, or one runs dry.",
      "Panel headers give a small sweep when you open or close them.",
      "The active tab carries a light sheen so you always know where you are.",
    ],
  },
  {
    id: "2026-11-24-hold-density",
    date: "2026-11-24",
    kind: "minor",
    title: "Tighter Hold view",
    body: [
      "The Hold view trims the chrome above the canvas, so your hold starts higher on screen.",
      "The Hold / Board toggle is now a two-part pill that names both modes and lights the live one.",
      "A green HOLD tag and faint rim mark the hold, matching BOARD FOCUS.",
    ],
  },
  {
    id: "2026-11-24-living-accents",
    date: "2026-11-24",
    kind: "minor",
    title: "Living board accents",
    body: [
      "Seen keeps glow with a quiet hearth, and the land stirs: fireflies in woods, glints on shores and ridges.",
      "The mood follows the time of day and the music you have playing.",
      "Selecting a province now gives a small settle ripple and a lifted edge.",
    ],
  },
  {
    id: "2026-11-24-board-presence",
    date: "2026-11-24",
    kind: "major",
    title: "A bigger board",
    body: [
      "On the Board view the map now grows to fill your screen (up to 1120 px wide on a 1080p display).",
      "A soft gold frame and a BOARD FOCUS tag mark it as the main surface.",
      "Panels below the board can no longer push it around.",
    ],
  },
  {
    id: "2026-11-24-ledger-fold",
    date: "2026-11-24",
    kind: "minor",
    title: "Ledger of Crowns folds away",
    body: [
      "The Ledger of Crowns on the Crown tab is now a foldable panel.",
      "Folded, it shows the entry count and the newest entry, so you can still glance at it.",
    ],
  },
  {
    id: "2026-11-24-layout-priority",
    date: "2026-11-24",
    kind: "major",
    title: "Board first: new layout",
    body: [
      "The board now sits right under the header, stores and tabs. Province details and the study tree moved below it.",
      "Secondary panels fold: click a title bar to open or close it. Your choice is remembered.",
      "New Compact button in the top bar folds every panel at once.",
    ],
  },
];

/** Newest first, stable for equal dates (keeps array order). */
export function sortedNews(list: readonly NewsEntry[] = GAME_NEWS): NewsEntry[] {
  return list
    .map((n, i) => ({ n, i }))
    .sort((a, b) => (a.n.date === b.n.date ? a.i - b.i : a.n.date < b.n.date ? 1 : -1))
    .map(({ n }) => n);
}

/** Folded title-bar summary: count plus the newest title, e.g. "6 updates · The stores strip comes alive". */
export function newsSummary(list: readonly NewsEntry[] = GAME_NEWS): string {
  if (list.length === 0) return "No news yet";
  const newest = sortedNews(list)[0];
  return `${list.length} update${list.length === 1 ? "" : "s"} · ${newest.title}`;
}

/** "Nov 24, 2026" from "2026-11-24", without timezone drift. */
export function formatNewsDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : iso;
}

/**
 * Placeholder for a future server-fetched news endpoint (e.g. "/api/news").
 * Deliberately null and unused for now: keep client news local until a server feed is added.
 */
export const NEWS_ENDPOINT_PLACEHOLDER: string | null = null;

/**
 * Active news feed accessor.
 * Currently returns local GAME_NEWS directly; swap in cached/fetched server entries
 * here once NEWS_ENDPOINT_PLACEHOLDER is wired up.
 */
export function getActiveNewsFeed(): readonly NewsEntry[] {
  return GAME_NEWS;
}
