import React from "react";
import { getMusicMode, MUSIC_CHANGE_EVENT, type MusicMode } from "./music";

/** Mirrors music.ts mode (off / lofi / bed). The top-bar picker itself is MusicPanel.tsx. */
export function useMusicMode(): MusicMode {
  const [mode, setMode] = React.useState<MusicMode>(getMusicMode);
  React.useEffect(() => {
    const onChange = () => setMode(getMusicMode());
    window.addEventListener(MUSIC_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(MUSIC_CHANGE_EVENT, onChange);
  }, []);
  return mode;
}
