import React from "react";
import { setMusicMuted, startMusicBed } from "./music";
import { useMusicMode } from "./MusicDock";

export function SpeedControls(props: {
  paused: boolean;
  speed: number;
  onPauseToggle: () => void;
  onSpeed: (n: number) => void;
}) {
  const muted = useMusicMode() === "off";
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      <button type="button" onClick={props.onPauseToggle}>
        {props.paused ? "Resume" : "Pause"}
      </button>
      {[1, 2, 3].map((sp) => (
        <button
          key={sp}
          type="button"
          onClick={() => props.onSpeed(sp)}
          style={{
            border: props.speed === sp && !props.paused ? "1px solid #58a6ff" : "1px solid #30363d",
            background: props.speed === sp && !props.paused ? "#1f6feb" : "#21262d",
            color: "#fff",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          {sp}x
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          startMusicBed();
          setMusicMuted(!muted);
        }}
      >
        {muted ? "Music off" : "Music on"}
      </button>
    </div>
  );
}

