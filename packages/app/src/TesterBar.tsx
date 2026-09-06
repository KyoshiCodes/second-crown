import React from "react";
import { getHolidayOverride, setHolidayOverride } from "./seasons/holidays";

const KEY = "sc-tester-name";

export function getTesterName(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function TesterBar() {
  const [name, setName] = React.useState(getTesterName);
  const [holidayPreview, setHolidayPreview] = React.useState(getHolidayOverride);

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto 8px",
        fontSize: 13,
        opacity: 0.9,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span>Playtester name</span>
        <input
          value={name}
          placeholder="your Discord name"
          onChange={(e) => {
            setName(e.target.value);
            try {
              localStorage.setItem(KEY, e.target.value);
            } catch {
              /* ignore */
            }
          }}
          style={{
            background: "#1a1410",
            color: "#e8dcc8",
            border: "1px solid #3a3228",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span title="Preview seasonal holiday atmospheres (Halloween, Midwinter, Easter, etc.)">Holiday overlay:</span>
        <select
          value={holidayPreview}
          onChange={(e) => {
            const next = e.target.value;
            setHolidayPreview(next);
            setHolidayOverride(next);
          }}
          style={{
            background: "#1a1410",
            color: "#fef08a",
            border: "1px solid #d4a72c",
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <option value="auto">📅 Auto (Calendar Date)</option>
          <option value="halloween">🎃 All Hallows (Halloween)</option>
          <option value="midwinter">❄️ Midwinter (Christmas-tide)</option>
          <option value="easter">🪺 Dawn Feast (Easter-tide)</option>
          <option value="harvest">🌕 Harvest Moon</option>
          <option value="midsummer">☀️ Midsummer Solstice</option>
          <option value="none">🚫 None / Off</option>
        </select>
      </div>
    </div>
  );
}

