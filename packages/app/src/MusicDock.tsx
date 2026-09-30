import React from "react";
import {
  getLofiIndex,
  getLofiStatus,
  getMusicMode,
  lofiTrackName,
  nextLofiTrack,
  playLofiTrack,
  prevLofiTrack,
  setMusicMode,
  startMusicBed,
  LOFI_TRACKS,
  LOFI_STATUS_EVENT,
  LOFI_TRACK_EVENT,
  MUSIC_CHANGE_EVENT,
  type LofiStatus,
  type MusicMode,
} from "./music";
import "./lofi-dock.css";

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

function useLofiIndex(): number {
  const [index, setIndex] = React.useState<number>(getLofiIndex);
  React.useEffect(() => {
    const onTrack = () => setIndex(getLofiIndex());
    window.addEventListener(LOFI_TRACK_EVENT, onTrack);
    return () => window.removeEventListener(LOFI_TRACK_EVENT, onTrack);
  }, []);
  return index;
}

function useLofiStatus(): LofiStatus {
  const [status, setStatus] = React.useState<LofiStatus>(getLofiStatus);
  React.useEffect(() => {
    const onStatus = () => setStatus(getLofiStatus());
    window.addEventListener(LOFI_STATUS_EVENT, onStatus);
    return () => window.removeEventListener(LOFI_STATUS_EVENT, onStatus);
  }, []);
  return status;
}

const STATUS_TEXT: Partial<Record<LofiStatus, string>> = {
  blocked: "Autoplay blocked. Click to play.",
  missing: "Track not found. Pick another.",
};

/** Now playing, prev / next, and a pick-any-track list. Lofi mode only. */
function LofiDock() {
  const index = useLofiIndex();
  const status = useLofiStatus();
  const statusText = STATUS_TEXT[status];
  const pick = (go: () => void) => {
    startMusicBed();
    go();
  };
  return (
    <div className="lofi-dock">
      <button
        type="button"
        className="lofi-dock__btn"
        title="Previous track"
        onClick={() => pick(prevLofiTrack)}
      >
        ‹
      </button>
      <select
        className="lofi-dock__list"
        value={index}
        title={`Now playing: ${lofiTrackName(index)}`}
        aria-label="Lofi track"
        onChange={(e) => pick(() => playLofiTrack(Number(e.target.value)))}
      >
        {LOFI_TRACKS.map((_, i) => (
          <option key={i} value={i}>
            {i + 1}. {lofiTrackName(i)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="lofi-dock__btn"
        title="Next track"
        onClick={() => pick(nextLofiTrack)}
      >
        ›
      </button>
      {statusText ? (
        <span className="lofi-dock__status" role="status">
          {statusText}
        </span>
      ) : (
        <span className="lofi-dock__now" title={lofiTrackName(index)}>
          Now playing: {lofiTrackName(index)}
        </span>
      )}
    </div>
  );
}

export function MusicDock() {
  const mode = useMusicMode();
  return (
    <>
      <label
        style={{ display: "flex", alignItems: "center", gap: 6 }}
        title="Realm = seasonal / holiday score"
      >
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
      {mode === "lofi" ? <LofiDock /> : null}
    </>
  );
}
