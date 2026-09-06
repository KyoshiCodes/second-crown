import React from "react";
import { isMusicMuted, setMusicMuted, startMusicBed } from "./music";

export function SpeedControls(props: {
  paused: boolean;
  speed: number;
  onPauseToggle: () => void;
  onSpeed: (n: number) => void;
}) {
  const [muted, setMuted] = React.useState(isMusicMuted);
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
          if (muted) {
            setMusicMuted(false);
            setMuted(false);
          } else {
            setMusicMuted(true);
            setMuted(true);
          }
        }}
      >
        {muted ? "Music off" : "Music on"}
      </button>
    </div>
  );
}

export function DiplomacyPanel(props: {
  rivalOp: number;
  playerOp: number;
  onGift: () => void;
}) {
  return (
    <div style={{ margin: "8px 0 12px" }}>
      <p style={{ fontSize: 13, margin: "0 0 6px" }}>
        Varric's opinion of you: <strong>{props.rivalOp}</strong>
        {" "}· your opinion of him: {props.playerOp}
      </p>
      <button type="button" onClick={props.onGift}>Gift 15 gold (+12 opinion)</button>
    </div>
  );
}
