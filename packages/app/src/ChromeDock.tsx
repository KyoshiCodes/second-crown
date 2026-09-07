import React from "react";
import { TesterBar } from "./TesterBar";
import { CloudPanel } from "./CloudPanel";
import { BoardPanel } from "./BoardPanel";
import { getHolidayOverride, setHolidayOverride } from "./seasons/holidays";

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

  React.useEffect(() => {
    const onBand = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail === "hold" || detail === "board") {
        setBand(detail);
      }
    };
    window.addEventListener("sc-camera-band-change", onBand);
    return () => window.removeEventListener("sc-camera-band-change", onBand);
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
        background: open ? "rgba(10, 8, 6, 0.96)" : "rgba(10, 8, 6, 0.72)",
        borderBottom: "1px solid #3a3228",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
          padding: "6px 12px",
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
            background: band === "board" ? "#3b2a1a" : "#1a2a1a",
            color: "#fef08a",
            border: "1px solid #d4a72c",
            borderRadius: 4,
            padding: "3px 10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {band === "board" ? "🗺️ Board (Switch to Hold 🏰)" : "🏰 Hold (Switch to Board 🗺️)"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Holiday
          <select
            value={holiday}
            onChange={(e) => {
              const next = e.target.value;
              setHoliday(next);
              setHolidayOverride(next);
            }}
            style={{
              background: "#1a1410",
              color: "#fef08a",
              border: "1px solid #d4a72c",
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
