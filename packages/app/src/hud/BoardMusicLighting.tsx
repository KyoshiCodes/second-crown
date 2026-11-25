import { currentSeason, type GameState } from "@second-crown/sim";
import { useNowPlaying, type MusicSource, type NowPlaying } from "../nowPlaying";
import { normalizeBoardSeason, type BoardSeasonKey } from "./BoardSeasonWash";
import "./board-music-lighting.css";

export interface BoardMusicLightingDescriptor {
  playing: boolean;
  source: MusicSource;
  season: BoardSeasonKey;
  label: string;
  topColor: string;
  bottomColor: string;
  haloColor: string;
  ambientOpacity: number;
  haloOpacity: number;
  pulseSeconds: number;
}

export interface BoardMusicLightingProps {
  state: GameState;
  nowPlayingOverride?: Pick<NowPlaying, "source" | "playing"> & Partial<Pick<NowPlaying, "trackId" | "title">>;
}

const REALM_SEASON_LIGHTING: Record<
  BoardSeasonKey,
  Omit<BoardMusicLightingDescriptor, "playing" | "source" | "season">
> = {
  spring: {
    label: "Realm Spring Vernal Ambient",
    topColor: "#bbf7d0",
    bottomColor: "#22c55e",
    haloColor: "#4ade80",
    ambientOpacity: 0.18,
    haloOpacity: 0.11,
    pulseSeconds: 6.6,
  },
  summer: {
    label: "Realm Summer Sunlit Ambient",
    topColor: "#fef08a",
    bottomColor: "#f59e0b",
    haloColor: "#fde047",
    ambientOpacity: 0.2,
    haloOpacity: 0.13,
    pulseSeconds: 6.2,
  },
  autumn: {
    label: "Realm Autumn Harvest Ambient",
    topColor: "#fdba74",
    bottomColor: "#d97706",
    haloColor: "#f59e0b",
    ambientOpacity: 0.2,
    haloOpacity: 0.13,
    pulseSeconds: 6.8,
  },
  winter: {
    label: "Realm Winter Frost Ambient",
    topColor: "#e0f2fe",
    bottomColor: "#38bdf8",
    haloColor: "#7dd3fc",
    ambientOpacity: 0.2,
    haloOpacity: 0.13,
    pulseSeconds: 7.2,
  },
};

/** Safely reads current season string for partial or test game states. */
export function readBoardMusicSeason(state?: GameState | null): BoardSeasonKey {
  if (!state?.meta || typeof state.meta.tick !== "number") {
    return "spring";
  }
  try {
    return normalizeBoardSeason(currentSeason(state));
  } catch {
    return "spring";
  }
}

/**
 * Resolves source-based board lighting:
 * - travis -> warmer gold ambient
 * - lofi -> cooler dusk ambient
 * - realm -> follows current season palette
 */
export function resolveBoardMusicLighting(
  nowPlaying: Pick<NowPlaying, "source" | "playing">,
  seasonRaw: string,
): BoardMusicLightingDescriptor {
  const season = normalizeBoardSeason(seasonRaw);
  const playing = Boolean(nowPlaying.playing);
  const source: MusicSource = nowPlaying.source;

  let base: Omit<BoardMusicLightingDescriptor, "playing" | "source" | "season">;
  if (source === "travis") {
    base = {
      label: "Travis Warm Gold Ambient",
      topColor: "#fde68a",
      bottomColor: "#f59e0b",
      haloColor: "#fbbf24",
      ambientOpacity: 0.22,
      haloOpacity: 0.14,
      pulseSeconds: 5.8,
    };
  } else if (source === "lofi") {
    base = {
      label: "Lofi Cool Dusk Ambient",
      topColor: "#a5b4fc",
      bottomColor: "#4f6d9a",
      haloColor: "#818cf8",
      ambientOpacity: 0.2,
      haloOpacity: 0.12,
      pulseSeconds: 7.4,
    };
  } else {
    base = REALM_SEASON_LIGHTING[season];
  }

  return {
    playing,
    source,
    season,
    label: base.label,
    topColor: base.topColor,
    bottomColor: base.bottomColor,
    haloColor: base.haloColor,
    ambientOpacity: playing ? base.ambientOpacity : 0,
    haloOpacity: playing ? base.haloOpacity : 0,
    pulseSeconds: base.pulseSeconds,
  };
}

/**
 * Subtle decorative SVG board lighting overlay reacting to active music source and playing state.
 * Uses pointer-events: none and never covers UI controls.
 */
export function BoardMusicLighting({ state, nowPlayingOverride }: BoardMusicLightingProps) {
  const liveNp = useNowPlaying();
  const np = nowPlayingOverride ?? liveNp;
  const desc = resolveBoardMusicLighting(np, readBoardMusicSeason(state));
  const gradId = `sc-board-music-ambient-${desc.source}-${desc.season}`;

  return (
    <g
      className={`sc-board-music-lighting ${desc.playing ? "is-playing" : "is-idle"} source-${desc.source} season-${desc.season}`}
      data-music-playing={desc.playing ? "true" : "false"}
      data-music-source={desc.source}
      data-music-season={desc.season}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="22%" r="72%">
          <stop offset="0%" stopColor={desc.topColor} stopOpacity={desc.ambientOpacity} />
          <stop offset="56%" stopColor={desc.bottomColor} stopOpacity={desc.ambientOpacity * 0.48} />
          <stop offset="100%" stopColor={desc.bottomColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect
        x={0}
        y={0}
        width={560}
        height={360}
        fill={`url(#${gradId})`}
        className="sc-board-music-ambient"
      />
      <ellipse
        cx={280}
        cy={176}
        rx={235}
        ry={138}
        fill="none"
        stroke={desc.haloColor}
        strokeWidth={1.6}
        strokeOpacity={desc.haloOpacity}
        className="sc-board-music-halo"
      />
    </g>
  );
}
