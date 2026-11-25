import React from "react";
import { TesterBar } from "./TesterBar";
import { CloudPanel } from "./CloudPanel";
import { BoardPanel } from "./BoardPanel";
import { ThemeDock } from "./ThemeDock";
import { MusicPanel } from "./MusicPanel";
import { getHolidayOverride, setHolidayOverride } from "./seasons/holidays";
import "./hud/plain-buttons.css";
import { setCompact, useCompact } from "./hud/Fold";

const KEY = "sc-chrome-open";

export function ChromeDock() {
  const [open, setOpen] = React.useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  const [holiday, setHoliday] = React.useState(getHolidayOverride);
  const [band, setBand] = React.useState<"hold" | "board">("hold");
  const [lastWorld, setLastWorld] = React.useState<string>("");
  const compact = useCompact();

  React.useEffect(() => {
    const onBand = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail === "hold" || detail === "board") {
        setBand(detail);
      }
    };
    const onWorldDispatch = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && typeof detail.text === "string") {
        setLastWorld(detail.text);
      }
    };
    window.addEventListener("sc-camera-band-change", onBand);
    window.addEventListener("sc-world-dispatch", onWorldDispatch);
    return () => {
      window.removeEventListener("sc-camera-band-change", onBand);
      window.removeEventListener("sc-world-dispatch", onWorldDispatch);
    };
  }, []);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function toggleBand() {
    window.dispatchEvent(new CustomEvent("sc-toggle-camera-band"));
  }

  return (
    <div
      className="sc-chrome"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 120,
        background: open ? "var(--chrome-bar-bg-open)" : "var(--chrome-bar-bg)",
        borderBottom: "1px solid var(--chrome-bar-border)",
      }}
    >
      <div
        className="sc-chrome-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flexWrap: "wrap",
          padding: "4px 10px",
          fontSize: 13,
        }}
      >
        <button type="button" onClick={toggle}>
          {open ? "Hide tools" : "Show tools"}
        </button>
        <button
          type="button"
          onClick={toggleBand}
          title="Toggle camera zoom band between Hold (close-up isometric) and Board (tabletop map)"
          style={{
            color: "var(--chrome-accent)",
            fontWeight: 600,
          }}
        >
          {band === "board" ? "🗺️ Board → 🏰" : "🏰 Hold → 🗺️"}
        </button>
        <button
          type="button"
          className="sc-compact-toggle"
          aria-pressed={compact}
          onClick={() => setCompact(!compact)}
          title="Compact: fold every side panel and tighten spacing so the board gets the room. Click again to unfold."
        >
          {compact ? "Compact on" : "Compact"}
        </button>
        <label className="sc-work-card sc-plain-card sc-plain-inline sc-plain-chip">
          Holiday
          <select
            value={holiday}
            onChange={(e) => {
              const next = e.target.value;
              setHoliday(next);
              setHolidayOverride(next);
            }}
            style={{
              background: "var(--chrome-btn-bg)",
              color: "var(--chrome-btn-text)",
              border: "1px solid var(--chrome-btn-border)",
              borderRadius: 4,
              padding: "3px 8px",
            }}
          >
            <option value="auto">Auto</option>
            <option value="halloween">All Hallows</option>
            <option value="midwinter">Midwinter</option>
            <option value="easter">Dawn Feast</option>
            <option value="harvest">Harvest Moon</option>
            <option value="midsummer">Midsummer</option>
            <option value="none">Off</option>
          </select>
        </label>
        <MusicPanel />
        <ThemeDock />
        {lastWorld ? (
          <div
            title={`Latest World Dispatch: ${lastWorld}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(30, 24, 18, 0.9)",
              border: "1px solid #78531e",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: 12,
              color: "#fef08a",
              maxWidth: 380,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 13 }} aria-hidden="true">📜</span>
            <span style={{ color: "#d4a72c", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>World:</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {lastWorld}
            </span>
          </div>
        ) : null}
      </div>
      {open ? (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 12px 8px" }}>
          <TesterBar />
          <CloudPanel />
          <BoardPanel />
        </div>
      ) : null}
    </div>
  );
}
