import React from "react";
import { getMusicMode, setMusicMode, startMusicBed, MUSIC_CHANGE_EVENT, type MusicMode } from "./music";

const LABELS: Record<MusicMode, string> = {
  off: "Off",
  lofi: "Lofi",
  bed: "Realm",
};

/** Mirrors music.ts mode across every control that shows it. */
export function useMusicMode(): MusicMode {
  const [mode, setMode] = React.useState<MusicMode>(getMusicMode);
  React.useEffect(() => {
    const onChange = () => setMode(getMusicMode());
    window.addEventListener(MUSIC_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(MUSIC_CHANGE_EVENT, onChange);
  }, []);
  return mode;
}

export function MusicDock() {
  const mode = useMusicMode();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6 }} title="Realm = seasonal / holiday score">
      Music
      <select
        value={mode}
        onChange={(e) => {
          startMusicBed();
          setMusicMode(e.target.value as MusicMode);
        }}
        style={{
          background: "var(--chrome-btn-bg)",
          color: "var(--chrome-btn-text)",
          border: "1px solid var(--chrome-btn-border)",
          borderRadius: 4,
          padding: "3px 8px",
        }}
      >
        {(Object.keys(LABELS) as MusicMode[]).map((m) => (
          <option key={m} value={m}>
            {LABELS[m]}
          </option>
        ))}
      </select>
    </label>
  );
}
