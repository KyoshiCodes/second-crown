import React from "react";
import { getProvince, isProvinceSeen, type GameState } from "@second-crown/sim";
import { listBoardRoads } from "@second-crown/render";
import "./roads-line.css";

/**
 * Roads status for the selected province on the inspect card.
 * Display only: it filters the same list the diamond board draws (`listBoardRoads`),
 * so the card and the board can never disagree. No new board math, no sim writes.
 */

export type RoadLinkKind = "road" | "path" | "fog";

export type RoadLink = {
  /** The neighbouring province this line leads to. */
  toId: string;
  /** road = both seen; path = a seen peak is on one end; fog = the far end is unseen. */
  kind: RoadLinkKind;
  /** "Road", "Mountain path" or "Trail". */
  label: string;
  /** Where it leads, e.g. "Wood 4,5", "Your hold 3,3" or "fog 2,6". */
  target: string;
};

export type RoadsStatus =
  | { visible: false; links: []; summary: string }
  | { visible: true; links: RoadLink[]; summary: string };

const TERRAIN: Record<string, string> = {
  plain: "Plain",
  wood: "Wood",
  hill: "Hill",
  waste: "Waste",
  shore: "Shore",
  peak: "Peak",
};

const LABEL: Record<RoadLinkKind, string> = {
  road: "Road",
  path: "Mountain path",
  fog: "Trail",
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Roads and trails the board draws out of this province. Null when the id is unknown. */
export function roadsStatus(state: GameState, provinceId: string): RoadsStatus | null {
  const here = getProvince(state, provinceId);
  if (!here) return null;
  // The board draws nothing inside the fog, so an unseen tile has no roads to list.
  if (!isProvinceSeen(state, provinceId)) {
    return { visible: false, links: [], summary: "Hidden by fog" };
  }
  const links: RoadLink[] = [];
  for (const r of listBoardRoads(state)) {
    if (r.fromId !== provinceId && r.toId !== provinceId) continue;
    const otherId = r.fromId === provinceId ? r.toId : r.fromId;
    const other = getProvince(state, otherId);
    if (!other) continue;
    const kind: RoadLinkKind = r.intoFog ? "fog" : r.kind;
    // An unseen neighbour keeps its terrain secret: only its square is named.
    const place = r.intoFog
      ? "fog"
      : otherId === state.board.homeProvinceId
        ? "Your hold"
        : TERRAIN[other.terrain] ?? other.terrain;
    links.push({ toId: otherId, kind, label: LABEL[kind], target: `${place} ${other.x},${other.y}` });
  }
  const roads = links.filter((l) => l.kind === "road").length;
  const paths = links.filter((l) => l.kind === "path").length;
  const fog = links.filter((l) => l.kind === "fog").length;
  const parts: string[] = [];
  if (roads > 0) parts.push(plural(roads, "road", "roads"));
  if (paths > 0) parts.push(plural(paths, "mountain path", "mountain paths"));
  if (fog > 0) parts.push(plural(fog, "trail into fog", "trails into fog"));
  return { visible: true, links, summary: parts.length > 0 ? parts.join(" · ") : "None" };
}

/** Inspect-card block: a one-line roads status that opens to the list of connected roads. */
export function RoadsLine(props: { state: GameState | undefined; provinceId: string | null }) {
  const { state, provinceId } = props;
  if (!state || !provinceId) return null;
  const status = roadsStatus(state, provinceId);
  if (!status) return null;
  const head = (
    <>
      <span className="sc-roads-pip" aria-hidden="true" />
      <span className="sc-roads-label">Roads</span>
      <span className="sc-roads-summary">{status.summary}</span>
    </>
  );
  if (!status.visible || status.links.length === 0) {
    return (
      <div className={`sc-roads-line ${status.visible ? "is-none" : "is-fog"}`} data-roads-visible={status.visible}>
        <div className="sc-roads-head">{head}</div>
      </div>
    );
  }
  return (
    <details className="sc-roads-line is-shown" data-roads-visible="true" open>
      <summary className="sc-roads-head" title="Show or hide the list of connected roads">
        {head}
      </summary>
      <ul className="sc-roads-list">
        {status.links.map((l) => (
          <li key={l.toId} className={`sc-roads-item is-${l.kind}`}>
            <span className="sc-roads-mark" aria-hidden="true" />
            <span className="sc-roads-kind">{l.label}</span>
            <span className="sc-roads-target">to {l.target}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
