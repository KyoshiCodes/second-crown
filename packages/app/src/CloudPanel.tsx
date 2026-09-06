import React from "react";
import {
  absorbHashSession,
  cloudName,
  cloudToken,
  cloudUrl,
  createGuest,
  discordLoginUrl,
  health,
  pullSave,
  pushSave,
  setCloudUrl,
} from "./net/cloud";
import { loadFromIndexedDb, saveToIndexedDb } from "./save/indexedDb";
import { getTesterName } from "./TesterBar";

export function CloudPanel() {
  const [url, setUrl] = React.useState(cloudUrl);
  const [status, setStatus] = React.useState("");
  const [discord, setDiscord] = React.useState(false);
  const [name, setName] = React.useState(cloudName);

  React.useEffect(() => {
    absorbHashSession();
    setName(cloudName());
    health()
      .then((h) => {
        setDiscord(h.discord);
        setStatus(h.ok ? "Cloud reachable." : "Cloud down.");
      })
      .catch(() => setStatus("Cloud unreachable — start the server or set the URL."));
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "8px auto 0", padding: "10px 12px", background: "#16100c", borderRadius: 8 }}>
      <strong>Cloud playtest</strong>
      <div style={{ fontSize: 12, opacity: 0.75, margin: "4px 0 8px" }}>
        Guest codes work now. Discord login works after the server has Discord keys.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setCloudUrl(url)}
          placeholder="https://your-cloud.onrender.com"
          style={{ minWidth: 220, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }}
        />
        <button
          type="button"
          onClick={async () => {
            try {
              const g = await createGuest(getTesterName() || "Guest");
              setName(g.name);
              setStatus(`Guest session ${g.id}`);
            } catch {
              setStatus("Could not create guest. Is the server running?");
            }
          }}
        >
          Guest session
        </button>
        <button
          type="button"
          disabled={!discord}
          onClick={() => {
            setCloudUrl(url);
            window.location.href = discordLoginUrl();
          }}
        >
          Log in with Discord
        </button>
        <button
          type="button"
          disabled={!cloudToken()}
          onClick={async () => {
            const raw = await loadFromIndexedDb();
            if (!raw) {
              setStatus("No local save to push.");
              return;
            }
            try {
              await pushSave(raw);
              setStatus("Pushed local save to cloud.");
            } catch {
              setStatus("Push failed.");
            }
          }}
        >
          Push save
        </button>
        <button
          type="button"
          disabled={!cloudToken()}
          onClick={async () => {
            try {
              const raw = await pullSave();
              await saveToIndexedDb(raw);
              setStatus("Pulled cloud save. Reload the page to play it.");
            } catch {
              setStatus("No cloud save yet.");
            }
          }}
        >
          Pull save
        </button>
      </div>
      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>
        {name ? `Signed in as ${name}. ` : "Not signed in. "}
        {status}
      </div>
    </div>
  );
}
