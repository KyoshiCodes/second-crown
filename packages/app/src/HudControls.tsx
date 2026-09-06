import React from "react";

export function SpeedControls(props: {
  paused: boolean;
  speed: number;
  onPauseToggle: () => void;
  onSpeed: (n: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <button type="button" onClick={props.onPauseToggle}>
        {props.paused ? "Resume" : "Pause"}
      </button>
      {[1, 2].map((sp) => (
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
        {props.rivalOp >= 20 ? " · they will not declare while friendly" : ""}
        {props.rivalOp <= -40 ? " · hostile: they attack more readily" : ""}
      </p>
      <button
        type="button"
        onClick={props.onGift}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #30363d",
          background: "#238636",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Gift 15 gold (+12 opinion)
      </button>
    </div>
  );
}
