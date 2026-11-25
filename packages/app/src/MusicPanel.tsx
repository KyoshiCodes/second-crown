import React from "react";
import {
  MUSIC_LIBRARY,
  playTrack,
  setMusicVolume,
  stepTrack,
  toggleMusic,
  useNowPlaying,
  type MusicSource,
  type MusicTrack,
} from "./nowPlaying";
import { TRAVIS_CREDIT } from "./travisMusic";
import "./music-panel.css";

const SECTIONS: readonly { source: MusicSource; label: string; note: string }[] = [
  { source: "travis", label: "Travis Brown", note: TRAVIS_CREDIT },
  { source: "realm", label: "Realm", note: "Synth score, changes with season and holiday" },
  { source: "lofi", label: "Lofi library", note: "HoliznaCC0 · CC0" },
];

function Eq() {
  return (
    <span className="music-panel__eq" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Top-bar music control: play / pause chip, plus a dropdown with every track and the volume. */
export function MusicPanel() {
  const np = useNowPlaying();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const volume = Math.round(np.volume * 100);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const row = (t: MusicTrack) => {
    const active = t.id === np.trackId;
    return (
      <li key={t.id}>
        <button
          type="button"
          className="music-panel__row"
          data-active={active ? "true" : "false"}
          aria-current={active ? "true" : undefined}
          title={`${t.title} · ${t.artist}`}
          onClick={() => (active && np.playing ? toggleMusic() : playTrack(t.id))}
        >
          <span className="music-panel__row-icon" aria-hidden="true">
            {active && np.playing ? <Eq /> : "▶"}
          </span>
          <span className="music-panel__row-title">{t.title}</span>
        </button>
      </li>
    );
  };

  return (
    <div
      ref={rootRef}
      className="music-panel"
      data-playing={np.playing ? "true" : "false"}
      data-source={np.source}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        className="music-panel__play"
        onClick={toggleMusic}
        aria-label={np.playing ? `Pause ${np.title}` : `Play ${np.title}`}
        title={np.playing ? "Pause" : "Play"}
      >
        {np.playing ? "❚❚" : "▶"}
      </button>
      <button
        type="button"
        className="music-panel__chip"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Choose music"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="music-panel__note" aria-hidden="true">
          {np.playing ? <Eq /> : "♪"}
        </span>
        <span className="music-panel__now">
          <span className="music-panel__title">{np.title}</span>
          <span className="music-panel__artist">{np.artist}</span>
        </span>
        <span className="music-panel__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="music-panel__menu" role="dialog" aria-label="Music">
          <div className="music-panel__head">
            <div className="music-panel__head-now">
              <span className="music-panel__kicker">{np.playing ? "Now playing" : "Paused"}</span>
              <strong>{np.title}</strong>
              <span>{np.artist}</span>
            </div>
            <div className="music-panel__transport">
              <button type="button" onClick={() => stepTrack(-1)} aria-label="Previous track" title="Previous">
                ⏮
              </button>
              <button
                type="button"
                className="music-panel__big"
                onClick={toggleMusic}
                aria-label={np.playing ? "Pause" : "Play"}
              >
                {np.playing ? "❚❚" : "▶"}
              </button>
              <button type="button" onClick={() => stepTrack(1)} aria-label="Next track" title="Next">
                ⏭
              </button>
            </div>
            <label className="music-panel__volume-row">
              <span>Volume</span>
              <input
                type="range"
                className="music-panel__volume"
                min={0}
                max={100}
                step={1}
                value={volume}
                aria-label="Music volume"
                onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              />
              <span className="music-panel__pct">{volume}%</span>
            </label>
            {np.error ? (
              <p className="music-panel__error" role="status">
                {np.error}
              </p>
            ) : null}
          </div>
          <div className="music-panel__list">
            {SECTIONS.map((sec) => (
              <section key={sec.source} className="music-panel__section" data-source={sec.source}>
                <header>
                  <span>{sec.label}</span>
                  <small>{sec.note}</small>
                </header>
                <ul>{MUSIC_LIBRARY.filter((t) => t.source === sec.source).map(row)}</ul>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
