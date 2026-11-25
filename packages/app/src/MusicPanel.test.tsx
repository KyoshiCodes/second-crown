import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MusicPanel } from "./MusicPanel";
import {
  parseTrackIndex,
  parseVolume,
  TRAVIS_CREDIT,
  TRAVIS_DEFAULT_VOLUME,
  TRAVIS_TRACKS,
} from "./travisMusic";
import {
  DEFAULT_TRACK_ID,
  findTrack,
  getNowPlaying,
  MUSIC_LIBRARY,
  NOW_PLAYING_EVENT,
  parseLastTrackId,
} from "./nowPlaying";
import { LOFI_TRACKS } from "./music";

function readFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
        existsSync: (path: URL) => boolean;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function fileExists(relativePath: string): boolean {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { existsSync: (path: URL) => boolean } };
  }).process;
  return proc!.getBuiltinModule!("node:fs").existsSync(new URL(relativePath, import.meta.url));
}

describe("MusicPanel", () => {
  it("renders a closed chip: play button, current track title and artist", () => {
    const html = renderToStaticMarkup(<MusicPanel />);
    expect(html).toContain('data-playing="false"');
    expect(html).toContain('data-open="false"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("All We Know");
    expect(html).toContain("Travis Brown");
    expect(TRAVIS_CREDIT).toBe("Music by Travis Brown");
  });

  it("points Travis Brown at the two files in public/audio", () => {
    expect(TRAVIS_TRACKS.map((t) => decodeURIComponent(t.src))).toEqual([
      "/audio/01 All We Know.ogg",
      "/audio/01 Holding On.ogg",
    ]);
  });

  it("every recorded track in the library exists on disk", () => {
    for (const t of MUSIC_LIBRARY) {
      if (!t.src) continue;
      expect(fileExists(`../public${decodeURIComponent(t.src)}`), t.src).toBe(true);
    }
  });

  it("library lists Travis, the Realm score, then every lofi track, with unique ids", () => {
    expect(MUSIC_LIBRARY.slice(0, 3).map((t) => t.id)).toEqual(["travis-0", "travis-1", "realm"]);
    expect(MUSIC_LIBRARY.filter((t) => t.source === "lofi")).toHaveLength(LOFI_TRACKS.length);
    expect(new Set(MUSIC_LIBRARY.map((t) => t.id)).size).toBe(MUSIC_LIBRARY.length);
    expect(findTrack("lofi-0")?.title).toBe("Something In the Air");
  });

  it("restores the last chosen track id and falls back when unknown", () => {
    expect(parseLastTrackId("lofi-3")).toBe("lofi-3");
    expect(parseLastTrackId("realm")).toBe("realm");
    expect(parseLastTrackId("lofi-999")).toBe(DEFAULT_TRACK_ID);
    expect(parseLastTrackId(null)).toBe(DEFAULT_TRACK_ID);
  });

  it("now-playing snapshot is silent by default and exposes the hook names", () => {
    expect(getNowPlaying()).toEqual({
      trackId: "travis-0",
      title: "All We Know",
      artist: "Travis Brown",
      source: "travis",
      playing: false,
    });
    expect(NOW_PLAYING_EVENT).toBe("sc-now-playing");
    const src = readFile("./nowPlaying.ts");
    expect(src).toContain("ds.musicPlaying");
    expect(src).toContain("ds.musicTrackId");
    expect(src).toContain("ds.musicSource");
  });

  it("restores a saved Travis track index and falls back to 0 when invalid", () => {
    expect(parseTrackIndex("1")).toBe(1);
    expect(parseTrackIndex(null)).toBe(0);
    expect(parseTrackIndex("7")).toBe(0);
    expect(parseTrackIndex("-1")).toBe(0);
    expect(parseTrackIndex("abc")).toBe(0);
  });

  it("restores a saved volume, clamped to 0..1", () => {
    expect(parseVolume("0.25")).toBe(0.25);
    expect(parseVolume("0")).toBe(0);
    expect(parseVolume("3")).toBe(1);
    expect(parseVolume("-1")).toBe(0);
    expect(parseVolume(null)).toBe(TRAVIS_DEFAULT_VOLUME);
    expect(parseVolume("nope")).toBe(TRAVIS_DEFAULT_VOLUME);
  });

  it("keeps its styles in music-panel.css only, and is mounted in the top bar", () => {
    const tsx = readFile("./MusicPanel.tsx");
    expect(tsx).toContain('import "./music-panel.css"');
    expect(tsx).not.toMatch(/style=\{/);
    expect(readFile("./music-panel.css")).toContain(".music-panel__row[data-active=\"true\"]");
    expect(readFile("./theme.css")).not.toContain("music-panel");
    expect(readFile("./ChromeDock.tsx")).toContain("<MusicPanel />");
    expect(readFile("./main.tsx")).toContain("installNowPlaying()");
  });
});
