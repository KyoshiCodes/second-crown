import React from "react";
import { cloudToken, fetchBoard, saveProfile, type BoardRow } from "./net/cloud";

export function BoardPanel() {
  const [rows, setRows] = React.useState<BoardRow[]>([]);
  const [motto, setMotto] = React.useState("");
  const [crest, setCrest] = React.useState("sun");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    fetchBoard()
      .then((b) => setRows(b.board || []))
      .catch(() => setNote("Board unavailable."));
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "8px auto", padding: "10px 12px", background: "#121820", borderRadius: 8 }}>
      <strong>Profiles & board</strong>
      <p style={{ fontSize: 12, opacity: 0.75 }}>Honor-system ranks from the last pushed save. Sign in and push to appear.</p>
      {cloudToken() ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <input value={motto} onChange={(e) => setMotto(e.target.value)} maxLength={80} placeholder="Motto" style={{ minWidth: 200, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }} />
          <select value={crest} onChange={(e) => setCrest(e.target.value)} style={{ background: "#1a1410", color: "#e8dcc8" }}>
            {"sun keep ship stag eye helm".split(" ").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="button" onClick={async () => {
            try {
              await saveProfile({ motto, crest });
              setNote("Profile saved.");
              const b = await fetchBoard();
              setRows(b.board || []);
            } catch { setNote("Could not save profile."); }
          }}>Save profile</button>
        </div>
      ) : null}
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.7 }}>
            <th>#</th><th>Ruler</th><th>Crest</th><th>Prestige</th><th>Wins</th><th>Tick</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r.name}{r.motto ? ` — ${r.motto}` : ""}</td>
              <td>{r.crest}</td>
              <td>{r.prestige}</td>
              <td>{r.wins}</td>
              <td>{r.tick}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={6}>No pushed saves yet.</td></tr> : null}
        </tbody>
      </table>
      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{note}</div>
    </div>
  );
}
