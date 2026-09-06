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
      className="sc-tester-bar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        background: "rgba(12, 10, 8, 0.94)",
        borderBottom: "1px solid #3a3228",
        padding: "8px 16px",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
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
        <span>Holiday overlay</span>
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
            padding: "4px 8px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <option value="auto">Auto (calendar)</option>
          <option value="halloween">All Hallows (Halloween)</option>
          <option value="midwinter">Midwinter (Christmas-tide)</option>
          <option value="easter">Dawn Feast (Easter-tide)</option>
          <option value="harvest">Harvest Moon</option>
          <option value="midsummer">Midsummer Solstice</option>
          <option value="none">None / off</option>
        </select>
      </div>
    </div>
  );
}
